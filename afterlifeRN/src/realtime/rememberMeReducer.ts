

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

  differentPersonStreak: number;
}

export const v_575cf8 = 60_000;

export const v_e6be56 = 90_000;

export const v_fb3fee = 5;

export const v_0e9727 = 5;

export const v_a4afab = 0.7;

export const v_a5c955 = 60_000;

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
  };
}

export function v_f8761c(v_fd5f43): boolean {
  return v_fd5f43.mode === "pending";
}

export function v_4f0ecc(v_fd5f43): boolean {
  return v_fd5f43.promptRegister;
}

export function v_b94941(v_fd5f43): boolean {
  return v_fd5f43.mode === "pending" || v_fd5f43.sheetOpen;
}

function v_60164c(
  v_fd5f43,
  v_67e77e,

  v_8e790d = false,
): RememberMeState {
  return {
    ...v_fd5f43,
    mode: "pending",
    personId: null,
    sheetOpen: false, 
    promptRegister: v_8e790d,
    graceSinceMs: null,
    graceHadActivity: false,
    mentionName: false,
    lastNotifyUnknownMs: v_67e77e,
    pendingSwitch: null,
  };
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

    unknownStreak: 0,

    differentPersonStreak: 0,
    lastConfirmedPerson: v_dca8b5,
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

        const v_ebdcca = v_b6e533.recentlySeen[v_d48baf.personId];
        const v_c29192 = v_ebdcca != null && v_67e77e - v_ebdcca < v_e6be56;
        const v_f1ed8d = v_ebdcca == null;
        return {
          state: { ...v_9638ca(v_b6e533, v_d48baf.personId, v_d48baf.displayName), recentlySeen: v_3d04cc },
          actions: [
            { type: "MIC_ON" },
            {
              type: "NOTIFY_CONFIRMED",
              personId: v_d48baf.personId,
              displayName: v_d48baf.displayName,

              rejoin: !v_c29192 && !v_f1ed8d,
              mentionName: v_c29192, 
            },
          ],
        };
      }

      if (v_9bb925) {
        if (v_b6e533.mode === "grace") {

          return {
            state: { ...v_9638ca(v_b6e533, v_d48baf.personId, v_d48baf.displayName), recentlySeen: v_3d04cc },
            actions: [
              {
                type: "NOTIFY_CONFIRMED",
                personId: v_d48baf.personId,
                displayName: v_d48baf.displayName,
                rejoin: false,
                mentionName: true,
              },
            ],
          };
        }

        return { state: { ...v_b6e533, recentlySeen: v_3d04cc }, actions: [] };
      }

      return {
        state: { ...v_9638ca(v_b6e533, v_d48baf.personId, v_d48baf.displayName), recentlySeen: v_3d04cc },
        actions: [

          ...(v_d48baf.cloneSpeaking ? [{ type: "INTERRUPT_TTS" } as RememberMeAction] : []),
          {
            type: "NOTIFY_CONFIRMED",
            personId: v_d48baf.personId,
            displayName: v_d48baf.displayName,

            rejoin: v_b6e533.personId !== null && v_b6e533.personId !== v_d48baf.personId,
          },
        ],
      };
    }

    case "MATCH_UNKNOWN": {

      if (v_865ed9) return { state: v_b6e533, actions: [] };

      const v_6da077 = 0.55;
      if (!v_d48baf.score || v_d48baf.score < v_6da077 || v_d48baf.topPersonId == null) {

        const v_1210b5 = v_b6e533.unknownStreak + 1;
        const v_f340bd = 3;
        const v_aa5f6b = v_b6e533.personId !== null;
        const v_793d69 = (v_d48baf.hasFace ?? false) === true; 
        const v_8cd7d6 =
          (v_aa5f6b || v_793d69) &&
          v_1210b5 >= v_f340bd &&
          !v_b6e533.dismissedPromptInCall &&
          !v_b6e533.promptRegister; 
        if (v_8cd7d6) {

          const v_7e8d96 = v_b6e533.lastConfirmedPerson !== null || v_793d69;
          return {
            state: {
              ...v_60164c(v_b6e533, v_67e77e, v_7e8d96),
              unknownStreak: v_1210b5,
              differentPersonStreak: 0,
            },
            actions: [{ type: "MIC_OFF" }, { type: "NOTIFY_UNKNOWN" }],
          };
        }
        return {
          state: { ...v_b6e533, unknownStreak: v_1210b5, differentPersonStreak: 0 },
          actions: [],
        };
      }
      const v_00d284 = v_b6e533.personId ?? v_b6e533.lastConfirmedPerson?.personId ?? null;

      const v_78d181 =
        v_00d284 != null && v_d48baf.topPersonId !== v_00d284;

      const v_913e36 =
        typeof v_d48baf.landmarkVsRef === "number" && v_d48baf.landmarkVsRef >= v_a4afab;
      if (v_78d181 && v_913e36) {
        return {
          state: {
            ...v_b6e533,
            unknownStreak: v_b6e533.unknownStreak + 1,
            differentPersonStreak: 0, 
          },
          actions: [],
        };
      }

      const v_46793e = v_78d181
        ? v_b6e533.differentPersonStreak + 1
        : 0;
      const v_950bbe = v_b6e533.unknownStreak + 1;
      const v_29bced =
        v_78d181 &&
        v_46793e >= v_0e9727 &&
        !v_b6e533.dismissedPromptInCall;

      if (v_b6e533.mode === "pending") {
        const v_3459a5 =
          !v_b6e533.promptRegister && v_29bced
            ? { promptRegister: true }
            : {};
        if (
          v_b6e533.lastNotifyUnknownMs !== null &&
          v_67e77e - v_b6e533.lastNotifyUnknownMs < v_059bf8
        ) {
          return {
            state: {
              ...v_b6e533,
              unknownStreak: v_950bbe,
              differentPersonStreak: v_46793e,
              ...v_3459a5,
            },
            actions: [],
          };
        }
        return {
          state: {
            ...v_b6e533,
            unknownStreak: v_950bbe,
            differentPersonStreak: v_46793e,
            lastNotifyUnknownMs: v_67e77e,
            ...v_3459a5,
          },
          actions: [{ type: "NOTIFY_UNKNOWN" }],
        };
      }

      if (v_b6e533.mode === "grace") {
        if (v_29bced) {
          const v_7e8d96 = v_b6e533.lastConfirmedPerson !== null;
          return {
            state: {
              ...v_60164c(v_b6e533, v_67e77e, v_7e8d96),
              unknownStreak: v_950bbe,
              differentPersonStreak: v_46793e,
            },
            actions: [{ type: "MIC_OFF" }, { type: "NOTIFY_UNKNOWN" }],
          };
        }
        return {
          state: {
            ...v_b6e533,
            unknownStreak: v_950bbe,
            differentPersonStreak: v_46793e,
          },
          actions: [],
        };
      }

      const v_27f93f = !v_b6e533.dismissedPromptInCall;
      if (v_b6e533.personId === null) {
        if (v_29bced) {
          return {
            state: {
              ...v_60164c(v_b6e533, v_67e77e, v_27f93f),
              unknownStreak: v_950bbe,
              differentPersonStreak: v_46793e,
            },
            actions: [{ type: "MIC_OFF" }, { type: "NOTIFY_UNKNOWN" }],
          };
        }

        return {
          state: {
            ...v_b6e533,
            unknownStreak: v_950bbe,
            differentPersonStreak: v_46793e,
          },
          actions: [],
        };
      }

      if (v_29bced) {
        const v_7e8d96 = v_b6e533.lastConfirmedPerson !== null;
        return {
          state: {
            ...v_60164c(v_b6e533, v_67e77e, v_7e8d96),
            unknownStreak: v_950bbe,
            differentPersonStreak: v_46793e,
          },
          actions: [{ type: "MIC_OFF" }, { type: "NOTIFY_UNKNOWN" }],
        };
      }
      return {
        state: {
          ...v_b6e533,
          unknownStreak: v_950bbe,
          differentPersonStreak: v_46793e,
          mode: "grace",
          graceSinceMs: v_67e77e,
          graceHadActivity: false,
          pendingSwitch: null,
        },
        actions: [],
      };
    }

    case "ACTIVITY": {
      if (v_b6e533.mode !== "grace" || v_b6e533.graceHadActivity) return { state: v_b6e533, actions: [] };
      return { state: { ...v_b6e533, graceHadActivity: true }, actions: [] };
    }

    case "TICK": {
      if (v_b6e533.mode !== "grace" || v_b6e533.graceSinceMs === null) {
        return { state: v_b6e533, actions: [] };
      }
      if (v_67e77e - v_b6e533.graceSinceMs < v_575cf8) return { state: v_b6e533, actions: [] };

      if (!v_b6e533.graceHadActivity) {

        return { state: v_b6e533, actions: [{ type: "END_CALL" }] };
      }

      const v_ba5475 =
        v_b6e533.lastConfirmedPerson !== null && !v_b6e533.dismissedPromptInCall;
      return {
        state: v_60164c(v_b6e533, v_67e77e, v_ba5475),
        actions: [{ type: "MIC_OFF" }, { type: "NOTIFY_UNKNOWN" }],
      };
    }

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

    case "ENROLLED":
      return {
        state: {
          ...v_178dfb(),
          enrollGraceUntilMs: v_67e77e + v_a5c955,
        },
        actions: v_b6e533.mode === "pending" || v_b6e533.sheetOpen ? [{ type: "MIC_ON" }] : [],
      };

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
