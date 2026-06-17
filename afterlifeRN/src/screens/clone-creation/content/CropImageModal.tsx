import React, { useEffect, useMemo, useRef } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from "react-native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PinchGestureHandler,
  State,
  type PanGestureHandlerStateChangeEvent,
  type PinchGestureHandlerStateChangeEvent,
} from "react-native-gesture-handler";
import UpperBodyGuide from "../../../components/clone/UpperBodyGuide";
import { baseCoverScale, cropToAvatar, type GestureState } from "../../../lib/cropImage";
import { COLORS, RADIUS } from "../../../components/constants";

interface Source { uri: string; width: number; height: number }
interface Props {
  visible: boolean;
  source: Source | null;
  onConfirm: (uri: string) => void;
  onCancel: () => void;
}

export default function CropImageModal({ visible, source, onConfirm, onCancel }: Props) {
  const { width: SW, height: SH } = Dimensions.get("window");
  const frameW = Math.min(SW * 0.86, (SH * 0.7) / 2);
  const frameH = frameW * 2;

  const gesture = useRef<GestureState>({ translateX: 0, translateY: 0, scale: 1 });

  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const baseTranslate = useRef({ x: 0, y: 0 }).current;
  const scale = useRef(new Animated.Value(1)).current;

  const baseScale = useRef(new Animated.Value(1)).current;

  const baseScaleNum = useRef(1);

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
  }, [source?.uri]); 

  const processing = useRef(false);

  const onPanEvent = Animated.event([{ nativeEvent: { translationX: pan.x, translationY: pan.y } }], {
    useNativeDriver: false,
  });
  const onPanStateChange = (e: PanGestureHandlerStateChangeEvent) => {
    const st = e.nativeEvent.state;
    if (st === State.END) {
      baseTranslate.x += e.nativeEvent.translationX;
      baseTranslate.y += e.nativeEvent.translationY;
      pan.setOffset({ x: baseTranslate.x, y: baseTranslate.y });
      pan.setValue({ x: 0, y: 0 });
      gesture.current.translateX = baseTranslate.x;
      gesture.current.translateY = baseTranslate.y;
    } else if (st === State.CANCELLED || st === State.FAILED) {

      pan.setOffset({ x: baseTranslate.x, y: baseTranslate.y });
      pan.setValue({ x: 0, y: 0 });
    }
  };

  const onPinchEvent = Animated.event([{ nativeEvent: { scale } }], { useNativeDriver: false });
  const onPinchStateChange = (e: PinchGestureHandlerStateChangeEvent) => {
    if (e.nativeEvent.state === State.END) {
      const next = Math.max(1, baseScaleNum.current * e.nativeEvent.scale);
      baseScale.setValue(next);
      baseScaleNum.current = next;
      gesture.current.scale = next;
      scale.setValue(1);
    }
  };

  const displayScale = Animated.multiply(scale, baseScale);

  const confirm = async () => {
    if (!source) return;

    if (processing.current) return;
    processing.current = true;
    try {
      const uri = await cropToAvatar(
        source.uri,
        { width: source.width, height: source.height },
        { width: frameW, height: frameH },
        gesture.current,
      );
      onConfirm(uri);
    } catch (err) {
      console.warn("[CropImageModal] cropToAvatar 실패:", err);
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

  if (!source) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <GestureHandlerRootView style={s.root}>
        <PinchGestureHandler onGestureEvent={onPinchEvent} onHandlerStateChange={onPinchStateChange}>
          <Animated.View style={s.fill}>
            <PanGestureHandler onGestureEvent={onPanEvent} onHandlerStateChange={onPanStateChange}>
              <Animated.View style={s.fill}>
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
            <UpperBodyGuide width={SW * 0.5} />
          </View>
        </View>

        <View style={[s.actions]}>
          <TouchableOpacity style={s.btn} onPress={onCancel}>
            <Text style={s.btnText}>다시 선택</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={confirm}>
            <Text style={[s.btnText, s.btnPrimaryText]}>확인</Text>
          </TouchableOpacity>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  fill: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  dim: { position: "absolute", backgroundColor: "rgba(0,0,0,0.6)" },
  frame: { position: "absolute", borderWidth: 2, borderColor: "rgba(255,255,255,0.9)" },
  guide: { position: "absolute", alignItems: "center", justifyContent: "center" },
  actions: { position: "absolute", bottom: 40, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 16 },
  btn: { paddingVertical: 12, paddingHorizontal: 28, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.15)" },
  btnPrimary: { backgroundColor: COLORS.white },
  btnText: { color: COLORS.white, fontWeight: "600" },
  btnPrimaryText: { color: COLORS.zinc900 },
});
