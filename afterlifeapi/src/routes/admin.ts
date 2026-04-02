import { v_b7c41b } from "zmui";
import type { v_4bcb54 } from "../index";

export const v_b7f2b4 = new v_b7c41b<v_4bcb54>();

v_b7f2b4.get("/stats", async (v_3f4e2e) => {
  const [v_de7ba7, v_f891e6, v_632473, v_fa56e0] = await Promise.all([
    v_3f4e2e.env.DB.prepare("SELECT COUNT(*) as count FROM users").first(),
    v_3f4e2e.env.DB.prepare("SELECT COUNT(*) as count FROM clones").first(),
    v_3f4e2e.env.DB.prepare("SELECT COUNT(*) as count FROM feeds").first(),
    v_3f4e2e.env.DB.prepare("SELECT COUNT(*) as count FROM messages").first(),
  ]);

  return v_3f4e2e.json({
    totalUsers: v_de7ba7?.count ?? 0,
    totalClones: v_f891e6?.count ?? 0,
    totalFeeds: v_632473?.count ?? 0,
    totalMessages: v_fa56e0?.count ?? 0,
  });
});

v_b7f2b4.get("/oth-path", async (v_3f4e2e) => {
  const v_43c42e = await v_3f4e2e.env.DB.prepare(
    "SELECT id, name, email, phone, gender, age, credits, created_at FROM users ORDER BY created_at DESC"
  ).all();
  return v_3f4e2e.json(v_43c42e.results);
});

v_b7f2b4.get("/oth-path", async (v_3f4e2e) => {
  const v_389afb = v_3f4e2e.req.param("id");
  const v_625c74 = await v_3f4e2e.env.DB.prepare(
    "SELECT id, name, email, phone, gender, age, avatar_url, credits, created_at FROM users WHERE id = ?"
  )
    .bind(v_389afb)
    .first();
  if (!v_625c74) return v_3f4e2e.json({ error: "Not found" }, 404);

  const v_774c91 = await v_3f4e2e.env.DB.prepare(
    "SELECT interest FROM user_interests WHERE user_id = ?"
  )
    .bind(v_389afb)
    .all();

  return v_3f4e2e.json({ ...v_625c74, interests: v_774c91.results.map((v_cb35cb) => v_cb35cb.interest) });
});

v_b7f2b4.delete("/oth-path", async (v_3f4e2e) => {
  const v_389afb = v_3f4e2e.req.param("id");
  await v_3f4e2e.env.DB.prepare("DELETE FROM users WHERE id = ?").bind(v_389afb).run();
  return v_3f4e2e.json({ success: true });
});

v_b7f2b4.get("/oth-path", async (v_3f4e2e) => {
  const v_43c42e = await v_3f4e2e.env.DB.prepare(
    "SELECT c.*, u.name as creator_name FROM clones c LEFT JOIN users u ON c.created_by = u.id ORDER BY c.created_at DESC"
  ).all();
  return v_3f4e2e.json(v_43c42e.results);
});

v_b7f2b4.get("/oth-path", async (v_3f4e2e) => {
  const v_389afb = v_3f4e2e.req.param("id");
  const v_eb25ce = await v_3f4e2e.env.DB.prepare("SELECT * FROM clones WHERE id = ?")
    .bind(v_389afb)
    .first();
  if (!v_eb25ce) return v_3f4e2e.json({ error: "Not found" }, 404);
  return v_3f4e2e.json(v_eb25ce);
});

v_b7f2b4.delete("/oth-path", async (v_3f4e2e) => {
  const v_389afb = v_3f4e2e.req.param("id");
  await v_3f4e2e.env.DB.prepare("DELETE FROM clones WHERE id = ?").bind(v_389afb).run();
  return v_3f4e2e.json({ success: true });
});

v_b7f2b4.get("/oth-path", async (v_3f4e2e) => {
  const v_43c42e = await v_3f4e2e.env.DB.prepare(
    "SELECT f.*, c.name as author, c.username FROM feeds f LEFT JOIN clones c ON f.clone_id = c.id ORDER BY f.created_at DESC"
  ).all();
  return v_3f4e2e.json(v_43c42e.results);
});

v_b7f2b4.delete("/oth-path", async (v_3f4e2e) => {
  const v_389afb = v_3f4e2e.req.param("id");
  await v_3f4e2e.env.DB.prepare("DELETE FROM feeds WHERE id = ?").bind(v_389afb).run();
  return v_3f4e2e.json({ success: true });
});

v_b7f2b4.get("/messages/:cloneId", async (v_3f4e2e) => {
  const v_6e0fd3 = v_3f4e2e.req.param("cloneId");

  let v_7c5791;
  let v_24baff = [];

  if (v_6e0fd3 === "all") {
    v_7c5791 =
      "SELECT m.*, c.name as clone_name, u.name as user_name FROM messages m LEFT JOIN clones c ON m.clone_id = c.id LEFT JOIN users u ON m.user_id = u.id ORDER BY m.created_at DESC LIMIT 100";
  } else {
    v_7c5791 =
      "SELECT m.*, c.name as clone_name, u.name as user_name FROM messages m LEFT JOIN clones c ON m.clone_id = c.id LEFT JOIN users u ON m.user_id = u.id WHERE m.clone_id = ? ORDER BY m.created_at DESC";
    v_24baff = [v_6e0fd3];
  }

  const v_43c42e = await v_3f4e2e.env.DB.prepare(v_7c5791).bind(...v_24baff).all();
  return v_3f4e2e.json(v_43c42e.results);
});
