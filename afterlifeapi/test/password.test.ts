import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_54846c, v_1000e8, v_96aa7f } from "../src/lib/password";

v_469bf2("password hashing", () => {
  v_23805a("hashPassword 는 정책 위반을 거절한다", async () => {
    await v_4d37e3(v_54846c("abc12345")).rejects.toThrow(/7\+ chars/);
  });

  v_23805a("hashPasswordUnchecked 는 정책과 무관하게 해시하고 검증된다", async () => {
    const v_43fd42 = crypto.randomUUID() + crypto.randomUUID(); 
    const v_65a2cd = await v_1000e8(v_43fd42);
    v_4d37e3(await v_96aa7f(v_43fd42, v_65a2cd)).toBe(true);
    const v_3fa1da = await v_1000e8("oldxrun1"); 
    v_4d37e3(await v_96aa7f("oldxrun1", v_3fa1da)).toBe(true);
  });
});
