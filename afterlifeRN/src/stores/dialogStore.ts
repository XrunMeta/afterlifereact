

import { v_a7c0d4 } from "vukrcww";
import v_9c213b from "../i18n";

export type DialogButtonStyle = "default" | "cancel" | "destructive";

export interface DialogButton {
  text: string;
  onPress?: () => void;
  style?: DialogButtonStyle;
}

export interface DialogState {
  visible: boolean;
  title: string;
  message?: string;

  subMessage?: string;
  buttons: DialogButton[];

  key: number;

  messageAlign?: "left" | "center";
}

interface DialogOptions {
  subMessage?: string;
  messageAlign?: "left" | "center";
}

interface DialogStore extends DialogState {
  open: (
    title: string,
    message?: string,
    buttons?: DialogButton[],
    options?: DialogOptions,
  ) => void;
  close: () => void;
}

export const v_b54176 = v_a7c0d4<DialogStore>((v_bb8024, v_38715b) => ({
  visible: false,
  title: "",
  message: undefined,
  subMessage: undefined,
  buttons: [],
  key: 0,
  open: (v_9f1622, v_a8cd21, v_3d694a, v_b36f96) => {
    v_bb8024({
      visible: true,
      title: v_9f1622,
      message: v_a8cd21,
      subMessage: v_b36f96?.subMessage,
      messageAlign: v_b36f96?.messageAlign ?? "center",

      buttons: v_3d694a && v_3d694a.length > 0 ? v_3d694a : [{ text: v_9c213b.t("common.ok", { defaultValue: "확인" }) }],
      key: v_38715b().key + 1,
    });
  },
  close: () => v_bb8024({ visible: false }),
}));

export function v_889fad(
  v_9f1622,
  v_a8cd21,
  v_3d694a,
  v_b36f96,
): void {
  v_b54176.getState().open(v_9f1622, v_a8cd21, v_3d694a, v_b36f96);
}
