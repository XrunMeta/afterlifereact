

import { v_04b58a } from "../lib/authFetch";

const v_8cd075 = 4;

export interface FaceConsentCopy {
  copy: string;

  termsVersion: string;
}

interface AgreementRow {
  type: number;
  language: string;
  content: string;
  updated_at: number;
  updated_by: string | null;
}

export async function v_eb463b(v_2ca7e0, v_6f298b): Promise<FaceConsentCopy> {
  const v_5254bf = (v_6f298b || "ko").toLowerCase().split("-")[0];
  const v_8f00b9 = await v_04b58a<{ data: AgreementRow | null }>(
    `/oth-path?type=${v_8cd075}&lang=${encodeURIComponent(v_5254bf)}`,
    v_2ca7e0,
  );
  const v_3ac7e7 = v_8f00b9.data;
  if (!v_3ac7e7) {
    return { copy: "", termsVersion: `agree.${v_8cd075}.v0` };
  }
  return {
    copy: v_3ac7e7.content,
    termsVersion: `agree.${v_8cd075}.v${v_3ac7e7.updated_at ?? 0}`,
  };
}
