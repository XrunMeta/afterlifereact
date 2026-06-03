

import { v_04b58a } from "../lib/authFetch";

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

export async function v_9b8cb3(v_2ca7e0): Promise<PaymentPinStatus> {
  return v_04b58a("/oth-path", v_2ca7e0, { method: "GET" });
}

export async function v_5b2249(
  v_2ca7e0,
  v_6bee94,
): Promise<PaymentPinVerifyResult> {
  return v_04b58a("/oth-path", v_2ca7e0, {
    method: "POST",
    body: JSON.stringify({ pin: v_6bee94 }),
  });
}

export async function v_5c99c1(v_2ca7e0): Promise<XrunBalance> {
  return v_04b58a("/oth-path", v_2ca7e0, { method: "GET" });
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

export async function v_2a15d8(
  v_2ca7e0,
  v_328259,
): Promise<{ items: TransactionItem[] }> {
  const v_212049 = v_328259?.limit ? `?limit=${v_328259.limit}` : "";
  return v_04b58a(`/oth-path${v_212049}`, v_2ca7e0, { method: "GET" });
}
