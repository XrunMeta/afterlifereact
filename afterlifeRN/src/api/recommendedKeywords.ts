

import { v_cc9198 } from "../config/apiBase";

export interface RecommendedKeyword {
  id: number;
  keyword: string;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export async function v_a78ecc(): Promise<RecommendedKeyword[]> {
  const v_8f00b9 = await fetch(`${v_cc9198}/oth-path`);
  if (!v_8f00b9.ok) throw new Error(`fetch recommended keywords failed: ${v_8f00b9.status}`);
  const v_b75e36 = (await v_8f00b9.json()) as { items?: RecommendedKeyword[] };
  return v_b75e36.items ?? [];
}
