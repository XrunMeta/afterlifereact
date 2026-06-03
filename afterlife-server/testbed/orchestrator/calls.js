import { v_56ab22, v_a2bce1, v_bbc8a8, v_ac99e0, v_114365, v_51c671 } from './db.js';
import { v_6f976d } from './portPool.js';

export function v_3df644({ db: v_a1651b, config: v_74a79c, deps: v_84b93d }) {
  const { python: v_885577, script: v_505315, idleMp4Default: v_48235e, portBase: v_a77882, portCount: v_bbae30, cfEnv: v_5e3942, healthTimeoutMs: v_c7d059, killGraceMs: v_d7b5fc, logStream: v_48d4f5 } = v_74a79c;

  async function v_405bd7({ cloneId: v_6e0fd3, userId: v_43e90c, idleVideoUrl: v_6e2244 }) {
    const v_f31c63 = v_6f976d(v_a1651b, v_a77882, v_bbae30);
    if (v_f31c63 === null) throw new Error('no_capacity');

    const v_be62d3 = v_84b93d.randomUUID();
    const v_dc1777 = v_84b93d.randomToken();
    const v_c0d7a5 = v_be62d3.slice(0, 8);
    const v_c04e9b = `v-${v_c0d7a5}`;
    const v_1a8cc4 = `a-${v_c0d7a5}`;

    const v_237330 = v_6e2244 || v_48235e;

    v_56ab22(v_a1651b, { callId: v_be62d3, cloneId: v_6e0fd3, userId: v_43e90c, port: v_f31c63, trackVideo: v_c04e9b, trackAudio: v_1a8cc4, idleVideo: v_237330, subscribeToken: v_dc1777, now: v_84b93d.now() });

    let v_367d87;
    let v_38ba8c;
    try {
      v_367d87 = v_84b93d.spawnPublisher({ python: v_885577, script: v_505315, port: v_f31c63, trackVideo: v_c04e9b, trackAudio: v_1a8cc4, idleMp4: v_237330, cfEnv: v_5e3942, logStream: v_48d4f5 });
      v_a2bce1(v_a1651b, v_be62d3, v_367d87.pid);
      await v_84b93d.waitHealthz(v_f31c63, { timeoutMs: v_c7d059 });
      v_38ba8c = await v_84b93d.publishStart(v_f31c63, { video: true, audio: true });
    } catch (v_9e86fd) {
      const v_3ac7e7 = v_ac99e0(v_a1651b, v_be62d3);

      if (!v_3ac7e7 || (v_3ac7e7.state !== 'ending' && v_3ac7e7.state !== 'ended')) {
        if (v_3ac7e7?.pid) await v_84b93d.killProc(v_3ac7e7.pid, { graceMs: v_d7b5fc });
        v_bbc8a8(v_a1651b, v_be62d3, 'failed', String(v_9e86fd?.message ?? v_9e86fd));
      }
      throw new Error(`spawn_failed: ${v_9e86fd?.message ?? v_9e86fd}`);
    }

    if (v_38ba8c && v_38ba8c.trackName && v_38ba8c.trackName !== v_c04e9b) {
      (v_48d4f5 ?? process.stderr).write(
        `[orch] WARN track mismatch call=${v_be62d3} expected=${v_c04e9b} got=${v_38ba8c.trackName}\n`,
      );
    }
    v_bbc8a8(v_a1651b, v_be62d3, 'live');
    return { callId: v_be62d3, subscribeToken: v_dc1777, tracks: { video: v_c04e9b, audio: v_1a8cc4 }, state: 'live' };
  }

  async function v_3b508c(v_be62d3, v_43e90c) {
    const v_3ac7e7 = v_ac99e0(v_a1651b, v_be62d3);
    if (!v_3ac7e7 || v_3ac7e7.state === 'ended' || v_3ac7e7.state === 'failed') return { ok: true };

    if (v_43e90c != null && String(v_43e90c) !== String(v_3ac7e7.user_id)) return { ok: true };
    v_bbc8a8(v_a1651b, v_be62d3, 'ending');

    if (v_3ac7e7.state !== 'starting') await v_84b93d.publishStop(v_3ac7e7.port);
    if (v_3ac7e7.pid) await v_84b93d.killProc(v_3ac7e7.pid, { graceMs: v_d7b5fc });
    v_51c671(v_a1651b, v_be62d3, 'ended_by_request', v_84b93d.now());
    return { ok: true };
  }

  async function v_4f5439() {

    for (const v_3ac7e7 of v_114365(v_a1651b)) {
      if (v_3ac7e7.pid) await v_84b93d.killProc(v_3ac7e7.pid, { graceMs: 0 });
      v_51c671(v_a1651b, v_3ac7e7.call_id, 'orchestrator_restart', v_84b93d.now());
    }
  }

  return {
    allocate: v_405bd7,
    end: v_3b508c,
    reconcile: v_4f5439,
    getCall: (v_389afb) => v_ac99e0(v_a1651b, v_389afb),
    listActive: () => v_114365(v_a1651b),
  };
}
