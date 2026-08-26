

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  Camera as VisionCamera,
  useCameraDevice,
  useFrameProcessor,
} from "react-native-vision-camera";
import { useFaceDetector } from "react-native-vision-camera-face-detector";
import { useTensorflowModel } from "react-native-fast-tflite";
import { useResizePlugin } from "vision-camera-resize-plugin";
import { Worklets, useSharedValue } from "react-native-worklets-core";
import { l2normalize } from "../../face/l2normalize";
import { largestFace } from "../../face/largestFace";
import { normalizeFrameTimestampMs } from "../../face/frameTimestamp";
import { useAuthStore } from "../../stores/authStore";
import { listPersons, matchFace } from "../../api/persons";
import { showAlert } from "../../stores/dialogStore";
import { COLORS, RADIUS } from "../../components/constants";
import PageHeader from "../../components/common/PageHeader";

interface Person {
  id: number;
  cloneId: number | null;
  displayName: string | null;
  faceCount: number;
  isSelf: boolean;
}
interface LastMatch {
  personId: number | null;
  displayName: string | null;
  score: number;
  threshold: number;
  ts: number;
}

const AUTO_ENROLL_THRESHOLD = 0.75;
const FACE_DETECTOR_OPTIONS = {
  performanceMode: "fast",
  landmarkMode: "none",
  contourMode: "none",
  classificationMode: "none",
  minFaceSize: 0.2,
} as const;
const BB_MARGIN = 0.15;
const MATCH_INTERVAL_MS = 800; 

export default function FaceThresholdTestScreen() {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const apiUser = useAuthStore((s) => s.apiUser);
  const isAndroidFrame = Platform.OS === "android";

  const device = useCameraDevice("front");
  const { detectFaces } = useFaceDetector(FACE_DETECTOR_OPTIONS);
  const { resize } = useResizePlugin();
  const modelPlugin = useTensorflowModel(require("../../../assets/models/w600k_mbf.tflite"));
  const model = modelPlugin.state === "loaded" ? modelPlugin.model : null;

  const [permissionOk, setPermissionOk] = useState<boolean | null>(null);
  const [persons, setPersons] = useState<Person[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [lastMatch, setLastMatch] = useState<LastMatch | null>(null);
  const [scoreHistory, setScoreHistory] = useState<{ score: number; ts: number }[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);

  const lastEmbedTs = useSharedValue(0);
  const busyRef = useRef(false);

  const accessTokenRef = useRef<string | null>(null);
  const selectedPersonRef = useRef<Person | null>(null);
  const apiUserRef = useRef<typeof apiUser>(null);
  useEffect(() => { accessTokenRef.current = accessToken; }, [accessToken]);
  useEffect(() => { apiUserRef.current = apiUser; }, [apiUser]);

  useEffect(() => {
    void (async () => {
      const status = await VisionCamera.requestCameraPermission();
      setPermissionOk(status === "granted");
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      if (!accessToken) return;
      try {
        const r = await listPersons(accessToken);
        const items: Person[] = r.items
          .map((p) => ({
            id: p.id,
            cloneId: p.cloneId ?? null,
            displayName: p.displayName ?? null,
            faceCount: p.faceCount ?? 0,
            isSelf: p.isSelf ?? false,
          }))
          .filter((p) => p.cloneId != null);
        setPersons(items);
        if (items.length > 0 && selectedPersonId == null) setSelectedPersonId(items[0].id);
      } catch (e) {
        console.warn("[FaceTest] listPersons 실패:", e);
      }
    })();
  }, [accessToken, selectedPersonId]);

  const selectedPerson = useMemo(
    () => persons.find((p) => p.id === selectedPersonId) ?? null,
    [persons, selectedPersonId],
  );
  useEffect(() => { selectedPersonRef.current = selectedPerson; }, [selectedPerson]);

  const handleEmbeddingOnJS = useMemo(
    () =>
      Worklets.createRunOnJS((vec: number[], hasFace: boolean) => {
        setFaceDetected(hasFace);
        if (!hasFace) return;
        const token = accessTokenRef.current;
        const user = apiUserRef.current;
        const person = selectedPersonRef.current;
        if (!token || !user || !person || person.cloneId == null) return;
        if (busyRef.current) return;
        busyRef.current = true;
        const norm = l2normalize(Float32Array.from(vec));
        (async () => {
          try {
            const r = await matchFace(token, norm, person.cloneId!);
            const best = r.best;
            const ts = Date.now();
            const s = best?.score ?? (r.matches[0]?.score ?? 0);
            setLastMatch({
              personId: best?.personId ?? null,
              displayName: best?.displayName ?? null,
              score: s,
              threshold: r.threshold,
              ts,
            });
            setScoreHistory((prev) => [...prev, { score: s, ts }].slice(-30));
          } catch (e) {
            console.warn("[FaceTest] matchFace 실패:", e);
          } finally {
            busyRef.current = false;
          }
        })();
      }),
    [],
  );

  const faceFrameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      if (!model) return;
      const nowMs = normalizeFrameTimestampMs(frame.timestamp, isAndroidFrame);
      if (nowMs - lastEmbedTs.value < MATCH_INTERVAL_MS) return;
      const faces = detectFaces(frame);
      const primary = largestFace(faces);
      if (primary == null) {
        handleEmbeddingOnJS([], false);
        return;
      }
      lastEmbedTs.value = nowMs;

      const bx = primary.bounds.x;
      const by = primary.bounds.y;
      const bw = primary.bounds.width;
      const bh = primary.bounds.height;
      const mx = bw * BB_MARGIN;
      const my = bh * BB_MARGIN;
      const resized = resize(frame, {
        crop: {
          x: Math.max(0, bx - mx),
          y: Math.max(0, by - my),
          width: bw + mx * 2,
          height: bh + my * 2,
        },
        scale: { width: 112, height: 112 },
        pixelFormat: "rgb",
        dataType: "float32",
      });
      const normalized = new Float32Array(resized.length);
      for (let i = 0; i < resized.length; i++) normalized[i] = resized[i] * 2 - 1;
      const out = model.runSync([normalized])[0] as Float32Array;
      handleEmbeddingOnJS(Array.from(out), true);
    },
    [detectFaces, model, resize, lastEmbedTs, isAndroidFrame, handleEmbeddingOnJS],
  );

  const scoreColor = (score: number, matchTh: number, enrollTh: number) => {
    if (score >= enrollTh) return { bg: "#0f3d1f", tag: "#22c55e", label: `enroll ≥${enrollTh.toFixed(2)}` };
    if (score >= matchTh) return { bg: "#3d3410", tag: "#eab308", label: `match ≥${matchTh.toFixed(2)}` };
    return { bg: "#3d0f0f", tag: "#ef4444", label: `unknown <${matchTh.toFixed(2)}` };
  };

  if (permissionOk === false) {
    return (
      <View style={[s.container, { paddingBottom: insets.bottom }]}>
        <PageHeader showBackButton onBackPress={() => nav.goBack()} transparent />
        <View style={s.centerBlock}>
          <Text style={s.err}>카메라 권한이 없어요.</Text>
          <TouchableOpacity onPress={() => showAlert("권한", "설정에서 카메라 권한을 허용해 주세요.")}>
            <Text style={s.linkText}>권한 요청 안내</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const th = lastMatch?.threshold ?? 0.55;

  return (
    <View style={[s.container, { paddingBottom: insets.bottom }]}>
      <PageHeader showBackButton onBackPress={() => nav.goBack()} transparent />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <Text style={s.title}>얼굴 임계값 테스트 (라이브)</Text>
        <Text style={s.desc}>
          카메라 프리뷰 + 실 통화와 동일 pipeline (frameProcessor + libyuv resize + tflite).
          실시간 매칭 score 는 통화 중 값과 정확히 같음.
        </Text>

        {}
        <View style={s.thresholdBanner}>
          <Text style={s.thresholdBannerTitle}>현재 임계값</Text>
          <View style={s.thresholdRow}>
            <View style={[s.thChip, { backgroundColor: "#eab308" }]}>
              <Text style={s.thChipLabel}>match</Text>
              <Text style={s.thChipVal}>≥ {th.toFixed(2)}</Text>
            </View>
            <Text style={s.thExplain}>서버 · 통화 매칭 게이트</Text>
          </View>
          <View style={s.thresholdRow}>
            <View style={[s.thChip, { backgroundColor: "#22c55e" }]}>
              <Text style={s.thChipLabel}>enroll</Text>
              <Text style={s.thChipVal}>≥ {AUTO_ENROLL_THRESHOLD.toFixed(2)}</Text>
            </View>
            <Text style={s.thExplain}>앱 · auto-enroll 학습 게이트</Text>
          </View>
        </View>

        {modelPlugin.state === "loading" && (
          <View style={s.loading}>
            <ActivityIndicator color={COLORS.white} />
            <Text style={s.loadingText}>모델 로딩 중...</Text>
          </View>
        )}
        {modelPlugin.state === "error" && (
          <Text style={s.err}>모델 로드 실패: {String(modelPlugin.error)}</Text>
        )}

        {}
        <View style={s.cameraBox}>
          {device && permissionOk && model ? (
            <VisionCamera
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={running}
              frameProcessor={running ? faceFrameProcessor : undefined}
              pixelFormat="yuv"
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, s.cameraPlaceholder]}>
              <Text style={s.desc}>{!device ? "카메라 없음" : !model ? "모델 로딩 중" : "권한 확인 중"}</Text>
            </View>
          )}
          {running && !faceDetected && (
            <View style={s.overlay}>
              <Text style={s.overlayText}>얼굴을 프레임에 맞춰주세요</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => {
            setRunning((v) => !v);
            setLastMatch(null);
            setScoreHistory([]);
          }}
          disabled={!model || !selectedPersonId}
          style={[s.calcBtn, (!model || !selectedPersonId) && s.calcBtnDisabled]}
        >
          <Text style={s.calcBtnText}>{running ? "중지" : "라이브 매칭 시작"}</Text>
        </TouchableOpacity>

        <Text style={s.label}>저장된 person ({persons.length})</Text>
        {persons.length === 0 ? (
          <Text style={s.err}>등록된 person 이 없어요. MyScreen 얼굴 5각도 등록 먼저 진행하세요.</Text>
        ) : (
          persons.map((p) => {
            const active = p.id === selectedPersonId;
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => setSelectedPersonId(p.id)}
                activeOpacity={0.7}
                style={[s.personItem, active && s.personItemActive]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[s.personText, active && s.personTextActive]}>
                    {p.displayName ?? "(이름없음)"} {p.isSelf ? "★self" : ""}
                  </Text>
                  <Text style={s.personMeta}>personId {p.id} · cloneId {p.cloneId}</Text>
                </View>
                <View style={s.faceCountBadge}>
                  <Text style={s.faceCountNum}>{p.faceCount}</Text>
                  <Text style={s.faceCountLbl}>faces</Text>
                </View>
                {active && <View style={s.selectMark}><Text style={s.selectMarkText}>✓</Text></View>}
              </TouchableOpacity>
            );
          })
        )}

        {err && <Text style={s.err}>{err}</Text>}

        {lastMatch && (
          <View style={s.resultCard}>
            <Text style={s.resultTitle}>실시간 매칭</Text>
            {(() => {
              const c = scoreColor(lastMatch.score, lastMatch.threshold, AUTO_ENROLL_THRESHOLD);
              const passMatch = lastMatch.score >= lastMatch.threshold;
              const passEnroll = lastMatch.score >= AUTO_ENROLL_THRESHOLD;
              return (
                <View style={[s.matchRow, { backgroundColor: c.bg }]}>
                  <Text style={s.matchScore}>{lastMatch.score.toFixed(3)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.matchName}>{lastMatch.displayName ?? "(unknown)"}</Text>
                    <Text style={s.matchMeta}>
                      personId {lastMatch.personId ?? "—"} · match {passMatch ? "✓" : "✗"} / enroll {passEnroll ? "✓" : "✗"}
                    </Text>
                  </View>
                  <View style={[s.chip, { backgroundColor: c.tag }]}>
                    <Text style={s.chipText}>{c.label}</Text>
                  </View>
                </View>
              );
            })()}
            <View style={s.divider} />
            <Text style={s.sectionSub}>최근 {scoreHistory.length} 회 score</Text>
            <View style={s.historyRow}>
              {scoreHistory.map((h, i) => {
                const c = scoreColor(h.score, th, AUTO_ENROLL_THRESHOLD);
                return (
                  <View key={i} style={[s.historyDot, { backgroundColor: c.tag }]}>
                    <Text style={s.historyDotText}>{h.score.toFixed(2)}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={s.thresholdInfo}>
              match ≥{lastMatch.threshold.toFixed(2)} (서버) · enroll ≥{AUTO_ENROLL_THRESHOLD.toFixed(2)} (앱)
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.zinc950 },
  title: { color: COLORS.white, fontSize: 20, fontWeight: "700", marginBottom: 6 },
  desc: { color: COLORS.zinc400, fontSize: 12, lineHeight: 18, marginBottom: 12 },
  centerBlock: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  linkText: { color: "#60a5fa", fontSize: 13, marginTop: 12 },
  loading: { flexDirection: "row", gap: 8, padding: 12, alignItems: "center" },
  loadingText: { color: COLORS.zinc300, fontSize: 13 },
  thresholdBanner: {
    marginTop: 8, marginBottom: 8, padding: 12, borderRadius: RADIUS.md,
    backgroundColor: COLORS.zinc900, borderWidth: 1, borderColor: COLORS.zinc800,
  },
  thresholdBannerTitle: { color: COLORS.white, fontSize: 12, fontWeight: "700", marginBottom: 6, letterSpacing: 0.5 },
  thresholdRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  thChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, minWidth: 90, alignItems: "center" },
  thChipLabel: { color: COLORS.white, fontSize: 10, fontWeight: "700", opacity: 0.85 },
  thChipVal: { color: COLORS.white, fontSize: 13, fontWeight: "800", fontVariant: ["tabular-nums"] },
  thExplain: { color: COLORS.zinc400, fontSize: 11, flex: 1 },
  cameraBox: {
    marginTop: 12, aspectRatio: 3 / 4, borderRadius: RADIUS.md, overflow: "hidden",
    backgroundColor: COLORS.zinc900, position: "relative",
  },
  cameraPlaceholder: { alignItems: "center", justifyContent: "center" },
  overlay: {
    position: "absolute", left: 0, right: 0, bottom: 12, alignItems: "center",
  },
  overlayText: {
    color: COLORS.white, fontSize: 12, backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
  },
  label: { color: COLORS.zinc300, fontSize: 13, fontWeight: "600", marginTop: 20, marginBottom: 8 },
  personItem: {
    padding: 12, borderRadius: RADIUS.sm, backgroundColor: COLORS.zinc900,
    marginBottom: 6, borderWidth: 1, borderColor: COLORS.zinc800,
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  personItemActive: { borderColor: "#60a5fa", borderWidth: 2, backgroundColor: "#1e293b" },
  personText: { color: COLORS.zinc300, fontSize: 14 },
  personTextActive: { color: COLORS.white, fontWeight: "700" },
  personMeta: { color: COLORS.zinc500, fontSize: 10, marginTop: 2 },
  faceCountBadge: { backgroundColor: COLORS.zinc800, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, alignItems: "center", minWidth: 48 },
  faceCountNum: { color: COLORS.white, fontSize: 16, fontWeight: "800", fontVariant: ["tabular-nums"] },
  faceCountLbl: { color: COLORS.zinc400, fontSize: 9 },
  selectMark: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#60a5fa", alignItems: "center", justifyContent: "center" },
  selectMarkText: { color: COLORS.zinc900, fontSize: 14, fontWeight: "800" },
  calcBtn: { backgroundColor: COLORS.white, padding: 14, borderRadius: RADIUS.full, alignItems: "center", marginTop: 12 },
  calcBtnDisabled: { opacity: 0.4 },
  calcBtnText: { color: COLORS.zinc900, fontSize: 16, fontWeight: "700" },
  err: { color: "#f87171", fontSize: 13, marginTop: 12, lineHeight: 18 },
  resultCard: { marginTop: 20, padding: 12, backgroundColor: COLORS.zinc900, borderRadius: RADIUS.md },
  resultTitle: { color: COLORS.white, fontSize: 15, fontWeight: "700", marginBottom: 10 },
  matchRow: { flexDirection: "row", gap: 10, padding: 10, borderRadius: RADIUS.sm, marginBottom: 6, alignItems: "center" },
  matchScore: { color: COLORS.white, fontSize: 20, fontWeight: "700", minWidth: 70, fontVariant: ["tabular-nums"] },
  matchName: { color: COLORS.white, fontSize: 14, fontWeight: "600" },
  matchMeta: { color: COLORS.zinc400, fontSize: 11, marginTop: 2 },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  chipText: { color: COLORS.white, fontSize: 10, fontWeight: "700" },
  divider: { height: 1, backgroundColor: COLORS.zinc800, marginTop: 10, marginBottom: 10 },
  sectionSub: { color: COLORS.zinc400, fontSize: 11, fontWeight: "600", marginBottom: 6 },
  historyRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  historyDot: { paddingHorizontal: 5, paddingVertical: 3, borderRadius: 4, minWidth: 32, alignItems: "center" },
  historyDotText: { color: "#000", fontSize: 9, fontWeight: "700", fontVariant: ["tabular-nums"] },
  thresholdInfo: { color: COLORS.zinc400, fontSize: 11, marginTop: 8, textAlign: "center" },
});
