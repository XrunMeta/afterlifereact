

import { v_889fad } from "../../../stores/dialogStore";
import v_a3453e, { v_c4deb2, v_e662ae, v_5ab095 } from "bapkr";
import { v_3094a2, v_19b633, v_4623af, v_472849, v_39a996 } from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import * as v_c95b2c from "gketqwckyalygtuqsawm";
import {
  v_407393,
  v_3488be,
  v_8a9d74,
  v_b3e89c,
  v_542f2a,
  v_66d7d4,
  v_0e491a,
} from "qmmwyqbwrg";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_c2a674 } from "../../../types/clone";
import { v_1bfbd0, v_8b0c90 } from "../../../components/constants";
import { v_3ee8c0, v_ab4719, type v_d80981 } from "../../../api/clones";
import { v_7d2692 } from "../../../api/files";
import { v_1ed7d9 } from "../../../stores/authStore";

export const v_e79da6 = [
  { id: "v1", name: "Nova" },
  { id: "v2", name: "Ursa" },
  { id: "v3", name: "Vega" },
  { id: "v4", name: "Orion" },
  { id: "v5", name: "Luna" },
  { id: "v6", name: "Stella" },
] as const;

const v_58b6a9 = [
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
  draft: v_c2a674;
  onChange: (patch: Partial<v_c2a674>) => void;
}

async function v_867b58(
  v_b187d9,
  v_2ca7e0,
): Promise<void> {
  let result: Awaited<ReturnType<typeof v_c95b2c.getDocumentAsync>>;
  try {
    v_43c42e = await v_c95b2c.getDocumentAsync({ type: "audio/*" });
  } catch {
    v_889fad("파일 선택 오류", "파일을 선택하지 못했어요.");
    return;
  }
  if (v_43c42e.canceled || !v_43c42e.assets[0]) return;
  const v_b76cd8 = v_43c42e.assets[0];

  v_b187d9({ voiceFile: v_b76cd8.uri, voiceSampleId: undefined, voicePresetId: undefined });

  if (!v_2ca7e0) return;
  try {
    const v_57ac81 = await v_7d2692(v_2ca7e0, v_b76cd8.uri, {
      purpose: "clone_voice",
      mimeType: v_b76cd8.mimeType ?? "audio/mpeg",
      fileName: v_b76cd8.name ?? "voice.mp3",
    });
    const v_94abbb = await v_ab4719(v_2ca7e0, {
      kind: "voice_clone",
      src_file_id: v_57ac81.id,
    });
    console.log("[DefaultVoice] voice_clone job created:", v_94abbb.job_id);
    v_b187d9({
      voiceFile: v_b76cd8.uri,
      voiceCloneJobId: v_94abbb.job_id,
      voicePresetId: undefined,
    });
  } catch (v_49263d) {
    console.warn("[DefaultVoice] upload/job failed (voiceFile kept):", v_49263d);
  }
}

function v_b0de9c({ draft: v_f04727, onChange: v_b187d9 }: Props) {

  const { t: v_8d41d7 } = v_772971();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const [v_34e5bb, v_038d7f] = v_5ab095<Mode>("preset");
  const [v_53e1f3, v_de0f36] = v_5ab095<v_d80981[]>([]);
  const [v_fd3c7b, v_4fbeaf] = v_5ab095(false);
  const [v_0c0b03, v_c98f46] = v_5ab095<string | null>(null);
  const [v_11c383, v_bbded0] = v_5ab095(false);

  const [v_addcfe, v_523782] = v_5ab095<number | null>(null);

  const v_64652e = v_e662ae(0);

  const v_86394a = v_407393();
  const v_af221f = v_3488be(v_86394a);
  const [v_cf954d, v_a4d7cc] = v_5ab095<number | null>(null);

  v_c4deb2(() => {
    if (
      v_cf954d != null &&
      !v_af221f.playing &&
      v_af221f.isLoaded &&
      !v_af221f.isBuffering &&
      v_af221f.currentTime > 0
    ) {
      v_a4d7cc(null);
    }
  }, [v_af221f.playing, v_af221f.isLoaded, v_af221f.isBuffering, v_af221f.currentTime, v_cf954d]);

  const v_5ebce3 = v_8a9d74(v_542f2a.HIGH_QUALITY);
  const v_b599c8 = v_b3e89c(v_5ebce3, 200);

  const v_504bbe = v_e662ae(v_5ebce3);
  v_504bbe.current = v_5ebce3;
  v_c4deb2(() => {
    return () => {
      v_504bbe.current.stop().catch(() => {});
      v_86394a.pause();
    };

  }, []);

  const v_0f4413 = async (v: v_d80981) => {

    if (v_cf954d != null) {
      v_86394a.pause();
      v_a4d7cc(null);
    }
    if (v_81e2ef.srcFileId == null) {

      v_523782(v_81e2ef.id);
      v_b187d9({ voicePresetId: v_81e2ef.id, voiceCloneJobId: undefined, voiceFile: undefined });
      return;
    }

    if (!v_2ca7e0) return;

    v_523782(v_81e2ef.id);
    v_b187d9({ voicePresetId: undefined, voiceFile: undefined });
    const v_1923e2 = ++v_64652e.current;
    try {
      v_bbded0(true);
      const v_94abbb = await v_ab4719(v_2ca7e0, { kind: "voice_clone", src_file_id: v_81e2ef.srcFileId });
      if (v_1923e2 !== v_64652e.current) return;  
      console.log("[DefaultVoice] preset voice_clone job created:", v_94abbb.job_id);
      v_b187d9({ voiceCloneJobId: v_94abbb.job_id, voicePresetId: undefined, voiceFile: undefined });
    } catch (v_49263d) {
      if (v_1923e2 === v_64652e.current) {

        v_523782(null);
        v_b187d9({ voiceCloneJobId: undefined, voicePresetId: undefined, voiceFile: undefined });
        console.warn("[DefaultVoice] preset job 생성 실패:", v_49263d);
        v_889fad("음성 선택 오류", "잠시 후 다시 시도해 주세요.");
      }
    } finally {
      if (v_1923e2 === v_64652e.current) v_bbded0(false);
    }
  };

  const v_1bf8db = (v: v_d80981) => {
    if (v_cf954d === v_81e2ef.id) {
      v_86394a.pause();
      v_a4d7cc(null);
      return;
    }
    try {
      v_86394a.replace({ uri: v_81e2ef.sampleUrl });
      v_86394a.play();
      v_a4d7cc(v_81e2ef.id);
    } catch (v_49263d) {
      console.warn("[DefaultVoice] preview 재생 실패:", v_49263d);
      v_a4d7cc(null);
    }
  };

  v_c4deb2(() => {
    let v_759436 = true;
    (async () => {
      try {
        if (!v_2ca7e0) return;
        const v_ef8ab1 = await v_3ee8c0(v_2ca7e0);
        if (!v_759436) return;
        v_de0f36(v_ef8ab1);

        if (v_f04727.voicePresetId !== undefined) {
          v_523782(v_f04727.voicePresetId);
          return;
        }
        if (v_f04727.voiceCloneJobId || v_f04727.voiceFile) return;

        if (v_ef8ab1.length) {
          v_0f4413(v_ef8ab1[0]);
        }
      } catch {
        if (v_759436) v_4fbeaf(true);
      }
    })();
    return () => { v_759436 = false; };

  }, [v_2ca7e0]);

  const v_4d3015 = async () => {
    if (!v_0c0b03) {
      v_889fad("스크립트 선택", "먼저 읽을 스크립트를 선택해주세요.");
      return;
    }
    try {
      const v_d60769 = await v_66d7d4();
      if (!v_d60769.granted) {
        v_889fad("권한 필요", "마이크 권한이 필요해요. 설정에서 허용해주세요.");
        return;
      }

      await v_0e491a({ allowsRecording: true, playsInSilentMode: true });

      await v_5ebce3.prepareToRecordAsync();
      await v_5ebce3.record();
    } catch (v_49263d) {
      console.warn("[DefaultVoice] 녹음 시작 실패:", String(v_49263d));
      v_889fad("녹음 오류", "녹음을 시작하지 못했어요. 잠시 후 다시 시도해주세요.");
    }
  };

  const v_f30df7 = async () => {
    await v_5ebce3.stop();

    await v_0e491a({ allowsRecording: false });
    const v_cd1446 = v_5ebce3.uri;
    if (!v_cd1446) return;

    v_b187d9({ voiceFile: v_cd1446, voicePresetId: undefined, voiceSampleId: undefined });

    if (!v_2ca7e0) return;
    v_bbded0(true);
    try {
      const v_57ac81 = await v_7d2692(v_2ca7e0, v_cd1446, {
        purpose: "clone_voice",
        mimeType: "audio/m4a",
        fileName: "voice_record.m4a",
      });
      const v_94abbb = await v_ab4719(v_2ca7e0, {
        kind: "voice_clone",
        src_file_id: v_57ac81.id,
      });
      console.log("[DefaultVoice] voice_clone job (record) created:", v_94abbb.job_id);
      v_b187d9({
        voiceFile: v_cd1446,
        voiceCloneJobId: v_94abbb.job_id,
        voicePresetId: undefined,
      });
    } catch (v_49263d) {
      console.warn("[DefaultVoice] record upload/job failed (voiceFile kept):", v_49263d);
    } finally {
      v_bbded0(false);
    }
  };

  const v_a01a16 = async () => {
    v_bbded0(true);
    try {
      await v_867b58(v_b187d9, v_2ca7e0);
    } finally {
      v_bbded0(false);
    }
  };

  const v_97c26f = v_b599c8.isRecording;
  const v_614d75 = !v_97c26f && v_5ebce3.uri ? v_5ebce3.uri : null;

  return (
    <View style={v_d81136.wrap}>
      {}
      <View style={v_d81136.modeRow}>
        {(["preset", "record", "upload"] as Mode[]).map((v_35f85c) => {
          const v_2869c1 = v_35f85c === "preset" ? "음색 선택" : v_35f85c === "record" ? "직접 녹음" : "파일 업로드";
          return (
            <TouchableOpacity
              key={v_35f85c}
              style={[v_d81136.modeBtn, v_34e5bb === v_35f85c && v_d81136.modeBtnActive]}
              onPress={() => v_038d7f(v_35f85c)}
            >
              <Text style={[v_d81136.modeText, v_34e5bb === v_35f85c && v_d81136.modeTextActive]}>{v_2869c1}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {}
      {v_34e5bb === "preset" && (
        <View style={{ gap: 8 }}>
          <Text style={v_d81136.scriptHint}>목소리를 선택해 주세요.</Text>
          {v_fd3c7b && (
            <Text style={v_d81136.scriptHint}>목소리 목록을 불러오지 못했어요.</Text>
          )}
          {v_11c383 && (
            <View style={v_d81136.recordedRow}>
              <ActivityIndicator size="small" color={v_1bfbd0.violet600} />
              <Text style={v_d81136.recordedText}>음성 준비 중…</Text>
            </View>
          )}
          <View style={v_d81136.grid}>
            {v_53e1f3.map((v_81e2ef) => {
              const v_f8b770 = v_addcfe === v_81e2ef.id;
              const v_087c92 = v_cf954d === v_81e2ef.id;
              return (
                <TouchableOpacity
                  key={v_81e2ef.id}
                  style={[v_d81136.card, v_f8b770 && v_d81136.cardActive]}
                  onPress={() => v_0f4413(v_81e2ef)}
                >
                  <View style={v_d81136.cardRow}>
                    <Text style={[v_d81136.cardName, v_f8b770 && v_d81136.cardNameActive]}>{v_81e2ef.name}</Text>
                    <TouchableOpacity
                      style={v_d81136.playBtn}
                      onPress={(v_9e86fd) => { v_9e86fd.stopPropagation(); v_1bf8db(v_81e2ef); }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Feather
                        name={v_087c92 ? "pause" : "play"}
                        size={14}
                        color={v_f8b770 ? v_1bfbd0.violet600 : v_1bfbd0.zinc500}
                      />
                    </TouchableOpacity>
                  </View>
                  {!!v_81e2ef.description && (
                    <Text style={v_d81136.cardDesc}>{v_81e2ef.description}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {}
      {v_34e5bb === "record" && (
        <View style={{ gap: 12 }}>
          <Text style={v_d81136.scriptHint}>
            스크립트를 선택하고 읽어주세요.
          </Text>
          {v_58b6a9.map((v_fd5f43) => (
            <TouchableOpacity
              key={v_fd5f43.id}
              style={[v_d81136.scriptCard, v_0c0b03 === v_fd5f43.id && v_d81136.scriptCardActive]}
              onPress={() => v_c98f46(v_fd5f43.id)}
            >
              <Text style={v_d81136.scriptTitle}>{v_fd5f43.title}</Text>
              <Text style={v_d81136.scriptText}>{v_fd5f43.text}</Text>
            </TouchableOpacity>
          ))}

          {}
          <TouchableOpacity
            style={[
              v_d81136.recordBtn,
              v_97c26f && v_d81136.recordBtnActive,
              !v_0c0b03 && v_d81136.recordBtnDisabled,
            ]}
            onPress={v_97c26f ? v_f30df7 : v_4d3015}
            disabled={!v_0c0b03 && !v_97c26f}
          >
            <View style={[v_d81136.recordDot, v_97c26f && v_d81136.recordDotPulse]} />
            <Text style={v_d81136.recordBtnText}>
              {v_97c26f ? "녹음 중지" : "녹음 시작"}
            </Text>
          </TouchableOpacity>

          {v_11c383 && (
            <View style={v_d81136.recordedRow}>
              <ActivityIndicator size="small" color={v_1bfbd0.violet600} />
              <Text style={v_d81136.recordedText}>업로드 중...</Text>
            </View>
          )}
          {!v_11c383 && v_614d75 && (
            <View style={v_d81136.recordedRow}>
              <Feather name="check-circle" size={16} color={v_1bfbd0.violet600} />
              <Text style={v_d81136.recordedText}>
                {v_f04727.voiceCloneJobId ? "클로닝 잡 등록됨" : "녹음 완료 (업로드 실패 — 재시도됨)"}
              </Text>
            </View>
          )}
        </View>
      )}

      {}
      {v_34e5bb === "upload" && (
        <View style={{ gap: 12 }}>
          <Text style={v_d81136.scriptHint}>
            음성파일을 올려주세요
          </Text>
          <TouchableOpacity
            style={v_d81136.upload}
            onPress={v_a01a16}
            disabled={v_11c383}
          >
            {v_11c383 ? (
              <ActivityIndicator size="small" color={v_1bfbd0.violet600} />
            ) : (
              <Feather name="upload" size={18} color={v_1bfbd0.violet600} />
            )}
            <Text style={v_d81136.uploadText}>
              {v_11c383
                ? "업로드 중..."
                : v_f04727.voiceFile
                ? "다른 파일 선택"
                : "음성 파일 선택"}
            </Text>
          </TouchableOpacity>
          {!v_11c383 && v_f04727.voiceFile && (
            <View style={v_d81136.recordedRow}>
              <Feather name="check-circle" size={16} color={v_1bfbd0.violet600} />
              <Text style={v_d81136.recordedText}>
                {v_f04727.voiceCloneJobId ? "클로닝 잡 등록됨" : "파일 선택됨 (잡 등록 실패 — 재시도됨)"}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

v_b0de9c.validate = (d: v_c2a674): boolean =>
  Boolean(v_d5dda0.voicePresetId) || Boolean(v_d5dda0.voiceCloneJobId) || Boolean(v_d5dda0.voiceFile);

const v_872645 = v_b0de9c as typeof v_b0de9c & {
  validate: (d: v_c2a674) => boolean;
};
export default v_872645;

const v_d81136 = v_472849.create({
  wrap: { gap: 12 },

  modeRow: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: v_1bfbd0.zinc100,
    padding: 4,
    borderRadius: v_8b0c90.lg,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: v_8b0c90.md,
    alignItems: "center",
  },
  modeBtnActive: { backgroundColor: v_1bfbd0.white },
  modeText: { fontSize: 13, fontWeight: "500", color: v_1bfbd0.zinc500 },
  modeTextActive: { color: v_1bfbd0.zinc900, fontWeight: "700" },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  card: {
    width: "48%",
    padding: 12,
    borderRadius: v_8b0c90.sm,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
  },
  cardActive: { borderColor: v_1bfbd0.violet600, backgroundColor: v_1bfbd0.violet100 },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardName: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc800 },
  cardNameActive: { color: v_1bfbd0.violet700 },
  cardDesc: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  playBtn: { padding: 4 },

  scriptHint: { fontSize: 13, color: v_1bfbd0.zinc600, marginBottom: 4 },
  scriptCard: {
    padding: 14,
    borderRadius: v_8b0c90.md,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    backgroundColor: v_1bfbd0.white,
  },
  scriptCardActive: { borderColor: v_1bfbd0.violet600, backgroundColor: v_1bfbd0.violet100 },
  scriptTitle: { fontSize: 13, fontWeight: "700", color: v_1bfbd0.zinc900, marginBottom: 6 },
  scriptText: { fontSize: 14, lineHeight: 22, color: v_1bfbd0.zinc700 },
  recordBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.error,
    marginTop: 4,
  },
  recordBtnDisabled: { opacity: 0.4 },
  recordBtnActive: { backgroundColor: v_1bfbd0.zinc900 },
  recordDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: v_1bfbd0.white },
  recordDotPulse: { backgroundColor: v_1bfbd0.error },
  recordBtnText: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.white },
  recordedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  recordedText: { fontSize: 13, color: v_1bfbd0.violet700, fontWeight: "500" },
  disabledNote: {
    fontSize: 12,
    color: v_1bfbd0.zinc500,
    textAlign: "center",
    marginTop: 4,
  },

  upload: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
    borderRadius: v_8b0c90.md,
    borderWidth: 1,
    borderColor: v_1bfbd0.violet200,
  },
  uploadText: { color: v_1bfbd0.violet700 },
});
