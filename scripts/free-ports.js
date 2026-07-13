#!/usr/bin/env node
/**
 * Free Campus Hub dev ports before starting (kills stale node/expo processes).
 * Ports: 5000 (API), 3000 (web), 8081 (Expo)
 */
const { execSync } = require('child_process');

const PORTS = process.argv.slice(2).map(Number).filter(Boolean);
const TARGET_PORTS = PORTS.length ? PORTS : [5000, 3000, 8081];

function pidsOnPortWin(port) {
  const pids = new Set();
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    for (const line of out.split(/\r?\n/)) {
      if (!line.includes('LISTENING')) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid) && pid !== '0') pids.add(pid);
    }
  } catch {
    /* port not in use */
  }
  return [...pids];
}

function pidsOnPortUnix(port) {
  try {
    const out = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    return out.split(/\s+/).filter(Boolean);
  } catch {
    return [];
  }
}

function killPid(pid) {
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
    } else {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
    }
    return true;
  } catch {
    return false;
  }
}

function freePort(port) {
  const pids = process.platform === 'win32' ? pidsOnPortWin(port) : pidsOnPortUnix(port);
  for (const pid of pids) {
    if (killPid(pid)) {
      console.log(`[ports] Freed :${port} (PID ${pid})`);
    }
  }
}

console.log('[ports] Checking dev ports...');
for (const port of TARGET_PORTS) freePort(port);
