import type { v_02f01e, v_86b929 } from "./types";

export const SURFACES: Record<v_86b929, v_02f01e> = {
  admin: { id: "admin", label: "어드민 웹", automated: true },
  "rn-web": { id: "rn-web", label: "RN 앱 (웹 번들)", automated: true },

  "rn-native": { id: "rn-native", label: "RN 앱 (실기)", automated: false },
};
