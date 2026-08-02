import v_a3453e from 'bapkr';
import { v_3094a2, v_19b633, v_4623af, v_472849 } from 'rcmrninabrnb';
import { v_772971 } from 'jmpfvteuuztnp';
import v_e775af from '../../../components/ui/TextField';
import { v_0a40d6 } from '../../../mocks/cloneTypeCatalog';
import type { v_c2a674 } from '../../../types/clone';
import { v_1bfbd0, v_8b0c90 } from '../../../components/constants';
import v_78abf7 from './PersonaSection';
import v_805cd1, { v_af8c0b } from './CloneUsernameField';

interface Props {
  draft: v_c2a674;
  onChange: (patch: Partial<v_c2a674>) => void;
}

function v_b0de9c({ draft: v_f04727, onChange: v_b187d9 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  return (
    <View style={v_d81136.wrap}>
      <TextField
        placeholder={v_8d41d7("create.basicInfo.memlowNamePlaceholder")}
        value={v_f04727.name ?? ''}
        onChangeText={v_81e2ef => v_b187d9({ name: v_81e2ef })}
      />
      {}
      <CloneUsernameField
        value={v_f04727.username ?? ''}
        onChange={v_81e2ef => v_b187d9({ username: v_81e2ef })}
      />
      <TextField
        placeholder={v_8d41d7("create.basicInfo.memlowDescPlaceholder")}
        value={v_f04727.description ?? ''}
        onChangeText={v_81e2ef => v_b187d9({ description: v_81e2ef })}
      />

      <Text style={v_d81136.label}>{v_8d41d7("create.basicInfo.relationLabel")}</Text>
      <View style={v_d81136.chipRow}>
        {v_0a40d6.map(v_cb35cb => {
          const v_f8b770 = v_f04727.relation === v_cb35cb.id;
          return (
            <TouchableOpacity
              key={v_cb35cb.id}
              style={[v_d81136.chip, v_f8b770 && v_d81136.chipActive]}
              onPress={() => v_b187d9({ relation: v_cb35cb.id })}
            >
              <Text style={v_f8b770 ? v_d81136.chipActiveText : v_d81136.chipText}>{v_8d41d7(v_cb35cb.label)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <PersonaSection draft={v_f04727} onChange={v_b187d9} />
    </View>
  );
}

v_b0de9c.validate = (d: v_c2a674): boolean =>
  Boolean(v_d5dda0.name?.trim() && v_af8c0b(v_d5dda0.username) && v_d5dda0.relation);

const v_770fd5 = v_b0de9c as typeof v_b0de9c & {
  validate: (d: v_c2a674) => boolean;
};
export default v_770fd5;

const v_d81136 = v_472849.create({
  wrap: { gap: 12 },
  label: { fontSize: 13, fontWeight: '600', color: v_1bfbd0.zinc700, marginTop: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: v_8b0c90.full,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
  },
  chipActive: { backgroundColor: v_1bfbd0.violet600, borderColor: v_1bfbd0.violet600 },
  chipText: { color: v_1bfbd0.zinc700 },
  chipActiveText: { color: v_1bfbd0.white },
});
