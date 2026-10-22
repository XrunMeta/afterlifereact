

import type { v_516d40 } from "../face/faceTurnJudge";

export type RememberMeMode = "identified" | "grace" | "pending";

export interface RememberMeState {
  mode: RememberMeMode;

  personId: number | null;

  sheetOpen: boolean;

  promptRegister: boolean;

  graceSinceMs: number | null;

  graceHadActivity: boolean;

  absentSinceMs: number | null;

  lastActivityMs: number | null;

  awayEndCallSent: boolean;

  mentionName: boolean;

  enrollGraceUntilMs: number | null;

  lastNotifyUnknownMs: number | null;

  pendingSwitch: { personId: number; displayName: string | null } | null;

  recentlySeen: Record<number, number>;

  lastConfirmedPerson: { personId: number; displayName: string | null } | null;

  dismissedPromptInCall: boolean;

  unknownStreak: number;

  differentPersonStreak: number;

  serverSpeakerCleared: boolean;
}

export const v_575cf8 = 60_000;

export const v_6d5c2a = 60_000;

export const v_e6be56 = 90_000;

export const v_a5c955 = 120_000;

export const v_059bf8 = 60_000;

export type RememberMeEvent =

  | {
      type: "MATCH_KNOWN";
      personId: number;
      displayName: string | null;
      named: boolean;

      cloneSpeaking: boolean;
    }

  | {
      type: "MATCH_UNKNOWN";
      score?: number;
      topPersonId?: number | null;
      landmarkVsRef?: number | null;
      hasFace?: boolean;
    }

  | { type: "ACTIVITY" }

  | { type: "TURN_VERDICT"; verdict: v_516d40; displayName: string | null; nowMs: number }

  | {
      type: "WHO_RETRY_RESULT";
      personId: number | null;
      displayName: string | null;
      selfMatch: boolean;
      nowMs: number;
    }

  | { type: "FACE_PRESENCE"; present: boolean; nowMs: number }

  | { type: "MULTI_FACE_SENT" }

  | { type: "CLONE_SPEECH_END" }

  | { type: "TICK" }

  | { type: "DISMISS" }

  | { type: "OPEN_SHEET" }

  | { type: "ENROLLED"; personId?: number; displayName?: string | null }

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

export function v_178dfb(): RememberMeState {
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
    differentPersonStreak: 0,
    serverSpeakerCleared: false,
    absentSinceMs: null,
    lastActivityMs: null,
    awayEndCallSent: false,
  };
}

export function v_f8761c(v_fd5f43): boolean {
  return v_fd5f43.mode === "pending";
}

export function v_4f0ecc(v_fd5f43): boolean {
  return v_fd5f43.promptRegister;
}

export function v_b94941(v_fd5f43): boolean {
  return v_fd5f43.mode === "pending" || v_fd5f43.sheetOpen || v_fd5f43.promptRegister;
}

function v_9638ca(
  v_fd5f43,
  v_ca1ec5,
  v_8a1355,
): RememberMeState {

  const v_dca8b5 =
    v_8a1355 !== undefined
      ? { personId: v_ca1ec5, displayName: v_8a1355 }
      : v_fd5f43.lastConfirmedPerson;
  return {
    ...v_fd5f43,
    mode: "identified",
    personId: v_ca1ec5,
    sheetOpen: false,
    graceSinceMs: null,
    graceHadActivity: false,
    mentionName: false,

    enrollGraceUntilMs: null,

    lastNotifyUnknownMs: null,
    pendingSwitch: null,

    serverSpeakerCleared: false,
    lastConfirmedPerson: v_dca8b5,
  };
}

function v_333cc2(
  v_b6e533,
  v_ca1ec5,
  v_8a1355,
  v_67e77e,
): { state: RememberMeState; actions: RememberMeAction[] } {
  const v_ebdcca = v_b6e533.recentlySeen[v_ca1ec5];
  const v_c29192 = v_ebdcca != null && v_67e77e - v_ebdcca < v_e6be56;
  const v_f1ed8d = v_ebdcca == null;
  const v_612414 = {
    ...v_9638ca(v_b6e533, v_ca1ec5, v_8a1355),
    recentlySeen: { ...v_b6e533.recentlySeen, [v_ca1ec5]: v_67e77e },
  };
  const v_1065f7 = v_b94941(v_b6e533) && !v_b94941(v_612414);
  return {
    state: v_612414,
    actions: [
      ...(v_1065f7 ? [{ type: "MIC_ON" } as RememberMeAction] : []),
      {
        type: "NOTIFY_CONFIRMED",
        personId: v_ca1ec5,
        displayName: v_8a1355,
        rejoin: !v_c29192 && !v_f1ed8d,
        mentionName: v_c29192,
      },
    ],
  };
}

function v_60164c(v_fd5f43, v_67e77e, v_b1b8d0): RememberMeState {
  return {
    ...v_fd5f43,
    mode: "pending",
    personId: null,
    promptRegister: v_b1b8d0,
    graceSinceMs: null,
    graceHadActivity: false,
    mentionName: false,
    lastNotifyUnknownMs: v_67e77e,
    pendingSwitch: null,
  };
}

function v_192740(
  v_b6e533,
  v_67e77e,
): { state: RememberMeState; actions: RememberMeAction[] } {
  const v_b1b8d0 = v_b6e533.promptRegister || !v_b6e533.sheetOpen;
  if (v_b6e533.mode === "pending" && v_b6e533.personId === null) {
    if (v_b1b8d0 === v_b6e533.promptRegister) return { state: v_b6e533, actions: [] };

    return { state: { ...v_b6e533, promptRegister: v_b1b8d0 }, actions: [] };
  }
  const v_18128c = !v_b94941(v_b6e533);
  return {
    state: v_60164c(v_b6e533, v_67e77e, v_b1b8d0),
    actions: [
      ...(v_18128c ? [{ type: "MIC_OFF" } as RememberMeAction] : []),
      { type: "NOTIFY_UNKNOWN" },
    ],
  };
}

function v_d44fba(
  v_b6e533,
  v_67e77e,
): { state: RememberMeState; actions: RememberMeAction[] } {
  if (v_b6e533.personId === null) return { state: v_b6e533, actions: [] };
  return {
    state: {
      ...v_b6e533,
      mode: "identified",
      personId: null,
      mentionName: false,
      lastNotifyUnknownMs: v_67e77e,
      pendingSwitch: null,
    },
    actions: [{ type: "NOTIFY_UNKNOWN" }],
  };
}

function v_a448ad(
  v_b6e533,
  v_d48baf,
  v_67e77e,
): { state: RememberMeState; actions: RememberMeAction[] } {
  const v_865ed9 =
    v_b6e533.enrollGraceUntilMs !== null && v_67e77e < v_b6e533.enrollGraceUntilMs;

  switch (v_d48baf.type) {
    case "MATCH_KNOWN": {

      if (!v_d48baf.named) return v_a448ad(v_b6e533, { type: "MATCH_UNKNOWN" }, v_67e77e);

      const v_9bb925 = v_b6e533.personId === v_d48baf.personId;

      const v_3d04cc = { ...v_b6e533.recentlySeen, [v_d48baf.personId]: v_67e77e };

      if (v_b6e533.mode === "pending") {
        return v_333cc2(v_b6e533, v_d48baf.personId, v_d48baf.displayName, v_67e77e);
      }

      if (v_9bb925) {

        if (v_b6e533.serverSpeakerCleared) {
          return {
            state: {
              ...v_b6e533,
              recentlySeen: v_3d04cc,
              serverSpeakerCleared: false,
              enrollGraceUntilMs: null,
            },
            actions: [
              {
                type: "NOTIFY_CONFIRMED",
                personId: v_d48baf.personId,
                displayName: v_d48baf.displayName,
                rejoin: false,
              },
            ],
          };
        }

        return {
          state: { ...v_b6e533, recentlySeen: v_3d04cc, enrollGraceUntilMs: null },
          actions: [],
        };
      }

      if (v_b6e533.personId !== null) return { state: v_b6e533, actions: [] };

      return {
        state: { ...v_9638ca(v_b6e533, v_d48baf.personId, v_d48baf.displayName), recentlySeen: v_3d04cc },
        actions: [
          {
            type: "NOTIFY_CONFIRMED",
            personId: v_d48baf.personId,
            displayName: v_d48baf.displayName,
            rejoin: false,
          },
        ],
      };
    }

    case "MATCH_UNKNOWN": {

      if (v_865ed9) return { state: v_b6e533, actions: [] };

      if (v_b6e533.mode !== "pending") return { state: v_b6e533, actions: [] };

      if (
        v_b6e533.lastNotifyUnknownMs !== null &&
        v_67e77e - v_b6e533.lastNotifyUnknownMs < v_059bf8
      ) {
        return { state: v_b6e533, actions: [] };
      }
      return {
        state: { ...v_b6e533, lastNotifyUnknownMs: v_67e77e },
        actions: [{ type: "NOTIFY_UNKNOWN" }],
      };
    }

    case "TURN_VERDICT": {
      const v_81e2ef = v_d48baf.verdict;
      if (v_81e2ef.kind === "unknown") {

        if (v_865ed9) return { state: v_b6e533, actions: [] };

        if (v_b6e533.dismissedPromptInCall) return v_d44fba(v_b6e533, v_67e77e);
        return v_192740(v_b6e533, v_67e77e);
      }
      if (v_81e2ef.kind === "switch") {

        if (v_81e2ef.personId == null || v_81e2ef.personId === v_b6e533.personId) return { state: v_b6e533, actions: [] };
        return v_333cc2(v_b6e533, v_81e2ef.personId, v_d48baf.displayName, v_67e77e);
      }

      return { state: v_b6e533, actions: [] };
    }

    case "WHO_RETRY_RESULT": {

      if (v_d48baf.personId != null && !v_d48baf.selfMatch) {
        return v_333cc2(v_b6e533, v_d48baf.personId, v_d48baf.displayName, v_67e77e);
      }

      if (v_865ed9) return { state: v_b6e533, actions: [] };
      return v_192740(v_b6e533, v_67e77e);
    }

    case "FACE_PRESENCE": {
      if (v_d48baf.present) {
        if (v_b6e533.absentSinceMs === null && !v_b6e533.awayEndCallSent) return { state: v_b6e533, actions: [] };
        return { state: { ...v_b6e533, absentSinceMs: null, awayEndCallSent: false }, actions: [] };
      }

      if (v_b6e533.absentSinceMs !== null) return { state: v_b6e533, actions: [] };
      return { state: { ...v_b6e533, absentSinceMs: v_67e77e }, actions: [] };
    }

    case "ACTIVITY":
      return { state: { ...v_b6e533, lastActivityMs: v_67e77e }, actions: [] };

    case "TICK": {
      if (v_b6e533.absentSinceMs === null || v_b6e533.awayEndCallSent) return { state: v_b6e533, actions: [] };

      const v_8738be = Math.max(v_b6e533.absentSinceMs, v_b6e533.lastActivityMs ?? 0);
      if (v_67e77e - v_8738be < v_6d5c2a) return { state: v_b6e533, actions: [] };

      return { state: { ...v_b6e533, awayEndCallSent: true }, actions: [{ type: "END_CALL" }] };
    }

    case "MULTI_FACE_SENT":

      if (v_b6e533.personId === null || v_b6e533.mode === "pending") return { state: v_b6e533, actions: [] };
      return { state: { ...v_b6e533, serverSpeakerCleared: true }, actions: [] };

    case "CLONE_SPEECH_END": {
      const v_714e04 = v_b6e533.pendingSwitch;
      if (!v_714e04) return { state: v_b6e533, actions: [] };
      return {
        state: v_9638ca(v_b6e533, v_714e04.personId, v_714e04.displayName),
        actions: [
          {
            type: "NOTIFY_CONFIRMED",
            personId: v_714e04.personId,
            displayName: v_714e04.displayName,
            rejoin: true,
          },
        ],
      };
    }

    case "OPEN_SHEET":

      if (v_b6e533.sheetOpen) return { state: v_b6e533, actions: [] };
      return { state: { ...v_b6e533, sheetOpen: true }, actions: [{ type: "MIC_OFF" }] };

    case "DISMISS": {
      if (!v_b6e533.sheetOpen) return { state: v_b6e533, actions: [] };
      const v_fd5f43 = { ...v_b6e533, sheetOpen: false };

      if (v_fd5f43.mode === "pending") return { state: v_fd5f43, actions: [] };
      return { state: v_fd5f43, actions: [{ type: "MIC_ON" }] };
    }

    case "ENROLLED": {
      const v_694b25 = { ...v_178dfb(), enrollGraceUntilMs: v_67e77e + v_a5c955 };

      const v_570847 =
        v_d48baf.personId != null
          ? {
              ...v_9638ca(v_694b25, v_d48baf.personId, v_d48baf.displayName ?? null),
              recentlySeen: { [v_d48baf.personId]: v_67e77e },

              enrollGraceUntilMs: v_694b25.enrollGraceUntilMs,
            }
          : v_694b25;
      return {
        state: v_570847,
        actions: v_b6e533.mode === "pending" || v_b6e533.sheetOpen ? [{ type: "MIC_ON" }] : [],
      };
    }

    case "CONFIRM_PROMPT":

      if (!v_b6e533.promptRegister) return { state: v_b6e533, actions: [] };
      return { state: { ...v_b6e533, promptRegister: false }, actions: [] };

    case "DISMISS_PROMPT":

      if (!v_b6e533.promptRegister) return { state: v_b6e533, actions: [] };
      return { state: { ...v_b6e533, promptRegister: false }, actions: [] };

    case "CONFIRM_SAME_PERSON": {

      if (!v_b6e533.promptRegister) return { state: v_b6e533, actions: [] };
      const v_d2d3fb = v_b6e533.lastConfirmedPerson;
      if (v_d2d3fb == null) {

        return {
          state: {
            ...v_b6e533,
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
          ...v_9638ca(v_b6e533, v_d2d3fb.personId, v_d2d3fb.displayName),
          promptRegister: false,
          dismissedPromptInCall: true,
        },
        actions: [{ type: "MIC_ON" }],
      };
    }

    case "DISMISS_LATER":

      if (!v_b6e533.promptRegister) return { state: v_b6e533, actions: [] };

      if (v_b6e533.mode === "identified" && v_b6e533.personId !== null) {
        return {
          state: { ...v_b6e533, promptRegister: false, dismissedPromptInCall: true },
          actions: [{ type: "MIC_ON" }],
        };
      }
      return {
        state: {
          ...v_b6e533,
          promptRegister: false,
          dismissedPromptInCall: true,
          mode: "identified",
          personId: null,
        },
        actions: [{ type: "MIC_ON" }],
      };

    default:
      return { state: v_b6e533, actions: [] };
  }
}

export function v_706a74(
  v_b6e533,
  v_d48baf,
  v_67e77e,
): { state: RememberMeState; actions: RememberMeAction[] } {
  return v_a448ad(v_b6e533, v_d48baf, v_67e77e);
}
