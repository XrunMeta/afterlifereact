

import { v_8fd90d } from "lwkoweqmjbnvjqw";

export const v_ae85fc = "https://oth-path-f0013c.example.invalid";

export function v_909e66(v_c99bd2 = "111111") {
  v_8fd90d
    .get(v_ae85fc)
    .intercept({ path: "/oth-path", method: "POST" })
    .reply(200, { status: "success", code: 200, data: { code: v_c99bd2, ttlSec: 600 } });
}

export function v_75de97(v_c99bd2) {
  v_8fd90d
    .get(v_ae85fc)
    .intercept({ path: "/oth-path", method: "POST" })
    .reply((v_328259) => {
      const v_4d33b2 = JSON.parse(String(v_328259.body)) as { code?: string };
      return {
        statusCode: 200,
        data: {
          status: "success",
          code: 200,
          data: v_4d33b2.code === v_c99bd2 ? { verified: true } : { verified: false, reason: "wrong" },
        },
      };
    });
}
