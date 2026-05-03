

const $video = document.getElementById('liveVideo');
const $startBtn = document.getElementById('startBtn');
const $stopBtn = document.getElementById('stopBtn');
const $state = document.getElementById('state');
const $info = document.getElementById('info');
const $refreshBtn = document.getElementById('refreshBtn');

let pc = null;
let publisherInfo = null;

const ICE_SERVERS = [
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.l.google.com:19302' },
];

function setState(s) {
  $state.textContent = s;
  $state.dataset.s = s;
}

function setInfo(text) {
  $info.textContent = text;
}

async function refreshPublisherInfo() {
  setInfo('publisher 상태 확인 중…');
  try {
    const r = await fetch('/oth-path', { cache: 'no-store' });
    const data = await r.json();
    publisherInfo = data;
    if (!r.ok) {
      $startBtn.disabled = true;
      setInfo(`publisher 응답 오류 (HTTP ${r.status})\n${JSON.stringify(data)}`);
      setState('error');
      return;
    }
    const lines = [
      `state: ${data.state ?? '?'}`,
      `sessionId: ${data.sessionId ? data.sessionId.slice(0, 12) + '…' : '(none)'}`,
      `trackName: ${data.trackName ?? '(none)'}`,
      `uptime_s: ${data.uptime_s ?? '?'}`,
    ];
    setInfo(lines.join('\n'));
    if (data.state === 'publishing') {
      $startBtn.disabled = false;
      if (!pc) setState('idle');
    } else {
      $startBtn.disabled = true;
      setInfo(
        lines.join('\n') +
          '\n\n→ publisher 가 publishing 상태가 아닙니다. ' +
          '서버에서 `POST /oth-path` (port 8400) 먼저 호출 필요.',
      );
      if (!pc) setState('idle');
    }
  } catch (err) {
    $startBtn.disabled = true;
    setState('error');
    setInfo('publisher info 가져오기 실패: ' + (err?.message ?? err));
  }
}

async function startSubscribe() {
  if (pc) return;
  $startBtn.disabled = true;
  setState('connecting');
  setInfo('PeerConnection 준비 중…');

  pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  pc.ontrack = (ev) => {
    if (ev.streams && ev.streams[0]) {
      $video.srcObject = ev.streams[0];
    } else {
      const ms = new MediaStream();
      ms.addTrack(ev.track);
      $video.srcObject = ms;
    }
    $video.play().catch(() => {  });
  };

  pc.oniceconnectionstatechange = () => {
    const s = pc.iceConnectionState;
    if (s === 'connected' || s === 'completed') {
      setState('playing');
    } else if (s === 'failed' || s === 'disconnected') {
      setState('error');
    } else if (s === 'closed') {
      setState('stopped');
    }
  };

  pc.onconnectionstatechange = () => {
    if (!pc) return;
    const s = pc.connectionState;
    if (s === 'connected') setState('playing');
    if (s === 'failed') setState('error');
    if (s === 'closed') setState('stopped');
  };

  setInfo('서버에 subscribe pull 요청 중…');
  let pull;
  try {
    const r = await fetch('/oth-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    pull = await r.json().catch(() => ({}));
    if (!r.ok) {
      setState('error');
      setInfo(`subscribe pull 실패 (HTTP ${r.status})\n${JSON.stringify(pull)}`);
      cleanup();
      return;
    }
  } catch (err) {
    setState('error');
    setInfo('subscribe pull 요청 실패: ' + (err?.message ?? err));
    cleanup();
    return;
  }

  const subSid = pull.subscriber_session_id;
  const offerSdp = pull.offer_sdp;
  if (!subSid || !offerSdp) {
    setState('error');
    setInfo('subscribe pull 응답 누락\n' + JSON.stringify(pull));
    cleanup();
    return;
  }

  setInfo(
    `subscriber sid: ${subSid.slice(0, 12)}…\n` +
      `offer SDP: ${offerSdp.length} bytes\n` +
      `tracks: ${(pull.tracks || []).length}\n` +
      `setRemoteDescription(offer)…`,
  );

  try {
    await pc.setRemoteDescription({ type: 'offer', sdp: offerSdp });
  } catch (err) {
    setState('error');
    setInfo('setRemoteDescription(offer) 실패: ' + (err?.message ?? err));
    cleanup();
    return;
  }

  let answer;
  try {
    answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
  } catch (err) {
    setState('error');
    setInfo('createAnswer 실패: ' + (err?.message ?? err));
    cleanup();
    return;
  }

  setInfo(
    `subscriber sid: ${subSid.slice(0, 12)}…\n` +
      `answer SDP: ${answer.sdp.length} bytes\n` +
      `renegotiate 송신 중…`,
  );

  let renego;
  try {
    const r = await fetch('/oth-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriber_session_id: subSid,
        answer_sdp: answer.sdp,
      }),
    });
    renego = await r.json().catch(() => ({}));
    if (!r.ok) {
      setState('error');
      setInfo(`renegotiate 실패 (HTTP ${r.status})\n${JSON.stringify(renego)}`);
      cleanup();
      return;
    }
  } catch (err) {
    setState('error');
    setInfo('renegotiate 요청 실패: ' + (err?.message ?? err));
    cleanup();
    return;
  }

  setInfo(
    `subscriber sid: ${subSid.slice(0, 12)}…\n` +
      `renegotiate ok\n` +
      `ICE 협상 중… (잠시 후 영상 재생)`,
  );
  $stopBtn.disabled = false;
}

function cleanup() {
  if (pc) {
    try { pc.close(); } catch (_) {  }
    pc = null;
  }
  if ($video.srcObject) {
    try {
      $video.srcObject.getTracks().forEach((t) => t.stop());
    } catch (_) {  }
    $video.srcObject = null;
  }
  $stopBtn.disabled = true;
  $startBtn.disabled = !(publisherInfo && publisherInfo.state === 'publishing');
}

function stopSubscribe() {
  cleanup();
  setState('stopped');
  setInfo('구독 종료. (다시 시작하려면 [구독 시작] 클릭)');
}

$startBtn.addEventListener('click', startSubscribe);
$stopBtn.addEventListener('click', stopSubscribe);
$refreshBtn.addEventListener('click', refreshPublisherInfo);

refreshPublisherInfo();
