const v_6adf3a = (v_f2d7a9) => document.querySelector(v_f2d7a9);
const v_44365b = v_6adf3a('#messages');
const v_9e2838 = v_6adf3a('#composer');
const v_bbda62 = v_6adf3a('#input');
const v_7fad31 = v_6adf3a('#sendBtn');
const v_87b7ea = v_6adf3a('#status');
const v_dfb220 = v_6adf3a('#personaName');
const v_e92e25 = v_6adf3a('#personaSub');
const v_b74a53 = v_6adf3a('#resetBtn');

const v_371185 = 'afterlife.testbed.history.v0';
let v_10740d = [];
let v_15718d = null;

(async () => {
  try {
    const v_8f00b9 = await fetch('/oth-path');
    if (v_8f00b9.ok) {
      const v_e2a85c = await v_8f00b9.json();
      v_dfb220.textContent = v_e2a85c.displayName ?? '페르소나';
      v_e92e25.textContent = `${v_e2a85c.relation ?? ''} · v0 testbed`;
    }
  } catch {}
  v_072d50();
  if (v_10740d.length === 0) {
    v_144fe8('them', '아구 우리 강아지, 오랜만이다. 잘 지냈나? 뭐든 편하게 말해라.');
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
  v_10740d = [];
  sessionStorage.removeItem(v_371185);
  v_44365b.innerHTML = '';
  v_144fe8('them', '아구 우리 강아지, 오랜만이다. 잘 지냈나? 뭐든 편하게 말해라.');
  v_5193f8('대화 초기화 됨');
  setTimeout(() => v_5193f8(''), 1500);
});

v_9e2838.addEventListener('submit', async (v_9e86fd) => {
  v_9e86fd.preventDefault();
  if (v_7fad31.disabled) return;
  const v_9b6134 = v_bbda62.value.trim();
  if (!v_9b6134) return;

  v_144fe8('self', v_9b6134);
  v_bbda62.value = '';
  v_bbda62.style.height = 'auto';
  v_7fad31.disabled = true;
  v_5193f8('할매가 생각 중…');

  const v_2ea79a = v_144fe8('them', '', { skipPersist: true });
  v_2ea79a.classList.add('streaming');
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
        } else if (v_d48baf === 'done') {
          v_5193f8(`(${v_931bf0.eval_count ?? 0} tok / ${(v_931bf0.total_duration_ms ?? 0) / 1000 | 0}s)`);
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
    v_7fad31.disabled = false;
    v_15718d = null;
    setTimeout(() => v_5193f8(''), 4000);
    v_bbda62.focus();
  }
});
