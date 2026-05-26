const mongoose = require('mongoose');
const Store = require('electron-store');
const { SYNC_MODELS } = require('./modelRegistry');

const store = new Store({ encryptionKey: 'instify-desktop-local-key' });
const SYNC_INTERVAL_MS = 60_000;

class SyncEngine {
  constructor({ localUri, remoteUri, onStatus }) {
    this.localUri = localUri;
    this.remoteUri = remoteUri;
    this.onStatus = onStatus || (() => {});
    this.localConn = null;
    this.remoteConn = null;
    this.timer = null;
    this.running = false;
  }

  async start() {
    try {
      this.localConn = await mongoose.createConnection(this.localUri).asPromise();
      this.remoteConn = await mongoose.createConnection(this.remoteUri).asPromise();
      console.log('[sync] connections established');
      await this.runCycle();
      this.timer = setInterval(() => this.runCycle(), SYNC_INTERVAL_MS);
    } catch (err) {
      console.error('[sync] failed to start:', err.message);
      this._emit({ state: 'error', message: err.message });
    }
  }

  stop() {
    clearInterval(this.timer);
    this.localConn?.close();
    this.remoteConn?.close();
  }

  async restart(newRemoteUri) {
    this.stop();
    this.remoteUri = newRemoteUri;
    await this.start();
  }

  async runCycle() {
    if (this.running) return { ok: false, message: 'Already running' };
    if (!this.localConn || !this.remoteConn) return { ok: false, message: 'Not connected' };

    this.running = true;
    this._emit({ state: 'syncing', message: 'Sync in progress…' });

    const cycleStart = new Date();
    let pushed = 0, pulled = 0, errors = 0;

    // Determine institute_uuid from local DB (first User doc)
    let instituteUuid;
    try {
      const userColl = this.localConn.collection('users');
      const user = await userColl.findOne({});
      instituteUuid = user?.institute_uuid;
    } catch { /* skip institute filter if not found */ }

    for (const model of SYNC_MODELS) {
      try {
        const lastSyncKey = `lastSyncAt.${model.collection}`;
        const lastSyncAt = new Date(store.get(lastSyncKey, 0));

        const localColl = this.localConn.collection(model.collection);
        const remoteColl = this.remoteConn.collection(model.collection);

        const filter = instituteUuid ? { institute_uuid: instituteUuid } : {};

        // PULL: remote → local
        const remoteChanged = await remoteColl.find({
          ...filter,
          updatedAt: { $gt: lastSyncAt },
        }).toArray();

        for (const doc of remoteChanged) {
          const uuidVal = doc[model.uuidField];
          if (!uuidVal) continue;
          const localDoc = await localColl.findOne({ [model.uuidField]: uuidVal });
          if (!localDoc) {
            await localColl.insertOne(doc);
            pulled++;
          } else if (doc.updatedAt > localDoc.updatedAt) {
            await localColl.replaceOne({ [model.uuidField]: uuidVal }, doc);
            pulled++;
          }
        }

        // PUSH: local → remote
        const localChanged = await localColl.find({
          ...filter,
          updatedAt: { $gt: lastSyncAt },
        }).toArray();

        for (const doc of localChanged) {
          const uuidVal = doc[model.uuidField];
          if (!uuidVal) continue;
          const remoteDoc = await remoteColl.findOne({ [model.uuidField]: uuidVal });
          if (!remoteDoc) {
            await remoteColl.insertOne(doc);
            pushed++;
          } else if (doc.updatedAt > remoteDoc.updatedAt) {
            await remoteColl.replaceOne({ [model.uuidField]: uuidVal }, doc);
            pushed++;
          }
        }

        store.set(lastSyncKey, cycleStart.toISOString());
      } catch (err) {
        console.error(`[sync] error on ${model.collection}:`, err.message);
        errors++;
      }
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
    console.log('[sync]', result.message);
    return result;
  }

  _emit(data) {
    try { this.onStatus(data); } catch { /* renderer may not be ready */ }
  }
}

module.exports = { SyncEngine };
