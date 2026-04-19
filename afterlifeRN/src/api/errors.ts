export type ApiErrorPayload = {
  error?: string;
  message?: string;
  code?: string;
  details?: unknown;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  payload?: ApiErrorPayload;
  requestId?: string;

  constructor(
    status: number,
    message: string,
    opts: { code?: string; payload?: ApiErrorPayload; requestId?: string } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = opts.code;
    this.payload = opts.payload;
    this.requestId = opts.requestId;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }

  get isNetwork() {
    return this.status === 0;
  }
}
