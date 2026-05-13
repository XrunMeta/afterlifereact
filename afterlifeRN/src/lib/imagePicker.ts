

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
