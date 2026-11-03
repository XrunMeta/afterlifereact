import { v_088069, v_700e84 } from '../audioPlayoutStall';

function v_d9b231(v_30f628) {
  let v_b6e533 = v_088069();
  const v_8d4337 = [];
  for (const v_d5dda0 of v_30f628) {
    const v_cb35cb = v_700e84(v_b6e533, v_d5dda0);
    v_b6e533 = v_cb35cb.state;
    v_8d4337.push(v_cb35cb.stalled);
  }
  return v_8d4337;
}

describe('stepPlayoutStall', () => {
  it('정상 재생(samplesΔ>0)은 정지 아님', () => {
    expect(v_d9b231([{ pkts: 250, samples: 240000 }, { pkts: 250, samples: 240000 }])).toEqual([false, false]);
  });

  it('패킷은 오는데 samplesΔ=0 이 연속 2번이면 그 순간 한 번만 정지', () => {

    expect(
      v_d9b231([
        { pkts: 250, samples: 240000 },
        { pkts: 221, samples: 0 },
        { pkts: 249, samples: 0 },
        { pkts: 249, samples: 0 },
      ]),
    ).toEqual([false, false, true, false]);
  });

  it('패킷이 거의 안 오면(네트워크·서버) 재생 정지로 보지 않음', () => {
    expect(v_d9b231([{ pkts: 10, samples: 0 }, { pkts: 0, samples: 0 }, { pkts: 50, samples: 0 }])).toEqual([
      false,
      false,
      false,
    ]);
  });

  it('중간에 회복하면 다시 처음부터 센다', () => {
    expect(
      v_d9b231([
        { pkts: 250, samples: 0 },
        { pkts: 250, samples: 84000 },
        { pkts: 250, samples: 0 },
        { pkts: 250, samples: 0 },
      ]),
    ).toEqual([false, false, false, true]);
  });

  it('재시작이 안 먹어 계속 0 이면 2번마다 다시 알린다', () => {
    expect(v_d9b231(Array.from({ length: 5 }, () => ({ pkts: 250, samples: 0 })))).toEqual([
      false,
      true,
      false,
      true,
      false,
    ]);
  });
});
