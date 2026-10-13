

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

export interface GiftReceivedLogItem {
  id: number;
  senderId: number;
  senderEmail: string | null;
  senderName: string | null;
  senderAvatarUrl: string | null;
  cloneId: number;
  cloneName: string | null;
  cloneUsername: string | null;
  cloneAvatarUrl: string | null;
  giftId: string;
  giftName: string;
  giftEmoji: string;
  giftImageUrl: string | null;
  xrunAmount: number;
  createdAt: string; 
}

export async function v_a71fb1(
  v_2ca7e0,
  v_24baff,
): Promise<{ items: GiftReceivedLogItem[]; total: number; limit: number; offset: number }> {
  const v_212049 = new URLSearchParams();
  if (v_24baff?.limit) v_212049.set("limit", String(v_24baff.limit));
  if (v_24baff?.offset) v_212049.set("offset", String(v_24baff.offset));
  const v_25c4f7 = v_212049.toString();
  return v_04b58a(
    `/oth-path${v_25c4f7 ? `?${v_25c4f7}` : ""}`,
    v_2ca7e0,
    { method: "GET" },
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
