

import { v_04b58a } from '../lib/authFetch';

export interface CallTicket {
  callId: string;
  subscribeUrl: string;
  renegotiateUrl: string;
  subscribeToken: string;
  tracks: { video: string; audio: string };
  expiresAt: string;
}

export async function v_53975b(v_2ca7e0, v_6e0fd3): Promise<CallTicket> {
  return v_04b58a<CallTicket>(`/oth-path${v_6e0fd3}/call`, v_2ca7e0, { method: 'POST' });
}

export async function v_af28f9(
  v_2ca7e0,
  v_6e0fd3,
  v_be62d3,
  v_9b6134,
): Promise<{ ok: boolean }> {
  return v_04b58a<{ ok: boolean }>(
    `/oth-path${v_6e0fd3}/call/${v_be62d3}/say`,
    v_2ca7e0,
    { method: 'POST', body: JSON.stringify({ text: v_9b6134 }) },
  );
}

export async function v_51c671(
  v_2ca7e0,
  v_6e0fd3,
  v_be62d3,
): Promise<{ ok: true }> {
  return v_04b58a<{ ok: true }>(
    `/oth-path${v_6e0fd3}/call/${v_be62d3}/end`,
    v_2ca7e0,
    { method: 'POST' },
  );
}
