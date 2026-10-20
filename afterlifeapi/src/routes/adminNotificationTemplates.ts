

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_c0a297 } from "../middleware/auth";
import { v_3ebe58 } from "../lib/errors";
import {
  v_5cb21e,
  v_d00fb9,
  v_e9e978,
  v_18b0cb,
  v_e2fd5b,
  type v_fe10f7,
} from "../lib/notificationTemplates";

export const v_a30cdb = new v_b7c41b<v_de0a25>();

v_a30cdb.use("*", v_c0a297);

const v_bb2943 = 200;
const v_6d5fb6 = 1000;

type Row = { k: string; lang: string; title: string; body: string; updatedAt: number; updatedBy: number | null };

v_a30cdb.get("/", async (v_3f4e2e) => {
  const v_18b8bf = (
    await v_3f4e2e.env.DB
      .prepare(
        `SELECT template_key AS k, lang, title, body, updated_at AS updatedAt, updated_by AS updatedBy
           FROM notification_templates`,
      )
      .all<Row>()
  ).results ?? [];
  const v_fd7614 = new Map<string, Row>();
  for (const v_cb35cb of v_18b8bf) v_fd7614.set(`${v_cb35cb.k}\u0000${v_cb35cb.lang}`, v_cb35cb);

  return v_3f4e2e.json({
    langs: v_5cb21e,
    templates: v_d00fb9.map((v_d5dda0) => ({
      key: v_d5dda0.key,
      group: v_d5dda0.group,
      description: v_d5dda0.description,
      vars: v_d5dda0.vars,
      values: Object.fromEntries(
        v_5cb21e.map((v_5254bf) => {
          const v_b6c474 = v_fd7614.get(`${v_d5dda0.key}\u0000${v_5254bf}`);
          const v_9e3676 = v_d5dda0.defaults[v_5254bf];
          return [
            v_5254bf,
            {
              title: v_b6c474?.title ?? v_9e3676.title,
              body: v_b6c474?.body ?? v_9e3676.body,
              overridden: !!v_b6c474,
              defaultTitle: v_9e3676.title,
              defaultBody: v_9e3676.body,
              updatedAt: v_b6c474?.updatedAt ?? null,
              updatedBy: v_b6c474?.updatedBy ?? null,
            },
          ];
        }),
      ),
    })),
  });
});

function v_31ed24(v_b24339, v_5254bf): v_fe10f7 {
  if (!v_e9e978.has(v_b24339)) throw new v_3ebe58("NOT_FOUND", `Unknown template: ${v_b24339}`);
  if (!(v_5cb21e as readonly string[]).includes(v_5254bf)) {
    throw new v_3ebe58("VALIDATION_FAILED", `lang must be one of: ${v_5cb21e.join(", ")}`);
  }
  return v_5254bf as v_fe10f7;
}

v_a30cdb.put("/:key/:lang", async (v_3f4e2e) => {
  const v_b24339 = v_3f4e2e.req.param("key");
  const v_5254bf = v_31ed24(v_b24339, v_3f4e2e.req.param("lang"));
  const v_9e3676 = v_e9e978.get(v_b24339)!;
  const v_148ff6 = (await v_3f4e2e.req.json().catch(() => ({}))) as { title?: unknown; body?: unknown };
  const v_9f1622 = typeof v_148ff6.title === "string" ? v_148ff6.title.trim() : "";
  const v_4d33b2 = typeof v_148ff6.body === "string" ? v_148ff6.body.trim() : "";
  if (!v_9f1622 || !v_4d33b2) throw new v_3ebe58("VALIDATION_FAILED", "title, body 는 비울 수 없습니다.");
  if (v_9f1622.length > v_bb2943 || v_4d33b2.length > v_6d5fb6) {
    throw new v_3ebe58("VALIDATION_FAILED", `title ≤ ${v_bb2943}자, body ≤ ${v_6d5fb6}자`);
  }
  const v_999957 = new Set(v_9e3676.vars.map((v_81e2ef) => v_81e2ef.name));
  const v_266752 = [...v_e2fd5b(v_9f1622), ...v_e2fd5b(v_4d33b2)].filter((v_e2a85c) => !v_999957.has(v_e2a85c));
  if (v_266752.length) {
    throw new v_3ebe58(
      "VALIDATION_FAILED",
      `사용할 수 없는 변수: ${[...new Set(v_266752)].map((v_ceb55a) => `{${v_ceb55a}}`).join(", ")} — 허용: ${
        v_9e3676.vars.length ? v_9e3676.vars.map((v_81e2ef) => `{${v_81e2ef.name}}`).join(", ") : "(없음)"
      }`,
    );
  }
  const v_db9be1 = v_3f4e2e.get("adminUserId") ?? null;
  const v_5c2f9f = Date.now();
  await v_3f4e2e.env.DB
    .prepare(
      `INSERT INTO notification_templates (template_key, lang, title, body, updated_at, updated_by)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(template_key, lang) DO UPDATE SET
         title = excluded.title, body = excluded.body,
         updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    )
    .bind(v_b24339, v_5254bf, v_9f1622, v_4d33b2, v_5c2f9f, v_db9be1)
    .run();
  v_18b0cb();
  return v_3f4e2e.json({ ok: true, key: v_b24339, lang: v_5254bf, title: v_9f1622, body: v_4d33b2, overridden: true, updatedAt: v_5c2f9f });
});

v_a30cdb.delete("/:key/:lang", async (v_3f4e2e) => {
  const v_b24339 = v_3f4e2e.req.param("key");
  const v_5254bf = v_31ed24(v_b24339, v_3f4e2e.req.param("lang"));
  await v_3f4e2e.env.DB
    .prepare(`DELETE FROM notification_templates WHERE template_key = ? AND lang = ?`)
    .bind(v_b24339, v_5254bf)
    .run();
  v_18b0cb();
  const v_9e3676 = v_e9e978.get(v_b24339)!.defaults[v_5254bf];
  return v_3f4e2e.json({ ok: true, key: v_b24339, lang: v_5254bf, title: v_9e3676.title, body: v_9e3676.body, overridden: false });
});
