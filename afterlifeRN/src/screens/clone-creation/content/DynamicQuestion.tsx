

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import TextField from '../../../components/ui/TextField';
import type { PersonaQuestion } from '../../../types/clone';
import { COLORS, RADIUS } from '../../../components/constants';

interface Props {
  question: PersonaQuestion;
  candidates?: string[]; 
  value?: string;        
  onAnswer: (key: string, value: string) => void;
}

export default function DynamicQuestion({ question, candidates, value, onAnswer }: Props) {
  const { t } = useTranslation();

  const buttons =
    question.type === 'fixed_choice'
      ? question.options ?? []
      : candidates ?? []; 

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{question.label}</Text>

      {}
      {question.type !== 'text' && buttons.length > 0 && (
        <View style={styles.chipRow}>
          {buttons.map((opt) => {
            const active = value === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => onAnswer(question.key, opt)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={active ? styles.chipActiveText : styles.chipText}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {}
      {question.type !== 'fixed_choice' && (
        <TextField
          placeholder={t('create.assistant.btnCustom', { defaultValue: '직접 입력' })}
          value={value ?? ''}
          onChangeText={(v) => onAnswer(question.key, v)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.zinc700 },
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
