

export interface RememberMeState {

  identified: boolean;

  sheetOpen: boolean;

  graceUntilMs: number | null;
}

export const v_a5c955 = 60_000;

export type RememberMeEvent =

  | { type: "UNKNOWN_FACE" }

  | { type: "KNOWN_FACE"; named: boolean }

  | { type: "DISMISS" }

  | { type: "OPEN_SHEET" }

  | { type: "ENROLLED" };

export type RememberMeAction =
  | { type: "HALT_CONVERSATION" }
  | { type: "RESUME_CONVERSATION" };

export function v_178dfb(): RememberMeState {
  return { identified: true, sheetOpen: false, graceUntilMs: null };
}

function v_a448ad(
  v_b6e533,
  v_d48baf,
  v_67e77e,
): RememberMeState {
  switch (v_d48baf.type) {
    case "UNKNOWN_FACE":

      if (v_b6e533.graceUntilMs !== null && v_67e77e < v_b6e533.graceUntilMs) return v_b6e533;

      if (!v_b6e533.identified) return v_b6e533;
      return { ...v_b6e533, identified: false, sheetOpen: true };

    case "OPEN_SHEET":

      return { ...v_b6e533, sheetOpen: true };

    case "DISMISS":
      return { ...v_b6e533, sheetOpen: false };

    case "KNOWN_FACE":

      if (!v_d48baf.named) return v_a448ad(v_b6e533, { type: "UNKNOWN_FACE" }, v_67e77e);

      return { identified: true, sheetOpen: false, graceUntilMs: null };

    case "ENROLLED":
      return { identified: true, sheetOpen: false, graceUntilMs: v_67e77e + v_a5c955 };

    default:
      return v_b6e533;
  }
}

export function v_706a74(
  v_b6e533,
  v_d48baf,
  v_67e77e,
): { state: RememberMeState; actions: RememberMeAction[] } {
  const v_fd5f43 = v_a448ad(v_b6e533, v_d48baf, v_67e77e);

  const v_dd943a =
    v_fd5f43.sheetOpen === v_b6e533.sheetOpen
      ? []
      : v_fd5f43.sheetOpen
        ? [{ type: "HALT_CONVERSATION" }]
        : [{ type: "RESUME_CONVERSATION" }];
  return { state: v_fd5f43, actions: v_dd943a };
}
