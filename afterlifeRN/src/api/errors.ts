export type ApiErrorPayload = {
  error?: string;
  message?: string;
  code?: string;
  details?: unknown;
};

export class v_fe6cdd extends Error {
  status: number;
  code?: string;
  payload?: ApiErrorPayload;
  requestId?: string;

  constructor(
    v_d308b5,
    v_a8cd21,
    v_328259 = {},
  ) {
    super(v_a8cd21);
    this.name = "ApiError";
    this.status = v_d308b5;
    this.code = v_328259.code;
    this.payload = v_328259.payload;
    this.requestId = v_328259.requestId;
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
