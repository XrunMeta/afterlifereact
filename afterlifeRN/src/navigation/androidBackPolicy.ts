

export type AndroidBackAction =

  | { type: "defer" }

  | { type: "goTab"; tabName: string }
  | { type: "exitConfirm" }
  | { type: "exitNow" }
  | { type: "noop" };

export type AndroidBackContext = {

  canGoBack: boolean;

  rootRouteName: string | undefined;

  activeTabName: string | undefined;

  previousTabName?: string | undefined;

  exitArmed: boolean;
};

type NavStateLike = {
  index?: number;
  routes: Array<{ name: string; state?: NavStateLike }>;
};

export function v_248d27(v_16e2dd): boolean {
  if (v_16e2dd.rootRouteName === "Auth") return true;
  if (v_16e2dd.rootRouteName === "Main" && (v_16e2dd.activeTabName == null || v_16e2dd.activeTabName === "HomeTab")) {
    return true;
  }
  return false;
}

export function v_66c23e(v_b6e533): boolean {
  if (!v_b6e533?.routes?.length) return false;
  const v_a56041 = v_b6e533.index ?? 0;
  const v_c7daf6 = v_b6e533.routes[v_a56041];
  if (v_c7daf6?.state) {
    return v_66c23e(v_c7daf6.state);
  }
  return v_a56041 > 0;
}

function v_f861ba(
  v_5fe56f,
  v_ad87e7,
  v_0debf4,
): string {

  if (
    v_ad87e7 &&
    v_ad87e7 !== v_5fe56f &&
    v_ad87e7 !== "MyTab"
  ) {
    return v_ad87e7;
  }
  return v_0debf4;
}

export function v_46aa6f(v_16e2dd): AndroidBackAction {

  if (v_16e2dd.canGoBack) {
    return { type: "defer" };
  }

  if (v_16e2dd.rootRouteName === "Main" && v_16e2dd.activeTabName === "MyTab") {
    return { type: "goTab", tabName: "ClonesTab" };
  }

  if (v_16e2dd.rootRouteName === "Main" && v_16e2dd.activeTabName && v_16e2dd.activeTabName !== "HomeTab") {
    return {
      type: "goTab",
      tabName: v_f861ba(v_16e2dd.activeTabName, v_16e2dd.previousTabName, "HomeTab"),
    };
  }

  if (v_248d27(v_16e2dd)) {
    return v_16e2dd.exitArmed ? { type: "exitNow" } : { type: "exitConfirm" };
  }

  return { type: "noop" };
}

export function v_a7fe23(v_793a30): string | undefined {
  if (!v_793a30) return undefined;
  const v_321b40 = v_793a30.routes[v_793a30.index];
  if (!v_321b40 || v_321b40.name !== "Main") return undefined;
  const v_26865c = v_321b40.state;
  if (!v_26865c?.routes?.length) return "HomeTab";
  const v_e86ad8 = v_26865c.index ?? 0;
  return v_26865c.routes[v_e86ad8]?.name ?? "HomeTab";
}

export function v_9469dc(v_793a30): string | undefined {
  if (!v_793a30) return undefined;
  return v_793a30.routes[v_793a30.index]?.name;
}
