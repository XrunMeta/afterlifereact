

import { StatusBar, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";

type Options = Parameters<typeof ImagePicker.launchImageLibraryAsync>[0];

export async function pickAndCropImage(
  options: Options,
): Promise<ImagePicker.ImagePickerResult> {
  if (Platform.OS === "ios") {
    StatusBar.setBarStyle("light-content");
  }
  try {
    return await ImagePicker.launchImageLibraryAsync(options);
  } finally {
    if (Platform.OS === "ios") {

      StatusBar.setBarStyle("default");
    }
  }
}

export type PickedImage = { uri: string; width: number; height: number };

function toPickedImage(r: ImagePicker.ImagePickerResult): PickedImage | null {
  if (r.canceled || !r.assets[0]) return null;
  const a = r.assets[0];
  if (!a.width || !a.height) return null;
  return { uri: a.uri, width: a.width, height: a.height };
}

export async function pickOriginalImage(): Promise<PickedImage | null> {
  const r = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 1,
  });
  return toPickedImage(r);
}

export type CameraPermissionErrorCode =
  | "camera-permission-denied"
  | "camera-permission-blocked";

export class CameraPermissionError extends Error {
  code: CameraPermissionErrorCode;
  constructor(code: CameraPermissionErrorCode) {
    super(code);
    this.name = "CameraPermissionError";
    this.code = code;
  }
}

export async function pickOriginalImageFromCamera(): Promise<PickedImage | null> {
  const current = await ImagePicker.getCameraPermissionsAsync();
  if (!current.granted) {
    if (current.canAskAgain === false) {
      throw new CameraPermissionError("camera-permission-blocked");
    }
    const requested = await ImagePicker.requestCameraPermissionsAsync();
    if (!requested.granted) {
      throw new CameraPermissionError(
        requested.canAskAgain === false ? "camera-permission-blocked" : "camera-permission-denied",
      );
    }
  }
  const r = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 1,
  });
  return toPickedImage(r);
}
