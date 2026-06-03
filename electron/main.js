const { app, BrowserWindow, ipcMain, Menu, Tray, dialog, shell, powerMonitor } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const net_module = require('net');
const http = require('http');
const crypto = require('crypto');
const os = require('os');
const Store = require('electron-store');
const licenseManager = require('./license/licenseManager');

// If the backend port is already claimed by a previous instance still running
// in the tray, swallow the EADDRINUSE error instead of crashing the app.
process.on('uncaughtException', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[backend] Port already in use — reusing existing instance`);
    return;
  }
  throw err;
});

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
let syncEngine = null;
let httpSyncEngine = null;

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

// ── Download MongoDB if missing ────────────────────────────────────────────────
async function ensureMongoBinary() {
  const fs = require('fs');
  const https = require('https');
  const { pipeline } = require('stream/promises');

  if (fs.existsSync(MONGO_BIN)) return;

  if (process.platform !== 'win32') {
    throw new Error(`MongoDB binary not found at:\n${MONGO_BIN}`);
  }

  const MONGO_DOWNLOAD_URL =
    'https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.14.zip';
  const zipPath = path.join(app.getPath('temp'), 'mongod-download.zip');
  const binDir = path.dirname(MONGO_BIN);

  // Show progress window
  let progressWin = new BrowserWindow({
    width: 420, height: 160,
    frame: false, resizable: false, alwaysOnTop: true,
    webPreferences: { nodeIntegration: true, contextIsolation: false },
  });
  progressWin.loadURL('data:text/html,' + encodeURIComponent(`
    <body style="margin:0;background:#1a1a2e;display:flex;flex-direction:column;
      align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#eee">
      <div style="font-size:15px;margin-bottom:14px">Downloading MongoDB (first run)…</div>
      <div id="bar" style="width:340px;height:8px;background:#333;border-radius:4px">
        <div id="fill" style="width:0%;height:100%;background:#4ade80;border-radius:4px;transition:width .3s"></div>
      </div>
      <div id="pct" style="margin-top:10px;font-size:13px;color:#aaa">0%</div>
    </body>
  `));

  const setProgress = (pct) => {
    if (progressWin && !progressWin.isDestroyed()) {
      progressWin.webContents.executeJavaScript(
        `document.getElementById('fill').style.width='${pct}%';
         document.getElementById('pct').textContent='${pct}%';`
      ).catch(() => {});
    }
  };

  try {
    // Download with redirect following
    await new Promise((resolve, reject) => {
      const download = (url, redirects = 0) => {
        if (redirects > 5) return reject(new Error('Too many redirects'));
        https.get(url, { headers: { 'User-Agent': 'Instify-Setup/1.0' } }, (res) => {
          if (res.statusCode === 301 || res.statusCode === 302) {
            return download(res.headers.location, redirects + 1);
          }
          if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
          const total = parseInt(res.headers['content-length'] || '0', 10);
          let received = 0;
          const out = fs.createWriteStream(zipPath);
          res.on('data', (chunk) => {
            received += chunk.length;
            if (total) setProgress(Math.round((received / total) * 90));
          });
          res.pipe(out);
          out.on('finish', resolve);
          out.on('error', reject);
          res.on('error', reject);
        }).on('error', reject);
      };
      download(MONGO_DOWNLOAD_URL);
    });

    setProgress(92);

    // Extract mongod.exe from zip using PowerShell (built into Windows)
    fs.mkdirSync(binDir, { recursive: true });
    const extractDir = path.join(app.getPath('temp'), 'mongod-extract');
    if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true });

    await new Promise((resolve, reject) => {
      const ps = spawn('powershell.exe', [
        '-NoProfile', '-NonInteractive', '-Command',
        `Expand-Archive -Force -LiteralPath '${zipPath}' -DestinationPath '${extractDir}'`,
      ]);
      ps.on('close', (code) => code === 0 ? resolve() : reject(new Error(`PowerShell exit ${code}`)));
      ps.on('error', reject);
    });

    setProgress(97);

    // Find mongod.exe inside extracted folder and copy it
    const findMongod = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) { const r = findMongod(full); if (r) return r; }
        else if (entry.name === 'mongod.exe') return full;
      }
      return null;
    };
    const found = findMongod(extractDir);
    if (!found) throw new Error('mongod.exe not found inside downloaded zip');
    fs.copyFileSync(found, MONGO_BIN);

    // Cleanup
    fs.rmSync(extractDir, { recursive: true });
    fs.unlinkSync(zipPath);

    setProgress(100);
  } finally {
    if (progressWin && !progressWin.isDestroyed()) {
      progressWin.close();
      progressWin = null;
    }
  }
}

// ── Start MongoDB ──────────────────────────────────────────────────────────────
async function startMongoDB() {
  const fs = require('fs');
  if (!fs.existsSync(MONGO_DATA)) fs.mkdirSync(MONGO_DATA, { recursive: true });

  // Electron does not auto-create the logs directory; mongod needs it to exist
  // before it can open the log file, otherwise it exits immediately.
  const logsDir = app.getPath('logs');
  fs.mkdirSync(logsDir, { recursive: true });

  await ensureMongoBinary();

  mongodProcess = spawn(MONGO_BIN, [
    '--dbpath', MONGO_DATA,
    '--port', String(MONGO_PORT),
    '--bind_ip', '127.0.0.1',
    '--logpath', path.join(logsDir, 'mongod.log'),
    '--logappend',
  ], { detached: false });

  let mongodExitCode = null;
  mongodProcess.on('error', (err) => console.error('[mongod] error:', err));
  mongodProcess.on('exit', (code) => { mongodExitCode = code; });
  mongodProcess.stderr?.on('data', (d) => console.error('[mongod]', d.toString().trim()));

  try {
    await waitForPort(MONGO_PORT, 30, 1000);
  } catch (err) {
    const logPath = path.join(app.getPath('logs'), 'mongod.log');
    const fs = require('fs');
    const logTail = fs.existsSync(logPath)
      ? fs.readFileSync(logPath, 'utf8').split('\n').slice(-10).join('\n')
      : '(no log file)';
    throw new Error(
      `MongoDB did not start after 90 seconds.\n` +
      (mongodExitCode !== null ? `mongod exited with code ${mongodExitCode}.\n` : '') +
      `Log tail:\n${logTail}`
    );
  }
  console.log('[mongod] ready on port', MONGO_PORT);
}

// ── Start Express backend ─────────────────────────────────────────────────────
async function startBackend() {
  const remoteUri = store.get('remoteMongoUri', '');
  const cloudName = store.get('cloudinary.cloudName', '');
  const apiKey = store.get('cloudinary.apiKey', '');
  const apiSecret = store.get('cloudinary.apiSecret', '');

  Object.assign(process.env, {
    NODE_ENV: 'production',
    PORT: String(BACKEND_PORT),
    MONGO_URI: `mongodb://127.0.0.1:${MONGO_PORT}/instify`,
    JWT_SECRET: getOrCreateJwtSecret(),
    ACCESS_TOKEN_SECRET: getOrCreateJwtSecret() + '_access',
    BAILEYS_SESSION_DIR: SESSION_DIR,
    CLOUDINARY_CLOUD_NAME: cloudName || '',
    CLOUDINARY_API_KEY: apiKey || '',
    CLOUDINARY_API_SECRET: apiSecret || '',
  });

  // Skip requiring if a previous instance already holds the port (e.g. app still in tray)
  const portInUse = await new Promise(resolve => {
    const s = new net_module.Socket();
    s.setTimeout(300);
    s.on('connect', () => { s.destroy(); resolve(true); });
    s.on('error', () => { s.destroy(); resolve(false); });
    s.on('timeout', () => { s.destroy(); resolve(false); });
    s.connect(BACKEND_PORT, '127.0.0.1');
  });

  if (!portInUse) {
    require(path.join(BACKEND_DIR, 'index.js'));
  }

  await waitForHttp(`http://127.0.0.1:${BACKEND_PORT}/health`, 60, 1000);
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
    backgroundColor: '#0f2d1e',
  });

  // Show a loading screen immediately while MongoDB + backend start
  mainWindow.loadURL('data:text/html,' + encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          background: linear-gradient(160deg, #0f2d1e 0%, #1a4a2e 50%, #0a1a0f 100%);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          height: 100vh; font-family: 'Segoe UI', sans-serif; color: #fff;
        }
        .logo {
          width: 72px; height: 72px; border-radius: 20px;
          background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 2.2rem; margin-bottom: 20px;
          animation: float 2.5s ease-in-out infinite;
        }
        h1 { font-size: 2rem; font-weight: 800; letter-spacing: -0.04em; margin-bottom: 6px; }
        p  { color: rgba(255,255,255,0.5); font-size: 0.85rem; margin-bottom: 36px; }
        .spinner {
          width: 36px; height: 36px; border-radius: 50%;
          border: 3px solid rgba(255,255,255,0.15);
          border-top-color: #34d399;
          animation: spin 0.8s linear infinite;
        }
        .status { margin-top: 14px; font-size: 0.75rem; color: rgba(255,255,255,0.35); letter-spacing: 0.06em; text-transform: uppercase; }
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      </style>
    </head>
    <body>
      <div class="logo">🏫</div>
      <h1>Instify</h1>
      <p>Institutions Simplified</p>
      <div class="spinner"></div>
      <div class="status" id="s">Starting services…</div>
      <script>
        const msgs = ['Starting services…','Starting database…','Starting backend…','Almost ready…'];
        let i = 0;
        setInterval(() => { document.getElementById('s').textContent = msgs[Math.min(++i, msgs.length-1)]; }, 4000);
      </script>
    </body>
    </html>
  `));

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
    if (httpSyncEngine) return httpSyncEngine.runCycle();
    if (syncEngine) return syncEngine.runCycle();
    return { ok: false, message: 'Sync not configured' };
  });

  ipcMain.handle('app:install-update', () => {
    try {
      const { autoUpdater } = require('electron-updater');
      autoUpdater.quitAndInstall();
    } catch { /* not available in dev */ }
  });

  // License
  ipcMain.handle('license:get', () => licenseManager.getLicense());
  ipcMain.handle('license:connect-cloud', async (_, { email, password, cloudUrl }) => {
    try {
      const license = await licenseManager.connectCloud({ email, password, cloudUrl });
      // Kick off HTTP sync now that we have a valid token
      startHttpSync().catch(() => {});
      return { ok: true, license };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });
  ipcMain.handle('license:refresh', async () => {
    const ok = await licenseManager.refresh();
    return { ok };
  });
}

// ── HTTP sync (cloud account) ─────────────────────────────────────────────────
async function startHttpSync() {
  const token = store.get('cloudAuthToken', '');
  const cloudUrl = store.get('cloudUrl', '');
  const cloudInstituteUuid = store.get('cloudInstituteUuid', '');
  if (!token || !cloudUrl || !cloudInstituteUuid) return;

  if (httpSyncEngine) { httpSyncEngine.stop(); httpSyncEngine = null; }

  const { HttpSyncEngine } = require('./sync/httpSyncEngine');
  httpSyncEngine = new HttpSyncEngine({
    localUri: `mongodb://127.0.0.1:${MONGO_PORT}/instify`,
    getCloudUrl: () => store.get('cloudUrl', ''),
    getToken: () => store.get('cloudAuthToken', ''),
    getCloudInstituteUuid: () => store.get('cloudInstituteUuid', ''),
    onStatus: (data) => mainWindow?.webContents.send('sync:status', data),
    store,
  });
  await httpSyncEngine.start();
}

// ── Auto-updater ──────────────────────────────────────────────────────────────
function setupAutoUpdater() {
  if (IS_DEV) return; // Skip during development
  try {
    const { autoUpdater } = require('electron-updater');
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('update-available', (info) => {
      mainWindow?.webContents.send('app:update-available', { version: info.version });
    });

    autoUpdater.on('update-downloaded', (info) => {
      mainWindow?.webContents.send('app:update-downloaded', { version: info.version });
    });

    autoUpdater.on('error', (err) => {
      console.error('[updater] error:', err.message);
    });

    autoUpdater.checkForUpdates().catch(() => {});
  } catch (err) {
    console.error('[updater] failed to initialise:', err.message);
  }
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────
async function shutdown() {
  console.log('[app] shutting down…');

  // Await sync engines before killing MongoDB to prevent data loss
  await Promise.allSettled([
    syncEngine?.stop(),
    httpSyncEngine?.stop(),
  ]);

  if (mongodProcess) {
    mongodProcess.kill('SIGTERM');
    // Give MongoDB 5 s to flush and exit cleanly before we force-quit
    await new Promise(r => setTimeout(r, 5000));
    if (mongodProcess && !mongodProcess.killed) {
      console.warn('[app] MongoDB did not exit in time — sending SIGKILL');
      mongodProcess.kill('SIGKILL');
    }
  }
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
// Prevent multiple instances — focus existing window instead of launching again
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(async () => {
  registerIPC();
  licenseManager.init(store);

  // Show window immediately with loading screen — don't make the user stare at nothing
  createWindow();
  createTray();

  try {
    await startMongoDB();
    await startBackend();
  } catch (err) {
    dialog.showErrorBox('Startup Error', err.message);
    app.quit();
    return;
  }

  // Services ready — load the real app
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.loadFile(path.join(FRONTEND_DIR, 'index.html'));
  }

  setupAutoUpdater();
  licenseManager.setWindow(mainWindow);
  licenseManager.startAutoRefresh();
  // Non-blocking background refresh on startup; start HTTP sync if token exists
  licenseManager.refresh().catch(() => {});
  startHttpSync().catch(() => {});

  // Re-sync after the machine wakes from sleep
  powerMonitor.on('resume', () => { httpSyncEngine?.runCycle(); });

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
