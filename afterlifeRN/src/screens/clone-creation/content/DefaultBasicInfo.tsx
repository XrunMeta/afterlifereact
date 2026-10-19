import v_a3453e, { v_5ab095 } from 'bapkr';
import { v_3094a2, v_19b633, v_4623af, v_472849, v_79c4f2 } from 'rcmrninabrnb';
import { v_772971 } from 'jmpfvteuuztnp';
import v_e775af from '../../../components/ui/TextField';
import v_84e2fc from '../../../components/ui/InterestChip';
import { v_6e79a1, v_a3360a } from '../../../mocks/interestHelpers';
import type { v_c2a674 } from '../../../types/clone';
import { v_1bfbd0, v_8b0c90, v_e3d001, v_8f28b1 } from '../../../components/constants';
import v_78abf7 from './PersonaSection';
import v_805cd1, { v_af8c0b } from './CloneUsernameField';

interface Props {
  draft: v_c2a674;
  onChange: (patch: Partial<v_c2a674>) => void;
}

function v_b0de9c({ draft: v_f04727, onChange: v_b187d9 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const v_774c91 = v_f04727.interests ?? [];
  const v_02812c = v_f04727.category ? (v_a3360a[v_f04727.category] ?? []) : [];

  const v_32b47e = v_774c91.filter((v_ebec57) => !v_02812c.includes(v_ebec57));
  const [v_0f1d77, v_e887ea] = v_5ab095('');
  const [v_2b1044, v_160b34] = v_5ab095(false);

  const v_09f2bd = (v_389afb) => {
    const v_a448ad = v_774c91.includes(v_389afb) ? v_774c91.filter(v_ebec57 => v_ebec57 !== v_389afb) : [...v_774c91, v_389afb];
    v_b187d9({ interests: v_a448ad });
  };

  const v_8fa105 = () => {

    const v_468545 = v_0f1d77.split(',').map((v_fd5f43) => v_fd5f43.trim()).filter(Boolean);
    if (v_468545.length === 0) return;
    const v_110a8b = new Set(v_774c91);
    const v_a448ad = [...v_774c91];
    for (const v_e2a85c of v_468545) {
      if (!v_110a8b.has(v_e2a85c)) {
        v_a448ad.push(v_e2a85c);
        v_110a8b.add(v_e2a85c);
      }
    }
    v_b187d9({ interests: v_a448ad });
    v_e887ea('');
    v_160b34(false);
  };

  const v_78c56b = (v_2869c1) => {
    v_b187d9({ interests: v_774c91.filter((v_ebec57) => v_ebec57 !== v_2869c1) });
  };

  return (
    <View style={v_d81136.wrap}>
      <TextField
        placeholder={v_8d41d7("create.basicInfo.namePlaceholder")}
        value={v_f04727.name ?? ''}
        onChangeText={v_81e2ef => v_b187d9({ name: v_81e2ef })}
      />
      {}
      <CloneUsernameField
        value={v_f04727.username ?? ''}
        onChange={v_81e2ef => v_b187d9({ username: v_81e2ef })}
      />
      <TextField
        placeholder={v_8d41d7("create.basicInfo.descPlaceholder")}
        value={v_f04727.description ?? ''}
        onChangeText={v_81e2ef => v_b187d9({ description: v_81e2ef })}
      />

      <Text style={v_d81136.label}>{v_8d41d7("create.basicInfo.categoryLabel")}</Text>
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
          <Text style={v_d81136.label}>{v_8d41d7("create.basicInfo.interestsLabel")}</Text>
          <View style={v_d81136.chips}>
            {}
            {v_02812c.map((v_ebec57) => (
              <InterestChip
                key={v_ebec57}
                label={v_ebec57}
                selected={v_774c91.includes(v_ebec57)}
                onPress={() => v_09f2bd(v_ebec57)}
              />
            ))}
            {}
            {v_32b47e.map((v_2869c1) => (
              <TouchableOpacity
                key={v_2869c1}
                style={v_d81136.customTag}
                onPress={() => v_78c56b(v_2869c1)}
              >
                <Text style={v_d81136.customTagText}>{v_2869c1} ✕</Text>
              </TouchableOpacity>
            ))}
            {}
            <TouchableOpacity
              style={v_d81136.etcChip}
              onPress={() => v_160b34((v_81e2ef) => !v_81e2ef)}
            >
              <Text style={v_d81136.etcChipText}>{v_8d41d7("create.basicInfo.addEtc")}</Text>
            </TouchableOpacity>
          </View>

          {v_2b1044 && (
            <View style={v_d81136.customInputRow}>
              <TextInput
                style={v_d81136.customTextInput}
                value={v_0f1d77}
                onChangeText={v_e887ea}
                placeholder={v_8d41d7("create.basicInfo.customPlaceholder")}
                placeholderTextColor={v_1bfbd0.placeholder}
                onSubmitEditing={v_8fa105}
                returnKeyType="done"
                autoFocus
              />
              <TouchableOpacity style={v_d81136.addBtn} onPress={v_8fa105}>
                <Text style={v_d81136.addBtnText}>{v_8d41d7("create.basicInfo.addBtn")}</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      <PersonaSection draft={v_f04727} onChange={v_b187d9} />
    </View>
  );
}

v_b0de9c.validate = (d: v_c2a674): boolean => {

  return Boolean(v_d5dda0.name?.trim() && v_af8c0b(v_d5dda0.username) && (v_d5dda0.interests?.length ?? 0) >= 1);
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
  catActive: v_e3d001.cardTint,
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  customInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  customTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: v_8f28b1.borderRadius,
    height: v_8f28b1.height,
    paddingHorizontal: v_8f28b1.paddingHorizontal,
    paddingVertical: 0,
    fontSize: v_8f28b1.fontSize,
    lineHeight: v_8f28b1.lineHeight,
    textAlignVertical: v_8f28b1.textAlignVertical,
    color: v_1bfbd0.zinc900,
  },
  addBtn: {
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: v_1bfbd0.primary, borderRadius: v_8b0c90.sm,
  },
  addBtnText: { color: v_1bfbd0.white, fontSize: 14, fontWeight: '600' },
  customTag: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: v_8b0c90.full, borderWidth: 1,
    ...v_e3d001.outlineTint,
  },
  customTagText: { fontSize: 13, ...v_e3d001.accentText },
  etcChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: v_8b0c90.full,
    borderWidth: 1, borderColor: v_1bfbd0.zinc300, borderStyle: 'dashed',
    backgroundColor: v_1bfbd0.white,
  },
  etcChipText: { fontSize: 13, color: v_1bfbd0.zinc600 },
});
