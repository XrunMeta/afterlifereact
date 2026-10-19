

import { v_889fad } from "../../../stores/dialogStore";
import v_a3453e, { v_c4deb2, v_e662ae, v_5ab095 } from "bapkr";
import { v_3094a2, v_19b633, v_4623af, v_472849, v_39a996, v_326be8, v_405151 } from "rcmrninabrnb";
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
import { v_cf763b } from "ixigazcpvfldbecwtbvavtbi";
import type { v_c2a674 } from "../../../types/clone";
import { v_1bfbd0, v_8b0c90, v_a9d3e9, v_e3d001 } from "../../../components/constants";
import { v_3ee8c0, v_ab4719, v_8aa90d, type v_d80981 } from "../../../api/clones";
import { v_17fa33, v_7218f6, v_d76390 } from "./analyzeReason";
import { v_7d2692 } from "../../../api/files";
import { v_1ed7d9 } from "../../../stores/authStore";
import { v_d7b329 } from "../../../lib/voicePresetName";
import { v_6c761f } from "../../../lib/audioFileCheck";
import { v_184958, v_dac67e, type v_b161c8 } from "../../../lib/audioQualityGate";

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

type Mode = "record" | "preset" | "upload";

const v_128633 = ["record", "preset", "upload"];

type VoicePick = Pick<
  v_c2a674,
  "voicePresetId" | "voiceCloneJobId" | "voiceFile" | "voiceSampleId"
>;

const v_884e4d = {
  voicePresetId: undefined,
  voiceCloneJobId: undefined,
  voiceFile: undefined,
  voiceSampleId: undefined,
};

export function v_2ba26d(d: v_c2a674): Mode {
  if (v_d5dda0.voiceMode) return v_d5dda0.voiceMode;
  if (v_d5dda0.voicePresetId !== undefined) return "preset";
  if (v_d5dda0.voiceFile !== undefined || v_d5dda0.voiceCloneJobId !== undefined) return "upload";
  return "record";
}

interface Props {
  draft: v_c2a674;
  onChange: (patch: Partial<v_c2a674>) => void;
}

interface VoiceSource {
  uri: string;
  mimeType: string;
  fileName: string;
}

async function v_48cafb(
  v_8d41d7,
): Promise<VoiceSource | null> {
  let result: Awaited<ReturnType<typeof v_c95b2c.getDocumentAsync>>;
  try {
    v_43c42e = await v_c95b2c.getDocumentAsync({ type: "audio/*" });
  } catch {
    v_889fad(
      v_8d41d7("create.voice.pickFileErrorTitle", { defaultValue: "파일 선택 오류" }),
      v_8d41d7("create.voice.pickFileErrorMsg", { defaultValue: "파일을 선택하지 못했습니다." }),
    );
    return null;
  }
  if (v_43c42e.canceled || !v_43c42e.assets[0]) return null;
  const v_b76cd8 = v_43c42e.assets[0];

  const v_1b0e1d = await v_6c761f({
    uri: v_b76cd8.uri,
    name: v_b76cd8.name,
    mimeType: v_b76cd8.mimeType,
    size: v_b76cd8.size,
  });
  if (!v_1b0e1d.ok) {
    v_889fad(
      v_8d41d7("create.voice.notAudioTitle", { defaultValue: "음성 파일이 아닙니다" }),
      v_1b0e1d.reason === "empty"
        ? v_8d41d7("create.voice.notAudioEmpty", { defaultValue: "빈 파일입니다. 다른 파일을 선택해 주십시오." })
        : v_8d41d7("create.voice.notAudioMsg", {
            defaultValue: "오디오 파일만 등록할 수 있습니다. mp3·m4a·wav 등 음성 파일을 선택해 주십시오.",
          }),
    );
    return null;
  }

  if (v_1b0e1d.warn === "too_short") {
    v_889fad(
      v_8d41d7("create.voice.warnTooShortTitle", { defaultValue: "파일이 너무 짧아요" }),
      v_8d41d7("create.voice.warnTooShortMsg", {
        defaultValue: "선택한 파일이 아주 짧아요. 클론 목소리 학습에는 30초~1분 분량의 조용한 녹음이 필요해요. 다른 파일을 골라 다시 올려 주세요.",
      }),
    );
  } else if (v_1b0e1d.warn === "too_large") {
    v_889fad(
      v_8d41d7("create.voice.warnTooLargeTitle", { defaultValue: "파일이 너무 커요" }),
      v_8d41d7("create.voice.warnTooLargeMsg", {
        defaultValue: "선택한 파일이 너무 길어요. 30초~1분 분량으로 잘라서 다시 올려 주세요.",
      }),
    );
  }

  return {
    uri: v_b76cd8.uri,
    mimeType: v_b76cd8.mimeType ?? "audio/mpeg",
    fileName: v_b76cd8.name ?? "voice.mp3",
  };
}

function v_b0de9c({ draft: v_f04727, onChange: v_b187d9 }: Props) {
  const { t: v_8d41d7, i18n: v_9c213b } = v_772971();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);

  const [v_34e5bb, v_038d7f] = v_5ab095<Mode>(() => v_2ba26d(v_f04727));

  const [v_404fe1, v_214f34] = v_5ab095<Record<Mode, VoicePick | null>>(() => {
    const v_b56a36 = { upload: null, record: null, preset: null };
    const v_35f85c = v_2ba26d(v_f04727);
    if (v_f04727.voicePresetId !== undefined || v_f04727.voiceCloneJobId || v_f04727.voiceFile) {
      v_b56a36[v_35f85c] = {
        voicePresetId: v_f04727.voicePresetId,
        voiceCloneJobId: v_f04727.voiceCloneJobId,
        voiceFile: v_f04727.voiceFile,
        voiceSampleId: v_f04727.voiceSampleId,
      };
    }
    return v_b56a36;
  });

  const v_b8b284 = v_e662ae(v_34e5bb);
  v_b8b284.current = v_34e5bb;

  const v_4a4814 = (v_35f85c, v_ff792b) => {
    const v_a448ad = { ...v_884e4d, ...v_ff792b };
    v_214f34((v_ba2215) => ({ ...v_ba2215, [v_35f85c]: v_a448ad }));
    if (v_b8b284.current === v_35f85c) v_b187d9({ ...v_a448ad, voiceMode: v_35f85c });
  };

  const [v_04e790, v_43f854] = v_5ab095<Partial<Record<Mode, VoiceSource>>>({});
  const [v_415c0c, v_2941d3] = v_5ab095<Partial<Record<Mode, boolean>>>({});

  const v_a9e8f0 = async (v_35f85c, v_38d084) => {
    v_43f854((v_ba2215) => ({ ...v_ba2215, [v_35f85c]: v_38d084 }));
    v_2941d3((v_ba2215) => ({ ...v_ba2215, [v_35f85c]: false }));

    v_4a4814(v_35f85c, { voiceFile: v_38d084.uri });

    if (!v_2ca7e0) {
      v_2941d3((v_ba2215) => ({ ...v_ba2215, [v_35f85c]: true }));
      return;
    }
    v_bbded0(true);
    try {
      const v_57ac81 = await v_7d2692(v_2ca7e0, v_38d084.uri, {
        purpose: "clone_voice",
        mimeType: v_38d084.mimeType,
        fileName: v_38d084.fileName,
      });

      v_0bda1d(true);
      let v_1b0e1d;
      try {
        v_1b0e1d = await v_8aa90d(v_2ca7e0, { src_file_id: v_57ac81.id });
      } catch (v_9e86fd) {
        console.warn(`[DefaultVoice] ${v_35f85c} analyze failed:`, v_9e86fd);
        v_889fad(v_8d41d7(v_7218f6), v_8d41d7(v_17fa33("ANALYZE_FAILED")));
        v_2941d3((v_ba2215) => ({ ...v_ba2215, [v_35f85c]: true }));
        return; 
      } finally {
        v_0bda1d(false);
      }
      if (!v_1b0e1d.ok) {
        v_889fad(v_8d41d7(v_7218f6), v_8d41d7(v_17fa33(v_1b0e1d.reason)));
        v_2941d3((v_ba2215) => ({ ...v_ba2215, [v_35f85c]: true }));
        return; 
      }

      const v_94abbb = await v_ab4719(v_2ca7e0, {
        kind: "voice_clone",
        src_file_id: v_57ac81.id,
      });
      console.log(`[DefaultVoice] voice_clone job (${v_35f85c}) created:`, v_94abbb.job_id);
      v_4a4814(v_35f85c, { voiceFile: v_38d084.uri, voiceCloneJobId: v_94abbb.job_id });
    } catch (v_49263d) {
      console.warn(`[DefaultVoice] ${v_35f85c} upload/job failed:`, v_49263d);
      v_2941d3((v_ba2215) => ({ ...v_ba2215, [v_35f85c]: true }));
    } finally {
      v_bbded0(false);
    }
  };

  const v_402288 = (v_35f85c) => {
    const v_38d084 = v_04e790[v_35f85c];
    if (v_38d084) void v_a9e8f0(v_35f85c, v_38d084);
  };

  const v_69341a = (v_35f85c) => {
    v_038d7f(v_35f85c);
    v_b187d9({ ...(v_404fe1[v_35f85c] ?? v_884e4d), voiceMode: v_35f85c });
  };
  const [v_53e1f3, v_de0f36] = v_5ab095<v_d80981[]>([]);
  const [v_fd3c7b, v_4fbeaf] = v_5ab095(false);
  const [v_0c0b03, v_c98f46] = v_5ab095<string | null>(null);
  const [v_11c383, v_bbded0] = v_5ab095(false);
  const [v_19d839, v_0bda1d] = v_5ab095(false);

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

  const v_5ebce3 = v_8a9d74({ ...v_542f2a.HIGH_QUALITY, isMeteringEnabled: true });
  const v_b599c8 = v_b3e89c(v_5ebce3, 200);

  const v_89619a = v_e662ae<number[]>([]);
  const v_cc5fba = v_e662ae<Record<v_b161c8, number>>({ ok: 0, silence: 0, noise: 0 });
  const v_ceb0fd = v_e662ae<{ silence: number; noise: number; total: number }>({
    silence: 0, noise: 0, total: 0,
  });

  const v_5cdd15 = v_a3453e.useCallback((v_badeaf) => {
    if (v_326be8.OS === "android") {
      v_405151.show(v_badeaf, v_405151.LONG);
    } else {

      console.log("[QualityGate][iOS]", v_badeaf);
    }
  }, []);

  v_c4deb2(() => {
    if (!v_b599c8.isRecording) {
      v_89619a.current = [];
      return;
    }
    const v_35f85c = (v_b599c8 as unknown as { metering?: number }).metering;
    if (typeof v_35f85c !== "number" || !Number.isFinite(v_35f85c)) return;

    v_89619a.current = v_184958(v_89619a.current, v_35f85c);
    v_ceb0fd.current.total += 1;
    if (v_89619a.current.length < 15) return; 

    const v_8f00b9 = v_dac67e(v_89619a.current);
    if (v_8f00b9.verdict === "ok") return;

    if (v_8f00b9.verdict === "silence") v_ceb0fd.current.silence += 1;
    if (v_8f00b9.verdict === "noise") v_ceb0fd.current.noise += 1;

    const v_5c2f9f = Date.now();
    if (v_5c2f9f - v_cc5fba.current[v_8f00b9.verdict] < 5000) return;
    v_cc5fba.current[v_8f00b9.verdict] = v_5c2f9f;

    if (v_8f00b9.verdict === "silence") {
      v_5cdd15(v_8d41d7("create.voice.toastSilence", {
        defaultValue: "너무 조용해요. 좀 더 크게 말씀해 주세요.",
      }));
    } else if (v_8f00b9.verdict === "noise") {
      v_5cdd15(v_8d41d7("create.voice.toastNoise", {
        defaultValue: "주변이 시끄러워요. 조용한 곳에서 녹음해 주세요.",
      }));
    }

  }, [v_b599c8.isRecording, (v_b599c8 as unknown as { metering?: number }).metering]);

  const v_504bbe = v_e662ae(v_5ebce3);
  v_504bbe.current = v_5ebce3;
  v_c4deb2(() => {
    return () => {

      try {
        void v_504bbe.current.stop?.().catch(() => {});
      } catch {

      }

      try {
        v_86394a.pause();
      } catch {

      }
    };

  }, []);

  v_cf763b(
    v_a3453e.useCallback(() => {
      return () => {
        try {
          v_86394a.pause();
        } catch {

        }
        v_a4d7cc(null);
      };

    }, []),
  );

  const v_0f4413 = async (v: v_d80981) => {

    try { v_86394a.pause(); } catch {  }
    if (v_81e2ef.sampleUrl) {
      try {
        v_86394a.replace({ uri: v_81e2ef.sampleUrl });
        v_86394a.play();
        v_a4d7cc(v_81e2ef.id);
      } catch (v_49263d) {
        console.warn("[DefaultVoice] preset auto-preview 실패:", v_49263d);
        v_a4d7cc(null);
      }
    } else {
      v_a4d7cc(null);
    }
    if (v_81e2ef.srcFileId == null) {

      v_523782(v_81e2ef.id);
      v_4a4814("preset", { voicePresetId: v_81e2ef.id });
      return;
    }

    if (!v_2ca7e0) return;

    v_523782(v_81e2ef.id);
    v_4a4814("preset", v_884e4d);
    const v_1923e2 = ++v_64652e.current;
    try {
      v_bbded0(true);
      const v_94abbb = await v_ab4719(v_2ca7e0, { kind: "voice_clone", src_file_id: v_81e2ef.srcFileId });
      if (v_1923e2 !== v_64652e.current) return;  
      console.log("[DefaultVoice] preset voice_clone job created:", v_94abbb.job_id);
      v_4a4814("preset", { voiceCloneJobId: v_94abbb.job_id });
    } catch (v_49263d) {
      if (v_1923e2 === v_64652e.current) {

        v_523782(null);
        v_4a4814("preset", v_884e4d);
        console.warn("[DefaultVoice] preset job 생성 실패:", v_49263d);
        v_889fad(
          v_8d41d7("create.voice.presetErrorTitle", { defaultValue: "음성 선택 오류" }),
          v_8d41d7("create.voice.presetErrorMsg", { defaultValue: "잠시 후 다시 시도해 주세요." }),
        );
      }
    } finally {
      if (v_1923e2 === v_64652e.current) v_bbded0(false);
    }
  };

  const v_1bf8db = (v: v_d80981) => {
    if (v_cf954d === v_81e2ef.id) {
      try { v_86394a.pause(); } catch {  }
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

        if (v_f04727.voicePresetId !== undefined) v_523782(v_f04727.voicePresetId);
      } catch {
        if (v_759436) v_4fbeaf(true);
      }
    })();
    return () => { v_759436 = false; };

  }, [v_2ca7e0]);

  v_c4deb2(() => {
    if (v_34e5bb !== "preset") return;
    if (v_404fe1.preset) return;
    if (!v_53e1f3.length) return;
    v_0f4413(v_53e1f3[0]);

  }, [v_34e5bb, v_53e1f3, v_404fe1.preset]);

  const v_4d3015 = async () => {
    if (!v_0c0b03) {
      v_889fad(
        v_8d41d7("create.voice.scriptRequiredTitle", { defaultValue: "스크립트 선택" }),
        v_8d41d7("create.voice.scriptRequiredMsg", { defaultValue: "먼저 읽을 스크립트를 선택해주세요." }),
      );
      return;
    }
    try {
      const v_d60769 = await v_66d7d4();
      if (!v_d60769.granted) {
        v_889fad(
          v_8d41d7("create.voice.permTitle", { defaultValue: "권한 필요" }),
          v_8d41d7("create.voice.permDesc", { defaultValue: "마이크 권한이 필요해요. 설정에서 허용해주세요." }),
        );
        return;
      }

      await v_0e491a({ allowsRecording: true, playsInSilentMode: true });

      await v_5ebce3.prepareToRecordAsync();
      await v_5ebce3.record();
    } catch (v_49263d) {
      console.warn("[DefaultVoice] 녹음 시작 실패:", String(v_49263d));
      v_889fad(
        v_8d41d7("create.voice.recordStartFailedTitle", { defaultValue: "녹음 오류" }),
        v_8d41d7("create.voice.recordStartFailedMsg", {
          defaultValue: "녹음을 시작하지 못했어요. 잠시 후 다시 시도해주세요.",
        }),
      );
    }
  };

  const v_f30df7 = async () => {
    await v_5ebce3.stop();

    await v_0e491a({ allowsRecording: false });
    const v_cd1446 = v_5ebce3.uri;
    if (!v_cd1446) return;

    const v_fd5f43 = v_ceb0fd.current;
    v_ceb0fd.current = { silence: 0, noise: 0, total: 0 };
    if (v_fd5f43.total >= 15) { 
      const v_a7bb65 = v_fd5f43.silence / v_fd5f43.total;
      const v_576a95 = v_fd5f43.noise / v_fd5f43.total;
      if (v_a7bb65 > 0.3 || v_576a95 > 0.3) {
        const primary: v_b161c8 = v_a7bb65 >= v_576a95 ? "silence" : "noise";
        v_889fad(
          v_8d41d7("create.voice.recordQualityTitle", { defaultValue: "녹음 품질 확인" }),
          v_127e92 === "silence"
            ? v_8d41d7("create.voice.recordQualitySilenceMsg", {
                defaultValue: "녹음에 무음 구간이 많아요. 조용한 곳에서 문장 전체를 또렷하게 다시 녹음해 주세요.",
              })
            : v_8d41d7("create.voice.recordQualityNoiseMsg", {
                defaultValue: "녹음에 주변 소음이 섞였어요. 조용한 곳에서 다시 녹음해 주시면 클론 목소리가 훨씬 자연스러워집니다.",
              }),
        );

      }
    }

    await v_a9e8f0("record", {
      uri: v_cd1446,
      mimeType: "audio/m4a",
      fileName: "voice_record.m4a",
    });
  };

  const v_a01a16 = async () => {

    const v_38d084 = await v_48cafb(v_8d41d7);
    if (!v_38d084) return;
    await v_a9e8f0("upload", v_38d084);
  };

  const v_97c26f = v_b599c8.isRecording;
  const v_614d75 = !v_97c26f && v_5ebce3.uri ? v_5ebce3.uri : null;

  const v_d849f9 = v_58b6a9.map((v_fd5f43) => {
    if (v_fd5f43.id === "s1")
      return {
        id: v_fd5f43.id,
        title: v_8d41d7("create.voice.scripts.s1Title", { defaultValue: v_fd5f43.title }),
        text: v_8d41d7("create.voice.scripts.s1Text", { defaultValue: v_fd5f43.text }),
      };
    if (v_fd5f43.id === "s2")
      return {
        id: v_fd5f43.id,
        title: v_8d41d7("create.voice.scripts.s2Title", { defaultValue: v_fd5f43.title }),
        text: v_8d41d7("create.voice.scripts.s2Text", { defaultValue: v_fd5f43.text }),
      };
    return {
      id: v_fd5f43.id,
      title: v_8d41d7("create.voice.scripts.s3Title", { defaultValue: v_fd5f43.title }),
      text: v_8d41d7("create.voice.scripts.s3Text", { defaultValue: v_fd5f43.text }),
    };
  });

  return (
    <View style={v_d81136.wrap}>
      {}
      <View style={v_d81136.modeRow}>
        {v_128633.map((v_35f85c) => {
          const v_2869c1 =
            v_35f85c === "preset"
              ? v_8d41d7("create.voice.modePreset", { defaultValue: "음색 선택" })
              : v_35f85c === "record"
              ? v_8d41d7("create.voice.modeRecord", { defaultValue: "직접 녹음" })
              : v_8d41d7("create.voice.modeUpload", { defaultValue: "파일 업로드" });
          return (
            <TouchableOpacity
              key={v_35f85c}
              style={[v_d81136.modeBtn, v_34e5bb === v_35f85c && v_d81136.modeBtnActive]}
              onPress={() => v_69341a(v_35f85c)}
            >
              <Text style={[v_d81136.modeText, v_34e5bb === v_35f85c && v_d81136.modeTextActive]}>{v_2869c1}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {}
      {v_34e5bb === "preset" && (
        <View style={{ gap: 8 }}>
          <Text style={v_d81136.scriptHint}>
            {v_8d41d7("create.voice.choosePresetHint", { defaultValue: "목소리를 선택해 주세요." })}
          </Text>
          {v_fd3c7b && (
            <Text style={v_d81136.scriptHint}>
              {v_8d41d7("create.voice.presetLoadFailed", { defaultValue: "목소리 목록을 불러오지 못했어요." })}
            </Text>
          )}
          {v_11c383 && (
            <View style={v_d81136.recordedRow}>
              <ActivityIndicator size="small" color={v_a9d3e9} />
              <Text style={v_d81136.recordedText}>
                {v_8d41d7("create.voice.presetPreparing", { defaultValue: "음성 준비 중…" })}
              </Text>
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
                    <Text style={[v_d81136.cardName, v_f8b770 && v_d81136.cardNameActive]}>
                      {v_d7b329(v_81e2ef, v_9c213b.language)}
                    </Text>
                    <TouchableOpacity
                      style={v_d81136.playBtn}
                      onPress={(v_9e86fd) => { v_9e86fd.stopPropagation(); v_1bf8db(v_81e2ef); }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Feather
                        name={v_087c92 ? "pause" : "play"}
                        size={14}
                        color={v_f8b770 ? v_a9d3e9 : v_1bfbd0.zinc500}
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
            {v_8d41d7("create.voice.chooseScriptHint", { defaultValue: "스크립트를 선택하고 읽어주세요." })}
          </Text>
          {v_d849f9.map((v_fd5f43) => (
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
              {v_97c26f
                ? v_8d41d7("create.voice.recordStop", { defaultValue: "녹음 중지" })
                : v_8d41d7("create.voice.recordStart", { defaultValue: "녹음 시작" })}
            </Text>
          </TouchableOpacity>

          {v_11c383 && (
            <View style={v_d81136.recordedRow}>
              <ActivityIndicator size="small" color={v_a9d3e9} />
              <Text style={v_d81136.recordedText}>
                {v_19d839
                  ? v_8d41d7(v_d76390, { defaultValue: "음성 분석 중..." })
                  : v_8d41d7("create.voice.uploading", { defaultValue: "업로드 중..." })}
              </Text>
            </View>
          )}
          {!v_11c383 && v_614d75 && v_f04727.voiceCloneJobId && (
            <View style={v_d81136.recordedRow}>
              <Feather name="check-circle" size={16} color={v_a9d3e9} />
              <Text style={v_d81136.recordedText}>
                {v_8d41d7("create.voice.cloneJobRegistered", { defaultValue: "클로닝 잡 등록됨" })}
              </Text>
            </View>
          )}
          {}
          {!v_11c383 && v_415c0c.record && (
            <View style={{ gap: 8 }}>
              <View style={v_d81136.recordedRow}>
                <Feather name="alert-circle" size={16} color={v_1bfbd0.error} />
                <Text style={[v_d81136.recordedText, { color: v_1bfbd0.error }]}>
                  {v_8d41d7("create.voice.registerFailed", {
                    defaultValue: "녹음 파일 등록에 실패했습니다.",
                  })}
                </Text>
              </View>
              <TouchableOpacity style={v_d81136.retryBtn} onPress={() => v_402288("record")}>
                <Feather name="refresh-cw" size={16} color={v_1bfbd0.zinc900} />
                <Text style={v_d81136.retryBtnText}>
                  {v_8d41d7("create.voice.registerRetry", { defaultValue: "등록 다시 시도" })}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {}
      {v_34e5bb === "upload" && (
        <View style={{ gap: 12 }}>
          <Text style={v_d81136.scriptHint}>
            {v_8d41d7("create.voice.uploadPromptHint", { defaultValue: "음성파일을 올려주세요" })}
          </Text>
          <TouchableOpacity
            style={v_d81136.upload}
            onPress={v_a01a16}
            disabled={v_11c383}
          >
            {v_11c383 ? (
              <ActivityIndicator size="small" color={v_a9d3e9} />
            ) : (
              <Feather name="upload" size={18} color={v_a9d3e9} />
            )}
            <Text style={v_d81136.uploadText}>
              {v_11c383
                ? v_19d839
                  ? v_8d41d7(v_d76390, { defaultValue: "음성 분석 중..." })
                  : v_8d41d7("create.voice.uploading", { defaultValue: "업로드 중..." })
                : v_f04727.voiceFile
                ? v_8d41d7("create.voice.pickAnother", { defaultValue: "다른 파일 선택" })
                : v_8d41d7("create.voice.pickFile", { defaultValue: "음성 파일 선택" })}
            </Text>
          </TouchableOpacity>
          {!v_11c383 && v_f04727.voiceFile && v_f04727.voiceCloneJobId && (
            <View style={v_d81136.recordedRow}>
              <Feather name="check-circle" size={16} color={v_a9d3e9} />
              <Text style={v_d81136.recordedText}>
                {v_8d41d7("create.voice.cloneJobRegistered", { defaultValue: "클로닝 잡 등록됨" })}
              </Text>
            </View>
          )}
          {}
          {!v_11c383 && v_415c0c.upload && (
            <View style={{ gap: 8 }}>
              <View style={v_d81136.recordedRow}>
                <Feather name="alert-circle" size={16} color={v_1bfbd0.error} />
                <Text style={[v_d81136.recordedText, { color: v_1bfbd0.error }]}>
                  {v_8d41d7("create.voice.registerFailedFile", {
                    defaultValue: "음성 파일 등록에 실패했습니다.",
                  })}
                </Text>
              </View>
              <TouchableOpacity style={v_d81136.retryBtn} onPress={() => v_402288("upload")}>
                <Feather name="refresh-cw" size={16} color={v_1bfbd0.zinc900} />
                <Text style={v_d81136.retryBtnText}>
                  {v_8d41d7("create.voice.registerRetry", { defaultValue: "등록 다시 시도" })}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

v_b0de9c.validate = (d: v_c2a674): boolean => {
  if (v_d5dda0.voiceMode === "record" || v_d5dda0.voiceMode === "upload") return Boolean(v_d5dda0.voiceCloneJobId);
  return Boolean(v_d5dda0.voicePresetId) || Boolean(v_d5dda0.voiceCloneJobId) || Boolean(v_d5dda0.voiceFile);
};

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
  cardActive: v_e3d001.cardTint,
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardName: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc800 },
  cardNameActive: v_e3d001.accentText,
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
  scriptCardActive: v_e3d001.cardTint,
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
  recordedText: { fontSize: 13, fontWeight: "500", ...v_e3d001.accentText },

  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: v_8b0c90.lg,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    backgroundColor: v_1bfbd0.white,
  },
  retryBtnText: { fontSize: 14, color: v_1bfbd0.zinc900, fontWeight: "600" },
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
    ...v_e3d001.accentBorder,
  },
  uploadText: { color: v_1bfbd0.zinc900 },
});
