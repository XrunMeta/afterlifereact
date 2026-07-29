

import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_83773a, v_6ec970 } from "../src/lib/iapProducts";

v_469bf2("lookupProduct", () => {
  v_23805a("구독 상품 standard 의 크레딧·planCode 를 돌려준다", () => {
    v_4d37e3(v_83773a("run.xrun.afterlife.sub.standard")).toEqual({
      productId: "run.xrun.afterlife.sub.standard",
      kind: "subscription",
      creditsSec: 12000,
      planCode: "standard",
    });
  });

  v_23805a("구독 5종 모두 planCode 존재", () => {

    const v_0f1aa6 = [
      { id: "run.xrun.afterlife.sub.light", code: "light" },
      { id: "run.xrun.afterlife.sub.basic.v3", code: "basic" },
      { id: "run.xrun.afterlife.sub.standard", code: "standard" },
      { id: "run.xrun.afterlife.sub.plus", code: "plus" },
      { id: "run.xrun.afterlife.sub.premium", code: "premium" },
    ];
    for (const { id: v_389afb, code: v_c99bd2 } of v_0f1aa6) {
      const v_e2a85c = v_83773a(v_389afb);
      v_4d37e3(v_e2a85c?.kind).toBe("subscription");
      v_4d37e3(v_e2a85c?.planCode).toBe(v_c99bd2);
    }
  });

  v_23805a("소모성 충전 4종 (30/60/150/300) 을 돌려준다", () => {
    v_4d37e3(v_83773a("run.xrun.afterlife.credit.30")?.creditsSec).toBe(1800);
    v_4d37e3(v_83773a("run.xrun.afterlife.credit.60")).toEqual({
      productId: "run.xrun.afterlife.credit.60",
      kind: "consumable",
      creditsSec: 3600,
    });
    v_4d37e3(v_83773a("run.xrun.afterlife.credit.150")?.creditsSec).toBe(9000);
    v_4d37e3(v_83773a("run.xrun.afterlife.credit.300")?.creditsSec).toBe(18000);
  });

  v_23805a("모르는 상품은 null", () => {
    v_4d37e3(v_83773a("run.xrun.afterlife.sub.bogus")).toBeNull();
    v_4d37e3(v_83773a("")).toBeNull();
  });

  v_23805a("TOPUP_TTL_MS 는 5년", () => {
    const v_6a53fd = v_6ec970 / (24 * 60 * 60 * 1000);
    v_4d37e3(v_6a53fd).toBe(5 * 365);
  });
});
