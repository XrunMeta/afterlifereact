
import { authFetch } from "../lib/authFetch";

export interface MyReportMade {
  id: number;
  type: "user" | "clone" | "comment" | string;
  reason: string | null;
  status: "open" | "reviewed" | "actioned" | "dismissed" | string;
  createdAt: string;
  reviewedAt: string | null;
  adminMessage: string | null;
  targetId: number;
  targetName: string | null;
  targetEmail: string;
}

export interface MyReportReceived {
  id: number;
  reportType: "user" | "clone" | "comment" | string;
  reason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  adminMessage: string | null;
  warningReason: string | null;
  warnedAt: string | null;

  cloneName: string | null;

  content: string | null;
}

export function getMyReportsMade(accessToken: string): Promise<{ items: MyReportMade[] }> {
  return authFetch(`/oth-path`, accessToken);
}

export function getMyReportsReceived(
  accessToken: string,
): Promise<{ items: MyReportReceived[]; warningCount: number; suspendedUntil: string | null }> {
  return authFetch(`/oth-path`, accessToken);
}
