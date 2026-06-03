import http from 'node:http';

const OLLAMA_URL_RAW = process.env.OLLAMA_URL ?? 'http://127.0.0.1:11435';
const MODEL = process.env.MODEL ?? 'gemma3:27b';

const u = new URL(OLLAMA_URL_RAW);
const HOST = u.hostname;
const PORT = u.port ? Number.parseInt(u.port, 10) : 80;

export function chatStream({ messages, options = {}, onChunk, onDone, onError }) {
  const body = JSON.stringify({
    model: MODEL,
    messages,
    stream: true,
    options: {
      temperature: 0.7,
      num_predict: 512,

      num_gpu: -1,
      ...options,
    },
  });

  let aborted = false;
  let req;

  const reqOpts = {
    hostname: HOST,
    port: PORT,
    path: '/oth-path',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      Connection: 'close',
    },
  };

  req = http.request(reqOpts, (res) => {
    if (res.statusCode !== 200) {
      let errBuf = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (errBuf += c));
      res.on('end', () => {
        if (!aborted) {
          onError?.(new Error(`ollama ${res.statusCode}: ${errBuf.slice(0, 300)}`));
        }
      });
      return;
    }

    let buffer = '';
    let doneFired = false;
    res.setEncoding('utf8');

    res.on('data', (chunk) => {
      if (aborted) return;
      buffer += chunk;
      let idx;
      while ((idx = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;
        let obj;
        try {
          obj = JSON.parse(line);
        } catch {
          continue;
        }
        const delta = obj?.message?.content ?? '';
        if (delta) onChunk?.(delta);
        if (obj?.done) {
          doneFired = true;
          onDone?.({
            done_reason: obj.done_reason ?? 'stop',
            eval_count: obj.eval_count ?? 0,
            eval_duration_ms: Math.round((obj.eval_duration ?? 0) / 1e6),
            total_duration_ms: Math.round((obj.total_duration ?? 0) / 1e6),
          });
        }
      }
    });

    res.on('end', () => {
      if (aborted) return;
      if (!doneFired) {
        onDone?.({ done_reason: 'eos', eval_count: 0, eval_duration_ms: 0, total_duration_ms: 0 });
      }
    });

    res.on('error', (err) => {
      if (!aborted) onError?.(err);
    });
  });

  req.on('error', (err) => {
    if (!aborted) onError?.(err);
  });

  req.write(body);
  req.end();

  return {
    abort() {
      aborted = true;
      req.destroy();
    },
  };
}

export function chatOnce({ messages, options = {}, format = 'json', timeoutMs = 60000 }) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      messages,
      stream: false,
      ...(format ? { format } : {}),
      options: { temperature: 0.2, num_predict: 1024, num_gpu: -1, ...options },
    });
    const req = http.request(
      {
        hostname: HOST, port: PORT, path: '/oth-path', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), Connection: 'close' },
      },
      (res) => {
        let buf = '';
        res.setEncoding('utf8');
        res.on('data', (c) => (buf += c));
        res.on('end', () => {
          if (res.statusCode !== 200) return reject(new Error(`ollama ${res.statusCode}: ${buf.slice(0, 300)}`));
          try { resolve(JSON.parse(buf)?.message?.content ?? ''); }
          catch (e) { reject(new Error('ollama JSON parse 실패: ' + (e?.message ?? e))); }
        });
        res.on('error', reject);
      },
    );
    req.setTimeout(timeoutMs, () => { req.destroy(new Error('ollama chatOnce timeout')); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
