import { z, type ZodType } from "zod";
import type { Context } from "hono";
import { APIError } from "./errors";

export async function parseJson<T extends ZodType>(
  c: Context,
  schema: T,
): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new APIError("VALIDATION_FAILED", "Invalid JSON body.");
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new APIError("VALIDATION_FAILED", "Body validation failed.", result.error.issues);
  }
  return result.data;
}

export function parseQuery<T extends ZodType>(c: Context, schema: T): z.infer<T> {
  const raw = Object.fromEntries(new URL(c.req.url).searchParams.entries());
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new APIError("VALIDATION_FAILED", "Query validation failed.", result.error.issues);
  }
  return result.data;
}

export function parseParam<T extends ZodType>(c: Context, name: string, schema: T): z.infer<T> {
  const result = schema.safeParse(c.req.param(name));
  if (!result.success) {
    throw new APIError("VALIDATION_FAILED", `Path param '${name}' invalid.`, result.error.issues);
  }
  return result.data;
}

export const idParam = z.coerce.number().int().positive();
export const pageQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export { z };
