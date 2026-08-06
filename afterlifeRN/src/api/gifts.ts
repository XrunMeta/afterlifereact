

import { v_cc9198 } from "../config/apiBase";

export interface GiftCatalogItem {
  id: string;
  name: string;
  emoji: string;
  price: number;

  imageUrl?: string;

  xrunPrice?: number;
}

export async function v_599b97(): Promise<GiftCatalogItem[]> {
  const v_8f00b9 = await fetch(`${v_cc9198}/oth-path`);
  if (!v_8f00b9.ok) return [];
  const v_9390e8 = (await v_8f00b9.json()) as { items?: GiftCatalogItem[] };
  return Array.isArray(v_9390e8.items) ? v_9390e8.items : [];
}
