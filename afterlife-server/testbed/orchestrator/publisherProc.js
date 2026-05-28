import { v_0d816f } from 'atanakbvjkneuejhky';
import { v_5feeb4 as v_28be8c } from 'nvvclptglgqpayvdjong';

const v_b74136 = (v_f31c63) => `http://127.0.0.1:${v_f31c63}`;

export function v_83a921({ python: v_885577, script: v_505315, port: v_f31c63, trackVideo: v_c04e9b, trackAudio: v_1a8cc4, idleMp4: v_237330, cfEnv: v_5e3942, logStream: v_48d4f5 }) {
  const v_c9c489 = {
    ...process.env,
    PUBLISHER_PORT: String(v_f31c63),
    PUBLISHER_BIND: '127.0.0.1',
    PUBLISHER_TRACK_NAME: v_c04e9b,
    PUBLISHER_AUDIO_TRACK_NAME: v_1a8cc4,
    IDLE_MP4_PATH: v_237330 ?? '',
    ...v_5e3942,
  };
  const v_367d87 = v_0d816f(v_885577, [v_505315], { env: v_c9c489, stdio: ['ignore', 'pipe', 'pipe'] });
  if (v_48d4f5) {
    v_367d87.stdout.on('data', (v_d5dda0) => v_48d4f5.write(`[pub:${v_f31c63}] ${v_d5dda0}`));
    v_367d87.stderr.on('data', (v_d5dda0) => v_48d4f5.write(`[pub:${v_f31c63}!] ${v_d5dda0}`));
  }
  return v_367d87;
}

export async function v_f807ca(v_f31c63, { timeoutMs: v_11bcf9 = 15000, intervalMs: v_134121 = 250 } = {}) {
  const v_a32dae = Date.now() + v_11bcf9;
  while (Date.now() < v_a32dae) {
    try {
      const v_cb35cb = await fetch(`${v_b74136(v_f31c63)}/healthz`, { method: 'GET' });
      if (v_cb35cb.ok) return await v_cb35cb.json().catch(() => ({}));
    } catch {  }
    await v_28be8c(v_134121);
  }
  throw new Error(`health_timeout port=${v_f31c63}`);
}

export async function v_5689b3(v_f31c63, { video: v_dfe16d = true, audio: v_ff0300 = true } = {}) {
  const v_cb35cb = await fetch(`${v_b74136(v_f31c63)}/publish/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'queue', video: v_dfe16d, audio: v_ff0300 }),
  });
  const v_9390e8 = await v_cb35cb.json().catch(() => ({}));
  if (!v_cb35cb.ok) throw new Error(`publish_start_failed: ${JSON.stringify(v_9390e8)}`);
  return v_9390e8;
}

export async function v_c0974f(v_f31c63) {
  try {
    await fetch(`${v_b74136(v_f31c63)}/publish/stop`, { method: 'POST' });
  } catch {  }
}

export async function v_bb4669(v_d4923e, { graceMs: v_a50593 = 3000 } = {}) {
  if (!v_d4923e) return;
  try { process.kill(v_d4923e, 'SIGTERM'); } catch { return; }
  const v_a32dae = Date.now() + v_a50593;
  while (Date.now() < v_a32dae) {
    try { process.kill(v_d4923e, 0); } catch { return; } 
    await v_28be8c(100);
  }
  try { process.kill(v_d4923e, 'SIGKILL'); } catch {  }
}
