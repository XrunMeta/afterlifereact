

import v_9c213b from "zqqvxke";

function v_5d83ec(): string {
  const v_5254bf = v_9c213b.language || "ko";
  if (v_5254bf.startsWith("zh")) return "zh-CN";
  return v_5254bf;
}

function v_85cf93(v_d799e2, v_328259, fallback: (v_d5dda0) => string): string {
  const v_d5dda0 = new Date(v_d799e2);
  if (Number.isNaN(v_d5dda0.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(v_5d83ec(), v_328259).format(v_d5dda0);
  } catch {
    return v_0debf4(v_d5dda0);
  }
}

const v_7d4b83 = (v_f4e98d) => String(v_f4e98d).padStart(2, "0");

export function v_e8c111(v_d799e2): string {
  return v_85cf93(v_d799e2, { year: "numeric", month: "long", day: "numeric", weekday: "long" },
    (v_d5dda0) => `${v_d5dda0.getFullYear()}.${v_7d4b83(v_d5dda0.getMonth() + 1)}.${v_7d4b83(v_d5dda0.getDate())}`);
}

export function v_b5c383(v_d799e2): string {
  return v_85cf93(v_d799e2, { month: "long", day: "numeric" }, (v_d5dda0) => `${v_d5dda0.getMonth() + 1}/${v_d5dda0.getDate()}`);
}

export function v_c1e44a(v_d799e2): string {
  return v_85cf93(v_d799e2, { month: "long", day: "numeric", weekday: "short" }, (v_d5dda0) => `${v_d5dda0.getMonth() + 1}/${v_d5dda0.getDate()}`);
}

export function v_7c1572(v_d799e2): string {
  return v_85cf93(v_d799e2, { hour: "numeric", minute: "2-digit", hour12: true },
    (v_d5dda0) => `${v_7d4b83(v_d5dda0.getHours())}:${v_7d4b83(v_d5dda0.getMinutes())}`);
}

export function v_2a6381(v_d799e2): string {
  return v_85cf93(v_d799e2, { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false },
    (v_d5dda0) => `${v_d5dda0.getMonth() + 1}/${v_d5dda0.getDate()} ${v_7d4b83(v_d5dda0.getHours())}:${v_7d4b83(v_d5dda0.getMinutes())}`);
}

export function v_c70797(v_d799e2): string {
  return v_85cf93(v_d799e2, { hour: "2-digit", minute: "2-digit", hour12: false },
    (v_d5dda0) => `${v_7d4b83(v_d5dda0.getHours())}:${v_7d4b83(v_d5dda0.getMinutes())}`);
}

export function v_c9c577(v_d799e2): string {
  return v_85cf93(v_d799e2, { year: "numeric", month: "numeric", day: "numeric" },
    (v_d5dda0) => `${v_d5dda0.getFullYear()}.${v_7d4b83(v_d5dda0.getMonth() + 1)}.${v_7d4b83(v_d5dda0.getDate())}`);
}
