

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_c0a297 } from "../middleware/auth";

export const v_8a7bc1 = new v_b7c41b<v_de0a25>();

v_8a7bc1.use("*", v_c0a297);

const v_be461f = /^\d{4}-\d{2}-\d{2}$/;
const v_ffeb18 = /^[a-z_]{1,40}$/;

type Row = {
  id: number;
  userId: number;
  email: string | null;
  name: string | null;
  xrunMemberId: number | null;
  type: string;
  title: string | null;
  body: string | null;
  isRead: number;
  createdAt: string;
};

v_8a7bc1.get("/", async (v_3f4e2e) => {
  const v_2365e9 = Math.max(1, Number(v_3f4e2e.req.query("page") ?? 1) || 1);
  const v_02be30 = Math.max(1, Math.min(200, Number(v_3f4e2e.req.query("limit") ?? 50) || 50));
  const v_ab6401 = (v_3f4e2e.req.query("q") ?? "").trim().toLowerCase();
  const v_3b27d9 = (v_3f4e2e.req.query("type") ?? "").trim();
  const v_0dd7c7 = v_3f4e2e.req.query("read");
  const v_a13c2e = v_3f4e2e.req.query("from") ?? "";
  const v_257132 = v_3f4e2e.req.query("to") ?? "";
  const v_5e4f30 = v_3f4e2e.req.query("order") === "asc" ? "ASC" : "DESC";

  const v_694b25 = [];
  const v_209188 = [];
  if (v_ab6401) {
    const v_2a1d60 = `%${v_ab6401}%`;
    const v_468545 = [
      "LOWER(u.email) LIKE ?",
      "LOWER(COALESCE(u.name, '')) LIKE ?",
      "LOWER(COALESCE(n.title, '')) LIKE ?",
      "LOWER(COALESCE(n.body, '')) LIKE ?",
    ];
    v_209188.push(v_2a1d60, v_2a1d60, v_2a1d60, v_2a1d60);
    if (/^\d+$/.test(v_ab6401)) {
      v_468545.push("n.user_id = ?", "u.xrun_member_id = ?");
      v_209188.push(Number(v_ab6401), Number(v_ab6401));
    }
    v_694b25.push(`(${v_468545.join(" OR ")})`);
  }

  if (v_be461f.test(v_a13c2e)) {
    v_694b25.push(`date(n.created_at, '+9 hours') >= ?`);
    v_209188.push(v_a13c2e);
  }
  if (v_be461f.test(v_257132)) {
    v_694b25.push(`date(n.created_at, '+9 hours') <= ?`);
    v_209188.push(v_257132);
  }

  const v_5f8bac = v_ffeb18.test(v_3b27d9) ? "n.type = ?" : null;
  const v_ee1e47 = v_0dd7c7 === "1" ? "n.is_read = 1" : v_0dd7c7 === "0" ? "n.is_read = 0" : null;

  const v_abcc8d = (v_f91f33) => {
    const v_48c915 = [...v_694b25, ...v_f91f33.filter((v_62c214): v_62c214 is string => !!v_62c214)];
    return v_48c915.length ? `WHERE ${v_48c915.join(" AND ")}` : "";
  };
  const v_f8488e = `FROM notifications n LEFT JOIN users u ON u.id = n.user_id`;
  const v_e7e52e = [...v_209188, ...(v_5f8bac ? [v_3b27d9] : [])];

  const [v_7b3f91, v_18b8bf, v_62676b, v_db0487] = await Promise.all([
    v_3f4e2e.env.DB.prepare(`SELECT COUNT(*) AS total ${v_f8488e} ${v_abcc8d([v_5f8bac, v_ee1e47])}`)
      .bind(...v_e7e52e)
      .first<{ total: number }>(),
    v_3f4e2e.env.DB
      .prepare(
        `SELECT n.id, n.user_id AS userId, u.email, u.name, u.xrun_member_id AS xrunMemberId,
                n.type, n.title, n.body, n.is_read AS isRead, n.created_at AS createdAt
           ${v_f8488e}
           ${v_abcc8d([v_5f8bac, v_ee1e47])}
           ORDER BY n.id ${v_5e4f30}
           LIMIT ? OFFSET ?`,
      )
      .bind(...v_e7e52e, v_02be30, (v_2365e9 - 1) * v_02be30)
      .all<Row>(),

    v_3f4e2e.env.DB
      .prepare(
        `SELECT COUNT(*) AS total, COALESCE(SUM(CASE WHEN n.is_read = 0 THEN 1 ELSE 0 END), 0) AS unread
           ${v_f8488e} ${v_abcc8d([v_5f8bac])}`,
      )
      .bind(...v_e7e52e)
      .first<{ total: number; unread: number }>(),

    v_3f4e2e.env.DB
      .prepare(`SELECT n.type, COUNT(*) AS count ${v_f8488e} ${v_abcc8d([v_ee1e47])} GROUP BY n.type ORDER BY count DESC, n.type ASC`)
      .bind(...v_209188)
      .all<{ type: string; count: number }>(),
  ]);

  return v_3f4e2e.json({
    items: v_18b8bf.results ?? [],
    total: v_7b3f91?.total ?? 0,
    page: v_2365e9,
    limit: v_02be30,
    stats: { total: v_62676b?.total ?? 0, unread: v_62676b?.unread ?? 0 },
    types: v_db0487.results ?? [],
  });
});
