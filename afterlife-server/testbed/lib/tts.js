

import http from 'node:http';

const TTS_URL_RAW = process.env.TTS_URL ?? 'http://127.0.0.1:8200';
const TTS_PATH = process.env.TTS_PATH ?? '/tts/kr';
const TTS_TIMEOUT_MS = Number.parseInt(process.env.TTS_TIMEOUT_MS ?? '30000', 10);

const u = new URL(TTS_URL_RAW);
const HOST = u.hostname;
const PORT = u.port ? Number.parseInt(u.port, 10) : 80;

export function ttsSynthesize(text, options = {}) {
  return new Promise((resolve, reject) => {
    if (typeof text !== 'string' || !text.trim()) {
      reject(new Error('tts: empty text'));
      return;
    }

    const body = JSON.stringify({
      text,
      speed: options.speed ?? Number.parseFloat(process.env.TTS_SPEED ?? '1.0'),
      sdp_ratio: options.sdp_ratio ?? 0.5,
      noise_scale: options.noise_scale ?? 0.6,
      noise_scale_w: options.noise_scale_w ?? 1.0,
    });

    const reqOpts = {
      hostname: HOST,
      port: PORT,
      path: TTS_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        Connection: 'close',
      },
    };

    const req = http.request(reqOpts, (res) => {
      if (res.statusCode !== 200) {
        let errBuf = '';
        res.setEncoding('utf8');
        res.on('data', (c) => (errBuf += c));
        res.on('end', () => {
          reject(new Error(`tts ${res.statusCode}: ${errBuf.slice(0, 200)}`));
        });
        return;
      }

      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const wav = Buffer.concat(chunks);
        const synthMs = Number.parseInt(res.headers['x-synth-ms'] ?? '0', 10) || 0;
        resolve({ wav, synthMs, headers: res.headers });
      });
      res.on('error', (err) => reject(err));
    });

    req.on('error', (err) => reject(err));
    req.setTimeout(TTS_TIMEOUT_MS, () => {
      req.destroy(new Error(`tts timeout ${TTS_TIMEOUT_MS}ms`));
    });

    req.write(body);
    req.end();
  });
}
