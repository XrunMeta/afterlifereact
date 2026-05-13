

import v_a3453e, { v_5ab095 } from "bapkr";
import { v_3094a2, v_19b633, v_4623af, v_03e392, v_472849 } from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import * as v_c95b2c from "gketqwckyalygtuqsawm";

import { v_772971 } from "jmpfvteuuztnp";
import type { v_c2a674 } from "../../../types/clone";
import { v_1bfbd0, v_8b0c90 } from "../../../components/constants";

export const v_e79da6 = [
  { id: "v1", name: "Nova" },
  { id: "v2", name: "Ursa" },
  { id: "v3", name: "Vega" },
  { id: "v4", name: "Orion" },
  { id: "v5", name: "Luna" },
  { id: "v6", name: "Stella" },
] as const;

type Mode = "preset" | "upload";

interface Props {
  draft: v_c2a674;
  onChange: (patch: Partial<v_c2a674>) => void;
}

async function v_467998(
  v_b187d9,
  v_b5cd35,
  v_976e82,
) {
  try {
    const v_cb35cb = await v_c95b2c.getDocumentAsync({ type: "audio/*" });
    if (!v_cb35cb.canceled && v_cb35cb.assets[0]) {
      v_b187d9({ voiceFile: v_cb35cb.assets[0].uri, voiceSampleId: undefined });
    }
  } catch {
    v_03e392.alert(v_b5cd35, v_976e82);
  }
}

function v_b0de9c({ draft: v_f04727, onChange: v_b187d9 }: Props) {
  const { t: v_8d41d7 } = v_772971();

  const v_2ba26d = v_f04727.voiceFile ? "upload" : "preset";
  const [v_34e5bb, v_038d7f] = v_5ab095<Mode>(v_2ba26d);

  const v_69341a = (v_a448ad) => {
    if (v_a448ad === v_34e5bb) return;
    v_038d7f(v_a448ad);
    v_b187d9({ voiceSampleId: undefined, voiceFile: undefined, recordDuration: undefined });
  };

  return (
    <View style={v_d81136.wrap}>
      {}
      <View style={v_d81136.modeRow}>
        {(["preset", "upload"] as const).map((v_35f85c) => {
          const v_e0187d = {
            preset: "음성 선택",
            upload: "파일 업로드",
          };
          const v_f8b770 = v_34e5bb === v_35f85c;
          return (
            <TouchableOpacity
              key={v_35f85c}
              style={[v_d81136.modeBtn, v_f8b770 && v_d81136.modeBtnActive]}
              onPress={() => v_69341a(v_35f85c)}
            >
              <Text style={[v_d81136.modeText, v_f8b770 && v_d81136.modeTextActive]}>
                {v_e0187d[v_35f85c]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {}
      {v_34e5bb === "preset" && (
        <View style={v_d81136.grid}>
          {v_e79da6.map((v_81e2ef) => {
            const v_f8b770 = v_f04727.voiceSampleId === v_81e2ef.id;
            return (
              <TouchableOpacity
                key={v_81e2ef.id}
                style={[v_d81136.card, v_f8b770 && v_d81136.cardActive]}
                onPress={() =>
                  v_b187d9({ voiceSampleId: v_81e2ef.id, voiceFile: undefined, recordDuration: undefined })
                }
              >
                <Text style={v_d81136.cardName}>{v_81e2ef.name}</Text>
                <Text style={v_d81136.cardDesc}>{v_8d41d7(`create.voice.sample.${v_81e2ef.name}`)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {

}

      {}
      {v_34e5bb === "upload" && (
        <TouchableOpacity
          style={v_d81136.upload}
          onPress={() => v_467998(v_b187d9, v_8d41d7("common.error"), v_8d41d7("create.voice.fileError"))}
        >
          <Feather name="upload" size={20} color={v_1bfbd0.violet600} />
          <Text style={v_d81136.uploadText}>
            {v_f04727.voiceFile
              ? v_8d41d7("create.voice.uploadedFile")
              : v_8d41d7("create.voice.uploadFile")}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

v_b0de9c.validate = (d: v_c2a674): boolean =>
  Boolean(v_d5dda0.voiceSampleId || v_d5dda0.voiceFile);

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
  cardName: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc800 },
  cardDesc: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },

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
