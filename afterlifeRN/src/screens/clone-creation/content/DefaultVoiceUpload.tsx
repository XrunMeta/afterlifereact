

import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useTranslation } from "react-i18next";
import type { CloneCreationDraft } from "../../../types/clone";
import { COLORS, RADIUS } from "../../../components/constants";

export const VOICE_SAMPLES = [
  { id: "v1", name: "Nova" },
  { id: "v2", name: "Ursa" },
  { id: "v3", name: "Vega" },
  { id: "v4", name: "Orion" },
  { id: "v5", name: "Luna" },
  { id: "v6", name: "Stella" },
] as const;

const RECORD_SCRIPTS = [
  {
    id: "s1",
    title: "일상 인사",
    text:
      "안녕하세요. 오늘은 정말 좋은 하루였어요. 햇살이 따뜻하고 바람도 부드러워서 " +
      "산책하기에 딱 좋았답니다. 이렇게 평화로운 시간이 정말 소중하게 느껴져요. " +
      "오늘 하루도 즐겁게 잘 보내세요.",
  },
  {
    id: "s2",
    title: "음식 이야기",
    text:
      "요즘 가장 좋아하는 음식이 뭐예요? 저는 김치찌개를 정말 좋아해요. 매운 맛이 " +
      "진하고 따끈한 국물을 한 숟갈 떠먹으면 하루의 피로가 싹 풀리는 기분이거든요. " +
      "특히 비 오는 날에 먹으면 더 맛있어요.",
  },
  {
    id: "s3",
    title: "추억 회상",
    text:
      "어릴 적 추억 중에 가장 기억에 남는 건 가족과 함께 갔던 바다 여행이에요. 파도 " +
      "소리와 짭조름한 바람, 그리고 모래사장에서 뛰놀던 그 순간들이 아직도 생생해요. " +
      "그때 행복했던 기분이 다시 떠올라요.",
  },
] as const;

type Mode = "preset" | "record" | "upload";

interface Props {
  draft: CloneCreationDraft;
  onChange: (patch: Partial<CloneCreationDraft>) => void;
}

async function pickFile(
  onChange: Props["onChange"],
  errorTitle: string,
  errorMsg: string,
) {
  try {
    const r = await DocumentPicker.getDocumentAsync({ type: "audio/*" });
    if (!r.canceled && r.assets[0]) {
      onChange({ voiceFile: r.assets[0].uri, voiceSampleId: undefined });
    }
  } catch {
    Alert.alert(errorTitle, errorMsg);
  }
}

function Component({ draft, onChange }: Props) {
  const { t } = useTranslation();

  const initialMode: Mode = draft.voiceFile ? "upload" : "preset";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [selectedScript, setSelectedScript] = useState<string | null>(null);

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    onChange({ voiceSampleId: undefined, voiceFile: undefined, recordDuration: undefined });
    setSelectedScript(null);
  };

  const handleRecordPress = () => {

    Alert.alert(
      "준비 중",
      "녹음 기능은 곧 제공돼요. 지금은 [음성 선택] 또는 [파일 업로드] 를 이용해주세요.",
    );
  };

  return (
    <View style={styles.wrap}>
      {}
      <View style={styles.modeRow}>
        {(["preset", "record", "upload"] as const).map((m) => {
          const labels: Record<Mode, string> = {
            preset: "음성 선택",
            record: "직접 녹음",
            upload: "파일 업로드",
          };
          const active = mode === m;
          return (
            <TouchableOpacity
              key={m}
              style={[styles.modeBtn, active && styles.modeBtnActive]}
              onPress={() => switchMode(m)}
            >
              <Text style={[styles.modeText, active && styles.modeTextActive]}>
                {labels[m]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {}
      {mode === "preset" && (
        <View style={styles.grid}>
          {VOICE_SAMPLES.map((v) => {
            const active = draft.voiceSampleId === v.id;
            return (
              <TouchableOpacity
                key={v.id}
                style={[styles.card, active && styles.cardActive]}
                onPress={() =>
                  onChange({ voiceSampleId: v.id, voiceFile: undefined, recordDuration: undefined })
                }
              >
                <Text style={styles.cardName}>{v.name}</Text>
                <Text style={styles.cardDesc}>{t(`create.voice.sample.${v.name}`)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {}
      {mode === "record" && (
        <View style={{ gap: 12 }}>
          <Text style={styles.scriptHint}>
            아래 3개 중 하나를 골라 자연스럽게 읽어주세요. (약 30초)
          </Text>
          {RECORD_SCRIPTS.map((s) => {
            const active = selectedScript === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.scriptCard, active && styles.scriptCardActive]}
                onPress={() => setSelectedScript(s.id)}
              >
                <Text style={styles.scriptTitle}>{s.title}</Text>
                <Text style={styles.scriptText}>{s.text}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[styles.recordBtn, !selectedScript && styles.recordBtnDisabled]}
            onPress={handleRecordPress}
            disabled={!selectedScript}
            activeOpacity={0.85}
          >
            <View style={styles.recordDot} />
            <Text style={styles.recordBtnText}>녹음 시작</Text>
          </TouchableOpacity>
          <Text style={styles.disabledNote}>
            * 녹음 기능은 준비 중이에요 — 임시로 [음성 선택] 또는 [파일 업로드] 를 사용해주세요.
          </Text>
        </View>
      )}

      {}
      {mode === "upload" && (
        <TouchableOpacity
          style={styles.upload}
          onPress={() => pickFile(onChange, t("common.error"), t("create.voice.fileError"))}
        >
          <Feather name="upload" size={20} color={COLORS.violet600} />
          <Text style={styles.uploadText}>
            {draft.voiceFile
              ? t("create.voice.uploadedFile")
              : t("create.voice.uploadFile")}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

Component.validate = (d: CloneCreationDraft): boolean =>
  Boolean(d.voiceSampleId || d.voiceFile);

const DefaultVoiceUpload = Component as typeof Component & {
  validate: (d: CloneCreationDraft) => boolean;
};
export default DefaultVoiceUpload;

const styles = StyleSheet.create({
  wrap: { gap: 12 },

  modeRow: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: COLORS.zinc100,
    padding: 4,
    borderRadius: RADIUS.lg,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: "center",
  },
  modeBtnActive: { backgroundColor: COLORS.white },
  modeText: { fontSize: 13, fontWeight: "500", color: COLORS.zinc500 },
  modeTextActive: { color: COLORS.zinc900, fontWeight: "700" },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  card: {
    width: "48%",
    padding: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
  },
  cardActive: { borderColor: COLORS.violet600, backgroundColor: COLORS.violet100 },
  cardName: { fontSize: 14, fontWeight: "600", color: COLORS.zinc800 },
  cardDesc: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },

  scriptHint: { fontSize: 13, color: COLORS.zinc600, marginBottom: 4 },
  scriptCard: {
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    backgroundColor: COLORS.white,
  },
  scriptCardActive: { borderColor: COLORS.violet600, backgroundColor: COLORS.violet100 },
  scriptTitle: { fontSize: 13, fontWeight: "700", color: COLORS.zinc900, marginBottom: 6 },
  scriptText: { fontSize: 14, lineHeight: 22, color: COLORS.zinc700 },
  recordBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.error,
    marginTop: 4,
  },
  recordBtnDisabled: { opacity: 0.4 },
  recordDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.white },
  recordBtnText: { fontSize: 15, fontWeight: "700", color: COLORS.white },
  disabledNote: {
    fontSize: 12,
    color: COLORS.zinc500,
    textAlign: "center",
    marginTop: 4,
  },

  upload: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.violet200,
  },
  uploadText: { color: COLORS.violet700 },
});
