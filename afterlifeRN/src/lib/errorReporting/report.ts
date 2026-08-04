

import { v_c13d03, v_9effa0, v_138422, type v_213abd } from "./scrub";

const v_ad3dbf = 40;
const breadcrumbs: v_213abd[] = [];
let v_6a5c1f = false;

export type ErrorReport = {
  message: string;
  name?: string;
  stack?: string;
  isFatal?: boolean;
  extra?: Record<string, unknown>;
  breadcrumbs: v_213abd[];
  ts: number;
};

type ErrorSink = (report: ErrorReport) => void;

let v_50e734 = (v_2888b4) => {

  if (__DEV__) {
    console.warn("[errorReporting]", v_2888b4.message, {
      isFatal: v_2888b4.isFatal,
      breadcrumbs: v_2888b4.breadcrumbs.slice(-5),
      extra: v_2888b4.extra,
    });
  }
};

export function v_61a1ef(v_a448ad): void {
  v_50e734 = v_a448ad;
}

export function v_11e772(v_bbda62): void {
  v_951be3.push(v_c13d03(v_bbda62));
  if (v_951be3.length > v_ad3dbf) {
    v_951be3.splice(0, v_951be3.length - v_ad3dbf);
  }
}

export function v_13dbc7(): v_213abd[] {
  return v_951be3.slice();
}

export function v_d4ff75(): void {
  v_951be3.length = 0;
}

export function v_8827ec(
  v_5e9bfe,
  v_328259,
): void {
  const v_49263d = v_5e9bfe instanceof Error ? v_5e9bfe : new Error(String(v_5e9bfe));
  const v_2888b4 = {
    message: v_9effa0(v_49263d.message),
    name: v_49263d.name ? v_9effa0(v_49263d.name) : undefined,
    stack: v_49263d.stack ? v_9effa0(v_49263d.stack) : undefined,
    isFatal: v_328259?.isFatal,
    extra: v_328259?.extra
      ? (v_138422(v_328259.extra) as Record<string, unknown>)
      : undefined,
    breadcrumbs: v_13dbc7(),
    ts: Date.now(),
  };
  try {
    v_50e734(v_2888b4);
  } catch (v_7b9c9e) {
    if (__DEV__) console.warn("[errorReporting] sink failed", v_7b9c9e);
  }
}

export function v_b28903(): void {
  if (v_6a5c1f) return;
  v_6a5c1f = true;

  const v_f12b04 = (
    globalThis as unknown as {
      ErrorUtils?: {
        getGlobalHandler?: () => (e: Error, isFatal?: boolean) => void;
        setGlobalHandler?: (h: (e: Error, isFatal?: boolean) => void) => void;
      };
    }
  ).ErrorUtils;

  if (v_f12b04?.getGlobalHandler && v_f12b04?.setGlobalHandler) {
    const v_ba2215 = v_f12b04.getGlobalHandler();
    v_f12b04.setGlobalHandler((v_5e9bfe, v_17226a) => {
      v_8827ec(v_5e9bfe, { isFatal: !!v_17226a });
      v_ba2215?.(v_5e9bfe, v_17226a);
    });
  }

  const v_206b88 = globalThis as unknown as {
    onunhandledrejection?: ((e: { reason: unknown }) => void) | null;
    addEventListener?: (type: string, fn: (e: { reason: unknown }) => void) => void;
  };
  const v_6345dc = (v_9e86fd) => {
    v_8827ec(v_9e86fd?.reason ?? "unhandledrejection", {
      isFatal: false,
      extra: { type: "unhandledrejection" },
    });
  };
  if (typeof v_206b88.addEventListener === "function") {
    try {
      v_206b88.addEventListener("unhandledrejection", v_6345dc);
    } catch {

    }
  }
}
