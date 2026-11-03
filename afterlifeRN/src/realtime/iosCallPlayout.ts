

import { v_326be8 } from 'rcmrninabrnb';
import { v_51e8dd } from 'sddnlypykcbginyhu';
import v_6c6ffc from 'nmkthbfnlqcwgpmuzshknlbcbmh';

type CallAudioIosNative = { restartPlayout(reason: string): boolean; isRestartTrialEnabled(): boolean };

const v_e3c29c =
  v_326be8.OS === 'ios' ? v_51e8dd<CallAudioIosNative>('CallAudioIos') : null;

const v_f67a51 = 500;

export function v_1f0b7c(): boolean {
  if (!v_e3c29c) return false;
  try {
    return v_e3c29c.isRestartTrialEnabled();
  } catch {
    return false;
  }
}

export function v_8fcc33(v_58ca36): boolean {
  if (!v_e3c29c) return false;
  try {

    const v_3ed4c3 = v_e3c29c.restartPlayout(v_58ca36);
    console.log(`[Call][afl1075] 재생 엔진 재시작 reason=${v_58ca36} sent=${v_3ed4c3}`);
    if (!v_3ed4c3) return false;
    setTimeout(() => {
      try {
        v_6c6ffc.setForceSpeakerphoneOn(true);
      } catch {

      }
    }, v_f67a51);
    return v_3ed4c3;
  } catch (v_49263d) {
    console.warn(`[Call][afl1075] 재생 엔진 재시작 실패 reason=${v_58ca36}:`, (v_49263d as Error)?.message ?? v_49263d);
    return false;
  }
}
