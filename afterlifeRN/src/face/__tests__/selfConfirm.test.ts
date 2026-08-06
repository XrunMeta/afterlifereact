import { decideSelfConfirm, cosine, classifySelfConfirmError } from '../selfConfirm';

function vec(seed: number): number[] {
  const v = new Array(512).fill(0);
  v[seed % 512] = 1;
  return v;
}

describe('cosine', () => {
  it('같은 벡터는 1', () => {
    expect(cosine(vec(1), vec(1))).toBeCloseTo(1, 5);
  });

  it('직교 벡터는 0', () => {
    expect(cosine(vec(1), vec(2))).toBeCloseTo(0, 5);
  });
});

describe('decideSelfConfirm', () => {
  const base = { alreadyConfirmed: false, faceIdentifyEnabled: true, threshold: 0.45 };

  it('샘플이 3개 미만이면 계속 수집', () => {
    const r = decideSelfConfirm({ ...base, samples: [vec(1), vec(1)] });
    expect(r.kind).toBe('collect');
  });

  it('3개가 동일인이면 확정', () => {
    const r = decideSelfConfirm({ ...base, samples: [vec(1), vec(1), vec(1)] });
    expect(r.kind).toBe('confirm');
    if (r.kind === 'confirm') expect(r.vectors).toHaveLength(3);
  });

  it('3개 중 하나라도 다른 사람이면 리셋', () => {
    const r = decideSelfConfirm({ ...base, samples: [vec(1), vec(1), vec(200)] });
    expect(r.kind).toBe('reset');
  });

  it('이미 확정된 클론이면 아무것도 안 함', () => {
    const r = decideSelfConfirm({ ...base, alreadyConfirmed: true, samples: [vec(1), vec(1), vec(1)] });
    expect(r.kind).toBe('idle');
  });

  it('전문가 클론(faceIdentifyEnabled=false)이면 아무것도 안 함', () => {
    const r = decideSelfConfirm({
      ...base,
      faceIdentifyEnabled: false,
      samples: [vec(1), vec(1), vec(1)],
    });
    expect(r.kind).toBe('idle');
  });
});

describe('classifySelfConfirmError', () => {
  it('409(CONFLICT)는 confirmed — 이미 확정된 것으로 간주, 재시도 중단', () => {
    expect(classifySelfConfirmError(409)).toBe('confirmed');
  });

  it('422(검증 실패)는 retryable — 확정된 게 아니므로 다음 tick 에 재시도해야 함', () => {
    expect(classifySelfConfirmError(422)).toBe('retryable');
  });

  it('404(클론 없음/접근불가)는 retryable', () => {
    expect(classifySelfConfirmError(404)).toBe('retryable');
  });

  it('status 없음(네트워크 실패 등 AuthApiError 가 아닌 에러)도 retryable', () => {
    expect(classifySelfConfirmError(undefined)).toBe('retryable');
  });
});
