import { v_a5ab77, v_3353a2, v_7a4056 } from '../selfConfirm';

function v_46ff7a(v_bdb39e): number[] {
  const v_81e2ef = new Array(512).fill(0);
  v_81e2ef[v_bdb39e % 512] = 1;
  return v_81e2ef;
}

describe('cosine', () => {
  it('같은 벡터는 1', () => {
    expect(v_3353a2(v_46ff7a(1), v_46ff7a(1))).toBeCloseTo(1, 5);
  });

  it('직교 벡터는 0', () => {
    expect(v_3353a2(v_46ff7a(1), v_46ff7a(2))).toBeCloseTo(0, 5);
  });
});

describe('decideSelfConfirm', () => {
  const v_694b25 = { alreadyConfirmed: false, faceIdentifyEnabled: true, threshold: 0.45 };

  it('샘플이 3개 미만이면 계속 수집', () => {
    const v_cb35cb = v_a5ab77({ ...v_694b25, samples: [v_46ff7a(1), v_46ff7a(1)] });
    expect(v_cb35cb.kind).toBe('collect');
  });

  it('3개가 동일인이면 확정', () => {
    const v_cb35cb = v_a5ab77({ ...v_694b25, samples: [v_46ff7a(1), v_46ff7a(1), v_46ff7a(1)] });
    expect(v_cb35cb.kind).toBe('confirm');
    if (v_cb35cb.kind === 'confirm') expect(v_cb35cb.vectors).toHaveLength(3);
  });

  it('3개 중 하나라도 다른 사람이면 리셋', () => {
    const v_cb35cb = v_a5ab77({ ...v_694b25, samples: [v_46ff7a(1), v_46ff7a(1), v_46ff7a(200)] });
    expect(v_cb35cb.kind).toBe('reset');
  });

  it('이미 확정된 클론이면 아무것도 안 함', () => {
    const v_cb35cb = v_a5ab77({ ...v_694b25, alreadyConfirmed: true, samples: [v_46ff7a(1), v_46ff7a(1), v_46ff7a(1)] });
    expect(v_cb35cb.kind).toBe('idle');
  });

  it('전문가 클론(faceIdentifyEnabled=false)이면 아무것도 안 함', () => {
    const v_cb35cb = v_a5ab77({
      ...v_694b25,
      faceIdentifyEnabled: false,
      samples: [v_46ff7a(1), v_46ff7a(1), v_46ff7a(1)],
    });
    expect(v_cb35cb.kind).toBe('idle');
  });
});

describe('classifySelfConfirmError', () => {
  it('409(CONFLICT)는 confirmed — 이미 확정된 것으로 간주, 재시도 중단', () => {
    expect(v_7a4056(409)).toBe('confirmed');
  });

  it('422(검증 실패)는 retryable — 확정된 게 아니므로 다음 tick 에 재시도해야 함', () => {
    expect(v_7a4056(422)).toBe('retryable');
  });

  it('404(클론 없음/접근불가)는 retryable', () => {
    expect(v_7a4056(404)).toBe('retryable');
  });

  it('status 없음(네트워크 실패 등 AuthApiError 가 아닌 에러)도 retryable', () => {
    expect(v_7a4056(undefined)).toBe('retryable');
  });
});

describe('classifySelfConfirmError - AFL-1041 동의 철회', () => {
  it('403 FACE_CONSENT_REQUIRED 는 consent_revoked (retryable 아님)', () => {
    expect(v_7a4056(403, 'FACE_CONSENT_REQUIRED')).toBe('consent_revoked');
  });
  it('다른 403 은 기존대로 retryable', () => {
    expect(v_7a4056(403, 'FORBIDDEN')).toBe('retryable');
    expect(v_7a4056(403)).toBe('retryable');
  });
});
