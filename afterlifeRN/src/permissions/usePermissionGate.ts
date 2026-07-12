

import { v_de06a3, v_c4deb2, v_df9f57, v_e662ae, v_5ab095 } from 'bapkr';
import { v_6b5698, type v_c3551b, v_f2c756 } from 'rcmrninabrnb';
import { v_862296 as v_628d75 } from 'mkqptszwrsxiemcjrtdlshyxlm';
import { v_e243ee } from 'lvqvchptxazovhbxaycespq';
import {
  v_000b82,
  v_c1dff7,
  v_b5b955,
  type v_075e4f,
  type v_0bf4a6,
} from './permissionGate';

async function v_32601b(): Promise<{ status: 'granted' | 'denied' | 'undetermined'; canAskAgain: boolean }> {
  const v_8f00b9 = await v_e243ee.getPermissionsAsync();
  return { status: v_8f00b9.status as 'granted' | 'denied' | 'undetermined', canAskAgain: v_8f00b9.canAskAgain };
}

export interface UsePermissionGateResult {
  decision: v_075e4f;
  state: v_0bf4a6;
  loading: boolean;

  request: () => Promise<void>;

  openSettings: () => void;

  recheck: () => Promise<void>;
}

export function v_b5d684(): UsePermissionGateResult {
  const [v_b6e533, v_1fa668] = v_5ab095<v_0bf4a6>({ camera: 'undetermined', mic: 'undetermined' });
  const [v_683210, v_34a50a] = v_5ab095(true);

  const v_8773f3 = v_e662ae(false);

  const v_f3f9e8 = v_de06a3(async () => {
    const v_f6643f = v_628d75.getCameraPermissionStatus();
    let v_ef4dc3 = v_c1dff7(v_f6643f);
    if (v_ef4dc3 === 'denied' && v_8773f3.current) {
      v_ef4dc3 = 'blocked';
    }
    const v_e44f92 = await v_32601b();
    const v_43e44f = v_b5b955(v_e44f92);
    v_1fa668({ camera: v_ef4dc3, mic: v_43e44f });
  }, []);

  v_c4deb2(() => {
    let v_2008a4 = false;
    v_34a50a(true);
    (async () => {
      await v_f3f9e8();
      if (!v_2008a4) v_34a50a(false);
    })();
    return () => {
      v_2008a4 = true;
    };

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

    const v_d7f55f = v_c1dff7(v_628d75.getCameraPermissionStatus());
    if (v_d7f55f !== 'granted' && !(v_d7f55f === 'denied' && v_8773f3.current)) {
      const v_7abfe4 = await v_628d75.requestCameraPermission();
      if (v_7abfe4 === 'denied' && v_d7f55f === 'denied') {

        v_8773f3.current = true;
      }
    }

    const v_f40466 = await v_32601b();
    if (v_f40466.status !== 'granted' && v_f40466.canAskAgain) {
      await v_e243ee.requestPermissionsAsync();
    }

    await v_f3f9e8();
  }, [v_f3f9e8]);

  const v_063c7a = v_de06a3(() => {
    v_f2c756.openSettings();
  }, []);

  const v_403b73 = v_df9f57(() => v_000b82(v_b6e533), [v_b6e533]);

  return { decision: v_403b73, state: v_b6e533, loading: v_683210, request: v_576f5a, openSettings: v_063c7a, recheck: v_f3f9e8 };
}
