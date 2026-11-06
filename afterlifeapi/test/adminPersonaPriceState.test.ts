import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_c9c489, v_5069a9 } from "lwkoweqmjbnvjqw";
import v_cfaf0e from "../src/index";

function v_38715b(v_eb0090): Promise<Response> {
  const v_309144 = new Request("http://localhost/oth-path", {
    headers: { Origin: "https://console2.example.invalid" },
  });
  return v_cfaf0e.fetch(v_309144, { ...v_c9c489, ENVIRONMENT: "development", ...v_eb0090 } as never, v_5069a9());
}

v_469bf2("GET /oth-path", () => {
  v_23805a("결제 우회가 켜져 있으면 paymentBypass true", async () => {
    const v_8f00b9 = await v_38715b({ CLONE_PAYMENT_BYPASS: "1" });
    v_4d37e3(v_8f00b9.status).toBe(200);
    v_4d37e3(await v_8f00b9.json()).toMatchObject({ paymentBypass: true });
  });

  v_23805a("꺼져 있으면 false, 가격은 숫자", async () => {
    const v_8f00b9 = await v_38715b({ CLONE_PAYMENT_BYPASS: "" });
    const v_4d33b2 = (await v_8f00b9.json()) as { priceXrun: unknown; paymentBypass: unknown };
    v_4d37e3(v_4d33b2.paymentBypass).toBe(false);
    v_4d37e3(typeof v_4d33b2.priceXrun).toBe("number");
  });
});
