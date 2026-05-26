/**
 * electron-builder afterPack hook.
 * Runs `npm install --production` inside the bundled backend directory
 * so node_modules are available at runtime inside the packaged app.
 */
const { execSync } = require('child_process');
const path = require('path');

exports.default = async function afterPack(context) {
  const backendDir = path.join(context.appOutDir, 'resources', 'backend');
  console.log('[afterPack] Installing backend production dependencies…');
  try {
    execSync('npm install --production --ignore-scripts', {
      cwd: backendDir,
      stdio: 'inherit',
    });
    console.log('[afterPack] Backend dependencies installed.');
  } catch (err) {
    console.error('[afterPack] npm install failed:', err.message);
    throw err;
  }
};
