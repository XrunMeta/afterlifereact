

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

  lastConfirmedPerson: { personId: number; displayName: string | null } | null;

  dismissedPromptInCall: boolean;

  unknownStreak: number;
}

export const GRACE_HOLD_MS = 60_000;

export const RECENT_SEEN_MS = 90_000;

export const UNKNOWN_ESCALATE_STREAK = 2;

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

  | { type: "MATCH_UNKNOWN"; score?: number; topPersonId?: number | null }

  | { type: "ACTIVITY" }

  | { type: "CLONE_SPEECH_END" }

  | { type: "TICK" }

  | { type: "DISMISS" }

  | { type: "OPEN_SHEET" }

  | { type: "ENROLLED" }

  | { type: "CONFIRM_PROMPT" }

  | { type: "DISMISS_PROMPT" }

  | { type: "CONFIRM_SAME_PERSON" }

  | { type: "DISMISS_LATER" };

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
    lastConfirmedPerson: null,
    dismissedPromptInCall: false,
    unknownStreak: 0,
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

function enterIdentified(
  s: RememberMeState,
  personId: number,
  displayName?: string | null,
): RememberMeState {

  const lastConfirmedPerson =
    displayName !== undefined
      ? { personId, displayName }
      : s.lastConfirmedPerson;
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

    unknownStreak: 0,
    lastConfirmedPerson,
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
          state: { ...enterIdentified(state, event.personId, event.displayName), recentlySeen: updatedRecent },
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
            state: { ...enterIdentified(state, event.personId, event.displayName), recentlySeen: updatedRecent },
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
        state: { ...enterIdentified(state, event.personId, event.displayName), recentlySeen: updatedRecent },
        actions: [

          ...(event.cloneSpeaking ? [{ type: "INTERRUPT_TTS" } as RememberMeAction] : []),
          {
            type: "NOTIFY_CONFIRMED",
            personId: event.personId,
            displayName: event.displayName,

            rejoin: state.personId !== null && state.personId !== event.personId,
          },
        ],
      };
    }

    case "MATCH_UNKNOWN": {

      if (inEnrollGrace) return { state, actions: [] };

      if ((event.score ?? 0) <= 0) return { state, actions: [] };

      const refPersonId = state.personId ?? state.lastConfirmedPerson?.personId ?? null;
      if (
        event.topPersonId != null &&
        refPersonId != null &&
        event.topPersonId === refPersonId
      ) {

        return { state, actions: [] };
      }
      const differentPersonImmediate =
        event.topPersonId != null &&
        refPersonId != null &&
        event.topPersonId !== refPersonId;

      const newStreak = state.unknownStreak + 1;
      const shouldPrompt =
        (differentPersonImmediate || newStreak >= UNKNOWN_ESCALATE_STREAK) &&
        !state.dismissedPromptInCall;

      if (state.mode === "pending") {
        const promoted =
          !state.promptRegister && shouldPrompt
            ? { promptRegister: true }
            : {};
        if (
          state.lastNotifyUnknownMs !== null &&
          nowMs - state.lastNotifyUnknownMs < UNKNOWN_RENOTIFY_MS
        ) {
          return {
            state: { ...state, unknownStreak: newStreak, ...promoted },
            actions: [],
          };
        }
        return {
          state: {
            ...state,
            unknownStreak: newStreak,
            lastNotifyUnknownMs: nowMs,
            ...promoted,
          },
          actions: [{ type: "NOTIFY_UNKNOWN" }],
        };
      }

      if (state.mode === "grace") {
        if (shouldPrompt) {
          const promptWhenLcp = state.lastConfirmedPerson !== null;
          return {
            state: {
              ...enterPending(state, nowMs, promptWhenLcp),
              unknownStreak: newStreak,
            },
            actions: [{ type: "MIC_OFF" }, { type: "NOTIFY_UNKNOWN" }],
          };
        }
        return {
          state: { ...state, unknownStreak: newStreak },
          actions: [],
        };
      }

      const promptFresh = !state.dismissedPromptInCall;
      if (state.personId === null) {
        if (shouldPrompt) {
          return {
            state: {
              ...enterPending(state, nowMs, promptFresh),
              unknownStreak: newStreak,
            },
            actions: [{ type: "MIC_OFF" }, { type: "NOTIFY_UNKNOWN" }],
          };
        }

        return {
          state: { ...state, unknownStreak: newStreak },
          actions: [],
        };
      }

      if (shouldPrompt) {
        const promptWhenLcp = state.lastConfirmedPerson !== null;
        return {
          state: {
            ...enterPending(state, nowMs, promptWhenLcp),
            unknownStreak: newStreak,
          },
          actions: [{ type: "MIC_OFF" }, { type: "NOTIFY_UNKNOWN" }],
        };
      }
      return {
        state: {
          ...state,
          unknownStreak: newStreak,
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

      const promptOnTick =
        state.lastConfirmedPerson !== null && !state.dismissedPromptInCall;
      return {
        state: enterPending(state, nowMs, promptOnTick),
        actions: [{ type: "MIC_OFF" }, { type: "NOTIFY_UNKNOWN" }],
      };
    }

    case "CLONE_SPEECH_END": {
      const sw = state.pendingSwitch;
      if (!sw) return { state, actions: [] };
      return {
        state: enterIdentified(state, sw.personId, sw.displayName),
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

    case "CONFIRM_SAME_PERSON": {

      if (!state.promptRegister) return { state, actions: [] };
      const restore = state.lastConfirmedPerson;
      if (restore == null) {

        return {
          state: {
            ...state,
            promptRegister: false,
            dismissedPromptInCall: true,
            mode: "identified", 
            personId: null,
          },
          actions: [{ type: "MIC_ON" }],
        };
      }
      return {
        state: {
          ...enterIdentified(state, restore.personId, restore.displayName),
          promptRegister: false,
          dismissedPromptInCall: true,
        },
        actions: [{ type: "MIC_ON" }],
      };
    }

    case "DISMISS_LATER":

      if (!state.promptRegister) return { state, actions: [] };
      return {
        state: {
          ...state,
          promptRegister: false,
          dismissedPromptInCall: true,
          mode: "identified",
          personId: null,
        },
        actions: [{ type: "MIC_ON" }],
      };

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
