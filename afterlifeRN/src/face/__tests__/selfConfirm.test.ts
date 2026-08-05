import { decideSelfConfirm, cosine } from '../selfConfirm';

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
