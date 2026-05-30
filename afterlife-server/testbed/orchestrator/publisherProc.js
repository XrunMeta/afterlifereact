import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const PUB = (port) => `http://127.0.0.1:${port}`;

export function spawnPublisher({ python, script, port, trackVideo, trackAudio, idleMp4, cfEnv, logStream }) {
  const env = {
    ...process.env,
    PUBLISHER_PORT: String(port),
    PUBLISHER_BIND: '127.0.0.1',
    PUBLISHER_TRACK_NAME: trackVideo,
    PUBLISHER_AUDIO_TRACK_NAME: trackAudio,
    IDLE_MP4_PATH: idleMp4 ?? '',
    ...cfEnv,
  };
  const child = spawn(python, [script], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  if (logStream) {
    child.stdout.on('data', (d) => logStream.write(`[pub:${port}] ${d}`));
    child.stderr.on('data', (d) => logStream.write(`[pub:${port}!] ${d}`));
  }
  return child;
}

export async function waitHealthz(port, { timeoutMs = 15000, intervalMs = 250 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${PUB(port)}/healthz`, { method: 'GET' });
      if (r.ok) return await r.json().catch(() => ({}));
    } catch {  }
    await sleep(intervalMs);
  }
  throw new Error(`health_timeout port=${port}`);
}

export async function publishStart(port, { video = true, audio = true } = {}) {
  const r = await fetch(`${PUB(port)}/publish/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'queue', video, audio }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`publish_start_failed: ${JSON.stringify(data)}`);
  return data;
}

export async function publishStop(port) {
  try {
    await fetch(`${PUB(port)}/publish/stop`, { method: 'POST' });
  } catch {  }
}

export async function killProc(pid, { graceMs = 3000 } = {}) {
  if (!pid) return;
  try { process.kill(pid, 'SIGTERM'); } catch { return; }
  const deadline = Date.now() + graceMs;
  while (Date.now() < deadline) {
    try { process.kill(pid, 0); } catch { return; } 
    await sleep(100);
  }
  try { process.kill(pid, 'SIGKILL'); } catch {  }
}
