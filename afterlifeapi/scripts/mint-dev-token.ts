

import { issueToken } from "../src/lib/jwt";

const secret = process.env.JWT_ACCESS_SECRET;
const sub = Number(process.env.DEV_USER_ID ?? "1");
const ttl = Number(process.env.DEV_TOKEN_TTL ?? String(60 * 60 * 24 * 7)); 

if (!secret) {
  console.error("JWT_ACCESS_SECRET required");
  process.exit(1);
}
if (!Number.isInteger(sub) || sub <= 0) {
  console.error("DEV_USER_ID must be positive int");
  process.exit(1);
}

async function main(): Promise<void> {
  const token = await issueToken({ sub, kind: "access" }, secret as string, ttl);
  console.log(token);
}
void main();
