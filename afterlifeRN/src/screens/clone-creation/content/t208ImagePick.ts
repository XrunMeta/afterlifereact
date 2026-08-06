

import { showAlert } from "../../../stores/dialogStore";
import {
  getSilhouetteScale,
  isT208MeasureMode,
  silhouetteScaleLabel,
} from "../../../lib/t208SilhouetteScale";
import { getT208Crop, getT208Crops, t208CropsSummary } from "../../../lib/t208MeasureStore";

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: "cancel" | "destructive" | "default";
};

export function openImageSourcePicker(opts: {
  title: string;
  cameraLabel: string;
  libraryLabel: string;
  cancelLabel: string;
  onCamera: () => void;
  onLibrary: () => void;

  onApplyT208Crop: (uri: string) => void;
}): void {
  const buttons: AlertButton[] = [
    { text: opts.cameraLabel, onPress: opts.onCamera },
    { text: opts.libraryLabel, onPress: opts.onLibrary },
  ];

  if (__DEV__ && isT208MeasureMode()) {
    const crops = getT208Crops();
    const current = getT208Crop(getSilhouetteScale());
    if (current) {
      buttons.push({
        text: `T-208 ${silhouetteScaleLabel(current.scale)} 불러오기`,
        onPress: () => opts.onApplyT208Crop(current.uri),
      });
    }
    if (crops.length > 1) {
      buttons.push({
        text: `T-208 크롭 선택 (${t208CropsSummary()})`,
        onPress: () => {
          showAlert(
            "T-208 크롭 선택",
            "클론에 넣을 프레이밍을 고르세요.",
            [
              ...crops.map((c) => ({
                text: silhouetteScaleLabel(c.scale),
                onPress: () => opts.onApplyT208Crop(c.uri),
              })),
              { text: opts.cancelLabel, style: "cancel" as const },
            ],
          );
        },
      });
    } else if (crops.length === 1 && !current) {
      const only = crops[0];
      buttons.push({
        text: `T-208 ${silhouetteScaleLabel(only.scale)} 불러오기`,
        onPress: () => opts.onApplyT208Crop(only.uri),
      });
    }
  }

  buttons.push({ text: opts.cancelLabel, style: "cancel" });
  showAlert(opts.title, undefined, buttons);
}
