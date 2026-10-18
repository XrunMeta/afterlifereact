import { v_889fad } from "../../../stores/dialogStore";
import v_a3453e, { v_c4deb2, v_e662ae, v_5ab095 } from 'bapkr';
import { v_3094a2, v_19b633, v_4623af, v_03e392, v_472849 } from 'rcmrninabrnb';
import { v_dec439 } from 'zvyjokvuouwvifyzks';
import * as v_c95b2c from 'gketqwckyalygtuqsawm';
import { v_772971 } from 'jmpfvteuuztnp';
import { v_37549e } from '../../../mocks/cloneTypeCatalog';
import type { v_c2a674 } from '../../../types/clone';
import { v_1bfbd0, v_8b0c90 } from '../../../components/constants';

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
    const v_cb35cb = await v_c95b2c.getDocumentAsync({ type: 'audio/*' });
    if (!v_cb35cb.canceled && v_cb35cb.assets[0]) {
      v_b187d9({ voiceFile: v_cb35cb.assets[0].uri, recordDuration: 0 });
    }
  } catch {
    v_889fad(v_b5cd35, v_976e82);
  }
}

function v_b0de9c({ draft: v_f04727, onChange: v_b187d9 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const [v_5fba7b, v_d59b37] = v_5ab095(false);
  const v_9a5f22 = v_e662ae<ReturnType<typeof setInterval> | null>(null);

  v_c4deb2(
    () => () => {
      if (v_9a5f22.current) clearInterval(v_9a5f22.current);
    },
    [],
  );

  const v_6971ef = () => {
    if (v_5fba7b) {
      if (v_9a5f22.current) clearInterval(v_9a5f22.current);
      v_d59b37(false);
      return;
    }
    v_d59b37(true);
    v_9a5f22.current = setInterval(() => {
      const v_c3bc75 = (v_f04727.recordDuration ?? 0) + 1;
      v_b187d9({ recordDuration: v_c3bc75, voiceFile: undefined });
      if (v_c3bc75 >= 60) {
        if (v_9a5f22.current) clearInterval(v_9a5f22.current);
        v_d59b37(false);
      }
    }, 1000);
  };

  return (
    <View style={v_d81136.wrap}>
      <Text style={v_d81136.title}>{v_8d41d7("create.voice.memlowTitle")}</Text>
      <View style={v_d81136.scriptList}>
        {v_37549e.map(v_fd5f43 => {
          const v_f8b770 = v_f04727.voiceScriptId === v_fd5f43.id;
          return (
            <TouchableOpacity
              key={v_fd5f43.id}
              style={[v_d81136.scriptCard, v_f8b770 && v_d81136.scriptCardActive]}
              onPress={() => v_b187d9({ voiceScriptId: v_fd5f43.id })}
            >
              <Text style={v_d81136.scriptTitle}>{v_fd5f43.title}</Text>
              <Text style={v_d81136.scriptText} numberOfLines={2}>
                {v_fd5f43.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={[v_d81136.rec, v_5fba7b && v_d81136.recActive]} onPress={v_6971ef}>
        <Feather name={v_5fba7b ? 'square' : 'mic'} size={22} color={v_1bfbd0.white} />
        <Text style={v_d81136.recText}>
          {v_5fba7b ? v_8d41d7("create.voice.recordStop") : v_8d41d7("create.voice.recordStart")} ({v_f04727.recordDuration ?? 0}s / {v_8d41d7("create.voice.recordRange")})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={v_d81136.upload}
        onPress={() => v_467998(v_b187d9, v_8d41d7("common.error"), v_8d41d7("create.voice.fileError"))}
      >
        <Feather name="upload" size={20} color={v_1bfbd0.violet600} />
        <Text style={v_d81136.uploadText}>
          {v_f04727.voiceFile ? v_8d41d7("create.voice.uploadedFile") : v_8d41d7("create.voice.uploadFileMemlow")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

v_b0de9c.validate = (d: v_c2a674): boolean =>
  (v_d5dda0.recordDuration ?? 0) >= 30 || Boolean(v_d5dda0.voiceFile);

const v_95a2dd = v_b0de9c as typeof v_b0de9c & {
  validate: (d: v_c2a674) => boolean;
};
export default v_95a2dd;

const v_d81136 = v_472849.create({
  wrap: { gap: 12 },
  title: { fontSize: 14, fontWeight: '600', color: v_1bfbd0.zinc800 },
  scriptList: { gap: 8 },
  scriptCard: {
    padding: 12,
    borderRadius: v_8b0c90.sm,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
  },
  scriptCardActive: { borderColor: v_1bfbd0.violet600, backgroundColor: v_1bfbd0.violet100 },
  scriptTitle: { fontSize: 13, fontWeight: '600', color: v_1bfbd0.zinc800 },
  scriptText: { fontSize: 12, color: v_1bfbd0.zinc600, marginTop: 4 },
  rec: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: v_1bfbd0.primary,
    padding: 14,
    borderRadius: v_8b0c90.md,
  },
  recActive: { backgroundColor: v_1bfbd0.rose500 },
  recText: { color: v_1bfbd0.white, fontWeight: '600' },
  upload: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: v_8b0c90.sm,
    borderWidth: 1,
    borderColor: v_1bfbd0.violet200,
  },
  uploadText: { color: v_1bfbd0.violet700 },
});
