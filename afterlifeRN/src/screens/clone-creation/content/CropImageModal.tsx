import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PinchGestureHandler,
  State,
  type PanGestureHandlerStateChangeEvent,
  type PinchGestureHandlerStateChangeEvent,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAndroidNavigationBarHeight } from "react-native-navigation-bar-height";
import { useTranslation } from "react-i18next";
import UpperBodyGuide from "../../../components/clone/UpperBodyGuide";
import {
  baseCoverScale,
  clampGestureScale,
  clampPanOffset,
  coversCropArea,
  cropToAvatar,
  type GestureState,
} from "../../../lib/cropImage";
import { averagePaddingColor, buildPaddedBackground, PAD_SCALE } from "../../../lib/letterboxAvatar";
import { COLORS } from "../../../components/constants";
import { showAlert } from "../../../stores/dialogStore";
import {
  getSilhouetteScale,
  isT208MeasureMode,
  silhouetteScaleLabel,
  subscribeSilhouetteScale,
} from "../../../lib/t208SilhouetteScale";
import { recordT208Crop, t208AllCropsReady, t208CropsSummary, advanceT208ToNextIncompleteScale } from "../../../lib/t208MeasureStore";

interface Source { uri: string; width: number; height: number }
interface Props {
  visible: boolean;
  source: Source | null;
  onConfirm: (uri: string) => void;
  onCancel: () => void;
}

export default function CropImageModal({ visible, source, onConfirm, onCancel }: Props) {
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

  const gesture = useRef<GestureState>({ translateX: 0, translateY: 0, scale: 1 });

  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const baseTranslate = useRef({ x: 0, y: 0 }).current;
  const scale = useRef(new Animated.Value(1)).current;

  const baseScale = useRef(new Animated.Value(1)).current;

  const baseScaleNum = useRef(1);

  const pinchHandlerRef = useRef(null);
  const panHandlerRef = useRef(null);

  const [covers, setCovers] = useState(true);

  const [padColor, setPadColor] = useState<string | null>(null);

  const [padUri, setPadUri] = useState<string | null>(null);

  const [padLoading, setPadLoading] = useState(false);
  useEffect(() => {
    if (!source) { setPadColor(null); setPadUri(null); setPadLoading(false); return; }
    let cancelled = false;
    setPadUri(null);
    setPadLoading(true);

    void averagePaddingColor(source.uri)
      .then((c) => { if (!cancelled) setPadColor(c); })
      .catch(() => {  });
    void buildPaddedBackground(source.uri, source.width, source.height)
      .then((u) => { if (!cancelled) { setPadUri(u); setPadLoading(false); } })
      .catch(() => { if (!cancelled) setPadLoading(false);  });
    return () => { cancelled = true; };
  }, [source?.uri]); 

  useEffect(() => {
    if (!source) return;
    gesture.current = { translateX: 0, translateY: 0, scale: 1 };
    baseTranslate.x = 0;
    baseTranslate.y = 0;
    baseScaleNum.current = 1;
    pan.setOffset({ x: 0, y: 0 });
    pan.setValue({ x: 0, y: 0 });
    baseScale.setValue(1);
    scale.setValue(1);
    setCovers(true);
  }, [source?.uri]); 

  const processing = useRef(false);

  const applyCoverageClamp = () => {
    if (!source) return;
    const image = { width: source.width, height: source.height };
    const frame = { width: frameW, height: frameH };
    const clampedPan = clampPanOffset(image, frame, baseScaleNum.current, {
      x: baseTranslate.x,
      y: baseTranslate.y,
    });
    baseTranslate.x = clampedPan.x;
    baseTranslate.y = clampedPan.y;
    pan.setOffset({ x: baseTranslate.x, y: baseTranslate.y });
    pan.setValue({ x: 0, y: 0 });
    gesture.current.translateX = baseTranslate.x;
    gesture.current.translateY = baseTranslate.y;
    setCovers(coversCropArea({ image, frame }, baseScaleNum.current, clampedPan));
  };

  const onPanEvent = Animated.event([{ nativeEvent: { translationX: pan.x, translationY: pan.y } }], {
    useNativeDriver: false,
  });
  const onPanStateChange = (e: PanGestureHandlerStateChangeEvent) => {
    const st = e.nativeEvent.state;
    if (st === State.END) {
      baseTranslate.x += e.nativeEvent.translationX;
      baseTranslate.y += e.nativeEvent.translationY;

      applyCoverageClamp();
    } else if (st === State.CANCELLED || st === State.FAILED) {

      pan.setOffset({ x: baseTranslate.x, y: baseTranslate.y });
      pan.setValue({ x: 0, y: 0 });
    }
  };

  const onPinchEvent = Animated.event([{ nativeEvent: { scale } }], { useNativeDriver: false });
  const onPinchStateChange = (e: PinchGestureHandlerStateChangeEvent) => {
    if (e.nativeEvent.state === State.END) {

      const next = clampGestureScale(baseScaleNum.current * e.nativeEvent.scale);
      baseScale.setValue(next);
      baseScaleNum.current = next;
      gesture.current.scale = next;
      scale.setValue(1);

      applyCoverageClamp();
    }
  };

  const displayScale = Animated.multiply(scale, baseScale);

  const confirm = async () => {
    if (!source) return;

    if (processing.current) return;

    if (
      !coversCropArea(
        { image: { width: source.width, height: source.height }, frame: { width: frameW, height: frameH } },
        baseScaleNum.current,
        { x: baseTranslate.x, y: baseTranslate.y },
      )
    ) {
      return;
    }
    processing.current = true;
    try {
      const uri = await cropToAvatar(
        source.uri,
        { width: source.width, height: source.height },
        { width: frameW, height: frameH },
        gesture.current,
      );

      if (isT208MeasureMode()) {
        const scale = getSilhouetteScale();
        await recordT208Crop(scale, uri);
        const done = t208AllCropsReady();
        const next = done ? null : advanceT208ToNextIncompleteScale();
        showAlert(
          `T-208 크롭 저장 · ${silhouetteScaleLabel(scale)}`,
          done
            ? `3종 크롭 완료!\n${t208CropsSummary()}\n\n다음: 생성→사진에서「T-208 … 불러오기」로 배율별 크롭을 넣어 클론 3개 생성(음성·페르소나 동일) → 가비아 동일 대사 렌더.`
            : `기록됨.\n현황 ${t208CropsSummary()}\n\n다음 배율로 전환: ${silhouetteScaleLabel(next ?? getSilhouetteScale())}\n같은 사진으로 다시 크롭하세요.`,
        );
      }
      onConfirm(uri);
    } catch (err) {
      console.warn("[CropImageModal] cropToAvatar 실패:", err);
      showAlert(t('common.error'), t('create.image.cropFailed'));
    } finally {
      processing.current = false;
    }
  };

  const imgStyle = useMemo(
    () => {
      const s0 = source
        ? baseCoverScale({ width: source.width, height: source.height }, { width: frameW, height: frameH })
        : 1;
      return {
        width: (source?.width ?? 1) * s0,
        height: (source?.height ?? 1) * s0,
        transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: displayScale }],
      };
    },
    [source, frameW, frameH, pan, displayScale],
  );

  const padStyle = useMemo(
    () => ({
      width: (imgStyle.width as number) * PAD_SCALE,
      height: (imgStyle.height as number) * PAD_SCALE,
      transform: imgStyle.transform,
    }),
    [imgStyle],
  );

  if (!source) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <GestureHandlerRootView style={[s.root, padColor ? { backgroundColor: padColor } : null]}>
        <PinchGestureHandler
          ref={pinchHandlerRef}
          simultaneousHandlers={panHandlerRef}
          onGestureEvent={onPinchEvent}
          onHandlerStateChange={onPinchStateChange}
        >
          <Animated.View style={s.fill}>
            <PanGestureHandler
              ref={panHandlerRef}
              simultaneousHandlers={pinchHandlerRef}
              onGestureEvent={onPanEvent}
              onHandlerStateChange={onPanStateChange}
            >
              <Animated.View style={s.fill}>
                {
}
                {padUri ? (
                  <View style={[StyleSheet.absoluteFill, s.center]} pointerEvents="none">
                    <Animated.Image source={{ uri: padUri }} style={padStyle as any} resizeMode="stretch" />
                  </View>
                ) : null}
                <Animated.Image source={{ uri: source.uri }} style={imgStyle as any} resizeMode="cover" />
              </Animated.View>
            </PanGestureHandler>
          </Animated.View>
        </PinchGestureHandler>

        {}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[s.dim, { top: 0, left: 0, right: 0, height: (SH - frameH) / 2 }]} />
          <View style={[s.dim, { bottom: 0, left: 0, right: 0, height: (SH - frameH) / 2 }]} />
          <View style={[s.dim, { top: (SH - frameH) / 2, bottom: (SH - frameH) / 2, left: 0, width: (SW - frameW) / 2 }]} />
          <View style={[s.dim, { top: (SH - frameH) / 2, bottom: (SH - frameH) / 2, right: 0, width: (SW - frameW) / 2 }]} />
          {}
          <View style={[s.frame, { top: (SH - frameH) / 2, left: (SW - frameW) / 2, width: frameW, height: frameH }]} />
          {}
          <View style={[s.guide, { top: (SH - frameH) / 2, left: (SW - frameW) / 2, width: frameW, height: frameH }]}>
            <UpperBodyGuide width={SW * silhouetteScale} />
          </View>
          {__DEV__ && isT208MeasureMode() ? (
            <View style={s.devBadge} pointerEvents="none">
              <Text style={s.devBadgeText}>T-208 실측 {silhouetteScaleLabel(silhouetteScale)}</Text>
            </View>
          ) : null}
        </View>

        {
}
        {padLoading ? (
          <View style={[StyleSheet.absoluteFill, s.center]} pointerEvents="none">
            <View style={s.loadingChip}>
              <ActivityIndicator color={COLORS.white} />
            </View>
          </View>
        ) : null}

        <View style={[s.actions, { bottom: 16 + bottomInset }]}>
          <TouchableOpacity style={s.btn} onPress={onCancel}>
            <Text style={s.btnText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.btn, s.btnPrimary, (!covers || padLoading) && s.btnDisabled]}
            onPress={confirm}
            disabled={!covers || padLoading}
          >
            <Text style={[s.btnText, s.btnPrimaryText]}>{t('common.confirm')}</Text>
          </TouchableOpacity>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const s = StyleSheet.create({

  root: { flex: 1, backgroundColor: "#000" },
  center: { alignItems: "center", justifyContent: "center" },
  loadingChip: {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  fill: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  dim: { position: "absolute", backgroundColor: "rgba(0,0,0,0.6)" },
  frame: { position: "absolute", borderWidth: 2, borderColor: "rgba(255,255,255,0.9)" },
  guide: { position: "absolute", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  devBadge: {
    position: "absolute",
    top: 48,
    alignSelf: "center",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  devBadgeText: {
    color: "#fde68a",
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: "hidden",
    borderRadius: 8,
  },
  actions: { position: "absolute", left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 16 },
  btn: { paddingVertical: 12, paddingHorizontal: 28, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.15)" },
  btnPrimary: { backgroundColor: COLORS.white },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: COLORS.white, fontWeight: "600" },
  btnPrimaryText: { color: COLORS.zinc900 },
});
