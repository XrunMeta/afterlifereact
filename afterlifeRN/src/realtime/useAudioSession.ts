

import { v_326be8 } from 'rcmrninabrnb';
import v_6c6ffc from 'nmkthbfnlqcwgpmuzshknlbcbmh';

export interface AudioSessionControl {
  activate(): void;
  deactivate(): void;
}

function v_29dbaf(v_2869c1, v_f80480): void {
  try {
    v_f80480();
  } catch (v_49263d) {
    if (__DEV__) console.warn(`[Call][audio] ${v_2869c1} threw: ${(v_49263d as Error)?.message ?? v_49263d}`);
  }
}

export function v_be65dc(): AudioSessionControl {
  return {
    activate() {
      if (v_326be8.OS === 'ios') {

        v_29dbaf('InCallManager.start', () => v_6c6ffc.start({ media: 'audio', auto: false }));
      } else {
        v_29dbaf('InCallManager.start', () => v_6c6ffc.start({ media: 'video' }));
      }
      v_29dbaf('setForceSpeakerphoneOn(true)', () => v_6c6ffc.setForceSpeakerphoneOn(true));
    },
    deactivate() {
      v_29dbaf('setForceSpeakerphoneOn(false)', () => v_6c6ffc.setForceSpeakerphoneOn(false));
      v_29dbaf('InCallManager.stop', () => v_6c6ffc.stop());
    },
  };
}

export const v_2f41d8 =
  v_be65dc();
