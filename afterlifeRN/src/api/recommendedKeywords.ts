

import { API_BASE } from "../config/apiBase";

export interface RecommendedKeyword {
  id: number;
  keyword: string;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export async function listRecommendedKeywords(): Promise<RecommendedKeyword[]> {
  const res = await fetch(`${API_BASE}/oth-path`);
  if (!res.ok) throw new Error(`fetch recommended keywords failed: ${res.status}`);
  const j = (await res.json()) as { items?: RecommendedKeyword[] };
  return j.items ?? [];
}
