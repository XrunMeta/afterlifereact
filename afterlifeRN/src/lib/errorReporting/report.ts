

import { scrubBreadcrumb, scrubErrorMessage, scrubValue, type SafeBreadcrumb } from "./scrub";

const MAX_BREADCRUMBS = 40;
const breadcrumbs: SafeBreadcrumb[] = [];
let globalHandlerInstalled = false;

export type ErrorReport = {
  message: string;
  name?: string;
  stack?: string;
  isFatal?: boolean;
  extra?: Record<string, unknown>;
  breadcrumbs: SafeBreadcrumb[];
  ts: number;
};

type ErrorSink = (report: ErrorReport) => void;

let sink: ErrorSink = (report) => {

  if (__DEV__) {
    console.warn("[errorReporting]", report.message, {
      isFatal: report.isFatal,
      breadcrumbs: report.breadcrumbs.slice(-5),
      extra: report.extra,
    });
  }
};

export function setErrorReportingSink(next: ErrorSink): void {
  sink = next;
}

export function addBreadcrumb(input: {
  category: string;
  message: string;
  data?: Record<string, unknown>;
}): void {
  breadcrumbs.push(scrubBreadcrumb(input));
  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs.splice(0, breadcrumbs.length - MAX_BREADCRUMBS);
  }
}

export function getBreadcrumbs(): SafeBreadcrumb[] {
  return breadcrumbs.slice();
}

export function clearBreadcrumbs(): void {
  breadcrumbs.length = 0;
}

export function reportError(
  error: unknown,
  opts?: { isFatal?: boolean; extra?: Record<string, unknown> },
): void {
  const err = error instanceof Error ? error : new Error(String(error));
  const report: ErrorReport = {
    message: scrubErrorMessage(err.message),
    name: err.name ? scrubErrorMessage(err.name) : undefined,
    stack: err.stack ? scrubErrorMessage(err.stack) : undefined,
    isFatal: opts?.isFatal,
    extra: opts?.extra
      ? (scrubValue(opts.extra) as Record<string, unknown>)
      : undefined,
    breadcrumbs: getBreadcrumbs(),
    ts: Date.now(),
  };
  try {
    sink(report);
  } catch (sinkErr) {
    if (__DEV__) console.warn("[errorReporting] sink failed", sinkErr);
  }
}

export function installGlobalErrorHandlers(): void {
  if (globalHandlerInstalled) return;
  globalHandlerInstalled = true;

  const ErrorUtils = (
    globalThis as unknown as {
      ErrorUtils?: {
        getGlobalHandler?: () => (e: Error, isFatal?: boolean) => void;
        setGlobalHandler?: (h: (e: Error, isFatal?: boolean) => void) => void;
      };
    }
  ).ErrorUtils;

  if (ErrorUtils?.getGlobalHandler && ErrorUtils?.setGlobalHandler) {
    const prev = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      reportError(error, { isFatal: !!isFatal });
      prev?.(error, isFatal);
    });
  }

  const g = globalThis as unknown as {
    onunhandledrejection?: ((e: { reason: unknown }) => void) | null;
    addEventListener?: (type: string, fn: (e: { reason: unknown }) => void) => void;
  };
  const onRejection = (e: { reason: unknown }) => {
    reportError(e?.reason ?? "unhandledrejection", {
      isFatal: false,
      extra: { type: "unhandledrejection" },
    });
  };
  if (typeof g.addEventListener === "function") {
    try {
      g.addEventListener("unhandledrejection", onRejection);
    } catch {

    }
  }
}
