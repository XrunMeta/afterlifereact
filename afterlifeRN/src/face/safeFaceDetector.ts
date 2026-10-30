

import { v_326be8 } from "rcmrninabrnb";
import { v_313379 } from "mkqptszwrsxiemcjrtdlshyxlm";
import { v_ac8611 } from "gegbzaufjmeglxlxrodgpkwzmpoxabawfpabkiqb";

let v_213e16 = null;

export function v_f8fbcf(): boolean {
  if (v_326be8.OS !== "ios") return true;
  if (v_213e16 === null) {
    try {
      v_213e16 = v_313379.initFrameProcessorPlugin("detectFaces", {}) != null;
    } catch {
      v_213e16 = false;
    }
  }
  return v_213e16;
}

type DetectorOptions = Parameters<typeof v_ac8611>[0];
type DetectorResult = ReturnType<typeof v_ac8611>;

const v_2d7d62 = () => {};
const v_07516f = ((v_5d7221) => {
  "worklet";
  return [];
}) as unknown as DetectorResult["detectFaces"];

export function v_fd3d66(v_b36f96): DetectorResult & { available: boolean } {
  if (!v_f8fbcf()) {
    return { detectFaces: v_07516f, stopListeners: v_2d7d62, available: false } as DetectorResult & {
      available: boolean;
    };
  }

  return { ...v_ac8611(v_b36f96), available: true };
}
