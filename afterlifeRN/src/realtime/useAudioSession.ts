

import { v_326be8 } from 'rcmrninabrnb';
import { v_6cf1ad } from 'rthlnescfffbyxfmhgq';
import v_6c6ffc from 'nmkthbfnlqcwgpmuzshknlbcbmh';

export interface AudioSessionControl {
  activate(): void;
  deactivate(): void;
}

export function v_be65dc(): AudioSessionControl {
  return {
    activate() {
      if (v_326be8.OS === 'ios') {
        v_6cf1ad.audioSessionDidActivate();
      }

      v_6c6ffc.start({ media: 'video' });
      v_6c6ffc.setForceSpeakerphoneOn(true);
    },
    deactivate() {
      v_6c6ffc.setForceSpeakerphoneOn(false);
      v_6c6ffc.stop();
      if (v_326be8.OS === 'ios') {
        v_6cf1ad.audioSessionDidDeactivate();
      }
    },
  };
}

export const v_2f41d8 =
  v_be65dc();
