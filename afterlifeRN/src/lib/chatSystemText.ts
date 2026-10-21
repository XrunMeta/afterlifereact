

import type { v_75de9d } from "zqqvxke";

function v_33a486(v_1833e7): string {
  const v_10a17d = v_1833e7.charCodeAt(v_1833e7.length - 1);
  if (v_10a17d >= 0xac00 && v_10a17d <= 0xd7a3) {
    return `${v_1833e7}${(v_10a17d - 0xac00) % 28 === 0 ? "와" : "과"}`;
  }
  return `${v_1833e7}와`;
}

export function v_c64cf7(
  v_94302c,
  v_9390e8,
  v_f2ff36,
  t: v_75de9d,
  v_5254bf,
): string | null {
  if (v_94302c === "intimacy_milestone" && typeof v_9390e8?.score === "number") {
    const v_c99bd2 = (v_5254bf ?? "").toLowerCase();
    const v_1833e7 = v_c99bd2.startsWith("ko") ? v_33a486(v_f2ff36) : v_f2ff36;
    return v_8d41d7("chat.intimacyMilestone", {
      defaultValue: "{{name}}의 온도가 {{score}}°C가 됐어요",
      name: v_1833e7,
      score: v_9390e8.score,
    });
  }
  return null;
}
