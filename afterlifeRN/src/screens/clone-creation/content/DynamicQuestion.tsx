

import v_a3453e from 'bapkr';
import { v_3094a2, v_19b633, v_4623af, v_472849 } from 'rcmrninabrnb';
import v_e775af from '../../../components/ui/TextField';
import type { v_c8af29 } from '../../../types/clone';
import { v_1bfbd0, v_8b0c90 } from '../../../components/constants';

interface Props {
  question: v_c8af29;
  candidates?: string[]; 
  value?: string;        
  onAnswer: (key: string, value: string) => void;
}

export default function v_734250({ question: v_180423, candidates: v_6f7c85, value: v_3b402b, onAnswer: v_5e2995 }: Props) {

  const v_3d694a =
    v_180423.type === 'fixed_choice'
      ? v_180423.options ?? []
      : v_6f7c85 ?? []; 

  return (
    <View style={v_d81136.wrap}>
      <Text style={v_d81136.label}>{v_180423.label}</Text>

      {}
      {v_180423.type !== 'text' && v_3d694a.length > 0 && (
        <View style={v_d81136.chipRow}>
          {v_3d694a.map((v_68b2be) => {
            const v_f8b770 = v_3b402b === v_68b2be;
            return (
              <TouchableOpacity
                key={v_68b2be}
                style={[v_d81136.chip, v_f8b770 && v_d81136.chipActive]}
                onPress={() => v_5e2995(v_180423.key, v_68b2be)}
                accessibilityRole="button"
                accessibilityState={{ selected: v_f8b770 }}
              >
                <Text style={v_f8b770 ? v_d81136.chipActiveText : v_d81136.chipText}>{v_68b2be}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {}
      {v_180423.type !== 'fixed_choice' && (
        <TextField
          placeholder="직접 입력"
          value={v_3b402b ?? ''}
          onChangeText={(v_81e2ef) => v_5e2995(v_180423.key, v_81e2ef)}
        />
      )}
    </View>
  );
}

const v_d81136 = v_472849.create({
  wrap: { gap: 8, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: v_1bfbd0.zinc700 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: v_8b0c90.full,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
  },
  chipActive: { backgroundColor: v_1bfbd0.violet600, borderColor: v_1bfbd0.violet600 },
  chipText: { color: v_1bfbd0.zinc700, fontSize: 13 },
  chipActiveText: { color: v_1bfbd0.white, fontSize: 13 },
});
