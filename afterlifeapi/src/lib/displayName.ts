

import { v_3ebe58 } from "./errors";

export function v_d0fd96(v_479f05): string {
  if (typeof v_479f05 !== "string") {
    throw new v_3ebe58("VALIDATION_FAILED", "displayName은 문자열이어야 합니다.");
  }
  const v_2f361a = v_479f05.trim();
  if (v_2f361a.length < 1 || v_2f361a.length > 30) {
    throw new v_3ebe58("VALIDATION_FAILED", "displayName은 1~30자여야 합니다.");
  }

  if (/[\x00-\x1f\x7f​-‏‪-‮⁠-⁯﻿]/.test(v_2f361a)) {
    throw new v_3ebe58("VALIDATION_FAILED", "displayName에 제어문자를 사용할 수 없습니다.");
  }
  return v_2f361a;
}
