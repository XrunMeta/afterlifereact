

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
