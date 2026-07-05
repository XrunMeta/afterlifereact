
let v_12cd99, v_32dc97;

async function v_1857f4() {
  v_12cd99 = new RTCPeerConnection();
  v_12cd99.addTransceiver('video', {direction: 'recvonly'});
  v_12cd99.addTransceiver('audio', {direction: 'recvonly'});
  v_12cd99.ontrack = (v_9e86fd) => { document.getElementById('clone-video').srcObject = v_9e86fd.streams[0]; };
  v_32dc97 = v_12cd99.createDataChannel('control');
  const v_ef91d7 = await v_12cd99.createOffer();
  await v_12cd99.setLocalDescription(v_ef91d7);
  const v_cb35cb = await fetch('/offer', {method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({sdp: v_12cd99.localDescription.sdp, type: v_12cd99.localDescription.type})});
  const v_7c0968 = await v_cb35cb.json();
  await v_12cd99.setRemoteDescription(v_7c0968);
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
    const v_9d3c52 = document.createElement('fieldset');
    const v_33d08f = document.createElement('legend'); v_33d08f.textContent = v_b4fa6c; v_9d3c52.appendChild(v_33d08f);
    for (const [v_b24339, v_a057b5] of Object.entries(v_3332db)) {
      const v_9fe22d = `${v_b4fa6c}.${v_b24339}`;
      const v_35f85c = v_ab4c96[v_9fe22d] || {type: 'string', reflow: 'next_call'};
      const v_83ff11 = document.createElement('div'); v_83ff11.className = 'knob';
      const v_2869c1 = document.createElement('label');
      v_2869c1.textContent = v_35f85c.label || v_b24339;
      const v_638ecc = v_a7deb0[v_35f85c.reflow];
      if (v_638ecc) { const v_fd5f43 = document.createElement('span'); v_fd5f43.className = 'note'; v_fd5f43.textContent = v_638ecc; v_2869c1.appendChild(v_fd5f43); }
      v_83ff11.appendChild(v_2869c1);
      let v_22d288;
      if (v_35f85c.type === 'bool') {
        v_22d288 = document.createElement('select');
        for (const v_68b2be of ['true', 'false']) {
          const v_b6c474 = document.createElement('option'); v_b6c474.value = v_68b2be; v_b6c474.textContent = v_68b2be;
          if (String(v_a057b5) === v_68b2be) v_b6c474.selected = true;   
          v_22d288.appendChild(v_b6c474);
        }
      } else if (v_35f85c.type === 'enum') {
        v_22d288 = document.createElement('select');
        for (const v_68b2be of (v_35f85c.choices || [])) {
          const v_b6c474 = document.createElement('option'); v_b6c474.value = v_68b2be; v_b6c474.textContent = v_68b2be;
          if (String(v_a057b5) === v_68b2be) v_b6c474.selected = true;   
          v_22d288.appendChild(v_b6c474);
        }
      } else {
        v_22d288 = document.createElement('input');
        v_22d288.value = (v_a057b5 == null ? '' : v_a057b5);
      }
      v_22d288.id = `k_${v_b4fa6c}_${v_b24339}`;
      v_22d288.dataset.s = v_b4fa6c; v_22d288.dataset.k = v_b24339;
      v_83ff11.appendChild(v_22d288);
      v_9d3c52.appendChild(v_83ff11);
    }
    v_a38d42.appendChild(v_9d3c52);
  }
}

async function v_9a2a8d() {
  const v_4628fe = {};
  document.querySelectorAll('#knob-fields input, #knob-fields select').forEach(v_fb6823 => {
    const v_fd5f43 = v_fb6823.dataset.s, v_0eb677 = v_fb6823.dataset.k; let v_81e2ef = v_fb6823.value;
    if (v_81e2ef === '') return;
    if (v_81e2ef === 'true') v_81e2ef = true; else if (v_81e2ef === 'false') v_81e2ef = false;
    else if (!isNaN(Number(v_81e2ef))) v_81e2ef = Number(v_81e2ef);
    (v_4628fe[v_fd5f43] ||= {})[v_0eb677] = v_81e2ef;
  });
  await fetch('/knobs', {method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify(v_4628fe)});
}

function v_409b14() {
  const v_8d41d7 = document.getElementById('say-input').value;
  if (v_32dc97 && v_32dc97.readyState === 'open') v_32dc97.send(JSON.stringify({type:'say', text:v_8d41d7, seq:Date.now()}));
}

function v_e1242b() {
  const v_9ba48b = new EventSource('/metrics');
  v_9ba48b.onmessage = (v_9e86fd) => { document.getElementById('metrics-out').textContent = v_9e86fd.data; };
}

async function v_4deb94() {
  try {
    const v_cb35cb = await fetch('/live-status');
    const v_9390e8 = await v_cb35cb.json();
    document.getElementById('live-banner').style.display = v_9390e8.busy ? 'block' : 'none';
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

document.getElementById('apply-knobs').onclick = v_9a2a8d;
document.getElementById('say-btn').onclick = v_409b14;
document.getElementById('refresh-runs').onclick = v_315473;
v_858a0a(); v_1857f4(); v_e1242b(); v_315473();
v_4deb94();
setInterval(v_4deb94, 3000);
