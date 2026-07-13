

import { Linking } from "react-native";
import type { TFunction } from "i18next";
import { showAlert } from "../../../stores/dialogStore";
import {
  pickOriginalImage,
  pickOriginalImageFromCamera,
  CameraPermissionError,
  type PickedImage,
} from "../../../lib/imagePicker";

export async function runImageSourcePick(
  fromCamera: boolean,
  t: TFunction,
): Promise<PickedImage | null> {
  try {
    return fromCamera ? await pickOriginalImageFromCamera() : await pickOriginalImage();
  } catch (err) {
    console.warn("[pickImageSource] 사진 선택 실패:", err);

    if (err instanceof CameraPermissionError) {
      if (err.code === "camera-permission-blocked") {
        showAlert(t("create.image.cameraPermTitle"), t("create.image.cameraPermBlockedMsg"), [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("permissionGate.settingsButton"),
            onPress: async () => {

              try {
                await Linking.openSettings();
              } catch (err) {
                console.warn("[pickImageSource] openSettings 실패:", err);
              }
            },
          },
        ]);
      } else {
        showAlert(t("create.image.cameraPermTitle"), t("create.image.cameraPermDeniedMsg"));
      }
      return null;
    }

    showAlert(t("common.error"), t("create.image.loadFailed"));
    return null;
  }
}
