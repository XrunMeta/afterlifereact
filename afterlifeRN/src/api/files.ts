

import { API_BASE } from "../config/apiBase";
import { AuthApiError, type ApiErrorBody } from "./auth";

export interface UploadedFile {
  id: number;
  url: string;
  contentType: string;
  sizeBytes: number;
}

export async function uploadFile(
  accessToken: string,
  uri: string,
  opts?: { purpose?: string; fileName?: string; mimeType?: string },
): Promise<UploadedFile> {
  const form = new FormData();

  form.append(
    "file",
    {
      uri,
      name: opts?.fileName ?? "upload",
      type: opts?.mimeType ?? "image/jpeg",
    } as unknown as Blob,
  );
  if (opts?.purpose) form.append("purpose", opts.purpose);

  const res = await fetch(`${API_BASE}/oth-path`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,

    },
    body: form,
  });

  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {

  }
  if (!res.ok) {
    const errBody = parsed as ApiErrorBody | null;
    throw new AuthApiError(
      res.status,
      errBody?.error?.code ?? "HTTP_ERROR",
      errBody?.error?.message ?? `HTTP ${res.status}`,
      errBody?.error?.details,
    );
  }
  return parsed as UploadedFile;
}
