import { v_b7c41b } from "zmui";
import type { v_4bcb54 } from "../index";

export const v_b99095 = new v_b7c41b<v_4bcb54>();

v_b99095.get("/:cloneId", async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.req.header("X-User-Id");
  if (!v_43e90c) return v_3f4e2e.json({ error: "Unauthorized" }, 401);

  const v_6e0fd3 = v_3f4e2e.req.param("cloneId");

  const v_eb25ce = await v_3f4e2e.env.DB.prepare(
    "SELECT created_by FROM clones WHERE id = ?"
  )
    .bind(v_6e0fd3)
    .first();

  if (!v_eb25ce) return v_3f4e2e.json({ error: "Clone not found" }, 404);
  if (v_eb25ce.created_by !== v_43e90c)
    return v_3f4e2e.json({ error: "Forbidden" }, 403);

  const v_43c42e = await v_3f4e2e.env.DB.prepare(
    "SELECT cs.*, u.name, u.email FROM clone_shares cs JOIN users u ON cs.shared_to = u.id WHERE cs.clone_id = ?"
  )
    .bind(v_6e0fd3)
    .all();

  return v_3f4e2e.json(v_43c42e.results);
});

v_b99095.post("/:cloneId", async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.req.header("X-User-Id");
  if (!v_43e90c) return v_3f4e2e.json({ error: "Unauthorized" }, 401);

  const v_6e0fd3 = v_3f4e2e.req.param("cloneId");
  const { shared_to: v_b9fc8e } = await v_3f4e2e.req.json();

  const v_eb25ce = await v_3f4e2e.env.DB.prepare(
    "SELECT created_by FROM clones WHERE id = ?"
  )
    .bind(v_6e0fd3)
    .first();

  if (!v_eb25ce) return v_3f4e2e.json({ error: "Clone not found" }, 404);
  if (v_eb25ce.created_by !== v_43e90c)
    return v_3f4e2e.json({ error: "Forbidden" }, 403);

  await v_3f4e2e.env.DB.prepare(
    "INSERT OR IGNORE INTO clone_shares (clone_id, owner_id, shared_to) VALUES (?, ?, ?)"
  )
    .bind(v_6e0fd3, v_43e90c, v_b9fc8e)
    .run();

  return v_3f4e2e.json({ success: true });
});

v_b99095.delete("/:cloneId/:targetUserId", async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.req.header("X-User-Id");
  if (!v_43e90c) return v_3f4e2e.json({ error: "Unauthorized" }, 401);

  const v_6e0fd3 = v_3f4e2e.req.param("cloneId");
  const v_489382 = v_3f4e2e.req.param("targetUserId");

  const v_eb25ce = await v_3f4e2e.env.DB.prepare(
    "SELECT created_by FROM clones WHERE id = ?"
  )
    .bind(v_6e0fd3)
    .first();

  if (!v_eb25ce) return v_3f4e2e.json({ error: "Clone not found" }, 404);
  if (v_eb25ce.created_by !== v_43e90c)
    return v_3f4e2e.json({ error: "Forbidden" }, 403);

  await v_3f4e2e.env.DB.prepare(
    "DELETE FROM clone_shares WHERE clone_id = ? AND shared_to = ?"
  )
    .bind(v_6e0fd3, v_489382)
    .run();

  return v_3f4e2e.json({ success: true });
});
