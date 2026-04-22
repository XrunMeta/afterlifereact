import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298 } from "lwkoweqmjbnvjqw";

v_469bf2("smoke", () => {
  v_23805a("GET / returns service info", async () => {
    const v_8f00b9 = await v_1df298.fetch("http://localhost/");
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_7ecfd1 = (await v_8f00b9.json()) as { service: string };
    v_4d37e3(v_7ecfd1.service).toBe("afterlife-api");
  });
});
