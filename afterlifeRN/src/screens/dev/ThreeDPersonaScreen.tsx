

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FilamentScene } from "react-native-filament";
import { useSharedValue } from "react-native-worklets-core";
import { COLORS } from "../../components/constants";
import { Head, NEUTRAL_WEIGHTS } from "./threedPersona/Head";
import { MORPH_COUNT, MORPH_NAMES } from "./threedPersona/config";

const SCRIPTED_JAW: number[] = (() => {
  const N = 180;
  const out: number[] = new Array(N).fill(0);
  for (let i = 0; i < N; i++) {
    const t = i / 60;

    const wave = 0.35 + 0.35 * Math.sin(t * 22) * Math.sin(t * 4.3);
    out[i] = Math.max(0, Math.min(1.0, wave));
  }
  return out;
})();

function ThreeDPersonaInner() {
  const weights = useSharedValue<number[]>([...NEUTRAL_WEIGHTS]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [morphNames, setMorphNames] = useState<string[]>([]);

  const [jawOpenValue, setJawOpenValue] = useState(0);

  const [morphDiag, setMorphDiag] = useState<boolean[]>([false, false, false, false, false]);
  const toggleMorph = useCallback((idx: number) => {
    setMorphDiag((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      const w = [...weights.value];
      w[idx] = next[idx] ? 1 : 0;
      weights.value = w;
      return next;
    });
  }, [weights]);

  const onLoaded = useCallback((names: string[]) => {
    console.log(`[3DPersona] GLB loaded · morphs=${names.join(",")}`);
    setMorphNames(names);
    setLoaded(true);
  }, []);
  const onError = useCallback((msg: string) => {
    console.warn(`[3DPersona] load error: ${msg}`);
    setError(msg);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const blink = () => {
      if (cancelled) return;
      const start = Date.now();
      const step = () => {
        if (cancelled) return;
        const elapsed = Date.now() - start;

        const t = Math.min(1, elapsed / 130);
        const v = Math.sin(t * Math.PI);
        const next = [...weights.value];
        next[4] = v; 
        weights.value = next;
        if (t < 1) requestAnimationFrame(step);
        else {
          const next2 = [...weights.value];
          next2[4] = 0;
          weights.value = next2;
          const wait = 2000 + Math.random() * 2000;
          timer = setTimeout(blink, wait);
        }
      };
      requestAnimationFrame(step);
    };
    timer = setTimeout(blink, 1500);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [loaded, weights]);

  const [speaking, setSpeaking] = useState(false);
  const onSpeak = useCallback(() => {
    if (speaking || !loaded) return;
    setSpeaking(true);
    const start = Date.now();
    const step = () => {
      const elapsed = (Date.now() - start) / 1000;
      const frame = Math.floor(elapsed * 60);
      if (frame >= SCRIPTED_JAW.length) {
        const next = [...weights.value];
        next[0] = 0; 
        next[1] = 0; 
        weights.value = next;
        setJawOpenValue(0); 
        setSpeaking(false);
        return;
      }
      const next = [...weights.value];
      const jaw = SCRIPTED_JAW[frame];
      next[0] = jaw; 

      next[1] = jaw * 0.7;
      weights.value = next;
      setJawOpenValue(jaw); 
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [speaking, loaded, weights]);

  const morphInfo = useMemo(() => {
    if (morphNames.length === 0) return null;
    const expected = MORPH_NAMES.join(",");
    const actual = morphNames.join(",");
    return expected === actual ? "✅ morph 순서 일치" : `⚠️ morph 순서 불일치\nexpected: ${expected}\nactual: ${actual}`;
  }, [morphNames]);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>3D 페르소나 데모</Text>
        <Text style={s.subtitle}>
          Filament (Google) 로 GLB 헤드 렌더 + morph target 립싱크 데모. 참고 프로젝트{" "}
          <Text style={s.mono}>al-3dtest</Text> 이식 Phase 1.
        </Text>

        <View style={s.headContainer}>
          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>렌더 실패</Text>
              <Text style={s.errorDetail}>{error}</Text>
            </View>
          ) : (
            <Head weights={weights} onLoaded={onLoaded} onError={onError} />
          )}
          {!loaded && !error ? (
            <View style={s.loadingOverlay} pointerEvents="none">
              <ActivityIndicator size="large" color={COLORS.white} />
              <Text style={s.loadingText}>GLB 로딩중…</Text>
            </View>
          ) : null}
          {

}
          {loaded && !error && jawOpenValue > 0 ? (
            <View
              style={[
                s.mouthCavityOverlay,
                {
                  opacity: Math.min(0.92, jawOpenValue * 1.05),
                  height: 18 + jawOpenValue * 34,
                  width: 56 + jawOpenValue * 12,
                  marginLeft: -(56 + jawOpenValue * 12) / 2,
                  borderTopLeftRadius: 30 + jawOpenValue * 6,
                  borderTopRightRadius: 30 + jawOpenValue * 6,
                  borderBottomLeftRadius: 40 + jawOpenValue * 10,
                  borderBottomRightRadius: 40 + jawOpenValue * 10,
                },
              ]}
              pointerEvents="none"
            >
              {
}
              <View style={s.mouthCavityCore} pointerEvents="none" />
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={[s.btn, (speaking || !loaded) && s.btnDisabled]}
          onPress={onSpeak}
          disabled={speaking || !loaded}
        >
          <Text style={s.btnText}>{speaking ? "말하는 중…" : "말하기 데모 (3초)"}</Text>
        </TouchableOpacity>

        {morphInfo ? (
          <View style={s.infoBox}>
            <Text style={s.infoTitle}>Morph Target 검증</Text>
            <Text style={s.infoText}>{morphInfo}</Text>
            <Text style={s.infoText}>총 {MORPH_COUNT} 개 · 순서: {MORPH_NAMES.join(", ")}</Text>
          </View>
        ) : null}

        {

}
        {loaded && !error ? (
          <View style={s.infoBox}>
            <Text style={s.infoTitle}>Morph 개별 토글 (진단)</Text>
            <Text style={s.infoText}>
              각 morph 를 0 ↔ 1 로 토글해서 실제 vertices 이동이 일어나는지 확인. GLB rigging 결함
              추적용.
            </Text>
            <View style={s.morphDiagRow}>
              {MORPH_NAMES.map((name, idx) => (
                <TouchableOpacity
                  key={name}
                  style={[s.morphChip, morphDiag[idx] && s.morphChipOn, speaking && s.btnDisabled]}
                  onPress={() => toggleMorph(idx)}
                  disabled={speaking}
                >
                  <Text style={[s.morphChipText, morphDiag[idx] && s.morphChipTextOn]}>
                    {name}{morphDiag[idx] ? " ✓" : ""}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        <View style={s.infoBox}>
          <Text style={s.infoTitle}>Phase 2 예정</Text>
          <Text style={s.infoText}>
            • 사진 → 3D 자동 생성 (TripoSG){"\n"}
            • 통화 시 real TTS + 진폭 envelope 립싱크{"\n"}
            • 페르소나 pipeline='threed' 라우팅
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function ThreeDPersonaScreen() {
  return (
    <FilamentScene>
      <ThreeDPersonaInner />
    </FilamentScene>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.zinc950 },
  scroll: { padding: 16, paddingBottom: 32 },
  title: { color: COLORS.white, fontSize: 20, fontWeight: "800", marginBottom: 4 },
  subtitle: { color: COLORS.zinc400, fontSize: 13, marginBottom: 16, lineHeight: 18 },
  mono: { fontFamily: "Courier", color: COLORS.zinc300 },
  headContainer: {
    height: 420,
    backgroundColor: COLORS.zinc900,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  loadingText: { color: COLORS.white, marginTop: 12, fontSize: 14 },

  mouthCavityOverlay: {
    position: "absolute",
    left: "50%",
    top: 245,
    backgroundColor: "#000000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 8,
  },

  mouthCavityCore: {
    position: "absolute",
    top: 3,
    left: 6,
    right: 6,
    bottom: 2,
    borderRadius: 20,
    backgroundColor: "#0a0a0a",
  },

  morphDiagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 6,
  },
  morphChip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: COLORS.zinc800,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.zinc700,
  },
  morphChipOn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  morphChipText: {
    color: COLORS.zinc300,
    fontSize: 11,
    fontWeight: "600",
  },
  morphChipTextOn: {
    color: COLORS.white,
  },
  errorBox: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: { color: COLORS.error, fontSize: 16, fontWeight: "700", marginBottom: 8 },
  errorDetail: { color: COLORS.zinc300, fontSize: 12, textAlign: "center" },
  btn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
  infoBox: {
    backgroundColor: COLORS.zinc900,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoTitle: { color: COLORS.white, fontSize: 13, fontWeight: "700", marginBottom: 6 },
  infoText: { color: COLORS.zinc300, fontSize: 12, lineHeight: 18 },
});
