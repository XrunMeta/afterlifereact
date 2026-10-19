

import { v_889fad } from "../../../stores/dialogStore";
import {
  v_069313,
  v_6036cc,
  v_8b5209,
} from "../../../lib/t208SilhouetteScale";
import { v_a83290, v_e4c8b0, v_890a60 } from "../../../lib/t208MeasureStore";

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: "cancel" | "destructive" | "default";
};

export function v_cf3fbd(v_328259): { label: string; onPress: () => void }[] {
  if (!__DEV__ || !v_6036cc()) return [];

  const v_dd943a = [];
  const v_818f38 = v_e4c8b0();
  const v_275ccd = v_a83290(v_069313());

  if (v_275ccd) {
    v_dd943a.push({
      label: `T-208 ${v_8b5209(v_275ccd.scale)} 불러오기`,
      onPress: () => v_328259.onApplyT208Crop(v_275ccd.uri),
    });
  }
  if (v_818f38.length > 1) {
    v_dd943a.push({
      label: `T-208 크롭 선택 (${v_890a60()})`,
      onPress: () => {
        v_889fad(
          "T-208 크롭 선택",
          "클론에 넣을 프레이밍을 고르세요.",
          [
            ...v_818f38.map((v_3f4e2e) => ({
              text: v_8b5209(v_3f4e2e.scale),
              onPress: () => v_328259.onApplyT208Crop(v_3f4e2e.uri),
            })),
            { text: v_328259.cancelLabel, style: "cancel" as const },
          ],
        );
      },
    });
  } else if (v_818f38.length === 1 && !v_275ccd) {
    const v_78c274 = v_818f38[0];
    v_dd943a.push({
      label: `T-208 ${v_8b5209(v_78c274.scale)} 불러오기`,
      onPress: () => v_328259.onApplyT208Crop(v_78c274.uri),
    });
  }
  return v_dd943a;
}

export function v_aae248(v_328259): void {
  const v_3d694a = [
    { text: v_328259.cameraLabel, onPress: v_328259.onCamera },
    { text: v_328259.libraryLabel, onPress: v_328259.onLibrary },
  ];

  for (const v_779914 of v_cf3fbd({
    cancelLabel: v_328259.cancelLabel,
    onApplyT208Crop: v_328259.onApplyT208Crop,
  })) {
    v_3d694a.push({ text: v_779914.label, onPress: v_779914.onPress });
  }

  v_3d694a.push({ text: v_328259.cancelLabel, style: "cancel" });
  v_889fad(v_328259.title, undefined, v_3d694a);
}
