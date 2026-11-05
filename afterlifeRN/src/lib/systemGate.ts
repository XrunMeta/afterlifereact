

export type ServerStatus = "running" | "maintenance" | "stopped";

export interface SystemConfig {
  serverStatus: ServerStatus;
  minVersionIos: string;
  minVersionAndroid: string;
}

export type GateState = "maintenance" | "stopped" | "update" | null;

export const v_032970 = {
  ios: "https://apps.apple.com/app/id6793993890",
  android: "https://play.google.com/store/apps/details?id=run.xrun.afterlifeRN",
} as const;

export function v_fdfd83(v_779914, v_148ff6): number {
  const v_21ba9c = v_779914.split(".").map((v_62c214) => parseInt(v_62c214, 10) || 0);
  const v_4f321c = v_148ff6.split(".").map((v_62c214) => parseInt(v_62c214, 10) || 0);
  for (let v_ebec57 = 0; v_ebec57 < Math.max(v_21ba9c.length, v_4f321c.length); v_ebec57++) {
    const v_d5dda0 = (v_21ba9c[v_ebec57] ?? 0) - (v_4f321c[v_ebec57] ?? 0);
    if (v_d5dda0 !== 0) return v_d5dda0;
  }
  return 0;
}

export function v_037b0a(
  v_01dcf5,
  v_81a27a,
  v_298be1,
  v_328259 = {},
): GateState {
  if (!v_01dcf5) return null; 
  if (v_01dcf5.serverStatus === "maintenance") return "maintenance";
  if (v_01dcf5.serverStatus === "stopped") return "stopped";
  if (v_328259.skipVersion || !v_298be1) return null;
  const v_43e24b = v_81a27a === "ios" ? v_01dcf5.minVersionIos : v_81a27a === "android" ? v_01dcf5.minVersionAndroid : "";
  if (v_43e24b && v_fdfd83(v_298be1, v_43e24b) < 0) return "update";
  return null;
}

export function v_f3fadd(v_4d33b2): SystemConfig | null {
  if (!v_4d33b2 || typeof v_4d33b2 !== "object") return null;
  const v_148ff6 = v_4d33b2 as Record<string, unknown>;
  const v_fd5f43 = v_148ff6.serverStatus;
  return {
    serverStatus: v_fd5f43 === "maintenance" || v_fd5f43 === "stopped" ? v_fd5f43 : "running",
    minVersionIos: typeof v_148ff6.minVersionIos === "string" ? v_148ff6.minVersionIos.trim() : "",
    minVersionAndroid: typeof v_148ff6.minVersionAndroid === "string" ? v_148ff6.minVersionAndroid.trim() : "",
  };
}
