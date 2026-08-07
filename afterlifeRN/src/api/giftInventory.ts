

import { v_04b58a } from "../lib/authFetch";

export interface GiftInventoryItem {
  giftId: string;
  name: string;
  emoji: string;
  imageUrl?: string;
  xrunPerItem: number;
  count: number;
  totalReceived: number;
  xrunTotal: number;
}

export async function v_83b207(
  v_2ca7e0,
): Promise<{ items: GiftInventoryItem[] }> {
  return v_04b58a<{ items: GiftInventoryItem[] }>(
    "/oth-path",
    v_2ca7e0,
    { method: "GET" },
  );
}

export async function v_422d96(
  v_2ca7e0,
  v_931bf0,
  v_6f448e,
): Promise<{ ok: true; giftId: string; count: number; xrunCredited: number }> {
  return v_04b58a(
    "/oth-path",
    v_2ca7e0,
    { method: "POST", body: JSON.stringify(v_931bf0) },
    v_6f448e,
  );
}

export async function v_e2ae57(
  v_2ca7e0,

  v_931bf0,
  v_6f448e,
): Promise<{ ok: true; giftId: string; xrunAmount: number; receiverId: number }> {
  return v_04b58a(
    "/oth-path",
    v_2ca7e0,
    { method: "POST", body: JSON.stringify(v_931bf0) },
    v_6f448e,
  );
}
