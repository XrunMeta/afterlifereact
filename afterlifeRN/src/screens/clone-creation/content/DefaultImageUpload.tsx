import v_a3453e from 'bapkr';
import { v_3094a2, v_19b633, v_4623af, v_cf9c33, v_03e392, v_472849 } from 'rcmrninabrnb';
import { v_dec439 } from 'zvyjokvuouwvifyzks';
import * as v_d05ab5 from 'khtmgrssvfqqjmzoc';
import type { v_c2a674 } from '../../../types/clone';
import { v_1bfbd0, v_8b0c90 } from '../../../components/constants';

interface Props {
  draft: v_c2a674;
  onChange: (patch: Partial<v_c2a674>) => void;
}

const v_9e26a9 = [
  '정면을 바라보는 사진을 사용해주세요',
  '얼굴이 선명하게 보이는 사진이 좋아요',
  '배경이 단순할수록 좋은 결과를 얻을 수 있어요',
];

async function v_ff792b(onChange: (p: Partial<v_c2a674>) => void) {
  try {
    const v_cb35cb = await v_d05ab5.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!v_cb35cb.canceled && v_cb35cb.assets[0]) v_b187d9({ imageFile: v_cb35cb.assets[0].uri });
  } catch {
    v_03e392.alert('오류', '사진을 불러올 수 없어요.');
  }
}

function v_b0de9c({ draft: v_f04727, onChange: v_b187d9 }: Props) {
  return (
    <View style={v_d81136.wrap}>
      <TouchableOpacity style={v_d81136.preview} onPress={() => v_ff792b(v_b187d9)}>
        {v_f04727.imageFile ? (
          <Image source={{ uri: v_f04727.imageFile }} style={v_d81136.previewImg} />
        ) : (
          <>
            <Feather name="image" size={32} color={v_1bfbd0.zinc400} />
            <Text style={v_d81136.hint}>사진을 선택해 주세요</Text>
          </>
        )}
      </TouchableOpacity>
      <Text style={v_d81136.guideTitle}>가이드</Text>
      {v_9e26a9.map((v_206b88, v_ebec57) => (
        <Text key={v_ebec57} style={v_d81136.guideText}>
          • {v_206b88}
        </Text>
      ))}
    </View>
  );
}

v_b0de9c.validate = (d: v_c2a674): boolean => Boolean(v_d5dda0.imageFile);

const v_a6e1ad = v_b0de9c as typeof v_b0de9c & {
  validate: (d: v_c2a674) => boolean;
};
export default v_a6e1ad;

const v_d81136 = v_472849.create({
  wrap: { gap: 12 },
  preview: {
    aspectRatio: 3 / 4,
    borderRadius: v_8b0c90.md,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: v_1bfbd0.zinc50,
    overflow: 'hidden',
  },
  previewImg: { width: '100%', height: '100%' },
  hint: { marginTop: 8, color: v_1bfbd0.zinc500 },
  guideTitle: { fontSize: 13, fontWeight: '600', color: v_1bfbd0.zinc700, marginTop: 12 },
  guideText: { fontSize: 12, color: v_1bfbd0.zinc600 },
});
