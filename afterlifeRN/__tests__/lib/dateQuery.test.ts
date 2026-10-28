import { v_de971e, v_b8a596 } from "../../src/lib/dateQuery";

const v_83d291 = (v_64877a, v_35f85c, v_d5dda0, v_02de88 = 12) => new Date(v_64877a, v_35f85c - 1, v_d5dda0, v_02de88, 0, 0);

describe("parseDateQuery", () => {
  it("숫자만: 연도·연월·연월일·월일", () => {
    expect(v_b8a596("2026")).toEqual({ year: 2026 });
    expect(v_b8a596("202610")).toEqual({ year: 2026, month: 10 });
    expect(v_b8a596("20261026")).toEqual({ year: 2026, month: 10, day: 26 });
    expect(v_b8a596("1026")).toEqual({ month: 10, day: 26 });
  });

  it("구분자(- . / 공백)", () => {
    expect(v_b8a596("10-26")).toEqual({ month: 10, day: 26 });
    expect(v_b8a596("10.26")).toEqual({ month: 10, day: 26 });
    expect(v_b8a596("2026-10")).toEqual({ year: 2026, month: 10 });
    expect(v_b8a596("2026.10.26")).toEqual({ year: 2026, month: 10, day: 26 });
    expect(v_b8a596("2026/1/5")).toEqual({ year: 2026, month: 1, day: 5 });
    expect(v_b8a596("1-5")).toEqual({ month: 1, day: 5 });
  });

  it("4자리는 월일로 못 읽으면 연도", () => {
    expect(v_b8a596("2012")).toEqual({ year: 2012 });
    expect(v_b8a596("1231")).toEqual({ month: 12, day: 31 });
  });

  it("날짜가 아니면 null", () => {
    for (const v_ab6401 of ["", "박희은", "10", "926", "13-40", "20261340", "2026-13", "abc1026", "12345"]) {
      expect(v_b8a596(v_ab6401)).toBeNull();
    }
  });
});

describe("matchesDateQuery", () => {
  const v_d5dda0 = v_83d291(2026, 10, 26);
  it("부분 날짜로 맞춘다", () => {
    expect(v_de971e("2026", v_d5dda0)).toBe(true);
    expect(v_de971e("2025", v_d5dda0)).toBe(false);
    expect(v_de971e("202610", v_d5dda0)).toBe(true);
    expect(v_de971e("202609", v_d5dda0)).toBe(false);
    expect(v_de971e("20261026", v_d5dda0)).toBe(true);
    expect(v_de971e("20261025", v_d5dda0)).toBe(false);
    expect(v_de971e("10-26", v_d5dda0)).toBe(true);
    expect(v_de971e("1026", v_83d291(2025, 10, 26))).toBe(true); 
    expect(v_de971e("1027", v_d5dda0)).toBe(false);
  });

  it("날짜 검색어가 아니면 false, 날짜가 이상하면 false", () => {
    expect(v_de971e("박희은", v_d5dda0)).toBe(false);
    expect(v_de971e("2026", "not-a-date")).toBe(false);
  });

  it("ISO 문자열·숫자(ms)도 받는다", () => {
    expect(v_de971e("1026", v_d5dda0.toISOString())).toBe(true);
    expect(v_de971e("1026", v_d5dda0.getTime())).toBe(true);
  });
});
