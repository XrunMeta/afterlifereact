import { v_669b27, v_c3f0be, v_cae033, v_280133 } from "../../src/lib/dateRange";

describe("dateRange", () => {
  const v_5c2f9f = new Date(2026, 9, 28, 21, 0); 

  it("presetRange", () => {
    expect(v_280133("today", v_5c2f9f)).toEqual({ from: "2026-10-28", to: "2026-10-28" });
    expect(v_280133("last7", v_5c2f9f)).toEqual({ from: "2026-10-22", to: "2026-10-28" });
    expect(v_280133("thisMonth", v_5c2f9f)).toEqual({ from: "2026-10-01", to: "2026-10-31" });
    expect(v_280133("lastMonth", v_5c2f9f)).toEqual({ from: "2026-09-01", to: "2026-09-30" });
    expect(v_280133("lastMonth", new Date(2026, 0, 5))).toEqual({ from: "2025-12-01", to: "2025-12-31" });
    expect(v_280133("last7", new Date(2026, 2, 3))).toEqual({ from: "2026-02-25", to: "2026-03-03" });
  });

  it("pickDay: 시작 → 끝, 앞 날짜면 시작 이동, 둘 다 있으면 새로", () => {
    let v_d5dda0 = v_cae033({ from: null, to: null }, "2026-10-20");
    expect(v_d5dda0).toEqual({ from: "2026-10-20", to: null });
    expect(v_cae033(v_d5dda0, "2026-10-18")).toEqual({ from: "2026-10-18", to: null });
    v_d5dda0 = v_cae033(v_d5dda0, "2026-10-26");
    expect(v_d5dda0).toEqual({ from: "2026-10-20", to: "2026-10-26" });
    expect(v_cae033(v_d5dda0, "2026-10-01")).toEqual({ from: "2026-10-01", to: null });
    expect(v_cae033({ from: "2026-10-20", to: null }, "2026-10-20")).toEqual({ from: "2026-10-20", to: "2026-10-20" });
  });

  it("monthGrid: 2026-10 은 목요일 시작, 31일, 7칸 줄", () => {
    const v_206b88 = v_c3f0be(2026, 9);
    expect(v_206b88[0]).toEqual([null, null, null, null, "2026-10-01", "2026-10-02", "2026-10-03"]);
    expect(v_206b88.every((v_cb35cb) => v_cb35cb.length === 7)).toBe(true);
    expect(v_206b88.flat().filter(Boolean)).toHaveLength(31);
  });

  it("formatRangeLabel", () => {
    expect(v_669b27({ from: "2026-10-20", to: "2026-10-26" }, v_5c2f9f)).toBe("10.20 ~ 10.26");
    expect(v_669b27({ from: "2026-10-28", to: "2026-10-28" }, v_5c2f9f)).toBe("10.28");
    expect(v_669b27({ from: "2025-12-30", to: "2026-01-02" }, v_5c2f9f)).toBe("2025.12.30 ~ 01.02");
  });
});
