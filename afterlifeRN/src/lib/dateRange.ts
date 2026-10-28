

export interface DateRange {
  from: string;
  to: string;
}

export type RangePreset = "today" | "last7" | "thisMonth" | "lastMonth";
export const v_be28b6 = ["today", "last7", "thisMonth", "lastMonth"];

const v_3ee5fb = (v_f4e98d) => String(v_f4e98d).padStart(2, "0");

export function v_b3d1d6(v_d5dda0): string {
  return `${v_d5dda0.getFullYear()}-${v_3ee5fb(v_d5dda0.getMonth() + 1)}-${v_3ee5fb(v_d5dda0.getDate())}`;
}

export function v_845110(v_fd5f43): Date {
  const [v_64877a = 0, v_35f85c = 1, v_d5dda0 = 1] = v_fd5f43.split("-").map(Number);
  return new Date(v_64877a, v_35f85c - 1, v_d5dda0);
}

export function v_280133(v_e2a85c, v_5c2f9f = new Date()): DateRange {
  const v_64877a = v_5c2f9f.getFullYear();
  const v_35f85c = v_5c2f9f.getMonth();
  switch (v_e2a85c) {
    case "today":
      return { from: v_b3d1d6(v_5c2f9f), to: v_b3d1d6(v_5c2f9f) };
    case "last7":
      return { from: v_b3d1d6(new Date(v_64877a, v_35f85c, v_5c2f9f.getDate() - 6)), to: v_b3d1d6(v_5c2f9f) };
    case "thisMonth":
      return { from: v_b3d1d6(new Date(v_64877a, v_35f85c, 1)), to: v_b3d1d6(new Date(v_64877a, v_35f85c + 1, 0)) };
    case "lastMonth":
      return { from: v_b3d1d6(new Date(v_64877a, v_35f85c - 1, 1)), to: v_b3d1d6(new Date(v_64877a, v_35f85c, 0)) };
  }
}

export function v_cae033(v_f04727, v_087ffc): { from: string; to: string | null } {
  if (!v_f04727.from || v_f04727.to) return { from: v_087ffc, to: null };
  if (v_087ffc < v_f04727.from) return { from: v_087ffc, to: null };
  return { from: v_f04727.from, to: v_087ffc };
}

export function v_c3f0be(v_0eaaff, v_0ad137): (string | null)[][] {
  const v_ea719c = new Date(v_0eaaff, v_0ad137, 1).getDay();
  const v_6a53fd = new Date(v_0eaaff, v_0ad137 + 1, 0).getDate();
  const v_2c59b3 = Array(v_ea719c).fill(null);
  for (let v_d5dda0 = 1; v_d5dda0 <= v_6a53fd; v_d5dda0++) v_2c59b3.push(v_b3d1d6(new Date(v_0eaaff, v_0ad137, v_d5dda0)));
  while (v_2c59b3.length % 7) v_2c59b3.push(null);
  const v_18b8bf = [];
  for (let v_ebec57 = 0; v_ebec57 < v_2c59b3.length; v_ebec57 += 7) v_18b8bf.push(v_2c59b3.slice(v_ebec57, v_ebec57 + 7));
  return v_18b8bf;
}

export function v_669b27(v_cb35cb, v_5c2f9f = new Date()): string {
  const v_0eaaff = String(v_5c2f9f.getFullYear());
  const v_8b5cd8 = (v_fd5f43) => {
    const [v_64877a, v_35f85c, v_d5dda0] = v_fd5f43.split("-");
    return v_64877a === v_0eaaff ? `${v_35f85c}.${v_d5dda0}` : `${v_64877a}.${v_35f85c}.${v_d5dda0}`;
  };
  return v_cb35cb.from === v_cb35cb.to ? v_8b5cd8(v_cb35cb.from) : `${v_8b5cd8(v_cb35cb.from)} ~ ${v_8b5cd8(v_cb35cb.to)}`;
}
