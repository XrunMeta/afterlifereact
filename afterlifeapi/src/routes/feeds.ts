import { v_b7c41b } from "zmui";
import type { v_4bcb54 } from "../index";
import { v_74defc, v_0f7c57 } from "../lib/logger";

export const v_632473 = new v_b7c41b<v_4bcb54>();

v_632473.get("/", async (v_3f4e2e) => {
  const v_8b9cd4 = v_3f4e2e.req.query("category");

  let v_7c5791 =
    "SELECT f.*, c.name as author, c.username, c.avatar_url as author_avatar, c.type FROM feeds f JOIN clones c ON f.clone_id = c.id";
  const v_24baff = [];

  if (v_8b9cd4) {
    v_7c5791 += " WHERE f.main_category = ?";
    v_24baff.push(v_8b9cd4);
  }

  v_7c5791 += " ORDER BY f.created_at DESC";

  const v_43c42e = await v_3f4e2e.env.DB.prepare(v_7c5791).bind(...v_24baff).all();
  return v_3f4e2e.json(v_43c42e.results);
});

v_632473.post("/:id/view", async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.req.header("X-User-Id");
  if (!v_43e90c) return v_3f4e2e.json({ error: "Unauthorized" }, 401);

  const v_389afb = v_3f4e2e.req.param("id");
  const v_2db2a5 = await v_3f4e2e.env.DB.prepare("SELECT clone_id FROM feeds WHERE id = ?").bind(v_389afb).first();

  if (v_2db2a5) {
    await v_74defc(v_3f4e2e, {
      userId: v_43e90c,
      cloneId: v_2db2a5.clone_id as string,
      action: "feed_view",
      metadata: { feed_id: v_389afb },
    });
  }

  return v_3f4e2e.json({ success: true });
});

v_632473.post("/:id/like", async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.req.header("X-User-Id");
  if (!v_43e90c) return v_3f4e2e.json({ error: "Unauthorized" }, 401);

  const v_389afb = v_3f4e2e.req.param("id");
  await v_3f4e2e.env.DB.prepare(
    "UPDATE feeds SET likes_count = likes_count + 1 WHERE id = ?"
  )
    .bind(v_389afb)
    .run();

  const v_2db2a5 = await v_3f4e2e.env.DB.prepare("SELECT clone_id FROM feeds WHERE id = ?").bind(v_389afb).first();
  if (v_2db2a5) {
    await v_0f7c57(v_3f4e2e.env.DB, v_2db2a5.clone_id as string, "total_likes");
    await v_74defc(v_3f4e2e, {
      userId: v_43e90c,
      cloneId: v_2db2a5.clone_id as string,
      action: "feed_like",
      metadata: { feed_id: v_389afb },
    });
  }

  return v_3f4e2e.json({ success: true });
});
