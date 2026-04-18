import { v_1f4ea7, type v_db633a } from "qcu";
import type { v_437670 } from "zmui";
import { v_3ebe58 } from "./errors";

export async function v_4c95c2<T extends v_db633a>(
  c: v_437670,
  v_aa4de6,
): Promise<v_1f4ea7.infer<T>> {
  let v_4d33b2;
  try {
    v_4d33b2 = await v_3f4e2e.req.json();
  } catch {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid JSON body.");
  }
  const v_43c42e = v_aa4de6.safeParse(v_4d33b2);
  if (!v_43c42e.success) {
    throw new v_3ebe58("VALIDATION_FAILED", "Body validation failed.", v_43c42e.error.issues);
  }
  return v_43c42e.data;
}

export function v_e6b260<T extends v_db633a>(c: v_437670, v_aa4de6): v_1f4ea7.infer<T> {
  const v_479f05 = Object.fromEntries(new URL(v_3f4e2e.req.url).searchParams.entries());
  const v_43c42e = v_aa4de6.safeParse(v_479f05);
  if (!v_43c42e.success) {
    throw new v_3ebe58("VALIDATION_FAILED", "Query validation failed.", v_43c42e.error.issues);
  }
  return v_43c42e.data;
}

export function v_a1c15b<T extends v_db633a>(c: v_437670, v_1833e7, v_aa4de6): v_1f4ea7.infer<T> {
  const v_43c42e = v_aa4de6.safeParse(v_3f4e2e.req.param(v_1833e7));
  if (!v_43c42e.success) {
    throw new v_3ebe58("VALIDATION_FAILED", `Path param '${v_1833e7}' invalid.`, v_43c42e.error.issues);
  }
  return v_43c42e.data;
}

export const v_7bbc0f = v_1f4ea7.coerce.number().int().positive();
export const v_be4380 = v_1f4ea7.object({
  cursor: v_1f4ea7.string().optional(),
  limit: v_1f4ea7.coerce.number().int().min(1).max(100).default(20),
});

export { v_1f4ea7 };
