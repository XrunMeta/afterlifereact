

export type RememberMeMode = "identified" | "grace" | "pending";

export interface RememberMeState {
  mode: RememberMeMode;

  personId: number | null;

  sheetOpen: boolean;

  promptRegister: boolean;

  graceSinceMs: number | null;

  graceHadActivity: boolean;

  mentionName: boolean;

  enrollGraceUntilMs: number | null;

  lastNotifyUnknownMs: number | null;

  pendingSwitch: { personId: number; displayName: string | null } | null;

  recentlySeen: Record<number, number>;
}

export const GRACE_HOLD_MS = 60_000;

export const RECENT_SEEN_MS = 90_000;

export const ENROLL_GRACE_MS = 60_000;

export const UNKNOWN_RENOTIFY_MS = 60_000;

export type RememberMeEvent =

  | {
      type: "MATCH_KNOWN";
      personId: number;
      displayName: string | null;
      named: boolean;

      cloneSpeaking: boolean;
    }

  | { type: "MATCH_UNKNOWN"; score?: number }

  | { type: "ACTIVITY" }

  | { type: "CLONE_SPEECH_END" }

  | { type: "TICK" }

  | { type: "DISMISS" }

  | { type: "OPEN_SHEET" }

  | { type: "ENROLLED" }

  | { type: "CONFIRM_PROMPT" }

  | { type: "DISMISS_PROMPT" };

export type RememberMeAction =

  | { type: "MIC_OFF" }

  | { type: "MIC_ON" }

  | { type: "END_CALL" }

  | { type: "INTERRUPT_TTS" }

  | {
      type: "NOTIFY_CONFIRMED";
      personId: number;
      displayName: string | null;
      rejoin: boolean;

      mentionName?: boolean;
    }

  | { type: "NOTIFY_UNKNOWN" };

export function initRememberMeState(): RememberMeState {
  return {
    mode: "identified",
    personId: null,
    sheetOpen: false,
    promptRegister: false,
    graceSinceMs: null,
    graceHadActivity: false,
    mentionName: false,
    enrollGraceUntilMs: null,
    lastNotifyUnknownMs: null,
    pendingSwitch: null,
    recentlySeen: {},
  };
}

export function shouldShowRememberMeButton(s: RememberMeState): boolean {
  return s.mode === "pending";
}

export function shouldShowRegisterPrompt(s: RememberMeState): boolean {
  return s.promptRegister;
}

export function shouldHoldMic(s: RememberMeState): boolean {
  return s.mode === "pending" || s.sheetOpen;
}

function enterPending(
  s: RememberMeState,
  nowMs: number,

  autoPromptRegister: boolean = false,
): RememberMeState {
  return {
    ...s,
    mode: "pending",
    personId: null,
    sheetOpen: false, 
    promptRegister: autoPromptRegister,
    graceSinceMs: null,
    graceHadActivity: false,
    mentionName: false,
    lastNotifyUnknownMs: nowMs,
    pendingSwitch: null,
  };
}

function enterIdentified(s: RememberMeState, personId: number): RememberMeState {
  return {
    ...s,
    mode: "identified",
    personId,
    sheetOpen: false,
    graceSinceMs: null,
    graceHadActivity: false,
    mentionName: false,

    enrollGraceUntilMs: null,

    lastNotifyUnknownMs: null,
    pendingSwitch: null,
  };
}

function next(
  state: RememberMeState,
  event: RememberMeEvent,
  nowMs: number,
): { state: RememberMeState; actions: RememberMeAction[] } {
  const inEnrollGrace =
    state.enrollGraceUntilMs !== null && nowMs < state.enrollGraceUntilMs;

  switch (event.type) {
    case "MATCH_KNOWN": {

      if (!event.named) return next(state, { type: "MATCH_UNKNOWN" }, nowMs);

      const same = state.personId === event.personId;

      const updatedRecent = { ...state.recentlySeen, [event.personId]: nowMs };

      if (state.mode === "pending") {

        const lastSeenMs = state.recentlySeen[event.personId];
        const recentlyKnown = lastSeenMs != null && nowMs - lastSeenMs < RECENT_SEEN_MS;
        const neverSeenBefore = lastSeenMs == null;
        return {
          state: { ...enterIdentified(state, event.personId), recentlySeen: updatedRecent },
          actions: [
            { type: "MIC_ON" },
            {
              type: "NOTIFY_CONFIRMED",
              personId: event.personId,
              displayName: event.displayName,

              rejoin: !recentlyKnown && !neverSeenBefore,
              mentionName: recentlyKnown, 
            },
          ],
        };
      }

      if (same) {
        if (state.mode === "grace") {

          return {
            state: { ...enterIdentified(state, event.personId), recentlySeen: updatedRecent },
            actions: [
              {
                type: "NOTIFY_CONFIRMED",
                personId: event.personId,
                displayName: event.displayName,
                rejoin: false,
                mentionName: true,
              },
            ],
          };
        }

        return { state: { ...state, recentlySeen: updatedRecent }, actions: [] };
      }

      return {
        state: { ...enterIdentified(state, event.personId), recentlySeen: updatedRecent },
        actions: [

          ...(event.cloneSpeaking ? [{ type: "INTERRUPT_TTS" } as RememberMeAction] : []),
          {
            type: "NOTIFY_CONFIRMED",
            personId: event.personId,
            displayName: event.displayName,

            rejoin: state.personId !== null,
          },
        ],
      };
    }

    case "MATCH_UNKNOWN": {

      if (inEnrollGrace) return { state, actions: [] };

      if (state.mode === "grace") return { state, actions: [] };

      if (state.mode === "pending") {
        if (
          state.lastNotifyUnknownMs !== null &&
          nowMs - state.lastNotifyUnknownMs < UNKNOWN_RENOTIFY_MS
        ) {
          return { state, actions: [] };
        }
        return {
          state: { ...state, lastNotifyUnknownMs: nowMs },
          actions: [{ type: "NOTIFY_UNKNOWN" }],
        };
      }

      const shouldPrompt =
        typeof event.score === "number" && event.score > 0;
      if (state.personId === null) {
        return {
          state: enterPending(state, nowMs, shouldPrompt),
          actions: [{ type: "MIC_OFF" }, { type: "NOTIFY_UNKNOWN" }],
        };
      }
      return {
        state: {
          ...state,
          mode: "grace",
          graceSinceMs: nowMs,
          graceHadActivity: false,
          pendingSwitch: null,
        },
        actions: [],
      };
    }

    case "ACTIVITY": {
      if (state.mode !== "grace" || state.graceHadActivity) return { state, actions: [] };
      return { state: { ...state, graceHadActivity: true }, actions: [] };
    }

    case "TICK": {
      if (state.mode !== "grace" || state.graceSinceMs === null) {
        return { state, actions: [] };
      }
      if (nowMs - state.graceSinceMs < GRACE_HOLD_MS) return { state, actions: [] };

      if (!state.graceHadActivity) {

        return { state, actions: [{ type: "END_CALL" }] };
      }
      return {
        state: enterPending(state, nowMs),
        actions: [{ type: "MIC_OFF" }, { type: "NOTIFY_UNKNOWN" }],
      };
    }

    case "CLONE_SPEECH_END": {
      const sw = state.pendingSwitch;
      if (!sw) return { state, actions: [] };
      return {
        state: enterIdentified(state, sw.personId),
        actions: [
          {
            type: "NOTIFY_CONFIRMED",
            personId: sw.personId,
            displayName: sw.displayName,
            rejoin: true,
          },
        ],
      };
    }

    case "OPEN_SHEET":

      if (state.sheetOpen) return { state, actions: [] };
      return { state: { ...state, sheetOpen: true }, actions: [{ type: "MIC_OFF" }] };

    case "DISMISS": {
      if (!state.sheetOpen) return { state, actions: [] };
      const s = { ...state, sheetOpen: false };

      if (s.mode === "pending") return { state: s, actions: [] };
      return { state: s, actions: [{ type: "MIC_ON" }] };
    }

    case "ENROLLED":
      return {
        state: {
          ...initRememberMeState(),
          enrollGraceUntilMs: nowMs + ENROLL_GRACE_MS,
        },
        actions: state.mode === "pending" || state.sheetOpen ? [{ type: "MIC_ON" }] : [],
      };

    case "CONFIRM_PROMPT":

      if (!state.promptRegister) return { state, actions: [] };
      return { state: { ...state, promptRegister: false }, actions: [] };

    case "DISMISS_PROMPT":

      if (!state.promptRegister) return { state, actions: [] };
      return { state: { ...state, promptRegister: false }, actions: [] };

    default:
      return { state, actions: [] };
  }
}

export function rememberMeReducer(
  state: RememberMeState,
  event: RememberMeEvent,
  nowMs: number,
): { state: RememberMeState; actions: RememberMeAction[] } {
  return next(state, event, nowMs);
}
