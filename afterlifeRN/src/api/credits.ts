

import { v_04b58a } from "../lib/authFetch";

export type PlanCode = "light" | "basic" | "standard" | "plus" | "premium";

export interface CreditBalance {
  totalSec: number;
  freeSec: number;
  subSec: number;
  topupSec: number;

  giftSec: number;
  freeGrantedAt: number | null;
  freeDecayedMonths: number;
  subscription: {
    platform: "ios" | "android";
    productId: string;
    planCode: PlanCode;
    status: "active" | "grace";
    periodStart: number;
    periodEnd: number;
    autoRenew: boolean;
  } | null;
  nextExpiry: { expiresAt: number; remainingSec: number } | null;
}

export async function v_48981e(v_2ca7e0): Promise<CreditBalance> {
  return v_04b58a<CreditBalance>("/oth-path", v_2ca7e0, { method: "GET" });
}

export interface PurchasePayload {
  platform: "ios" | "android";

  transactionId: string;
  productId: string;
}

export interface PurchaseResult {
  ok: true;
  replay: boolean;
  productId: string;
  kind?: "consumable" | "subscription";
  creditsSec: number;
  balance: {
    credits: number;
    credits_free: number;
    credits_sub: number;
    credits_topup: number;
  } | null;
}

export async function v_bb6abc(
  v_2ca7e0,
  v_931bf0,
): Promise<PurchaseResult> {
  return v_04b58a<PurchaseResult>("/oth-path", v_2ca7e0, {
    method: "POST",
    body: JSON.stringify(v_931bf0),
  });
}
