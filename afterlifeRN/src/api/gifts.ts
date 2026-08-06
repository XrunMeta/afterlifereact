

import { v_cc9198 } from "../config/apiBase";

export interface GiftCatalogItem {
  id: string;
  name: string;
  emoji: string;
  price: number;

  imageUrl?: string;

  xrunPrice?: number;

  svgaUrl?: string;
}

export async function v_599b97(): Promise<GiftCatalogItem[]> {

  const v_f71b56 = `${v_cc9198}/oth-path?_=${Date.now()}`;
  const v_8f00b9 = await fetch(v_f71b56, { cache: "no-store" });
  if (!v_8f00b9.ok) return [];
  const v_9390e8 = (await v_8f00b9.json()) as { items?: GiftCatalogItem[] };
  return Array.isArray(v_9390e8.items) ? v_9390e8.items : [];
}
