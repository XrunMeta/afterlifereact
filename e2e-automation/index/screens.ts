

import type { FixtureCtx, SurfaceId } from "./types";

export interface ScreenEntry {
  surface: SurfaceId;
  screen: string;
  route: (ctx: FixtureCtx) => string;
}

const RAW_SCREENS: ScreenEntry[] = [
  { surface: "rn-web", screen: "clone-edit", route: (c) => `/#/oth-path${c.cloneId}/edit` },
  { surface: "admin", screen: "clone-detail", route: (c) => `/oth-path${c.cloneId}` },
  { surface: "admin", screen: "users", route: () => `/oth-path` },
];

function key(surface: SurfaceId, screen: string): string {
  return `${surface}:${screen}`;
}

export function buildScreens(entries: ScreenEntry[]): Map<string, (ctx: FixtureCtx) => string> {
  const map = new Map<string, (ctx: FixtureCtx) => string>();
  for (const e of entries) {
    const k = key(e.surface, e.screen);
    if (map.has(k)) {
      throw new Error(
        `[screens] 같은 (surface, screen) 조합이 두 번 등록됐습니다: "${k}"\n` +
          `        route 가 하나로 정해지지 않습니다. e2e-automation/index/screens.ts 를 확인하세요.`,
      );
    }
    map.set(k, e.route);
  }
  return map;
}

export const SCREENS = buildScreens(RAW_SCREENS);

export function routeFor(surface: SurfaceId, screen: string): (ctx: FixtureCtx) => string {
  const found = SCREENS.get(key(surface, screen));
  if (!found) {
    throw new Error(
      `[screens] 등록되지 않은 화면 키 "${key(surface, screen)}"\n` +
        `        e2e-automation/index/screens.ts 의 SCREENS 에 추가하세요.`,
    );
  }
  return found;
}
