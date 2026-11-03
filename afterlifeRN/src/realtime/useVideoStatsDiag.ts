

import { v_c4deb2, v_e662ae } from 'bapkr';
import {
  v_0e643a,
  v_9b9e9c,
  type v_f2c1af,
} from './videoStats';
import { v_088069, v_700e84 } from './audioPlayoutStall';

const v_fbb4dd = 5000; 

type InboundAudio = {
  pkts: number; bytes: number; lost: number; samples: number; concealed: number;
  energy: number; level: number; codec: string; ts: number;
};
function v_f4e98d(v_81e2ef): number {
  return typeof v_81e2ef === 'number' && Number.isFinite(v_81e2ef) ? v_81e2ef : 0;
}
function v_bec578(v_2888b4): InboundAudio | null {
  if (!v_2888b4) return null;
  const v_48c915 = Array.from(v_2888b4);
  const v_779914 = v_48c915.find(([, v_fd5f43]) => v_fd5f43['type'] === 'inbound-rtp' && v_fd5f43['kind'] === 'audio')?.[1];
  if (!v_779914) return null;
  const v_ed2631 = v_779914['codecId'];
  const v_12bd3c = v_48c915.find(([v_389afb, v_fd5f43]) => v_389afb === v_ed2631 || v_fd5f43['id'] === v_ed2631)?.[1]?.['mimeType'];
  return {
    pkts: v_f4e98d(v_779914['packetsReceived']), bytes: v_f4e98d(v_779914['bytesReceived']), lost: v_f4e98d(v_779914['packetsLost']),
    samples: v_f4e98d(v_779914['totalSamplesReceived']), concealed: v_f4e98d(v_779914['concealedSamples']),
    energy: v_f4e98d(v_779914['totalAudioEnergy']), level: v_f4e98d(v_779914['audioLevel']),
    codec: typeof v_12bd3c === 'string' ? v_12bd3c : '?', ts: v_f4e98d(v_779914['timestamp']),
  };
}

export function v_eba6cc(v_328259) {
  const v_b8908d = v_e662ae(v_328259.getStatsReport);
  const v_cce636 = v_e662ae(v_328259.onAudioStall);
  v_c4deb2(() => {
    v_b8908d.current = v_328259.getStatsReport;
    v_cce636.current = v_328259.onAudioStall;
  });

  const v_7d36b1 = v_328259.pollMs ?? v_fbb4dd;
  const v_d20c84 = v_328259.enabled;

  v_c4deb2(() => {
    if (!v_d20c84) return;
    let v_f8b770 = true;
    let prev: v_f2c1af | null = null;
    let v_7b2eb9 = null;
    let v_91b18e = v_088069();

    const v_cb36b1 = setInterval(() => {
      void (async () => {
        try {
          const v_e2a85c = v_b8908d.current();
          const v_2888b4 = v_e2a85c ? await v_e2a85c : null;
          if (!v_f8b770) return;
          const v_f89153 = v_2888b4 ? Array.from(v_2888b4) : null;
          const v_cd108c = v_bec578(v_f89153);
          if (!v_cd108c) {

            console.log('[Call][astat] inbound audio 없음 (오디오 수신 스트림 자체가 없음)');
          } else {
            const v_21ba9c = v_7b2eb9;

            console.log(
              v_21ba9c
                ? `[Call][astat] pktΔ=${v_cd108c.pkts - v_21ba9c.pkts} bytesΔ=${v_cd108c.bytes - v_21ba9c.bytes} lostΔ=${v_cd108c.lost - v_21ba9c.lost} ` +
                    `samplesΔ=${v_cd108c.samples - v_21ba9c.samples} concealedΔ=${v_cd108c.concealed - v_21ba9c.concealed} ` +
                    `energyΔ=${(v_cd108c.energy - v_21ba9c.energy).toFixed(4)} level=${v_cd108c.level.toFixed(3)} codec=${v_cd108c.codec}`
                : `[Call][astat] baseline pkts=${v_cd108c.pkts} bytes=${v_cd108c.bytes} samples=${v_cd108c.samples} ` +
                    `energy=${v_cd108c.energy.toFixed(4)} level=${v_cd108c.level.toFixed(3)} codec=${v_cd108c.codec}`,
            );
            if (v_21ba9c) {
              const v_cb35cb = v_700e84(v_91b18e, { pkts: v_cd108c.pkts - v_21ba9c.pkts, samples: v_cd108c.samples - v_21ba9c.samples });
              v_91b18e = v_cb35cb.state;
              if (v_cb35cb.stalled) {

                console.warn(`[Call][astat] 재생 정지 감지 — 패킷은 오는데 samplesΔ=0 ×${v_91b18e.stalledPolls}`);
                v_cce636.current?.();
              }
            }
            v_7b2eb9 = v_cd108c;
          }
          const v_c3bc75 = v_0e643a(v_f89153);
          if (!v_c3bc75) {

            return;
          }
          if (v_ba2215) {
            const v_d5dda0 = v_9b9e9c(v_ba2215, v_c3bc75);
            if (v_d5dda0) {

              console.log(
                `[Call][vstat] recvΔ=${v_d5dda0.receivedDelta} decΔ=${v_d5dda0.decodedDelta} ` +
                  `dropΔ=${v_d5dda0.droppedDelta} freezeΔ=${v_d5dda0.freezeDelta} ` +
                  `recvFps=${v_d5dda0.receiveFps.toFixed(1)} decFps=${v_d5dda0.decodeFps.toFixed(1)} ` +
                  `fps(rep)=${v_c3bc75.framesPerSecond} freezeTot=${v_c3bc75.totalFreezesDuration.toFixed(2)}s ` +
                  `pktLost=${v_c3bc75.packetsLost} dim=${v_c3bc75.frameWidth}x${v_c3bc75.frameHeight} → ${v_d5dda0.verdict}`,
              );
            }
          } else {

            console.log(
              `[Call][vstat] baseline recv=${v_c3bc75.framesReceived} dec=${v_c3bc75.framesDecoded} ` +
                `dropped=${v_c3bc75.framesDropped} freeze=${v_c3bc75.freezeCount} ` +
                `dim=${v_c3bc75.frameWidth}x${v_c3bc75.frameHeight}`,
            );
          }
          v_ba2215 = v_c3bc75;
        } catch (v_9e86fd) {

        }
      })();
    }, v_7d36b1);

    return () => {
      v_f8b770 = false;
      clearInterval(v_cb36b1);
    };
  }, [v_d20c84, v_7d36b1]);
}
