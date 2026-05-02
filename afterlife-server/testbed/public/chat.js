const v_6adf3a = (v_f2d7a9) => document.querySelector(v_f2d7a9);
const v_44365b = v_6adf3a('#messages');
const v_9e2838 = v_6adf3a('#composer');
const v_bbda62 = v_6adf3a('#input');
const v_7fad31 = v_6adf3a('#sendBtn');
const v_87b7ea = v_6adf3a('#status');
const v_dfb220 = v_6adf3a('#personaName');
const v_e92e25 = v_6adf3a('#personaSub');
const v_b74a53 = v_6adf3a('#resetBtn');
const v_fcca65 = v_6adf3a('#ttsToggleBtn');
const v_538921 = v_6adf3a('#ttsPlayer');

const v_371185 = 'afterlife.testbed.history.v0';
const v_ee7dca = 'afterlife.testbed.tts.enabled';

const v_eb0716 = 'afterlife.testbed.persona.id';
let v_10740d = [];
let v_15718d = null;

let v_3f0d23 = localStorage.getItem(v_ee7dca) !== 'false';

let v_110c0c = null;

let v_76e948 = '';

const v_9725b8 = [];
const v_72f3e5 = new Map();
let v_61c108 = 1;
let v_087c92 = false;
let v_0ce149 = null;

function v_fac85e() {
  v_9725b8.length = 0;
  v_72f3e5.clear();
  v_61c108 = 1;
  v_087c92 = false;
  v_76e948 = '';
  if (v_538921) {
    try { v_538921.pause(); } catch {}
    v_538921.removeAttribute('src');
    try { v_538921.load(); } catch {}
  }
  if (v_0ce149) {
    URL.revokeObjectURL(v_0ce149);
    v_0ce149 = null;
  }
  if (v_110c0c) {
    v_110c0c.dataset.tts = 'done';
  }
}

function v_9cc8d1(v_931bf0) {
  if (!v_3f0d23) return;
  if (!v_931bf0 || typeof v_931bf0.seq !== 'number' || !v_931bf0.audio_b64) return;
  v_72f3e5.set(v_931bf0.seq, v_931bf0);
  while (v_72f3e5.has(v_61c108)) {
    v_9725b8.push(v_72f3e5.get(v_61c108));
    v_72f3e5.delete(v_61c108);
    v_61c108++;
  }

  v_e2caee();
  v_8e7e15();
}

function v_e2caee() {

  if (!v_087c92 && v_9725b8.length > 0) {
    v_5193f8(`(♪ 대기 ${v_9725b8.length}개)`);
  }
}

function v_8e7e15() {
  if (!v_538921 || v_087c92) return;
  if (v_9725b8.length === 0) {
    if (v_110c0c && v_110c0c.dataset.tts === 'playing') {
      v_110c0c.dataset.tts = 'done';
    }
    return;
  }
  const v_8c0b26 = v_9725b8.shift();
  v_087c92 = true;

  if (v_110c0c) v_110c0c.dataset.tts = 'playing';
  try {
    const v_d8cac9 = atob(v_8c0b26.audio_b64);
    const v_d0c056 = new Uint8Array(v_d8cac9.length);
    for (let v_ebec57 = 0; v_ebec57 < v_d8cac9.length; v_ebec57++) v_d0c056[v_ebec57] = v_d8cac9.charCodeAt(v_ebec57);
    const v_3263c7 = new Blob([v_d0c056], { type: 'audio/wav' });
    const v_f71b56 = URL.createObjectURL(v_3263c7);
    if (v_0ce149) URL.revokeObjectURL(v_0ce149);
    v_0ce149 = v_f71b56;
    v_538921.src = v_f71b56;
    v_538921.onended = () => {
      v_087c92 = false;
      if (v_0ce149) {
        URL.revokeObjectURL(v_0ce149);
        v_0ce149 = null;
      }
      v_8e7e15();
    };
    v_538921.onerror = () => {
      console.warn('audio error', v_538921.error);
      v_087c92 = false;
      v_8e7e15();
    };

    const v_c83285 = v_8c0b26.seq + v_9725b8.length;
    v_76e948 = `synth ${v_8c0b26.synth_ms}ms / ${(v_8c0b26.bytes >> 10)}KB`;
    v_5193f8(`(♪ ${v_8c0b26.seq}/${v_c83285} · ${v_76e948})`);
    const v_623d74 = v_538921.play();
    if (v_623d74 && typeof v_623d74.catch === 'function') {
      v_623d74.catch((v_49263d) => {
        console.warn('audio play failed:', v_49263d);
        v_087c92 = false;
        v_8e7e15();
      });
    }
  } catch (v_49263d) {
    console.warn('audio decode failed:', v_49263d);
    v_087c92 = false;
    v_8e7e15();
  }
}

function v_d0f32d() {
  if (!v_fcca65) return;
  v_fcca65.textContent = v_3f0d23 ? '🔊' : '🔇';
  v_fcca65.setAttribute('aria-pressed', v_3f0d23 ? 'true' : 'false');
  v_fcca65.title = v_3f0d23 ? '음성 on (눌러서 끄기)' : '음성 off (눌러서 켜기)';
}

(async () => {
  let v_1e5bc0 = false;
  let v_c4eaa2 = '아이고 우리 손녀딸, 잘 지냈어? 할배는 잘 있다. 오늘 뭐 하다 왔어?';
  try {
    const v_8f00b9 = await fetch('/oth-path');
    if (v_8f00b9.ok) {
      const v_e2a85c = await v_8f00b9.json();
      v_dfb220.textContent = v_e2a85c.displayName ?? '페르소나';
      v_e92e25.textContent = `${v_e2a85c.relation ?? ''} · v0 testbed`;

      if (v_e2a85c.id) {
        const v_5885b8 = localStorage.getItem(v_eb0716);
        if (v_5885b8 && v_5885b8 !== v_e2a85c.id) {
          v_1e5bc0 = true;

          sessionStorage.removeItem(v_371185);
          v_10740d = [];
          v_44365b.innerHTML = '';
          v_110c0c = null;
        }
        localStorage.setItem(v_eb0716, v_e2a85c.id);
      }
    }
  } catch {}
  if (!v_1e5bc0) {
    v_072d50();
  }
  if (v_10740d.length === 0) {
    v_144fe8('them', v_c4eaa2);
  }
  if (v_1e5bc0) {
    v_5193f8('페르소나가 바뀌어 대화를 새로 시작합니다');
    setTimeout(() => v_5193f8(''), 3000);
  }
})();

function v_072d50() {
  try {
    const v_479f05 = sessionStorage.getItem(v_371185);
    if (!v_479f05) return;
    const v_d0c056 = JSON.parse(v_479f05);
    if (!Array.isArray(v_d0c056)) return;
    v_10740d = v_d0c056;
    for (const v_35f85c of v_d0c056) {
      v_144fe8(v_35f85c.role === 'user' ? 'self' : 'them', v_35f85c.content, { skipPersist: true });
    }
  } catch {}
}

function v_0aa753() {
  try {
    sessionStorage.setItem(v_371185, JSON.stringify(v_10740d.slice(-20)));
  } catch {}
}

function v_144fe8(v_fceac7, v_9b6134, v_328259 = {}) {
  const v_57c92e = document.createElement('div');
  v_57c92e.className = `bubble ${v_fceac7}`;
  v_57c92e.textContent = v_9b6134;
  v_44365b.appendChild(v_57c92e);
  v_44365b.scrollTop = v_44365b.scrollHeight;
  if (!v_328259.skipPersist) {
    v_10740d.push({ role: v_fceac7 === 'self' ? 'user' : 'assistant', content: v_9b6134 });
    v_0aa753();
  }
  return v_57c92e;
}

function v_5193f8(v_8d41d7) {
  v_87b7ea.textContent = v_8d41d7 ?? '';
}

v_bbda62.addEventListener('input', () => {
  v_bbda62.style.height = 'auto';
  v_bbda62.style.height = Math.min(v_bbda62.scrollHeight, window.innerHeight * 0.3) + 'px';
});

v_bbda62.addEventListener('keydown', (v_9e86fd) => {
  if (v_9e86fd.key === 'Enter' && !v_9e86fd.shiftKey && !v_9e86fd.isComposing) {
    v_9e86fd.preventDefault();
    v_9e2838.requestSubmit();
  }
});

v_b74a53.addEventListener('click', () => {
  if (v_15718d) v_15718d.abort();
  v_fac85e();
  v_10740d = [];
  sessionStorage.removeItem(v_371185);
  v_44365b.innerHTML = '';
  v_110c0c = null;
  v_144fe8('them', '아이고 우리 손녀딸, 잘 지냈어? 할배는 잘 있다. 오늘 뭐 하다 왔어?');
  v_5193f8('대화 초기화 됨');
  setTimeout(() => v_5193f8(''), 1500);
});

if (v_fcca65) {
  v_d0f32d();
  v_fcca65.addEventListener('click', () => {
    v_3f0d23 = !v_3f0d23;
    localStorage.setItem(v_ee7dca, v_3f0d23 ? 'true' : 'false');
    v_d0f32d();
    if (!v_3f0d23) {

      v_fac85e();
      v_5193f8('음성 off');
    } else {
      v_5193f8('음성 on');
    }
    setTimeout(() => v_5193f8(''), 1500);
  });
}

const v_70a432 = 'afterlife.testbed.live.unmuted';

(function v_db32ce() {
  const v_d0868b = document.getElementById('liveVideo');

  const v_efd76b = document.getElementById('liveAudio');
  const v_fe6a8a = document.getElementById('liveStatus');
  const v_a3702d = document.getElementById('liveUnmuteBtn');
  if (!v_d0868b || !v_fe6a8a) return;

  const v_dd5d8d = localStorage.getItem(v_70a432) === 'true';
  let v_c35133 = false;

  if (v_efd76b) {
    v_efd76b.muted = true; 
    v_efd76b.volume = 1.0;
  }

  function v_964a78() {
    if (!v_a3702d) return;

    const v_abacaa = v_efd76b ? !v_efd76b.muted : !v_d0868b.muted;
    v_a3702d.setAttribute('aria-pressed', v_abacaa ? 'true' : 'false');
    v_a3702d.textContent = v_abacaa ? '🔊 음성 켬' : '🔇 음성 켜기';
    v_a3702d.title = v_abacaa ? '할배 음성 끄기' : '할배 음성 켜기';
  }

  if (v_a3702d) {
    v_964a78();
    v_a3702d.addEventListener('click', async () => {
      v_c35133 = true;

      const v_5f5d6d = v_efd76b || v_d0868b;
      const v_f0afbf = v_5f5d6d.muted; 
      v_5f5d6d.muted = !v_f0afbf;
      localStorage.setItem(v_70a432, v_5f5d6d.muted ? 'false' : 'true');
      if (!v_5f5d6d.muted) {
        try { await v_5f5d6d.play(); } catch (v_9e86fd) { console.warn('live unmute play err', v_9e86fd); }

      }
      v_964a78();
    });
  }

  const v_506dd1 = [
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.l.google.com:19302' },
  ];

  let v_12cd99 = null;
  let v_4c6dd7 = false;

  function v_d4754e(v_fd5f43, v_9b6134) {
    v_fe6a8a.dataset.s = v_fd5f43;
    v_fe6a8a.textContent = v_9b6134;
  }

  async function v_85e77a() {
    if (v_4c6dd7) return;
    v_4c6dd7 = true;
    v_d4754e('connecting', 'Live 연결 중…');

    try {
      const v_cb35cb = await fetch('/oth-path', { cache: 'no-store' });
      const v_9390e8 = await v_cb35cb.json().catch(() => ({}));
      if (!v_cb35cb.ok || v_9390e8.state !== 'publishing') {
        v_d4754e('idle', `Live 대기 (publisher ${v_9390e8.state ?? '?'})`);
        v_4c6dd7 = false;

        setTimeout(v_85e77a, 5000);
        return;
      }
    } catch (v_49263d) {
      v_d4754e('error', 'Live publisher 확인 실패');
      v_4c6dd7 = false;
      setTimeout(v_85e77a, 5000);
      return;
    }

    v_d4754e('connecting', 'Live 연결 중…');
    v_12cd99 = new RTCPeerConnection({ iceServers: v_506dd1 });

    try { window.__livePc = v_12cd99; } catch (v_37eab7) {}

    v_12cd99.ontrack = (v_1d299c) => {

      const v_94302c = v_1d299c.track && v_1d299c.track.kind;
      let v_5f5d6d = v_d0868b;
      if (v_94302c === 'audio' && v_efd76b) v_5f5d6d = v_efd76b;
      let v_d799e2 = v_5f5d6d.srcObject;
      if (!v_d799e2 || !(v_d799e2 instanceof MediaStream)) {
        v_d799e2 = new MediaStream();
        v_5f5d6d.srcObject = v_d799e2;
      }
      const v_3c8572 = v_d799e2.getTracks().some((v_8d41d7) => v_8d41d7.id === v_1d299c.track.id);
      if (!v_3c8572) v_d799e2.addTrack(v_1d299c.track);
      v_5f5d6d.play().catch(() => {});

      if (v_94302c === 'audio' && v_efd76b && v_dd5d8d && v_c35133 && v_efd76b.muted) {
        v_efd76b.muted = false;
        v_efd76b.play().catch(() => {
          v_efd76b.muted = true;
          v_964a78();
        });
        v_964a78();
      }
    };

    v_12cd99.oniceconnectionstatechange = () => {
      if (!v_12cd99) return;
      const v_fd5f43 = v_12cd99.iceConnectionState;
      if (v_fd5f43 === 'connected' || v_fd5f43 === 'completed') v_d4754e('playing', 'Live 재생 중');
      else if (v_fd5f43 === 'failed') v_d4754e('error', 'Live 연결 실패');
      else if (v_fd5f43 === 'disconnected') v_d4754e('error', 'Live 연결 끊김');
      else if (v_fd5f43 === 'closed') v_d4754e('idle', 'Live 종료');
    };

    v_12cd99.onconnectionstatechange = () => {
      if (!v_12cd99) return;
      const v_fd5f43 = v_12cd99.connectionState;
      if (v_fd5f43 === 'connected') v_d4754e('playing', 'Live 재생 중');
      if (v_fd5f43 === 'failed') v_d4754e('error', 'Live 연결 실패');
    };

    let v_4cb70c;
    try {
      const v_cb35cb = await fetch('/oth-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      v_4cb70c = await v_cb35cb.json().catch(() => ({}));
      if (!v_cb35cb.ok) {
        v_d4754e('error', `Live subscribe 실패 (${v_cb35cb.status})`);
        v_ae13b6();
        return;
      }
    } catch (v_49263d) {
      v_d4754e('error', 'Live subscribe 요청 실패');
      v_ae13b6();
      return;
    }

    const v_5bd2a8 = v_4cb70c.subscriber_session_id;
    const v_582c5e = v_4cb70c.offer_sdp;
    if (!v_5bd2a8 || !v_582c5e) {
      v_d4754e('error', 'Live subscribe 응답 누락');
      v_ae13b6();
      return;
    }

    try {
      await v_12cd99.setRemoteDescription({ type: 'offer', sdp: v_582c5e });
      const v_343c90 = await v_12cd99.createAnswer();
      await v_12cd99.setLocalDescription(v_343c90);

      const v_cb35cb = await fetch('/oth-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriber_session_id: v_5bd2a8,
          answer_sdp: v_343c90.sdp,
        }),
      });
      if (!v_cb35cb.ok) {
        const v_3dff88 = await v_cb35cb.json().catch(() => ({}));
        v_d4754e('error', `Live renegotiate 실패 (${v_cb35cb.status})`);
        console.warn('renegotiate error', v_3dff88);
        v_ae13b6();
        return;
      }
    } catch (v_49263d) {
      v_d4754e('error', 'Live SDP 교환 실패');
      console.warn(v_49263d);
      v_ae13b6();
      return;
    }

    if (
      v_12cd99 &&
      v_12cd99.iceConnectionState !== 'connected' &&
      v_12cd99.iceConnectionState !== 'completed'
    ) {
      v_d4754e('connecting', 'Live ICE 협상 중…');
    }
  }

  function v_ae13b6() {
    if (v_12cd99) {
      try { v_12cd99.close(); } catch (v_37eab7) {}
      v_12cd99 = null;
    }
    if (v_d0868b.srcObject) {
      try { v_d0868b.srcObject.getTracks().forEach((v_8d41d7) => v_8d41d7.stop()); } catch (v_37eab7) {}
      v_d0868b.srcObject = null;
    }
    if (v_efd76b && v_efd76b.srcObject) {
      try { v_efd76b.srcObject.getTracks().forEach((v_8d41d7) => v_8d41d7.stop()); } catch (v_37eab7) {}
      v_efd76b.srcObject = null;
    }
    v_4c6dd7 = false;
  }

  v_85e77a();
})();

v_9e2838.addEventListener('submit', async (v_9e86fd) => {
  v_9e86fd.preventDefault();
  if (v_7fad31.disabled) return;
  const v_9b6134 = v_bbda62.value.trim();
  if (!v_9b6134) return;

  v_fac85e();

  v_144fe8('self', v_9b6134);
  v_bbda62.value = '';
  v_bbda62.style.height = 'auto';
  v_7fad31.disabled = true;
  v_5193f8('할배가 생각 중…');

  const v_2ea79a = v_144fe8('them', '', { skipPersist: true });
  v_2ea79a.classList.add('streaming');
  v_2ea79a.dataset.tts = v_3f0d23 ? 'pending' : 'off';
  v_110c0c = v_2ea79a;
  let v_9f1d92 = '';

  v_15718d = new AbortController();
  try {
    const v_8f00b9 = await fetch('/oth-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: v_9b6134, history: v_10740d.slice(0, -1) }),
      signal: v_15718d.signal,
    });
    if (!v_8f00b9.ok || !v_8f00b9.body) throw new Error(`server ${v_8f00b9.status}`);

    const v_f47a40 = v_8f00b9.body.getReader();
    const v_d2f56d = new TextDecoder('utf-8');
    let v_83ee53 = '';
    while (true) {
      const { value: v_3b402b, done: v_2fb8cc } = await v_f47a40.read();
      if (v_2fb8cc) break;
      v_83ee53 += v_d2f56d.decode(v_3b402b, { stream: true });
      let v_af9935;
      while ((v_af9935 = v_83ee53.indexOf('\n\n')) >= 0) {
        const v_6fd8a8 = v_83ee53.slice(0, v_af9935);
        v_83ee53 = v_83ee53.slice(v_af9935 + 2);
        const v_a52412 = v_6fd8a8.split('\n');
        let v_d48baf = 'message', v_9390e8 = '';
        for (const v_765c3e of v_a52412) {
          if (v_765c3e.startsWith('event:')) v_d48baf = v_765c3e.slice(6).trim();
          else if (v_765c3e.startsWith('data:')) v_9390e8 += v_765c3e.slice(5).trim();
        }
        if (!v_9390e8) continue;
        let v_931bf0;
        try { v_931bf0 = JSON.parse(v_9390e8); } catch { continue; }
        if (v_d48baf === 'chunk' && v_931bf0.text) {
          v_9f1d92 += v_931bf0.text;
          v_2ea79a.textContent = v_9f1d92;
          v_44365b.scrollTop = v_44365b.scrollHeight;
        } else if (v_d48baf === 'tts') {
          v_9cc8d1(v_931bf0);
        } else if (v_d48baf === 'tts_error') {
          console.warn('tts error:', v_931bf0);
        } else if (v_d48baf === 'done') {

          v_5193f8(`(${v_931bf0.eval_count ?? 0} tok / ${(v_931bf0.total_duration_ms ?? 0) / 1000 | 0}s · 영상 합성 중…)`);
        } else if (v_d48baf === 'video' && v_931bf0.url) {

          const v_81e2ef = document.createElement('video');
          v_81e2ef.src = v_931bf0.url;
          v_81e2ef.controls = true;
          v_81e2ef.autoplay = true;
          v_81e2ef.playsInline = true;
          v_81e2ef.preload = 'auto';
          v_81e2ef.className = 'reply-video';
          v_2ea79a.appendChild(v_81e2ef);
          v_44365b.scrollTop = v_44365b.scrollHeight;
          const v_b6a7e0 = Math.max(0, (v_931bf0.infer_ms ?? 0) / 1000) | 0;
          v_5193f8(`(영상 도착 · ${v_b6a7e0}s)`);
          setTimeout(() => v_5193f8(''), 4000);
        } else if (v_d48baf === 'video_error') {
          console.warn('video error:', v_931bf0);
          v_5193f8(`(영상 합성 실패: ${v_931bf0.error ?? '?'})`);
          setTimeout(() => v_5193f8(''), 4000);
        } else if (v_d48baf === 'error') {
          throw new Error(v_931bf0.error ?? 'stream error');
        }
      }
    }
    v_10740d.push({ role: 'assistant', content: v_9f1d92 });
    v_0aa753();
  } catch (v_49263d) {
    if (v_49263d?.name === 'AbortError') {
      v_5193f8('중단됨');
    } else {
      v_2ea79a.classList.add('error');
      v_2ea79a.textContent = `(에러) ${v_49263d.message}`;
      v_5193f8('');
    }
  } finally {
    v_2ea79a.classList.remove('streaming');

    if (!v_087c92 && v_9725b8.length === 0) {
      v_2ea79a.dataset.tts = v_3f0d23 ? 'done' : 'off';
    }
    v_7fad31.disabled = false;
    v_15718d = null;
    setTimeout(() => v_5193f8(''), 4000);
    v_bbda62.focus();
  }
});
