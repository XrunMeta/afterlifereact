import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import type { L1Profile } from '../../../types/domain';

const L1_KEYS = ['tone', 'hobby', 'style', 'catchphrase'] as const;

interface Props {
  value: L1Profile;
  editable: boolean;
  onChange: (next: L1Profile) => void;
}

export function L1Section({ value, editable, onChange }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>기본 성격 (L1)</Text>
      {L1_KEYS.map((k) => (
        <View key={k} style={styles.field}>
          <Text style={styles.label}>{k}</Text>
          <TextInput
            accessibilityLabel={`l1-attr-${k}`}
            value={value.attrs[k] ?? ''}
            editable={editable}
            onChangeText={(t) => onChange({ ...value, attrs: { ...value.attrs, [k]: t } })}
            style={[styles.input, !editable && styles.readonly]}
          />
        </View>
      ))}
      <Text style={styles.label}>자유 메모</Text>
      <TextInput
        accessibilityLabel="l1-notes"
        value={value.notes}
        editable={editable}
        multiline
        onChangeText={(t) => onChange({ ...value, notes: t })}
        style={[styles.input, styles.notes, !editable && styles.readonly]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingVertical: 12, gap: 8 },
  title: { fontSize: 15, fontWeight: '700' },
  field: { marginVertical: 4 },
  label: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 6, padding: 8 },
  notes: { minHeight: 72, textAlignVertical: 'top' },
  readonly: { backgroundColor: '#f9fafb' },
});
