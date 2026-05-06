

export function v_bfd883(v_6fc191): string {
  try {
    const v_d799e2 = new Date(v_6fc191.replace(" ", "T") + (v_6fc191.includes("T") || v_6fc191.endsWith("Z") ? "" : "Z")).getTime();
    if (Number.isNaN(v_d799e2)) return "";
    const v_a41a1b = Date.now() - v_d799e2;
    if (v_a41a1b < 30_000) return "방금";
    const v_43e24b = Math.floor(v_a41a1b / 60_000);
    if (v_43e24b < 60) return `${v_43e24b}분 전`;
    const v_1c3551 = Math.floor(v_43e24b / 60);
    if (v_1c3551 < 24) return `${v_1c3551}시간 전`;
    const v_d5dda0 = Math.floor(v_1c3551 / 24);
    if (v_d5dda0 < 7) return `${v_d5dda0}일 전`;
    if (v_d5dda0 < 30) return `${Math.floor(v_d5dda0 / 7)}주 전`;
    return new Date(v_d799e2).toLocaleDateString();
  } catch {
    return "";
  }
}
