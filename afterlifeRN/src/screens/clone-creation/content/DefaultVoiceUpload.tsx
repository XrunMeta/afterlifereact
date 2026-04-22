import v_a3453e, { v_5ab095 } from 'bapkr';
import { v_3094a2, v_19b633, v_4623af, v_03e392, v_472849 } from 'rcmrninabrnb';
import { v_dec439 } from 'zvyjokvuouwvifyzks';
import * as v_c95b2c from 'gketqwckyalygtuqsawm';
import type { v_c2a674 } from '../../../types/clone';
import { v_1bfbd0, v_8b0c90 } from '../../../components/constants';

export const v_e79da6 = [
  { id: 'v1', name: 'Nova', desc: '따뜻하고 부드러운' },
  { id: 'v2', name: 'Ursa', desc: '차분하고 깊은' },
  { id: 'v3', name: 'Vega', desc: '밝고 활기찬' },
  { id: 'v4', name: 'Orion', desc: '신뢰감 있는' },
  { id: 'v5', name: 'Luna', desc: '감성적인' },
  { id: 'v6', name: 'Stella', desc: '우아하고 섬세한' },
] as const;

interface Props {
  draft: v_c2a674;
  onChange: (patch: Partial<v_c2a674>) => void;
}

async function v_467998(v_b187d9) {
  try {
    const v_cb35cb = await v_c95b2c.getDocumentAsync({ type: 'audio/*' });
    if (!v_cb35cb.canceled && v_cb35cb.assets[0]) {
      v_b187d9({ voiceFile: v_cb35cb.assets[0].uri, voiceSampleId: undefined });
    }
  } catch {
    v_03e392.alert('오류', '파일을 선택할 수 없습니다.');
  }
}

function v_b0de9c({ draft: v_f04727, onChange: v_b187d9 }: Props) {
  const [v_ac6463, v_6661f7] = v_5ab095<boolean>(Boolean(v_f04727.voiceFile));
  return (
    <View style={v_d81136.wrap}>
      {!v_ac6463 && (
        <View style={v_d81136.grid}>
          {v_e79da6.map(v_81e2ef => {
            const v_f8b770 = v_f04727.voiceSampleId === v_81e2ef.id;
            return (
              <TouchableOpacity
                key={v_81e2ef.id}
                style={[v_d81136.card, v_f8b770 && v_d81136.cardActive]}
                onPress={() => v_b187d9({ voiceSampleId: v_81e2ef.id, voiceFile: undefined })}
              >
                <Text style={v_d81136.cardName}>{v_81e2ef.name}</Text>
                <Text style={v_d81136.cardDesc}>{v_81e2ef.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      <TouchableOpacity style={v_d81136.toggleRow} onPress={() => v_6661f7(!v_ac6463)}>
        <Feather
          name={v_ac6463 ? 'check-square' : 'square'}
          size={18}
          color={v_ac6463 ? v_1bfbd0.violet600 : v_1bfbd0.zinc400}
        />
        <Text style={v_d81136.toggleText}>직접 녹음/업로드 사용</Text>
      </TouchableOpacity>
      {v_ac6463 && (
        <TouchableOpacity style={v_d81136.upload} onPress={() => v_467998(v_b187d9)}>
          <Feather name="upload" size={20} color={v_1bfbd0.violet600} />
          <Text style={v_d81136.uploadText}>{v_f04727.voiceFile ? '파일 선택됨' : '오디오 파일 선택'}</Text>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: {
    width: '48%',
    padding: 12,
    borderRadius: v_8b0c90.sm,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
  },
  cardActive: { borderColor: v_1bfbd0.violet600, backgroundColor: v_1bfbd0.violet100 },
  cardName: { fontSize: 14, fontWeight: '600', color: v_1bfbd0.zinc800 },
  cardDesc: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  toggleText: { color: v_1bfbd0.zinc700 },
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
