import type { v_fbaea4 } from "zmui";
import { v_3ebe58 } from "../lib/errors";
import type { v_de0a25 } from "../lib/env";

export const onError: v_fbaea4<v_de0a25> = (v_49263d, v_3f4e2e) => {
  if (v_49263d instanceof v_3ebe58) {
    return v_3f4e2e.json(v_49263d.toJSON(), v_49263d.status as never);
  }
  console.error("[unhandled]", v_49263d);
  return v_3f4e2e.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "예기치 못한 서버 오류가 발생했어요. 잠시 후 다시 시도해주세요.",
        requestId: v_3f4e2e.get("requestId"),
      },
    },
    500,
  );
};

export async function v_ca800d(v_3f4e2e, v_a448ad) {
  const v_389afb = v_3f4e2e.req.header("X-Request-Id") ?? crypto.randomUUID();
  v_3f4e2e.set("requestId", v_389afb);
  await v_a448ad();
}
