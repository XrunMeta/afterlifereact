

import { v_326be8 } from 'rcmrninabrnb';
import { v_51e8dd } from 'tgjb';
import v_6c6ffc from 'nmkthbfnlqcwgpmuzshknlbcbmh';

export interface AudioSessionControl {
  activate(): void;
  deactivate(): void;
}

const v_dd7d80 = '[Call][ios-audio-diag]';

type AudioSessionInfo = Record<string, unknown>;
type AudioSessionManagerModule = {
  describe(): Promise<AudioSessionInfo>;
  enableCallMode(): Promise<AudioSessionInfo>;
};
const v_546b0e =
  v_326be8.OS === 'ios'
    ? (v_51e8dd('AudioSessionManager') as AudioSessionManagerModule | null)
    : null;
let v_b8ed2b = false;

export function v_7b4e0f(v_bd1444, v_f64c52): void {
  if (v_326be8.OS !== 'ios') return;
  const v_06a17d = v_546b0e;
  if (!v_06a17d) {
    if (!v_b8ed2b) {
      v_b8ed2b = true;
      console.log(`${v_dd7d80} AudioSessionManager 네이티브 모듈 없음 — 이 빌드에는 미포함`);
    }
    return;
  }
  void (async () => {
    try {
      const v_e98932 = await v_06a17d.describe();
      console.log(`${v_dd7d80} ${v_bd1444} session: ${JSON.stringify(v_e98932)}`);
      if (v_f64c52) {
        const v_33efc5 = await v_06a17d.enableCallMode();
        console.log(`${v_dd7d80} ${v_bd1444} enableCallMode → ${JSON.stringify(v_33efc5)}`);
      }
    } catch (v_49263d) {
      console.warn(`${v_dd7d80} ${v_bd1444} probe threw: ${(v_49263d as Error)?.message ?? v_49263d}`);
    }
  })();
}

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
        v_7b4e0f('activate', true);
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
    },
  };
}

export const v_2f41d8 =
  v_be65dc();
