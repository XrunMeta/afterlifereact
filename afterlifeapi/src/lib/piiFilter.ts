

import type { v_d91e78 } from "./memoryStore";

const v_ec7353 = [
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

export function v_0de2cd(v_fd5f43): boolean {
  return v_ec7353.some((v_e2a85c) => v_e2a85c.test(v_fd5f43));
}

export function v_c9411d(extracted: v_d91e78): v_d91e78 {
  const out: v_d91e78 = {};

  if (v_631e71.preference_personal) {
    const v_76a373 = {};
    for (const [v_0eb677, v_81e2ef] of Object.entries(v_631e71.preference_personal)) {

      if (v_0de2cd(v_0eb677) || v_0de2cd(String(v_81e2ef))) continue;
      v_76a373[v_0eb677] = v_81e2ef;
    }
    if (Object.keys(v_76a373).length > 0) v_8d4337.preference_personal = v_76a373;
  }

  if (typeof v_631e71.relation === "string" && !v_0de2cd(v_631e71.relation)) {
    v_8d4337.relation = v_631e71.relation;
  }

  if (Array.isArray(v_631e71.memories_personal)) {
    const v_76a373 = v_631e71.memories_personal.filter((v_35f85c) => !v_0de2cd(String(v_35f85c)));
    if (v_76a373.length > 0) v_8d4337.memories_personal = v_76a373;
  }

  return v_8d4337;
}
