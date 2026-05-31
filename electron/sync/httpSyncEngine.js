'use strict';
const https = require('https');
const http = require('http');
const mongoose = require('mongoose');
const { SYNC_MODELS } = require('./modelRegistry');

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function httpRequest(url, method, token, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === 'https:' ? https : http;
    const payload = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
      timeout: 30000,
    };
    const req = mod.request(opts, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try { resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ ok: false, status: res.statusCode, data: {} }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('request timeout')); });
    if (payload) req.write(payload);
    req.end();
  });
}

class HttpSyncEngine {
  constructor({ localUri, getCloudUrl, getToken, getCloudInstituteUuid, onStatus, store }) {
    this.localUri = localUri;
    this.getCloudUrl = getCloudUrl;
    this.getToken = getToken;
    this.getCloudInstituteUuid = getCloudInstituteUuid;
    this.onStatus = onStatus || (() => {});
    this.store = store;
    this.localConn = null;
    this.timer = null;
    this.running = false;
  }

  async start() {
    try {
      this.localConn = await mongoose.createConnection(this.localUri).asPromise();
      console.log('[http-sync] connected to local DB');
      await this.runCycle();
      this.timer = setInterval(() => this.runCycle(), SYNC_INTERVAL_MS);
    } catch (err) {
      console.error('[http-sync] failed to start:', err.message);
      this._emit({ state: 'error', message: err.message });
    }
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
    this.localConn?.close();
    this.localConn = null;
  }

  async runCycle() {
    if (this.running) return { ok: false, message: 'Already running' };

    const token = this.getToken();
    const cloudUrl = this.getCloudUrl();
    const cloudInstituteUuid = this.getCloudInstituteUuid();

    if (!token || !cloudUrl || !cloudInstituteUuid) {
      return { ok: false, message: 'Cloud account not connected' };
    }

    this.running = true;
    this._emit({ state: 'syncing', message: 'Sync in progress…' });

    const cycleStart = new Date();
    const sinceKey = 'lastHttpSyncAt';
    const since = this.store.get(sinceKey, new Date(0).toISOString());

    let pushed = 0, pulled = 0, errors = 0;
    const localInstituteUuid = await this._getLocalInstituteUuid();

    // ── PULL: cloud → local ──────────────────────────────────────────────────
    try {
      const pullRes = await httpRequest(
        `${cloudUrl}/api/sync/pull?since=${encodeURIComponent(since)}`,
        'GET', token, null,
      );

      if (pullRes.ok && pullRes.data?.models) {
        for (const model of SYNC_MODELS) {
          const docs = pullRes.data.models[model.collection];
          if (!Array.isArray(docs) || !docs.length) continue;

          for (const doc of docs) {
            try {
              // Map cloud institute_uuid → local institute_uuid
              if (localInstituteUuid && doc.institute_uuid === cloudInstituteUuid) {
                doc.institute_uuid = localInstituteUuid;
              }

              const uuidVal = doc[model.uuidField];
              if (!uuidVal) continue;

              const { _id, ...rest } = doc;
              const existing = await this.localConn.collection(model.collection)
                .findOne({ [model.uuidField]: uuidVal });

              const docUpdated = new Date(doc.updatedAt || 0);
              const existingUpdated = existing?.updatedAt ? new Date(existing.updatedAt) : new Date(0);

              if (!existing || docUpdated > existingUpdated) {
                await this.localConn.collection(model.collection).findOneAndUpdate(
                  { [model.uuidField]: uuidVal },
                  { $set: rest },
                  { upsert: true },
                );
                pulled++;
              }
            } catch (e) {
              console.error(`[http-sync] pull upsert error on ${model.collection}:`, e.message);
              errors++;
            }
          }
        }
      }
    } catch (err) {
      console.error('[http-sync] pull error:', err.message);
      errors++;
    }

    // ── PUSH: local → cloud ──────────────────────────────────────────────────
    try {
      const toPush = {};
      const sinceDate = new Date(since);

      for (const model of SYNC_MODELS) {
        const filter = {
          ...(localInstituteUuid ? { institute_uuid: localInstituteUuid } : {}),
          updatedAt: { $gt: sinceDate },
        };

        const docs = await this.localConn.collection(model.collection).find(filter).toArray();
        if (!docs.length) continue;

        // Replace local institute_uuid → cloud institute_uuid so the server can validate ownership
        toPush[model.collection] = docs.map(({ _id, ...rest }) => ({
          ...rest,
          institute_uuid: cloudInstituteUuid,
        }));
        pushed += docs.length;
      }

      if (Object.keys(toPush).length > 0) {
        const pushRes = await httpRequest(
          `${cloudUrl}/api/sync/push`, 'POST', token, { models: toPush },
        );
        if (!pushRes.ok) {
          console.error('[http-sync] push rejected:', pushRes.status, pushRes.data);
          errors++;
          pushed = 0; // Don't count as successfully pushed
        }
      }
    } catch (err) {
      console.error('[http-sync] push error:', err.message);
      errors++;
      pushed = 0;
    }

    // Only advance the sync cursor when there were no errors
    if (errors === 0) {
      this.store.set(sinceKey, cycleStart.toISOString());
    }

    this.running = false;
    const result = {
      state: errors > 0 ? 'partial' : 'ok',
      lastSyncAt: cycleStart.toISOString(),
      pushed,
      pulled,
      errors,
      message: `↑ ${pushed} pushed  ↓ ${pulled} pulled${errors ? `  ⚠ ${errors} errors` : ''}`,
    };
    this._emit(result);
    console.log('[http-sync]', result.message);
    return result;
  }

  async _getLocalInstituteUuid() {
    try {
      const doc = await this.localConn.collection('institutes').findOne({});
      return doc?.institute_uuid || null;
    } catch {
      return null;
    }
  }

  _emit(data) {
    try { this.onStatus(data); } catch { /* renderer may not be ready */ }
  }
}

module.exports = { HttpSyncEngine };
