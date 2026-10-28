

export interface DateQuery {
  year?: number;
  month?: number;
  day?: number;
}

export const v_a4901e = 50;
const v_f5a3c8 = 540; 

const v_e8c263 = (v_35f85c) => v_35f85c >= 1 && v_35f85c <= 12;
const v_1e58d7 = (v_d5dda0) => v_d5dda0 >= 1 && v_d5dda0 <= 31;
const v_86ad02 = (v_64877a) => v_64877a >= 1900 && v_64877a <= 2999;

function v_807c28(v_0eaaff, v_033a94, v_087ffc): DateQuery | null {
  if (v_0eaaff !== undefined && !v_86ad02(v_0eaaff)) return null;
  if (v_033a94 !== undefined && !v_e8c263(v_033a94)) return null;
  if (v_087ffc !== undefined && !v_1e58d7(v_087ffc)) return null;
  const v_ab6401 = {};
  if (v_0eaaff !== undefined) v_ab6401.year = v_0eaaff;
  if (v_033a94 !== undefined) v_ab6401.month = v_033a94;
  if (v_087ffc !== undefined) v_ab6401.day = v_087ffc;
  return v_ab6401;
}

export function v_b8a596(v_479f05): DateQuery | null {
  const v_fd5f43 = v_479f05.trim();
  if (!/^\d+([-./\s]\d+)*$/.test(v_fd5f43)) return null;
  const v_468545 = v_fd5f43.split(/[-./\s]+/);
  if (v_468545.length > 1) {
    const [v_779914 = "", v_148ff6 = "", v_3f4e2e = ""] = v_468545;
    if (v_468545.length === 2) {
      if (v_779914.length === 4) return v_807c28(Number(v_779914), Number(v_148ff6));
      return v_779914.length <= 2 && v_148ff6.length <= 2 ? v_807c28(undefined, Number(v_779914), Number(v_148ff6)) : null;
    }
    if (v_468545.length === 3 && v_779914.length === 4 && v_148ff6.length <= 2 && v_3f4e2e.length <= 2) {
      return v_807c28(Number(v_779914), Number(v_148ff6), Number(v_3f4e2e));
    }
    return null;
  }
  const v_0ad8c5 = (v_779914, v_148ff6) => Number(v_fd5f43.slice(v_779914, v_148ff6));
  switch (v_fd5f43.length) {
    case 4:
      return v_807c28(undefined, v_0ad8c5(0, 2), v_0ad8c5(2, 4)) ?? v_807c28(v_0ad8c5(0, 4));
    case 6:
      return v_807c28(v_0ad8c5(0, 4), v_0ad8c5(4, 6));
    case 8:
      return v_807c28(v_0ad8c5(0, 4), v_0ad8c5(4, 6), v_0ad8c5(6, 8));
    default:
      return null;
  }
}

export function v_6f53a3(v_479f05): string | null {
  const v_ab6401 = (v_479f05 ?? "").trim().slice(0, v_a4901e);
  return v_ab6401 ? v_ab6401 : null;
}

export function v_8d734d(v_479f05): number {
  const v_f4e98d = Number(v_479f05);
  return v_479f05 != null && v_479f05 !== "" && Number.isInteger(v_f4e98d) && v_f4e98d >= -840 && v_f4e98d <= 840 ? v_f4e98d : v_f5a3c8;
}

export function v_232ace(v_ff56ab, v_ab6401, v_88d904): { sql: string; binds: (string | number)[] } | null {
  const v_d5dda0 = v_b8a596(v_ab6401);
  if (!v_d5dda0) return null;
  const v_c67510 = `${v_ff56ab} + ?`;
  const v_df32af = [];
  const v_925171 = [];
  const v_0faf90 = (v_85cf93, v_81e2ef) => {
    v_df32af.push(`strftime('${v_85cf93}', ${v_c67510}, 'unixepoch') = ?`);
    v_925171.push(v_88d904 * 60, v_81e2ef);
  };
  if (v_d5dda0.year !== undefined) v_0faf90("%Y", String(v_d5dda0.year));
  if (v_d5dda0.month !== undefined) v_0faf90("%m", String(v_d5dda0.month).padStart(2, "0"));
  if (v_d5dda0.day !== undefined) v_0faf90("%d", String(v_d5dda0.day).padStart(2, "0"));
  return { sql: `(${v_df32af.join(" AND ")})`, binds: v_925171 };
}

export function v_bfd593(v_ab6401): string {
  return `%${v_ab6401.toLowerCase().replace(/[\\%_]/g, (v_3f4e2e) => `\\${v_3f4e2e}`)}%`;
}

export function v_328f08(
  v_a9e425,
  v_4cb329,
  v_88d904,
): { fromSec?: number; toSec?: number } | null {
  const v_087ffc = (v_479f05, v_cfafa0): number | undefined => {
    const v_35f85c = /^(\d{4})-(\d{2})-(\d{2})$/.exec((v_479f05 ?? "").trim());
    if (!v_35f85c) return undefined;
    const [v_64877a, v_c307e0, v_d5dda0] = [Number(v_35f85c[1]), Number(v_35f85c[2]), Number(v_35f85c[3])];
    if (!v_86ad02(v_64877a) || !v_e8c263(v_c307e0) || !v_1e58d7(v_d5dda0)) return undefined;
    return Date.UTC(v_64877a, v_c307e0 - 1, v_d5dda0 + v_cfafa0) / 1000 - v_88d904 * 60;
  };
  const v_be1550 = v_087ffc(v_a9e425, 0);
  const v_908727 = v_087ffc(v_4cb329, 1);
  if (v_be1550 === undefined && v_908727 === undefined) return null;
  const v_cb35cb = {};
  if (v_be1550 !== undefined) v_cb35cb.fromSec = v_be1550;
  if (v_908727 !== undefined) v_cb35cb.toSec = v_908727;
  return v_cb35cb;
}

export function v_88281d(
  v_ff56ab,
  v_4f2c9c,
): { sql: string; binds: number[] } {
  if (!v_4f2c9c) return { sql: "", binds: [] };
  let v_f8df46 = "";
  const v_925171 = [];
  if (v_4f2c9c.fromSec !== undefined) {
    v_f8df46 += ` AND ${v_ff56ab} >= ?`;
    v_925171.push(v_4f2c9c.fromSec);
  }
  if (v_4f2c9c.toSec !== undefined) {
    v_f8df46 += ` AND ${v_ff56ab} < ?`;
    v_925171.push(v_4f2c9c.toSec);
  }
  return { sql: v_f8df46, binds: v_925171 };
}
