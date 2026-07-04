
let pc, dc;

let accessToken = null;

const DIALOGUE_RESTART_FIELDS = new Set(["system_override", "min_len", "force_flush"]);

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

async function connect() {
  const select = document.getElementById('clone-select');
  const cloneId = parseInt(select.value, 10);
  if (!cloneId || !accessToken) {
    document.getElementById('login-status').textContent = '로그인·클론 선택 필요';
    return;
  }
  pc = new RTCPeerConnection();
  pc.addTransceiver('video', {direction: 'recvonly'});
  pc.addTransceiver('audio', {direction: 'recvonly'});
  pc.ontrack = (e) => { document.getElementById('clone-video').srcObject = e.streams[0]; };
  dc = pc.createDataChannel('control');
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  const r = await fetch('/offer', {method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      sdp: pc.localDescription.sdp, type: pc.localDescription.type,
      clone_id: cloneId, access_token: accessToken,
    })});
  const ans = await r.json();
  await pc.setRemoteDescription(ans);

  document.getElementById('say-input').disabled = false;
  document.getElementById('say-btn').disabled = false;
}

async function loadKnobs() {
  const k = await (await fetch('/knobs')).json();
  const box = document.getElementById('knob-fields'); box.innerHTML='';
  for (const [section, vals] of Object.entries(k)) {
    const fs = document.createElement('fieldset');
    fs.innerHTML = `<legend>${section}</legend>`;
    for (const [key, val] of Object.entries(vals)) {
      const id = `k_${section}_${key}`;
      const restartNote = (section === 'dialogue' && DIALOGUE_RESTART_FIELDS.has(key))
        ? `<span class="note">다음 접속부터 반영</span>` : '';
      fs.innerHTML += `<div class="knob"><label>${key}${restartNote}</label>`+
        `<input id="${id}" value="${val==null?'':val}" data-s="${section}" data-k="${key}"></div>`;
    }
    box.appendChild(fs);
  }
}

async function applyKnobs() {
  const partial = {};
  document.querySelectorAll('#knob-fields input').forEach(inp => {
    const s = inp.dataset.s, k = inp.dataset.k; let v = inp.value;
    if (v === '') return;
    if (v === 'true') v = true; else if (v === 'false') v = false;
    else if (!isNaN(Number(v))) v = Number(v);
    (partial[s] ||= {})[k] = v;
  });
  await fetch('/knobs', {method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify(partial)});
}

function sendSay() {
  const t = document.getElementById('say-input').value;
  if (dc && dc.readyState === 'open') dc.send(JSON.stringify({type:'say', text:t, seq:Date.now()}));
}

function startMetrics() {
  const es = new EventSource('/metrics');
  es.onmessage = (e) => { document.getElementById('metrics-out').textContent = e.data; };
}

async function pollLiveStatus() {
  try {
    const r = await fetch('/live-status');
    const data = await r.json();
    document.getElementById('live-banner').style.display = data.busy ? 'block' : 'none';
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

document.getElementById('apply-knobs').onclick = applyKnobs;
document.getElementById('say-btn').onclick = sendSay;
document.getElementById('refresh-runs').onclick = loadRuns;
document.getElementById('login-btn').onclick = login;
document.getElementById('connect-btn').onclick = connect;

loadKnobs(); startMetrics(); loadRuns();
pollLiveStatus();
setInterval(pollLiveStatus, 3000);
