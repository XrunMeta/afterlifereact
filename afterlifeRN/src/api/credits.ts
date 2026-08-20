

import { authFetch } from "../lib/authFetch";

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

export async function getCreditBalance(accessToken: string): Promise<CreditBalance> {
  return authFetch<CreditBalance>("/oth-path", accessToken, { method: "GET" });
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

export async function submitPurchase(
  accessToken: string,
  payload: PurchasePayload,
): Promise<PurchaseResult> {
  return authFetch<PurchaseResult>("/oth-path", accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
