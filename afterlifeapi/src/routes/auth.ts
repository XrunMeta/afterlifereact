import { Hono } from "hono";
import type { Env } from "../index";
import { logActivity } from "../lib/logger";

export const auth = new Hono<Env>();

auth.post("/signup", async (c) => {
  const body = await c.req.json();
  const { name, email, password, phone, gender, age, interests } = body;

  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);

  await c.env.DB.prepare(
    "INSERT INTO users (id, name, email, password_hash, phone, gender, age) VALUES (?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(id, name, email, passwordHash, phone, gender, age)
    .run();

  if (interests?.length) {
    const stmt = c.env.DB.prepare(
      "INSERT INTO user_interests (user_id, interest) VALUES (?, ?)"
    );
    await c.env.DB.batch(interests.map((i: string) => stmt.bind(id, i)));
  }

  await logActivity(c, { userId: id, action: "signup" });

  return c.json({ id, name, email });
});

auth.post("/login", async (c) => {
  const { email, password } = await c.req.json();

  const user = await c.env.DB.prepare("SELECT * FROM users WHERE email = ?")
    .bind(email)
    .first();

  if (!user || !(await verifyPassword(password, user.password_hash as string))) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  await logActivity(c, { userId: user.id as string, action: "login" });

  return c.json({ id: user.id, name: user.name, email: user.email });
});

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    key,
    256
  );
  const saltHex = [...salt].map((b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${saltHex}:${hashHex}`;
}

async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [saltHex, storedHash] = stored.split(":");
  const salt = new Uint8Array(
    saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16))
  );
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    key,
    256
  );
  const hashHex = [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex === storedHash;
}
