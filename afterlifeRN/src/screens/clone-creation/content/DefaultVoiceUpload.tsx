

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

type Mode = "preset" | "upload";

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

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    onChange({ voiceSampleId: undefined, voiceFile: undefined, recordDuration: undefined });
  };

  return (
    <View style={styles.wrap}>
      {}
      <View style={styles.modeRow}>
        {(["preset", "upload"] as const).map((m) => {
          const labels: Record<Mode, string> = {
            preset: "음성 선택",
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

      {

}

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
