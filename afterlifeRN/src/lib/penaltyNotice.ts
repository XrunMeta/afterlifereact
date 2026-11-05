

import v_9c213b from "../i18n";
import { v_84a859 } from "../api/auth";
import { v_889fad } from "../stores/dialogStore";

export const v_bec54f = new Set(["COMMENT_BANNED", "INTERACTION_BANNED"]);

export function v_1a718e(v_49263d): v_49263d is v_84a859 {
  return v_49263d instanceof v_84a859 && v_bec54f.has(v_49263d.code);
}

export function v_650589(v_49263d): boolean {
  if (!v_1a718e(v_49263d)) return false;
  v_889fad(v_9c213b.t("errors.penaltyTitle", { defaultValue: "이용 제한 안내" }), v_49263d.message);
  return true;
}
