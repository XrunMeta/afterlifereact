

export interface RememberMeState {

  identified: boolean;

  sheetOpen: boolean;

  graceUntilMs: number | null;
}

export const ENROLL_GRACE_MS = 60_000;

export type RememberMeEvent =

  | { type: "UNKNOWN_FACE" }

  | { type: "KNOWN_FACE"; named: boolean }

  | { type: "DISMISS" }

  | { type: "OPEN_SHEET" }

  | { type: "ENROLLED" };

export type RememberMeAction =
  | { type: "HALT_CONVERSATION" }
  | { type: "RESUME_CONVERSATION" };

export function initRememberMeState(): RememberMeState {
  return { identified: true, sheetOpen: false, graceUntilMs: null };
}

function next(
  state: RememberMeState,
  event: RememberMeEvent,
  nowMs: number,
): RememberMeState {
  switch (event.type) {
    case "UNKNOWN_FACE":

      if (state.graceUntilMs !== null && nowMs < state.graceUntilMs) return state;

      if (!state.identified) return state;
      return { ...state, identified: false, sheetOpen: true };

    case "OPEN_SHEET":

      return { ...state, sheetOpen: true };

    case "DISMISS":
      return { ...state, sheetOpen: false };

    case "KNOWN_FACE":

      if (!event.named) return next(state, { type: "UNKNOWN_FACE" }, nowMs);

      return { identified: true, sheetOpen: false, graceUntilMs: null };

    case "ENROLLED":
      return { identified: true, sheetOpen: false, graceUntilMs: nowMs + ENROLL_GRACE_MS };

    default:
      return state;
  }
}

export function rememberMeReducer(
  state: RememberMeState,
  event: RememberMeEvent,
  nowMs: number,
): { state: RememberMeState; actions: RememberMeAction[] } {
  const s = next(state, event, nowMs);

  const actions: RememberMeAction[] =
    s.sheetOpen === state.sheetOpen
      ? []
      : s.sheetOpen
        ? [{ type: "HALT_CONVERSATION" }]
        : [{ type: "RESUME_CONVERSATION" }];
  return { state: s, actions };
}
