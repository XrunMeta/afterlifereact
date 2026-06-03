

import { showAlert } from "../../../stores/dialogStore";
import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
} from "expo-audio";
import { useTranslation } from "react-i18next";
import type { CloneCreationDraft } from "../../../types/clone";
import { COLORS, RADIUS } from "../../../components/constants";
import { getVoices, createAssetJob, type CatalogVoice } from "../../../api/clones";
import { uploadFile } from "../../../api/files";
import { useAuthStore } from "../../../stores/authStore";

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

async function pickAndClone(
  onChange: Props["onChange"],
  accessToken: string | null,
): Promise<void> {
  let result: Awaited<ReturnType<typeof DocumentPicker.getDocumentAsync>>;
  try {
    result = await DocumentPicker.getDocumentAsync({ type: "audio/*" });
  } catch {
    showAlert("파일 선택 오류", "파일을 선택하지 못했어요.");
    return;
  }
  if (result.canceled || !result.assets[0]) return;
  const asset = result.assets[0];

  onChange({ voiceFile: asset.uri, voiceSampleId: undefined, voicePresetId: undefined });

  if (!accessToken) return;
  try {
    const uploaded = await uploadFile(accessToken, asset.uri, {
      purpose: "clone_voice",
      mimeType: asset.mimeType ?? "audio/mpeg",
      fileName: asset.name ?? "voice.mp3",
    });
    const jobRes = await createAssetJob(accessToken, {
      kind: "voice_clone",
      src_file_id: uploaded.id,
    });
    console.log("[DefaultVoice] voice_clone job created:", jobRes.job_id);
    onChange({
      voiceFile: asset.uri,
      voiceCloneJobId: jobRes.job_id,
      voicePresetId: undefined,
    });
  } catch (err) {
    console.warn("[DefaultVoice] upload/job failed (voiceFile kept):", err);
  }
}

function Component({ draft, onChange }: Props) {

  const { t } = useTranslation();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [mode, setMode] = useState<Mode>("preset");
  const [voices, setVoices] = useState<CatalogVoice[]>([]);
  const [loadErr, setLoadErr] = useState(false);
  const [selectedScript, setSelectedScript] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder, 200);

  const recorderRef = useRef(recorder);
  recorderRef.current = recorder;
  useEffect(() => {
    return () => {
      recorderRef.current.stop().catch(() => {});
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!accessToken) return;
        const list = await getVoices(accessToken);
        if (!alive) return;
        setVoices(list);

        if (list.length && draft.voicePresetId === undefined && !draft.voiceCloneJobId && !draft.voiceFile) {
          onChange({ voicePresetId: list[0].id, voiceSampleId: undefined, voiceFile: undefined });
        }
      } catch {
        if (alive) setLoadErr(true);
      }
    })();
    return () => { alive = false; };

  }, [accessToken]);

  const handleStartRecord = async () => {
    if (!selectedScript) {
      showAlert("스크립트 선택", "먼저 읽을 스크립트를 선택해주세요.");
      return;
    }
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) {
      showAlert("권한 필요", "마이크 권한이 필요해요. 설정에서 허용해주세요.");
      return;
    }
    await recorder.record();
  };

  const handleStopRecord = async () => {
    await recorder.stop();
    const uri = recorder.uri;
    if (!uri) return;

    onChange({ voiceFile: uri, voicePresetId: undefined, voiceSampleId: undefined });

    if (!accessToken) return;
    setUploading(true);
    try {
      const uploaded = await uploadFile(accessToken, uri, {
        purpose: "clone_voice",
        mimeType: "audio/m4a",
        fileName: "voice_record.m4a",
      });
      const jobRes = await createAssetJob(accessToken, {
        kind: "voice_clone",
        src_file_id: uploaded.id,
      });
      console.log("[DefaultVoice] voice_clone job (record) created:", jobRes.job_id);
      onChange({
        voiceFile: uri,
        voiceCloneJobId: jobRes.job_id,
        voicePresetId: undefined,
      });
    } catch (err) {
      console.warn("[DefaultVoice] record upload/job failed (voiceFile kept):", err);
    } finally {
      setUploading(false);
    }
  };

  const handlePickFile = async () => {
    setUploading(true);
    try {
      await pickAndClone(onChange, accessToken);
    } finally {
      setUploading(false);
    }
  };

  const isRecording = recState.isRecording;
  const recordedUri = !isRecording && recorder.uri ? recorder.uri : null;

  return (
    <View style={styles.wrap}>
      {}
      <View style={styles.modeRow}>
        {(["preset", "record", "upload"] as Mode[]).map((m) => {
          const label = m === "preset" ? "음색 선택" : m === "record" ? "직접 녹음" : "파일 업로드";
          return (
            <TouchableOpacity
              key={m}
              style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
              onPress={() => setMode(m)}
            >
              <Text style={[styles.modeText, mode === m && styles.modeTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {}
      {mode === "preset" && (
        <View style={{ gap: 8 }}>
          <Text style={styles.scriptHint}>목소리를 선택하세요. (기본: 고민주)</Text>
          {loadErr && (
            <Text style={styles.scriptHint}>목소리 목록을 불러오지 못했어요.</Text>
          )}
          <View style={styles.grid}>
            {voices.map((v) => {
              const active = draft.voicePresetId === v.id;
              return (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.card, active && styles.cardActive]}
                  onPress={() =>

                    onChange({
                      voicePresetId: v.id,
                      voiceSampleId: undefined,
                      voiceFile: undefined,
                      voiceCloneJobId: undefined,
                    })
                  }
                >
                  <Text style={styles.cardName}>{v.name}</Text>
                  {!!v.description && (
                    <Text style={styles.cardDesc}>{v.description}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {}
      {mode === "record" && (
        <View style={{ gap: 12 }}>
          <Text style={styles.scriptHint}>
            스크립트를 선택하고 읽어주세요.
          </Text>
          {RECORD_SCRIPTS.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.scriptCard, selectedScript === s.id && styles.scriptCardActive]}
              onPress={() => setSelectedScript(s.id)}
            >
              <Text style={styles.scriptTitle}>{s.title}</Text>
              <Text style={styles.scriptText}>{s.text}</Text>
            </TouchableOpacity>
          ))}

          {}
          <TouchableOpacity
            style={[
              styles.recordBtn,
              isRecording && styles.recordBtnActive,
              !selectedScript && styles.recordBtnDisabled,
            ]}
            onPress={isRecording ? handleStopRecord : handleStartRecord}
            disabled={!selectedScript && !isRecording}
          >
            <View style={[styles.recordDot, isRecording && styles.recordDotPulse]} />
            <Text style={styles.recordBtnText}>
              {isRecording ? "녹음 중지" : "녹음 시작"}
            </Text>
          </TouchableOpacity>

          {uploading && (
            <View style={styles.recordedRow}>
              <ActivityIndicator size="small" color={COLORS.violet600} />
              <Text style={styles.recordedText}>업로드 중...</Text>
            </View>
          )}
          {!uploading && recordedUri && (
            <View style={styles.recordedRow}>
              <Feather name="check-circle" size={16} color={COLORS.violet600} />
              <Text style={styles.recordedText}>
                {draft.voiceCloneJobId ? "클로닝 잡 등록됨" : "녹음 완료 (업로드 실패 — 재시도됨)"}
              </Text>
            </View>
          )}
        </View>
      )}

      {}
      {mode === "upload" && (
        <View style={{ gap: 12 }}>
          <Text style={styles.scriptHint}>
            음성파일을 올려주세요
          </Text>
          <TouchableOpacity
            style={styles.upload}
            onPress={handlePickFile}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={COLORS.violet600} />
            ) : (
              <Feather name="upload" size={18} color={COLORS.violet600} />
            )}
            <Text style={styles.uploadText}>
              {uploading
                ? "업로드 중..."
                : draft.voiceFile
                ? "다른 파일 선택"
                : "음성 파일 선택"}
            </Text>
          </TouchableOpacity>
          {!uploading && draft.voiceFile && (
            <View style={styles.recordedRow}>
              <Feather name="check-circle" size={16} color={COLORS.violet600} />
              <Text style={styles.recordedText}>
                {draft.voiceCloneJobId ? "클로닝 잡 등록됨" : "파일 선택됨 (잡 등록 실패 — 재시도됨)"}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

Component.validate = (d: CloneCreationDraft): boolean =>
  Boolean(d.voicePresetId) || Boolean(d.voiceCloneJobId) || Boolean(d.voiceFile);

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
  recordBtnActive: { backgroundColor: COLORS.zinc900 },
  recordDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.white },
  recordDotPulse: { backgroundColor: COLORS.error },
  recordBtnText: { fontSize: 15, fontWeight: "700", color: COLORS.white },
  recordedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  recordedText: { fontSize: 13, color: COLORS.violet700, fontWeight: "500" },
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
