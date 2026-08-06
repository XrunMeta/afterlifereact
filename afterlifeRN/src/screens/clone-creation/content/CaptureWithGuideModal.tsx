import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  type Camera as CameraType,
} from "react-native-vision-camera";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAndroidNavigationBarHeight } from "react-native-navigation-bar-height";
import { useTranslation } from "react-i18next";
import { Feather } from "@expo/vector-icons";
import UpperBodyGuide from "../../../components/clone/UpperBodyGuide";
import { COLORS } from "../../../components/constants";
import type { PickedImage } from "../../../lib/imagePicker";
import {
  getSilhouetteScale,
  subscribeSilhouetteScale,
} from "../../../lib/t208SilhouetteScale";
import { showAlert } from "../../../stores/dialogStore";
import { centerCoverCrop1to2 } from "../../../lib/centerCoverCrop1to2";

interface Props {
  visible: boolean;
  onCapture: (image: PickedImage) => void;
  onCancel: () => void;
}

function toFileUri(path: string): string {
  return path.startsWith("file://") ? path : `file://${path}`;
}

export default function CaptureWithGuideModal({ visible, onCapture, onCancel }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navBarHeight = useAndroidNavigationBarHeight(0);
  const bottomInset =
    Platform.OS === "ios" ? insets.bottom : Math.max(navBarHeight, insets.bottom);

  const { width: SW, height: SH } = Dimensions.get("window");
  const frameW = Math.min(SW * 0.86, (SH * 0.7) / 2);
  const frameH = frameW * 2;

  const [silhouetteScale, setSilhouetteScaleState] = useState(getSilhouetteScale);
  useEffect(() => subscribeSilhouetteScale(() => setSilhouetteScaleState(getSilhouetteScale())), []);

  const [facing, setFacing] = useState<"front" | "back">("front");
  const device = useCameraDevice(facing);

  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef<CameraType>(null);
  const [ready, setReady] = useState(false);
  const [shooting, setShooting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setReady(false);
      setShooting(false);
      return;
    }
    let cancelled = false;
    (async () => {
      if (!hasPermission) {
        const ok = await requestPermission();
        if (cancelled) return;
        if (!ok) {
          showAlert(t("create.image.cameraPermTitle"), t("create.image.cameraPermDeniedMsg"));
          onCancel();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, hasPermission, requestPermission, onCancel, t]);

  useEffect(() => {
    setReady(false);
  }, [facing, device?.id]);

  const take = useCallback(async () => {
    if (!cameraRef.current || shooting) return;
    setShooting(true);
    try {
      const photo = await cameraRef.current.takePhoto({
        flash: "off",
        enableShutterSound: true,
      });
      const rawUri = toFileUri(photo.path);

      const upright = await manipulateAsync(rawUri, [], {
        compress: 1,
        format: SaveFormat.JPEG,
      });
      if (!upright.width || !upright.height) {
        showAlert(t("common.error"), t("create.image.loadFailed"));
        return;
      }
      const rect = centerCoverCrop1to2(upright.width, upright.height);
      const cropped = await manipulateAsync(
        upright.uri,
        [
          {
            crop: {
              originX: Math.round(rect.originX),
              originY: Math.round(rect.originY),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            },
          },
        ],
        { compress: 1, format: SaveFormat.JPEG },
      );
      if (!cropped.width || !cropped.height) {
        showAlert(t("common.error"), t("create.image.loadFailed"));
        return;
      }
      onCapture({ uri: cropped.uri, width: cropped.width, height: cropped.height });
    } catch (err) {
      console.warn("[CaptureWithGuideModal] takePhoto 실패:", err);
      showAlert(t("common.error"), t("create.image.loadFailed"));
    } finally {
      setShooting(false);
    }
  }, [shooting, onCapture, t]);

  const frameStyle = useMemo(
    () => ({
      top: (SH - frameH) / 2,
      left: (SW - frameW) / 2,
      width: frameW,
      height: frameH,
    }),
    [SH, SW, frameH, frameW],
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <View style={s.root}>
        <View style={[s.previewSlot, frameStyle]}>
          {device && hasPermission ? (
            <Camera
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={visible}
              photo
              isMirrored={facing === "front"}
              androidPreviewViewType="texture-view"
              onInitialized={() => setReady(true)}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, s.center]}>
              <ActivityIndicator color={COLORS.white} />
            </View>
          )}
          <View style={s.guideOverlay} pointerEvents="none">
            {}
            <UpperBodyGuide width={frameW * silhouetteScale} />
          </View>
          <View style={s.frameBorder} pointerEvents="none" />
        </View>

        <View style={[s.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
          <TouchableOpacity style={s.iconBtn} onPress={onCancel} accessibilityRole="button">
            <Feather name="x" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => setFacing((f) => (f === "front" ? "back" : "front"))}
            accessibilityRole="button"
          >
            <Feather name="refresh-cw" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={[s.bottomBar, { paddingBottom: 20 + bottomInset }]}>
          <TouchableOpacity
            style={[s.shutter, (!ready || shooting) && s.shutterDisabled]}
            onPress={take}
            disabled={!ready || shooting || !device}
            accessibilityRole="button"
            accessibilityLabel={t("create.image.sourceCamera")}
          >
            {shooting ? (
              <ActivityIndicator color={COLORS.zinc900} />
            ) : (
              <View style={s.shutterInner} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  center: { alignItems: "center", justifyContent: "center", backgroundColor: "#111" },
  previewSlot: {
    position: "absolute",
    overflow: "hidden",
    backgroundColor: "#111",
  },
  guideOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  frameBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.9)",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  shutterDisabled: { opacity: 0.45 },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.white,
  },
});
