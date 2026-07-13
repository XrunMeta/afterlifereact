

export type PermStatus = 'granted' | 'denied' | 'undetermined' | 'blocked';

export interface GateState {
  camera: PermStatus;
  mic: PermStatus;
}

export interface GateDecision {

  pass: boolean;

  canRequest: boolean;

  showSettingsHint: boolean;
}

export function normalizeCameraStatus(
  raw: 'granted' | 'not-determined' | 'denied' | 'restricted',
): PermStatus {
  switch (raw) {
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

export function normalizeMicStatus(raw: {
  status: 'granted' | 'denied' | 'undetermined';
  canAskAgain?: boolean;
}): PermStatus {
  if (raw.status === 'granted') return 'granted';
  if (raw.status === 'undetermined') return 'undetermined';

  return raw.canAskAgain === false ? 'blocked' : 'denied';
}

export function gateDecision(state: GateState): GateDecision {
  const pass = state.camera === 'granted' && state.mic === 'granted';
  return {
    pass,
    canRequest: !pass,
    showSettingsHint: !pass,
  };
}
