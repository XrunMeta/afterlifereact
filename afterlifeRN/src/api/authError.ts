

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export class v_84a859 extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;
  constructor(v_d308b5, v_c99bd2, v_a8cd21, v_5ab5bd) {
    super(v_a8cd21);
    this.code = v_c99bd2;
    this.status = v_d308b5;
    this.details = v_5ab5bd;
  }
}
