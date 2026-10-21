import {
  v_66c23e,
  v_46aa6f,
  v_a7fe23,
  v_9469dc,
  v_248d27,
} from "../../src/navigation/androidBackPolicy";

describe("androidBackPolicy (T-210)", () => {
  describe("decideAndroidBack", () => {
    it("포커스 히스토리가 있으면 defer (네이티브 스택에 맡김)", () => {
      expect(
        v_46aa6f({
          canGoBack: true,
          rootRouteName: "Main",
          activeTabName: "HomeTab",
          exitArmed: false,
        }),
      ).toEqual({ type: "defer" });
    });

    it("다른 탭 루트면 이전 탭으로 (없으면 HomeTab)", () => {
      expect(
        v_46aa6f({
          canGoBack: false,
          rootRouteName: "Main",
          activeTabName: "SearchTab",
          previousTabName: "ClonesTab",
          exitArmed: false,
        }),
      ).toEqual({ type: "goTab", tabName: "ClonesTab" });

      expect(
        v_46aa6f({
          canGoBack: false,
          rootRouteName: "Main",
          activeTabName: "SearchTab",
          exitArmed: false,
        }),
      ).toEqual({ type: "goTab", tabName: "HomeTab" });
    });

    it("이전 탭이 MyTab(설정)이면 무시하고 HomeTab 폴백", () => {
      expect(
        v_46aa6f({
          canGoBack: false,
          rootRouteName: "Main",
          activeTabName: "ClonesTab",
          previousTabName: "MyTab",
          exitArmed: false,
        }),
      ).toEqual({ type: "goTab", tabName: "HomeTab" });
    });

    it("MyTab 루트면 항상 ClonesTab(마이페이지 대시보드)으로", () => {
      expect(
        v_46aa6f({
          canGoBack: false,
          rootRouteName: "Main",
          activeTabName: "MyTab",
          previousTabName: "HomeTab",
          exitArmed: false,
        }),
      ).toEqual({ type: "goTab", tabName: "ClonesTab" });

      expect(
        v_46aa6f({
          canGoBack: false,
          rootRouteName: "Main",
          activeTabName: "MyTab",
          exitArmed: false,
        }),
      ).toEqual({ type: "goTab", tabName: "ClonesTab" });
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

  describe("canFocusedNavigatorGoBack", () => {
    it("다른 탭 스택이 깊어도 포커스 탭이 루트면 false", () => {
      const v_b6e533 = {
        index: 0,
        routes: [
          {
            name: "Main",
            state: {
              index: 1, 
              routes: [
                {
                  name: "HomeTab",
                  state: {
                    index: 2,
                    routes: [{ name: "Home" }, { name: "A" }, { name: "B" }],
                  },
                },
                {
                  name: "SearchTab",
                  state: {
                    index: 0,
                    routes: [{ name: "SearchHome" }],
                  },
                },
              ],
            },
          },
        ],
      };
      expect(v_66c23e(v_b6e533)).toBe(false);
    });

    it("포커스 스택에 히스토리 있으면 true", () => {
      const v_b6e533 = {
        index: 0,
        routes: [
          {
            name: "Main",
            state: {
              index: 0,
              routes: [
                {
                  name: "HomeTab",
                  state: {
                    index: 1,
                    routes: [{ name: "Home" }, { name: "Detail" }],
                  },
                },
              ],
            },
          },
        ],
      };
      expect(v_66c23e(v_b6e533)).toBe(true);
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
