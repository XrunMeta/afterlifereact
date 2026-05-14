

import { create } from "zustand";

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
  buttons: DialogButton[];

  key: number;
}

interface DialogStore extends DialogState {
  open: (title: string, message?: string, buttons?: DialogButton[]) => void;
  close: () => void;
}

export const useDialogStore = create<DialogStore>((set, get) => ({
  visible: false,
  title: "",
  message: undefined,
  buttons: [],
  key: 0,
  open: (title, message, buttons) => {
    set({
      visible: true,
      title,
      message,

      buttons: buttons && buttons.length > 0 ? buttons : [{ text: "확인" }],
      key: get().key + 1,
    });
  },
  close: () => set({ visible: false }),
}));

export function showAlert(
  title: string,
  message?: string,
  buttons?: DialogButton[],
): void {
  useDialogStore.getState().open(title, message, buttons);
}
