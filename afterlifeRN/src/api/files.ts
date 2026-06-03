

import { authFetch } from "../lib/authFetch";

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

  return authFetch<UploadedFile>(
    "/oth-path",
    accessToken,
    { method: "POST", body: form },
    undefined,
    { multipart: true },
  );
}
