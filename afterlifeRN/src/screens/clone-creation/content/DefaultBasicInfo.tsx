import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import TextField from '../../../components/ui/TextField';
import InterestChip from '../../../components/ui/InterestChip';
import { CATEGORIES, INTEREST_MAP } from '../../../mocks/interestHelpers';
import type { CloneCreationDraft } from '../../../types/clone';
import { COLORS, RADIUS } from '../../../components/constants';
import PersonaSection from './PersonaSection';

interface Props {
  draft: CloneCreationDraft;
  onChange: (patch: Partial<CloneCreationDraft>) => void;
}

function Component({ draft, onChange }: Props) {
  const interests = draft.interests ?? [];
  const activeList = draft.category ? (INTEREST_MAP[draft.category] ?? []) : [];

  const toggle = (id: string) => {
    const next = interests.includes(id) ? interests.filter(i => i !== id) : [...interests, id];
    onChange({ interests: next });
  };

  return (
    <View style={styles.wrap}>
      <TextField
        placeholder="페르소나 이름"
        value={draft.name ?? ''}
        onChangeText={v => onChange({ name: v })}
      />
      <TextField
        placeholder="클론 아이디 (@예: @luna)"
        value={draft.username ?? ''}
        onChangeText={v => onChange({ username: v })}
      />
      <TextField
        placeholder="한 줄 소개"
        value={draft.description ?? ''}
        onChangeText={v => onChange({ description: v })}
      />

      <Text style={styles.label}>카테고리</Text>
      <View style={styles.catRow}>
        {CATEGORIES.map(c => (
          <TouchableOpacity
            key={c.id}
            style={[styles.cat, draft.category === c.id && styles.catActive]}
            onPress={() => onChange({ category: c.id, interests: [] })}
          >
            <Text>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeList.length > 0 && (
        <>
          <Text style={styles.label}>관심사</Text>
          <View style={styles.chips}>
            {activeList.map(i => (
              <InterestChip
                key={i}
                label={i}
                selected={interests.includes(i)}
                onPress={() => toggle(i)}
              />
            ))}
          </View>
        </>
      )}

      <PersonaSection draft={draft} onChange={onChange} />
    </View>
  );
}

Component.validate = (d: CloneCreationDraft): boolean => {
  return Boolean(d.name?.trim() && d.username?.trim() && (d.interests?.length ?? 0) >= 1);
};

const DefaultBasicInfo = Component as typeof Component & {
  validate: (d: CloneCreationDraft) => boolean;
};
export default DefaultBasicInfo;

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.zinc700, marginTop: 12 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cat: { padding: 10, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.zinc200 },
  catActive: { backgroundColor: COLORS.violet100, borderColor: COLORS.violet600 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
