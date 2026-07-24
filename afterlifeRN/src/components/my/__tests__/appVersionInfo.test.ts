import { formatOtaLine, formatVersionLine } from "../appVersionInfo";

describe("formatOtaLine", () => {
  it("내장 실행 → embedded", () => {
    expect(formatOtaLine({ isEmbeddedLaunch: true })).toBe("OTA 내장(embedded)");
  });

  it("비상실행(embedded fallback)이 내장 표기보다 우선", () => {
    expect(
      formatOtaLine({ isEmbeddedLaunch: true, isEmergencyLaunch: true }),
    ).toBe("OTA 비상실행(embedded fallback)");
  });

  it("OTA 다운로드 실행 → 앞 8자리(시각 미표기)", () => {
    expect(
      formatOtaLine({
        isEmbeddedLaunch: false,
        updateId: "019f9247-7a30-743b-b7b9-79289a612de8",
      }),
    ).toBe("OTA 019f9247");
  });

  it("updateId 없으면 — 표기", () => {
    expect(formatOtaLine({ isEmbeddedLaunch: false })).toBe("OTA —");
  });
});

describe("formatVersionLine", () => {
  it("문자열 빌드(iOS buildNumber)", () => {
    expect(formatVersionLine("1.0.0", "8")).toBe("v1.0.0 (8)");
  });

  it("숫자 빌드(Android versionCode)", () => {
    expect(formatVersionLine("1.0.0", 8)).toBe("v1.0.0 (8)");
  });

  it("build 없으면 ?", () => {
    expect(formatVersionLine("1.0.0", undefined)).toBe("v1.0.0 (?)");
    expect(formatVersionLine("1.0.0", null)).toBe("v1.0.0 (?)");
  });

  it("version·build 둘 다 없으면 ?", () => {
    expect(formatVersionLine(undefined, undefined)).toBe("v? (?)");
  });
});
