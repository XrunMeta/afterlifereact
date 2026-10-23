import {
  v_c5ee03,
  v_03e962,
  v_9d3644,
  v_686e50,
  v_b1f868,
  v_d65e3c,
  v_414d1f,
} from "../../src/face/recentEnrollCache";
import type { v_ac8014 } from "../../src/api/persons";

const v_40e36e = 9194;

const v_736293 = [1, 0, 0, 0];
const v_1d813f = [0.95, 0.31, 0, 0]; 
const v_c03ab0 = [0, 1, 0, 0];

const v_d6db99 = (v_d361d7 = 0.6): v_ac8014 => ({ matches: [], best: null, threshold: v_d361d7 });

describe("recentEnrollCache", () => {
  beforeEach(() => v_03e962());

  it("캐시가 비어 있으면 서버 결과를 그대로 돌려준다", () => {
    const v_cb35cb = v_d6db99();
    expect(v_686e50(v_cb35cb, v_736293, v_40e36e)).toBe(v_cb35cb);
  });

  it("서버가 못 찾은 방금 등록한 얼굴을 best 로 올린다", () => {
    v_b1f868(v_40e36e, 174, "타릭");
    v_d65e3c(v_40e36e, 174, [v_736293]);
    const v_cb35cb = v_686e50(v_d6db99(), v_1d813f, v_40e36e);
    expect(v_cb35cb.best?.personId).toBe(174);
    expect(v_cb35cb.best?.displayName).toBe("타릭");
    expect(v_cb35cb.best?.score).toBeGreaterThan(0.9);
    expect(v_cb35cb.matches[0].personId).toBe(174);
  });

  it("다른 얼굴은 후보로만 넣고 best 로 올리지 않는다", () => {
    v_d65e3c(v_40e36e, 174, [v_736293], "타릭");
    const v_cb35cb = v_686e50(v_d6db99(), v_c03ab0, v_40e36e);
    expect(v_cb35cb.best).toBeNull();
    expect(v_cb35cb.matches).toHaveLength(1);
    expect(v_cb35cb.matches[0].score).toBeCloseTo(0);
  });

  it("다른 클론 통화에는 섞지 않는다", () => {
    v_d65e3c(v_40e36e, 174, [v_736293], "타릭");
    expect(v_686e50(v_d6db99(), v_736293, 9999).best).toBeNull();
  });

  it("서버 matches 에 그 사람이 나오면(색인 반영) 앱 몫을 버린다", () => {
    v_d65e3c(v_40e36e, 174, [v_736293], "타릭");
    const server: v_ac8014 = {
      matches: [{ personId: 174, displayName: "타릭", score: 0.82 }],
      best: { personId: 174, displayName: "타릭", score: 0.82 },
      threshold: 0.6,
    };
    expect(v_686e50(v_88781f, v_736293, v_40e36e)).toEqual(v_88781f);

    expect(v_686e50(v_d6db99(), v_736293, v_40e36e).best).toBeNull();
  });

  it("서버 best 가 더 높으면 서버 best 를 유지한다", () => {
    v_d65e3c(v_40e36e, 174, [v_1d813f], "타릭");
    const server: v_ac8014 = {
      matches: [{ personId: 99, displayName: "다른", score: 0.99 }],
      best: { personId: 99, displayName: "다른", score: 0.99 },
      threshold: 0.6,
    };
    expect(v_686e50(v_88781f, v_736293, v_40e36e).best?.personId).toBe(99);
  });

  it("유효 시간이 지나면 버린다", () => {
    v_d65e3c(v_40e36e, 174, [v_736293], "타릭", 0);
    expect(v_686e50(v_d6db99(), v_736293, v_40e36e, v_c5ee03 + 1).best).toBeNull();
  });

  it("벡터를 나눠 등록해도 합쳐서 대조하고, 이름 변경·삭제를 따른다", () => {
    v_b1f868(v_40e36e, 174, "타릭");
    v_d65e3c(v_40e36e, 174, [v_c03ab0]);
    v_d65e3c(v_40e36e, 174, [v_736293]);
    v_414d1f(174, "카직스");
    const v_cb35cb = v_686e50(v_d6db99(), v_736293, v_40e36e);
    expect(v_cb35cb.best?.displayName).toBe("카직스");
    expect(v_cb35cb.best?.score).toBeCloseTo(1);
    v_9d3644(174);
    expect(v_686e50(v_d6db99(), v_736293, v_40e36e).best).toBeNull();
  });

  it("벡터 없이 이름만 있으면 대조하지 않는다", () => {
    v_b1f868(v_40e36e, 174, "타릭");
    const v_cb35cb = v_d6db99();
    expect(v_686e50(v_cb35cb, v_736293, v_40e36e)).toBe(v_cb35cb);
  });
});
