const $ = (sel) => document.querySelector(sel);
const messagesEl = $('#messages');
const composer = $('#composer');
const input = $('#input');
const sendBtn = $('#sendBtn');
const statusEl = $('#status');
const personaName = $('#personaName');
const personaSub = $('#personaSub');
const resetBtn = $('#resetBtn');

const HISTORY_KEY = 'afterlife.testbed.history.v0';
let history = [];
let aborter = null;

(async () => {
  try {
    const res = await fetch('/oth-path');
    if (res.ok) {
      const p = await res.json();
      personaName.textContent = p.displayName ?? '페르소나';
      personaSub.textContent = `${p.relation ?? ''} · v0 testbed`;
    }
  } catch {}
  loadHistory();
  if (history.length === 0) {
    addMessage('them', '아구 우리 강아지, 오랜만이다. 잘 지냈나? 뭐든 편하게 말해라.');
  }
})();

function loadHistory() {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return;
    history = arr;
    for (const m of arr) {
      addMessage(m.role === 'user' ? 'self' : 'them', m.content, { skipPersist: true });
    }
  } catch {}
}

function persistHistory() {
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-20)));
  } catch {}
}

function addMessage(side, text, opts = {}) {
  const el = document.createElement('div');
  el.className = `bubble ${side}`;
  el.textContent = text;
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  if (!opts.skipPersist) {
    history.push({ role: side === 'self' ? 'user' : 'assistant', content: text });
    persistHistory();
  }
  return el;
}

function setStatus(t) {
  statusEl.textContent = t ?? '';
}

input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, window.innerHeight * 0.3) + 'px';
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    composer.requestSubmit();
  }
});

resetBtn.addEventListener('click', () => {
  if (aborter) aborter.abort();
  history = [];
  sessionStorage.removeItem(HISTORY_KEY);
  messagesEl.innerHTML = '';
  addMessage('them', '아구 우리 강아지, 오랜만이다. 잘 지냈나? 뭐든 편하게 말해라.');
  setStatus('대화 초기화 됨');
  setTimeout(() => setStatus(''), 1500);
});

composer.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (sendBtn.disabled) return;
  const text = input.value.trim();
  if (!text) return;

  addMessage('self', text);
  input.value = '';
  input.style.height = 'auto';
  sendBtn.disabled = true;
  setStatus('할매가 생각 중…');

  const themEl = addMessage('them', '', { skipPersist: true });
  themEl.classList.add('streaming');
  let acc = '';

  aborter = new AbortController();
  try {
    const res = await fetch('/oth-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: history.slice(0, -1) }),
      signal: aborter.signal,
    });
    if (!res.ok || !res.body) throw new Error(`server ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buf = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let sepIdx;
      while ((sepIdx = buf.indexOf('\n\n')) >= 0) {
        const evtBlock = buf.slice(0, sepIdx);
        buf = buf.slice(sepIdx + 2);
        const lines = evtBlock.split('\n');
        let event = 'message', data = '';
        for (const ln of lines) {
          if (ln.startsWith('event:')) event = ln.slice(6).trim();
          else if (ln.startsWith('data:')) data += ln.slice(5).trim();
        }
        if (!data) continue;
        let payload;
        try { payload = JSON.parse(data); } catch { continue; }
        if (event === 'chunk' && payload.text) {
          acc += payload.text;
          themEl.textContent = acc;
          messagesEl.scrollTop = messagesEl.scrollHeight;
        } else if (event === 'done') {
          setStatus(`(${payload.eval_count ?? 0} tok / ${(payload.total_duration_ms ?? 0) / 1000 | 0}s)`);
        } else if (event === 'error') {
          throw new Error(payload.error ?? 'stream error');
        }
      }
    }
    history.push({ role: 'assistant', content: acc });
    persistHistory();
  } catch (err) {
    if (err?.name === 'AbortError') {
      setStatus('중단됨');
    } else {
      themEl.classList.add('error');
      themEl.textContent = `(에러) ${err.message}`;
      setStatus('');
    }
  } finally {
    themEl.classList.remove('streaming');
    sendBtn.disabled = false;
    aborter = null;
    setTimeout(() => setStatus(''), 4000);
    input.focus();
  }
});
