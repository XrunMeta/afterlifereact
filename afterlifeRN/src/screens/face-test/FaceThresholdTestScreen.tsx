

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useTensorflowModel } from "react-native-fast-tflite";
import * as JPEG from "jpeg-js";
import { Buffer } from "buffer";
import FaceDetection from "@react-native-ml-kit/face-detection";
import { Image as RNImage } from "react-native";
import { l2normalize } from "../../face/l2normalize";
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
interface Match { personId: number; displayName: string | null; score: number }
interface Result {
  matches: Match[];
  matchThreshold: number;
  autoEnrollThreshold: number;
  vectorPreview: number[]; 
  detected: boolean;       
  faceRatio: number;       
  cropUri?: string;        
}

const CENTER_112 = 112;

const AUTO_ENROLL_THRESHOLD = 0.75;

const BB_MARGIN = 0.15;

function getImgSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    RNImage.getSize(uri, (w, h) => resolve({ width: w, height: h }), reject);
  });
}

export default function FaceThresholdTestScreen() {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const apiUser = useAuthStore((s) => s.apiUser);

  const modelPlugin = useTensorflowModel(require("../../../assets/models/w600k_mbf.tflite"));
  const model = modelPlugin.state === "loaded" ? modelPlugin.model : null;

  const [imgUri, setImgUri] = useState<string | null>(null);
  const [persons, setPersons] = useState<Person[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const loadPersons = useCallback(async () => {
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
      console.log(`[FaceTest] persons loaded: ${items.length}`, items);
      setPersons(items);
      if (items.length > 0 && selectedPersonId == null) setSelectedPersonId(items[0].id);
    } catch (e) {
      console.warn("[FaceTest] listPersons 실패:", e);
    }
  }, [accessToken, selectedPersonId]);

  useEffect(() => {
    void loadPersons();
  }, [loadPersons]);

  const pickImage = useCallback(async () => {
    setErr(null);
    setResult(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showAlert("권한 필요", "갤러리 접근 권한을 허용해 주세요.");
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
    if (r.canceled || r.assets.length === 0) return;
    setImgUri(r.assets[0].uri);
  }, []);

  const selectedPerson = useMemo(() => persons.find((p) => p.id === selectedPersonId) ?? null, [persons, selectedPersonId]);

  const calculate = useCallback(async () => {
    if (!imgUri) { setErr("이미지를 먼저 선택해 주세요."); return; }
    if (!selectedPerson || selectedPerson.cloneId == null) { setErr("person 을 선택해 주세요."); return; }
    if (!model) { setErr("모델 로딩 중입니다."); return; }
    if (!accessToken || !apiUser) { setErr("로그인 정보가 없어요."); return; }
    setBusy(true); setErr(null); setResult(null);
    try {

      const { width: imgW, height: imgH } = await getImgSize(imgUri);
      let cropUri = imgUri;
      let detected = false;
      let faceRatio = 0;
      try {
        const faces = await FaceDetection.detect(imgUri, {
          performanceMode: "accurate",
          landmarkMode: "none",
          contourMode: "none",
          classificationMode: "none",
          minFaceSize: 0.1,
        });
        if (faces && faces.length > 0) {

          const primary = faces.reduce((a, b) =>
            a.frame.width * a.frame.height >= b.frame.width * b.frame.height ? a : b,
          );
          const fw = primary.frame.width;
          const fh = primary.frame.height;
          faceRatio = Math.max(fw, fh) / Math.max(imgW, imgH);

          const cx = primary.frame.left + fw / 2;
          const cy = primary.frame.top + fh / 2;
          const side = Math.max(fw, fh) * (1 + BB_MARGIN * 2);
          const originX = Math.max(0, Math.min(imgW - side, cx - side / 2));
          const originY = Math.max(0, Math.min(imgH - side, cy - side / 2));
          const cropSide = Math.min(side, imgW - originX, imgH - originY);
          const manipCrop = await ImageManipulator.manipulateAsync(
            imgUri,
            [{ crop: { originX, originY, width: cropSide, height: cropSide } }],
            { compress: 1, format: ImageManipulator.SaveFormat.JPEG },
          );
          cropUri = manipCrop.uri;
          detected = true;
          console.log(`[FaceTest] face detected · ratio=${faceRatio.toFixed(2)} · bb=${fw.toFixed(0)}x${fh.toFixed(0)}`);
        } else {
          console.warn("[FaceTest] no face detected — 원본 이미지 그대로 넣음 (score 부정확)");
        }
      } catch (e) {
        console.warn("[FaceTest] face detection 실패:", e);
      }

      const manip = await ImageManipulator.manipulateAsync(
        cropUri,
        [{ resize: { width: CENTER_112, height: CENTER_112 } }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );
      if (!manip.base64) throw new Error("이미지 인코딩 실패");

      const jpegBytes = Buffer.from(manip.base64, "base64");
      const decoded = JPEG.decode(jpegBytes, { useTArray: true });

      const rgb = new Float32Array(CENTER_112 * CENTER_112 * 3);
      for (let i = 0, j = 0; i < decoded.data.length; i += 4, j += 3) {
        rgb[j] = (decoded.data[i] / 255) * 2 - 1;
        rgb[j + 1] = (decoded.data[i + 1] / 255) * 2 - 1;
        rgb[j + 2] = (decoded.data[i + 2] / 255) * 2 - 1;
      }

      const out = model.runSync([rgb])[0] as Float32Array;

      const normalized = l2normalize(out);

      const r = await matchFace(accessToken, Array.from(normalized), selectedPerson.cloneId);
      setResult({
        matches: r.matches,
        matchThreshold: r.threshold,
        autoEnrollThreshold: AUTO_ENROLL_THRESHOLD,
        vectorPreview: Array.from(normalized.slice(0, 8)),
        detected,
        faceRatio,
        cropUri: detected ? manip.uri : undefined,
      });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [imgUri, selectedPerson, model, accessToken, apiUser]);

  const scoreColor = (score: number, matchTh: number, enrollTh: number) => {
    if (score >= enrollTh) return { bg: "#0f3d1f", tag: "#22c55e", label: `enroll+match ≥${enrollTh.toFixed(2)}` };
    if (score >= matchTh) return { bg: "#3d3410", tag: "#eab308", label: `match ≥${matchTh.toFixed(2)}` };
    return { bg: "#3d0f0f", tag: "#ef4444", label: `unknown <${matchTh.toFixed(2)}` };
  };

  const displayMatchTh = result?.matchThreshold ?? 0.55;

  return (
    <View style={[s.container, { paddingBottom: insets.bottom }]}>
      <PageHeader showBackButton onBackPress={() => nav.goBack()} transparent />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <Text style={s.title}>얼굴 임계값 테스트 (dev)</Text>
        <Text style={s.desc}>
          갤러리 이미지 → 앱과 동일 tflite 로 512-D 임베딩 → 서버 매칭. 얼굴 정면이 화면 대부분을 차지하는 사진 사용 권장 (얼굴 검출 X).
        </Text>

        {}
        <View style={s.thresholdBanner}>
          <Text style={s.thresholdBannerTitle}>현재 임계값</Text>
          <View style={s.thresholdRow}>
            <View style={[s.thChip, { backgroundColor: "#eab308" }]}>
              <Text style={s.thChipLabel}>match</Text>
              <Text style={s.thChipVal}>≥ {displayMatchTh.toFixed(2)}</Text>
            </View>
            <Text style={s.thExplain}>서버 · 통화 중 얼굴 이름 부르기 게이트 (관대)</Text>
          </View>
          <View style={s.thresholdRow}>
            <View style={[s.thChip, { backgroundColor: "#22c55e" }]}>
              <Text style={s.thChipLabel}>enroll</Text>
              <Text style={s.thChipVal}>≥ {AUTO_ENROLL_THRESHOLD.toFixed(2)}</Text>
            </View>
            <Text style={s.thExplain}>앱 · auto-enroll 학습 게이트 (엄격)</Text>
          </View>
        </View>

        {modelPlugin.state === "loading" && (
          <View style={s.loading}><ActivityIndicator color={COLORS.white} /><Text style={s.loadingText}>모델 로딩 중...</Text></View>
        )}
        {modelPlugin.state === "error" && (
          <Text style={s.err}>모델 로드 실패: {String(modelPlugin.error)}</Text>
        )}

        <TouchableOpacity onPress={pickImage} style={s.pickBtn}>
          <Text style={s.pickBtnText}>{imgUri ? "이미지 다시 선택" : "이미지 선택"}</Text>
        </TouchableOpacity>
        {imgUri && <Image source={{ uri: imgUri }} style={s.preview} resizeMode="cover" />}

        <View style={s.personHeader}>
          <Text style={s.label}>저장된 person ({persons.length})</Text>
          <TouchableOpacity onPress={() => void loadPersons()}>
            <Text style={s.refreshBtn}>새로고침</Text>
          </TouchableOpacity>
        </View>
        {persons.length === 0 ? (
          <Text style={s.err}>
            등록된 person 이 하나도 없어요. MyScreen → "얼굴 5각도 등록 (dev)" 로 먼저
            등록하거나, 페르소나에 실제 통화해서 auto-enroll 이 person 을 만들면 여기 뜹니다.
          </Text>
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
                {active && (
                  <View style={s.selectMark}><Text style={s.selectMarkText}>✓</Text></View>
                )}
              </TouchableOpacity>
            );
          })
        )}

        <TouchableOpacity
          onPress={calculate}
          disabled={busy || !imgUri || !selectedPersonId || !model}
          style={[s.calcBtn, (busy || !imgUri || !selectedPersonId || !model) && s.calcBtnDisabled]}
        >
          {busy ? <ActivityIndicator color={COLORS.zinc900} /> : <Text style={s.calcBtnText}>임계값 계산</Text>}
        </TouchableOpacity>

        {err && <Text style={s.err}>{err}</Text>}

        {result && (
          <View style={s.resultCard}>
            <View style={s.detectRow}>
              <View
                style={[
                  s.detectChip,
                  { backgroundColor: result.detected ? "#22c55e" : "#ef4444" },
                ]}
              >
                <Text style={s.detectChipText}>
                  {result.detected ? `얼굴 검출 ✓ (${(result.faceRatio * 100).toFixed(0)}%)` : "얼굴 검출 ✗ (원본 fallback)"}
                </Text>
              </View>
              {result.cropUri && (
                <Image source={{ uri: result.cropUri }} style={s.cropThumb} resizeMode="cover" />
              )}
            </View>
            <Text style={s.resultTitle}>매칭 결과 (top {result.matches.length})</Text>
            {result.matches.length === 0 ? (
              <Text style={s.desc}>매칭된 person 없음 (해당 clone 스코프에 저장된 얼굴 자체가 없거나, 모든 후보가 top-3 밖).</Text>
            ) : result.matches.map((m) => {
              const c = scoreColor(m.score, result.matchThreshold, result.autoEnrollThreshold);
              const passMatch = m.score >= result.matchThreshold;
              const passEnroll = m.score >= result.autoEnrollThreshold;
              return (
                <View key={m.personId} style={[s.matchRow, { backgroundColor: c.bg }]}>
                  <Text style={s.matchScore}>{m.score.toFixed(3)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.matchName}>{m.displayName ?? "(이름없음)"}</Text>
                    <Text style={s.matchMeta}>
                      personId {m.personId} · match {passMatch ? "✓" : "✗"} / enroll {passEnroll ? "✓" : "✗"}
                    </Text>
                  </View>
                  <View style={[s.chip, { backgroundColor: c.tag }]}>
                    <Text style={s.chipText}>{c.label}</Text>
                  </View>
                </View>
              );
            })}
            <View style={s.divider} />
            <Text style={s.sectionSub}>임베딩 (첫 8차원 · L2 정규화 후)</Text>
            <Text style={s.vectorPreview}>
              [{result.vectorPreview.map((v) => v.toFixed(3)).join(", ")}, …]
            </Text>
            <Text style={s.thresholdInfo}>
              match ≥{result.matchThreshold.toFixed(2)} (서버 게이트) · enroll ≥{result.autoEnrollThreshold.toFixed(2)} (앱 auto-enroll)
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
  pickBtn: { backgroundColor: COLORS.zinc800, padding: 14, borderRadius: RADIUS.md, alignItems: "center", marginTop: 8 },
  pickBtnText: { color: COLORS.white, fontSize: 14, fontWeight: "600" },
  preview: { width: 200, height: 200, borderRadius: RADIUS.md, marginTop: 12, alignSelf: "center", backgroundColor: COLORS.zinc900 },
  personHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20, marginBottom: 8 },
  label: { color: COLORS.zinc300, fontSize: 13, fontWeight: "600" },
  refreshBtn: { color: "#60a5fa", fontSize: 12, fontWeight: "600" },
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
  calcBtn: { backgroundColor: COLORS.white, padding: 14, borderRadius: RADIUS.full, alignItems: "center", marginTop: 20 },
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
  sectionSub: { color: COLORS.zinc400, fontSize: 11, fontWeight: "600", marginBottom: 4 },
  vectorPreview: { color: COLORS.zinc300, fontSize: 11, fontFamily: "monospace", lineHeight: 16 },
  thresholdInfo: { color: COLORS.zinc400, fontSize: 11, marginTop: 8, textAlign: "center" },
  detectRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  detectChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, flex: 1 },
  detectChipText: { color: COLORS.white, fontSize: 11, fontWeight: "700", textAlign: "center" },
  cropThumb: { width: 56, height: 56, borderRadius: 6, backgroundColor: COLORS.zinc800 },
});
