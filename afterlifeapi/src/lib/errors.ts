

export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "IDEMPOTENCY_REQUIRED"
  | "IDEMPOTENCY_CONFLICT"
  | "RATE_LIMITED"
  | "INSUFFICIENT_CREDITS"
  | "OWNER_CONSTRAINT"
  | "QUOTA_EXCEEDED"
  | "TOTP_REQUIRED"
  | "TOTP_INVALID"
  | "WEBAUTHN_NOT_ENROLLED"
  | "WEBAUTHN_INVALID"
  | "WEBAUTHN_CHALLENGE_EXPIRED"
  | "ACCOUNT_LOCKED"
  | "CONFLICT"
  | "UPSTREAM_FAILURE"
  | "SHREDDED"
  | "INTERNAL_ERROR";

const v_fcd82a = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_FAILED: 422,
  IDEMPOTENCY_REQUIRED: 400,
  IDEMPOTENCY_CONFLICT: 409,
  RATE_LIMITED: 429,
  INSUFFICIENT_CREDITS: 402,
  OWNER_CONSTRAINT: 409,
  QUOTA_EXCEEDED: 403,
  TOTP_REQUIRED: 401,
  TOTP_INVALID: 401,
  WEBAUTHN_NOT_ENROLLED: 404,
  WEBAUTHN_INVALID: 401,
  WEBAUTHN_CHALLENGE_EXPIRED: 410,
  ACCOUNT_LOCKED: 423,
  CONFLICT: 409,
  UPSTREAM_FAILURE: 502,
  SHREDDED: 410,
  INTERNAL_ERROR: 500,
};

export class v_3ebe58 extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(v_c99bd2, v_a8cd21, v_5ab5bd) {
    super(v_a8cd21);
    this.code = v_c99bd2;
    this.status = v_fcd82a[v_c99bd2];
    this.details = v_5ab5bd;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details !== undefined ? { details: this.details } : {}),
      },
    };
  }
}

export function v_b245bb(v_c99bd2): number {
  return v_fcd82a[v_c99bd2];
}
