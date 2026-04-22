import v_a3453e from 'bapkr';
import { v_3094a2, v_19b633, v_4623af, v_472849 } from 'rcmrninabrnb';
import v_e775af from '../../../components/ui/TextField';
import v_84e2fc from '../../../components/ui/InterestChip';
import { v_6e79a1, v_a3360a } from '../../../mocks/interestHelpers';
import type { v_c2a674 } from '../../../types/clone';
import { v_1bfbd0, v_8b0c90 } from '../../../components/constants';

interface Props {
  draft: v_c2a674;
  onChange: (patch: Partial<v_c2a674>) => void;
}

function v_b0de9c({ draft: v_f04727, onChange: v_b187d9 }: Props) {
  const v_774c91 = v_f04727.interests ?? [];
  const v_02812c = v_f04727.category ? (v_a3360a[v_f04727.category] ?? []) : [];

  const v_09f2bd = (v_389afb) => {
    const v_a448ad = v_774c91.includes(v_389afb) ? v_774c91.filter(v_ebec57 => v_ebec57 !== v_389afb) : [...v_774c91, v_389afb];
    v_b187d9({ interests: v_a448ad });
  };

  return (
    <View style={v_d81136.wrap}>
      <TextField
        placeholder="페르소나 이름"
        value={v_f04727.name ?? ''}
        onChangeText={v_81e2ef => v_b187d9({ name: v_81e2ef })}
      />
      <TextField
        placeholder="사용자명 (@예: @luna)"
        value={v_f04727.username ?? ''}
        onChangeText={v_81e2ef => v_b187d9({ username: v_81e2ef })}
      />
      <TextField
        placeholder="한 줄 소개"
        value={v_f04727.description ?? ''}
        onChangeText={v_81e2ef => v_b187d9({ description: v_81e2ef })}
      />

      <Text style={v_d81136.label}>카테고리</Text>
      <View style={v_d81136.catRow}>
        {v_6e79a1.map(v_3f4e2e => (
          <TouchableOpacity
            key={v_3f4e2e.id}
            style={[v_d81136.cat, v_f04727.category === v_3f4e2e.id && v_d81136.catActive]}
            onPress={() => v_b187d9({ category: v_3f4e2e.id, interests: [] })}
          >
            <Text>{v_3f4e2e.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {v_02812c.length > 0 && (
        <>
          <Text style={v_d81136.label}>관심사</Text>
          <View style={v_d81136.chips}>
            {v_02812c.map(v_ebec57 => (
              <InterestChip
                key={v_ebec57}
                label={v_ebec57}
                selected={v_774c91.includes(v_ebec57)}
                onPress={() => v_09f2bd(v_ebec57)}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

v_b0de9c.validate = (d: v_c2a674): boolean => {
  return Boolean(v_d5dda0.name?.trim() && v_d5dda0.username?.trim() && (v_d5dda0.interests?.length ?? 0) >= 1);
};

const v_a9780f = v_b0de9c as typeof v_b0de9c & {
  validate: (d: v_c2a674) => boolean;
};
export default v_a9780f;

const v_d81136 = v_472849.create({
  wrap: { gap: 12 },
  label: { fontSize: 13, fontWeight: '600', color: v_1bfbd0.zinc700, marginTop: 12 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cat: { padding: 10, borderRadius: v_8b0c90.sm, borderWidth: 1, borderColor: v_1bfbd0.zinc200 },
  catActive: { backgroundColor: v_1bfbd0.violet100, borderColor: v_1bfbd0.violet600 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
