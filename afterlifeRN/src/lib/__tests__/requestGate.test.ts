import { v_f8616b } from "../requestGate";

describe("createRequestGate", () => {
  it("begin 한 최신 요청만 current", () => {
    const v_206b88 = v_f8616b();
    const v_779914 = v_206b88.begin();
    expect(v_206b88.isCurrent(v_779914)).toBe(true);
    const v_148ff6 = v_206b88.begin();
    expect(v_206b88.isCurrent(v_779914)).toBe(false);
    expect(v_206b88.isCurrent(v_148ff6)).toBe(true);
  });
  it("cancel 후에는 늦게 온 응답(A)이 current 가 아니고, 새 요청(B)만 current", () => {
    const v_206b88 = v_f8616b();
    const v_779914 = v_206b88.begin();
    v_206b88.cancel();
    expect(v_206b88.isCurrent(v_779914)).toBe(false);
    const v_148ff6 = v_206b88.begin();
    expect(v_206b88.isCurrent(v_779914)).toBe(false);
    expect(v_206b88.isCurrent(v_148ff6)).toBe(true);
  });
});
