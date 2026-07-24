import { v_3752e7, v_b32a55, v_8f6de1 } from "../appVersionInfo";

describe("formatUpdateTime", () => {
  it("Date → MM-DD HH:mm (제로패딩)", () => {

    const v_d5dda0 = new Date(2026, 6, 24, 9, 5);
    expect(v_b32a55(v_d5dda0)).toBe("07-24 09:05");
  });

  it("null/undefined → 빈 문자열", () => {
    expect(v_b32a55(null)).toBe("");
    expect(v_b32a55(undefined)).toBe("");
  });
});

describe("formatOtaLine", () => {
  it("내장 실행 → embedded", () => {
    expect(v_3752e7({ isEmbeddedLaunch: true })).toBe("OTA 내장(embedded)");
  });

  it("비상실행(embedded fallback)이 내장 표기보다 우선", () => {
    expect(
      v_3752e7({ isEmbeddedLaunch: true, isEmergencyLaunch: true }),
    ).toBe("OTA 비상실행(embedded fallback)");
  });

  it("OTA 다운로드 실행 → 앞 8자리 + 시각", () => {
    expect(
      v_3752e7({
        isEmbeddedLaunch: false,
        updateId: "019f922c-5b0a-73ff-98bf-789143586df2",
        createdAt: new Date(2026, 6, 24, 12, 30),
      }),
    ).toBe("OTA 019f922c · 07-24 12:30");
  });

  it("updateId 없으면 — 표기, createdAt 없으면 시각 생략", () => {
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
