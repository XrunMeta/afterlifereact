

export type PermStatus = 'granted' | 'denied' | 'undetermined' | 'blocked';

export interface GateState {
  camera: PermStatus;
  mic: PermStatus;
}

export interface GateDecision {

  pass: boolean;

  canRequest: boolean;

  mustOpenSettings: boolean;
}

export function v_c1dff7(
  v_479f05,
): PermStatus {
  switch (v_479f05) {
    case 'granted':
      return 'granted';
    case 'not-determined':
      return 'undetermined';
    case 'restricted':
      return 'blocked';
    case 'denied':
      return 'denied';
    default:
      return 'undetermined';
  }
}

export function v_b5b955(v_479f05): PermStatus {
  if (v_479f05.status === 'granted') return 'granted';
  if (v_479f05.status === 'undetermined') return 'undetermined';

  return v_479f05.canAskAgain ? 'denied' : 'blocked';
}

export function v_000b82(v_b6e533): GateDecision {
  const v_6fea0b = [v_b6e533.camera, v_b6e533.mic];
  const v_6f0b0c = v_6fea0b.every((v_fd5f43) => v_fd5f43 === 'granted');
  const v_99122d = v_6fea0b.some((v_fd5f43) => v_fd5f43 === 'undetermined' || v_fd5f43 === 'denied');
  const v_4d9c27 = v_6fea0b.some((v_fd5f43) => v_fd5f43 === 'blocked');
  return { pass: v_6f0b0c, canRequest: v_99122d, mustOpenSettings: v_4d9c27 };
}
