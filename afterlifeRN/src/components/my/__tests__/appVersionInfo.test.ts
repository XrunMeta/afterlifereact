import { v_3752e7, v_8f6de1 } from "../appVersionInfo";

describe("formatOtaLine", () => {
  it("내장 실행 → embedded", () => {
    expect(v_3752e7({ isEmbeddedLaunch: true })).toBe("OTA 내장(embedded)");
  });

  it("비상실행(embedded fallback)이 내장 표기보다 우선", () => {
    expect(
      v_3752e7({ isEmbeddedLaunch: true, isEmergencyLaunch: true }),
    ).toBe("OTA 비상실행(embedded fallback)");
  });

  it("OTA 다운로드 실행 → 앞 8자리(시각 미표기)", () => {
    expect(
      v_3752e7({
        isEmbeddedLaunch: false,
        updateId: "019f9247-7a30-743b-b7b9-79289a612de8",
      }),
    ).toBe("OTA 019f9247");
  });

  it("updateId 없으면 — 표기", () => {
    expect(v_3752e7({ isEmbeddedLaunch: false })).toBe("OTA —");
  });
});

describe("formatVersionLine", () => {
  it("iOS 빌드번호 우선", () => {
    expect(v_8f6de1("1.0.0", "7", 12)).toBe("v1.0.0 (7)");
  });

  it("iOS 없으면 android versionCode fallback", () => {
    expect(v_8f6de1("1.0.0", undefined, 12)).toBe("v1.0.0 (12)");
  });

  it("둘 다 없으면 ?", () => {
    expect(v_8f6de1(undefined, undefined, undefined)).toBe("v? (?)");
  });
});
