import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
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

  const customSelected = interests.filter((i) => !activeList.includes(i));
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const toggle = (id: string) => {
    const next = interests.includes(id) ? interests.filter(i => i !== id) : [...interests, id];
    onChange({ interests: next });
  };

  const addCustomInterests = () => {

    const parts = customInput.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return;
    const seen = new Set(interests);
    const next = [...interests];
    for (const p of parts) {
      if (!seen.has(p)) {
        next.push(p);
        seen.add(p);
      }
    }
    onChange({ interests: next });
    setCustomInput('');
    setShowCustomInput(false);
  };

  const removeInterest = (label: string) => {
    onChange({ interests: interests.filter((i) => i !== label) });
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

      {}
      <PersonaSection draft={draft} onChange={onChange} />

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
            {}
            {activeList.map((i) => (
              <InterestChip
                key={i}
                label={i}
                selected={interests.includes(i)}
                onPress={() => toggle(i)}
              />
            ))}
            {}
            {customSelected.map((label) => (
              <TouchableOpacity
                key={label}
                style={styles.customTag}
                onPress={() => removeInterest(label)}
              >
                <Text style={styles.customTagText}>{label} ✕</Text>
              </TouchableOpacity>
            ))}
            {}
            <TouchableOpacity
              style={styles.etcChip}
              onPress={() => setShowCustomInput((v) => !v)}
            >
              <Text style={styles.etcChipText}>+ 기타</Text>
            </TouchableOpacity>
          </View>

          {showCustomInput && (
            <View style={styles.customInputRow}>
              <TextInput
                style={styles.customTextInput}
                value={customInput}
                onChangeText={setCustomInput}
                placeholder="콤마(,) 로 여러 개 가능 — 예: 책, 영화, 여행"
                placeholderTextColor={COLORS.placeholder}
                onSubmitEditing={addCustomInterests}
                returnKeyType="done"
                autoFocus
              />
              <TouchableOpacity style={styles.addBtn} onPress={addCustomInterests}>
                <Text style={styles.addBtnText}>추가</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
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
  customInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  customTextInput: {
    flex: 1, borderWidth: 1, borderColor: COLORS.zinc200, borderRadius: RADIUS.sm,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.zinc900,
  },
  addBtn: {
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: COLORS.violet600, borderRadius: RADIUS.sm,
  },
  addBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
  customTag: {
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.violet100,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.violet600,
  },
  customTagText: { fontSize: 13, color: COLORS.violet600 },
  etcChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.zinc300, borderStyle: 'dashed',
    backgroundColor: COLORS.white,
  },
  etcChipText: { fontSize: 13, color: COLORS.zinc600 },
});
