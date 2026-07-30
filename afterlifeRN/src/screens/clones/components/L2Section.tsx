import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

interface Props {
  memoryCount: number;
  lastUpdatedAt: string | null;
}

export function L2Section({ memoryCount, lastUpdatedAt }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{t('edit.l2SectionTitle', { defaultValue: '심화 기억 (L2) — 자동 학습' })}</Text>
      <Text style={styles.body}>{t('edit.l2MemoryCount', { n: memoryCount, defaultValue: '{{n}}개의 기억이 누적되어 있어요.' })}</Text>
      {lastUpdatedAt && (
        <Text accessibilityLabel="l2-last-updated" style={styles.meta}>
          {t('edit.l2LastUpdated', { date: new Date(lastUpdatedAt).toLocaleString(), defaultValue: '마지막 업데이트: {{date}}' })}
        </Text>
      )}
      <Text style={styles.hint}>
        {t('edit.l2Hint', { defaultValue: 'L2 는 직접 편집할 수 없고, 대화·상호작용을 통해 자동으로 재교육됩니다.' })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingVertical: 12, gap: 4 },
  title: { fontSize: 15, fontWeight: '700' },
  body: { color: '#111827' },
  meta: { color: '#6b7280', fontSize: 12 },
  hint: { color: '#6b7280', fontSize: 12, marginTop: 4 },
});
