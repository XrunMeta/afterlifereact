

import { authFetch } from "../lib/authFetch";

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

export async function getGiftInventory(
  accessToken: string,
): Promise<{ items: GiftInventoryItem[] }> {
  return authFetch<{ items: GiftInventoryItem[] }>(
    "/oth-path",
    accessToken,
    { method: "GET" },
  );
}

export async function swapGift(
  accessToken: string,
  payload: { giftId: string; count: number },
  idempotencyKey: string,
): Promise<{ ok: true; giftId: string; count: number; xrunCredited: number }> {
  return authFetch(
    "/oth-path",
    accessToken,
    { method: "POST", body: JSON.stringify(payload) },
    idempotencyKey,
  );
}

export async function sendGiftOffchain(
  accessToken: string,
  payload: { giftId: string; toUserId: number },
  idempotencyKey: string,
): Promise<{ ok: true; giftId: string; xrunAmount: number; receiverId: number }> {
  return authFetch(
    "/oth-path",
    accessToken,
    { method: "POST", body: JSON.stringify(payload) },
    idempotencyKey,
  );
}
