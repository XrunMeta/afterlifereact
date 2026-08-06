import {
  decideAndroidBack,
  getActiveMainTabName,
  getRootRouteName,
  isExitRoot,
} from "../../src/navigation/androidBackPolicy";

describe("androidBackPolicy (T-210)", () => {
  describe("decideAndroidBack", () => {
    it("히스토리가 있으면 defer (네이티브 스택에 맡김)", () => {
      expect(
        decideAndroidBack({
          canGoBack: true,
          rootRouteName: "Main",
          activeTabName: "HomeTab",
          exitArmed: false,
        }),
      ).toEqual({ type: "defer" });
    });

    it("다른 탭 루트면 HomeTab 으로", () => {
      for (const tab of ["SearchTab", "CreateTab", "ShortsTab", "ClonesTab", "MyTab"]) {
        expect(
          decideAndroidBack({
            canGoBack: false,
            rootRouteName: "Main",
            activeTabName: tab,
            exitArmed: false,
          }),
        ).toEqual({ type: "goHomeTab" });
      }
    });

    it("HomeTab 루트에서 첫 백 → exitConfirm", () => {
      expect(
        decideAndroidBack({
          canGoBack: false,
          rootRouteName: "Main",
          activeTabName: "HomeTab",
          exitArmed: false,
        }),
      ).toEqual({ type: "exitConfirm" });
    });

    it("HomeTab 루트에서 무장 상태 → exitNow", () => {
      expect(
        decideAndroidBack({
          canGoBack: false,
          rootRouteName: "Main",
          activeTabName: "HomeTab",
          exitArmed: true,
        }),
      ).toEqual({ type: "exitNow" });
    });

    it("Auth 루트도 2회 종료", () => {
      expect(
        decideAndroidBack({
          canGoBack: false,
          rootRouteName: "Auth",
          activeTabName: undefined,
          exitArmed: false,
        }),
      ).toEqual({ type: "exitConfirm" });
      expect(
        decideAndroidBack({
          canGoBack: false,
          rootRouteName: "Auth",
          activeTabName: undefined,
          exitArmed: true,
        }),
      ).toEqual({ type: "exitNow" });
    });

    it("canGoBack 이 우선 — 탭이 달라도 defer", () => {
      expect(
        decideAndroidBack({
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
      expect(isExitRoot({ rootRouteName: "Main", activeTabName: "HomeTab" })).toBe(true);
      expect(isExitRoot({ rootRouteName: "Auth", activeTabName: undefined })).toBe(true);
      expect(isExitRoot({ rootRouteName: "Main", activeTabName: "SearchTab" })).toBe(false);
      expect(isExitRoot({ rootRouteName: "Call", activeTabName: undefined })).toBe(false);
    });
  });

  describe("state helpers", () => {
    it("getRootRouteName / getActiveMainTabName", () => {
      const state = {
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
      expect(getRootRouteName(state)).toBe("Main");
      expect(getActiveMainTabName(state)).toBe("SearchTab");
    });

    it("Main 인데 tab state 없으면 HomeTab 가정", () => {
      const state = {
        index: 0,
        routes: [{ name: "Main" }],
      };
      expect(getActiveMainTabName(state)).toBe("HomeTab");
    });
  });
});
