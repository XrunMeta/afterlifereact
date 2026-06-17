

import { v_b5df25, v_326be8 } from "rcmrninabrnb";
import * as v_d05ab5 from "khtmgrssvfqqjmzoc";

type Options = Parameters<typeof v_d05ab5.launchImageLibraryAsync>[0];

export async function v_04686a(
  v_b36f96,
): Promise<v_d05ab5.ImagePickerResult> {
  if (v_326be8.OS === "ios") {
    v_b5df25.setBarStyle("light-content");
  }
  try {
    return await v_d05ab5.launchImageLibraryAsync(v_b36f96);
  } finally {
    if (v_326be8.OS === "ios") {

      v_b5df25.setBarStyle("default");
    }
  }
}

export async function v_5919ca(): Promise<
  { uri: string; width: number; height: number } | null
> {
  const v_cb35cb = await v_d05ab5.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 1,
  });
  if (v_cb35cb.canceled || !v_cb35cb.assets[0]) return null;
  const v_779914 = v_cb35cb.assets[0];

  if (!v_779914.width || !v_779914.height) return null;
  return { uri: v_779914.uri, width: v_779914.width, height: v_779914.height };
}
