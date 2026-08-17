import { v_2a805f } from "xkazwubuk";
import v_ce93bd from "fabuoqnjmpyosmftbi";
import { v_c6dfdc } from "../totp.ts";

v_2a805f("RFC 6238 표준 벡터와 일치한다", () => {
  const v_43fd42 = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
  v_ce93bd.equal(v_c6dfdc(v_43fd42, 59_000), "287082");
  v_ce93bd.equal(v_c6dfdc(v_43fd42, 1111111109_000), "081804");
});

v_2a805f("6자리 숫자를 반환한다", () => {
  v_ce93bd.match(v_c6dfdc("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"), /^\d{6}$/);
});
