

import { showAlert } from "../../../stores/dialogStore";
import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import type { CloneCreationDraft } from "../../../types/clone";
import { COLORS, RADIUS } from "../../../components/constants";
import { getVoices, createAssetJob, type CatalogVoice } from "../../../api/clones";
import { uploadFile } from "../../../api/files";
import { useAuthStore } from "../../../stores/authStore";
import { resolveVoicePresetName } from "../../../lib/voicePresetName";
import { verifyAudioFile } from "../../../lib/audioFileCheck";

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

type Mode = "record" | "preset" | "upload";

const MODE_ORDER: Mode[] = ["record", "preset", "upload"];

type VoicePick = Pick<
  CloneCreationDraft,
  "voicePresetId" | "voiceCloneJobId" | "voiceFile" | "voiceSampleId"
>;

const EMPTY_PICK: VoicePick = {
  voicePresetId: undefined,
  voiceCloneJobId: undefined,
  voiceFile: undefined,
  voiceSampleId: undefined,
};

export function initialMode(d: CloneCreationDraft): Mode {
  if (d.voiceMode) return d.voiceMode;
  if (d.voicePresetId !== undefined) return "preset";
  if (d.voiceFile !== undefined || d.voiceCloneJobId !== undefined) return "upload";
  return "record";
}

interface Props {
  draft: CloneCreationDraft;
  onChange: (patch: Partial<CloneCreationDraft>) => void;
}

interface VoiceSource {
  uri: string;
  mimeType: string;
  fileName: string;
}

async function pickAudioSource(
  t: (key: string, opts?: Record<string, unknown>) => string,
): Promise<VoiceSource | null> {
  let result: Awaited<ReturnType<typeof DocumentPicker.getDocumentAsync>>;
  try {
    result = await DocumentPicker.getDocumentAsync({ type: "audio/*" });
  } catch {
    showAlert(
      t("create.voice.pickFileErrorTitle", { defaultValue: "파일 선택 오류" }),
      t("create.voice.pickFileErrorMsg", { defaultValue: "파일을 선택하지 못했습니다." }),
    );
    return null;
  }
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];

  const verdict = await verifyAudioFile({
    uri: asset.uri,
    name: asset.name,
    mimeType: asset.mimeType,
    size: asset.size,
  });
  if (!verdict.ok) {
    showAlert(
      t("create.voice.notAudioTitle", { defaultValue: "음성 파일이 아닙니다" }),
      verdict.reason === "empty"
        ? t("create.voice.notAudioEmpty", { defaultValue: "빈 파일입니다. 다른 파일을 선택해 주십시오." })
        : t("create.voice.notAudioMsg", {
            defaultValue: "오디오 파일만 등록할 수 있습니다. mp3·m4a·wav 등 음성 파일을 선택해 주십시오.",
          }),
    );
    return null;
  }

  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? "audio/mpeg",
    fileName: asset.name ?? "voice.mp3",
  };
}

function Component({ draft, onChange }: Props) {
  const { t, i18n } = useTranslation();
  const accessToken = useAuthStore((s) => s.accessToken);

  const [mode, setMode] = useState<Mode>(() => initialMode(draft));

  const [byMode, setByMode] = useState<Record<Mode, VoicePick | null>>(() => {
    const seeded: Record<Mode, VoicePick | null> = { upload: null, record: null, preset: null };
    const m = initialMode(draft);
    if (draft.voicePresetId !== undefined || draft.voiceCloneJobId || draft.voiceFile) {
      seeded[m] = {
        voicePresetId: draft.voicePresetId,
        voiceCloneJobId: draft.voiceCloneJobId,
        voiceFile: draft.voiceFile,
        voiceSampleId: draft.voiceSampleId,
      };
    }
    return seeded;
  });

  const modeRef = useRef(mode);
  modeRef.current = mode;

  const applyPick = (m: Mode, pick: VoicePick) => {
    const next = { ...EMPTY_PICK, ...pick };
    setByMode((prev) => ({ ...prev, [m]: next }));
    if (modeRef.current === m) onChange({ ...next, voiceMode: m });
  };

  const [source, setSource] = useState<Partial<Record<Mode, VoiceSource>>>({});
  const [regFailed, setRegFailed] = useState<Partial<Record<Mode, boolean>>>({});

  const registerVoice = async (m: Mode, src: VoiceSource) => {
    setSource((prev) => ({ ...prev, [m]: src }));
    setRegFailed((prev) => ({ ...prev, [m]: false }));

    applyPick(m, { voiceFile: src.uri });

    if (!accessToken) {
      setRegFailed((prev) => ({ ...prev, [m]: true }));
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadFile(accessToken, src.uri, {
        purpose: "clone_voice",
        mimeType: src.mimeType,
        fileName: src.fileName,
      });
      const jobRes = await createAssetJob(accessToken, {
        kind: "voice_clone",
        src_file_id: uploaded.id,
      });
      console.log(`[DefaultVoice] voice_clone job (${m}) created:`, jobRes.job_id);
      applyPick(m, { voiceFile: src.uri, voiceCloneJobId: jobRes.job_id });
    } catch (err) {
      console.warn(`[DefaultVoice] ${m} upload/job failed:`, err);
      setRegFailed((prev) => ({ ...prev, [m]: true }));
    } finally {
      setUploading(false);
    }
  };

  const retryRegister = (m: Mode) => {
    const src = source[m];
    if (src) void registerVoice(m, src);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    onChange({ ...(byMode[m] ?? EMPTY_PICK), voiceMode: m });
  };
  const [voices, setVoices] = useState<CatalogVoice[]>([]);
  const [loadErr, setLoadErr] = useState(false);
  const [selectedScript, setSelectedScript] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [selectedVoiceId, setSelectedVoiceId] = useState<number | null>(null);

  const jobSeqRef = useRef(0);

  const player = useAudioPlayer();
  const playerStatus = useAudioPlayerStatus(player);
  const [playingId, setPlayingId] = useState<number | null>(null);

  useEffect(() => {
    if (
      playingId != null &&
      !playerStatus.playing &&
      playerStatus.isLoaded &&
      !playerStatus.isBuffering &&
      playerStatus.currentTime > 0
    ) {
      setPlayingId(null);
    }
  }, [playerStatus.playing, playerStatus.isLoaded, playerStatus.isBuffering, playerStatus.currentTime, playingId]);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder, 200);

  const recorderRef = useRef(recorder);
  recorderRef.current = recorder;
  useEffect(() => {
    return () => {

      try {
        void recorderRef.current.stop?.().catch(() => {});
      } catch {

      }

      try {
        player.pause();
      } catch {

      }
    };

  }, []);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        try {
          player.pause();
        } catch {

        }
        setPlayingId(null);
      };

    }, []),
  );

  const selectPresetVoice = async (v: CatalogVoice) => {

    if (playingId != null) {
      try { player.pause(); } catch {  }
      setPlayingId(null);
    }
    if (v.srcFileId == null) {

      setSelectedVoiceId(v.id);
      applyPick("preset", { voicePresetId: v.id });
      return;
    }

    if (!accessToken) return;

    setSelectedVoiceId(v.id);
    applyPick("preset", EMPTY_PICK);
    const seq = ++jobSeqRef.current;
    try {
      setUploading(true);
      const jobRes = await createAssetJob(accessToken, { kind: "voice_clone", src_file_id: v.srcFileId });
      if (seq !== jobSeqRef.current) return;  
      console.log("[DefaultVoice] preset voice_clone job created:", jobRes.job_id);
      applyPick("preset", { voiceCloneJobId: jobRes.job_id });
    } catch (err) {
      if (seq === jobSeqRef.current) {

        setSelectedVoiceId(null);
        applyPick("preset", EMPTY_PICK);
        console.warn("[DefaultVoice] preset job 생성 실패:", err);
        showAlert(
          t("create.voice.presetErrorTitle", { defaultValue: "음성 선택 오류" }),
          t("create.voice.presetErrorMsg", { defaultValue: "잠시 후 다시 시도해 주세요." }),
        );
      }
    } finally {
      if (seq === jobSeqRef.current) setUploading(false);
    }
  };

  const togglePreview = (v: CatalogVoice) => {
    if (playingId === v.id) {
      try { player.pause(); } catch {  }
      setPlayingId(null);
      return;
    }
    try {
      player.replace({ uri: v.sampleUrl });
      player.play();
      setPlayingId(v.id);
    } catch (err) {
      console.warn("[DefaultVoice] preview 재생 실패:", err);
      setPlayingId(null);
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!accessToken) return;
        const list = await getVoices(accessToken);
        if (!alive) return;
        setVoices(list);

        if (draft.voicePresetId !== undefined) setSelectedVoiceId(draft.voicePresetId);
      } catch {
        if (alive) setLoadErr(true);
      }
    })();
    return () => { alive = false; };

  }, [accessToken]);

  useEffect(() => {
    if (mode !== "preset") return;
    if (byMode.preset) return;
    if (!voices.length) return;
    selectPresetVoice(voices[0]);

  }, [mode, voices, byMode.preset]);

  const handleStartRecord = async () => {
    if (!selectedScript) {
      showAlert(
        t("create.voice.scriptRequiredTitle", { defaultValue: "스크립트 선택" }),
        t("create.voice.scriptRequiredMsg", { defaultValue: "먼저 읽을 스크립트를 선택해주세요." }),
      );
      return;
    }
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        showAlert(
          t("create.voice.permTitle", { defaultValue: "권한 필요" }),
          t("create.voice.permDesc", { defaultValue: "마이크 권한이 필요해요. 설정에서 허용해주세요." }),
        );
        return;
      }

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

      await recorder.prepareToRecordAsync();
      await recorder.record();
    } catch (err) {
      console.warn("[DefaultVoice] 녹음 시작 실패:", String(err));
      showAlert(
        t("create.voice.recordStartFailedTitle", { defaultValue: "녹음 오류" }),
        t("create.voice.recordStartFailedMsg", {
          defaultValue: "녹음을 시작하지 못했어요. 잠시 후 다시 시도해주세요.",
        }),
      );
    }
  };

  const handleStopRecord = async () => {
    await recorder.stop();

    await setAudioModeAsync({ allowsRecording: false });
    const uri = recorder.uri;
    if (!uri) return;

    await registerVoice("record", {
      uri,
      mimeType: "audio/m4a",
      fileName: "voice_record.m4a",
    });
  };

  const handlePickFile = async () => {

    const src = await pickAudioSource(t);
    if (!src) return;
    await registerVoice("upload", src);
  };

  const isRecording = recState.isRecording;
  const recordedUri = !isRecording && recorder.uri ? recorder.uri : null;

  const TRANSLATED_SCRIPTS = RECORD_SCRIPTS.map((s) => {
    if (s.id === "s1")
      return {
        id: s.id,
        title: t("create.voice.scripts.s1Title", { defaultValue: s.title }),
        text: t("create.voice.scripts.s1Text", { defaultValue: s.text }),
      };
    if (s.id === "s2")
      return {
        id: s.id,
        title: t("create.voice.scripts.s2Title", { defaultValue: s.title }),
        text: t("create.voice.scripts.s2Text", { defaultValue: s.text }),
      };
    return {
      id: s.id,
      title: t("create.voice.scripts.s3Title", { defaultValue: s.title }),
      text: t("create.voice.scripts.s3Text", { defaultValue: s.text }),
    };
  });

  return (
    <View style={styles.wrap}>
      {}
      <View style={styles.modeRow}>
        {MODE_ORDER.map((m) => {
          const label =
            m === "preset"
              ? t("create.voice.modePreset", { defaultValue: "음색 선택" })
              : m === "record"
              ? t("create.voice.modeRecord", { defaultValue: "직접 녹음" })
              : t("create.voice.modeUpload", { defaultValue: "파일 업로드" });
          return (
            <TouchableOpacity
              key={m}
              style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
              onPress={() => switchMode(m)}
            >
              <Text style={[styles.modeText, mode === m && styles.modeTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {}
      {mode === "preset" && (
        <View style={{ gap: 8 }}>
          <Text style={styles.scriptHint}>
            {t("create.voice.choosePresetHint", { defaultValue: "목소리를 선택해 주세요." })}
          </Text>
          {loadErr && (
            <Text style={styles.scriptHint}>
              {t("create.voice.presetLoadFailed", { defaultValue: "목소리 목록을 불러오지 못했어요." })}
            </Text>
          )}
          {uploading && (
            <View style={styles.recordedRow}>
              <ActivityIndicator size="small" color={COLORS.violet600} />
              <Text style={styles.recordedText}>
                {t("create.voice.presetPreparing", { defaultValue: "음성 준비 중…" })}
              </Text>
            </View>
          )}
          <View style={styles.grid}>
            {voices.map((v) => {
              const active = selectedVoiceId === v.id;
              const isPlaying = playingId === v.id;
              return (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.card, active && styles.cardActive]}
                  onPress={() => selectPresetVoice(v)}
                >
                  <View style={styles.cardRow}>
                    <Text style={[styles.cardName, active && styles.cardNameActive]}>
                      {resolveVoicePresetName(v, i18n.language)}
                    </Text>
                    <TouchableOpacity
                      style={styles.playBtn}
                      onPress={(e) => { e.stopPropagation(); togglePreview(v); }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Feather
                        name={isPlaying ? "pause" : "play"}
                        size={14}
                        color={active ? COLORS.violet600 : COLORS.zinc500}
                      />
                    </TouchableOpacity>
                  </View>
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
            {t("create.voice.chooseScriptHint", { defaultValue: "스크립트를 선택하고 읽어주세요." })}
          </Text>
          {TRANSLATED_SCRIPTS.map((s) => (
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
              {isRecording
                ? t("create.voice.recordStop", { defaultValue: "녹음 중지" })
                : t("create.voice.recordStart", { defaultValue: "녹음 시작" })}
            </Text>
          </TouchableOpacity>

          {uploading && (
            <View style={styles.recordedRow}>
              <ActivityIndicator size="small" color={COLORS.violet600} />
              <Text style={styles.recordedText}>
                {t("create.voice.uploading", { defaultValue: "업로드 중..." })}
              </Text>
            </View>
          )}
          {!uploading && recordedUri && draft.voiceCloneJobId && (
            <View style={styles.recordedRow}>
              <Feather name="check-circle" size={16} color={COLORS.violet600} />
              <Text style={styles.recordedText}>
                {t("create.voice.cloneJobRegistered", { defaultValue: "클로닝 잡 등록됨" })}
              </Text>
            </View>
          )}
          {}
          {!uploading && regFailed.record && (
            <View style={{ gap: 8 }}>
              <View style={styles.recordedRow}>
                <Feather name="alert-circle" size={16} color={COLORS.error} />
                <Text style={[styles.recordedText, { color: COLORS.error }]}>
                  {t("create.voice.registerFailed", {
                    defaultValue: "녹음 파일 등록에 실패했습니다.",
                  })}
                </Text>
              </View>
              <TouchableOpacity style={styles.retryBtn} onPress={() => retryRegister("record")}>
                <Feather name="refresh-cw" size={16} color={COLORS.zinc900} />
                <Text style={styles.retryBtnText}>
                  {t("create.voice.registerRetry", { defaultValue: "등록 다시 시도" })}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {}
      {mode === "upload" && (
        <View style={{ gap: 12 }}>
          <Text style={styles.scriptHint}>
            {t("create.voice.uploadPromptHint", { defaultValue: "음성파일을 올려주세요" })}
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
                ? t("create.voice.uploading", { defaultValue: "업로드 중..." })
                : draft.voiceFile
                ? t("create.voice.pickAnother", { defaultValue: "다른 파일 선택" })
                : t("create.voice.pickFile", { defaultValue: "음성 파일 선택" })}
            </Text>
          </TouchableOpacity>
          {!uploading && draft.voiceFile && draft.voiceCloneJobId && (
            <View style={styles.recordedRow}>
              <Feather name="check-circle" size={16} color={COLORS.violet600} />
              <Text style={styles.recordedText}>
                {t("create.voice.cloneJobRegistered", { defaultValue: "클로닝 잡 등록됨" })}
              </Text>
            </View>
          )}
          {}
          {!uploading && regFailed.upload && (
            <View style={{ gap: 8 }}>
              <View style={styles.recordedRow}>
                <Feather name="alert-circle" size={16} color={COLORS.error} />
                <Text style={[styles.recordedText, { color: COLORS.error }]}>
                  {t("create.voice.registerFailedFile", {
                    defaultValue: "음성 파일 등록에 실패했습니다.",
                  })}
                </Text>
              </View>
              <TouchableOpacity style={styles.retryBtn} onPress={() => retryRegister("upload")}>
                <Feather name="refresh-cw" size={16} color={COLORS.zinc900} />
                <Text style={styles.retryBtnText}>
                  {t("create.voice.registerRetry", { defaultValue: "등록 다시 시도" })}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

Component.validate = (d: CloneCreationDraft): boolean => {
  if (d.voiceMode === "record" || d.voiceMode === "upload") return Boolean(d.voiceCloneJobId);
  return Boolean(d.voicePresetId) || Boolean(d.voiceCloneJobId) || Boolean(d.voiceFile);
};

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
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardName: { fontSize: 14, fontWeight: "600", color: COLORS.zinc800 },
  cardNameActive: { color: COLORS.violet700 },
  cardDesc: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },
  playBtn: { padding: 4 },

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

  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    backgroundColor: COLORS.white,
  },
  retryBtnText: { fontSize: 14, color: COLORS.zinc900, fontWeight: "600" },
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
