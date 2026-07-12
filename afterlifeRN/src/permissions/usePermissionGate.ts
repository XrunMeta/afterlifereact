

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
  type PermStatus,
} from './permissionGate';

function queryCameraStatus(): { status: PermStatus; error: string | null } {
  try {
    return { status: normalizeCameraStatus(VisionCamera.getCameraPermissionStatus()), error: null };
  } catch (err) {
    console.warn('[usePermissionGate] camera status query failed:', err);
    return { status: 'undetermined', error: '카메라 권한 상태를 확인하지 못했어요.' };
  }
}

async function queryMicStatus(): Promise<{ status: PermStatus; error: string | null }> {
  try {
    const res = await ExpoSpeechRecognitionModule.getPermissionsAsync();
    return {
      status: normalizeMicStatus({ status: res.status as 'granted' | 'denied' | 'undetermined', canAskAgain: res.canAskAgain }),
      error: null,
    };
  } catch (err) {
    console.warn('[usePermissionGate] mic status query failed:', err);
    return { status: 'undetermined', error: '마이크 권한 상태를 확인하지 못했어요.' };
  }
}

export interface UsePermissionGateResult {
  decision: GateDecision;
  state: GateState;
  loading: boolean;

  error: string | null;

  request: () => Promise<void>;

  openSettings: () => void;

  recheck: () => Promise<void>;
}

export function usePermissionGate(): UsePermissionGateResult {
  const [state, setState] = useState<GateState>({ camera: 'undetermined', mic: 'undetermined' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recheckInFlightRef = useRef(false);
  const requestInFlightRef = useRef(false);

  const recheck = useCallback(async () => {
    if (recheckInFlightRef.current) return;
    recheckInFlightRef.current = true;
    try {
      const cam = queryCameraStatus();
      const mic = await queryMicStatus();
      setState({ camera: cam.status, mic: mic.status });

      setError(cam.error ?? mic.error);
    } finally {

      setLoading(false);
      recheckInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    void recheck();

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
    if (requestInFlightRef.current) return;
    requestInFlightRef.current = true;
    try {

      try {
        const camStatus = normalizeCameraStatus(VisionCamera.getCameraPermissionStatus());
        if (camStatus !== 'granted') {
          await VisionCamera.requestCameraPermission();
        }
      } catch (err) {
        console.warn('[usePermissionGate] camera permission request failed:', err);
      }

      try {
        const micRaw = await ExpoSpeechRecognitionModule.getPermissionsAsync();
        if (micRaw.status !== 'granted') {
          await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        }
      } catch (err) {
        console.warn('[usePermissionGate] mic permission request failed:', err);
      }

      await recheck();
    } finally {
      requestInFlightRef.current = false;
    }
  }, [recheck]);

  const openSettings = useCallback(() => {
    try {
      Linking.openSettings();
    } catch (err) {
      console.warn('[usePermissionGate] openSettings failed:', err);
    }
  }, []);

  const decision = useMemo(() => gateDecision(state), [state]);

  return { decision, state, loading, error, request, openSettings, recheck };
}
