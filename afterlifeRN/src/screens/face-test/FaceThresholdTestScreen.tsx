

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useTensorflowModel } from "react-native-fast-tflite";
import * as JPEG from "jpeg-js";
import { Buffer } from "buffer";
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
}
interface Match { personId: number; displayName: string | null; score: number }
interface Result { matches: Match[]; matchThreshold: number; autoEnrollThreshold: number }

const CENTER_112 = 112;

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

  useEffect(() => {
    void (async () => {
      if (!accessToken) return;
      try {
        const r = await listPersons(accessToken);
        const items = r.items
          .map((p) => ({
            id: p.id,
            cloneId: p.cloneId ?? null,
            displayName: p.displayName ?? null,
          }))
          .filter((p) => p.cloneId != null);
        console.log(`[FaceTest] persons loaded: ${items.length}`, items);
        setPersons(items);

        if (items.length > 0) setSelectedPersonId(items[0].id);
      } catch (e) {
        console.warn("[FaceTest] listPersons 실패:", e);
      }
    })();
  }, [accessToken]);

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

      const manip = await ImageManipulator.manipulateAsync(
        imgUri,
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
        autoEnrollThreshold: 0.75, 
      });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [imgUri, selectedPerson, model, accessToken, apiUser]);

  const scoreColor = (score: number, matchTh: number, enrollTh: number) => {
    if (score >= enrollTh) return { bg: "#0f3d1f", tag: "#22c55e", label: `enroll+match (${enrollTh.toFixed(2)}↑)` };
    if (score >= matchTh) return { bg: "#3d3410", tag: "#eab308", label: `match only (${matchTh.toFixed(2)}~${enrollTh.toFixed(2)})` };
    return { bg: "#3d0f0f", tag: "#ef4444", label: `unknown (<${matchTh.toFixed(2)})` };
  };

  return (
    <View style={[s.container, { paddingBottom: insets.bottom }]}>
      <PageHeader showBackButton onBackPress={() => nav.goBack()} transparent />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <Text style={s.title}>얼굴 임계값 테스트 (dev)</Text>
        <Text style={s.desc}>
          갤러리 이미지 → 앱과 동일 tflite 로 512-D 임베딩 → 서버 매칭. 얼굴 정면이 화면 대부분을 차지하는 사진 사용 권장 (얼굴 검출 X).
        </Text>

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

        <Text style={s.label}>Person 선택</Text>
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
                style={[s.personItem, active && s.personItemActive]}
              >
                <Text style={[s.personText, active && s.personTextActive]}>
                  [{p.id}] {p.displayName ?? "(이름없음)"} · clone {p.cloneId}
                </Text>
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
            <Text style={s.resultTitle}>매칭 결과 (top {result.matches.length})</Text>
            {result.matches.length === 0 ? (
              <Text style={s.desc}>매칭된 person 없음</Text>
            ) : result.matches.map((m) => {
              const c = scoreColor(m.score, result.matchThreshold, result.autoEnrollThreshold);
              return (
                <View key={m.personId} style={[s.matchRow, { backgroundColor: c.bg }]}>
                  <Text style={s.matchScore}>{m.score.toFixed(3)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.matchName}>{m.displayName ?? "(이름없음)"}</Text>
                    <Text style={s.matchMeta}>personId {m.personId}</Text>
                  </View>
                  <View style={[s.chip, { backgroundColor: c.tag }]}>
                    <Text style={s.chipText}>{c.label}</Text>
                  </View>
                </View>
              );
            })}
            <Text style={s.thresholdInfo}>
              match {result.matchThreshold} (서버) · enroll {result.autoEnrollThreshold} (앱 auto-enroll)
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
  pickBtn: { backgroundColor: COLORS.zinc800, padding: 14, borderRadius: RADIUS.md, alignItems: "center", marginTop: 8 },
  pickBtnText: { color: COLORS.white, fontSize: 14, fontWeight: "600" },
  preview: { width: 200, height: 200, borderRadius: RADIUS.md, marginTop: 12, alignSelf: "center", backgroundColor: COLORS.zinc900 },
  label: { color: COLORS.zinc300, fontSize: 13, fontWeight: "600", marginTop: 20, marginBottom: 8 },
  personItem: { padding: 12, borderRadius: RADIUS.sm, backgroundColor: COLORS.zinc900, marginBottom: 6, borderWidth: 1, borderColor: COLORS.zinc800 },
  personItemActive: { borderColor: COLORS.white, backgroundColor: COLORS.zinc800 },
  personText: { color: COLORS.zinc300, fontSize: 13 },
  personTextActive: { color: COLORS.white, fontWeight: "600" },
  calcBtn: { backgroundColor: COLORS.white, padding: 14, borderRadius: RADIUS.full, alignItems: "center", marginTop: 20 },
  calcBtnDisabled: { opacity: 0.4 },
  calcBtnText: { color: COLORS.zinc900, fontSize: 16, fontWeight: "700" },
  err: { color: "#f87171", fontSize: 13, marginTop: 12 },
  resultCard: { marginTop: 20, padding: 12, backgroundColor: COLORS.zinc900, borderRadius: RADIUS.md },
  resultTitle: { color: COLORS.white, fontSize: 15, fontWeight: "700", marginBottom: 10 },
  matchRow: { flexDirection: "row", gap: 10, padding: 10, borderRadius: RADIUS.sm, marginBottom: 6, alignItems: "center" },
  matchScore: { color: COLORS.white, fontSize: 20, fontWeight: "700", minWidth: 70, fontVariant: ["tabular-nums"] },
  matchName: { color: COLORS.white, fontSize: 14, fontWeight: "600" },
  matchMeta: { color: COLORS.zinc400, fontSize: 11 },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  chipText: { color: COLORS.white, fontSize: 10, fontWeight: "700" },
  thresholdInfo: { color: COLORS.zinc400, fontSize: 11, marginTop: 8, textAlign: "center" },
});
