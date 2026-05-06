import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import TextField from '../../../components/ui/TextField';
import {
  PERSONA_AGE_OPTIONS,
  PERSONA_GENDER_OPTIONS,
  PERSONA_TYPE_OPTIONS,
  PERSONA_MBTI_OPTIONS,
  type CloneCreationDraft,
  type PersonaTypeId,
} from '../../../types/clone';
import { COLORS, RADIUS } from '../../../components/constants';

interface Props {
  draft: CloneCreationDraft;
  onChange: (patch: Partial<CloneCreationDraft>) => void;
}

const MAX_TYPES = 4;

export default function PersonaSection({ draft, onChange }: Props) {
  const { t } = useTranslation();
  const types = draft.personaTypes ?? [];

  const toggleType = (id: PersonaTypeId) => {
    const has = types.includes(id);
    if (has) {
      onChange({ personaTypes: types.filter((t) => t !== id) });
    } else if (types.length < MAX_TYPES) {
      onChange({ personaTypes: [...types, id] });
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{t("create.persona.ageLabel")}</Text>
      <View style={styles.chipRow}>
        {PERSONA_AGE_OPTIONS.map((age) => {
          const active = draft.personaAge === age;
          return (
            <TouchableOpacity
              key={age}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onChange({ personaAge: age })}
            >
              <Text style={active ? styles.chipActiveText : styles.chipText}>{age}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>{t("create.persona.genderLabel")}</Text>
      <View style={styles.chipRow}>
        {PERSONA_GENDER_OPTIONS.map((g) => {
          const active = draft.personaGender === g;
          return (
            <TouchableOpacity
              key={g}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onChange({ personaGender: g })}
            >
              <Text style={active ? styles.chipActiveText : styles.chipText}>{g}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>{t("create.persona.typeLabel", { max: MAX_TYPES })}</Text>
      <View style={styles.chipRow}>
        {PERSONA_TYPE_OPTIONS.map((p) => {
          const active = types.includes(p.id);
          return (
            <TouchableOpacity
              key={p.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggleType(p.id)}
            >
              <Text style={active ? styles.chipActiveText : styles.chipText}>{p.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>{t("create.persona.mbtiLabel")}</Text>
      <View style={styles.chipRow}>
        {PERSONA_MBTI_OPTIONS.map((m) => {
          const active = draft.personaMbti === m;
          return (
            <TouchableOpacity
              key={m}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onChange({ personaMbti: m })}
            >
              <Text style={active ? styles.chipActiveText : styles.chipText}>{m}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>{t("create.persona.notesLabel")}</Text>
      <TextField
        placeholder={t("create.persona.notesPlaceholder")}
        value={draft.personaNotes ?? ''}
        onChangeText={(v) => onChange({ personaNotes: v })}
        multiline
        numberOfLines={4}
        maxLength={4000}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.zinc700, marginTop: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
  },
  chipActive: { backgroundColor: COLORS.violet600, borderColor: COLORS.violet600 },
  chipText: { color: COLORS.zinc700, fontSize: 13 },
  chipActiveText: { color: COLORS.white, fontSize: 13 },
});
