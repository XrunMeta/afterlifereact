
let v_12cd99, v_32dc97;

function v_8fd199(v_fd5f43) {
  return String(v_fd5f43 ?? '').replace(/[&<>"']/g, (v_3f4e2e) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[v_3f4e2e]));
}

let v_2ca7e0 = null;

let v_201831 = '-', v_85930b = 0, v_bd0622 = false;

function v_5af772() {
  const v_187b90 = (typeof v_12cd99 !== 'undefined' && v_12cd99) ? v_12cd99.connectionState : '-';
  const v_1fe690 = (typeof v_32dc97 !== 'undefined' && v_32dc97) ? v_32dc97.readyState : '-';
  const v_f4678b = (v_abacaa) => `<span style="color:${v_abacaa ? 'var(--green)' : 'var(--text-dim)'}">●</span>`;
  const v_18b8bf = [
    [v_f4678b(v_187b90 === 'connected'), '연결', `pc:${v_187b90} · dc:${v_1fe690}`],
    [v_f4678b(!v_bd0622), '라이브', v_bd0622 ? '통화중(대기)' : 'idle'],
    [v_f4678b(v_201831 !== '-'), '마지막 say', v_201831],
    [v_f4678b(v_85930b > 0), '적용 knob', String(v_85930b)],
  ];
  document.getElementById('metrics-out').innerHTML =
    v_18b8bf.map(([v_1614db, v_0eb677, v_81e2ef]) => `<div class="meter-row">${v_1614db} <b>${v_0eb677}</b> <span>${v_8fd199(v_81e2ef)}</span></div>`).join('');
}

const v_81f9b1 = new Set(
  ["temperature", "top_p", "top_k", "repetition_penalty", "max_new_tokens"]);

async function v_182fdb() {
  const v_e0c7e8 = document.getElementById('login-email').value;
  const v_adc076 = document.getElementById('login-pw').value;
  const v_d308b5 = document.getElementById('login-status');
  v_d308b5.textContent = '로그인 중...';
  try {
    const v_cb35cb = await fetch('/login', {method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email: v_e0c7e8, password: v_adc076})});
    const v_4d33b2 = await v_cb35cb.json();
    if (!v_cb35cb.ok || !v_4d33b2.accessToken) {
      v_d308b5.textContent = '로그인 실패';
      return;
    }
    v_2ca7e0 = v_4d33b2.accessToken;
    v_d308b5.textContent = '로그인됨';
    await v_33cf24();
  } catch (v_9e86fd) {
    v_d308b5.textContent = '로그인 오류';
  }
}

async function v_33cf24() {
  const v_1712c9 = document.getElementById('clone-select');
  if (!v_2ca7e0) return;
  try {
    const v_cb35cb = await fetch('/oth-path', {headers: {'Authorization': `Bearer ${v_2ca7e0}`}});
    const v_4d33b2 = await v_cb35cb.json();
    v_1712c9.innerHTML = '<option value="">-- 클론 선택 --</option>';
    for (const v_3f4e2e of (v_4d33b2.clones || [])) {
      const v_68b2be = document.createElement('option');
      v_68b2be.value = String(v_3f4e2e.id);
      v_68b2be.textContent = v_3f4e2e.name || String(v_3f4e2e.id);
      v_1712c9.appendChild(v_68b2be);
    }
    v_1712c9.disabled = false;
    document.getElementById('connect-btn').disabled = false;
  } catch (v_9e86fd) {
    document.getElementById('login-status').textContent = '클론 목록 조회 실패';
  }
}

function v_20c5c2(v_12cd99) {
  if (v_12cd99.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((v_6f7712) => {
    const v_de130a = () => {
      if (v_12cd99.iceGatheringState === 'complete') {
        v_12cd99.removeEventListener('icegatheringstatechange', v_de130a);
        v_6f7712();
      }
    };
    v_12cd99.addEventListener('icegatheringstatechange', v_de130a);
    setTimeout(v_6f7712, 3000); 
  });
}

async function v_1857f4() {
  const v_1712c9 = document.getElementById('clone-select');
  const v_6e0fd3 = parseInt(v_1712c9.value, 10);
  const v_0b0398 = document.getElementById('conn-status');
  if (!v_6e0fd3 || !v_2ca7e0) {
    document.getElementById('login-status').textContent = '로그인·클론 선택 필요';
    return;
  }
  v_0b0398.textContent = '연결 중...';
  document.getElementById('connect-btn').disabled = true;
  document.getElementById('hangup-btn').disabled = false;
  v_12cd99 = new RTCPeerConnection();
  v_12cd99.addTransceiver('video', {direction: 'recvonly'});
  v_12cd99.addTransceiver('audio', {direction: 'recvonly'});
  v_12cd99.ontrack = (v_9e86fd) => { document.getElementById('clone-video').srcObject = v_9e86fd.streams[0]; };
  v_12cd99.onconnectionstatechange = () => {
    v_0b0398.textContent = `pc:${v_12cd99.connectionState} · dc:${v_32dc97 ? v_32dc97.readyState : '-'}`;
    v_5af772();
  };
  v_32dc97 = v_12cd99.createDataChannel('control');

  v_32dc97.onopen = () => {
    document.getElementById('say-input').disabled = false;
    document.getElementById('say-btn').disabled = false;
    v_0b0398.textContent = '✅ dc open — say 가능';
    v_5af772();
  };
  v_32dc97.onclose = () => { v_0b0398.textContent = 'dc closed'; v_5af772(); };
  v_32dc97.onerror = () => { v_0b0398.textContent = 'dc error'; };
  v_32dc97.onmessage = (v_9e86fd) => {
    try { const v_35f85c = JSON.parse(v_9e86fd.data); v_0b0398.textContent = `dc open · ${v_35f85c.type || ''}`; } catch (v_37eab7) {}
  };
  const v_ef91d7 = await v_12cd99.createOffer();
  await v_12cd99.setLocalDescription(v_ef91d7);
  await v_20c5c2(v_12cd99);
  v_0b0398.textContent = 'offer 전송(ICE 수집 완료)...';
  const v_cb35cb = await fetch('/offer', {method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      sdp: v_12cd99.localDescription.sdp, type: v_12cd99.localDescription.type,
      clone_id: v_6e0fd3, access_token: v_2ca7e0,
    })});
  const v_7c0968 = await v_cb35cb.json();
  await v_12cd99.setRemoteDescription(v_7c0968);
  v_0b0398.textContent = 'answer 수신 — dc 개통 대기';
}

function v_cad05d() {
  try { if (v_32dc97) v_32dc97.close(); } catch (v_37eab7) {}
  try { if (v_12cd99) v_12cd99.close(); } catch (v_37eab7) {}
  v_12cd99 = null; v_32dc97 = null;
  const v_81e2ef = document.getElementById('clone-video');
  if (v_81e2ef) v_81e2ef.srcObject = null;
  document.getElementById('say-input').disabled = true;
  document.getElementById('say-btn').disabled = true;
  document.getElementById('conn-status').textContent = '끊김 — 재연결 가능';
  document.getElementById('hangup-btn').disabled = true;
  document.getElementById('connect-btn').disabled = false;
  v_5af772();
}

const v_a7deb0 = {
  immediate: '적용 즉시(다음 발화부터)',
  next_call: '적용 즉시(다음 발화부터)',   
  session: '재연결 후',
  container: '컨테이너 재기동 필요',
  lab_restart: '적용만으론 안 먹음 · 재기동 필요',
};

function v_8dc054(v_b4fa6c, v_b24339, v_35f85c, v_a057b5) {
  const v_9fe22d = `${v_b4fa6c}.${v_b24339}`;
  const v_3ac7e7 = document.createElement('div'); v_3ac7e7.className = 'knob-row';

  if (v_35f85c.reflow === 'container' || v_35f85c.reflow === 'lab_restart' || v_35f85c.reflow === 'session') {
    v_3ac7e7.classList.add('needs-restart');
  }
  const v_2869c1 = document.createElement('label'); v_2869c1.textContent = v_35f85c.label || v_b24339;
  const v_638ecc = v_a7deb0[v_35f85c.reflow];
  if (v_638ecc) { const v_fd5f43 = document.createElement('span'); v_fd5f43.className = 'reflow-chip'; v_fd5f43.textContent = v_638ecc; v_2869c1.appendChild(v_fd5f43); }

  if (v_35f85c.group === 'latency' && v_35f85c.stage) {
    const v_8d41d7 = document.createElement('span'); v_8d41d7.className = 'stage-tag';
    v_8d41d7.textContent = v_35f85c.stage; v_2869c1.appendChild(v_8d41d7);
  }

  if (v_78c26d[v_9fe22d]) {
    const v_51452d = document.createElement('span');
    v_51452d.id = `running-${v_9fe22d}`; v_51452d.className = 'reflow-chip';
    v_51452d.textContent = '실행값 조회중...';
    v_2869c1.appendChild(v_51452d);
  }
  v_3ac7e7.appendChild(v_2869c1);
  let v_22d288;
  if (v_35f85c.type === 'bool') {                     
    v_22d288 = document.createElement('select'); v_22d288.className = 'knob-toggle';
    for (const v_68b2be of ['true', 'false']) {
      const v_b6c474 = document.createElement('option'); v_b6c474.value = v_68b2be; v_b6c474.textContent = v_68b2be;
      if (String(v_a057b5) === v_68b2be) v_b6c474.selected = true; v_22d288.appendChild(v_b6c474);
    }
  } else if (v_35f85c.type === 'enum') {              
    v_22d288 = document.createElement('select'); v_22d288.className = 'knob-seg';
    for (const v_68b2be of (v_35f85c.choices || [])) {
      const v_b6c474 = document.createElement('option'); v_b6c474.value = v_68b2be; v_b6c474.textContent = v_68b2be;
      if (String(v_a057b5) === v_68b2be) v_b6c474.selected = true; v_22d288.appendChild(v_b6c474);
    }
  } else {                                     
    v_22d288 = document.createElement('input');
    v_22d288.value = (v_a057b5 == null ? '' : v_a057b5);

    if (v_a057b5 == null) v_22d288.placeholder = '기본값';

    if (v_35f85c.type === 'number') {
      if (v_35f85c.min != null) v_22d288.min = v_35f85c.min;
      if (v_35f85c.max != null) v_22d288.max = v_35f85c.max;
      v_22d288.title = v_5a2031(v_35f85c);
    }
  }
  v_22d288.id = `k_${v_b4fa6c}_${v_b24339}`;
  v_22d288.dataset.s = v_b4fa6c; v_22d288.dataset.k = v_b24339;
  if (v_35f85c.type === 'number') {                   
    const v_83ff11 = document.createElement('div'); v_83ff11.className = 'stepper';
    const v_729796 = v_a45ad7(v_35f85c, v_a057b5);
    v_22d288.dataset.step = String(v_729796);
    v_22d288.step = String(v_729796);
    const v_a86deb = document.createElement('button'); v_a86deb.type='button';
    v_a86deb.className = 'step-down'; v_a86deb.textContent = '−';
    const v_d8f778 = document.createElement('button'); v_d8f778.type='button';
    v_d8f778.className = 'step-up'; v_d8f778.textContent = '+';

    const v_219075 = (v_d5dda0) => {
      const v_c3bc75 = Number(String(v_22d288.value).replace(',', '.')) || 0;
      let v_a448ad = v_c3bc75 + v_d5dda0 * v_729796;
      const v_eef514 = (String(v_729796).split('.')[1] || '').length;
      v_a448ad = Number(v_a448ad.toFixed(v_eef514));
      if (v_35f85c.min != null) v_a448ad = Math.max(v_35f85c.min, v_a448ad);
      if (v_35f85c.max != null) v_a448ad = Math.min(v_35f85c.max, v_a448ad);
      v_22d288.value = v_a448ad;
    };
    v_a86deb.onclick = () => v_219075(-1); v_d8f778.onclick = () => v_219075(1);
    v_83ff11.appendChild(v_a86deb); v_83ff11.appendChild(v_22d288); v_83ff11.appendChild(v_d8f778);
    v_3ac7e7.appendChild(v_83ff11);
  } else {
    v_3ac7e7.appendChild(v_22d288);
  }

  const v_46b9bf = [];
  if (v_35f85c.param) v_46b9bf.push(v_35f85c.param);
  if (v_35f85c.default != null) v_46b9bf.push(`기본 ${v_35f85c.default}`);
  const v_7c1bad = v_5a2031(v_35f85c);
  if (v_7c1bad) v_46b9bf.push(v_7c1bad);

  const v_962e0b = [v_35f85c.label || v_b24339, v_35f85c.desc, v_46b9bf.join(' · ')].filter(Boolean).join('\n');
  v_3ac7e7.title = v_962e0b;

  if (v_35f85c.desc) {
    const v_d5dda0 = document.createElement('div');
    v_d5dda0.className = 'knob-desc'; v_d5dda0.textContent = v_35f85c.desc;
    v_3ac7e7.appendChild(v_d5dda0);
  }
  if (v_46b9bf.length) {
    const v_fd5f43 = document.createElement('div');
    v_fd5f43.className = 'knob-spec';
    v_fd5f43.textContent = v_46b9bf.join('  ·  ');   
    v_3ac7e7.appendChild(v_fd5f43);
  }
  return v_3ac7e7;
}

function v_a45ad7(v_35f85c, v_a057b5) {
  if (v_35f85c.step != null) return v_35f85c.step;
  const v_43e24b = v_35f85c.min, v_d2c6bf = v_35f85c.max;
  let v_729796;
  if (v_43e24b == null || v_d2c6bf == null) {
    v_729796 = String(v_a057b5).includes('.') ? 0.01 : 1;
  } else {
    const v_4f2c9c = Math.abs(v_d2c6bf - v_43e24b);

    const v_41e588 = String(v_35f85c.default ?? '').match(/-?\d+(\.\d+)?/);
    const v_78d83c = v_41e588 ? v_41e588[0].includes('.') : false;
    const v_28d8ef = Number.isInteger(v_43e24b) && Number.isInteger(v_d2c6bf) && !v_78d83c;
    if (v_28d8ef && v_4f2c9c >= 5) v_729796 = 1;          
    else if (v_4f2c9c <= 0.05) v_729796 = 0.001;
    else if (v_4f2c9c <= 2) v_729796 = 0.01;
    else if (v_4f2c9c <= 20) v_729796 = 0.1;
    else v_729796 = 1;
  }

  const v_f52139 = (v_a057b5 != null && v_a057b5 !== '')
    ? v_a057b5
    : ((String(v_35f85c.default ?? '').match(/-?\d+(\.\d+)?/) || [''])[0]);
  const v_eef514 = (String(v_f52139).split('.')[1] || '').length;
  if (v_eef514 >= 3) v_729796 = Math.min(v_729796, 0.001);
  else if (v_eef514 === 2) v_729796 = Math.min(v_729796, 0.01);
  else if (v_eef514 === 1) v_729796 = Math.min(v_729796, 0.1);
  return v_729796;
}

function v_5a2031(v_35f85c) {
  if (v_35f85c.min != null && v_35f85c.max != null) return `범위 ${v_35f85c.min}~${v_35f85c.max}`;
  if (v_35f85c.min != null) return `최소 ${v_35f85c.min}`;
  if (v_35f85c.max != null) return `최대 ${v_35f85c.max}`;
  return '';
}

let v_ddcadb = {};

async function v_858a0a() {
  const [v_0eb677, v_d8a3c2] = await Promise.all([
    (await fetch('/knobs')).json(),
    (await fetch('/knobs/meta')).json(),
  ]);
  const v_ab4c96 = v_d8a3c2.meta || {};
  v_ddcadb = v_ab4c96;
  const v_a38d42 = document.getElementById('knob-fields'); v_a38d42.innerHTML = '';
  const v_d66ecf = document.getElementById('latency-fields');
  if (v_d66ecf) v_d66ecf.innerHTML = '';
  for (const [v_b4fa6c, v_3332db] of Object.entries(v_0eb677)) {
    const v_10a17d = document.createElement('div'); v_10a17d.className = 'channel';
    const v_9f1622 = document.createElement('div'); v_9f1622.className = 'panel-title';
    v_9f1622.textContent = v_b4fa6c; v_10a17d.appendChild(v_9f1622);

    const v_ef8ab1 = document.createElement('div'); v_ef8ab1.className = 'knob-list';
    v_10a17d.appendChild(v_ef8ab1);
    for (const [v_b24339, v_a057b5] of Object.entries(v_3332db)) {
      const v_9fe22d = `${v_b4fa6c}.${v_b24339}`;
      const v_35f85c = v_ab4c96[v_9fe22d] || {type: 'string', reflow: 'next_call'};
      const v_3ac7e7 = v_8dc054(v_b4fa6c, v_b24339, v_35f85c, v_a057b5);

      if (v_35f85c.group === 'latency' && v_d66ecf) v_d66ecf.appendChild(v_3ac7e7);
      else v_ef8ab1.appendChild(v_3ac7e7);
    }

    if (v_ef8ab1.querySelectorAll('.knob-row').length) v_a38d42.appendChild(v_10a17d);
  }
  v_796451();
  document.getElementById('k_tts_engine')?.addEventListener('change', v_796451);
  v_3c6a23();

  for (const v_0eb677 of ['lip_lock', 'source_face_lock', 'source_face_lock_full', 'eyes_open_lock']) {
    document.getElementById(`k_fifth_${v_0eb677}`)?.addEventListener('change', v_3c6a23);
  }
  v_d4af21();   
}

const v_9f8d13 = [
  {switch: 'source_face_lock', kills: ['lip_open', 'lip_closed', 'open_scale', 'offset',
                                       'sigma', 'gamma', 'silence', 'closed_thresh', 'open_thresh'],
   why: '입 원본 고정이 켜져 있어 무시됨'},
  {switch: 'source_face_lock_full', kills: ['lip_open', 'lip_closed', 'open_scale', 'offset',
                                            'sigma', 'gamma', 'silence'],
   why: '표정 전체 고정이 켜져 있어 무시됨'},
  {switch: 'lip_lock', kills: ['lip_open', 'open_scale', 'offset', 'sigma', 'gamma', 'silence'],
   why: '입 강제 다뭄이 켜져 있어 무시됨(입이 lip_closed 로 고정)'},
  {switch: 'eyes_open_lock', kills: ['blink', 'blink_interval_sec'],
   why: '눈 뜬 채 고정이 켜져 있어 무시됨'},
];

function v_3c6a23() {

  document.querySelectorAll('.kill-badge').forEach(v_57c92e => v_57c92e.remove());
  const v_abacaa = (v_0eb677) => document.getElementById(`k_fifth_${v_0eb677}`)?.value === 'true';
  const v_a147fb = {};
  for (const v_32000f of v_9f8d13) {
    if (!v_abacaa(v_32000f.switch)) continue;
    for (const v_0eb677 of v_32000f.kills) if (!v_a147fb[v_0eb677]) v_a147fb[v_0eb677] = v_32000f.why;
  }
  for (const [v_0eb677, v_3325c8] of Object.entries(v_a147fb)) {
    const v_22d288 = document.getElementById(`k_fifth_${v_0eb677}`);
    if (!v_22d288) continue;
    const v_3ac7e7 = v_22d288.closest('.knob-row');
    if (!v_3ac7e7) continue;
    const v_148ff6 = document.createElement('div');
    v_148ff6.className = 'kill-badge';

    const v_c22a7a = document.body.classList.contains('compact');
    v_148ff6.textContent = v_c22a7a ? '⚠ 지금 안 먹음' : `⚠ 지금 안 먹음 — ${v_3325c8}`;
    v_148ff6.title = v_3325c8;
    v_3ac7e7.appendChild(v_148ff6);
  }
}

function v_04a0ee(v_35f85c) {
  const v_a38d42 = document.getElementById('latency-meter');
  if (!v_a38d42) return;
  v_a38d42.innerHTML = '';
  const v_18b8bf = [
    ['LLM 첫토큰', v_35f85c.llm_first_token_ms],
    ['TTS 합성', v_35f85c.tts_ms],
    ['fifth 렌더', v_35f85c.render_ms],
  ];
  const v_d2c6bf = Math.max(1, ...v_18b8bf.map(v_cb35cb => v_cb35cb[1] || 0));
  for (const [v_1833e7, v_81e2ef] of v_18b8bf) {
    const v_3ac7e7 = document.createElement('div'); v_3ac7e7.className = 'lat-row';
    const v_b17055 = document.createElement('span'); v_b17055.className = 'lat-name';
    v_b17055.textContent = v_1833e7;
    const v_a057b5 = document.createElement('span'); v_a057b5.className = 'lat-val';
    v_a057b5.textContent = (v_81e2ef == null ? '–' : `${v_81e2ef}ms`);
    const v_2c681a = document.createElement('div'); v_2c681a.className = 'lat-track';
    const v_d54210 = document.createElement('div'); v_d54210.className = 'lat-bar';
    v_d54210.style.width = `${Math.round((v_81e2ef || 0) / v_d2c6bf * 100)}%`;
    v_2c681a.appendChild(v_d54210);
    v_3ac7e7.appendChild(v_b17055); v_3ac7e7.appendChild(v_a057b5); v_3ac7e7.appendChild(v_2c681a);
    v_a38d42.appendChild(v_3ac7e7);
  }
  const v_51452d = document.getElementById('ttff-badge');
  if (v_51452d) {
    v_51452d.textContent = (v_35f85c.ttff_ms == null)
      ? '측정 전' : `첫 소리까지 ${(v_35f85c.ttff_ms / 1000).toFixed(2)}s`;
  }
  v_46a72e(v_35f85c.last_render);
}

function v_46a72e(v_132868) {
  const v_a38d42 = document.getElementById('last-sent');
  if (!v_a38d42) return;
  v_a38d42.innerHTML = '';
  if (!v_132868 || !v_132868.params) {
    v_a38d42.textContent = '아직 렌더 없음 — 통화 연결 후 말을 걸면 여기에 실제 전송값이 뜹니다';
    v_a38d42.className = 'last-sent empty';
    return;
  }
  v_a38d42.className = 'last-sent';
  const v_f330c1 = Math.max(0, Math.round(Date.now() / 1000 - v_132868.at));
  const v_43fb07 = document.createElement('div');
  v_43fb07.className = 'ls-head';
  const v_fa53ec = Object.keys(v_132868.params);
  v_43fb07.textContent = `실제 렌더 전송값 · ${v_fa53ec.length}개 · ${v_f330c1}초 전`;
  v_a38d42.appendChild(v_43fb07);

  const v_b1ca67 = ['blink', 'jpeg_quality', 'idle_motion_scale', 'idle_rms_low',
                  'idle_rms_high', 'head_slew_frames'];
  const v_6cfba6 = v_fa53ec.filter(v_0eb677 => !v_b1ca67.includes(v_0eb677));
  const v_694b25 = v_fa53ec.filter(v_0eb677 => v_b1ca67.includes(v_0eb677));
  for (const [v_2869c1, v_ef8ab1] of [['내가 지정한 값', v_6cfba6], ['기본 전송', v_694b25]]) {
    if (!v_ef8ab1.length) continue;
    const v_3ac7e7 = document.createElement('div');
    v_3ac7e7.className = 'ls-row' + (v_2869c1 === '내가 지정한 값' ? ' tuned' : '');
    v_3ac7e7.textContent = `${v_2869c1}: ` + v_ef8ab1.map(v_0eb677 => `${v_0eb677}=${v_132868.params[v_0eb677]}`).join(', ');
    v_a38d42.appendChild(v_3ac7e7);
  }
  if (!v_6cfba6.length) {
    const v_9ecdb9 = document.createElement('div');
    v_9ecdb9.className = 'ls-row empty';
    v_9ecdb9.textContent = '지정한 값 없음 — 입력칸이 비어 있으면 컨테이너 기본값을 씁니다';
    v_a38d42.appendChild(v_9ecdb9);
  }
}

let v_4e7cfd = 0;
let v_3e00d1 = false;

async function v_ded6bb() {
  if (v_3e00d1) return;
  const v_a38d42 = document.getElementById('render-log');
  if (!v_a38d42) return;
  let v_9390e8;
  try {
    v_9390e8 = await (await fetch(`/render-logs?since=${v_4e7cfd}`)).json();
  } catch (v_9e86fd) { return; }
  if (v_9390e8.error && !(v_9390e8.lines || []).length) {
    if (!v_4e7cfd) v_a38d42.textContent = v_9390e8.error;
    return;
  }
  const v_a52412 = v_9390e8.lines || [];
  if (!v_a52412.length) return;
  for (const v_765c3e of v_a52412) {
    v_4e7cfd = Math.max(v_4e7cfd, v_765c3e.seq);
    const v_3ac7e7 = document.createElement('div');
    v_3ac7e7.className = 'log-row';
    if (v_765c3e.level === 'ERROR' || v_765c3e.level === 'WARNING') v_3ac7e7.className += ' bad';
    if (v_765c3e.msg.includes('[cfg-final]')) v_3ac7e7.className += ' final';
    else if (v_765c3e.msg.includes('[cfg-override]')) v_3ac7e7.className += ' override';
    const v_8d41d7 = new Date(v_765c3e.ts * 1000).toTimeString().slice(0, 8);
    v_3ac7e7.textContent = `${v_8d41d7} ${v_765c3e.msg}`;   
    v_a38d42.appendChild(v_3ac7e7);
  }
  while (v_a38d42.childElementCount > 300) v_a38d42.removeChild(v_a38d42.firstChild);
  if (!v_3e00d1) v_a38d42.scrollTop = v_a38d42.scrollHeight;
}

const v_10fde5 = {
  src_scale: '얼굴 대비 crop 배율. 바꾸면 클론별 소스 캐시를 전부 버려야 한다',
  src_vy_ratio: 'crop 중심의 상하 오프셋. 위와 같은 이유로 잠겨 있다',
  src_dsize: 'crop 결과 한 변 픽셀. 모델 입력 규격이라 고정',
  source_max_dim: '소스 이미지 최대 변. 올리면 화질이 좋아지고 느려진다',
  source_division: '소스 해상도가 나누어떨어져야 하는 값',
  driving_smooth_observation_variance: '영상 소스일 때의 스무딩 강도',
};

async function v_2a2e10() {
  const v_a38d42 = document.getElementById('flp-readonly');
  if (!v_a38d42) return;
  v_a38d42.innerHTML = '';
  let v_9390e8;
  try {
    v_9390e8 = await (await fetch('/flp-config')).json();
  } catch (v_9e86fd) {
    v_a38d42.textContent = '조회 실패';
    return;
  }
  if (v_9390e8.error) { v_a38d42.textContent = v_9390e8.error; return; }
  for (const v_d7f648 of ['crop_params', 'infer_params']) {
    const v_3332db = v_9390e8[v_d7f648];
    if (!v_3332db) continue;
    const v_43fb07 = document.createElement('div');
    v_43fb07.className = 'ro-group'; v_43fb07.textContent = v_d7f648;
    v_a38d42.appendChild(v_43fb07);
    for (const [v_0eb677, v_81e2ef] of Object.entries(v_3332db)) {
      const v_3ac7e7 = document.createElement('div'); v_3ac7e7.className = 'knob-row ro';
      const v_b17055 = document.createElement('label'); v_b17055.textContent = v_0eb677;
      const v_a057b5 = document.createElement('span'); v_a057b5.className = 'ro-val';
      v_a057b5.textContent = String(v_81e2ef);
      v_3ac7e7.appendChild(v_b17055); v_3ac7e7.appendChild(v_a057b5);
      if (v_10fde5[v_0eb677]) {
        const v_d5dda0 = document.createElement('div');
        v_d5dda0.className = 'knob-desc'; v_d5dda0.textContent = v_10fde5[v_0eb677];
        v_3ac7e7.appendChild(v_d5dda0);
      }
      v_a38d42.appendChild(v_3ac7e7);
    }
  }
}

const v_78c26d = { 'fifth.render_mode': 'PRETHIRD_RENDER_MODE' };
let v_6f88c1 = null;   
let v_60aaaa = null;   

function v_d4af21() {
  if (!v_6f88c1) return;
  const v_298a3a = {};
  for (const v_cb35cb of v_6f88c1) v_298a3a[v_cb35cb.env] = v_cb35cb;
  for (const [v_9fe22d, v_c9c489] of Object.entries(v_78c26d)) {
    const v_51452d = document.getElementById(`running-${v_9fe22d}`);
    const v_22d288 = document.getElementById(`k_${v_9fe22d.replace('.', '_')}`);
    if (!v_51452d || !v_22d288) continue;   
    const v_3ac7e7 = v_298a3a[v_c9c489];

    if (!v_3ac7e7 || v_3ac7e7.state === 'unknown') {
      v_51452d.textContent = '실제: 확인불가(prethird 미기동?)';
      v_51452d.className = 'reflow-chip';
      continue;
    }
    const v_587413 = v_22d288.value;
    if (v_587413 !== v_3ac7e7.running) {
      v_51452d.textContent = `⚠ 선택:${v_587413} · 실제:${v_3ac7e7.running} · 재기동 필요`;
      v_51452d.className = 'reflow-chip chip-drift';
    } else {
      v_51452d.textContent = `실제:${v_3ac7e7.running}`;
      v_51452d.className = 'reflow-chip chip-ok';
    }
  }
}

function v_796451() {
  const v_3be5d5 = document.getElementById('k_tts_engine');
  const v_03b8c8 = v_3be5d5 && v_3be5d5.value === 'openvoice';
  for (const v_70c705 of v_81f9b1) {
    const v_57c92e = document.getElementById(`k_tts_${v_70c705}`);
    if (!v_57c92e) continue;
    const v_3ac7e7 = v_57c92e.closest('.knob-row');
    if (v_3ac7e7) { v_3ac7e7.classList.toggle('knob-dim', !!v_03b8c8);
      v_3ac7e7.title = v_03b8c8 ? 'openvoice 엔진에선 무시됨(qwen 전용)' : ''; }
  }
}

const v_170a1f =
  '#knob-fields input, #knob-fields select, #latency-fields input, #latency-fields select';

function v_ccf98d(v_9b6134, v_94302c) {
  for (const v_389afb of ['apply-status', 'apply-status-top']) {
    const v_57c92e = document.getElementById(v_389afb);
    if (!v_57c92e) continue;
    v_57c92e.textContent = v_9b6134;                     
    v_57c92e.className = 'apply-status' + (v_94302c ? ' ' + v_94302c : '');
  }
}

async function v_9a2a8d() {
  const v_4628fe = {};
  document.querySelectorAll(v_170a1f).forEach(v_fb6823 => {
    const v_fd5f43 = v_fb6823.dataset.s, v_0eb677 = v_fb6823.dataset.k; let v_81e2ef = v_fb6823.value;
    if (v_81e2ef === '') return;
    if (v_81e2ef === 'true') v_81e2ef = true; else if (v_81e2ef === 'false') v_81e2ef = false;
    else {

      const v_825625 = v_81e2ef.replace(',', '.');
      if (v_825625.trim() !== '' && !isNaN(Number(v_825625))) v_81e2ef = Number(v_825625);
    }
    (v_4628fe[v_fd5f43] ||= {})[v_0eb677] = v_81e2ef;
  });

  const v_f966e3 = Object.values(v_4628fe).reduce((v_f4e98d, v_b6c474) => v_f4e98d + Object.keys(v_b6c474).length, 0);
  v_ccf98d(`적용 중… (${v_f966e3}개)`, '');

  let v_2b7a6d;
  try {
    const v_eb792a = await fetch('/knobs', {method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(v_4628fe)});
    if (!v_eb792a.ok) { v_ccf98d(`적용 실패 — 서버 ${v_eb792a.status}`, 'bad'); return; }
    v_2b7a6d = await v_eb792a.json();
  } catch (v_9e86fd) {
    v_ccf98d(`적용 실패 — ${v_9e86fd}`, 'bad');
    return;
  }

  const v_a28d1a = [];
  const v_15d097 = [];
  for (const [v_b6a7e0, v_3332db] of Object.entries(v_4628fe)) {
    for (const [v_0eb677, v_81e2ef] of Object.entries(v_3332db)) {
      const v_df0713 = (v_2b7a6d[v_b6a7e0] || {})[v_0eb677];
      if (String(v_df0713) !== String(v_81e2ef)) v_a28d1a.push(`${v_b6a7e0}.${v_0eb677}(보냄 ${v_81e2ef} / 서버 ${v_df0713})`);
      const v_d2f9e5 = (v_ddcadb[`${v_b6a7e0}.${v_0eb677}`] || {}).reflow;
      if (v_d2f9e5 === 'container' || v_d2f9e5 === 'lab_restart' || v_d2f9e5 === 'session') {
        v_15d097.push(`${v_b6a7e0}.${v_0eb677}`);
      }
    }
  }

  v_85930b = v_f966e3;
  await v_858a0a();          
  v_5af772();

  if (v_a28d1a.length) {
    v_ccf98d(`반영 안 된 값 ${v_a28d1a.length}개: ${v_a28d1a.join(', ')}`, 'bad');
  } else if (v_15d097.length) {
    v_ccf98d(
      `${v_f966e3}개 적용됨 — 단 ${v_15d097.length}개는 재기동해야 먹습니다: ${v_15d097.join(', ')}`,
      'warn');
  } else {
    v_ccf98d(`${v_f966e3}개 적용됨 · 다음 발화부터 반영`, 'ok');
  }
}

function v_409b14() {
  const v_8d41d7 = document.getElementById('say-input').value;
  const v_0b0398 = document.getElementById('conn-status');
  if (!v_32dc97 || v_32dc97.readyState !== 'open') {
    v_0b0398.textContent = `say 불가 — dc:${v_32dc97 ? v_32dc97.readyState : '없음'}(연결/개통 대기)`;
    return false;
  }
  v_32dc97.send(JSON.stringify({type:'say', text:v_8d41d7, seq:Date.now()}));
  v_0b0398.textContent = `say 전송됨: "${v_8d41d7.slice(0, 20)}"`;
  v_201831 = v_8d41d7.slice(0, 20);
  v_5af772();
  return true;
}

function v_e1242b() {
  const v_9ba48b = new EventSource('/metrics');
  v_9ba48b.onmessage = (v_1d299c) => {
    v_5af772();

    try { v_04a0ee(JSON.parse(v_1d299c.data) || {}); } catch (v_9e86fd) {  }
  };
}

async function v_4deb94() {
  try {
    const v_cb35cb = await fetch('/live-status');
    const v_9390e8 = await v_cb35cb.json();
    document.getElementById('live-banner').style.display = v_9390e8.busy ? 'block' : 'none';
    v_bd0622 = !!v_9390e8.busy;
    v_5af772();
  } catch (v_9e86fd) {

  }
}

async function v_c2251d(v_d116d0) {
  await fetch('/replay/tts', {method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({run_id: v_d116d0})});
  await v_315473();
}

async function v_c0f8e0(v_d116d0) {
  await fetch('/replay/fifth', {method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({run_id: v_d116d0})});
  await v_315473();
}

async function v_315473() {
  const v_a38d42 = document.getElementById('runs-list');
  try {
    const v_89da6a = await (await fetch('/runs')).json();
    if (!v_89da6a.length) { v_a38d42.innerHTML = '<i>run 없음</i>'; return; }
    let v_d91d98 = '<table><tr><th>run_id</th><th>pinned</th><th></th></tr>';
    for (const v_cb35cb of v_89da6a) {
      v_d91d98 += `<tr><td>${v_cb35cb.run_id}</td><td>${v_cb35cb.pinned ? '📌' : ''}</td>`+
        `<td><button onclick="replayTts('${v_cb35cb.run_id}')">재생(tts)</button>`+
        `<button onclick="replayFifth('${v_cb35cb.run_id}')">재생(fifth)</button></td></tr>`;
    }
    v_d91d98 += '</table>';
    v_a38d42.innerHTML = v_d91d98;
  } catch (v_9e86fd) {
    v_a38d42.innerHTML = '<i>run 목록 조회 실패</i>';
  }
}

async function v_187e1c() {
  const v_a38d42 = document.getElementById('prod-status');
  try {
    const v_d5dda0 = await (await fetch('/production-status')).json();
    v_6f88c1 = v_d5dda0.rows || [];   
    v_60aaaa = v_d5dda0.mainpid ?? null;   
    let v_d91d98 = `<div style="color:var(--text-dim)">MainPID: ${v_8fd199(v_d5dda0.mainpid ?? '-')} · ${v_8fd199(v_d5dda0.generated_at)}</div>`;
    v_d91d98 += '<table><tr><th>env</th><th>conf</th><th>실행값</th><th>상태</th></tr>';
    for (const v_cb35cb of v_d5dda0.rows) {
      const v_2cc6f2 = v_cb35cb.state === 'drift' ? 'chip-drift' : (v_cb35cb.state === 'unknown' ? 'chip-unknown' : 'chip-ok');
      v_d91d98 += `<tr><td>${v_8fd199(v_cb35cb.env)}</td><td>${v_8fd199(v_cb35cb.conf)}</td><td>${v_8fd199(v_cb35cb.running)}</td>`+
        `<td><span class="chip ${v_2cc6f2}">${v_8fd199(v_cb35cb.state)}</span></td></tr>`;
    }
    v_d91d98 += '</table>';
    v_a38d42.innerHTML = v_d91d98;
    v_d4af21();   
  } catch (v_9e86fd) { v_a38d42.innerHTML = '<i>상태 조회 실패</i>'; }
}

async function v_3e5dbc() {
  const v_e926e3 = document.getElementById('promote-confirm');
  try {
    const v_d5dda0 = await (await fetch('/promote/preview', {method:'POST',
      headers:{'Content-Type':'application/json'}, body:'{}'})).json();
    const v_1e6eca = v_d5dda0.entries || [];
    if (!v_1e6eca.length) { v_e926e3.style.display='block';
      v_e926e3.innerHTML = '<i>변경(dirty)된 knob 없음 — promote 대상 없음</i>'; return; }
    let v_d91d98 = '<div style="border:1px solid var(--gold);border-radius:4px;padding:8px;margin-top:8px">';
    v_d91d98 += '<b>라이브 반영될 변경:</b><ul>';

    for (const v_9e86fd of v_1e6eca) {
      v_d91d98 += `<li>${v_8fd199(v_9e86fd.env ?? '')} = ${v_8fd199(v_9e86fd.new ?? '')}`+
        `${v_9e86fd.container ? ' <span class="chip chip-drift">컨테이너(별도 반영 필요)</span>' : ''}</li>`;
    }
    v_d91d98 += '</ul><button id="promote-go" class="primary">확인·적용</button> '+
            '<button id="promote-cancel">취소</button></div>';
    v_e926e3.innerHTML = v_d91d98; v_e926e3.style.display = 'block';
    document.getElementById('promote-token').style.display = 'block';
    document.getElementById('promote-go').onclick = v_150d46;
    document.getElementById('promote-cancel').onclick = () => {
      v_e926e3.style.display='none'; document.getElementById('promote-token').style.display='none'; };
  } catch (v_9e86fd) { v_e926e3.style.display='block'; v_e926e3.innerHTML = '<i>promote preview 실패</i>'; }
}

async function v_150d46() {
  const v_e926e3 = document.getElementById('promote-confirm');
  const v_21cc31 = document.getElementById('promote-token').value;

  const v_3f4675 = {'Content-Type':'application/json'};
  if (v_21cc31) v_3f4675['X-Lab-Tuner-Token'] = v_21cc31;   
  try {

    const v_cb35cb = await fetch('/promote/apply', {method:'POST', headers: v_3f4675, body: JSON.stringify({confirm: true})});
    if (v_cb35cb.status === 401 || v_cb35cb.status === 403) {
      v_e926e3.innerHTML = '<i>인증 실패 — LAB_TUNER_TOKEN 확인</i>'; return; }
    let v_d5dda0 = {};
    try { v_d5dda0 = await v_cb35cb.json(); } catch (v_37eab7) {  }
    if (!v_cb35cb.ok) {
      v_e926e3.innerHTML = '<i>실패: ' + v_8fd199(v_d5dda0.error || (v_cb35cb.status + ' 오류')) + '</i>';
      return;
    }
    v_e926e3.innerHTML = `<div>적용됨: ${v_8fd199(JSON.stringify(v_d5dda0).slice(0,200))}</div>`;
    document.getElementById('promote-token').style.display = 'none';
    await v_187e1c();
  } catch (v_9e86fd) { v_e926e3.innerHTML = '<i>promote apply 실패</i>'; }
}

async function v_3fd5d1() {
  const v_e926e3 = document.getElementById('restart-confirm');
  v_e926e3.style.display = 'block';
  v_e926e3.innerHTML = '<div><i>미적용 변경 확인 중…</i></div>';

  let v_383206 = '';
  try {
    const v_d5dda0 = await (await fetch('/promote/preview', {method:'POST',
      headers:{'Content-Type':'application/json'}, body:'{}'})).json();
    if ((v_d5dda0.entries || []).length) {
      v_383206 = '<div style="color:var(--red)"><b>⚠️ 선택값이 아직 실행 중 프로세스와 다릅니다.</b><br>'+
        '라이브 적용(promote)을 <u>안 했으면</u> 먼저 하세요. '+
        '<b>이미 &#39;적용됨&#39;을 보셨다면 아래 &#39;확인·재기동&#39;만 누르면 반영됩니다</b>(취소하지 마세요).</div>';
    }
  } catch (v_9e86fd) {  }
  v_e926e3.innerHTML = v_383206 +
    '<div style="border:1px solid var(--red);border-radius:4px;padding:8px;margin-top:8px">'+
    '<b>prethird 재기동 — 진행중 통화 끊길 수 있음. 계속?</b><br>'+
    '<button id="restart-go" class="primary">확인·재기동</button> '+
    '<button id="restart-cancel">취소</button></div>';
  document.getElementById('promote-token').style.display = 'block';
  document.getElementById('restart-go').onclick = v_f45ddd;
  document.getElementById('restart-cancel').onclick = () => { v_e926e3.style.display = 'none'; };
}

async function v_b41b0c(v_be69ff, v_e926e3) {
  const v_3d627c = 10;
  for (let v_ebec57 = 1; v_ebec57 <= v_3d627c; v_ebec57++) {
    await new Promise((v_6f7712) => setTimeout(v_6f7712, 2000));
    v_e926e3.innerHTML = `<div>재기동 중… 새 프로세스 기동 확인중(${v_ebec57 * 2}s/${v_3d627c * 2}s)</div>`;
    try {
      const v_d5dda0 = await (await fetch('/production-status')).json();
      if (v_d5dda0.mainpid && v_d5dda0.mainpid !== v_be69ff) {
        v_6f88c1 = v_d5dda0.rows || [];
        v_60aaaa = v_d5dda0.mainpid;
        return true;
      }
    } catch (v_9e86fd) {  }
  }
  return false;
}

async function v_f45ddd() {
  const v_e926e3 = document.getElementById('restart-confirm');
  const v_21cc31 = document.getElementById('promote-token').value;

  const v_3f4675 = {'Content-Type':'application/json'};
  if (v_21cc31) v_3f4675['X-Lab-Tuner-Token'] = v_21cc31;
  const v_be69ff = v_60aaaa;   
  try {
    const v_cb35cb = await fetch('/promote/restart', {method:'POST', headers: v_3f4675,
      body: JSON.stringify({confirm: "RESTART", confirm2: true})});
    if (v_cb35cb.status === 401 || v_cb35cb.status === 403) {
      v_e926e3.innerHTML = '<i>인증 실패 — LAB_TUNER_TOKEN 확인</i>'; return; }
    let v_d5dda0 = {};
    try { v_d5dda0 = await v_cb35cb.json(); } catch (v_37eab7) {  }
    if (!v_cb35cb.ok) {
      v_e926e3.innerHTML = '<i>실패: ' + v_8fd199(v_d5dda0.error || (v_cb35cb.status + ' 오류')) + '</i>';
      return;
    }
    v_e926e3.innerHTML = `<div>재기동 요청 완료(returncode=${v_8fd199(v_d5dda0.restart_returncode)}) — `+
      `새 프로세스 기동 대기중…</div>`;
    const v_4c6dd7 = await v_b41b0c(v_be69ff, v_e926e3);
    if (v_4c6dd7) {
      v_e926e3.innerHTML = `<div>재기동 완료(MainPID:${v_8fd199(v_60aaaa)}) — 실행값 갱신됨</div>`;
      await v_187e1c();
    } else {
      v_e926e3.innerHTML = '<i>재기동 확인 시간초과(20s) — "프로덕션 상태" 새로고침으로 직접 확인하세요</i>';
    }
  } catch (v_9e86fd) { v_e926e3.innerHTML = '<i>재기동 요청 실패</i>'; }
}

async function v_d73d4a() {
  try {
    const v_cb35cb = await fetch('/dev-token');
    if (!v_cb35cb.ok) return;   
    const v_d5dda0 = await v_cb35cb.json();
    if (v_d5dda0.token) document.getElementById('promote-token').value = v_d5dda0.token;
  } catch (v_9e86fd) {  }
}

document.getElementById('apply-knobs').onclick = v_9a2a8d;
document.getElementById('promote').onclick = v_3e5dbc;
document.getElementById('restart-prethird').onclick = v_3fd5d1;
document.getElementById('say-btn').onclick = v_409b14;
document.getElementById('say-input').addEventListener('keydown', (v_9e86fd) => {
  if (v_9e86fd.key === 'Enter' && !v_9e86fd.isComposing) {   
    v_9e86fd.preventDefault();
    if (v_409b14()) {                            
      v_9e86fd.target.value = '';                      
    }
  }
});
document.getElementById('refresh-runs').onclick = v_315473;
document.getElementById('refresh-prod').onclick = v_187e1c;
document.getElementById('login-btn').onclick = v_182fdb;
document.getElementById('connect-btn').onclick = v_1857f4;
document.getElementById('hangup-btn').onclick = v_cad05d;

v_858a0a(); v_e1242b(); v_315473(); v_187e1c(); v_d73d4a(); v_2a2e10();
document.getElementById('refresh-flp')?.addEventListener('click', v_2a2e10);

v_ded6bb();
setInterval(v_ded6bb, 2000);
document.getElementById('log-pause')?.addEventListener('click', (v_9e86fd) => {
  v_3e00d1 = !v_3e00d1;
  v_9e86fd.target.textContent = v_3e00d1 ? '재개' : '일시정지';
});
document.getElementById('log-clear')?.addEventListener('click', () => {
  const v_a38d42 = document.getElementById('render-log');
  if (v_a38d42) v_a38d42.innerHTML = '';
});

document.getElementById('apply-knobs-top')?.addEventListener('click', v_9a2a8d);

document.getElementById('toggle-compact')?.addEventListener('click', (v_9e86fd) => {
  const v_abacaa = document.body.classList.toggle('compact');
  v_9e86fd.target.textContent = v_abacaa ? '설명 펼치기' : '압축 보기';
  v_3c6a23();   
});
v_5af772();
v_4deb94();
setInterval(v_4deb94, 3000);
