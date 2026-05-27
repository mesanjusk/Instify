const { app, BrowserWindow, ipcMain, Menu, Tray, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const net_module = require('net');
const http = require('http');
const crypto = require('crypto');
const os = require('os');
const Store = require('electron-store');

// Derive a machine-specific encryption key so the store is tied to this device.
// Falls back to the legacy key on first run if the migrated flag is not set,
// then re-encrypts with the new key — enabling a transparent migration.
function getMachineKey() {
  const seed = [
    app.getPath('userData'),
    os.hostname(),
    os.platform(),
    'instify-v2',
  ].join(':');
  return crypto.createHash('sha256').update(seed).digest('hex');
}

const MACHINE_KEY = getMachineKey();
const LEGACY_KEY = 'instify-desktop-local-key';

let store;
try {
  store = new Store({ encryptionKey: MACHINE_KEY });
  // Verify the store is readable (throws if key is wrong on existing data)
  store.get('_migrated');
} catch {
  // First run after upgrade: migrate data from legacy key
  try {
    const legacyStore = new Store({ encryptionKey: LEGACY_KEY, name: 'config' });
    const allData = legacyStore.store;
    store = new Store({ encryptionKey: MACHINE_KEY });
    Object.entries(allData).forEach(([k, v]) => store.set(k, v));
    store.set('_migrated', true);
    legacyStore.clear();
  } catch {
    store = new Store({ encryptionKey: MACHINE_KEY });
  }
}

let mainWindow = null;
let tray = null;
let mongodProcess = null;
let backendProcess = null;
let syncEngine = null;

const IS_DEV = process.env.NODE_ENV === 'development';
const MONGO_PORT = 27017;
const BACKEND_PORT = 5000;

// ── Paths ─────────────────────────────────────────────────────────────────────
function getResourcePath(...parts) {
  if (IS_DEV) return path.join(__dirname, '..', ...parts);
  return path.join(process.resourcesPath, ...parts);
}

const MONGO_BIN = path.join(getResourcePath('mongodb'), 'bin', process.platform === 'win32' ? 'mongod.exe' : 'mongod');
const MONGO_DATA = path.join(app.getPath('userData'), 'mongodata');
const BACKEND_DIR = getResourcePath('backend');
const FRONTEND_DIR = getResourcePath('frontend');
const SESSION_DIR = path.join(app.getPath('userData'), 'baileys_sessions');

// ── JWT secret ────────────────────────────────────────────────────────────────
function getOrCreateJwtSecret() {
  let secret = store.get('jwtSecret');
  if (!secret) {
    secret = crypto.randomBytes(64).toString('hex');
    store.set('jwtSecret', secret);
  }
  return secret;
}

// ── Poll TCP port until open ───────────────────────────────────────────────────
function waitForPort(port, retries = 20, delayMs = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const tryConnect = () => {
      const socket = new net_module.Socket();
      socket.setTimeout(800);
      socket.on('connect', () => { socket.destroy(); resolve(); });
      socket.on('error', () => { socket.destroy(); retry(); });
      socket.on('timeout', () => { socket.destroy(); retry(); });
      socket.connect(port, '127.0.0.1');
    };
    const retry = () => {
      attempts++;
      if (attempts >= retries) return reject(new Error(`Port ${port} not ready after ${retries} attempts`));
      setTimeout(tryConnect, delayMs);
    };
    tryConnect();
  });
}

// ── Poll HTTP health endpoint until 200 ────────────────────────────────────────
function waitForHttp(url, retries = 30, delayMs = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const tryHttp = () => {
      http.get(url, (res) => {
        if (res.statusCode === 200) return resolve();
        retry();
      }).on('error', retry);
    };
    const retry = () => {
      attempts++;
      if (attempts >= retries) return reject(new Error(`${url} not healthy after ${retries} attempts`));
      setTimeout(tryHttp, delayMs);
    };
    tryHttp();
  });
}

// ── Start MongoDB ──────────────────────────────────────────────────────────────
async function startMongoDB() {
  const fs = require('fs');
  if (!fs.existsSync(MONGO_DATA)) fs.mkdirSync(MONGO_DATA, { recursive: true });

  if (!fs.existsSync(MONGO_BIN)) {
    throw new Error(
      `MongoDB binary not found at:\n${MONGO_BIN}\n\n` +
      'Please download MongoDB Community Server 7.x for Windows x64 and place mongod.exe in:\n' +
      path.join(__dirname, 'resources/mongodb/bin/')
    );
  }

  mongodProcess = spawn(MONGO_BIN, [
    '--dbpath', MONGO_DATA,
    '--port', String(MONGO_PORT),
    '--bind_ip', '127.0.0.1',
    '--logpath', path.join(app.getPath('logs'), 'mongod.log'),
    '--logappend',
  ], { detached: false });

  mongodProcess.on('error', (err) => console.error('[mongod] error:', err));
  mongodProcess.stderr?.on('data', (d) => console.error('[mongod]', d.toString().trim()));

  await waitForPort(MONGO_PORT, 30, 1000);
  console.log('[mongod] ready on port', MONGO_PORT);
}

// ── Start Express backend ─────────────────────────────────────────────────────
async function startBackend() {
  const remoteUri = store.get('remoteMongoUri', '');
  const cloudName = store.get('cloudinary.cloudName', '');
  const apiKey = store.get('cloudinary.apiKey', '');
  const apiSecret = store.get('cloudinary.apiSecret', '');

  const env = {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(BACKEND_PORT),
    MONGO_URI: `mongodb://127.0.0.1:${MONGO_PORT}/instify`,
    JWT_SECRET: getOrCreateJwtSecret(),
    ACCESS_TOKEN_SECRET: getOrCreateJwtSecret() + '_access',
    BAILEYS_SESSION_DIR: SESSION_DIR,
    CLOUDINARY_CLOUD_NAME: cloudName,
    CLOUDINARY_API_KEY: apiKey,
    CLOUDINARY_API_SECRET: apiSecret,
  };

  const nodeBin = process.execPath;
  const backendIndex = path.join(BACKEND_DIR, 'index.js');

  backendProcess = spawn(nodeBin, [backendIndex], {
    cwd: BACKEND_DIR,
    env,
    detached: false,
  });

  backendProcess.stdout?.on('data', (d) => console.log('[backend]', d.toString().trim()));
  backendProcess.stderr?.on('data', (d) => console.error('[backend]', d.toString().trim()));
  backendProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error('[backend] exited with code', code);
    }
  });

  await waitForHttp(`http://127.0.0.1:${BACKEND_PORT}/health`, 30, 1000);
  console.log('[backend] ready on port', BACKEND_PORT);
}

// ── Create BrowserWindow ──────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'Instify',
    show: false,
  });

  const indexHtml = path.join(FRONTEND_DIR, 'index.html');
  mainWindow.loadFile(indexHtml);

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── Tray ──────────────────────────────────────────────────────────────────────
function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'tray.png');
  const fs = require('fs');
  if (!fs.existsSync(iconPath)) return;

  tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Instify', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
    { label: 'Sync Now', click: () => syncEngine?.runCycle() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]);
  tray.setToolTip('Instify');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => { mainWindow?.show(); mainWindow?.focus(); });
}

// ── IPC handlers ──────────────────────────────────────────────────────────────
function registerIPC() {
  ipcMain.handle('app:version', () => app.getVersion());

  ipcMain.handle('config:get', (_, key) => store.get(key));
  ipcMain.handle('config:set', (_, { key, value }) => {
    store.set(key, value);
    if (key === 'remoteMongoUri' && syncEngine) {
      syncEngine.restart(value);
    }
    // Stop sync engine if switched to local_only mode
    if (key === 'storageMode') {
      if (value === 'local_only' && syncEngine) {
        syncEngine.stop();
        syncEngine = null;
        mainWindow?.webContents.send('sync:status', { state: 'disabled', message: 'Local-only mode — sync disabled' });
      } else if (value !== 'local_only') {
        const uri = store.get('remoteMongoUri', '');
        if (uri && !syncEngine) {
          const { SyncEngine } = require('./sync/syncEngine');
          syncEngine = new SyncEngine({
            localUri: `mongodb://127.0.0.1:${MONGO_PORT}/instify`,
            remoteUri: uri,
            onStatus: (data) => mainWindow?.webContents.send('sync:status', data),
          });
          syncEngine.start();
        }
      }
    }
  });

  ipcMain.handle('sync:now', async () => {
    if (!syncEngine) return { ok: false, message: 'Sync engine not started' };
    return syncEngine.runCycle();
  });
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────
async function shutdown() {
  console.log('[app] shutting down…');
  syncEngine?.stop();

  if (backendProcess) {
    backendProcess.kill('SIGTERM');
    await new Promise(r => setTimeout(r, 1500));
  }
  if (mongodProcess) {
    mongodProcess.kill('SIGTERM');
    await new Promise(r => setTimeout(r, 2000));
  }
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  registerIPC();

  try {
    await startMongoDB();
    await startBackend();
  } catch (err) {
    dialog.showErrorBox('Startup Error', err.message);
    app.quit();
    return;
  }

  createWindow();
  createTray();

  // Only start sync if institute is configured for hybrid or cloud_only mode
  const remoteUri = store.get('remoteMongoUri', '');
  const storageMode = store.get('storageMode', 'cloud_only');
  if (remoteUri && storageMode !== 'local_only') {
    const { SyncEngine } = require('./sync/syncEngine');
    syncEngine = new SyncEngine({
      localUri: `mongodb://127.0.0.1:${MONGO_PORT}/instify`,
      remoteUri,
      onStatus: (data) => mainWindow?.webContents.send('sync:status', data),
    });
    syncEngine.start();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // Keep running in tray on Windows/Linux; quit on macOS
  if (process.platform === 'darwin') app.quit();
});

app.on('before-quit', async (e) => {
  e.preventDefault();
  await shutdown();
  app.exit(0);
});
