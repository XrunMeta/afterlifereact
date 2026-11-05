
import { v_fdfd83, v_037b0a, v_f3fadd, type v_eca0c9 } from "../systemGate";

const v_01dcf5 = (p: Partial<v_eca0c9> = {}): v_eca0c9 => ({
  serverStatus: "running",
  minVersionIos: "",
  minVersionAndroid: "",
  ...v_e2a85c,
});

describe("compareVersions", () => {
  test("숫자 단위 비교 (문자열 비교 아님)", () => {
    expect(v_fdfd83("1.1.2", "1.1.10")).toBeLessThan(0);
    expect(v_fdfd83("1.2.0", "1.1.9")).toBeGreaterThan(0);
    expect(v_fdfd83("1.1.1", "1.1.1")).toBe(0);
    expect(v_fdfd83("1.1", "1.1.0")).toBe(0);
  });
});

describe("decideGate", () => {
  test("정상 · 최소 버전 없음 → 막지 않음", () => {
    expect(v_037b0a(v_01dcf5(), "ios", "1.1.1")).toBeNull();
  });

  test("설정을 못 읽으면 막지 않음", () => {
    expect(v_037b0a(null, "ios", "1.1.1")).toBeNull();
  });

  test("점검 · 중지", () => {
    expect(v_037b0a(v_01dcf5({ serverStatus: "maintenance" }), "ios", "1.1.1")).toBe("maintenance");
    expect(v_037b0a(v_01dcf5({ serverStatus: "stopped" }), "android", "1.1.1")).toBe("stopped");
  });

  test("점검이 업데이트보다 먼저", () => {
    expect(v_037b0a(v_01dcf5({ serverStatus: "maintenance", minVersionIos: "9.0.0" }), "ios", "1.1.1")).toBe("maintenance");
  });

  test("최소 버전보다 낮으면 업데이트 — 플랫폼별", () => {
    const v_3f4e2e = v_01dcf5({ minVersionIos: "1.1.2", minVersionAndroid: "1.1.0" });
    expect(v_037b0a(v_3f4e2e, "ios", "1.1.1")).toBe("update");
    expect(v_037b0a(v_3f4e2e, "ios", "1.1.2")).toBeNull();
    expect(v_037b0a(v_3f4e2e, "android", "1.1.1")).toBeNull();
  });

  test("개발 빌드는 버전을 안 봄 · 앱 버전 모르면 막지 않음", () => {
    const v_3f4e2e = v_01dcf5({ minVersionIos: "9.0.0" });
    expect(v_037b0a(v_3f4e2e, "ios", "1.1.1", { skipVersion: true })).toBeNull();
    expect(v_037b0a(v_3f4e2e, "ios", undefined)).toBeNull();
  });
});

describe("parseSystemConfig", () => {
  test("모르는 상태값은 running, 버전은 문자열만", () => {
    expect(v_f3fadd({ serverStatus: "hibernate", minVersionIos: " 1.2.0 ", minVersionAndroid: 3 })).toEqual({
      serverStatus: "running",
      minVersionIos: "1.2.0",
      minVersionAndroid: "",
    });
    expect(v_f3fadd(null)).toBeNull();
  });
});
