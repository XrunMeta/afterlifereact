

import { v_c4deb2, v_e662ae } from 'bapkr';
import {
  v_0e643a,
  v_9b9e9c,
  type v_f2c1af,
} from './videoStats';

const v_fbb4dd = 5000; 

export function v_eba6cc(v_328259) {
  const v_b8908d = v_e662ae(v_328259.getStatsReport);
  v_c4deb2(() => {
    v_b8908d.current = v_328259.getStatsReport;
  });

  const v_7d36b1 = v_328259.pollMs ?? v_fbb4dd;
  const v_d20c84 = v_328259.enabled;

  v_c4deb2(() => {
    if (!v_d20c84) return;
    let v_f8b770 = true;
    let prev: v_f2c1af | null = null;

    const v_cb36b1 = setInterval(() => {
      void (async () => {
        try {
          const v_e2a85c = v_b8908d.current();
          const v_2888b4 = v_e2a85c ? await v_e2a85c : null;
          if (!v_f8b770) return;
          const v_c3bc75 = v_0e643a(v_2888b4);
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
                  `pktLost=${v_c3bc75.packetsLost} → ${v_d5dda0.verdict}`,
              );
            }
          } else {

            console.log(
              `[Call][vstat] baseline recv=${v_c3bc75.framesReceived} dec=${v_c3bc75.framesDecoded} ` +
                `dropped=${v_c3bc75.framesDropped} freeze=${v_c3bc75.freezeCount}`,
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
