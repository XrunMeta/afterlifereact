import v_a3453e from 'bapkr';
import { v_3094a2, v_19b633, v_4623af, v_472849 } from 'rcmrninabrnb';
import { v_772971 } from 'jmpfvteuuztnp';
import v_e775af from '../../../components/ui/TextField';
import {
  v_b95daf,
  v_f17565,
  v_2934e9,
  v_336485,
  type v_c2a674,
  type v_344f4b,
} from '../../../types/clone';
import { v_1bfbd0, v_8f28b1, v_e3d001 } from '../../../components/constants';

interface Props {
  draft: v_c2a674;
  onChange: (patch: Partial<v_c2a674>) => void;
}

const v_16d682 = 4;

export default function v_78abf7({ draft: v_f04727, onChange: v_b187d9 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const v_db0487 = v_f04727.personaTypes ?? [];

  const v_c8bd6a = (id: v_344f4b) => {
    const v_4982f8 = v_db0487.includes(v_389afb);
    if (v_4982f8) {
      v_b187d9({ personaTypes: v_db0487.filter((v_8d41d7) => v_8d41d7 !== v_389afb) });
    } else if (v_db0487.length < v_16d682) {
      v_b187d9({ personaTypes: [...v_db0487, v_389afb] });
    }
  };

  return (
    <View style={v_d81136.wrap}>
      <Text style={v_d81136.label}>{v_8d41d7("create.persona.ageLabel")}</Text>
      <View style={v_d81136.chipRow}>
        {v_b95daf.map((v_2694bd) => {
          const v_f8b770 = v_f04727.personaAge === v_2694bd;
          return (
            <TouchableOpacity
              key={v_2694bd}
              style={[v_d81136.chip, v_f8b770 && v_d81136.chipActive]}
              onPress={() => v_b187d9({ personaAge: v_2694bd })}
            >
              <Text style={v_f8b770 ? v_d81136.chipActiveText : v_d81136.chipText}>{v_2694bd}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={v_d81136.label}>{v_8d41d7("create.persona.genderLabel")}</Text>
      <View style={v_d81136.chipRow}>
        {v_f17565.map((v_206b88) => {
          const v_f8b770 = v_f04727.personaGender === v_206b88;
          return (
            <TouchableOpacity
              key={v_206b88}
              style={[v_d81136.chip, v_f8b770 && v_d81136.chipActive]}
              onPress={() => v_b187d9({ personaGender: v_206b88 })}
            >
              <Text style={v_f8b770 ? v_d81136.chipActiveText : v_d81136.chipText}>{v_206b88}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={v_d81136.label}>{v_8d41d7("create.persona.typeLabel", { max: v_16d682 })}</Text>
      <View style={v_d81136.chipRow}>
        {v_2934e9.map((v_e2a85c) => {
          const v_f8b770 = v_db0487.includes(v_e2a85c.id);
          return (
            <TouchableOpacity
              key={v_e2a85c.id}
              style={[v_d81136.chip, v_f8b770 && v_d81136.chipActive]}
              onPress={() => v_c8bd6a(v_e2a85c.id)}
            >
              <Text style={v_f8b770 ? v_d81136.chipActiveText : v_d81136.chipText}>{v_e2a85c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={v_d81136.label}>{v_8d41d7("create.persona.mbtiLabel")}</Text>
      <View style={v_d81136.chipRow}>
        {v_336485.map((v_35f85c) => {
          const v_f8b770 = v_f04727.personaMbti === v_35f85c;
          return (
            <TouchableOpacity
              key={v_35f85c}
              style={[v_d81136.chip, v_f8b770 && v_d81136.chipActive]}
              onPress={() => v_b187d9({ personaMbti: v_35f85c })}
            >
              <Text style={v_f8b770 ? v_d81136.chipActiveText : v_d81136.chipText}>{v_35f85c}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={v_d81136.label}>{v_8d41d7("create.persona.notesLabel")}</Text>
      <TextField
        placeholder={v_8d41d7("create.persona.notesPlaceholder")}
        value={v_f04727.personaNotes ?? ''}
        onChangeText={(v_81e2ef) => v_b187d9({ personaNotes: v_81e2ef })}
        multiline
        numberOfLines={4}
        maxLength={4000}
      />
    </View>
  );
}

const v_d81136 = v_472849.create({
  wrap: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: v_1bfbd0.zinc700, marginTop: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: v_8f28b1.borderRadius,
    borderWidth: 1.5,
    borderColor: v_1bfbd0.zinc200,
    backgroundColor: v_1bfbd0.white,
  },
  chipActive: v_e3d001.chipOutlineActive,
  chipText: { color: v_1bfbd0.zinc700, fontSize: 13 },
  chipActiveText: { ...v_e3d001.chipOutlineActiveText, fontSize: 13 },
});
