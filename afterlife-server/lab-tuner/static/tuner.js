
let pc, dc;

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
    const fs = document.createElement('fieldset');
    const lg = document.createElement('legend'); lg.textContent = section; fs.appendChild(lg);
    for (const [key, val] of Object.entries(vals)) {
      const path = `${section}.${key}`;
      const m = meta[path] || {type: 'string', reflow: 'next_call'};
      const wrap = document.createElement('div'); wrap.className = 'knob';
      const label = document.createElement('label');
      label.textContent = m.label || key;
      const note = REFLOW_NOTE[m.reflow];
      if (note) { const s = document.createElement('span'); s.className = 'note'; s.textContent = note; label.appendChild(s); }
      wrap.appendChild(label);
      let ctrl;
      if (m.type === 'bool') {
        ctrl = document.createElement('select');
        for (const opt of ['true', 'false']) {
          const o = document.createElement('option'); o.value = opt; o.textContent = opt;
          if (String(val) === opt) o.selected = true;   
          ctrl.appendChild(o);
        }
      } else if (m.type === 'enum') {
        ctrl = document.createElement('select');
        for (const opt of (m.choices || [])) {
          const o = document.createElement('option'); o.value = opt; o.textContent = opt;
          if (String(val) === opt) o.selected = true;   
          ctrl.appendChild(o);
        }
      } else {
        ctrl = document.createElement('input');
        ctrl.value = (val == null ? '' : val);
      }
      ctrl.id = `k_${section}_${key}`;
      ctrl.dataset.s = section; ctrl.dataset.k = key;
      wrap.appendChild(ctrl);
      fs.appendChild(wrap);
    }
    box.appendChild(fs);
  }
}

async function applyKnobs() {
  const partial = {};
  document.querySelectorAll('#knob-fields input, #knob-fields select').forEach(inp => {
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
