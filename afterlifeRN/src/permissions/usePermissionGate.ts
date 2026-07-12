

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus, Linking } from 'react-native';
import { Camera as VisionCamera } from 'react-native-vision-camera';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import {
  gateDecision,
  normalizeCameraStatus,
  normalizeMicStatus,
  type GateDecision,
  type GateState,
} from './permissionGate';

async function queryMicStatus(): Promise<{ status: 'granted' | 'denied' | 'undetermined'; canAskAgain: boolean }> {
  const res = await ExpoSpeechRecognitionModule.getPermissionsAsync();
  return { status: res.status as 'granted' | 'denied' | 'undetermined', canAskAgain: res.canAskAgain };
}

export interface UsePermissionGateResult {
  decision: GateDecision;
  state: GateState;
  loading: boolean;

  request: () => Promise<void>;

  openSettings: () => void;

  recheck: () => Promise<void>;
}

export function usePermissionGate(): UsePermissionGateResult {
  const [state, setState] = useState<GateState>({ camera: 'undetermined', mic: 'undetermined' });
  const [loading, setLoading] = useState(true);

  const cameraBlockedOverrideRef = useRef(false);

  const recheck = useCallback(async () => {
    const rawCam = VisionCamera.getCameraPermissionStatus();
    let camera = normalizeCameraStatus(rawCam);
    if (camera === 'denied' && cameraBlockedOverrideRef.current) {
      camera = 'blocked';
    }
    const micRaw = await queryMicStatus();
    const mic = normalizeMicStatus(micRaw);
    setState({ camera, mic });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      await recheck();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };

  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') {
        void recheck();
      }
    });
    return () => sub.remove();
  }, [recheck]);

  const request = useCallback(async () => {

    const beforeCam = normalizeCameraStatus(VisionCamera.getCameraPermissionStatus());
    if (beforeCam !== 'granted' && !(beforeCam === 'denied' && cameraBlockedOverrideRef.current)) {
      const camResult = await VisionCamera.requestCameraPermission();
      if (camResult === 'denied' && beforeCam === 'denied') {

        cameraBlockedOverrideRef.current = true;
      }
    }

    const beforeMic = await queryMicStatus();
    if (beforeMic.status !== 'granted' && beforeMic.canAskAgain) {
      await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    }

    await recheck();
  }, [recheck]);

  const openSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  const decision = useMemo(() => gateDecision(state), [state]);

  return { decision, state, loading, request, openSettings, recheck };
}
