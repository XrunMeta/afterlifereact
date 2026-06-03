

import { authFetch } from '../lib/authFetch';

export interface CallTicket {
  callId: string;
  subscribeUrl: string;
  renegotiateUrl: string;
  subscribeToken: string;
  tracks: { video: string; audio: string };
  expiresAt: string;
}

export async function startCall(accessToken: string, cloneId: number): Promise<CallTicket> {
  return authFetch<CallTicket>(`/oth-path${cloneId}/call`, accessToken, { method: 'POST' });
}

export async function sayInCall(
  accessToken: string,
  cloneId: number,
  callId: string,
  text: string,
): Promise<{ ok: boolean }> {
  return authFetch<{ ok: boolean }>(
    `/oth-path${cloneId}/call/${callId}/say`,
    accessToken,
    { method: 'POST', body: JSON.stringify({ text }) },
  );
}

export async function endCall(
  accessToken: string,
  cloneId: number,
  callId: string,
): Promise<{ ok: true }> {
  return authFetch<{ ok: true }>(
    `/oth-path${cloneId}/call/${callId}/end`,
    accessToken,
    { method: 'POST' },
  );
}
