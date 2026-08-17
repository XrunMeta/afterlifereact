

import type { v_4ba6cc, v_86b929 } from "./types";

export interface ScreenEntry {
  surface: v_86b929;
  screen: string;
  route: (ctx: v_4ba6cc) => string;
}

const v_3f029d = [

  { surface: "rn-web", screen: "clone-edit", route: (v_3f4e2e) => `/clone/${v_3f4e2e.cloneId}/edit` },
  { surface: "admin", screen: "clone-detail", route: (v_3f4e2e) => `/oth-path${v_3f4e2e.cloneId}` },
  { surface: "admin", screen: "users", route: () => `/oth-path` },
];

function v_b24339(surface: v_86b929, v_53746a): string {
  return `${v_91201b}:${v_53746a}`;
}

export function v_5d2614(v_1e6eca): Map<string, (ctx: v_4ba6cc) => string> {
  const v_8dcb51 = new Map<string, (ctx: v_4ba6cc) => string>();
  for (const v_9e86fd of v_1e6eca) {
    const v_0eb677 = v_b24339(v_9e86fd.surface, v_9e86fd.screen);
    if (v_8dcb51.has(v_0eb677)) {
      throw new Error(
        `[screens] 같은 (surface, screen) 조합이 두 번 등록됐습니다: "${v_0eb677}"\n` +
          `        route 가 하나로 정해지지 않습니다. e2e-automation/index/screens.ts 를 확인하세요.`,
      );
    }
    v_8dcb51.set(v_0eb677, v_9e86fd.route);
  }
  return v_8dcb51;
}

export const v_c50908 = v_5d2614(v_3f029d);

export function v_6eff18(surface: v_86b929, v_53746a): (ctx: v_4ba6cc) => string {
  const v_ea6dff = v_c50908.get(v_b24339(v_91201b, v_53746a));
  if (!v_ea6dff) {
    throw new Error(
      `[screens] 등록되지 않은 화면 키 "${v_b24339(v_91201b, v_53746a)}"\n` +
        `        e2e-automation/index/screens.ts 의 SCREENS 에 추가하세요.`,
    );
  }
  return v_ea6dff;
}
