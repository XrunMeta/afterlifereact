

import { authFetch } from "../lib/authFetch";

export interface PaymentPinStatus {
  linked: boolean;
  hasPin: boolean;
}

export interface PaymentPinVerifyResult {
  match: boolean;
  hasPin: boolean;
}

export interface XrunBalanceItem {
  currency: number;
  symbol: string | null;
  amount: string;
  address: string | null;
}

export interface XrunBalance {
  linked: boolean;
  balances: XrunBalanceItem[];
  xrun: number | null;
  ad: number | null;
}

export async function getPaymentPinStatus(accessToken: string): Promise<PaymentPinStatus> {
  return authFetch("/oth-path", accessToken, { method: "GET" });
}

export async function verifyPaymentPin(
  accessToken: string,
  pin: string,
): Promise<PaymentPinVerifyResult> {
  return authFetch("/oth-path", accessToken, {
    method: "POST",
    body: JSON.stringify({ pin }),
  });
}

export async function getXrunBalance(accessToken: string): Promise<XrunBalance> {
  return authFetch("/oth-path", accessToken, { method: "GET" });
}

export interface TransactionItem {
  id: number;
  type: "gift_sent" | "gift_received";
  amount: number; 
  sign: "-" | "+";
  giftId: string;
  giftName: string;
  cloneId: number;
  cloneName: string | null;
  cloneAvatarUrl: string | null;
  txHash: string | null;
  createdAt: string;
}

export async function getMyTransactions(
  accessToken: string,
  opts?: { limit?: number },
): Promise<{ items: TransactionItem[] }> {
  const qs = opts?.limit ? `?limit=${opts.limit}` : "";
  return authFetch(`/oth-path${qs}`, accessToken, { method: "GET" });
}
