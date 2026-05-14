import type { ErrorHandler } from "hono";
import { APIError } from "../lib/errors";
import type { AppEnv } from "../lib/env";

export const onError: ErrorHandler<AppEnv> = (err, c) => {
  if (err instanceof APIError) {
    return c.json(err.toJSON(), err.status as never);
  }
  console.error("[unhandled]", err);
  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "예기치 못한 서버 오류가 발생했어요. 잠시 후 다시 시도해주세요.",
        requestId: c.get("requestId"),
      },
    },
    500,
  );
};

export async function requestId(c: { set: (k: string, v: string) => void; req: { header: (n: string) => string | undefined } }, next: () => Promise<void>) {
  const id = c.req.header("X-Request-Id") ?? crypto.randomUUID();
  c.set("requestId", id);
  await next();
}
