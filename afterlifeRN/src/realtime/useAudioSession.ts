

import { v_326be8 } from 'rcmrninabrnb';
import { v_51e8dd } from 'tgjb';
import v_6c6ffc from 'nmkthbfnlqcwgpmuzshknlbcbmh';

export interface AudioSessionControl {
  activate(): void;
  deactivate(): void;
}

const v_dd7d80 = '[Call][ios-audio-diag]';

type AudioSessionNative = {
  enableCallMode(): Promise<Record<string, unknown>>;
  disableCallMode(): Promise<null>;
  describe(): Promise<Record<string, unknown>>;
};
const v_52c60b =
  v_326be8.OS === 'ios'
    ? (v_51e8dd('AudioSessionManager') as AudioSessionNative | null)
    : null;

export function v_be65dc(): AudioSessionControl {
  return {
    activate() {
      if (__DEV__) console.log(`${v_dd7d80} activate() enter · platform=${v_326be8.OS}`);
      if (v_326be8.OS === 'ios') {
        try {
          v_6c6ffc.start({ media: 'audio', auto: false });
          if (__DEV__)
            console.log(`${v_dd7d80} ios · InCallManager.start({media:'audio', auto:false}) ok`);
        } catch (v_49263d) {
          if (__DEV__)
            console.warn(
              `${v_dd7d80} ios · InCallManager.start() threw: ${(v_49263d as Error)?.message ?? v_49263d}`,
            );
        }
        try {
          v_6c6ffc.setForceSpeakerphoneOn(true);
          if (__DEV__)
            console.log(`${v_dd7d80} ios · InCallManager.setForceSpeakerphoneOn(true) ok`);
        } catch (v_49263d) {
          if (__DEV__)
            console.warn(
              `${v_dd7d80} ios · setForceSpeakerphoneOn(true) threw: ${(v_49263d as Error)?.message ?? v_49263d}`,
            );
        }

        if (v_52c60b) {
          v_52c60b
            .enableCallMode()
            .then((v_34d5e3) => {
              if (__DEV__)
                console.log(
                  `${v_dd7d80} ios · AudioSessionManager.enableCallMode() ok · ${JSON.stringify(v_34d5e3)}`,
                );
            })
            .catch((v_49263d) => {
              if (__DEV__)
                console.warn(
                  `${v_dd7d80} ios · AudioSessionManager.enableCallMode() rejected: ${(v_49263d as Error)?.message ?? v_49263d}`,
                );
            });
        } else {
          if (__DEV__)
            console.log(
              `${v_dd7d80} ios · AudioSessionManager module null — 구 바이너리, InCallManager 세팅만 사용`,
            );
        }
        return;
      }

      try {
        v_6c6ffc.start({ media: 'video' });
        if (__DEV__) console.log(`${v_dd7d80} android · InCallManager.start({media:'video'}) ok`);
      } catch (v_49263d) {
        if (__DEV__)
          console.warn(
            `${v_dd7d80} android · InCallManager.start() threw: ${(v_49263d as Error)?.message ?? v_49263d}`,
          );
      }
      try {
        v_6c6ffc.setForceSpeakerphoneOn(true);
        if (__DEV__)
          console.log(`${v_dd7d80} android · InCallManager.setForceSpeakerphoneOn(true) ok`);
      } catch (v_49263d) {
        if (__DEV__)
          console.warn(
            `${v_dd7d80} android · setForceSpeakerphoneOn(true) threw: ${(v_49263d as Error)?.message ?? v_49263d}`,
          );
      }
    },
    deactivate() {
      if (__DEV__) console.log(`${v_dd7d80} deactivate() enter · platform=${v_326be8.OS}`);
      try {
        v_6c6ffc.setForceSpeakerphoneOn(false);
      } catch (v_49263d) {
        if (__DEV__)
          console.warn(
            `${v_dd7d80} setForceSpeakerphoneOn(false) threw: ${(v_49263d as Error)?.message ?? v_49263d}`,
          );
      }
      try {
        v_6c6ffc.stop();
        if (__DEV__) console.log(`${v_dd7d80} InCallManager.stop() ok`);
      } catch (v_49263d) {
        if (__DEV__)
          console.warn(
            `${v_dd7d80} InCallManager.stop() threw: ${(v_49263d as Error)?.message ?? v_49263d}`,
          );
      }
      if (v_326be8.OS === 'ios' && v_52c60b) {
        v_52c60b
          .disableCallMode()
          .then(() => {
            if (__DEV__)
              console.log(`${v_dd7d80} ios · AudioSessionManager.disableCallMode() ok`);
          })
          .catch((v_49263d) => {
            if (__DEV__)
              console.warn(
                `${v_dd7d80} ios · AudioSessionManager.disableCallMode() rejected: ${(v_49263d as Error)?.message ?? v_49263d}`,
              );
          });
      }
    },
  };
}

export const v_2f41d8 =
  v_be65dc();
