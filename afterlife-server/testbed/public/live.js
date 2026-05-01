

const v_d04516 = document.getElementById('liveVideo');
const v_79da7e = document.getElementById('startBtn');
const v_c6799c = document.getElementById('stopBtn');
const v_f4af5d = document.getElementById('state');
const v_9e751b = document.getElementById('info');
const v_92b169 = document.getElementById('refreshBtn');

let v_12cd99 = null;
let v_1f9f0c = null;

const v_506dd1 = [
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.l.google.com:19302' },
];

function v_1fa668(v_fd5f43) {
  v_f4af5d.textContent = v_fd5f43;
  v_f4af5d.dataset.s = v_fd5f43;
}

function v_035062(v_9b6134) {
  v_9e751b.textContent = v_9b6134;
}

async function v_462088() {
  v_035062('publisher 상태 확인 중…');
  try {
    const v_cb35cb = await fetch('/oth-path', { cache: 'no-store' });
    const v_9390e8 = await v_cb35cb.json();
    v_1f9f0c = v_9390e8;
    if (!v_cb35cb.ok) {
      v_79da7e.disabled = true;
      v_035062(`publisher 응답 오류 (HTTP ${v_cb35cb.status})\n${JSON.stringify(v_9390e8)}`);
      v_1fa668('error');
      return;
    }
    const v_a52412 = [
      `state: ${v_9390e8.state ?? '?'}`,
      `sessionId: ${v_9390e8.sessionId ? v_9390e8.sessionId.slice(0, 12) + '…' : '(none)'}`,
      `trackName: ${v_9390e8.trackName ?? '(none)'}`,
      `uptime_s: ${v_9390e8.uptime_s ?? '?'}`,
    ];
    v_035062(v_a52412.join('\n'));
    if (v_9390e8.state === 'publishing') {
      v_79da7e.disabled = false;
      if (!v_12cd99) v_1fa668('idle');
    } else {
      v_79da7e.disabled = true;
      v_035062(
        v_a52412.join('\n') +
          '\n\n→ publisher 가 publishing 상태가 아닙니다. ' +
          '서버에서 `POST /oth-path` (port 8400) 먼저 호출 필요.',
      );
      if (!v_12cd99) v_1fa668('idle');
    }
  } catch (v_49263d) {
    v_79da7e.disabled = true;
    v_1fa668('error');
    v_035062('publisher info 가져오기 실패: ' + (v_49263d?.message ?? v_49263d));
  }
}

async function v_4cb8e7() {
  if (v_12cd99) return;
  v_79da7e.disabled = true;
  v_1fa668('connecting');
  v_035062('PeerConnection 준비 중…');

  v_12cd99 = new RTCPeerConnection({ iceServers: v_506dd1 });

  v_12cd99.ontrack = (v_1d299c) => {
    if (v_1d299c.streams && v_1d299c.streams[0]) {
      v_d04516.srcObject = v_1d299c.streams[0];
    } else {
      const v_d799e2 = new MediaStream();
      v_d799e2.addTrack(v_1d299c.track);
      v_d04516.srcObject = v_d799e2;
    }
    v_d04516.play().catch(() => {  });
  };

  v_12cd99.oniceconnectionstatechange = () => {
    const v_fd5f43 = v_12cd99.iceConnectionState;
    if (v_fd5f43 === 'connected' || v_fd5f43 === 'completed') {
      v_1fa668('playing');
    } else if (v_fd5f43 === 'failed' || v_fd5f43 === 'disconnected') {
      v_1fa668('error');
    } else if (v_fd5f43 === 'closed') {
      v_1fa668('stopped');
    }
  };

  v_12cd99.onconnectionstatechange = () => {
    if (!v_12cd99) return;
    const v_fd5f43 = v_12cd99.connectionState;
    if (v_fd5f43 === 'connected') v_1fa668('playing');
    if (v_fd5f43 === 'failed') v_1fa668('error');
    if (v_fd5f43 === 'closed') v_1fa668('stopped');
  };

  v_035062('서버에 subscribe pull 요청 중…');
  let v_4cb70c;
  try {
    const v_cb35cb = await fetch('/oth-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    v_4cb70c = await v_cb35cb.json().catch(() => ({}));
    if (!v_cb35cb.ok) {
      v_1fa668('error');
      v_035062(`subscribe pull 실패 (HTTP ${v_cb35cb.status})\n${JSON.stringify(v_4cb70c)}`);
      v_a983d4();
      return;
    }
  } catch (v_49263d) {
    v_1fa668('error');
    v_035062('subscribe pull 요청 실패: ' + (v_49263d?.message ?? v_49263d));
    v_a983d4();
    return;
  }

  const v_5bd2a8 = v_4cb70c.subscriber_session_id;
  const v_582c5e = v_4cb70c.offer_sdp;
  if (!v_5bd2a8 || !v_582c5e) {
    v_1fa668('error');
    v_035062('subscribe pull 응답 누락\n' + JSON.stringify(v_4cb70c));
    v_a983d4();
    return;
  }

  v_035062(
    `subscriber sid: ${v_5bd2a8.slice(0, 12)}…\n` +
      `offer SDP: ${v_582c5e.length} bytes\n` +
      `tracks: ${(v_4cb70c.tracks || []).length}\n` +
      `setRemoteDescription(offer)…`,
  );

  try {
    await v_12cd99.setRemoteDescription({ type: 'offer', sdp: v_582c5e });
  } catch (v_49263d) {
    v_1fa668('error');
    v_035062('setRemoteDescription(offer) 실패: ' + (v_49263d?.message ?? v_49263d));
    v_a983d4();
    return;
  }

  let v_343c90;
  try {
    v_343c90 = await v_12cd99.createAnswer();
    await v_12cd99.setLocalDescription(v_343c90);
  } catch (v_49263d) {
    v_1fa668('error');
    v_035062('createAnswer 실패: ' + (v_49263d?.message ?? v_49263d));
    v_a983d4();
    return;
  }

  v_035062(
    `subscriber sid: ${v_5bd2a8.slice(0, 12)}…\n` +
      `answer SDP: ${v_343c90.sdp.length} bytes\n` +
      `renegotiate 송신 중…`,
  );

  let v_3dff88;
  try {
    const v_cb35cb = await fetch('/oth-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriber_session_id: v_5bd2a8,
        answer_sdp: v_343c90.sdp,
      }),
    });
    v_3dff88 = await v_cb35cb.json().catch(() => ({}));
    if (!v_cb35cb.ok) {
      v_1fa668('error');
      v_035062(`renegotiate 실패 (HTTP ${v_cb35cb.status})\n${JSON.stringify(v_3dff88)}`);
      v_a983d4();
      return;
    }
  } catch (v_49263d) {
    v_1fa668('error');
    v_035062('renegotiate 요청 실패: ' + (v_49263d?.message ?? v_49263d));
    v_a983d4();
    return;
  }

  v_035062(
    `subscriber sid: ${v_5bd2a8.slice(0, 12)}…\n` +
      `renegotiate ok\n` +
      `ICE 협상 중… (잠시 후 영상 재생)`,
  );
  v_c6799c.disabled = false;
}

function v_a983d4() {
  if (v_12cd99) {
    try { v_12cd99.close(); } catch (v_37eab7) {  }
    v_12cd99 = null;
  }
  if (v_d04516.srcObject) {
    try {
      v_d04516.srcObject.getTracks().forEach((v_8d41d7) => v_8d41d7.stop());
    } catch (v_37eab7) {  }
    v_d04516.srcObject = null;
  }
  v_c6799c.disabled = true;
  v_79da7e.disabled = !(v_1f9f0c && v_1f9f0c.state === 'publishing');
}

function v_9aeaba() {
  v_a983d4();
  v_1fa668('stopped');
  v_035062('구독 종료. (다시 시작하려면 [구독 시작] 클릭)');
}

v_79da7e.addEventListener('click', v_4cb8e7);
v_c6799c.addEventListener('click', v_9aeaba);
v_92b169.addEventListener('click', v_462088);

v_462088();
