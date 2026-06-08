
import { v_04b58a } from "../lib/authFetch";

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
}

export function v_5d6789(v_2ca7e0): Promise<{ items: MyReportMade[] }> {
  return v_04b58a(`/oth-path`, v_2ca7e0);
}

export function v_be317d(
  v_2ca7e0,
): Promise<{ items: MyReportReceived[]; warningCount: number; suspendedUntil: string | null }> {
  return v_04b58a(`/oth-path`, v_2ca7e0);
}
