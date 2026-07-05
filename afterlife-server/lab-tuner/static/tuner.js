
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

const v_a7deb0 = {
  next_call: '다음 통화부터', container: '컨테이너 재기동', session: '다음 접속부터',
};

async function v_858a0a() {
  const [v_0eb677, v_d8a3c2] = await Promise.all([
    (await fetch('/knobs')).json(),
    (await fetch('/knobs/meta')).json(),
  ]);
  const v_ab4c96 = v_d8a3c2.meta || {};
  const v_a38d42 = document.getElementById('knob-fields'); v_a38d42.innerHTML = '';
  for (const [v_b4fa6c, v_3332db] of Object.entries(v_0eb677)) {
    const v_10a17d = document.createElement('div'); v_10a17d.className = 'channel';
    const v_9f1622 = document.createElement('div'); v_9f1622.className = 'panel-title';
    v_9f1622.textContent = v_b4fa6c; v_10a17d.appendChild(v_9f1622);
    for (const [v_b24339, v_a057b5] of Object.entries(v_3332db)) {
      const v_9fe22d = `${v_b4fa6c}.${v_b24339}`;
      const v_35f85c = v_ab4c96[v_9fe22d] || {type: 'string', reflow: 'next_call'};
      const v_3ac7e7 = document.createElement('div'); v_3ac7e7.className = 'knob-row';
      const v_2869c1 = document.createElement('label'); v_2869c1.textContent = v_35f85c.label || v_b24339;
      const v_638ecc = v_a7deb0[v_35f85c.reflow];
      if (v_638ecc) { const v_fd5f43 = document.createElement('span'); v_fd5f43.className = 'reflow-chip'; v_fd5f43.textContent = v_638ecc; v_2869c1.appendChild(v_fd5f43); }
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
      }
      v_22d288.id = `k_${v_b4fa6c}_${v_b24339}`;
      v_22d288.dataset.s = v_b4fa6c; v_22d288.dataset.k = v_b24339;
      if (v_35f85c.type === 'number') {                   
        const v_83ff11 = document.createElement('div'); v_83ff11.className = 'stepper';
        const v_729796 = (String(v_a057b5).includes('.') ? 0.05 : 1);
        v_22d288.dataset.step = String(v_729796);
        const v_a86deb = document.createElement('button'); v_a86deb.type='button';
        v_a86deb.className = 'step-down'; v_a86deb.textContent = '▼';
        const v_d8f778 = document.createElement('button'); v_d8f778.type='button';
        v_d8f778.className = 'step-up'; v_d8f778.textContent = '▲';
        const v_219075 = (v_d5dda0) => { const v_c3bc75 = Number(String(v_22d288.value).replace(',', '.')) || 0;
          v_22d288.value = (Math.round((v_c3bc75 + v_d5dda0*v_729796)*1000)/1000); };
        v_a86deb.onclick = () => v_219075(-1); v_d8f778.onclick = () => v_219075(1);
        v_83ff11.appendChild(v_a86deb); v_83ff11.appendChild(v_22d288); v_83ff11.appendChild(v_d8f778);
        v_3ac7e7.appendChild(v_83ff11);
      } else {
        v_3ac7e7.appendChild(v_22d288);
      }
      v_10a17d.appendChild(v_3ac7e7);
    }
    v_a38d42.appendChild(v_10a17d);
  }
  v_796451();
  document.getElementById('k_tts_engine')?.addEventListener('change', v_796451);
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

async function v_9a2a8d() {
  const v_4628fe = {};
  document.querySelectorAll('#knob-fields input, #knob-fields select').forEach(v_fb6823 => {
    const v_fd5f43 = v_fb6823.dataset.s, v_0eb677 = v_fb6823.dataset.k; let v_81e2ef = v_fb6823.value;
    if (v_81e2ef === '') return;
    if (v_81e2ef === 'true') v_81e2ef = true; else if (v_81e2ef === 'false') v_81e2ef = false;
    else {

      const v_825625 = v_81e2ef.replace(',', '.');
      if (v_825625.trim() !== '' && !isNaN(Number(v_825625))) v_81e2ef = Number(v_825625);
    }
    (v_4628fe[v_fd5f43] ||= {})[v_0eb677] = v_81e2ef;
  });
  await fetch('/knobs', {method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify(v_4628fe)});
  v_85930b = Object.values(v_4628fe).reduce((v_f4e98d, v_b6c474) => v_f4e98d + Object.keys(v_b6c474).length, 0);
  v_5af772();
}

function v_409b14() {
  const v_8d41d7 = document.getElementById('say-input').value;
  const v_0b0398 = document.getElementById('conn-status');
  if (!v_32dc97 || v_32dc97.readyState !== 'open') {
    v_0b0398.textContent = `say 불가 — dc:${v_32dc97 ? v_32dc97.readyState : '없음'}(연결/개통 대기)`;
    return;
  }
  v_32dc97.send(JSON.stringify({type:'say', text:v_8d41d7, seq:Date.now()}));
  v_0b0398.textContent = `say 전송됨: "${v_8d41d7.slice(0, 20)}"`;
  v_201831 = v_8d41d7.slice(0, 20);
  v_5af772();
}

function v_e1242b() {
  const v_9ba48b = new EventSource('/metrics');
  v_9ba48b.onmessage = () => { v_5af772(); };
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
    let v_d91d98 = `<div style="color:var(--text-dim)">MainPID: ${v_8fd199(v_d5dda0.mainpid ?? '-')} · ${v_8fd199(v_d5dda0.generated_at)}</div>`;
    v_d91d98 += '<table><tr><th>env</th><th>conf</th><th>실행값</th><th>상태</th></tr>';
    for (const v_cb35cb of v_d5dda0.rows) {
      const v_2cc6f2 = v_cb35cb.state === 'drift' ? 'chip-drift' : (v_cb35cb.state === 'unknown' ? 'chip-unknown' : 'chip-ok');
      v_d91d98 += `<tr><td>${v_8fd199(v_cb35cb.env)}</td><td>${v_8fd199(v_cb35cb.conf)}</td><td>${v_8fd199(v_cb35cb.running)}</td>`+
        `<td><span class="chip ${v_2cc6f2}">${v_8fd199(v_cb35cb.state)}</span></td></tr>`;
    }
    v_d91d98 += '</table>';
    v_a38d42.innerHTML = v_d91d98;
  } catch (v_9e86fd) { v_a38d42.innerHTML = '<i>상태 조회 실패</i>'; }
}

document.getElementById('apply-knobs').onclick = v_9a2a8d;
document.getElementById('say-btn').onclick = v_409b14;
document.getElementById('say-input').addEventListener('keydown', (v_9e86fd) => {
  if (v_9e86fd.key === 'Enter' && !v_9e86fd.isComposing) {   
    v_9e86fd.preventDefault();
    v_409b14();
    v_9e86fd.target.value = '';                        
  }
});
document.getElementById('refresh-runs').onclick = v_315473;
document.getElementById('refresh-prod').onclick = v_187e1c;
document.getElementById('login-btn').onclick = v_182fdb;
document.getElementById('connect-btn').onclick = v_1857f4;

v_858a0a(); v_e1242b(); v_315473(); v_187e1c();
v_5af772();
v_4deb94();
setInterval(v_4deb94, 3000);
