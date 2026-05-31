'use strict';
const https = require('https');
const http = require('http');

const GRACE_DAYS = 30;        // days offline before restricting to free
const LOCAL_TRIAL_DAYS = 15;  // days for install-based trial (no cloud token)
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

let _store = null;
let _mainWindow = null;
let _refreshTimer = null;

function init(storeInstance) {
  _store = storeInstance;
  // Record install date exactly once — never overwrite
  if (!_store.get('installDate')) {
    _store.set('installDate', new Date().toISOString());
  }
}

function setWindow(win) {
  _mainWindow = win;
}

// HTTP/HTTPS GET helper (no axios dependency in main process)
function httpGet(url, token) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === 'https:' ? https : http;
    const opts = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 8000,
    };
    const req = mod.request(opts, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: {} }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

// POST helper for cloud login
function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === 'https:' ? https : http;
    const payload = JSON.stringify(body);
    const opts = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: 10000,
    };
    const req = mod.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data: {} }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(payload);
    req.end();
  });
}

// Authenticate against cloud and store token
async function connectCloud({ email, password, cloudUrl }) {
  if (!_store) throw new Error('licenseManager not initialized');
  const url = `${cloudUrl.replace(/\/$/, '')}/api/auth/user/login`;
  let res;
  try {
    res = await httpPost(url, { login_username: email, login_password: password });
  } catch (err) {
    throw new Error(`Cannot reach cloud server: ${err.message}`);
  }
  if (res.status !== 200 || !res.data.token) {
    throw new Error(res.data?.message || 'Invalid credentials');
  }

  _store.set('cloudUrl', cloudUrl.replace(/\/$/, ''));
  _store.set('cloudAuthToken', res.data.token);
  if (res.data.refreshToken) _store.set('cloudRefreshToken', res.data.refreshToken);

  // Immediately cache license from login response
  const now = new Date().toISOString();
  _store.set('license', {
    plan_type: res.data.plan_type || 'trial',
    status: res.data.status || 'trial',
    modulesEnabled: res.data.modulesEnabled || [],
    trialExpiresAt: res.data.trialExpiresAt || null,
    trialActive: res.data.status === 'trial' && res.data.trialExpiresAt
      ? new Date(res.data.trialExpiresAt) > new Date()
      : false,
    paidActive: res.data.plan_type === 'paid' && res.data.status === 'active',
    lastValidatedAt: now,
    source: 'cloud',
  });

  // Broadcast to renderer
  const license = getLicense();
  _mainWindow?.webContents.send('license:updated', license);
  return license;
}

// Refresh license from cloud
async function refresh() {
  if (!_store) return false;
  const cloudUrl = _store.get('cloudUrl', '');
  const token = _store.get('cloudAuthToken', '');
  if (!cloudUrl || !token) return false;

  try {
    const res = await httpGet(`${cloudUrl}/api/license/status`, token);
    if (res.status === 401) {
      // Token expired — clear it so user is prompted to reconnect
      _store.delete('cloudAuthToken');
      return false;
    }
    if (res.status !== 200) return false;

    _store.set('license', {
      ...res.data,
      lastValidatedAt: new Date().toISOString(),
      source: 'cloud',
    });

    const license = getLicense();
    _mainWindow?.webContents.send('license:updated', license);
    return true;
  } catch {
    return false; // Offline or server unreachable — use cached
  }
}

// Return current effective license (cached or local fallback)
function getLicense() {
  if (!_store) return _localTrialLicense();

  const cached = _store.get('license', null);

  if (!cached) return _localTrialLicense();

  // Check cloud grace period
  if (cached.source === 'cloud' && cached.lastValidatedAt) {
    const daysSince = (Date.now() - new Date(cached.lastValidatedAt)) / 86400000;
    if (daysSince > GRACE_DAYS) {
      return {
        plan_type: 'free',
        status: 'grace_expired',
        trialActive: false,
        paidActive: false,
        modulesEnabled: [],
        daysOffline: Math.floor(daysSince),
        source: 'grace_expired',
        lastValidatedAt: cached.lastValidatedAt,
      };
    }
  }

  const now = new Date();
  const trialExpiry = cached.trialExpiresAt ? new Date(cached.trialExpiresAt) : null;
  return {
    ...cached,
    trialActive: cached.status === 'trial' && trialExpiry ? trialExpiry > now : false,
    paidActive: cached.plan_type === 'paid' && cached.status === 'active',
    daysRemaining: trialExpiry ? Math.max(0, Math.ceil((trialExpiry - now) / 86400000)) : null,
  };
}

// Local trial when no cloud connection
function _localTrialLicense() {
  const installDate = _store ? _store.get('installDate', new Date().toISOString()) : new Date().toISOString();
  const trialExpiresAt = new Date(new Date(installDate).getTime() + LOCAL_TRIAL_DAYS * 86400000);
  const now = new Date();
  const trialActive = now < trialExpiresAt;
  const daysRemaining = Math.max(0, Math.ceil((trialExpiresAt - now) / 86400000));
  return {
    plan_type: 'trial',
    status: trialActive ? 'trial' : 'expired',
    trialActive,
    paidActive: false,
    modulesEnabled: [],
    trialExpiresAt: trialExpiresAt.toISOString(),
    daysRemaining: trialActive ? daysRemaining : 0,
    source: 'local_trial',
    lastValidatedAt: null,
  };
}

function startAutoRefresh() {
  if (_refreshTimer) clearInterval(_refreshTimer);
  _refreshTimer = setInterval(refresh, REFRESH_INTERVAL_MS);
}

function stopAutoRefresh() {
  if (_refreshTimer) { clearInterval(_refreshTimer); _refreshTimer = null; }
}

module.exports = { init, setWindow, connectCloud, refresh, getLicense, startAutoRefresh, stopAutoRefresh };
