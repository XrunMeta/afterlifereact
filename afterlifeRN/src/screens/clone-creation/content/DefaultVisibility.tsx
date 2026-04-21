import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { CloneCreationDraft } from '../../../types/clone';
import { COLORS, RADIUS } from '../../../components/constants';

type V = 'public' | 'followers' | 'private';
const OPTIONS: { value: V; icon: string; title: string; desc: string }[] = [
  { value: 'public',    icon: 'globe', title: '전체 공개',   desc: '모든 사용자가 볼 수 있어요' },
  { value: 'followers', icon: 'users', title: '팔로워 공개', desc: '나를 팔로우한 사람만 볼 수 있어요' },
  { value: 'private',   icon: 'lock',  title: '비공개',     desc: '나만 볼 수 있어요' },
];

interface Props {
  draft: CloneCreationDraft;
  onChange: (patch: Partial<CloneCreationDraft>) => void;
}

function Component({ draft, onChange }: Props) {
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
              color={active ? COLORS.violet1000 : COLORS.zinc500} />
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
  rowActive: { borderColor: COLORS.violet1000, backgroundColor: COLORS.violet100 },
  title: { fontSize: 14, fontWeight: '600', color: COLORS.zinc800 },
  desc: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },
  radio: { width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: COLORS.zinc300 },
  radioActive: { borderColor: COLORS.violet1000 },
  radioDot: { flex: 1, margin: 3, borderRadius: 4, backgroundColor: COLORS.violet1000 },
});
