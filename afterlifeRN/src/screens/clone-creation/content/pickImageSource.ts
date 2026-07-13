

import { v_f2c756 } from "rcmrninabrnb";
import type { v_75de9d } from "zqqvxke";
import { v_889fad } from "../../../stores/dialogStore";
import {
  v_5919ca,
  v_d86174,
  v_8a167d,
  type v_73b64e,
} from "../../../lib/imagePicker";

export async function v_e0c5af(
  v_520fa9,
  t: v_75de9d,
): Promise<v_73b64e | null> {
  try {
    return v_520fa9 ? await v_d86174() : await v_5919ca();
  } catch (v_49263d) {
    console.warn("[pickImageSource] 사진 선택 실패:", v_49263d);

    if (v_49263d instanceof v_8a167d) {
      if (v_49263d.code === "camera-permission-blocked") {
        v_889fad(v_8d41d7("create.image.cameraPermTitle"), v_8d41d7("create.image.cameraPermBlockedMsg"), [
          { text: v_8d41d7("common.cancel"), style: "cancel" },
          {
            text: v_8d41d7("permissionGate.settingsButton"),
            onPress: async () => {

              try {
                await v_f2c756.openSettings();
              } catch (v_49263d) {
                console.warn("[pickImageSource] openSettings 실패:", v_49263d);
              }
            },
          },
        ]);
      } else {
        v_889fad(v_8d41d7("create.image.cameraPermTitle"), v_8d41d7("create.image.cameraPermDeniedMsg"));
      }
      return null;
    }

    v_889fad(v_8d41d7("common.error"), v_8d41d7("create.image.loadFailed"));
    return null;
  }
}
