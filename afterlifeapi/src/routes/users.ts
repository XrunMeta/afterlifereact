import { v_b7c41b } from "zmui";
import type { v_4bcb54 } from "../index";

export const v_de7ba7 = new v_b7c41b<v_4bcb54>();

v_de7ba7.get("/me", async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.req.header("X-User-Id");
  if (!v_43e90c) return v_3f4e2e.json({ error: "Unauthorized" }, 401);

  const v_625c74 = await v_3f4e2e.env.DB.prepare(
    "SELECT id, name, email, phone, gender, age, avatar_url, credits, created_at FROM users WHERE id = ?"
  )
    .bind(v_43e90c)
    .first();

  if (!v_625c74) return v_3f4e2e.json({ error: "User not found" }, 404);

  const v_774c91 = await v_3f4e2e.env.DB.prepare(
    "SELECT interest FROM user_interests WHERE user_id = ?"
  )
    .bind(v_43e90c)
    .all();

  return v_3f4e2e.json({
    ...v_625c74,
    interests: v_774c91.results.map((v_cb35cb) => v_cb35cb.interest),
  });
});

v_de7ba7.put("/me", async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.req.header("X-User-Id");
  if (!v_43e90c) return v_3f4e2e.json({ error: "Unauthorized" }, 401);

  const v_4d33b2 = await v_3f4e2e.req.json();
  const { name: v_1833e7, phone: v_d74a81, gender: v_c3eac4, age: v_2694bd, avatar_url: v_071302 } = v_4d33b2;

  await v_3f4e2e.env.DB.prepare(
    "UPDATE users SET name = ?, phone = ?, gender = ?, age = ?, avatar_url = ? WHERE id = ?"
  )
    .bind(v_1833e7, v_d74a81, v_c3eac4, v_2694bd, v_071302, v_43e90c)
    .run();

  return v_3f4e2e.json({ success: true });
});
