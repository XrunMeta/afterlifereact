import { v_b7c41b } from "zmui";
import type { v_4bcb54 } from "../index";
import { v_74defc } from "../lib/logger";

export const v_68f0aa = new v_b7c41b<v_4bcb54>();

v_68f0aa.post("/signup", async (v_3f4e2e) => {
  const v_4d33b2 = await v_3f4e2e.req.json();
  const { name: v_1833e7, email: v_e0c7e8, password: v_adc076, phone: v_d74a81, gender: v_c3eac4, age: v_2694bd, interests: v_774c91 } = v_4d33b2;

  const v_389afb = crypto.randomUUID();
  const v_df7439 = await v_54846c(v_adc076);

  await v_3f4e2e.env.DB.prepare(
    "INSERT INTO users (id, name, email, password_hash, phone, gender, age) VALUES (?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(v_389afb, v_1833e7, v_e0c7e8, v_df7439, v_d74a81, v_c3eac4, v_2694bd)
    .run();

  if (v_774c91?.length) {
    const v_df04a4 = v_3f4e2e.env.DB.prepare(
      "INSERT INTO user_interests (user_id, interest) VALUES (?, ?)"
    );
    await v_3f4e2e.env.DB.batch(v_774c91.map((v_ebec57) => v_df04a4.bind(v_389afb, v_ebec57)));
  }

  await v_74defc(v_3f4e2e, { userId: v_389afb, action: "signup" });

  return v_3f4e2e.json({ id: v_389afb, name: v_1833e7, email: v_e0c7e8 });
});

v_68f0aa.post("/login", async (v_3f4e2e) => {
  const { email: v_e0c7e8, password: v_adc076 } = await v_3f4e2e.req.json();

  const v_625c74 = await v_3f4e2e.env.DB.prepare("SELECT * FROM users WHERE email = ?")
    .bind(v_e0c7e8)
    .first();

  if (!v_625c74 || !(await v_96aa7f(v_adc076, v_625c74.password_hash as string))) {
    return v_3f4e2e.json({ error: "Invalid credentials" }, 401);
  }

  await v_74defc(v_3f4e2e, { userId: v_625c74.id as string, action: "login" });

  return v_3f4e2e.json({ id: v_625c74.id, name: v_625c74.name, email: v_625c74.email });
});

async function v_54846c(v_adc076): Promise<string> {
  const v_1c4373 = new TextEncoder();
  const v_83f336 = crypto.getRandomValues(new Uint8Array(16));
  const v_b24339 = await crypto.subtle.importKey(
    "raw",
    v_1c4373.encode(v_adc076),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const v_598405 = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: v_83f336, iterations: 100000, hash: "SHA-256" },
    v_b24339,
    256
  );
  const v_2d85bd = [...v_83f336].map((v_148ff6) => v_148ff6.toString(16).padStart(2, "0")).join("");
  const v_a89256 = [...new Uint8Array(v_598405)]
    .map((v_148ff6) => v_148ff6.toString(16).padStart(2, "0"))
    .join("");
  return `${v_2d85bd}:${v_a89256}`;
}

async function v_96aa7f(
  v_adc076,
  v_5885b8
): Promise<boolean> {
  const [v_2d85bd, v_73cba4] = v_5885b8.split(":");
  const v_83f336 = new Uint8Array(
    v_2d85bd.match(/.{2}/g)!.map((v_148ff6) => parseInt(v_148ff6, 16))
  );
  const v_1c4373 = new TextEncoder();
  const v_b24339 = await crypto.subtle.importKey(
    "raw",
    v_1c4373.encode(v_adc076),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const v_598405 = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: v_83f336, iterations: 100000, hash: "SHA-256" },
    v_b24339,
    256
  );
  const v_a89256 = [...new Uint8Array(v_598405)]
    .map((v_148ff6) => v_148ff6.toString(16).padStart(2, "0"))
    .join("");
  return v_a89256 === v_73cba4;
}
