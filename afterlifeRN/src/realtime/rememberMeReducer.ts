

export interface RememberMeState {

  identified: boolean;

  sheetOpen: boolean;
}

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
  return { identified: true, sheetOpen: false };
}

function next(state: RememberMeState, event: RememberMeEvent): RememberMeState {
  switch (event.type) {
    case "UNKNOWN_FACE":

      if (!state.identified) return state;
      return { identified: false, sheetOpen: true };

    case "OPEN_SHEET":

      return { ...state, sheetOpen: true };

    case "DISMISS":
      return { ...state, sheetOpen: false };

    case "KNOWN_FACE":

      if (!event.named) return next(state, { type: "UNKNOWN_FACE" });
      return { identified: true, sheetOpen: false };

    case "ENROLLED":
      return { identified: true, sheetOpen: false };

    default:
      return state;
  }
}

export function rememberMeReducer(
  state: RememberMeState,
  event: RememberMeEvent,
): { state: RememberMeState; actions: RememberMeAction[] } {
  const s = next(state, event);

  const actions: RememberMeAction[] =
    s.sheetOpen === state.sheetOpen
      ? []
      : s.sheetOpen
        ? [{ type: "HALT_CONVERSATION" }]
        : [{ type: "RESUME_CONVERSATION" }];
  return { state: s, actions };
}
