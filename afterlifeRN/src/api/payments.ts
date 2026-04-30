

import { API_BASE } from "../config/apiBase";
import { AuthApiError, type ApiErrorBody } from "./auth";

export interface PaymentPinStatus {
  linked: boolean;
  hasPin: boolean;
}

export interface PaymentPinVerifyResult {
  match: boolean;
  hasPin: boolean;
}

async function authFetch<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {

  }
  if (!res.ok) {
    const body = parsed as ApiErrorBody | null;
    throw new AuthApiError(
      res.status,
      body?.error?.code ?? "HTTP_ERROR",
      body?.error?.message ?? `HTTP ${res.status}`,
      body?.error?.details,
    );
  }
  return parsed as T;
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
