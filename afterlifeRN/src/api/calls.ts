

import { API_BASE } from '../config/apiBase';
import { AuthApiError, type ApiErrorBody } from './auth';

export interface CallTicket {
  callId: string;
  subscribeUrl: string;
  renegotiateUrl: string;
  subscribeToken: string;
  tracks: { video: string; audio: string };
  expiresAt: string;
}

async function postAuth<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
      body?.error?.code ?? 'HTTP_ERROR',
      body?.error?.message ?? `HTTP ${res.status}`,
      body?.error?.details,
    );
  }
  return parsed as T;
}

export async function startCall(accessToken: string, cloneId: number): Promise<CallTicket> {
  return postAuth<CallTicket>(`/oth-path${cloneId}/call`, accessToken);
}

export async function endCall(
  accessToken: string,
  cloneId: number,
  callId: string,
): Promise<{ ok: true }> {
  return postAuth<{ ok: true }>(`/oth-path${cloneId}/call/${callId}/end`, accessToken);
}
