

import { v_cc9198 } from "../config/apiBase";
import { v_84a859, type v_669377 } from "./auth";

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

async function v_04b58a<T>(
  v_9fe22d,
  v_2ca7e0,
  v_00cfc6 = {},
): Promise<T> {
  const v_8f00b9 = await fetch(`${v_cc9198}${v_9fe22d}`, {
    ...v_00cfc6,
    headers: {
      ...(v_00cfc6.headers ?? {}),
      "Content-Type": "application/json",
      Authorization: `Bearer ${v_2ca7e0}`,
    },
  });
  const v_9b6134 = await v_8f00b9.text();
  let v_8decf8 = null;
  try {
    v_8decf8 = v_9b6134 ? JSON.parse(v_9b6134) : null;
  } catch {

  }
  if (!v_8f00b9.ok) {
    const v_4d33b2 = v_8decf8 as v_669377 | null;
    throw new v_84a859(
      v_8f00b9.status,
      v_4d33b2?.error?.code ?? "HTTP_ERROR",
      v_4d33b2?.error?.message ?? `HTTP ${v_8f00b9.status}`,
      v_4d33b2?.error?.details,
    );
  }
  return v_8decf8 as T;
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
