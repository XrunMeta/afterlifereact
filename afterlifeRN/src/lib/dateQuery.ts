

export interface DateQuery {
  year?: number;
  month?: number;
  day?: number;
}

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

export function v_de971e(v_479f05, v_6467d8): boolean {
  const v_ab6401 = v_b8a596(v_479f05);
  if (!v_ab6401) return false;
  const v_d5dda0 = v_6467d8 instanceof Date ? v_6467d8 : new Date(v_6467d8);
  if (Number.isNaN(v_d5dda0.getTime())) return false;
  if (v_ab6401.year !== undefined && v_d5dda0.getFullYear() !== v_ab6401.year) return false;
  if (v_ab6401.month !== undefined && v_d5dda0.getMonth() + 1 !== v_ab6401.month) return false;
  if (v_ab6401.day !== undefined && v_d5dda0.getDate() !== v_ab6401.day) return false;
  return true;
}
