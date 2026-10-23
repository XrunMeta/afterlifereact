import {
  v_830c66,
  v_739ab4,
  v_db5e62,
  v_58dba0,
  type v_8ff6a4,
} from "../../src/face/faceCountTrigger";

function v_d9b231(v_3b40dd, init: v_8ff6a4 = v_db5e62) {
  let v_fd5f43 = v_00cfc6;
  const v_f5e8ef = [];
  for (const [v_9e8c70, v_8d41d7] of v_3b40dd) {
    const v_cb35cb = v_58dba0(v_fd5f43, v_9e8c70, v_8d41d7);
    v_fd5f43 = v_cb35cb.state;
    if (v_cb35cb.trigger) v_f5e8ef.push(v_8d41d7);
  }
  return { fired: v_f5e8ef, state: v_fd5f43 };
}

const v_35a57e = (v_9e8c70, v_a13c2e, v_257132, v_729796 = 33): [number, number][] => {
  const v_8d4337 = [];
  for (let v_8d41d7 = v_a13c2e; v_8d41d7 <= v_257132; v_8d41d7 += v_729796) v_8d4337.push([v_9e8c70, v_8d41d7]);
  return v_8d4337;
};

describe("stepFaceCountTrigger", () => {
  it("첫 프레임은 기준만 잡고 걸지 않는다", () => {
    expect(v_d9b231([[1, 0]]).fired).toEqual([]);
  });

  it("얼굴 수가 안정 시간 넘게 바뀌면 한 번 건다", () => {
    const { fired: v_f5e8ef } = v_d9b231([...v_35a57e(0, 0, 1000), ...v_35a57e(1, 1033, 3000)]);
    expect(v_f5e8ef).toHaveLength(1);
    expect(v_f5e8ef[0]).toBeGreaterThanOrEqual(1033 + v_739ab4);
  });

  it("0↔1 로 매 프레임 흔들리면 걸지 않는다(16:09 실통화 폭주)", () => {
    const v_3b40dd = [];
    for (let v_8d41d7 = 0; v_8d41d7 < 60_000; v_8d41d7 += 33) v_3b40dd.push([Math.floor(v_8d41d7 / 33) % 2, v_8d41d7]);
    expect(v_d9b231(v_3b40dd).fired).toEqual([]);
  });

  it("짧게 흔들렸다 원래 수로 돌아오면 걸지 않는다", () => {
    const { fired: v_f5e8ef } = v_d9b231([...v_35a57e(1, 0, 1000), ...v_35a57e(0, 1033, 1300), ...v_35a57e(1, 1333, 3000)]);
    expect(v_f5e8ef).toEqual([]);
  });

  it("안정된 변화가 연달아 와도 최소 간격 안에서는 한 번만 건다", () => {
    const v_3b40dd = [
      ...v_35a57e(1, 0, 500),
      ...v_35a57e(2, 533, 1500), 
      ...v_35a57e(1, 1533, 2500), 
    ];
    const { fired: v_f5e8ef, state: v_b6e533 } = v_d9b231(v_3b40dd);
    expect(v_f5e8ef).toHaveLength(1);
    expect(v_b6e533.stable).toBe(1);
  });

  it("최소 간격이 지나면 다음 변화에 다시 건다", () => {
    const v_3b40dd = [
      ...v_35a57e(1, 0, 500),
      ...v_35a57e(2, 533, 1500),
      ...v_35a57e(1, 1533 + v_830c66, 3000 + v_830c66),
    ];
    expect(v_d9b231(v_3b40dd).fired).toHaveLength(2);
  });

  it("1분 내내 흔들리는 최악에도 분당 트리거는 간격 한도를 넘지 않는다", () => {
    const v_3b40dd = [];

    let v_8d41d7 = 0;
    let v_3f4e2e = 0;
    while (v_8d41d7 < 60_000) {
      v_3b40dd.push(...v_35a57e(v_3f4e2e, v_8d41d7, v_8d41d7 + v_739ab4 + 100));
      v_8d41d7 += v_739ab4 + 133;
      v_3f4e2e = 1 - v_3f4e2e;
    }
    expect(v_d9b231(v_3b40dd).fired.length).toBeLessThanOrEqual(Math.ceil(60_000 / v_830c66));
  });
});
