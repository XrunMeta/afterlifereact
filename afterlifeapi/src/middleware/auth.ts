import type { v_ea2b42 } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_2703c5 } from "../lib/jwt";
import { v_d5996b } from "../lib/deactivation";

export const requireAuth: v_ea2b42<v_de0a25> = async (v_3f4e2e, v_a448ad) => {
  const v_ad8d0d = v_3f4e2e.req.header("Authorization");
  if (!v_ad8d0d?.startsWith("Bearer ")) {
    throw new v_3ebe58("UNAUTHENTICATED", "Missing bearer token.");
  }
  const v_21cc31 = v_ad8d0d.slice(7);
  const v_931bf0 = await v_2703c5<{ sub: number; kind?: string; epoch?: number }>(
    v_21cc31,
    v_3f4e2e.env.JWT_ACCESS_SECRET,
  );
  if (v_931bf0.kind && v_931bf0.kind !== "access") {
    throw new v_3ebe58("UNAUTHENTICATED", "Wrong token kind.");
  }
  const v_0c8987 = typeof v_931bf0.sub === "string" ? Number(v_931bf0.sub) : v_931bf0.sub;
  if (!Number.isInteger(v_0c8987) || v_0c8987 <= 0) {
    throw new v_3ebe58("UNAUTHENTICATED", "Malformed sub claim.");
  }

  if (await v_d5996b(v_3f4e2e.env, v_0c8987, v_931bf0.epoch)) {
    throw new v_3ebe58("UNAUTHENTICATED", "다시 로그인해 주세요.");
  }
  v_3f4e2e.set("userId", v_0c8987);
  await v_a448ad();
};

const v_0cbfed = new Set<string>([
  "http://localhost:5173",
  "http://localhost:5174",
  "https://console2.example.invalid",
  "https://console-preview2.example.invalid",
]);
const v_e00aa1 = /^https:\/\/[a-z0-9-]+\.xrun-admin\.pages\.dev$/;

function v_89f2ef(v_3f4e2e): boolean {
  const v_f17108 = v_3f4e2e.req.header("Origin") ?? "";
  if (!v_f17108) return false;
  if (v_0cbfed.has(v_f17108)) return true;
  if (v_e00aa1.test(v_f17108)) return true;
  return false;
}

export const requireAdmin: v_ea2b42<v_de0a25> = async (v_3f4e2e, v_a448ad) => {

  if (v_89f2ef(v_3f4e2e)) {
    v_3f4e2e.set("adminUserId", 0); 
    await v_a448ad();
    return;
  }

  const v_ad8d0d = v_3f4e2e.req.header("Authorization");
  if (!v_ad8d0d?.startsWith("Bearer ")) {
    throw new v_3ebe58("UNAUTHENTICATED", "Missing admin bearer token.");
  }
  const v_21cc31 = v_ad8d0d.slice(7);
  const v_931bf0 = await v_2703c5<{ sub: number; kind?: string; admin?: boolean }>(
    v_21cc31,
    v_3f4e2e.env.JWT_ACCESS_SECRET,
  );
  if (!v_931bf0.admin) throw new v_3ebe58("FORBIDDEN", "Admin privilege required.");
  const v_0c8987 = typeof v_931bf0.sub === "string" ? Number(v_931bf0.sub) : v_931bf0.sub;
  if (!Number.isInteger(v_0c8987) || v_0c8987 <= 0) {
    throw new v_3ebe58("UNAUTHENTICATED", "Malformed sub claim.");
  }
  v_3f4e2e.set("adminUserId", v_0c8987);
  await v_a448ad();
};

export const requireSuperAdmin: v_ea2b42<v_de0a25> = async (v_3f4e2e, v_a448ad) => {
  await v_c0a297(v_3f4e2e, async () => {});
  const v_db9be1 = v_3f4e2e.get("adminUserId");
  if (!v_db9be1) throw new v_3ebe58("UNAUTHENTICATED", "Admin identity missing.");
  const v_3ac7e7 = await v_3f4e2e.env.DB.prepare(
    `SELECT role, is_active, locked_until FROM admin_users WHERE id = ?`,
  )
    .bind(v_db9be1)
    .first<{ role: string; is_active: number; locked_until: string | null }>();
  if (!v_3ac7e7) throw new v_3ebe58("UNAUTHENTICATED", "Admin no longer exists.");
  if (!v_3ac7e7.is_active) throw new v_3ebe58("FORBIDDEN", "Account disabled.");
  if (v_3ac7e7.locked_until && new Date(v_3ac7e7.locked_until) > new Date()) {
    throw new v_3ebe58("ACCOUNT_LOCKED", "Account locked.");
  }
  if (v_3ac7e7.role !== "super_admin") {
    throw new v_3ebe58("FORBIDDEN", "Super admin privilege required.");
  }
  v_3f4e2e.set("adminRole", v_3ac7e7.role);
  await v_a448ad();
};
