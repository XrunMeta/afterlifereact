import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { CloneCreationDraft } from '../../../types/clone';
import { COLORS, RADIUS } from '../../../components/constants';

type V = 'public' | 'followers' | 'private';

interface Props {
  draft: CloneCreationDraft;
  onChange: (patch: Partial<CloneCreationDraft>) => void;
}

function Component({ draft, onChange }: Props) {
  const { t } = useTranslation();
  const OPTIONS: { value: V; icon: string; title: string; desc: string }[] = [
    { value: 'public', icon: 'globe', title: t('create.visibility.publicTitle'), desc: t('create.visibility.publicDesc') },
    { value: 'private', icon: 'lock', title: t('create.visibility.privateTitle'), desc: t('create.visibility.privateDesc') },
  ];
  const current: V = (draft.visibility as V) ?? 'public';
  return (
    <View style={styles.wrap}>
      {OPTIONS.map(opt => {
        const active = current === opt.value;
        return (
          <TouchableOpacity key={opt.value}
            style={[styles.row, active && styles.rowActive]}
            onPress={() => onChange({ visibility: opt.value })}>
            <Feather name={opt.icon as any} size={18}
              color={active ? COLORS.violet600 : COLORS.zinc500} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{opt.title}</Text>
              <Text style={styles.desc}>{opt.desc}</Text>
            </View>
            <View style={[styles.radio, active && styles.radioActive]}>
              {active && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

Component.validate = (_d: CloneCreationDraft): boolean => true;

const DefaultVisibility = Component as typeof Component & {
  validate: (d: CloneCreationDraft) => boolean;
};
export default DefaultVisibility;

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.zinc200 },
  rowActive: { borderColor: COLORS.violet600, backgroundColor: COLORS.violet100 },
  title: { fontSize: 14, fontWeight: '600', color: COLORS.zinc800 },
  desc: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },
  radio: { width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: COLORS.zinc300 },
  radioActive: { borderColor: COLORS.violet600 },
  radioDot: { flex: 1, margin: 3, borderRadius: 4, backgroundColor: COLORS.violet600 },
});
