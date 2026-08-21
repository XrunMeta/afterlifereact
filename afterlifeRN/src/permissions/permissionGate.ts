

export type PermStatus = 'granted' | 'denied' | 'undetermined' | 'blocked';

export interface GateState {
  camera: PermStatus;
  mic: PermStatus;

  location: PermStatus;
}

export interface GateDecision {

  pass: boolean;

  canRequest: boolean;

  showSettingsHint: boolean;
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

  return v_479f05.canAskAgain === false ? 'blocked' : 'denied';
}

export function v_77042d(v_479f05): PermStatus {
  if (v_479f05.status === 'granted') return 'granted';
  if (v_479f05.status === 'undetermined') return 'undetermined';
  return v_479f05.canAskAgain === false ? 'blocked' : 'denied';
}

export function v_000b82(v_b6e533): GateDecision {
  const v_6f0b0c = v_b6e533.camera === 'granted' && v_b6e533.mic === 'granted';
  return {
    pass: v_6f0b0c,
    canRequest: !v_6f0b0c,
    showSettingsHint: !v_6f0b0c,
  };
}
