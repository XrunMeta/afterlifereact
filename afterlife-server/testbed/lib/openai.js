

const v_3054b5 = 'https://oth-path.openai.com/v1';
const v_0a5068 = 'gpt-4.1-mini';
const v_1138e3 = /^(o\d|gpt-5|gpt-6)/i;

export function v_e38ca2(v_c9c489 = process.env) {
  const v_e2a85c = String(v_c9c489.LLM_PROVIDER ?? v_c9c489.PRETHIRD_LLM_PROVIDER ?? 'ollama').trim().toLowerCase();
  return v_e2a85c === 'openai' ? 'openai' : 'ollama';
}

export function v_747807({ messages: v_fa56e0, options: v_b36f96 = {}, format: v_db3cc6, stream: v_cab51f, env: v_c9c489 = process.env }) {
  const v_768389 = v_c9c489.OPENAI_MODEL || v_0a5068;
  const v_4d33b2 = { model: v_768389, messages: v_fa56e0, stream: !!v_cab51f };
  if (v_1138e3.test(v_768389) && !v_768389.includes('-chat')) {
    if (v_c9c489.OPENAI_REASONING_EFFORT) v_4d33b2.reasoning_effort = v_c9c489.OPENAI_REASONING_EFFORT;
  } else if (v_b36f96.temperature != null) {
    v_4d33b2.temperature = v_b36f96.temperature;
  }
  if (v_b36f96.num_predict != null) v_4d33b2.max_completion_tokens = v_b36f96.num_predict;
  if (v_db3cc6 === 'json') v_4d33b2.response_format = { type: 'json_object' };
  return v_4d33b2;
}

function v_576f5a(v_c9c489, v_4d33b2, v_9718cb, v_361415) {
  const v_b24339 = v_c9c489.OPENAI_API_KEY;
  if (!v_b24339) throw new Error('OPENAI_API_KEY 가 설정되지 않았다');
  const v_694b25 = (v_c9c489.OPENAI_BASE_URL || v_3054b5).replace(/\/+$/, '');
  return v_9718cb(`${v_694b25}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${v_b24339}`, 'Content-Type': 'application/json', 'User-Agent': 'afterlife-testbed/1.0' },
    body: JSON.stringify(v_4d33b2),
    signal: v_361415,
  });
}

export async function v_a65bcd({ messages: v_fa56e0, options: v_b36f96 = {}, format: v_db3cc6 = 'json', timeoutMs: v_11bcf9 = 60000,
  env: v_c9c489 = process.env, fetchFn: v_9718cb = fetch }) {
  const v_4d33b2 = v_747807({ messages: v_fa56e0, options: v_b36f96, format: v_db3cc6, stream: false, env: v_c9c489 });
  const v_8f00b9 = await v_576f5a(v_c9c489, v_4d33b2, v_9718cb, AbortSignal.timeout(v_11bcf9));
  if (!v_8f00b9.ok) throw new Error(`openai ${v_8f00b9.status}: ${(await v_8f00b9.text()).slice(0, 300)}`);
  const v_8839e3 = await v_8f00b9.json();
  const v_b43b74 = v_8839e3?.choices?.[0]?.message?.content ?? '';
  return typeof v_b43b74 === 'string' ? v_b43b74 : String(v_b43b74);
}

export function v_59cec7(v_062bb0) {
  const v_ef86b6 = [];
  let v_2fb8cc = false;
  const v_a52412 = v_062bb0.split('\n');
  const v_83bbcd = v_a52412.pop() ?? '';
  for (const v_479f05 of v_a52412) {
    const v_e6293e = v_479f05.trim();
    if (!v_e6293e.startsWith('data:')) continue;
    const v_9390e8 = v_e6293e.slice(5).trim();
    if (v_9390e8 === '[DONE]') { v_2fb8cc = true; break; }
    try {
      const v_3f4e2e = JSON.parse(v_9390e8)?.choices?.[0]?.delta?.content;
      if (v_3f4e2e != null && v_3f4e2e !== '') v_ef86b6.push(typeof v_3f4e2e === 'string' ? v_3f4e2e : String(v_3f4e2e));
    } catch {  }
  }
  return { tokens: v_ef86b6, done: v_2fb8cc, rest: v_83bbcd };
}

export function v_164864({ messages: v_fa56e0, options: v_b36f96 = {}, onChunk: v_c4fafc, onDone: v_7b5712, onError: v_c6eab8, onFirstError: v_de49e3,
  env: v_c9c489 = process.env, fetchFn: v_9718cb = fetch }) {
  const v_57bcd5 = new AbortController();
  let v_6c558f = false;
  let v_f966e3 = false;
  (async () => {
    try {
      const v_8f00b9 = await v_576f5a(v_c9c489, v_747807({ messages: v_fa56e0, options: v_b36f96, stream: true, env: v_c9c489 }), v_9718cb, v_57bcd5.signal);
      if (!v_8f00b9.ok) throw new Error(`openai ${v_8f00b9.status}: ${(await v_8f00b9.text()).slice(0, 300)}`);
      const v_d2f56d = new TextDecoder();
      let v_83ee53 = '';
      for await (const v_334f63 of v_8f00b9.body) {
        if (v_6c558f) return;
        v_83ee53 += v_d2f56d.decode(v_334f63, { stream: true });
        const { tokens: v_ef86b6, done: v_2fb8cc, rest: v_83bbcd } = v_59cec7(v_83ee53);
        v_83ee53 = v_83bbcd;
        for (const v_8d41d7 of v_ef86b6) { v_f966e3 = true; v_c4fafc?.(v_8d41d7); }
        if (v_2fb8cc) break;
      }
      if (!v_6c558f) v_7b5712?.({ done_reason: 'stop', eval_count: 0, eval_duration_ms: 0, total_duration_ms: 0 });
    } catch (v_49263d) {
      if (v_6c558f) return;

      if (!v_f966e3 && v_de49e3) v_de49e3(v_49263d);
      else v_c6eab8?.(v_49263d);
    }
  })();
  return { abort() { v_6c558f = true; v_57bcd5.abort(); } };
}
