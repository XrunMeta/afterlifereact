
let pc, dc;

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

let accessToken = null;

let lastSay = '-', appliedKnobCount = 0, liveBusy = false;

function renderMeter() {
  const pcState = (typeof pc !== 'undefined' && pc) ? pc.connectionState : '-';
  const dcState = (typeof dc !== 'undefined' && dc) ? dc.readyState : '-';
  const led = (on) => `<span style="color:${on ? 'var(--green)' : 'var(--text-dim)'}">●</span>`;
  const rows = [
    [led(pcState === 'connected'), '연결', `pc:${pcState} · dc:${dcState}`],
    [led(!liveBusy), '라이브', liveBusy ? '통화중(대기)' : 'idle'],
    [led(lastSay !== '-'), '마지막 say', lastSay],
    [led(appliedKnobCount > 0), '적용 knob', String(appliedKnobCount)],
  ];
  document.getElementById('metrics-out').innerHTML =
    rows.map(([l, k, v]) => `<div class="meter-row">${l} <b>${k}</b> <span>${escapeHtml(v)}</span></div>`).join('');
}

const TTS_QWEN_ONLY_FIELDS = new Set(
  ["temperature", "top_p", "top_k", "repetition_penalty", "max_new_tokens"]);

async function login() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-pw').value;
  const status = document.getElementById('login-status');
  status.textContent = '로그인 중...';
  try {
    const r = await fetch('/login', {method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email, password})});
    const body = await r.json();
    if (!r.ok || !body.accessToken) {
      status.textContent = '로그인 실패';
      return;
    }
    accessToken = body.accessToken;
    status.textContent = '로그인됨';
    await loadClones();
  } catch (e) {
    status.textContent = '로그인 오류';
  }
}

async function loadClones() {
  const select = document.getElementById('clone-select');
  if (!accessToken) return;
  try {
    const r = await fetch('/oth-path', {headers: {'Authorization': `Bearer ${accessToken}`}});
    const body = await r.json();
    select.innerHTML = '<option value="">-- 클론 선택 --</option>';
    for (const c of (body.clones || [])) {
      const opt = document.createElement('option');
      opt.value = String(c.id);
      opt.textContent = c.name || String(c.id);
      select.appendChild(opt);
    }
    select.disabled = false;
    document.getElementById('connect-btn').disabled = false;
  } catch (e) {
    document.getElementById('login-status').textContent = '클론 목록 조회 실패';
  }
}

function waitIceGathering(pc) {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    const check = () => {
      if (pc.iceGatheringState === 'complete') {
        pc.removeEventListener('icegatheringstatechange', check);
        resolve();
      }
    };
    pc.addEventListener('icegatheringstatechange', check);
    setTimeout(resolve, 3000); 
  });
}

async function connect() {
  const select = document.getElementById('clone-select');
  const cloneId = parseInt(select.value, 10);
  const cst = document.getElementById('conn-status');
  if (!cloneId || !accessToken) {
    document.getElementById('login-status').textContent = '로그인·클론 선택 필요';
    return;
  }
  cst.textContent = '연결 중...';
  pc = new RTCPeerConnection();
  pc.addTransceiver('video', {direction: 'recvonly'});
  pc.addTransceiver('audio', {direction: 'recvonly'});
  pc.ontrack = (e) => { document.getElementById('clone-video').srcObject = e.streams[0]; };
  pc.onconnectionstatechange = () => {
    cst.textContent = `pc:${pc.connectionState} · dc:${dc ? dc.readyState : '-'}`;
    renderMeter();
  };
  dc = pc.createDataChannel('control');

  dc.onopen = () => {
    document.getElementById('say-input').disabled = false;
    document.getElementById('say-btn').disabled = false;
    cst.textContent = '✅ dc open — say 가능';
    renderMeter();
  };
  dc.onclose = () => { cst.textContent = 'dc closed'; renderMeter(); };
  dc.onerror = () => { cst.textContent = 'dc error'; };
  dc.onmessage = (e) => {
    try { const m = JSON.parse(e.data); cst.textContent = `dc open · ${m.type || ''}`; } catch (_) {}
  };
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await waitIceGathering(pc);
  cst.textContent = 'offer 전송(ICE 수집 완료)...';
  const r = await fetch('/offer', {method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      sdp: pc.localDescription.sdp, type: pc.localDescription.type,
      clone_id: cloneId, access_token: accessToken,
    })});
  const ans = await r.json();
  await pc.setRemoteDescription(ans);
  cst.textContent = 'answer 수신 — dc 개통 대기';
}

const REFLOW_NOTE = {
  next_call: '다음 통화부터', container: '컨테이너 재기동', session: '다음 접속부터',
};

async function loadKnobs() {
  const [k, metaResp] = await Promise.all([
    (await fetch('/knobs')).json(),
    (await fetch('/knobs/meta')).json(),
  ]);
  const meta = metaResp.meta || {};
  const box = document.getElementById('knob-fields'); box.innerHTML = '';
  for (const [section, vals] of Object.entries(k)) {
    const ch = document.createElement('div'); ch.className = 'channel';
    const title = document.createElement('div'); title.className = 'panel-title';
    title.textContent = section; ch.appendChild(title);
    for (const [key, val] of Object.entries(vals)) {
      const path = `${section}.${key}`;
      const m = meta[path] || {type: 'string', reflow: 'next_call'};
      const row = document.createElement('div'); row.className = 'knob-row';
      const label = document.createElement('label'); label.textContent = m.label || key;
      const note = REFLOW_NOTE[m.reflow];
      if (note) { const s = document.createElement('span'); s.className = 'reflow-chip'; s.textContent = note; label.appendChild(s); }
      row.appendChild(label);
      let ctrl;
      if (m.type === 'bool') {                     
        ctrl = document.createElement('select'); ctrl.className = 'knob-toggle';
        for (const opt of ['true', 'false']) {
          const o = document.createElement('option'); o.value = opt; o.textContent = opt;
          if (String(val) === opt) o.selected = true; ctrl.appendChild(o);
        }
      } else if (m.type === 'enum') {              
        ctrl = document.createElement('select'); ctrl.className = 'knob-seg';
        for (const opt of (m.choices || [])) {
          const o = document.createElement('option'); o.value = opt; o.textContent = opt;
          if (String(val) === opt) o.selected = true; ctrl.appendChild(o);
        }
      } else {                                     
        ctrl = document.createElement('input');
        ctrl.value = (val == null ? '' : val);
      }
      ctrl.id = `k_${section}_${key}`;
      ctrl.dataset.s = section; ctrl.dataset.k = key;
      if (m.type === 'number') {                   
        const wrap = document.createElement('div'); wrap.className = 'stepper';
        const step = (String(val).includes('.') ? 0.05 : 1);
        ctrl.dataset.step = String(step);
        const down = document.createElement('button'); down.type='button';
        down.className = 'step-down'; down.textContent = '▼';
        const up = document.createElement('button'); up.type='button';
        up.className = 'step-up'; up.textContent = '▲';
        const bump = (d) => { const cur = Number(String(ctrl.value).replace(',', '.')) || 0;
          ctrl.value = (Math.round((cur + d*step)*1000)/1000); };
        down.onclick = () => bump(-1); up.onclick = () => bump(1);
        wrap.appendChild(down); wrap.appendChild(ctrl); wrap.appendChild(up);
        row.appendChild(wrap);
      } else {
        row.appendChild(ctrl);
      }
      ch.appendChild(row);
    }
    box.appendChild(ch);
  }
  refreshTtsDim();
  document.getElementById('k_tts_engine')?.addEventListener('change', refreshTtsDim);
}

function refreshTtsDim() {
  const eng = document.getElementById('k_tts_engine');
  const isOv = eng && eng.value === 'openvoice';
  for (const field of TTS_QWEN_ONLY_FIELDS) {
    const el = document.getElementById(`k_tts_${field}`);
    if (!el) continue;
    const row = el.closest('.knob-row');
    if (row) { row.classList.toggle('knob-dim', !!isOv);
      row.title = isOv ? 'openvoice 엔진에선 무시됨(qwen 전용)' : ''; }
  }
}

async function applyKnobs() {
  const partial = {};
  document.querySelectorAll('#knob-fields input, #knob-fields select').forEach(inp => {
    const s = inp.dataset.s, k = inp.dataset.k; let v = inp.value;
    if (v === '') return;
    if (v === 'true') v = true; else if (v === 'false') v = false;
    else {

      const norm = v.replace(',', '.');
      if (norm.trim() !== '' && !isNaN(Number(norm))) v = Number(norm);
    }
    (partial[s] ||= {})[k] = v;
  });
  await fetch('/knobs', {method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify(partial)});
  appliedKnobCount = Object.values(partial).reduce((n, o) => n + Object.keys(o).length, 0);
  renderMeter();
}

function sendSay() {
  const t = document.getElementById('say-input').value;
  const cst = document.getElementById('conn-status');
  if (!dc || dc.readyState !== 'open') {
    cst.textContent = `say 불가 — dc:${dc ? dc.readyState : '없음'}(연결/개통 대기)`;
    return;
  }
  dc.send(JSON.stringify({type:'say', text:t, seq:Date.now()}));
  cst.textContent = `say 전송됨: "${t.slice(0, 20)}"`;
  lastSay = t.slice(0, 20);
  renderMeter();
}

function startMetrics() {
  const es = new EventSource('/metrics');
  es.onmessage = () => { renderMeter(); };
}

async function pollLiveStatus() {
  try {
    const r = await fetch('/live-status');
    const data = await r.json();
    document.getElementById('live-banner').style.display = data.busy ? 'block' : 'none';
    liveBusy = !!data.busy;
    renderMeter();
  } catch (e) {

  }
}

async function replayTts(runId) {
  await fetch('/replay/tts', {method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({run_id: runId})});
  await loadRuns();
}

async function replayFifth(runId) {
  await fetch('/replay/fifth', {method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({run_id: runId})});
  await loadRuns();
}

async function loadRuns() {
  const box = document.getElementById('runs-list');
  try {
    const runs = await (await fetch('/runs')).json();
    if (!runs.length) { box.innerHTML = '<i>run 없음</i>'; return; }
    let html = '<table><tr><th>run_id</th><th>pinned</th><th></th></tr>';
    for (const r of runs) {
      html += `<tr><td>${r.run_id}</td><td>${r.pinned ? '📌' : ''}</td>`+
        `<td><button onclick="replayTts('${r.run_id}')">재생(tts)</button>`+
        `<button onclick="replayFifth('${r.run_id}')">재생(fifth)</button></td></tr>`;
    }
    html += '</table>';
    box.innerHTML = html;
  } catch (e) {
    box.innerHTML = '<i>run 목록 조회 실패</i>';
  }
}

async function loadProdStatus() {
  const box = document.getElementById('prod-status');
  try {
    const d = await (await fetch('/production-status')).json();
    let html = `<div style="color:var(--text-dim)">MainPID: ${escapeHtml(d.mainpid ?? '-')} · ${escapeHtml(d.generated_at)}</div>`;
    html += '<table><tr><th>env</th><th>conf</th><th>실행값</th><th>상태</th></tr>';
    for (const r of d.rows) {
      const cls = r.state === 'drift' ? 'chip-drift' : (r.state === 'unknown' ? 'chip-unknown' : 'chip-ok');
      html += `<tr><td>${escapeHtml(r.env)}</td><td>${escapeHtml(r.conf)}</td><td>${escapeHtml(r.running)}</td>`+
        `<td><span class="chip ${cls}">${escapeHtml(r.state)}</span></td></tr>`;
    }
    html += '</table>';
    box.innerHTML = html;
  } catch (e) { box.innerHTML = '<i>상태 조회 실패</i>'; }
}

document.getElementById('apply-knobs').onclick = applyKnobs;
document.getElementById('say-btn').onclick = sendSay;
document.getElementById('say-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.isComposing) {   
    e.preventDefault();
    sendSay();
    e.target.value = '';                        
  }
});
document.getElementById('refresh-runs').onclick = loadRuns;
document.getElementById('refresh-prod').onclick = loadProdStatus;
document.getElementById('login-btn').onclick = login;
document.getElementById('connect-btn').onclick = connect;

loadKnobs(); startMetrics(); loadRuns(); loadProdStatus();
renderMeter();
pollLiveStatus();
setInterval(pollLiveStatus, 3000);
