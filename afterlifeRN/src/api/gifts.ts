

import { API_BASE } from "../config/apiBase";

export interface GiftCatalogItem {
  id: string;
  name: string;
  emoji: string;
  price: number;

  imageUrl?: string;

  xrunPrice?: number;

  svgaUrl?: string;
}

export async function fetchGiftCatalog(): Promise<GiftCatalogItem[]> {
  const res = await fetch(`${API_BASE}/oth-path`);
  if (!res.ok) return [];
  const data = (await res.json()) as { items?: GiftCatalogItem[] };
  return Array.isArray(data.items) ? data.items : [];
}
