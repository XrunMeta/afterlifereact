

import { v_cc9198 } from "../config/apiBase";
import v_9c213b from "../i18n";

export interface GiftCatalogItem {
  id: string;
  name: string;
  emoji: string;
  price: number;

  imageUrl?: string;

  xrunPrice?: number;

  svgaUrl?: string;

  names?: Partial<Record<string, string>>;
}

let v_5cde7e = [];
let v_7d4f5e = null;

export function v_ad2ddc(): Promise<GiftCatalogItem[]> {
  if (v_5cde7e.length > 0) return Promise.resolve(v_5cde7e);
  if (!v_7d4f5e) {
    v_7d4f5e = v_599b97()
      .catch(() => [] as GiftCatalogItem[])
      .finally(() => { v_7d4f5e = null; });
  }
  return v_7d4f5e;
}

export function v_561bb6(v_1833e7, v_96f93d): string {
  const v_0debf4 = v_1833e7 ?? v_96f93d ?? "";
  const v_5254bf = v_9c213b.language;
  if (!v_5254bf || v_5254bf === "ko") return v_0debf4;
  const v_8c0b26 =
    (v_96f93d ? v_5cde7e.find((v_206b88) => v_206b88.id === v_96f93d) : undefined) ??
    (v_1833e7 ? v_5cde7e.find((v_206b88) => v_206b88.name === v_1833e7) : undefined);
  return v_8c0b26?.names?.[v_5254bf] ?? v_0debf4;
}

export async function v_599b97(): Promise<GiftCatalogItem[]> {

  const v_f71b56 = `${v_cc9198}/oth-path?_=${Date.now()}`;
  const v_8f00b9 = await fetch(v_f71b56, { cache: "no-store" });
  if (!v_8f00b9.ok) return [];
  const v_9390e8 = (await v_8f00b9.json()) as { items?: GiftCatalogItem[] };
  const v_4622b9 = Array.isArray(v_9390e8.items) ? v_9390e8.items : [];
  if (v_4622b9.length > 0) v_5cde7e = v_4622b9;
  return v_4622b9;
}
