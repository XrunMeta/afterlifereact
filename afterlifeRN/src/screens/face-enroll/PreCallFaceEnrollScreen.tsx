

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  Vibration,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  BackHandler,
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
import { computeAlignedCrop } from "../../face/faceAlignCrop";
import { computeLandmarkRatios, type LandmarkRatios } from "../../face/faceLandmarkRatios";
import { normalizeFrameTimestampMs } from "../../face/frameTimestamp";
import { l2normalize } from "../../face/l2normalize";
import { useAuthStore } from "../../stores/authStore";
import { createPerson, enrollFaces, deletePerson, updatePersonRelation, listPersons } from "../../api/persons";
import { showAlert } from "../../stores/dialogStore";
import { COLORS, RADIUS } from "../../components/constants";
import PageHeader from "../../components/common/PageHeader";
import type { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "PreCallFaceEnroll">;
type Rt = RouteProp<RootStackParamList, "PreCallFaceEnroll">;

interface Step {
  key: string;
  label: string;
  hint: string;

  checkPose: (yaw: number, pitch: number) => boolean;

  guide: (yaw: number, pitch: number) => string;
}
const FRAMES_PER_STEP = 6;

const STEPS: readonly Step[] = [
  {
    key: "front", label: "정면", hint: "카메라를 정면으로 봐주세요",
    checkPose: (y, p) => Math.abs(y) < 12 && Math.abs(p) < 12,
    guide: (y, p) => Math.abs(y) >= 12 ? "좌우로 고개 돌리지 마세요" : Math.abs(p) >= 12 ? "고개 각도 낮춰주세요" : "완벽!",
  },
  {
    key: "right", label: "오른쪽", hint: "고개를 오른쪽으로 돌려주세요",
    checkPose: (y, p) => y > 18 && Math.abs(p) < 20,
    guide: (y, _p) => y < 18 ? `조금만 더 오른쪽으로 (${Math.round(y)}°/18°)` : "완벽!",
  },
  {
    key: "left", label: "왼쪽", hint: "고개를 왼쪽으로 돌려주세요",
    checkPose: (y, p) => y < -18 && Math.abs(p) < 20,
    guide: (y, _p) => y > -18 ? `조금만 더 왼쪽으로 (${Math.round(y)}°/-18°)` : "완벽!",
  },
  {
    key: "up", label: "위", hint: "고개를 위로 들어주세요",
    checkPose: (y, p) => p < -10 && Math.abs(y) < 20,
    guide: (_y, p) => p > -10 ? `조금만 더 위로 (${Math.round(p)}°/-10°)` : "완벽!",
  },
  {
    key: "down", label: "아래", hint: "고개를 아래로 숙여주세요",
    checkPose: (y, p) => p > 10 && Math.abs(y) < 20,
    guide: (_y, p) => p < 10 ? `조금만 더 아래로 (${Math.round(p)}°/10°)` : "완벽!",
  },
] as const;

const FACE_DETECTOR_OPTIONS = {
  performanceMode: "fast",
  landmarkMode: "all",
  contourMode: "none",
  classificationMode: "none",
  minFaceSize: 0.2,
} as const;

export default function PreCallFaceEnrollScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const insets = useSafeAreaInsets();

  const rawCloneId = (route.params as { cloneId: unknown }).cloneId;
  const cloneId = Number(rawCloneId);
  const { name: personaName, image: personaImage, midCall } = route.params;
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.apiUser);

  useEffect(() => {
    if (!Number.isInteger(cloneId) || cloneId <= 0) {
      showAlert("페르소나 정보 오류", "잘못된 페르소나로 진입했어요. 다시 시도해 주세요.", [
        { text: "확인", onPress: () => nav.goBack() },
      ]);
    }

  }, [cloneId]);

  const [permissionOk, setPermissionOk] = useState<boolean | null>(null);
  const [step, setStep] = useState(0);
  const [captured, setCaptured] = useState<number[][]>([]);

  const [capturedRatios, setCapturedRatios] = useState<(Record<string, number> | null)[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [formName, setFormName] = useState("");
  const [formRelation, setFormRelation] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [existingPersons, setExistingPersons] = useState<{ id: number; displayName: string | null }[]>([]);

  const latestVectorRef = useRef<number[] | null>(null);
  const latestFaceCountRef = useRef(0);

  const [pose, setPose] = useState<{ yaw: number; pitch: number } | null>(null);

  const stepRef = useRef(0);
  useEffect(() => { stepRef.current = step; }, [step]);

  const lastAutoCaptureRef = useRef(0);

  const lastPoseRef = useRef<{ yaw: number; pitch: number } | null>(null);
  const poseStreakRef = useRef(0);

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

  useEffect(() => {
    if (!midCall || !accessToken) return;
    void (async () => {
      try {
        const r = await listPersons(accessToken, cloneId);
        setExistingPersons(
          r.items
            .filter((p) => p.displayName && p.displayName.trim().length > 0)
            .map((p) => ({ id: p.id, displayName: p.displayName ?? null })),
        );
      } catch (e) {
        console.warn("[PreCallFaceEnroll] listPersons 실패 (chip 렌더 skip):", e);
      }
    })();
  }, [midCall, accessToken, cloneId]);

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
      Worklets.createRunOnJS((
        vector: number[],
        faceCount: number,
        yaw: number,
        pitch: number,

        landmarkRatiosJson: string | null,
      ) => {
        latestVectorRef.current = vector;
        latestFaceCountRef.current = faceCount;
        if (faceCount > 0) setPose({ yaw, pitch });
        else setPose(null);
        const landmarkRatios: LandmarkRatios | null = landmarkRatiosJson
          ? (JSON.parse(landmarkRatiosJson) as LandmarkRatios)
          : null;

        const idx = stepRef.current;
        if (idx >= STEPS.length) return;
        if (faceCount === 0 || !vector || vector.length !== 512) return;
        const currStep = STEPS[idx];

        const prevPose = lastPoseRef.current;
        const deltaYaw = prevPose ? Math.abs(yaw - prevPose.yaw) : 0;
        const deltaPitch = prevPose ? Math.abs(pitch - prevPose.pitch) : 0;
        lastPoseRef.current = { yaw, pitch };
        const moving = deltaYaw > 5 || deltaPitch > 5;
        if (!currStep.checkPose(yaw, pitch) || moving) {
          poseStreakRef.current = 0;
          return;
        }
        poseStreakRef.current += 1;
        if (poseStreakRef.current < 3) return;
        const now = Date.now();
        if (now - lastAutoCaptureRef.current < 500) return;
        lastAutoCaptureRef.current = now;
        poseStreakRef.current = 0;
        const norm = Array.from(l2normalize(Float32Array.from(vector)));
        Vibration.vibrate(20);
        Animated.sequence([
          Animated.timing(flashOpacity, { toValue: 0.4, duration: 60, useNativeDriver: true }),
          Animated.timing(flashOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        ]).start();
        setCaptured((prev) => {

          if (prev.length >= (idx + 1) * FRAMES_PER_STEP) return prev;
          return [...prev, norm];
        });

        setCapturedRatios((prev) => {
          if (prev.length >= (idx + 1) * FRAMES_PER_STEP) return prev;
          return [...prev, landmarkRatios];
        });

        console.log(`[PreCall] captured step=${idx} landmark=${landmarkRatios ? 'YES' : 'null'}`);
      }),
    [flashOpacity],
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
        handleEmbeddingOnJS([], 0, 0, 0, null);
        return;
      }

      const aligned = computeAlignedCrop(primary);
      let cropX: number;
      let cropY: number;
      let cropW: number;
      let cropH: number;
      if (aligned != null) {
        cropX = aligned.x;
        cropY = aligned.y;
        cropW = aligned.width;
        cropH = aligned.height;
      } else {
        const _bx = primary.bounds.x;
        const _by = primary.bounds.y;
        const _bw = primary.bounds.width;
        const _bh = primary.bounds.height;
        const _mx = _bw * 0.15;
        const _my = _bh * 0.15;
        cropX = Math.max(0, _bx - _mx);
        cropY = Math.max(0, _by - _my);
        cropW = _bw + _mx * 2;
        cropH = _bh + _my * 2;
      }
      const resized = resize(frame, {
        crop: { x: cropX, y: cropY, width: cropW, height: cropH },
        scale: { width: 112, height: 112 },
        pixelFormat: "rgb",
        dataType: "float32",
      });
      const normalized = new Float32Array(resized.length);
      for (let i = 0; i < resized.length; i++) normalized[i] = resized[i] * 2 - 1;
      const out = faceEmbedModel.runSync([normalized])[0] as Float32Array;

      const rawYaw = (primary as unknown as { yawAngle?: number }).yawAngle ?? 0;
      const rawPitch = (primary as unknown as { pitchAngle?: number }).pitchAngle ?? 0;

      const ratios = computeLandmarkRatios(primary as unknown as { bounds: { x: number; y: number; width: number; height: number }; landmarks?: Record<string, { x: number; y: number }> | null });
      const ratiosJson: string | null = ratios ? JSON.stringify(ratios) : null;

      handleEmbeddingOnJS(Array.from(out), faces.length, rawYaw, rawPitch, ratiosJson);
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

  const handleBack = useCallback(() => {
    if (midCall) {

      nav.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Call", params: { cloneId, name: personaName, image: personaImage } }],
        }),
      );
      return true;
    }
    if (nav.canGoBack()) {
      nav.goBack();
      return true;
    }

    nav.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "MainTabs" }] }));
    return true;
  }, [midCall, nav, cloneId, personaName, personaImage]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => handleBack());
    return () => sub.remove();
  }, [handleBack]);

  useEffect(() => {
    if (step >= STEPS.length) return;
    const target = (step + 1) * FRAMES_PER_STEP;
    if (captured.length >= target) {
      setStep((s) => s + 1);
    }
  }, [captured.length, step]);

  const onSkip = useCallback(() => {
    showAlert(
      "등록 없이 진행",
      "얼굴 인식·기억 기능이 제한될 수 있습니다. 계속하시겠어요?",
      [
        { text: "취소", style: "cancel" },
        { text: "그대로 진행", onPress: goToCall },
      ],
    );
  }, [goToCall]);

  const runEnroll = useCallback(
    (displayName: string, relation: string) => {
      if (!accessToken || !user) {
        setFormError("로그인 정보가 없어요. 다시 시도해 주세요.");
        return;
      }

      if (captured.length < STEPS.length * FRAMES_PER_STEP) {
        setFormError("얼굴 촬영을 먼저 완료해 주세요.");
        return;
      }
      const trimmedName = displayName.trim();
      if (!trimmedName) {
        setFormError("이름을 입력해 주세요.");
        return;
      }
      Keyboard.dismiss();
      setFormError(null);
      setSubmitting(true);
      void (async () => {
        let createdPersonId: number | null = null;
        try {

          let personId: number;
          try {
            const person = await createPerson(accessToken, {
              cloneId,
              displayName: trimmedName,
              enrolledVia: "auto_biometric",
            });
            personId = person.id;
            createdPersonId = person.id;
          } catch (createErr) {
            const msg = (createErr as Error).message ?? "";
            if (/이미 등록된 이름/.test(msg)) {

              const list = await listPersons(accessToken, cloneId);
              const existing = list.items.find((p) => (p.displayName ?? "") === trimmedName);
              if (!existing) throw createErr; 
              personId = existing.id;
              console.log(`[PreCallFaceEnroll] 이미 존재 person 재사용 · id=${personId} · faces 추가`);
            } else {
              throw createErr;
            }
          }
          const CHUNK = 5;
          for (let i = 0; i < captured.length; i += CHUNK) {
            const batch = captured.slice(i, i + CHUNK);

            const ratioBatch = capturedRatios.slice(i, i + CHUNK);
            await enrollFaces(accessToken, personId, batch, cloneId, ratioBatch);
          }
          const trimmedRel = relation.trim();
          if (trimmedRel) {
            try {
              await updatePersonRelation(accessToken, personId, trimmedRel);
            } catch (relErr) {
              console.warn("[PreCallFaceEnroll] updatePersonRelation 실패 (무시):", relErr);
            }
          }
          createdPersonId = null;
          const message = midCall
            ? "얼굴 등록 완료! 통화를 다시 시작합니다."
            : "얼굴 인식 준비가 끝났어요. 통화를 시작합니다.";
          showAlert("등록 완료", message, [{ text: "통화 시작", onPress: goToCall }]);
        } catch (err) {
          console.warn("[PreCallFaceEnroll] enroll 실패:", err);
          if (createdPersonId != null) {
            try {
              await deletePerson(accessToken, createdPersonId);
            } catch (delErr) {
              console.warn("[PreCallFaceEnroll] rollback 실패:", delErr);
            }
          }
          setFormError((err as Error).message ?? "네트워크 오류");
          setSubmitting(false);
        }
      })();
    },
    [accessToken, user, captured, capturedRatios, cloneId, midCall, goToCall],
  );

  const onSubmit = useCallback(() => {
    runEnroll(formName, formRelation);
  }, [runEnroll, formName, formRelation]);

  const autoEnrollTriedRef = useRef(false);
  const captureDone = step >= STEPS.length;
  useEffect(() => {
    if (!captureDone || midCall || autoEnrollTriedRef.current || submitting) return;
    const defaultName = (user?.name ?? "").trim() || "나";
    autoEnrollTriedRef.current = true;
    runEnroll(defaultName, "");
  }, [captureDone, midCall, submitting, user, runEnroll]);

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
    <View style={[s.container, { paddingBottom: insets.bottom }]}>
      {}
      <PageHeader showBackButton onBackPress={() => nav.goBack()} transparent />

      {
}
      {!(done && midCall) && (
        <View style={s.header}>
          <Text style={s.title}>얼굴 등록</Text>
          <Text style={s.subtitle}>
            {midCall
              ? "새 얼굴을 등록하고 통화를 다시 시작해요."
              : `${personaName ?? "페르소나"} 과 자연스럽게 대화하도록 얼굴을 각도·거리별로 담아둘게요.`}
          </Text>
        </View>
      )}

      {}
      {done && midCall ? (
        <KeyboardAvoidingView
          style={s.centerBlock}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Text style={s.formTitle}>이 분은 누구신가요?</Text>
          <Text style={s.formDesc}>
            이름과 관계를 알려주시면 다음 통화부터 알아볼 수 있어요.
          </Text>
          {existingPersons.length > 0 && (
            <View style={s.chipSection}>
              <Text style={s.chipSectionLabel}>이미 등록된 사람 (이 중에서 선택하면 학습만 추가돼요)</Text>
              <View style={s.chipRow}>
                {existingPersons.map((p) => {
                  const active = formName.trim() === (p.displayName ?? "").trim();
                  return (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => setFormName(p.displayName ?? "")}
                      style={[s.personChip, active && s.personChipActive]}
                      disabled={submitting}
                    >
                      <Text style={[s.personChipText, active && s.personChipTextActive]}>
                        {p.displayName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={s.chipHint}>새로운 사람이면 아래에 이름을 직접 입력하세요</Text>
            </View>
          )}
          <Text style={s.formLabel}>이름</Text>
          <TextInput
            style={s.formInput}
            value={formName}
            onChangeText={setFormName}
            placeholder="예: 지호"
            placeholderTextColor={COLORS.zinc500}
            autoFocus
            returnKeyType="next"
            editable={!submitting}
          />
          <Text style={s.formLabel}>관계 (선택)</Text>
          <TextInput
            style={s.formInput}
            value={formRelation}
            onChangeText={setFormRelation}
            placeholder="예: 손주, 오랜 친구"
            placeholderTextColor={COLORS.zinc500}
            returnKeyType="done"
            editable={!submitting}
            onSubmitEditing={onSubmit}
          />
          {formError ? <Text style={s.formError}>{formError}</Text> : null}
        </KeyboardAvoidingView>
      ) : done && !midCall ? (

        <View style={s.centerBlock}>
          <ActivityIndicator size="large" color={COLORS.white} />
          <Text style={s.hint}>얼굴 등록 중...</Text>
        </View>
      ) : (
        <View style={s.centerBlock}>
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
            <Text style={s.stepLabel}>
              {step + 1}/{STEPS.length} · {currentStep.label} · {Math.max(0, captured.length - step * FRAMES_PER_STEP)}/{FRAMES_PER_STEP}
            </Text>
            <Text style={s.stepHint}>{currentStep.hint}</Text>
            {}
            <Text style={[s.stepHint, { marginTop: 4, opacity: 0.7 }]}>
              {pose
                ? currentStep.guide(pose.yaw, pose.pitch)
                : "얼굴이 카메라에 잘 보이도록 해주세요"}
            </Text>
          </View>

          <View style={s.progressRow}>
            {STEPS.map((sItem, idx) => (
              <View
                key={sItem.key}
                style={[s.dot, idx < step && s.dotDone, idx === step && !done && s.dotActive]}
              />
            ))}
          </View>
        </View>
      )}

      {}
      <View style={s.bottomBlock}>
        {done ? (
          <TouchableOpacity
            onPress={onSubmit}
            style={[s.captureBtn, submitting && s.captureBtnDisabled]}
            disabled={submitting || !formName.trim()}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.zinc900} />
            ) : (
              <Text style={s.captureBtnText}>등록</Text>
            )}
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity onPress={onSkip} style={s.skipBtn} disabled={submitting}>
          <Text style={s.skipBtnText}>
            {midCall ? "등록 없이 통화 재개" : "나중에 하기 (지금 통화)"}
          </Text>
        </TouchableOpacity>

        {}
        <Text style={s.privacyNote}>
          촬영한 사진은 서버에 저장되지 않아요. 얼굴을 알아보기 위한 숫자 특징(벡터)만 안전하게 담아둡니다.
        </Text>
      </View>

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
  container: { flex: 1, backgroundColor: COLORS.zinc950, padding: 20 },
  center: { alignItems: "center", justifyContent: "center", gap: 12 },
  header: { alignItems: "center", gap: 6, marginBottom: 8 },
  centerBlock: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },

  bottomBlock: { gap: 0 },
  privacyNote: {
    color: COLORS.zinc400,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 16,
    paddingHorizontal: 12,
  },

  formTitle: { color: COLORS.white, fontSize: 20, fontWeight: "700", textAlign: "center" },
  formDesc: { color: COLORS.zinc300, fontSize: 13, textAlign: "center", marginTop: 6, marginBottom: 20 },
  formLabel: { color: COLORS.zinc300, fontSize: 13, alignSelf: "flex-start", marginTop: 12, marginBottom: 6 },
  formInput: {
    alignSelf: "stretch",
    backgroundColor: COLORS.zinc900,
    color: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  formError: { color: "#f87171", fontSize: 12, marginTop: 10, alignSelf: "flex-start" },
  chipSection: { alignSelf: "stretch", marginTop: 12, marginBottom: 4 },
  chipSectionLabel: { color: COLORS.zinc400, fontSize: 12, marginBottom: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  personChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: COLORS.zinc800, borderWidth: 1, borderColor: COLORS.zinc700,
  },
  personChipActive: { backgroundColor: "#1e3a8a", borderColor: "#60a5fa" },
  personChipText: { color: COLORS.zinc200, fontSize: 13, fontWeight: "600" },
  personChipTextActive: { color: COLORS.white, fontWeight: "700" },
  chipHint: { color: COLORS.zinc500, fontSize: 11, marginTop: 8, fontStyle: "italic" },
  captureBtnDisabled: { opacity: 0.6 },
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

    marginTop: 0,
  },
  captureBtnText: { color: COLORS.zinc900, fontSize: 16, fontWeight: "700" },
  skipBtn: {

    paddingTop: 12,
    paddingBottom: 4,
    alignItems: "center",
  },
  skipBtnText: { color: COLORS.zinc400, fontSize: 13, textDecorationLine: "underline" },
  hint: { color: COLORS.zinc300, fontSize: 14, textAlign: "center" },

  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.white,
  },
});
