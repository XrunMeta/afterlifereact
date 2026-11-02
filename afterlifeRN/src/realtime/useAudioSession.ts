

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
          if (__DEV__) console.log(`${v_dd7d80} RTCAudioSession.audioSessionDidActivate() ok`);
        } catch (v_49263d) {
          if (__DEV__) console.warn(`${v_dd7d80} RTCAudioSession.audioSessionDidActivate() threw: ${(v_49263d as Error)?.message ?? v_49263d}`);
        }
      }

      try {
        if (v_326be8.OS === 'ios') {
          v_6c6ffc.start({ media: 'audio', auto: false });
          if (__DEV__) console.log(`${v_dd7d80} InCallManager.start({media:'audio', auto:false}) ok`);
        } else {
          v_6c6ffc.start({ media: 'video' });
          if (__DEV__) console.log(`${v_dd7d80} InCallManager.start({media:'video'}) ok`);
        }
      } catch (v_49263d) {
        if (__DEV__) console.warn(`${v_dd7d80} InCallManager.start() threw: ${(v_49263d as Error)?.message ?? v_49263d}`);
      }
      if (v_326be8.OS === 'ios') {

        try {
          v_6c6ffc.setSpeakerphoneOn(true);
          if (__DEV__) console.log(`${v_dd7d80} InCallManager.setSpeakerphoneOn(true) ok`);
        } catch (v_49263d) {
          if (__DEV__) console.warn(`${v_dd7d80} InCallManager.setSpeakerphoneOn() threw: ${(v_49263d as Error)?.message ?? v_49263d}`);
        }
        try {
          v_6c6ffc.setKeepScreenOn(true);
          if (__DEV__) console.log(`${v_dd7d80} InCallManager.setKeepScreenOn(true) ok`);
        } catch (v_49263d) {
          if (__DEV__) console.warn(`${v_dd7d80} InCallManager.setKeepScreenOn() threw: ${(v_49263d as Error)?.message ?? v_49263d}`);
        }
      }
      try {
        v_6c6ffc.setForceSpeakerphoneOn(true);
        if (__DEV__) console.log(`${v_dd7d80} InCallManager.setForceSpeakerphoneOn(true) ok`);
      } catch (v_49263d) {
        if (__DEV__) console.warn(`${v_dd7d80} InCallManager.setForceSpeakerphoneOn() threw: ${(v_49263d as Error)?.message ?? v_49263d}`);
      }

      if (__DEV__) {
        v_6c6ffc.getIsWiredHeadsetPluggedIn?.()
          .then((v_cb35cb) => console.log(`${v_dd7d80} wired headset isPluggedIn=${v_cb35cb?.isWiredHeadsetPluggedIn}`))
          .catch((v_49263d) => console.warn(`${v_dd7d80} getIsWiredHeadsetPluggedIn threw: ${(v_49263d as Error)?.message ?? v_49263d}`));
      }
    },
    deactivate() {
      if (__DEV__) console.log(`${v_dd7d80} deactivate() enter · platform=${v_326be8.OS}`);
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
      if (v_326be8.OS === 'ios') {
        try {
          v_6cf1ad.audioSessionDidDeactivate();
        } catch (v_49263d) {
          if (__DEV__) console.warn(`${v_dd7d80} RTCAudioSession.audioSessionDidDeactivate() threw: ${(v_49263d as Error)?.message ?? v_49263d}`);
        }
      }
    },
  };
}

export const v_2f41d8 =
  v_be65dc();
