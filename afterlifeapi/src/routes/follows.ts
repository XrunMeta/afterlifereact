import { v_b7c41b } from "zmui";
import type { v_4bcb54 } from "../index";
import { v_74defc, v_0f7c57 } from "../lib/logger";

export const v_1e752a = new v_b7c41b<v_4bcb54>();

v_1e752a.get("/", async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.req.header("X-User-Id");
  if (!v_43e90c) return v_3f4e2e.json({ error: "Unauthorized" }, 401);

  const v_43c42e = await v_3f4e2e.env.DB.prepare(
    "SELECT c.* FROM follows f JOIN clones c ON f.clone_id = c.id WHERE f.user_id = ? ORDER BY f.created_at DESC"
  )
    .bind(v_43e90c)
    .all();

  return v_3f4e2e.json(v_43c42e.results);
});

v_1e752a.post("/", async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.req.header("X-User-Id");
  if (!v_43e90c) return v_3f4e2e.json({ error: "Unauthorized" }, 401);

  const { clone_id: v_fccde8 } = await v_3f4e2e.req.json();

  await v_3f4e2e.env.DB.prepare(
    "INSERT OR IGNORE INTO follows (user_id, clone_id) VALUES (?, ?)"
  )
    .bind(v_43e90c, v_fccde8)
    .run();

  await v_0f7c57(v_3f4e2e.env.DB, v_fccde8, "total_followers");
  await v_74defc(v_3f4e2e, { userId: v_43e90c, cloneId: v_fccde8, action: "follow" });

  return v_3f4e2e.json({ success: true });
});

v_1e752a.delete("/:cloneId", async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.req.header("X-User-Id");
  if (!v_43e90c) return v_3f4e2e.json({ error: "Unauthorized" }, 401);

  const v_6e0fd3 = v_3f4e2e.req.param("cloneId");

  await v_3f4e2e.env.DB.prepare(
    "DELETE FROM follows WHERE user_id = ? AND clone_id = ?"
  )
    .bind(v_43e90c, v_6e0fd3)
    .run();

  await v_0f7c57(v_3f4e2e.env.DB, v_6e0fd3, "total_followers", -1);
  await v_74defc(v_3f4e2e, { userId: v_43e90c, cloneId: v_6e0fd3, action: "unfollow" });

  return v_3f4e2e.json({ success: true });
});
