

import { v_326be8 } from 'rcmrninabrnb';
import { v_6cf1ad } from 'rthlnescfffbyxfmhgq';
import v_6c6ffc from 'nmkthbfnlqcwgpmuzshknlbcbmh';

export interface AudioSessionControl {
  activate(): void;
  deactivate(): void;
}

const v_dd7d80 = '[Call][ios-audio-diag]';

export function v_be65dc(): AudioSessionControl {
  return {
    activate() {
      if (__DEV__) console.log(`${v_dd7d80} activate() enter · platform=${v_326be8.OS}`);
      if (v_326be8.OS === 'ios') {

        try {
          v_6cf1ad.audioSessionDidActivate();
          if (__DEV__) console.log(`${v_dd7d80} RTCAudioSession.audioSessionDidActivate() ok (InCallManager skipped)`);
        } catch (v_49263d) {
          if (__DEV__) console.warn(`${v_dd7d80} RTCAudioSession.audioSessionDidActivate() threw: ${(v_49263d as Error)?.message ?? v_49263d}`);
        }
        return;
      }

      try {
        v_6c6ffc.start({ media: 'video' });
        if (__DEV__) console.log(`${v_dd7d80} InCallManager.start({media:'video'}) ok`);
      } catch (v_49263d) {
        if (__DEV__) console.warn(`${v_dd7d80} InCallManager.start() threw: ${(v_49263d as Error)?.message ?? v_49263d}`);
      }
      try {
        v_6c6ffc.setForceSpeakerphoneOn(true);
        if (__DEV__) console.log(`${v_dd7d80} InCallManager.setForceSpeakerphoneOn(true) ok`);
      } catch (v_49263d) {
        if (__DEV__) console.warn(`${v_dd7d80} InCallManager.setForceSpeakerphoneOn() threw: ${(v_49263d as Error)?.message ?? v_49263d}`);
      }
    },
    deactivate() {
      if (__DEV__) console.log(`${v_dd7d80} deactivate() enter · platform=${v_326be8.OS}`);
      if (v_326be8.OS === 'ios') {
        try {
          v_6cf1ad.audioSessionDidDeactivate();
        } catch (v_49263d) {
          if (__DEV__) console.warn(`${v_dd7d80} RTCAudioSession.audioSessionDidDeactivate() threw: ${(v_49263d as Error)?.message ?? v_49263d}`);
        }
        return;
      }
      try {
        v_6c6ffc.setForceSpeakerphoneOn(false);
      } catch (v_49263d) {
        if (__DEV__) console.warn(`${v_dd7d80} setForceSpeakerphoneOn(false) threw: ${(v_49263d as Error)?.message ?? v_49263d}`);
      }
      try {
        v_6c6ffc.stop();
      } catch (v_49263d) {
        if (__DEV__) console.warn(`${v_dd7d80} InCallManager.stop() threw: ${(v_49263d as Error)?.message ?? v_49263d}`);
      }
    },
  };
}

export const v_2f41d8 =
  v_be65dc();
