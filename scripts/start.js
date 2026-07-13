#!/usr/bin/env node
/**
 * Campus Hub — start backend, web frontend, and Expo mobile (iOS + Android) together.
 *
 * Usage:
 *   npm start              LAN mode (same Wi‑Fi for phones)
 *   npm run start:tunnel   ngrok tunnel (if LAN fails on iOS)
 *   node scripts/start.js --no-mobile
 *   node scripts/start.js --no-web
 */

const concurrently = require('concurrently');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');

// Kill stale API / web / Expo processes so ports 5000, 3000, 8081 are free
try {
  execSync('node scripts/free-ports.js', { cwd: root, stdio: 'inherit' });
} catch {
  /* continue even if cleanup fails */
}
const args = process.argv.slice(2);
const useTunnel = args.includes('--tunnel');
const skipMobile = args.includes('--no-mobile');
const skipWeb = args.includes('--no-web');

function getLocalIp() {
  const nets = os.networkInterfaces();
  const candidates = [];
  for (const interfaces of Object.values(nets)) {
    for (const net of interfaces || []) {
      if (net.family === 'IPv4' && !net.internal) {
        candidates.push(net.address);
      }
    }
  }
  const lan = candidates.find(
    (addr) =>
      addr.startsWith('192.168.') ||
      addr.startsWith('10.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(addr)
  );
  return lan || candidates[0] || '127.0.0.1';
}

const ip = process.env.EXPO_PUBLIC_API_HOST || getLocalIp();

const line = '═'.repeat(58);
console.log(`
╔${line}╗
║${'Campus Hub — starting all services'.padStart(38).padEnd(58)}║
╠${line}╣
║  API (backend)   http://localhost:5000${' '.repeat(19)}║
${skipWeb ? '' : `║  Web (browser)   http://localhost:3000${' '.repeat(19)}║\n`}
${skipMobile ? '' : `║  Mobile          Expo Go — scan QR (port 8081)${' '.repeat(11)}║
║                  Do NOT open :8081 in browser${' '.repeat(16)}║
`}
║  Phone API host  http://${ip}:5000${' '.repeat(58 - 26 - ip.length)}║
╠${line}╣
║  Press Ctrl+C to stop everything                           ║
║  Phone app errors show as [MOBILE] lines in this terminal  ║
╚${line}╝
`);

const tasks = [
  { command: 'npm run dev --prefix backend', name: 'API', prefixColor: 'blue' },
];

if (!skipWeb) {
  tasks.push({ command: 'npm start --prefix frontend', name: 'WEB', prefixColor: 'green' });
}

if (!skipMobile) {
  const mobileScript = useTunnel ? 'start:tunnel' : 'start:lan';
  tasks.push({
    command: `npm run ${mobileScript} --prefix mobile-expo`,
    name: 'MOBILE',
    prefixColor: 'magenta',
  });
}

const mobileEnv = { ...process.env };
delete mobileEnv.CI;
delete mobileEnv.CONTINUOUS_INTEGRATION;

const { result } = concurrently(tasks, {
  cwd: root,
  killOthersOnFail: false,
  env: {
    ...mobileEnv,
    EXPO_PUBLIC_API_HOST: ip,
    BROWSER: process.env.BROWSER || 'none',
  },
});

result.then(
  () => process.exit(0),
  () => process.exit(1)
);
