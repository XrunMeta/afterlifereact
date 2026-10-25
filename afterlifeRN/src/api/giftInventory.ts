

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

export type GiftActivityKind = "received" | "ad_reward" | "sent" | "exchanged";

export interface GiftActivityItem {
  id: number;
  kind: GiftActivityKind;
  counterpartId: number | null;
  counterpartEmail: string | null;
  counterpartName: string | null;
  counterpartAvatarUrl: string | null;
  cloneId: number | null;
  cloneName: string | null;
  cloneUsername: string | null;
  cloneAvatarUrl: string | null;
  giftId: string;
  giftName: string;
  giftEmoji: string;
  giftImageUrl: string | null;
  count: number;
  xrunAmount: number;
  createdAt: string; 
}

export async function v_bf9881(
  v_2ca7e0,

  v_24baff,
): Promise<{
  items: GiftActivityItem[];
  total: number;
  totalReceived: number;

  totalSent?: number;
  currentOwned: number;
  limit: number;
  offset: number;
}> {
  const v_212049 = new URLSearchParams();
  if (v_24baff?.limit) v_212049.set("limit", String(v_24baff.limit));
  if (v_24baff?.offset) v_212049.set("offset", String(v_24baff.offset));
  if (v_24baff?.kind) v_212049.set("kind", v_24baff.kind);
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

export interface GiftExchangeEligibility {
  xrunLinked: boolean;
  xrunMemberId?: number | null;
  enabled: boolean;
  giftId: string | null;
  giftName: string | null;
  giftEmoji: string;
  giftImageUrl: string | null;
  ownedQty: number;

  exchangeableQty: number;
  minQty: number;

  feeQty: number;
  feeUnit?: number;
  rateVersion: number;

  priceSegments: Array<{ price: string; count: number }>;
  currency: "XRUN";
  maintenance: { from: number; to: number; message?: string } | null;
}

export interface GiftExchangeResult {
  exchangeId: number;
  exchangeNo: string;
  giftId: string;
  giftName: string;
  qty: number;
  feeQty: number;
  deductedQty: number;

  reward: string;
  rewardStatus: "pending_claim" | "claimed" | "failed";
  createdAt: number;
  claimedAt: number | null;
}

export async function v_a56ba0(
  v_2ca7e0,
  v_96f93d,
): Promise<GiftExchangeEligibility> {
  const v_ab6401 = v_96f93d ? `?giftId=${encodeURIComponent(v_96f93d)}` : "";
  return v_04b58a<GiftExchangeEligibility>(`/oth-path${v_ab6401}`, v_2ca7e0, { method: "GET" });
}

export async function v_541c70(
  v_2ca7e0,
  v_931bf0,
  v_6f448e,
): Promise<GiftExchangeResult> {
  return v_04b58a<GiftExchangeResult>(
    "/oth-path",
    v_2ca7e0,
    { method: "POST", body: JSON.stringify(v_931bf0) },
    v_6f448e,
  );
}

export async function v_9c3304(
  v_2ca7e0,
): Promise<{ items: GiftExchangeResult[] }> {
  return v_04b58a<{ items: GiftExchangeResult[] }>("/oth-path", v_2ca7e0, { method: "GET" });
}

export function v_6f0728(v_9e86fd, v_d016c9): number {
  if (v_d016c9 <= 0) return 0;
  return v_9e86fd.feeUnit && v_9e86fd.feeUnit > 0 ? Math.ceil(v_d016c9 / v_9e86fd.feeUnit) * v_9e86fd.feeQty : v_9e86fd.feeQty;
}

export function v_c55c0b(v_665404, v_d016c9): number {
  let v_dbaa7f = Math.max(0, v_d016c9);
  let v_dce0a8 = 0;
  for (const v_fd5f43 of v_665404) {
    if (v_dbaa7f <= 0) break;
    const v_f4e98d = Math.min(v_dbaa7f, v_fd5f43.count);
    v_dce0a8 += v_f4e98d * Number(v_fd5f43.price);
    v_dbaa7f -= v_f4e98d;
  }
  return Math.round(v_dce0a8 * 1e8) / 1e8;
}
