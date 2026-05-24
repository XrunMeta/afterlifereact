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

const PERSONA_ID_KEY = 'afterlife.testbed.persona.id';
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
  let personaChanged = false;
  let greeting = '아이고 우리 손녀딸, 잘 지냈어? 할배는 잘 있다. 오늘 뭐 하다 왔어?';
  try {
    const res = await fetch('/oth-path');
    if (res.ok) {
      const p = await res.json();
      personaName.textContent = p.displayName ?? '페르소나';
      personaSub.textContent = `${p.relation ?? ''} · v0 testbed`;

      if (p.id) {
        const stored = localStorage.getItem(PERSONA_ID_KEY);
        if (stored && stored !== p.id) {
          personaChanged = true;

          sessionStorage.removeItem(HISTORY_KEY);
          history = [];
          messagesEl.innerHTML = '';
          activeThemEl = null;
        }
        localStorage.setItem(PERSONA_ID_KEY, p.id);
      }
    }
  } catch {}
  if (!personaChanged) {
    loadHistory();
  }
  if (history.length === 0) {
    addMessage('them', greeting);
  }
  if (personaChanged) {
    setStatus('페르소나가 바뀌어 대화를 새로 시작합니다');
    setTimeout(() => setStatus(''), 3000);
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
  addMessage('them', '아이고 우리 손녀딸, 잘 지냈어? 할배는 잘 있다. 오늘 뭐 하다 왔어?');
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

const LIVE_UNMUTE_KEY = 'afterlife.testbed.live.unmuted';

(function initLiveSubscribe() {
  const liveVideo = document.getElementById('liveVideo');

  const liveAudio = document.getElementById('liveAudio');
  const liveStatusEl = document.getElementById('liveStatus');
  const unmuteBtn = document.getElementById('liveUnmuteBtn');
  if (!liveVideo || !liveStatusEl) return;

  const stored = localStorage.getItem(LIVE_UNMUTE_KEY);
  const wantUnmuted = stored !== 'false';
  let userInteracted = false;

  function autoUnmuteOnFirstGesture() {
    userInteracted = true;
    if (!wantUnmuted) return;
    if (liveAudio && liveAudio.muted) {
      liveAudio.muted = false;
      liveAudio.play().catch(() => {
        liveAudio.muted = true;
      });
      localStorage.setItem(LIVE_UNMUTE_KEY, 'true');
      applyLiveUnmuteUI();
    }
  }
  document.addEventListener('pointerdown', autoUnmuteOnFirstGesture, { once: true });
  document.addEventListener('keydown', autoUnmuteOnFirstGesture, { once: true });

  if (liveAudio) {
    liveAudio.muted = true; 
    liveAudio.volume = 1.0;
  }

  function applyLiveUnmuteUI() {
    if (!unmuteBtn) return;

    const on = liveAudio ? !liveAudio.muted : !liveVideo.muted;
    unmuteBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    unmuteBtn.textContent = on ? '🔊 음성 켬' : '🔇 음성 켜기';
    unmuteBtn.title = on ? '할배 음성 끄기' : '할배 음성 켜기';
  }

  if (unmuteBtn) {
    applyLiveUnmuteUI();
    unmuteBtn.addEventListener('click', async () => {
      userInteracted = true;

      const target = liveAudio || liveVideo;
      const willUnmute = target.muted; 
      target.muted = !willUnmute;
      localStorage.setItem(LIVE_UNMUTE_KEY, target.muted ? 'false' : 'true');
      if (!target.muted) {
        try { await target.play(); } catch (e) { console.warn('live unmute play err', e); }

      }
      applyLiveUnmuteUI();
    });
  }

  const ICE_SERVERS = [
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.l.google.com:19302' },
  ];

  let pc = null;
  let started = false;

  function setLiveState(s, text) {
    liveStatusEl.dataset.s = s;
    liveStatusEl.textContent = text;
  }

  async function startLiveSubscribe() {
    if (started) return;
    started = true;
    setLiveState('connecting', 'Live 연결 중…');

    try {
      const r = await fetch('/oth-path', { cache: 'no-store' });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || data.state !== 'publishing') {
        setLiveState('idle', `Live 대기 (publisher ${data.state ?? '?'})`);
        started = false;

        setTimeout(startLiveSubscribe, 5000);
        return;
      }
    } catch (err) {
      setLiveState('error', 'Live publisher 확인 실패');
      started = false;
      setTimeout(startLiveSubscribe, 5000);
      return;
    }

    setLiveState('connecting', 'Live 연결 중…');
    pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    try { window.__livePc = pc; } catch (_) {}

    pc.ontrack = (ev) => {

      const kind = ev.track && ev.track.kind;
      let target = liveVideo;
      if (kind === 'audio' && liveAudio) target = liveAudio;
      let ms = target.srcObject;
      if (!ms || !(ms instanceof MediaStream)) {
        ms = new MediaStream();
        target.srcObject = ms;
      }
      const existing = ms.getTracks().some((t) => t.id === ev.track.id);
      if (!existing) ms.addTrack(ev.track);
      target.play().catch(() => {});

      if (kind === 'audio' && liveAudio && wantUnmuted && userInteracted && liveAudio.muted) {
        liveAudio.muted = false;
        liveAudio.play().catch(() => {
          liveAudio.muted = true;
          applyLiveUnmuteUI();
        });
        applyLiveUnmuteUI();
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (!pc) return;
      const s = pc.iceConnectionState;
      if (s === 'connected' || s === 'completed') setLiveState('playing', 'Live 재생 중');
      else if (s === 'failed') setLiveState('error', 'Live 연결 실패');
      else if (s === 'disconnected') setLiveState('error', 'Live 연결 끊김');
      else if (s === 'closed') setLiveState('idle', 'Live 종료');
    };

    pc.onconnectionstatechange = () => {
      if (!pc) return;
      const s = pc.connectionState;
      if (s === 'connected') setLiveState('playing', 'Live 재생 중');
      if (s === 'failed') setLiveState('error', 'Live 연결 실패');
    };

    let pull;
    try {
      const r = await fetch('/oth-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      pull = await r.json().catch(() => ({}));
      if (!r.ok) {
        setLiveState('error', `Live subscribe 실패 (${r.status})`);
        cleanupLive();
        return;
      }
    } catch (err) {
      setLiveState('error', 'Live subscribe 요청 실패');
      cleanupLive();
      return;
    }

    const subSid = pull.subscriber_session_id;
    const offerSdp = pull.offer_sdp;
    if (!subSid || !offerSdp) {
      setLiveState('error', 'Live subscribe 응답 누락');
      cleanupLive();
      return;
    }

    try {
      await pc.setRemoteDescription({ type: 'offer', sdp: offerSdp });
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const r = await fetch('/oth-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriber_session_id: subSid,
          answer_sdp: answer.sdp,
        }),
      });
      if (!r.ok) {
        const renego = await r.json().catch(() => ({}));
        setLiveState('error', `Live renegotiate 실패 (${r.status})`);
        console.warn('renegotiate error', renego);
        cleanupLive();
        return;
      }
    } catch (err) {
      setLiveState('error', 'Live SDP 교환 실패');
      console.warn(err);
      cleanupLive();
      return;
    }

    if (
      pc &&
      pc.iceConnectionState !== 'connected' &&
      pc.iceConnectionState !== 'completed'
    ) {
      setLiveState('connecting', 'Live ICE 협상 중…');
    }
  }

  function cleanupLive() {
    if (pc) {
      try { pc.close(); } catch (_) {}
      pc = null;
    }
    if (liveVideo.srcObject) {
      try { liveVideo.srcObject.getTracks().forEach((t) => t.stop()); } catch (_) {}
      liveVideo.srcObject = null;
    }
    if (liveAudio && liveAudio.srcObject) {
      try { liveAudio.srcObject.getTracks().forEach((t) => t.stop()); } catch (_) {}
      liveAudio.srcObject = null;
    }
    started = false;
  }

  startLiveSubscribe();
})();

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
  setStatus('할배가 생각 중…');

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

          setStatus(`(${payload.eval_count ?? 0} tok / ${(payload.total_duration_ms ?? 0) / 1000 | 0}s · 영상 합성 중…)`);
        } else if (event === 'video' && payload.url) {

          const a = document.createElement('a');
          a.href = payload.url;
          a.textContent = `📼 mp4 원본 (${payload.mp4_basename ?? 'video'})`;
          a.target = '_blank';
          a.rel = 'noopener';
          a.className = 'reply-mp4-link';
          themEl.appendChild(document.createElement('br'));
          themEl.appendChild(a);
          messagesEl.scrollTop = messagesEl.scrollHeight;
          const sec = Math.max(0, (payload.infer_ms ?? 0) / 1000) | 0;
          setStatus(`(영상 도착 · ${sec}s)`);
          setTimeout(() => setStatus(''), 4000);
        } else if (event === 'video_error') {
          console.warn('video error:', payload);
          setStatus(`(영상 합성 실패: ${payload.error ?? '?'})`);
          setTimeout(() => setStatus(''), 4000);
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
