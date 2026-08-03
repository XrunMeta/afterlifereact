import {
  v_46aa6f,
  v_a7fe23,
  v_9469dc,
  v_248d27,
} from "../../src/navigation/androidBackPolicy";

describe("androidBackPolicy (T-210)", () => {
  describe("decideAndroidBack", () => {
    it("히스토리가 있으면 defer (네이티브 스택에 맡김)", () => {
      expect(
        v_46aa6f({
          canGoBack: true,
          rootRouteName: "Main",
          activeTabName: "HomeTab",
          exitArmed: false,
        }),
      ).toEqual({ type: "defer" });
    });

    it("다른 탭 루트면 HomeTab 으로", () => {
      for (const v_11083e of ["SearchTab", "CreateTab", "ShortsTab", "ClonesTab", "MyTab"]) {
        expect(
          v_46aa6f({
            canGoBack: false,
            rootRouteName: "Main",
            activeTabName: v_11083e,
            exitArmed: false,
          }),
        ).toEqual({ type: "goHomeTab" });
      }
    });

    it("HomeTab 루트에서 첫 백 → exitConfirm", () => {
      expect(
        v_46aa6f({
          canGoBack: false,
          rootRouteName: "Main",
          activeTabName: "HomeTab",
          exitArmed: false,
        }),
      ).toEqual({ type: "exitConfirm" });
    });

    it("HomeTab 루트에서 무장 상태 → exitNow", () => {
      expect(
        v_46aa6f({
          canGoBack: false,
          rootRouteName: "Main",
          activeTabName: "HomeTab",
          exitArmed: true,
        }),
      ).toEqual({ type: "exitNow" });
    });

    it("Auth 루트도 2회 종료", () => {
      expect(
        v_46aa6f({
          canGoBack: false,
          rootRouteName: "Auth",
          activeTabName: undefined,
          exitArmed: false,
        }),
      ).toEqual({ type: "exitConfirm" });
      expect(
        v_46aa6f({
          canGoBack: false,
          rootRouteName: "Auth",
          activeTabName: undefined,
          exitArmed: true,
        }),
      ).toEqual({ type: "exitNow" });
    });

    it("canGoBack 이 우선 — 탭이 달라도 defer", () => {
      expect(
        v_46aa6f({
          canGoBack: true,
          rootRouteName: "Main",
          activeTabName: "CreateTab",
          exitArmed: true,
        }),
      ).toEqual({ type: "defer" });
    });
  });

  describe("isExitRoot", () => {
    it("Main+HomeTab / Auth 만 true", () => {
      expect(v_248d27({ rootRouteName: "Main", activeTabName: "HomeTab" })).toBe(true);
      expect(v_248d27({ rootRouteName: "Auth", activeTabName: undefined })).toBe(true);
      expect(v_248d27({ rootRouteName: "Main", activeTabName: "SearchTab" })).toBe(false);
      expect(v_248d27({ rootRouteName: "Call", activeTabName: undefined })).toBe(false);
    });
  });

  describe("state helpers", () => {
    it("getRootRouteName / getActiveMainTabName", () => {
      const v_b6e533 = {
        index: 0,
        routes: [
          {
            name: "Main",
            state: {
              index: 1,
              routes: [{ name: "HomeTab" }, { name: "SearchTab" }],
            },
          },
        ],
      };
      expect(v_9469dc(v_b6e533)).toBe("Main");
      expect(v_a7fe23(v_b6e533)).toBe("SearchTab");
    });

    it("Main 인데 tab state 없으면 HomeTab 가정", () => {
      const v_b6e533 = {
        index: 0,
        routes: [{ name: "Main" }],
      };
      expect(v_a7fe23(v_b6e533)).toBe("HomeTab");
    });
  });
});
