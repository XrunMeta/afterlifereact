

export type RememberMeMode = "identified" | "grace" | "pending";

export interface RememberMeState {
  mode: RememberMeMode;

  personId: number | null;

  sheetOpen: boolean;

  graceSinceMs: number | null;

  graceHadActivity: boolean;

  mentionName: boolean;

  enrollGraceUntilMs: number | null;

  lastNotifyUnknownMs: number | null;

  pendingSwitch: { personId: number; displayName: string | null } | null;
}

export const v_575cf8 = 30_000;

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

  | { type: "MATCH_UNKNOWN" }

  | { type: "ACTIVITY" }

  | { type: "CLONE_SPEECH_END" }

  | { type: "TICK" }

  | { type: "DISMISS" }

  | { type: "OPEN_SHEET" }

  | { type: "ENROLLED" };

export type RememberMeAction =

  | { type: "MIC_OFF" }

  | { type: "MIC_ON" }

  | { type: "END_CALL" }

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
    graceSinceMs: null,
    graceHadActivity: false,
    mentionName: false,
    enrollGraceUntilMs: null,
    lastNotifyUnknownMs: null,
    pendingSwitch: null,
  };
}

export function v_f8761c(v_fd5f43): boolean {
  return v_fd5f43.mode === "pending";
}

export function v_b94941(v_fd5f43): boolean {
  return v_fd5f43.mode === "pending" || v_fd5f43.sheetOpen;
}

function v_60164c(v_fd5f43, v_67e77e): RememberMeState {
  return {
    ...v_fd5f43,
    mode: "pending",
    personId: null,
    sheetOpen: true,
    graceSinceMs: null,
    graceHadActivity: false,
    mentionName: false,
    lastNotifyUnknownMs: v_67e77e,
    pendingSwitch: null,
  };
}

function v_9638ca(v_fd5f43, v_ca1ec5): RememberMeState {
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

      if (v_b6e533.mode === "pending") {
        return {
          state: v_9638ca(v_b6e533, v_d48baf.personId),
          actions: [
            { type: "MIC_ON" },
            {
              type: "NOTIFY_CONFIRMED",
              personId: v_d48baf.personId,
              displayName: v_d48baf.displayName,
              rejoin: true,
            },
          ],
        };
      }

      if (v_9bb925) {
        if (v_b6e533.mode === "grace") {

          return {
            state: v_9638ca(v_b6e533, v_d48baf.personId),
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
        return { state: v_b6e533, actions: [] };
      }

      if (v_d48baf.cloneSpeaking) {
        return {
          state: {
            ...v_b6e533,
            pendingSwitch: { personId: v_d48baf.personId, displayName: v_d48baf.displayName },
          },
          actions: [],
        };
      }
      return {
        state: v_9638ca(v_b6e533, v_d48baf.personId),
        actions: [
          {
            type: "NOTIFY_CONFIRMED",
            personId: v_d48baf.personId,
            displayName: v_d48baf.displayName,

            rejoin: v_b6e533.personId !== null,
          },
        ],
      };
    }

    case "MATCH_UNKNOWN": {

      if (v_865ed9) return { state: v_b6e533, actions: [] };

      if (v_b6e533.mode === "grace") return { state: v_b6e533, actions: [] };

      if (v_b6e533.mode === "pending") {
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

      if (v_b6e533.personId === null) {
        return {
          state: v_60164c(v_b6e533, v_67e77e),
          actions: [{ type: "MIC_OFF" }, { type: "NOTIFY_UNKNOWN" }],
        };
      }
      return {
        state: {
          ...v_b6e533,
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
      return {
        state: v_60164c(v_b6e533, v_67e77e),
        actions: [{ type: "MIC_OFF" }, { type: "NOTIFY_UNKNOWN" }],
      };
    }

    case "CLONE_SPEECH_END": {
      const v_714e04 = v_b6e533.pendingSwitch;
      if (!v_714e04) return { state: v_b6e533, actions: [] };
      return {
        state: v_9638ca(v_b6e533, v_714e04.personId),
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
