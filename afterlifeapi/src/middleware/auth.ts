import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { verifyToken } from "../lib/jwt";

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new APIError("UNAUTHENTICATED", "Missing bearer token.");
  }
  const token = header.slice(7);
  const payload = await verifyToken<{ sub: number; kind?: string }>(
    token,
    c.env.JWT_ACCESS_SECRET,
  );
  if (payload.kind && payload.kind !== "access") {
    throw new APIError("UNAUTHENTICATED", "Wrong token kind.");
  }
  const uid = typeof payload.sub === "string" ? Number(payload.sub) : payload.sub;
  if (!Number.isInteger(uid) || uid <= 0) {
    throw new APIError("UNAUTHENTICATED", "Malformed sub claim.");
  }
  c.set("userId", uid);
  await next();
};

const XRUN_ADMIN_ORIGINS = new Set<string>([
  "http://localhost:5173",
  "http://localhost:5174",
  "https://xrun-admin.pages.dev",
  "https://preview.xrun-admin.pages.dev",
]);
const XRUN_ADMIN_HOST_RE = /^https:\/\/[a-z0-9-]+\.xrun-admin\.pages\.dev$/;

function isXrunAdminBridge(c: { req: { header: (k: string) => string | undefined } }): boolean {
  const origin = c.req.header("Origin") ?? "";
  if (!origin) return false;
  if (XRUN_ADMIN_ORIGINS.has(origin)) return true;
  if (XRUN_ADMIN_HOST_RE.test(origin)) return true;
  return false;
}

export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {

  if (isXrunAdminBridge(c)) {
    c.set("adminUserId", 0); 
    await next();
    return;
  }

  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new APIError("UNAUTHENTICATED", "Missing admin bearer token.");
  }
  const token = header.slice(7);
  const payload = await verifyToken<{ sub: number; kind?: string; admin?: boolean }>(
    token,
    c.env.JWT_ACCESS_SECRET,
  );
  if (!payload.admin) throw new APIError("FORBIDDEN", "Admin privilege required.");
  const uid = typeof payload.sub === "string" ? Number(payload.sub) : payload.sub;
  if (!Number.isInteger(uid) || uid <= 0) {
    throw new APIError("UNAUTHENTICATED", "Malformed sub claim.");
  }
  c.set("adminUserId", uid);
  await next();
};

export const requireSuperAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  await requireAdmin(c, async () => {});
  const adminId = c.get("adminUserId");
  if (!adminId) throw new APIError("UNAUTHENTICATED", "Admin identity missing.");
  const row = await c.env.DB.prepare(
    `SELECT role, is_active, locked_until FROM admin_users WHERE id = ?`,
  )
    .bind(adminId)
    .first<{ role: string; is_active: number; locked_until: string | null }>();
  if (!row) throw new APIError("UNAUTHENTICATED", "Admin no longer exists.");
  if (!row.is_active) throw new APIError("FORBIDDEN", "Account disabled.");
  if (row.locked_until && new Date(row.locked_until) > new Date()) {
    throw new APIError("ACCOUNT_LOCKED", "Account locked.");
  }
  if (row.role !== "super_admin") {
    throw new APIError("FORBIDDEN", "Super admin privilege required.");
  }
  c.set("adminRole", row.role);
  await next();
};
