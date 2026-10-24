

export const v_2a39ea = 3;
export const v_b1d7e1 = 2000;

export function v_3353a2(v_779914, v_148ff6): number {
  let v_801ce6 = 0;
  let v_6faaa0 = 0;
  let v_78071c = 0;
  for (let v_ebec57 = 0; v_ebec57 < v_779914.length; v_ebec57++) {
    const v_8fe318 = v_779914[v_ebec57] ?? 0;
    const v_095f0c = v_148ff6[v_ebec57] ?? 0;
    v_801ce6 += v_8fe318 * v_095f0c;
    v_6faaa0 += v_8fe318 * v_8fe318;
    v_78071c += v_095f0c * v_095f0c;
  }
  return v_801ce6 / (Math.sqrt(v_6faaa0) * Math.sqrt(v_78071c) || 1);
}

export interface SelfConfirmInput {

  alreadyConfirmed: boolean;

  faceIdentifyEnabled: boolean;

  samples: number[][];

  threshold: number;
}

export type SelfConfirmAction =
  | { kind: 'idle' }
  | { kind: 'collect' }
  | { kind: 'reset' }
  | { kind: 'confirm'; vectors: number[][] };

export function v_a5ab77(v_bbda62): SelfConfirmAction {
  const { alreadyConfirmed: v_b6b962, faceIdentifyEnabled: v_e2965a, samples: v_5b2623, threshold: v_d361d7 } = v_bbda62;

  if (v_b6b962 || !v_e2965a) return { kind: 'idle' };
  if (v_5b2623.length < v_2a39ea) return { kind: 'collect' };

  const v_dd108b = v_5b2623.slice(-v_2a39ea);

  for (let v_ebec57 = 0; v_ebec57 < v_dd108b.length; v_ebec57++) {
    for (let v_b75e36 = v_ebec57 + 1; v_b75e36 < v_dd108b.length; v_b75e36++) {
      if (v_3353a2(v_dd108b[v_ebec57]!, v_dd108b[v_b75e36]!) < v_d361d7) return { kind: 'reset' };
    }
  }
  return { kind: 'confirm', vectors: v_dd108b };
}

export type SelfConfirmErrorClass = 'confirmed' | 'consent_revoked' | 'retryable';

export function v_7a4056(
  v_d308b5,
  v_c99bd2,
): SelfConfirmErrorClass {
  if (v_d308b5 === 403 && v_c99bd2 === 'FACE_CONSENT_REQUIRED') return 'consent_revoked';
  return v_d308b5 === 409 ? 'confirmed' : 'retryable';
}
