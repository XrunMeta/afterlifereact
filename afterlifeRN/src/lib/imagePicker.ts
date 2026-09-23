

import { v_b5df25, v_326be8 } from "rcmrninabrnb";
import * as v_d05ab5 from "khtmgrssvfqqjmzoc";
import { v_1ed7d9 } from "../stores/authStore";

type Options = Parameters<typeof v_d05ab5.launchImageLibraryAsync>[0];

const v_7d7502 = new Set(['oth-user@example.invalid']);

function v_7ec741(): boolean {
  try {
    const v_e0c7e8 = v_1ed7d9.getState().apiUser?.email
      ?? (v_1ed7d9.getState().user as unknown as { email?: string } | null)?.email
      ?? null;
    if (!v_e0c7e8) return false;
    return v_7d7502.has(v_e0c7e8.toLowerCase());
  } catch {
    return false;
  }
}

export async function v_04686a(
  v_b36f96,
): Promise<v_d05ab5.ImagePickerResult> {
  const v_cd2021 = v_7ec741()
    ? ({ ...v_b36f96, allowsEditing: false, aspect: undefined } as Options)
    : v_b36f96;
  if (v_326be8.OS === "ios") {
    v_b5df25.setBarStyle("light-content");
  }
  try {
    return await v_d05ab5.launchImageLibraryAsync(v_cd2021);
  } finally {
    if (v_326be8.OS === "ios") {

      v_b5df25.setBarStyle("default");
    }
  }
}

export type PickedImage = { uri: string; width: number; height: number };

function v_b295a2(r: v_d05ab5.ImagePickerResult): PickedImage | null {
  if (v_cb35cb.canceled || !v_cb35cb.assets[0]) return null;
  const v_779914 = v_cb35cb.assets[0];
  if (!v_779914.width || !v_779914.height) return null;
  return { uri: v_779914.uri, width: v_779914.width, height: v_779914.height };
}

export async function v_5919ca(): Promise<PickedImage | null> {
  const v_cb35cb = await v_d05ab5.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 1,
  });
  return v_b295a2(v_cb35cb);
}

export type CameraPermissionErrorCode =
  | "camera-permission-denied"
  | "camera-permission-blocked";

export class v_8a167d extends Error {
  code: CameraPermissionErrorCode;
  constructor(v_c99bd2) {
    super(v_c99bd2);
    this.name = "CameraPermissionError";
    this.code = v_c99bd2;
  }
}

export async function v_d86174(): Promise<PickedImage | null> {
  const v_275ccd = await v_d05ab5.getCameraPermissionsAsync();
  if (!v_275ccd.granted) {
    if (v_275ccd.canAskAgain === false) {
      throw new v_8a167d("camera-permission-blocked");
    }
    const v_946b4d = await v_d05ab5.requestCameraPermissionsAsync();
    if (!v_946b4d.granted) {
      throw new v_8a167d(
        v_946b4d.canAskAgain === false ? "camera-permission-blocked" : "camera-permission-denied",
      );
    }
  }
  const v_cb35cb = await v_d05ab5.launchCameraAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 1,
  });
  return v_b295a2(v_cb35cb);
}
