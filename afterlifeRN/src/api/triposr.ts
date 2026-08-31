

import { v_04b58a } from "../lib/authFetch";

export interface TriposrGenerateResponse {
  job_id: string;
  elapsed_ms: number;
  mesh_bytes: number;
  base_url: string;
  mesh_url: string;
  input_url: string;
  render_urls: string[];
}

export async function v_8881f3(
  v_2ca7e0,
  v_ee89db,
): Promise<TriposrGenerateResponse> {
  const v_ebd523 = new FormData();
  v_ebd523.append(
    "image",
    { uri: v_ee89db, name: "input.jpg", type: "image/jpeg" } as unknown as Blob,
  );
  return v_04b58a<TriposrGenerateResponse>(
    "/oth-path",
    v_2ca7e0,
    { method: "POST", body: v_ebd523 },

    180_000,
    { multipart: true },
  );
}

export function v_84dc6e(v_c777ae, v_9fe22d): string {
  const v_148ff6 = v_c777ae.replace(/\/$/, "");
  const v_e2a85c = v_9fe22d.startsWith("/") ? v_9fe22d : `/${v_9fe22d}`;
  return `${v_148ff6}${v_e2a85c}`;
}
