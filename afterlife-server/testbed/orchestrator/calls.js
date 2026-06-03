import { insertCall, setPid, updateState, getCall, listActive, endCall } from './db.js';
import { allocatePort } from './portPool.js';

export function createOrchestrator({ db, config, deps }) {
  const { python, script, idleMp4Default, portBase, portCount, cfEnv, healthTimeoutMs, killGraceMs, logStream } = config;

  async function allocate({ cloneId, userId, idleVideoUrl }) {
    const port = allocatePort(db, portBase, portCount);
    if (port === null) throw new Error('no_capacity');

    const callId = deps.randomUUID();
    const subscribeToken = deps.randomToken();
    const short = callId.slice(0, 8);
    const trackVideo = `v-${short}`;
    const trackAudio = `a-${short}`;

    const idleMp4 = idleVideoUrl || idleMp4Default;

    insertCall(db, { callId, cloneId, userId, port, trackVideo, trackAudio, idleVideo: idleMp4, subscribeToken, now: deps.now() });

    let child;
    let startRes;
    try {
      child = deps.spawnPublisher({ python, script, port, trackVideo, trackAudio, idleMp4, cfEnv, logStream });
      setPid(db, callId, child.pid);
      await deps.waitHealthz(port, { timeoutMs: healthTimeoutMs });
      startRes = await deps.publishStart(port, { video: true, audio: true });
    } catch (e) {
      const row = getCall(db, callId);

      if (!row || (row.state !== 'ending' && row.state !== 'ended')) {
        if (row?.pid) await deps.killProc(row.pid, { graceMs: killGraceMs });
        updateState(db, callId, 'failed', String(e?.message ?? e));
      }
      throw new Error(`spawn_failed: ${e?.message ?? e}`);
    }

    if (startRes && startRes.trackName && startRes.trackName !== trackVideo) {
      (logStream ?? process.stderr).write(
        `[orch] WARN track mismatch call=${callId} expected=${trackVideo} got=${startRes.trackName}\n`,
      );
    }
    updateState(db, callId, 'live');
    return { callId, subscribeToken, tracks: { video: trackVideo, audio: trackAudio }, state: 'live' };
  }

  async function end(callId, userId) {
    const row = getCall(db, callId);
    if (!row || row.state === 'ended' || row.state === 'failed') return { ok: true };

    if (userId != null && String(userId) !== String(row.user_id)) return { ok: true };
    updateState(db, callId, 'ending');

    if (row.state !== 'starting') await deps.publishStop(row.port);
    if (row.pid) await deps.killProc(row.pid, { graceMs: killGraceMs });
    endCall(db, callId, 'ended_by_request', deps.now());
    return { ok: true };
  }

  async function reconcile() {

    for (const row of listActive(db)) {
      if (row.pid) await deps.killProc(row.pid, { graceMs: 0 });
      endCall(db, row.call_id, 'orchestrator_restart', deps.now());
    }
  }

  return {
    allocate,
    end,
    reconcile,
    getCall: (id) => getCall(db, id),
    listActive: () => listActive(db),
  };
}
