

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

  const url = `${API_BASE}/oth-path?_=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as { items?: GiftCatalogItem[] };
  return Array.isArray(data.items) ? data.items : [];
}
