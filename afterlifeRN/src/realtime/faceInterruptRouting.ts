

import type { v_cdfa61 } from './speakerHandoff';

export function v_e500aa(
  event: v_cdfa61,
  v_93b190,
  v_1065f7,
): boolean {
  return v_d48baf.type === 'UNKNOWN_FACE' && !v_93b190 && !v_1065f7;
}

export function v_bb26d8(
  event: v_cdfa61,
  v_93b190,
  v_76af91,
  v_e7ec83,
): { faceKey: string; nextSessionId: number } {
  if (v_d48baf.type === 'SPEAKER_CONFIRMED') {
    return { faceKey: `p${v_d48baf.personId}`, nextSessionId: v_e7ec83 };
  }
  const v_27d828 = !v_93b190 && v_76af91 ? v_e7ec83 + 1 : v_e7ec83;
  return { faceKey: `unknown-${v_27d828}`, nextSessionId: v_27d828 };
}
