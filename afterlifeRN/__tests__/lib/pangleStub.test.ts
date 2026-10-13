

import { v_cdacfb, v_36f8a3 } from "../../src/lib/pangle";

describe("AFL-1003 광고 스텁", () => {
  test("simulateRewardedAd 는 loading→loaded→showed→reward→close 순서로 이벤트를 내고 resolve 한다", async () => {
    const v_bf9904 = [];
    await v_cdacfb((v_9e86fd) => v_bf9904.push(v_9e86fd), 5); 
    expect(v_bf9904).toEqual(["loading", "loaded", "showed", "reward", "close"]);
  });

  test("simulateRewardedAd 는 reject 하지 않고 정상 종료한다(실광고 close 대응)", async () => {
    await expect(v_cdacfb(() => {}, 5)).resolves.toBeUndefined();
  });

  describe("isAdStubEnabled 게이팅", () => {
    const v_ba2215 = process.env.EXPO_PUBLIC_AD_STUB;
    afterEach(() => {
      if (v_ba2215 === undefined) delete process.env.EXPO_PUBLIC_AD_STUB;
      else process.env.EXPO_PUBLIC_AD_STUB = v_ba2215;
    });
    test("EXPO_PUBLIC_AD_STUB=1 이면 on", () => {
      process.env.EXPO_PUBLIC_AD_STUB = "1";
      expect(v_36f8a3()).toBe(true);
    });
    test("EXPO_PUBLIC_AD_STUB=0 이면 off (production 에서 실광고 보호)", () => {
      process.env.EXPO_PUBLIC_AD_STUB = "0";
      expect(v_36f8a3()).toBe(false);
    });
  });
});
