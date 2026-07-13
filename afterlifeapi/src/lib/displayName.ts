

import { APIError } from "./errors";

export function assertValidDisplayName(raw: unknown): string {
  if (typeof raw !== "string") {
    throw new APIError("VALIDATION_FAILED", "displayName은 문자열이어야 합니다.");
  }
  const trimmed = raw.trim();
  if (trimmed.length < 1 || trimmed.length > 30) {
    throw new APIError("VALIDATION_FAILED", "displayName은 1~30자여야 합니다.");
  }

  if (/[\x00-\x1f\x7f​-‏‪-‮⁠-⁯﻿]/.test(trimmed)) {
    throw new APIError("VALIDATION_FAILED", "displayName에 제어문자를 사용할 수 없습니다.");
  }
  return trimmed;
}
