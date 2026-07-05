
let v_12cd99, v_32dc97;

let v_2ca7e0 = null;

const v_f55fb5 = new Set(["system_override", "min_len", "force_flush"]);

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
  };
  v_32dc97 = v_12cd99.createDataChannel('control');

  v_32dc97.onopen = () => {
    document.getElementById('say-input').disabled = false;
    document.getElementById('say-btn').disabled = false;
    v_0b0398.textContent = '✅ dc open — say 가능';
  };
  v_32dc97.onclose = () => { v_0b0398.textContent = 'dc closed'; };
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

async function v_858a0a() {
  const v_0eb677 = await (await fetch('/knobs')).json();
  const v_a38d42 = document.getElementById('knob-fields'); v_a38d42.innerHTML='';
  for (const [v_b4fa6c, v_3332db] of Object.entries(v_0eb677)) {
    const v_9d3c52 = document.createElement('fieldset');
    v_9d3c52.innerHTML = `<legend>${v_b4fa6c}</legend>`;
    for (const [v_b24339, v_a057b5] of Object.entries(v_3332db)) {
      const v_389afb = `k_${v_b4fa6c}_${v_b24339}`;
      const v_8421c2 = (v_b4fa6c === 'dialogue' && v_f55fb5.has(v_b24339))
        ? `<span class="note">다음 접속부터 반영</span>` : '';
      const v_68adf4 = (v_b4fa6c === 'tts' && v_81f9b1.has(v_b24339))
        ? `<span class="note">qwen 전용(openvoice 무시)</span>` : '';
      v_9d3c52.innerHTML += `<div class="knob"><label>${v_b24339}${v_8421c2}${v_68adf4}</label>`+
        `<input id="${v_389afb}" value="${v_a057b5==null?'':v_a057b5}" data-s="${v_b4fa6c}" data-k="${v_b24339}"></div>`;
    }
    v_a38d42.appendChild(v_9d3c52);
  }
}

async function v_9a2a8d() {
  const v_4628fe = {};
  document.querySelectorAll('#knob-fields input').forEach(v_fb6823 => {
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
  const v_0b0398 = document.getElementById('conn-status');
  if (!v_32dc97 || v_32dc97.readyState !== 'open') {
    v_0b0398.textContent = `say 불가 — dc:${v_32dc97 ? v_32dc97.readyState : '없음'}(연결/개통 대기)`;
    return;
  }
  v_32dc97.send(JSON.stringify({type:'say', text:v_8d41d7, seq:Date.now()}));
  v_0b0398.textContent = `say 전송됨: "${v_8d41d7.slice(0, 20)}"`;
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
document.getElementById('login-btn').onclick = v_182fdb;
document.getElementById('connect-btn').onclick = v_1857f4;

v_858a0a(); v_e1242b(); v_315473();
v_4deb94();
setInterval(v_4deb94, 3000);
