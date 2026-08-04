

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

export function isExitRoot(ctx: Pick<AndroidBackContext, "rootRouteName" | "activeTabName">): boolean {
  if (ctx.rootRouteName === "Auth") return true;
  if (ctx.rootRouteName === "Main" && (ctx.activeTabName == null || ctx.activeTabName === "HomeTab")) {
    return true;
  }
  return false;
}

export function decideAndroidBack(ctx: AndroidBackContext): AndroidBackAction {

  if (ctx.canGoBack) {
    return { type: "defer" };
  }

  if (ctx.rootRouteName === "Main" && ctx.activeTabName && ctx.activeTabName !== "HomeTab") {
    return { type: "goHomeTab" };
  }

  if (isExitRoot(ctx)) {
    return ctx.exitArmed ? { type: "exitNow" } : { type: "exitConfirm" };
  }

  return { type: "noop" };
}

export function getActiveMainTabName(rootState: {
  index: number;
  routes: Array<{ name: string; state?: { index?: number; routes?: Array<{ name: string }> } }>;
} | undefined): string | undefined {
  if (!rootState) return undefined;
  const rootRoute = rootState.routes[rootState.index];
  if (!rootRoute || rootRoute.name !== "Main") return undefined;
  const tabState = rootRoute.state;
  if (!tabState?.routes?.length) return "HomeTab";
  const idx = tabState.index ?? 0;
  return tabState.routes[idx]?.name ?? "HomeTab";
}

export function getRootRouteName(rootState: {
  index: number;
  routes: Array<{ name: string }>;
} | undefined): string | undefined {
  if (!rootState) return undefined;
  return rootState.routes[rootState.index]?.name;
}
