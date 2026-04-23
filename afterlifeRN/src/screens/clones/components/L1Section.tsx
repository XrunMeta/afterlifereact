import v_a3453e, { v_5ab095 } from 'bapkr';
import { v_3094a2, v_19b633, v_79c4f2, v_472849 } from 'rcmrninabrnb';
import type { v_eceede } from '../../../types/domain';

const v_0d620a = ['tone', 'hobby', 'style', 'catchphrase'] as const;

interface Props {
  value: v_eceede;
  editable: boolean;
  onChange: (next: v_eceede) => void;
}

export function v_f48a74({ value: v_4c0183, editable: v_87d063, onChange: v_b187d9 }: Props) {
  const [v_3b402b, v_0ae0e8] = v_5ab095<v_eceede>(v_4c0183);

  function v_28fca9(next: v_eceede) {
    v_0ae0e8(v_a448ad);
    v_b187d9(v_a448ad);
  }

  return (
    <View style={v_d81136.root}>
      <Text style={v_d81136.title}>기본 성격 (L1)</Text>
      {v_0d620a.map((v_0eb677) => (
        <View key={v_0eb677} style={v_d81136.field}>
          <Text style={v_d81136.label}>{v_0eb677}</Text>
          <TextInput
            accessibilityLabel={`l1-attr-${v_0eb677}`}
            value={v_3b402b.attrs[v_0eb677] ?? ''}
            editable={v_87d063}
            onChangeText={(v_8d41d7) => v_28fca9({ ...v_3b402b, attrs: { ...v_3b402b.attrs, [v_0eb677]: v_8d41d7 } })}
            style={[v_d81136.input, !v_87d063 && v_d81136.readonly]}
          />
        </View>
      ))}
      <Text style={v_d81136.label}>자유 메모</Text>
      <TextInput
        accessibilityLabel="l1-notes"
        value={v_3b402b.notes}
        editable={v_87d063}
        multiline
        onChangeText={(v_8d41d7) => v_28fca9({ ...v_3b402b, notes: v_8d41d7 })}
        style={[v_d81136.input, v_d81136.notes, !v_87d063 && v_d81136.readonly]}
      />
    </View>
  );
}

const v_d81136 = v_472849.create({
  root: { paddingVertical: 12, gap: 8 },
  title: { fontSize: 15, fontWeight: '700' },
  field: { marginVertical: 4 },
  label: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 6, padding: 8 },
  notes: { minHeight: 72, textAlignVertical: 'top' },
  readonly: { backgroundColor: '#f9fafb' },
});
