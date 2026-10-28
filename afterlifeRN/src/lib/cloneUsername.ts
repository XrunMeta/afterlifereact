import { v_6cba83 } from "./romanizeHangul";

export const v_0bee38 = 4;
const v_87edf7 = 30;
const v_0b4946 = "clone";

export function v_86ee62(v_1833e7, v_f43ec7 = Math.random): string {
  const v_694b25 =
    v_6cba83(v_1833e7)
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "") || v_0b4946;
  const v_f4e98d = Math.floor(v_f43ec7() * 10 ** v_0bee38);
  const v_ae8e76 = String(v_f4e98d).padStart(v_0bee38, "0");
  const v_2f361a = v_694b25.slice(0, v_87edf7 - 1 - v_0bee38).replace(/_$/, "");
  return `${v_2f361a}_${v_ae8e76}`;
}
