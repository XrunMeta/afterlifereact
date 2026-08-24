

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Vibration,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CommonActions, useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import {
  Camera as VisionCamera,
  useCameraDevice,
  useFrameProcessor,
} from "react-native-vision-camera";
import { Worklets, useSharedValue } from "react-native-worklets-core";
import { useFaceDetector } from "react-native-vision-camera-face-detector";
import { useTensorflowModel } from "react-native-fast-tflite";
import { useResizePlugin } from "vision-camera-resize-plugin";
import { largestFace } from "../../face/largestFace";
import { normalizeFrameTimestampMs } from "../../face/frameTimestamp";
import { l2normalize } from "../../face/l2normalize";
import { useAuthStore } from "../../stores/authStore";
import { createPerson, enrollFaces } from "../../api/persons";
import { showAlert } from "../../stores/dialogStore";
import { COLORS, RADIUS } from "../../components/constants";
import type { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "PreCallFaceEnroll">;
type Rt = RouteProp<RootStackParamList, "PreCallFaceEnroll">;

interface Step {
  key: string;
  label: string;
  hint: string;
}

const STEPS: readonly Step[] = [
  { key: "front", label: "정면", hint: "화면 정중앙을 정시해 주세요" },
  { key: "right", label: "오른쪽", hint: "고개를 오른쪽으로 살짝 돌려주세요" },
  { key: "left", label: "왼쪽", hint: "고개를 왼쪽으로 살짝 돌려주세요" },
  { key: "up", label: "위", hint: "고개를 위로 살짝 들어주세요" },
  { key: "down", label: "아래", hint: "고개를 아래로 살짝 숙여주세요" },
] as const;

const FACE_DETECTOR_OPTIONS = {
  performanceMode: "fast",
  landmarkMode: "none",
  contourMode: "none",
  classificationMode: "none",
  minFaceSize: 0.2,
} as const;

export default function PreCallFaceEnrollScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const insets = useSafeAreaInsets();
  const { cloneId, name: personaName, image: personaImage } = route.params;
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.apiUser);

  const [permissionOk, setPermissionOk] = useState<boolean | null>(null);
  const [step, setStep] = useState(0);
  const [captured, setCaptured] = useState<number[][]>([]);
  const [submitting, setSubmitting] = useState(false);

  const latestVectorRef = useRef<number[] | null>(null);
  const latestFaceCountRef = useRef(0);

  const flashOpacity = useRef(new Animated.Value(0)).current;
  const playFlash = useCallback(() => {

    Vibration.vibrate(30);
    Animated.sequence([
      Animated.timing(flashOpacity, { toValue: 0.6, duration: 80, useNativeDriver: true }),
      Animated.timing(flashOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [flashOpacity]);

  useEffect(() => {
    void (async () => {
      const status = await VisionCamera.requestCameraPermission();
      setPermissionOk(status === "granted");
    })();
  }, []);

  const device = useCameraDevice("front");
  const { detectFaces } = useFaceDetector(FACE_DETECTOR_OPTIONS);
  const { resize } = useResizePlugin();
  const modelPlugin = useTensorflowModel(
    require("../../../assets/models/w600k_mbf.tflite"),
  );
  const faceEmbedModel = modelPlugin.state === "loaded" ? modelPlugin.model : null;

  const lastEmbedTs = useSharedValue(0);
  const EMBED_INTERVAL_MS = 300;
  const isAndroidFrame = useMemo(() => require("react-native").Platform.OS === "android", []);

  const handleEmbeddingOnJS = useMemo(
    () =>
      Worklets.createRunOnJS((vector: number[], faceCount: number) => {
        latestVectorRef.current = vector;
        latestFaceCountRef.current = faceCount;
      }),
    [],
  );

  const faceFrameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      const faces = detectFaces(frame);
      if (faceEmbedModel == null) return;
      const nowMs = normalizeFrameTimestampMs(frame.timestamp, isAndroidFrame);
      if (nowMs - lastEmbedTs.value < EMBED_INTERVAL_MS) return;
      lastEmbedTs.value = nowMs;
      const primary = largestFace(faces);
      if (primary == null) {
        handleEmbeddingOnJS([], 0);
        return;
      }
      const resized = resize(frame, {
        crop: {
          x: primary.bounds.x,
          y: primary.bounds.y,
          width: primary.bounds.width,
          height: primary.bounds.height,
        },
        scale: { width: 112, height: 112 },
        pixelFormat: "rgb",
        dataType: "float32",
      });
      const normalized = new Float32Array(resized.length);
      for (let i = 0; i < resized.length; i++) normalized[i] = resized[i] * 2 - 1;
      const out = faceEmbedModel.runSync([normalized])[0] as Float32Array;
      handleEmbeddingOnJS(Array.from(out), faces.length);
    },
    [detectFaces, faceEmbedModel, resize, lastEmbedTs, isAndroidFrame, handleEmbeddingOnJS],
  );

  const goToCall = useCallback(() => {
    nav.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Call", params: { cloneId, name: personaName, image: personaImage } }],
      }),
    );
  }, [nav, cloneId, personaName, personaImage]);

  const onSkip = useCallback(() => {
    Alert.alert(
      "등록 없이 진행",
      "얼굴 인식·기억 기능이 제한될 수 있습니다. 계속하시겠어요?",
      [
        { text: "취소", style: "cancel" },
        { text: "그대로 진행", onPress: goToCall },
      ],
    );
  }, [goToCall]);

  const onCapture = useCallback(() => {
    const vec = latestVectorRef.current;
    const faceCount = latestFaceCountRef.current;
    if (!vec || vec.length !== 512 || faceCount === 0) {
      showAlert("얼굴을 찾지 못했어요", "가이드 원 안에 얼굴이 잘 보이도록 자세를 잡아주세요.");
      return;
    }

    const norm = Array.from(l2normalize(Float32Array.from(vec)));

    playFlash();
    setCaptured((prev) => [...prev, norm]);
    setStep((prev) => prev + 1);
  }, [playFlash]);

  useEffect(() => {
    if (captured.length !== STEPS.length) return;
    if (!accessToken || !user) return;
    if (submitting) return;
    setSubmitting(true);
    void (async () => {
      try {
        const displayName = (user.name ?? "본인").trim() || "본인";

        const person = await createPerson(accessToken, {
          cloneId,
          displayName,
          enrolledVia: "auto_biometric",
        });

        await enrollFaces(accessToken, person.id, captured);
        showAlert("등록 완료", "얼굴 인식 준비가 끝났어요. 통화를 시작합니다.");
        setTimeout(goToCall, 400);
      } catch (err) {
        console.warn("[PreCallFaceEnroll] enroll 실패:", err);
        Alert.alert(
          "등록 실패",
          `${(err as Error).message ?? "네트워크 오류"}. 등록 없이 통화만 진행할까요?`,
          [
            { text: "다시 시도", style: "cancel", onPress: () => { setCaptured([]); setStep(0); setSubmitting(false); } },
            { text: "그대로 진행", onPress: goToCall },
          ],
        );
      }
    })();
  }, [captured, accessToken, user, cloneId, submitting, goToCall]);

  if (permissionOk === false) {
    return (
      <View style={[s.container, s.center]}>
        <Text style={s.hint}>카메라 권한이 필요합니다.</Text>
        <TouchableOpacity onPress={onSkip} style={s.skipBtn}>
          <Text style={s.skipBtnText}>등록 건너뛰고 통화</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (permissionOk === null || !device) {
    return (
      <View style={[s.container, s.center]}>
        <ActivityIndicator color={COLORS.white} />
        <Text style={s.hint}>카메라 준비 중...</Text>
      </View>
    );
  }

  const currentStep = STEPS[Math.min(step, STEPS.length - 1)];
  const done = step >= STEPS.length;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.title}>얼굴 등록</Text>
        <Text style={s.subtitle}>
          {personaName} 과 자연스럽게 대화하도록 얼굴을 5각도 담아둘게요.
        </Text>
      </View>

      <View style={s.cameraBox}>
        <VisionCamera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={!submitting}
          frameProcessor={faceEmbedModel ? faceFrameProcessor : undefined}
          pixelFormat="yuv"
        />
        <View style={s.guideCircle} pointerEvents="none" />
      </View>

      <View style={s.stepBox}>
        {done ? (
          <>
            <ActivityIndicator color={COLORS.white} />
            <Text style={s.stepLabel}>등록 중...</Text>
          </>
        ) : (
          <>
            <Text style={s.stepLabel}>
              {step + 1}/{STEPS.length} · {currentStep.label}
            </Text>
            <Text style={s.stepHint}>{currentStep.hint}</Text>
          </>
        )}
      </View>

      <View style={s.progressRow}>
        {STEPS.map((sItem, idx) => (
          <View
            key={sItem.key}
            style={[s.dot, idx < step && s.dotDone, idx === step && !done && s.dotActive]}
          />
        ))}
      </View>

      {!done && (
        <TouchableOpacity onPress={onCapture} style={s.captureBtn} disabled={submitting}>
          <Text style={s.captureBtnText}>촬영</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={onSkip} style={s.skipBtn} disabled={submitting}>
        <Text style={s.skipBtnText}>나중에 하기 (지금 통화)</Text>
      </TouchableOpacity>

      {}
      <Animated.View
        pointerEvents="none"
        style={[s.flash, { opacity: flashOpacity }]}
      />
    </View>
  );
}

const CIRCLE_SIZE = 260;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.zinc950, padding: 20, gap: 16 },
  center: { alignItems: "center", justifyContent: "center", gap: 12 },
  header: { alignItems: "center", gap: 6 },
  title: { color: COLORS.white, fontSize: 22, fontWeight: "700" },
  subtitle: { color: COLORS.zinc300, fontSize: 13, textAlign: "center" },
  cameraBox: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    overflow: "hidden",
    alignSelf: "center",
    backgroundColor: COLORS.zinc900,
  },
  guideCircle: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: CIRCLE_SIZE / 2,
  },
  stepBox: { alignItems: "center", gap: 4 },
  stepLabel: { color: COLORS.white, fontSize: 18, fontWeight: "700" },
  stepHint: { color: COLORS.zinc300, fontSize: 13 },
  progressRow: { flexDirection: "row", gap: 8, justifyContent: "center", marginVertical: 4 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.zinc700,
  },
  dotDone: { backgroundColor: "#22c55e" },
  dotActive: { backgroundColor: COLORS.white },
  captureBtn: {
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    borderRadius: RADIUS.full,
    alignItems: "center",
    marginTop: 8,
  },
  captureBtnText: { color: COLORS.zinc900, fontSize: 16, fontWeight: "700" },
  skipBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  skipBtnText: { color: COLORS.zinc400, fontSize: 13, textDecorationLine: "underline" },
  hint: { color: COLORS.zinc300, fontSize: 14, textAlign: "center" },

  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.white,
  },
});
