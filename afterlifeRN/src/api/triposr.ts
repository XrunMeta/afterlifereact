

import { authFetch } from "../lib/authFetch";

export interface TriposrGenerateResponse {
  job_id: string;
  elapsed_ms: number;
  mesh_bytes: number;
  base_url: string;
  mesh_url: string;
  input_url: string;
  render_urls: string[];
}

export async function triposrGenerate(
  accessToken: string,
  imageUri: string,
): Promise<TriposrGenerateResponse> {
  const form = new FormData();
  form.append(
    "image",
    { uri: imageUri, name: "input.jpg", type: "image/jpeg" } as unknown as Blob,
  );
  return authFetch<TriposrGenerateResponse>(
    "/oth-path",
    accessToken,
    { method: "POST", body: form },

    180_000,
    { multipart: true },
  );
}

export function absoluteAssetUrl(base_url: string, path: string): string {
  const b = base_url.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}
