

export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "IDEMPOTENCY_REQUIRED"
  | "IDEMPOTENCY_CONFLICT"
  | "RATE_LIMITED"
  | "INSUFFICIENT_CREDITS"
  | "INSUFFICIENT_FUNDS"
  | "PAYMENT_REQUIRED"
  | "UPSTREAM_NOT_IMPLEMENTED"
  | "OWNER_CONSTRAINT"
  | "QUOTA_EXCEEDED"
  | "ALREADY_INVITED"
  | "ALREADY_MEMBER"
  | "TOTP_REQUIRED"
  | "TOTP_INVALID"
  | "OTP_REQUIRED"
  | "OTP_INVALID"
  | "OTP_EXPIRED"
  | "OTP_COOLDOWN"
  | "WEBAUTHN_NOT_ENROLLED"
  | "WEBAUTHN_INVALID"
  | "WEBAUTHN_CHALLENGE_EXPIRED"
  | "ACCOUNT_LOCKED"
  | "ACCOUNT_DELETED"
  | "CONFLICT"
  | "UPSTREAM_FAILURE"
  | "SERVICE_UNAVAILABLE"
  | "SHREDDED"
  | "INTERNAL_ERROR";

const STATUS: Record<ErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_FAILED: 422,
  IDEMPOTENCY_REQUIRED: 400,
  IDEMPOTENCY_CONFLICT: 409,
  RATE_LIMITED: 429,
  INSUFFICIENT_CREDITS: 402,
  INSUFFICIENT_FUNDS: 402,
  PAYMENT_REQUIRED: 402,
  UPSTREAM_NOT_IMPLEMENTED: 501,
  OWNER_CONSTRAINT: 409,
  QUOTA_EXCEEDED: 403,
  ALREADY_INVITED: 409,
  ALREADY_MEMBER: 409,
  TOTP_REQUIRED: 401,
  TOTP_INVALID: 401,
  OTP_REQUIRED: 401,
  OTP_INVALID: 401,
  OTP_EXPIRED: 410,
  OTP_COOLDOWN: 429,
  WEBAUTHN_NOT_ENROLLED: 404,
  WEBAUTHN_INVALID: 401,
  WEBAUTHN_CHALLENGE_EXPIRED: 410,
  ACCOUNT_LOCKED: 423,

  ACCOUNT_DELETED: 403,
  CONFLICT: 409,
  UPSTREAM_FAILURE: 502,
  SERVICE_UNAVAILABLE: 503,
  SHREDDED: 410,
  INTERNAL_ERROR: 500,
};

export class APIError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.status = STATUS[code];
    this.details = details;
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

export function statusFor(code: ErrorCode): number {
  return STATUS[code];
}
