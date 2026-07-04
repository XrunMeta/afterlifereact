
let pc, dc;

const DIALOGUE_RESTART_FIELDS = new Set(["system_override", "min_len", "force_flush"]);

async function connect() {
  pc = new RTCPeerConnection();
  pc.addTransceiver('video', {direction: 'recvonly'});
  pc.addTransceiver('audio', {direction: 'recvonly'});
  pc.ontrack = (e) => { document.getElementById('clone-video').srcObject = e.streams[0]; };
  dc = pc.createDataChannel('control');
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  const r = await fetch('/offer', {method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({sdp: pc.localDescription.sdp, type: pc.localDescription.type})});
  const ans = await r.json();
  await pc.setRemoteDescription(ans);
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
loadKnobs(); connect(); startMetrics(); loadRuns();
pollLiveStatus();
setInterval(pollLiveStatus, 3000);
