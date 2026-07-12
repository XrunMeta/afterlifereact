

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
  canAskAgain: boolean;
}): PermStatus {
  if (raw.status === 'granted') return 'granted';
  if (raw.status === 'undetermined') return 'undetermined';

  return raw.canAskAgain ? 'denied' : 'blocked';
}

export function gateDecision(state: GateState): GateDecision {
  const values: PermStatus[] = [state.camera, state.mic];
  const pass = values.every((s) => s === 'granted');
  const canRequest = values.some((s) => s === 'undetermined' || s === 'denied');
  const mustOpenSettings = values.some((s) => s === 'blocked');
  return { pass, canRequest, mustOpenSettings };
}
