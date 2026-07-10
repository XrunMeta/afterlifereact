
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
  document.getElementById('connect-btn').disabled = true;
  document.getElementById('hangup-btn').disabled = false;
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

function hangup() {
  try { if (dc) dc.close(); } catch (_) {}
  try { if (pc) pc.close(); } catch (_) {}
  pc = null; dc = null;
  const v = document.getElementById('clone-video');
  if (v) v.srcObject = null;
  document.getElementById('say-input').disabled = true;
  document.getElementById('say-btn').disabled = true;
  document.getElementById('conn-status').textContent = '끊김 — 재연결 가능';
  document.getElementById('hangup-btn').disabled = true;
  document.getElementById('connect-btn').disabled = false;
  renderMeter();
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

      if (KNOB_ENV_MAP[path]) {
        const badge = document.createElement('span');
        badge.id = `running-${path}`; badge.className = 'reflow-chip';
        badge.textContent = '실행값 조회중...';
        label.appendChild(badge);
      }
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
  applyKnobDriftBadges();   
}

const KNOB_ENV_MAP = { 'fifth.render_mode': 'PRETHIRD_RENDER_MODE' };
let lastProdRows = null;   
let lastProdMainPid = null;   

function applyKnobDriftBadges() {
  if (!lastProdRows) return;
  const rowsByEnv = {};
  for (const r of lastProdRows) rowsByEnv[r.env] = r;
  for (const [path, env] of Object.entries(KNOB_ENV_MAP)) {
    const badge = document.getElementById(`running-${path}`);
    const ctrl = document.getElementById(`k_${path.replace('.', '_')}`);
    if (!badge || !ctrl) continue;   
    const row = rowsByEnv[env];

    if (!row || row.state === 'unknown') {
      badge.textContent = '실제: 확인불가(prethird 미기동?)';
      badge.className = 'reflow-chip';
      continue;
    }
    const selected = ctrl.value;
    if (selected !== row.running) {
      badge.textContent = `⚠ 선택:${selected} · 실제:${row.running} · 재기동 필요`;
      badge.className = 'reflow-chip chip-drift';
    } else {
      badge.textContent = `실제:${row.running}`;
      badge.className = 'reflow-chip chip-ok';
    }
  }
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
    return false;
  }
  dc.send(JSON.stringify({type:'say', text:t, seq:Date.now()}));
  cst.textContent = `say 전송됨: "${t.slice(0, 20)}"`;
  lastSay = t.slice(0, 20);
  renderMeter();
  return true;
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
    lastProdRows = d.rows || [];   
    lastProdMainPid = d.mainpid ?? null;   
    let html = `<div style="color:var(--text-dim)">MainPID: ${escapeHtml(d.mainpid ?? '-')} · ${escapeHtml(d.generated_at)}</div>`;
    html += '<table><tr><th>env</th><th>conf</th><th>실행값</th><th>상태</th></tr>';
    for (const r of d.rows) {
      const cls = r.state === 'drift' ? 'chip-drift' : (r.state === 'unknown' ? 'chip-unknown' : 'chip-ok');
      html += `<tr><td>${escapeHtml(r.env)}</td><td>${escapeHtml(r.conf)}</td><td>${escapeHtml(r.running)}</td>`+
        `<td><span class="chip ${cls}">${escapeHtml(r.state)}</span></td></tr>`;
    }
    html += '</table>';
    box.innerHTML = html;
    applyKnobDriftBadges();   
  } catch (e) { box.innerHTML = '<i>상태 조회 실패</i>'; }
}

async function promotePreview() {
  const cbox = document.getElementById('promote-confirm');
  try {
    const d = await (await fetch('/promote/preview', {method:'POST',
      headers:{'Content-Type':'application/json'}, body:'{}'})).json();
    const entries = d.entries || [];
    if (!entries.length) { cbox.style.display='block';
      cbox.innerHTML = '<i>변경(dirty)된 knob 없음 — promote 대상 없음</i>'; return; }
    let html = '<div style="border:1px solid var(--gold);border-radius:4px;padding:8px;margin-top:8px">';
    html += '<b>라이브 반영될 변경:</b><ul>';

    for (const e of entries) {
      html += `<li>${escapeHtml(e.env ?? '')} = ${escapeHtml(e.new ?? '')}`+
        `${e.container ? ' <span class="chip chip-drift">컨테이너(별도 반영 필요)</span>' : ''}</li>`;
    }
    html += '</ul><button id="promote-go" class="primary">확인·적용</button> '+
            '<button id="promote-cancel">취소</button></div>';
    cbox.innerHTML = html; cbox.style.display = 'block';
    document.getElementById('promote-token').style.display = 'block';
    document.getElementById('promote-go').onclick = promoteApply;
    document.getElementById('promote-cancel').onclick = () => {
      cbox.style.display='none'; document.getElementById('promote-token').style.display='none'; };
  } catch (e) { cbox.style.display='block'; cbox.innerHTML = '<i>promote preview 실패</i>'; }
}

async function promoteApply() {
  const cbox = document.getElementById('promote-confirm');
  const token = document.getElementById('promote-token').value;

  const headers = {'Content-Type':'application/json'};
  if (token) headers['X-Lab-Tuner-Token'] = token;   
  try {

    const r = await fetch('/promote/apply', {method:'POST', headers, body: JSON.stringify({confirm: true})});
    if (r.status === 401 || r.status === 403) {
      cbox.innerHTML = '<i>인증 실패 — LAB_TUNER_TOKEN 확인</i>'; return; }
    let d = {};
    try { d = await r.json(); } catch (_) {  }
    if (!r.ok) {
      cbox.innerHTML = '<i>실패: ' + escapeHtml(d.error || (r.status + ' 오류')) + '</i>';
      return;
    }
    cbox.innerHTML = `<div>적용됨: ${escapeHtml(JSON.stringify(d).slice(0,200))}</div>`;
    document.getElementById('promote-token').style.display = 'none';
    await loadProdStatus();
  } catch (e) { cbox.innerHTML = '<i>promote apply 실패</i>'; }
}

async function restartShowConfirm() {
  const cbox = document.getElementById('restart-confirm');
  cbox.style.display = 'block';
  cbox.innerHTML = '<div><i>미적용 변경 확인 중…</i></div>';

  let warnHtml = '';
  try {
    const d = await (await fetch('/promote/preview', {method:'POST',
      headers:{'Content-Type':'application/json'}, body:'{}'})).json();
    if ((d.entries || []).length) {
      warnHtml = '<div style="color:var(--red)"><b>⚠️ 선택값이 아직 실행 중 프로세스와 다릅니다.</b><br>'+
        '라이브 적용(promote)을 <u>안 했으면</u> 먼저 하세요. '+
        '<b>이미 &#39;적용됨&#39;을 보셨다면 아래 &#39;확인·재기동&#39;만 누르면 반영됩니다</b>(취소하지 마세요).</div>';
    }
  } catch (e) {  }
  cbox.innerHTML = warnHtml +
    '<div style="border:1px solid var(--red);border-radius:4px;padding:8px;margin-top:8px">'+
    '<b>prethird 재기동 — 진행중 통화 끊길 수 있음. 계속?</b><br>'+
    '<button id="restart-go" class="primary">확인·재기동</button> '+
    '<button id="restart-cancel">취소</button></div>';
  document.getElementById('promote-token').style.display = 'block';
  document.getElementById('restart-go').onclick = restartApply;
  document.getElementById('restart-cancel').onclick = () => { cbox.style.display = 'none'; };
}

async function pollForNewMainPid(oldMainPid, cbox) {
  const maxAttempts = 10;
  for (let i = 1; i <= maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    cbox.innerHTML = `<div>재기동 중… 새 프로세스 기동 확인중(${i * 2}s/${maxAttempts * 2}s)</div>`;
    try {
      const d = await (await fetch('/production-status')).json();
      if (d.mainpid && d.mainpid !== oldMainPid) {
        lastProdRows = d.rows || [];
        lastProdMainPid = d.mainpid;
        return true;
      }
    } catch (e) {  }
  }
  return false;
}

async function restartApply() {
  const cbox = document.getElementById('restart-confirm');
  const token = document.getElementById('promote-token').value;

  const headers = {'Content-Type':'application/json'};
  if (token) headers['X-Lab-Tuner-Token'] = token;
  const oldMainPid = lastProdMainPid;   
  try {
    const r = await fetch('/promote/restart', {method:'POST', headers,
      body: JSON.stringify({confirm: "RESTART", confirm2: true})});
    if (r.status === 401 || r.status === 403) {
      cbox.innerHTML = '<i>인증 실패 — LAB_TUNER_TOKEN 확인</i>'; return; }
    let d = {};
    try { d = await r.json(); } catch (_) {  }
    if (!r.ok) {
      cbox.innerHTML = '<i>실패: ' + escapeHtml(d.error || (r.status + ' 오류')) + '</i>';
      return;
    }
    cbox.innerHTML = `<div>재기동 요청 완료(returncode=${escapeHtml(d.restart_returncode)}) — `+
      `새 프로세스 기동 대기중…</div>`;
    const started = await pollForNewMainPid(oldMainPid, cbox);
    if (started) {
      cbox.innerHTML = `<div>재기동 완료(MainPID:${escapeHtml(lastProdMainPid)}) — 실행값 갱신됨</div>`;
      await loadProdStatus();
    } else {
      cbox.innerHTML = '<i>재기동 확인 시간초과(20s) — "프로덕션 상태" 새로고침으로 직접 확인하세요</i>';
    }
  } catch (e) { cbox.innerHTML = '<i>재기동 요청 실패</i>'; }
}

async function loadDevToken() {
  try {
    const r = await fetch('/dev-token');
    if (!r.ok) return;   
    const d = await r.json();
    if (d.token) document.getElementById('promote-token').value = d.token;
  } catch (e) {  }
}

document.getElementById('apply-knobs').onclick = applyKnobs;
document.getElementById('promote').onclick = promotePreview;
document.getElementById('restart-prethird').onclick = restartShowConfirm;
document.getElementById('say-btn').onclick = sendSay;
document.getElementById('say-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.isComposing) {   
    e.preventDefault();
    if (sendSay()) {                            
      e.target.value = '';                      
    }
  }
});
document.getElementById('refresh-runs').onclick = loadRuns;
document.getElementById('refresh-prod').onclick = loadProdStatus;
document.getElementById('login-btn').onclick = login;
document.getElementById('connect-btn').onclick = connect;
document.getElementById('hangup-btn').onclick = hangup;

loadKnobs(); startMetrics(); loadRuns(); loadProdStatus(); loadDevToken();
renderMeter();
pollLiveStatus();
setInterval(pollLiveStatus, 3000);
