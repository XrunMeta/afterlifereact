
import { authFetch } from "../lib/authFetch";

export interface MyReportMade {
  id: number;
  reason: string | null;
  status: "open" | "reviewed" | "actioned" | "dismissed" | string;
  createdAt: string;
  reviewedAt: string | null;
  targetId: number;
  targetName: string | null;
  targetEmail: string;
}

export interface MyReportReceived {
  id: number;
  reason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  warningReason: string | null;
  warnedAt: string | null;
}

export function getMyReportsMade(accessToken: string): Promise<{ items: MyReportMade[] }> {
  return authFetch(`/oth-path`, accessToken);
}

export function getMyReportsReceived(
  accessToken: string,
): Promise<{ items: MyReportReceived[]; warningCount: number; suspendedUntil: string | null }> {
  return authFetch(`/oth-path`, accessToken);
}
