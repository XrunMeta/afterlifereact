

import { describe, it, expect } from "vitest";
import { lookupProduct, TOPUP_TTL_MS } from "../src/lib/iapProducts";

describe("lookupProduct", () => {
  it("구독 상품 standard 의 크레딧·planCode 를 돌려준다", () => {
    expect(lookupProduct("run.xrun.afterlife.sub.standard")).toEqual({
      productId: "run.xrun.afterlife.sub.standard",
      kind: "subscription",
      creditsSec: 12000,
      planCode: "standard",
    });
  });

  it("구독 5종 모두 planCode 존재", () => {

    const cases: { id: string; code: "light" | "basic" | "standard" | "plus" | "premium" }[] = [
      { id: "run.xrun.afterlife.sub.light", code: "light" },
      { id: "run.xrun.afterlife.sub.basic.v3", code: "basic" },
      { id: "run.xrun.afterlife.sub.standard", code: "standard" },
      { id: "run.xrun.afterlife.sub.plus", code: "plus" },
      { id: "run.xrun.afterlife.sub.premium", code: "premium" },
    ];
    for (const { id, code } of cases) {
      const p = lookupProduct(id);
      expect(p?.kind).toBe("subscription");
      expect(p?.planCode).toBe(code);
    }
  });

  it("소모성 충전 4종 (30/60/150/300) 을 돌려준다", () => {
    expect(lookupProduct("run.xrun.afterlife.credit.30")?.creditsSec).toBe(1800);
    expect(lookupProduct("run.xrun.afterlife.credit.60")).toEqual({
      productId: "run.xrun.afterlife.credit.60",
      kind: "consumable",
      creditsSec: 3600,
    });
    expect(lookupProduct("run.xrun.afterlife.credit.150")?.creditsSec).toBe(9000);
    expect(lookupProduct("run.xrun.afterlife.credit.300")?.creditsSec).toBe(18000);
  });

  it("모르는 상품은 null", () => {
    expect(lookupProduct("run.xrun.afterlife.sub.bogus")).toBeNull();
    expect(lookupProduct("")).toBeNull();
  });

  it("TOPUP_TTL_MS 는 5년", () => {
    const days = TOPUP_TTL_MS / (24 * 60 * 60 * 1000);
    expect(days).toBe(5 * 365);
  });
});
