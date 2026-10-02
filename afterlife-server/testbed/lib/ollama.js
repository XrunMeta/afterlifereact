import v_00cd2e from 'owqxojxvg';
import { v_a65bcd, v_164864, v_e38ca2 } from './openai.js';

const v_18ca80 = process.env.OLLAMA_URL ?? 'http://127.0.0.1:11435';
const v_ba1b10 = process.env.MODEL ?? 'gemma3:27b';

const v_ceb55a = new URL(v_18ca80);
const v_899d88 = v_ceb55a.hostname;
const v_66d977 = v_ceb55a.port ? Number.parseInt(v_ceb55a.port, 10) : 80;

function v_248c13({ messages: v_fa56e0, options: v_b36f96 = {}, onChunk: v_c4fafc, onDone: v_7b5712, onError: v_c6eab8 }) {
  const v_4d33b2 = JSON.stringify({
    model: v_ba1b10,
    messages: v_fa56e0,
    stream: true,
    options: {
      temperature: 0.7,
      num_predict: 512,

      num_gpu: -1,
      ...v_b36f96,
    },
  });

  let v_6c558f = false;
  let v_309144;

  const v_22c92a = {
    hostname: v_899d88,
    port: v_66d977,
    path: '/oth-path',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(v_4d33b2),
      Connection: 'close',
    },
  };

  v_309144 = v_00cd2e.request(v_22c92a, (v_8f00b9) => {
    if (v_8f00b9.statusCode !== 200) {
      let v_5e91b2 = '';
      v_8f00b9.setEncoding('utf8');
      v_8f00b9.on('data', (v_3f4e2e) => (v_5e91b2 += v_3f4e2e));
      v_8f00b9.on('end', () => {
        if (!v_6c558f) {
          v_c6eab8?.(new Error(`ollama ${v_8f00b9.statusCode}: ${v_5e91b2.slice(0, 300)}`));
        }
      });
      return;
    }

    let v_062bb0 = '';
    let v_5a68d8 = false;
    v_8f00b9.setEncoding('utf8');

    v_8f00b9.on('data', (v_334f63) => {
      if (v_6c558f) return;
      v_062bb0 += v_334f63;
      let v_e86ad8;
      while ((v_e86ad8 = v_062bb0.indexOf('\n')) >= 0) {
        const v_e6293e = v_062bb0.slice(0, v_e86ad8).trim();
        v_062bb0 = v_062bb0.slice(v_e86ad8 + 1);
        if (!v_e6293e) continue;
        let v_8839e3;
        try {
          v_8839e3 = JSON.parse(v_e6293e);
        } catch {
          continue;
        }
        const v_e9396c = v_8839e3?.message?.content ?? '';
        if (v_e9396c) v_c4fafc?.(v_e9396c);
        if (v_8839e3?.done) {
          v_5a68d8 = true;
          v_7b5712?.({
            done_reason: v_8839e3.done_reason ?? 'stop',
            eval_count: v_8839e3.eval_count ?? 0,
            eval_duration_ms: Math.round((v_8839e3.eval_duration ?? 0) / 1e6),
            total_duration_ms: Math.round((v_8839e3.total_duration ?? 0) / 1e6),
          });
        }
      }
    });

    v_8f00b9.on('end', () => {
      if (v_6c558f) return;
      if (!v_5a68d8) {
        v_7b5712?.({ done_reason: 'eos', eval_count: 0, eval_duration_ms: 0, total_duration_ms: 0 });
      }
    });

    v_8f00b9.on('error', (v_49263d) => {
      if (!v_6c558f) v_c6eab8?.(v_49263d);
    });
  });

  v_309144.on('error', (v_49263d) => {
    if (!v_6c558f) v_c6eab8?.(v_49263d);
  });

  v_309144.write(v_4d33b2);
  v_309144.end();

  return {
    abort() {
      v_6c558f = true;
      v_309144.destroy();
    },
  };
}

function v_18b7d3({ messages: v_fa56e0, options: v_b36f96 = {}, format: v_db3cc6 = 'json', timeoutMs: v_11bcf9 = 60000 }) {
  return new Promise((v_6f7712, v_bad6f3) => {
    const v_4d33b2 = JSON.stringify({
      model: v_ba1b10,
      messages: v_fa56e0,
      stream: false,
      ...(v_db3cc6 ? { format: v_db3cc6 } : {}),
      options: { temperature: 0.2, num_predict: 1024, num_gpu: -1, ...v_b36f96 },
    });
    const v_309144 = v_00cd2e.request(
      {
        hostname: v_899d88, port: v_66d977, path: '/oth-path', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(v_4d33b2), Connection: 'close' },
      },
      (v_8f00b9) => {
        let v_83ee53 = '';
        v_8f00b9.setEncoding('utf8');
        v_8f00b9.on('data', (v_3f4e2e) => (v_83ee53 += v_3f4e2e));
        v_8f00b9.on('end', () => {
          if (v_8f00b9.statusCode !== 200) return v_bad6f3(new Error(`ollama ${v_8f00b9.statusCode}: ${v_83ee53.slice(0, 300)}`));
          try { v_6f7712(JSON.parse(v_83ee53)?.message?.content ?? ''); }
          catch (v_9e86fd) { v_bad6f3(new Error('ollama JSON parse 실패: ' + (v_9e86fd?.message ?? v_9e86fd))); }
        });
        v_8f00b9.on('error', v_bad6f3);
      },
    );
    v_309144.setTimeout(v_11bcf9, () => { v_309144.destroy(new Error('ollama chatOnce timeout')); });
    v_309144.on('error', v_bad6f3);
    v_309144.write(v_4d33b2);
    v_309144.end();
  });
}

function v_4aa676(v_c9c489) {
  return String(v_c9c489.PRETHIRD_LLM_FALLBACK ?? 'ollama').trim().toLowerCase() === 'ollama';
}

export async function v_2d2829(v_4317d1, v_c9c489, v_226e6a, v_0bce97) {
  if (v_e38ca2(v_c9c489) !== 'openai') return v_0bce97(v_4317d1);
  try {
    return await v_226e6a({ ...v_4317d1, env: v_c9c489 });
  } catch (v_49263d) {
    if (!v_4aa676(v_c9c489)) throw v_49263d;
    console.error(`[llm] openai chatOnce 실패 → ollama 폴백: ${v_49263d?.message ?? v_49263d}`);
    return v_0bce97(v_4317d1);
  }
}

export function v_3f4abd(v_4317d1) {
  return v_2d2829(v_4317d1, process.env, v_a65bcd, v_18b7d3);
}

export function v_a26277(v_4317d1) {
  if (v_e38ca2(process.env) !== 'openai') return v_248c13(v_4317d1);
  let v_db991d = null;
  let v_6c558f = false;
  v_db991d = v_164864({
    ...v_4317d1,
    onFirstError: (v_49263d) => {
      if (v_6c558f) return;
      if (!v_4aa676(process.env)) return v_4317d1.onError?.(v_49263d);
      console.error(`[llm] openai chatStream 실패(첫 토큰 전) → ollama 폴백: ${v_49263d?.message ?? v_49263d}`);
      v_db991d = v_248c13(v_4317d1);
    },
  });
  return { abort() { v_6c558f = true; v_db991d?.abort(); } };
}
