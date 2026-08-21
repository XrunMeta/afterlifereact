

import { v_de06a3, v_c4deb2, v_df9f57, v_e662ae, v_5ab095 } from 'bapkr';
import { v_6b5698, type v_c3551b, v_f2c756 } from 'rcmrninabrnb';
import { v_862296 as v_628d75 } from 'mkqptszwrsxiemcjrtdlshyxlm';
import { v_e243ee } from 'lvqvchptxazovhbxaycespq';
import * as v_8a44cb from 'zryrlwvgokjhz';
import {
  v_000b82,
  v_c1dff7,
  v_77042d,
  v_b5b955,
  type v_075e4f,
  type v_0bf4a6,
  type v_2455ca,
} from './permissionGate';

function v_5674ca(): { status: v_2455ca; error: string | null } {
  try {
    return { status: v_c1dff7(v_628d75.getCameraPermissionStatus()), error: null };
  } catch (v_49263d) {
    console.warn('[usePermissionGate] camera status query failed:', v_49263d);
    return { status: 'undetermined', error: '카메라 권한 상태를 확인하지 못했어요.' };
  }
}

async function v_32601b(): Promise<{ status: v_2455ca; error: string | null }> {
  try {
    const v_8f00b9 = await v_e243ee.getPermissionsAsync();
    return {
      status: v_b5b955({ status: v_8f00b9.status as 'granted' | 'denied' | 'undetermined', canAskAgain: v_8f00b9.canAskAgain }),
      error: null,
    };
  } catch (v_49263d) {
    console.warn('[usePermissionGate] mic status query failed:', v_49263d);
    return { status: 'undetermined', error: '마이크 권한 상태를 확인하지 못했어요.' };
  }
}

async function v_907478(): Promise<{ status: v_2455ca; error: string | null }> {
  try {
    const v_8f00b9 = await v_8a44cb.getForegroundPermissionsAsync();
    return {
      status: v_77042d({
        status: (v_8f00b9.granted ? 'granted' : v_8f00b9.status) as 'granted' | 'denied' | 'undetermined',
        canAskAgain: v_8f00b9.canAskAgain,
      }),
      error: null,
    };
  } catch (v_49263d) {
    console.warn('[usePermissionGate] location status query failed:', v_49263d);
    return { status: 'undetermined', error: null }; 
  }
}

export interface UsePermissionGateResult {
  decision: v_075e4f;
  state: v_0bf4a6;
  loading: boolean;

  error: string | null;

  request: () => Promise<void>;

  openSettings: () => void;

  recheck: () => Promise<void>;
}

export function v_b5d684(): UsePermissionGateResult {
  const [v_b6e533, v_1fa668] = v_5ab095<v_0bf4a6>({ camera: 'undetermined', mic: 'undetermined', location: 'undetermined' });
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_5e9bfe, v_3a7d09] = v_5ab095<string | null>(null);

  const v_d33b2e = v_e662ae(false);
  const v_423866 = v_e662ae(false);

  const v_f3f9e8 = v_de06a3(async () => {
    if (v_d33b2e.current) return;
    v_d33b2e.current = true;
    try {
      const v_375edd = v_5674ca();
      const [v_43e44f, v_99e8e7] = await Promise.all([v_32601b(), v_907478()]);
      v_1fa668({ camera: v_375edd.status, mic: v_43e44f.status, location: v_99e8e7.status });

      v_3a7d09(v_375edd.error ?? v_43e44f.error);
    } finally {

      v_34a50a(false);
      v_d33b2e.current = false;
    }
  }, []);

  v_c4deb2(() => {
    void v_f3f9e8();

  }, []);

  v_c4deb2(() => {
    const v_1ae212 = v_6b5698.addEventListener('change', (next: v_c3551b) => {
      if (v_a448ad === 'active') {
        void v_f3f9e8();
      }
    });
    return () => v_1ae212.remove();
  }, [v_f3f9e8]);

  const v_576f5a = v_de06a3(async () => {
    if (v_423866.current) return;
    v_423866.current = true;
    try {

      try {
        const v_e5b83d = v_c1dff7(v_628d75.getCameraPermissionStatus());
        if (v_e5b83d !== 'granted') {
          await v_628d75.requestCameraPermission();
        }
      } catch (v_49263d) {
        console.warn('[usePermissionGate] camera permission request failed:', v_49263d);
      }

      try {
        const v_e44f92 = await v_e243ee.getPermissionsAsync();
        if (v_e44f92.status !== 'granted') {
          await v_e243ee.requestPermissionsAsync();
        }
      } catch (v_49263d) {
        console.warn('[usePermissionGate] mic permission request failed:', v_49263d);
      }

      try {
        const v_e98c01 = await v_8a44cb.getForegroundPermissionsAsync();
        if (!v_e98c01.granted && v_e98c01.canAskAgain) {
          await v_8a44cb.requestForegroundPermissionsAsync();
        }
      } catch (v_49263d) {
        console.warn('[usePermissionGate] location permission request failed:', v_49263d);
      }

      await v_f3f9e8();
    } finally {
      v_423866.current = false;
    }
  }, [v_f3f9e8]);

  const v_063c7a = v_de06a3(() => {
    try {
      v_f2c756.openSettings();
    } catch (v_49263d) {
      console.warn('[usePermissionGate] openSettings failed:', v_49263d);
    }
  }, []);

  const v_403b73 = v_df9f57(() => v_000b82(v_b6e533), [v_b6e533]);

  return { decision: v_403b73, state: v_b6e533, loading: v_683210, error: v_5e9bfe, request: v_576f5a, openSettings: v_063c7a, recheck: v_f3f9e8 };
}
