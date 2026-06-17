

import { v_04b58a } from "../lib/authFetch";

export interface UploadedFile {
  id: number;
  url: string;
  contentType: string;
  sizeBytes: number;
}

export async function v_7d2692(
  v_2ca7e0,
  v_cd1446,
  v_328259,
): Promise<UploadedFile> {
  const v_ebd523 = new FormData();

  v_ebd523.append(
    "file",
    {
      uri: v_cd1446,
      name: v_328259?.fileName ?? "upload",
      type: v_328259?.mimeType ?? "image/jpeg",
    } as unknown as Blob,
  );
  if (v_328259?.purpose) v_ebd523.append("purpose", v_328259.purpose);

  return v_04b58a<UploadedFile>(
    "/oth-path",
    v_2ca7e0,
    { method: "POST", body: v_ebd523 },
    undefined,
    { multipart: true },
  );
}
