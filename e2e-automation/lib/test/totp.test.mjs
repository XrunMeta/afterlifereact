import { test } from "node:test";
import assert from "node:assert/strict";
import { totpCode } from "../totp.ts";

test("RFC 6238 표준 벡터와 일치한다", () => {
  const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
  assert.equal(totpCode(secret, 59_000), "287082");
  assert.equal(totpCode(secret, 1111111109_000), "081804");
});

test("6자리 숫자를 반환한다", () => {
  assert.match(totpCode("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"), /^\d{6}$/);
});
