

export type AndroidBackAction =

  | { type: "defer" }
  | { type: "goHomeTab" }
  | { type: "exitConfirm" }
  | { type: "exitNow" }
  | { type: "noop" };

export type AndroidBackContext = {

  canGoBack: boolean;

  rootRouteName: string | undefined;

  activeTabName: string | undefined;

  exitArmed: boolean;
};

export function v_248d27(v_16e2dd): boolean {
  if (v_16e2dd.rootRouteName === "Auth") return true;
  if (v_16e2dd.rootRouteName === "Main" && (v_16e2dd.activeTabName == null || v_16e2dd.activeTabName === "HomeTab")) {
    return true;
  }
  return false;
}

export function v_46aa6f(v_16e2dd): AndroidBackAction {

  if (v_16e2dd.canGoBack) {
    return { type: "defer" };
  }

  if (v_16e2dd.rootRouteName === "Main" && v_16e2dd.activeTabName && v_16e2dd.activeTabName !== "HomeTab") {
    return { type: "goHomeTab" };
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
