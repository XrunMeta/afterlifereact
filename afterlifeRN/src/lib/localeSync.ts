

import v_e84827 from "bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv";
import v_9c213b from "../i18n";
import { v_1ed7d9 } from "../stores/authStore";
import { v_04b58a } from "./authFetch";

const v_f165be = "@afterlifeRN/locale/lastSent";

let v_d7fc78 = null;
let v_c9f274 = false;

export async function v_7a4365(): Promise<void> {
  try {
    const { accessToken: v_2ca7e0, apiUser: v_b113dd } = v_1ed7d9.getState();
    const v_5254bf = v_9c213b.language;
    if (!v_2ca7e0 || !v_b113dd?.id || !v_5254bf) return;
    const v_5e3dbb = `${v_b113dd.id}:${v_5254bf}`;
    if (v_d7fc78 === v_5e3dbb) return;
    const v_506e86 = await v_e84827.getItem(v_f165be).catch(() => null);
    if (v_506e86 === v_5e3dbb) return;
    v_d7fc78 = v_5e3dbb;
    await v_04b58a("/oth-path", v_2ca7e0, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: v_5254bf }),
    });
    await v_e84827.setItem(v_f165be, v_5e3dbb).catch(() => {});
  } catch (v_49263d) {
    console.warn("[localeSync] failed:", (v_49263d as Error)?.message ?? v_49263d);
  } finally {
    v_d7fc78 = null;
  }
}

export function v_4d2e36(): void {
  if (v_c9f274) return;
  v_c9f274 = true;
  let v_995e27 = v_1ed7d9.getState().accessToken;
  let v_d096c6 = v_1ed7d9.getState().apiUser?.id ?? null;
  v_1ed7d9.subscribe((v_fd5f43) => {
    const v_43e90c = v_fd5f43.apiUser?.id ?? null;
    if ((v_fd5f43.accessToken && !v_995e27) || (v_43e90c && v_43e90c !== v_d096c6)) void v_7a4365();
    v_995e27 = v_fd5f43.accessToken;
    v_d096c6 = v_43e90c;
  });
  v_9c213b.on("languageChanged", () => {
    void v_7a4365();
  });
  void v_7a4365();
}
