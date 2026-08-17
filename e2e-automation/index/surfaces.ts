import type { Surface, SurfaceId } from "./types";

export const SURFACES: Record<SurfaceId, Surface> = {
  admin: { id: "admin", label: "어드민 웹", automated: true },
  "rn-web": { id: "rn-web", label: "RN 앱 (웹 번들)", automated: true },

  "rn-native": { id: "rn-native", label: "RN 앱 (실기)", automated: false },
};
