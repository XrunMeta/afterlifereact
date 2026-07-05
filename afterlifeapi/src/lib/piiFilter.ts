

import type { L2Extraction } from "./memoryStore";

const PII_PATTERNS: RegExp[] = [
  /01[016-9][-\s]?\d{3,4}[-\s]?\d{4}/,                 
  /\d{6}[-\s]?\d{7}/,                                   
  /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/,           
  /\d{2,6}[-\s]\d{2,6}[-\s]\d{2,6}/,                  
  /\d{11,16}/,                                          
  /(비밀번호|비번|패스워드|핀\s*번호)/,                 
  /\b(password|passwd|pwd|pin\s*code|pin\s*number)\b/i, 
  /[가-힣]{2,}(로|길)\s*\d{1,4}/,                       
  /\d+\s*번지/,                                          
  /[가-힣]+(시|도)\s*[가-힣]+(시|군|구)/,               
];

export function hasPii(s: string): boolean {
  return PII_PATTERNS.some((p) => p.test(s));
}

export function stripPii(extracted: L2Extraction): L2Extraction {
  const out: L2Extraction = {};

  if (extracted.preference_personal) {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(extracted.preference_personal)) {

      if (hasPii(k) || hasPii(String(v))) continue;
      clean[k] = v;
    }
    if (Object.keys(clean).length > 0) out.preference_personal = clean;
  }

  if (typeof extracted.relation === "string" && !hasPii(extracted.relation)) {
    out.relation = extracted.relation;
  }

  if (Array.isArray(extracted.memories_personal)) {
    const clean = extracted.memories_personal.filter((m) => !hasPii(String(m)));
    if (clean.length > 0) out.memories_personal = clean;
  }

  return out;
}
