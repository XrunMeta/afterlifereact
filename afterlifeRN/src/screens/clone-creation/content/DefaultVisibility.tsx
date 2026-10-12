import v_a3453e, { v_5ab095 } from 'bapkr';
import { v_3094a2, v_19b633, v_4623af, v_472849 } from 'rcmrninabrnb';
import { v_dec439 } from 'zvyjokvuouwvifyzks';
import { v_772971 } from 'jmpfvteuuztnp';
import type { v_c2a674 } from '../../../types/clone';
import { v_1bfbd0, v_8b0c90 } from '../../../components/constants';
import v_4c2648 from '../../clones/components/FriendPickerModal';

type V = 'public' | 'followers' | 'selected' | 'private';

interface Props {
  draft: v_c2a674;
  onChange: (patch: Partial<v_c2a674>) => void;
}

function v_b0de9c({ draft: v_f04727, onChange: v_b187d9 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const [v_fca930, v_0b6eca] = v_5ab095(false);
  const v_275ccd = (v_f04727.visibility as V) ?? 'public';
  const v_a75897 = v_f04727.allowedViewerIds?.length ?? 0;

  const v_95825a = [
    { value: 'public', icon: 'globe', title: v_8d41d7('create.visibility.publicTitle'), desc: v_8d41d7('create.visibility.publicDesc') },
    { value: 'followers', icon: 'users', title: v_8d41d7('create.visibility.followersTitle'), desc: v_8d41d7('create.visibility.followersDesc') },
    {
      value: 'selected',
      icon: 'user-check',
      title: v_8d41d7('create.visibility.selectedTitle', { defaultValue: '특정 친구만' }),
      desc:
        v_275ccd === 'selected' && v_a75897 > 0
          ? v_8d41d7('create.visibility.selectedDescCount', {
              defaultValue: '친구 {{count}}명 선택됨 — 다시 눌러 변경',
              count: v_a75897,
            })
          : v_8d41d7('create.visibility.selectedDesc', { defaultValue: '탭하여 친구를 선택하세요' }),
    },
    { value: 'private', icon: 'lock', title: v_8d41d7('create.visibility.privateTitle'), desc: v_8d41d7('create.visibility.privateDesc') },
  ];

  const v_6121dc = (v_81e2ef) => {
    if (v_81e2ef === 'selected') {

      v_b187d9({ visibility: 'selected' });
      v_0b6eca(true);
      return;
    }
    v_b187d9({ visibility: v_81e2ef });
  };

  return (
    <View style={v_d81136.wrap}>
      {v_95825a.map((v_68b2be) => {
        const v_f8b770 = v_275ccd === v_68b2be.value;
        return (
          <TouchableOpacity
            key={v_68b2be.value}
            style={[v_d81136.row, v_f8b770 && v_d81136.rowActive]}
            onPress={() => v_6121dc(v_68b2be.value)}
          >
            <Feather name={v_68b2be.icon as any} size={18} color={v_f8b770 ? v_1bfbd0.violet600 : v_1bfbd0.zinc500} />
            <View style={{ flex: 1 }}>
              <Text style={v_d81136.title}>{v_68b2be.title}</Text>
              <Text style={v_d81136.desc}>{v_68b2be.desc}</Text>
            </View>
            <View style={[v_d81136.radio, v_f8b770 && v_d81136.radioActive]}>
              {v_f8b770 && <View style={v_d81136.radioDot} />}
            </View>
          </TouchableOpacity>
        );
      })}

      <FriendPickerModal
        visible={v_fca930}
        initialSelected={v_f04727.allowedViewerIds ?? []}
        onClose={() => v_0b6eca(false)}
        onConfirm={(v_9b3001) => {
          v_b187d9({ allowedViewerIds: v_9b3001 });
          v_0b6eca(false);
        }}
      />
    </View>
  );
}

v_b0de9c.validate = (_d: v_c2a674): boolean => true;

const v_bba87e = v_b0de9c as typeof v_b0de9c & {
  validate: (d: v_c2a674) => boolean;
};
export default v_bba87e;

const v_d81136 = v_472849.create({
  wrap: { gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: v_8b0c90.md,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
  },
  rowActive: { borderColor: v_1bfbd0.violet600, backgroundColor: v_1bfbd0.violet100 },
  title: { fontSize: 14, fontWeight: '600', color: v_1bfbd0.zinc800 },
  desc: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: v_1bfbd0.zinc300 },
  radioActive: { borderColor: v_1bfbd0.violet600 },
  radioDot: { flex: 1, margin: 3, borderRadius: 4, backgroundColor: v_1bfbd0.violet600 },
});
