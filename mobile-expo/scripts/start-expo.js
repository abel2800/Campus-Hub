#!/usr/bin/env node
const os = require('os');
const { spawn, execSync } = require('child_process');
const path = require('path');

const EXPO_PORT = process.env.EXPO_PORT || '8081';

function getLanIp() {
  const nets = os.networkInterfaces();
  const candidates = [];
  for (const interfaces of Object.values(nets)) {
    for (const net of interfaces || []) {
      if (net.family === 'IPv4' && !net.internal) candidates.push(net.address);
    }
  }
  return (
    candidates.find((ip) => ip.startsWith('192.168.') || ip.startsWith('10.')) ||
    candidates[0] ||
    '127.0.0.1'
  );
}

const ip = process.env.EXPO_PUBLIC_API_HOST || getLanIp();
const root = path.resolve(__dirname, '..');
const repoRoot = path.resolve(root, '..');
const useTunnel = process.argv.includes('--tunnel');

try {
  execSync('node scripts/free-ports.js 8081', { cwd: repoRoot, stdio: 'inherit' });
} catch {
  /* continue */
}

// Cursor/CI sets CI=1 which breaks Expo Go (non-interactive auth errors on phone)
const env = { ...process.env };
delete env.CI;
delete env.CONTINUOUS_INTEGRATION;
env.REACT_NATIVE_PACKAGER_HOSTNAME = ip;
env.EXPO_PUBLIC_API_HOST = ip;

console.log(`
Campus Hub Mobile (Expo SDK 54)
--------------------------------
Phone URL:  exp://${ip}:${EXPO_PORT}
API URL:    http://${ip}:5000
Dev tools:  http://localhost:${EXPO_PORT}  (do NOT open in browser — use Expo Go)

IMPORTANT:
  • Open the app with Expo Go on your phone (scan QR in this terminal).
  • Website runs at http://localhost:3000 — not port ${EXPO_PORT}.
  • When you scan/update the app, errors and logs appear here as [MOBILE] lines.

Android USB (if Wi-Fi fails):
  adb reverse tcp:${EXPO_PORT} tcp:${EXPO_PORT}
  adb reverse tcp:5000 tcp:5000
  Then in Expo Go enter: exp://127.0.0.1:${EXPO_PORT}
`);

const args = ['expo', 'start', useTunnel ? '--tunnel' : '--lan', '--port', EXPO_PORT, '--clear'];
const child = spawn('npx', args, {
  cwd: root,
  env,
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => process.exit(code ?? 0));
