

import v_e84827 from "bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv";
import { v_04b58a } from "../lib/authFetch";

const v_8cd075 = 4;
const v_e1c6bd = "faceConsent.copy.v1.";

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

function v_97036c(v_6f298b): string {
  return (v_6f298b || "ko").toLowerCase().split("-")[0];
}

function v_7ac310(v_5254bf): string {
  return `${v_e1c6bd}${v_5254bf}`;
}

export async function v_f7a9ad(v_6f298b): Promise<FaceConsentCopy | null> {
  const v_5254bf = v_97036c(v_6f298b);
  try {
    const v_479f05 = await v_e84827.getItem(v_7ac310(v_5254bf));
    if (!v_479f05) return null;
    const v_8decf8 = JSON.parse(v_479f05) as FaceConsentCopy;
    if (typeof v_8decf8?.copy !== "string" || typeof v_8decf8?.termsVersion !== "string") return null;
    return v_8decf8;
  } catch {
    return null;
  }
}

export async function v_eb463b(v_2ca7e0, v_6f298b): Promise<FaceConsentCopy> {
  const v_5254bf = v_97036c(v_6f298b);
  const v_8f00b9 = await v_04b58a<{ data: AgreementRow | null }>(
    `/oth-path?type=${v_8cd075}&lang=${encodeURIComponent(v_5254bf)}`,
    v_2ca7e0,
  );
  const v_3ac7e7 = v_8f00b9.data;
  const v_43c42e = v_3ac7e7
    ? {
        copy: v_3ac7e7.content,
        termsVersion: `agree.${v_8cd075}.v${v_3ac7e7.updated_at ?? 0}`,
      }
    : { copy: "", termsVersion: `agree.${v_8cd075}.v0` };

  try {
    await v_e84827.setItem(v_7ac310(v_5254bf), JSON.stringify(v_43c42e));
  } catch {

  }
  return v_43c42e;
}
