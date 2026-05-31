

import { Platform } from 'react-native';
import { RTCAudioSession } from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';

export interface AudioSessionControl {
  activate(): void;
  deactivate(): void;
}

export function createDefaultAudioSessionControl(): AudioSessionControl {
  return {
    activate() {
      if (Platform.OS === 'ios') {
        RTCAudioSession.audioSessionDidActivate();
      }

      InCallManager.start({ media: 'video' });
      InCallManager.setForceSpeakerphoneOn(true);
    },
    deactivate() {
      InCallManager.setForceSpeakerphoneOn(false);
      InCallManager.stop();
      if (Platform.OS === 'ios') {
        RTCAudioSession.audioSessionDidDeactivate();
      }
    },
  };
}

export const defaultAudioSessionControl: AudioSessionControl =
  createDefaultAudioSessionControl();
