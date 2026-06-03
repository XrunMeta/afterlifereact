

import { v_b2eae5 } from "../src/lib/jwt";

const v_43fd42 = process.env.JWT_ACCESS_SECRET;
const v_1ae212 = Number(process.env.DEV_USER_ID ?? "1");
const v_aaa6bf = Number(process.env.DEV_TOKEN_TTL ?? String(60 * 60 * 24 * 7)); 

if (!v_43fd42) {
  console.error("JWT_ACCESS_SECRET required");
  process.exit(1);
}
if (!Number.isInteger(v_1ae212) || v_1ae212 <= 0) {
  console.error("DEV_USER_ID must be positive int");
  process.exit(1);
}

async function v_10bff5(): Promise<void> {
  const v_21cc31 = await v_b2eae5({ sub: v_1ae212, kind: "access" }, v_43fd42 as string, v_aaa6bf);
  console.log(v_21cc31);
}
void v_10bff5();
