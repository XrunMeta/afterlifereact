

import { v_cc9198 } from '../config/apiBase';
import { v_84a859, type v_669377 } from './auth';

export interface CallTicket {
  callId: string;
  subscribeUrl: string;
  renegotiateUrl: string;
  subscribeToken: string;
  tracks: { video: string; audio: string };
  expiresAt: string;
}

async function v_8d6d6e<T>(v_9fe22d, v_2ca7e0, v_4d33b2): Promise<T> {
  const v_8f00b9 = await fetch(`${v_cc9198}${v_9fe22d}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${v_2ca7e0}`,
    },
    body: v_4d33b2 !== undefined ? JSON.stringify(v_4d33b2) : undefined,
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
      v_4d33b2?.error?.code ?? 'HTTP_ERROR',
      v_4d33b2?.error?.message ?? `HTTP ${v_8f00b9.status}`,
      v_4d33b2?.error?.details,
    );
  }
  return v_8decf8 as T;
}

export async function v_53975b(v_2ca7e0, v_6e0fd3): Promise<CallTicket> {
  return v_8d6d6e<CallTicket>(`/oth-path${v_6e0fd3}/call`, v_2ca7e0);
}

export async function v_af28f9(
  v_2ca7e0,
  v_6e0fd3,
  v_be62d3,
  v_9b6134,
): Promise<{ ok: boolean }> {
  return v_8d6d6e<{ ok: boolean }>(
    `/oth-path${v_6e0fd3}/call/${v_be62d3}/say`,
    v_2ca7e0,
    { text: v_9b6134 },
  );
}

export async function v_51c671(
  v_2ca7e0,
  v_6e0fd3,
  v_be62d3,
): Promise<{ ok: true }> {
  return v_8d6d6e<{ ok: true }>(`/oth-path${v_6e0fd3}/call/${v_be62d3}/end`, v_2ca7e0);
}
