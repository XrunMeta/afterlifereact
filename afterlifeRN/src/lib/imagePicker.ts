

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

export async function pickOriginalImage(): Promise<
  { uri: string; width: number; height: number } | null
> {
  const r = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 1,
  });
  if (r.canceled || !r.assets[0]) return null;
  const a = r.assets[0];

  if (!a.width || !a.height) return null;
  return { uri: a.uri, width: a.width, height: a.height };
}
