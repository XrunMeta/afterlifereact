const $ = (sel) => document.querySelector(sel);
const messagesEl = $('#messages');
const composer = $('#composer');
const input = $('#input');
const sendBtn = $('#sendBtn');
const statusEl = $('#status');
const personaName = $('#personaName');
const personaSub = $('#personaSub');
const resetBtn = $('#resetBtn');
const ttsToggleBtn = $('#ttsToggleBtn');
const ttsPlayer = $('#ttsPlayer');

const HISTORY_KEY = 'afterlife.testbed.history.v0';
const TTS_KEY = 'afterlife.testbed.tts.enabled';
let history = [];
let aborter = null;

let ttsEnabled = localStorage.getItem(TTS_KEY) !== 'false';

let activeThemEl = null;

let lastSynthMeta = '';

const audioQueue = [];
const pendingBySeq = new Map();
let nextExpectedSeq = 1;
let isPlaying = false;
let currentObjectUrl = null;

function resetAudio() {
  audioQueue.length = 0;
  pendingBySeq.clear();
  nextExpectedSeq = 1;
  isPlaying = false;
  lastSynthMeta = '';
  if (ttsPlayer) {
    try { ttsPlayer.pause(); } catch {}
    ttsPlayer.removeAttribute('src');
    try { ttsPlayer.load(); } catch {}
  }
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
  if (activeThemEl) {
    activeThemEl.dataset.tts = 'done';
  }
}

function enqueueTTS(payload) {
  if (!ttsEnabled) return;
  if (!payload || typeof payload.seq !== 'number' || !payload.audio_b64) return;
  pendingBySeq.set(payload.seq, payload);
  while (pendingBySeq.has(nextExpectedSeq)) {
    audioQueue.push(pendingBySeq.get(nextExpectedSeq));
    pendingBySeq.delete(nextExpectedSeq);
    nextExpectedSeq++;
  }

  refreshQueueStatus();
  playNext();
}

function refreshQueueStatus() {

  if (!isPlaying && audioQueue.length > 0) {
    setStatus(`(♪ 대기 ${audioQueue.length}개)`);
  }
}

function playNext() {
  if (!ttsPlayer || isPlaying) return;
  if (audioQueue.length === 0) {
    if (activeThemEl && activeThemEl.dataset.tts === 'playing') {
      activeThemEl.dataset.tts = 'done';
    }
    return;
  }
  const item = audioQueue.shift();
  isPlaying = true;

  if (activeThemEl) activeThemEl.dataset.tts = 'playing';
  try {
    const bin = atob(item.audio_b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const blob = new Blob([arr], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = url;
    ttsPlayer.src = url;
    ttsPlayer.onended = () => {
      isPlaying = false;
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
        currentObjectUrl = null;
      }
      playNext();
    };
    ttsPlayer.onerror = () => {
      console.warn('audio error', ttsPlayer.error);
      isPlaying = false;
      playNext();
    };

    const total = item.seq + audioQueue.length;
    lastSynthMeta = `synth ${item.synth_ms}ms / ${(item.bytes >> 10)}KB`;
    setStatus(`(♪ ${item.seq}/${total} · ${lastSynthMeta})`);
    const playPromise = ttsPlayer.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch((err) => {
        console.warn('audio play failed:', err);
        isPlaying = false;
        playNext();
      });
    }
  } catch (err) {
    console.warn('audio decode failed:', err);
    isPlaying = false;
    playNext();
  }
}

function applyTTSToggleUI() {
  if (!ttsToggleBtn) return;
  ttsToggleBtn.textContent = ttsEnabled ? '🔊' : '🔇';
  ttsToggleBtn.setAttribute('aria-pressed', ttsEnabled ? 'true' : 'false');
  ttsToggleBtn.title = ttsEnabled ? '음성 on (눌러서 끄기)' : '음성 off (눌러서 켜기)';
}

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
  resetAudio();
  history = [];
  sessionStorage.removeItem(HISTORY_KEY);
  messagesEl.innerHTML = '';
  activeThemEl = null;
  addMessage('them', '아구 우리 강아지, 오랜만이다. 잘 지냈나? 뭐든 편하게 말해라.');
  setStatus('대화 초기화 됨');
  setTimeout(() => setStatus(''), 1500);
});

if (ttsToggleBtn) {
  applyTTSToggleUI();
  ttsToggleBtn.addEventListener('click', () => {
    ttsEnabled = !ttsEnabled;
    localStorage.setItem(TTS_KEY, ttsEnabled ? 'true' : 'false');
    applyTTSToggleUI();
    if (!ttsEnabled) {

      resetAudio();
      setStatus('음성 off');
    } else {
      setStatus('음성 on');
    }
    setTimeout(() => setStatus(''), 1500);
  });
}

composer.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (sendBtn.disabled) return;
  const text = input.value.trim();
  if (!text) return;

  resetAudio();

  addMessage('self', text);
  input.value = '';
  input.style.height = 'auto';
  sendBtn.disabled = true;
  setStatus('할매가 생각 중…');

  const themEl = addMessage('them', '', { skipPersist: true });
  themEl.classList.add('streaming');
  themEl.dataset.tts = ttsEnabled ? 'pending' : 'off';
  activeThemEl = themEl;
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
        } else if (event === 'tts') {
          enqueueTTS(payload);
        } else if (event === 'tts_error') {
          console.warn('tts error:', payload);
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

    if (!isPlaying && audioQueue.length === 0) {
      themEl.dataset.tts = ttsEnabled ? 'done' : 'off';
    }
    sendBtn.disabled = false;
    aborter = null;
    setTimeout(() => setStatus(''), 4000);
    input.focus();
  }
});
