

import v_9c213b from "zqqvxke";
import { v_c9c577 } from "./localeDate";

export function v_bfd883(v_6fc191): string {
  try {
    const v_d799e2 = new Date(v_6fc191.replace(" ", "T") + (v_6fc191.includes("T") || v_6fc191.endsWith("Z") ? "" : "Z")).getTime();
    if (Number.isNaN(v_d799e2)) return "";
    const v_a41a1b = Date.now() - v_d799e2;
    if (v_a41a1b < 30_000) return v_9c213b.t("common.now", { defaultValue: "방금" });
    const v_43e24b = Math.floor(v_a41a1b / 60_000);
    if (v_43e24b < 60) return v_9c213b.t("common.agoMinutes", { n: v_43e24b, defaultValue: "{{n}}분 전" });
    const v_1c3551 = Math.floor(v_43e24b / 60);
    if (v_1c3551 < 24) return v_9c213b.t("common.agoHours", { n: v_1c3551, defaultValue: "{{n}}시간 전" });
    const v_d5dda0 = Math.floor(v_1c3551 / 24);
    if (v_d5dda0 < 7) return v_9c213b.t("common.agoDays", { n: v_d5dda0, defaultValue: "{{n}}일 전" });
    if (v_d5dda0 < 30) return v_9c213b.t("common.agoWeeks", { n: Math.floor(v_d5dda0 / 7), defaultValue: "{{n}}주 전" });
    return v_c9c577(v_d799e2);
  } catch {
    return "";
  }
}
