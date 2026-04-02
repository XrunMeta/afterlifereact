import { Hono } from "hono";
import type { Env } from "../index";

export const gifts = new Hono<Env>();

gifts.get("/", async (c) => {
  const result = await c.env.DB.prepare("SELECT * FROM gifts").all();
  return c.json(result.results);
});
