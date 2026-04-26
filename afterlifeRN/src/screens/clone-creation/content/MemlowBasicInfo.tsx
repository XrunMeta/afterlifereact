import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import TextField from '../../../components/ui/TextField';
import { MEMLOW_RELATIONS } from '../../../mocks/cloneTypeCatalog';
import type { CloneCreationDraft } from '../../../types/clone';
import { COLORS, RADIUS } from '../../../components/constants';
import PersonaSection from './PersonaSection';

interface Props {
  draft: CloneCreationDraft;
  onChange: (patch: Partial<CloneCreationDraft>) => void;
}

function Component({ draft, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <TextField
        placeholder="이름 (예: 엄마)"
        value={draft.name ?? ''}
        onChangeText={v => onChange({ name: v })}
      />
      <TextField
        placeholder="클론 아이디 (@예: @mom)"
        value={draft.username ?? ''}
        onChangeText={v => onChange({ username: v })}
      />
      <TextField
        placeholder="한 줄 소개 (추억 한 줄)"
        value={draft.description ?? ''}
        onChangeText={v => onChange({ description: v })}
      />

      <Text style={styles.label}>고인과의 관계</Text>
      <View style={styles.chipRow}>
        {MEMLOW_RELATIONS.map(r => {
          const active = draft.relation === r.id;
          return (
            <TouchableOpacity
              key={r.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onChange({ relation: r.id })}
            >
              <Text style={active ? styles.chipActiveText : styles.chipText}>{r.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <PersonaSection draft={draft} onChange={onChange} />
    </View>
  );
}

Component.validate = (d: CloneCreationDraft): boolean =>
  Boolean(d.name?.trim() && d.username?.trim() && d.relation);

const MemlowBasicInfo = Component as typeof Component & {
  validate: (d: CloneCreationDraft) => boolean;
};
export default MemlowBasicInfo;

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.zinc700, marginTop: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
  },
  chipActive: { backgroundColor: COLORS.violet600, borderColor: COLORS.violet600 },
  chipText: { color: COLORS.zinc700 },
  chipActiveText: { color: COLORS.white },
});
