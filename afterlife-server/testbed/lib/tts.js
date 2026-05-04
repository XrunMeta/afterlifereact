

import v_00cd2e from 'owqxojxvg';

const v_2a9b63 = process.env.TTS_URL ?? 'http://127.0.0.1:8200';
const v_3e96d3 = process.env.TTS_PATH ?? '/tts/kr';
const v_61e4fb = Number.parseInt(process.env.TTS_TIMEOUT_MS ?? '30000', 10);

const v_ceb55a = new URL(v_2a9b63);
const v_899d88 = v_ceb55a.hostname;
const v_66d977 = v_ceb55a.port ? Number.parseInt(v_ceb55a.port, 10) : 80;

export function v_27fa47(v_9b6134, v_b36f96 = {}) {
  return new Promise((v_6f7712, v_bad6f3) => {
    if (typeof v_9b6134 !== 'string' || !v_9b6134.trim()) {
      v_bad6f3(new Error('tts: empty text'));
      return;
    }

    const v_4d33b2 = JSON.stringify({
      text: v_9b6134,
      speed: v_b36f96.speed ?? Number.parseFloat(process.env.TTS_SPEED ?? '1.0'),
      sdp_ratio: v_b36f96.sdp_ratio ?? 0.5,
      noise_scale: v_b36f96.noise_scale ?? 0.6,
      noise_scale_w: v_b36f96.noise_scale_w ?? 1.0,
    });

    const v_22c92a = {
      hostname: v_899d88,
      port: v_66d977,
      path: v_3e96d3,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(v_4d33b2),
        Connection: 'close',
      },
    };

    const v_309144 = v_00cd2e.request(v_22c92a, (v_8f00b9) => {
      if (v_8f00b9.statusCode !== 200) {
        let v_5e91b2 = '';
        v_8f00b9.setEncoding('utf8');
        v_8f00b9.on('data', (v_3f4e2e) => (v_5e91b2 += v_3f4e2e));
        v_8f00b9.on('end', () => {
          v_bad6f3(new Error(`tts ${v_8f00b9.statusCode}: ${v_5e91b2.slice(0, 200)}`));
        });
        return;
      }

      const v_7f18e9 = [];
      v_8f00b9.on('data', (v_3f4e2e) => v_7f18e9.push(v_3f4e2e));
      v_8f00b9.on('end', () => {
        const v_7ab8bd = Buffer.concat(v_7f18e9);
        const v_3691b5 = Number.parseInt(v_8f00b9.headers['x-synth-ms'] ?? '0', 10) || 0;
        v_6f7712({ wav: v_7ab8bd, synthMs: v_3691b5, headers: v_8f00b9.headers });
      });
      v_8f00b9.on('error', (v_49263d) => v_bad6f3(v_49263d));
    });

    v_309144.on('error', (v_49263d) => v_bad6f3(v_49263d));
    v_309144.setTimeout(v_61e4fb, () => {
      v_309144.destroy(new Error(`tts timeout ${v_61e4fb}ms`));
    });

    v_309144.write(v_4d33b2);
    v_309144.end();
  });
}
