import { v_b7c41b } from "zmui";
import type { v_4bcb54 } from "../index";
import { v_74defc, v_d36b8d } from "../lib/logger";

export const v_f891e6 = new v_b7c41b<v_4bcb54>();

v_f891e6.get("/", async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.req.header("X-User-Id");
  const v_3b27d9 = v_3f4e2e.req.query("type");

  let v_7c5791 = "SELECT * FROM clones WHERE visibility = 'public'";
  const v_24baff = [];

  if (v_43e90c) {
    v_7c5791 += " OR created_by = ?";
    v_24baff.push(v_43e90c);
  }
  if (v_3b27d9) {
    v_7c5791 += " AND type = ?";
    v_24baff.push(v_3b27d9);
  }

  v_7c5791 += " ORDER BY created_at DESC";

  const v_43c42e = await v_3f4e2e.env.DB.prepare(v_7c5791).bind(...v_24baff).all();
  return v_3f4e2e.json(v_43c42e.results);
});

v_f891e6.get("/:id", async (v_3f4e2e) => {
  const v_389afb = v_3f4e2e.req.param("id");
  const v_eb25ce = await v_3f4e2e.env.DB.prepare("SELECT * FROM clones WHERE id = ?")
    .bind(v_389afb)
    .first();

  if (!v_eb25ce) return v_3f4e2e.json({ error: "Clone not found" }, 404);

  const v_774c91 = await v_3f4e2e.env.DB.prepare(
    "SELECT interest FROM clone_interests WHERE clone_id = ?"
  )
    .bind(v_389afb)
    .all();

  return v_3f4e2e.json({
    ...v_eb25ce,
    interests: v_774c91.results.map((v_cb35cb) => v_cb35cb.interest),
  });
});

v_f891e6.post("/", async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.req.header("X-User-Id");
  if (!v_43e90c) return v_3f4e2e.json({ error: "Unauthorized" }, 401);

  const v_4d33b2 = await v_3f4e2e.req.json();
  const v_389afb = crypto.randomUUID();

  await v_3f4e2e.env.DB.prepare(
    "INSERT INTO clones (id, name, username, avatar_url, cover_image_url, type, category, description, visibility, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(
      v_389afb, v_4d33b2.name, v_4d33b2.username, v_4d33b2.avatar_url, v_4d33b2.cover_image_url,
      v_4d33b2.type, v_4d33b2.category, v_4d33b2.description, v_4d33b2.visibility, v_43e90c
    )
    .run();

  if (v_4d33b2.interests?.length) {
    const v_df04a4 = v_3f4e2e.env.DB.prepare(
      "INSERT INTO clone_interests (clone_id, interest) VALUES (?, ?)"
    );
    await v_3f4e2e.env.DB.batch(v_4d33b2.interests.map((v_ebec57) => v_df04a4.bind(v_389afb, v_ebec57)));
  }

  await v_d36b8d(v_3f4e2e.env.DB, v_389afb);
  await v_74defc(v_3f4e2e, { userId: v_43e90c, cloneId: v_389afb, action: "clone_create" });

  return v_3f4e2e.json({ id: v_389afb }, 201);
});

v_f891e6.put("/:id", async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.req.header("X-User-Id");
  if (!v_43e90c) return v_3f4e2e.json({ error: "Unauthorized" }, 401);

  const v_389afb = v_3f4e2e.req.param("id");
  const v_4d33b2 = await v_3f4e2e.req.json();

  const v_eb25ce = await v_3f4e2e.env.DB.prepare(
    "SELECT created_by FROM clones WHERE id = ?"
  )
    .bind(v_389afb)
    .first();

  if (!v_eb25ce) return v_3f4e2e.json({ error: "Clone not found" }, 404);
  if (v_eb25ce.created_by !== v_43e90c)
    return v_3f4e2e.json({ error: "Forbidden" }, 403);

  await v_3f4e2e.env.DB.prepare(
    "UPDATE clones SET name = ?, description = ?, category = ?, visibility = ?, avatar_url = ?, cover_image_url = ? WHERE id = ?"
  )
    .bind(
      v_4d33b2.name, v_4d33b2.description, v_4d33b2.category,
      v_4d33b2.visibility, v_4d33b2.avatar_url, v_4d33b2.cover_image_url, v_389afb
    )
    .run();

  return v_3f4e2e.json({ success: true });
});

v_f891e6.delete("/:id", async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.req.header("X-User-Id");
  if (!v_43e90c) return v_3f4e2e.json({ error: "Unauthorized" }, 401);

  const v_389afb = v_3f4e2e.req.param("id");
  const v_eb25ce = await v_3f4e2e.env.DB.prepare(
    "SELECT created_by FROM clones WHERE id = ?"
  )
    .bind(v_389afb)
    .first();

  if (!v_eb25ce) return v_3f4e2e.json({ error: "Clone not found" }, 404);
  if (v_eb25ce.created_by !== v_43e90c)
    return v_3f4e2e.json({ error: "Forbidden" }, 403);

  await v_3f4e2e.env.DB.prepare("DELETE FROM clones WHERE id = ?").bind(v_389afb).run();
  return v_3f4e2e.json({ success: true });
});
