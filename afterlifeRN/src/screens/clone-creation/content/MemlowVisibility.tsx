import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { CloneCreationDraft } from '../../../types/clone';
import { COLORS, RADIUS } from '../../../components/constants';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  draft: CloneCreationDraft;
  onChange: (patch: Partial<CloneCreationDraft>) => void;
}

function Component({ draft, onChange }: Props) {
  const [pending, setPending] = useState('');
  useEffect(() => {
    if (draft.visibility !== 'private') onChange({ visibility: 'private' });
  }, []); 

  const invites = draft.coownerInvites ?? [];

  const addInvite = () => {
    const v = pending.trim();
    if (!v) return;
    onChange({ coownerInvites: [...invites, v] });
    setPending('');
  };
  const removeInvite = (i: number) =>
    onChange({ coownerInvites: invites.filter((_, j) => j !== i) });

  return (
    <View style={styles.wrap}>
      <View style={styles.lockedRow}>
        <Feather name="lock" size={16} color={COLORS.violet600} />
        <Text style={styles.lockedText}>
          멤로우 클론은 비공개로 고정돼요. 공동관리자만 볼 수 있어요.
        </Text>
      </View>

      <Text style={styles.label}>공동관리자 초대 (이메일)</Text>
      <View style={styles.inputRow}>
        <TextInput
          placeholder="email@example.com"
          value={pending} onChangeText={setPending}
          autoCapitalize="none" keyboardType="email-address"
          style={styles.input} onSubmitEditing={addInvite}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addInvite}>
          <Feather name="plus" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {invites.map((e, i) => {
        const bad = !EMAIL_RE.test(e);
        return (
          <View key={`${e}-${i}`} style={[styles.inviteRow, bad && styles.inviteRowBad]}>
            <Text style={styles.inviteEmail}>{e}</Text>
            <TouchableOpacity onPress={() => removeInvite(i)}>
              <Feather name="x" size={16} color={COLORS.zinc500} />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

Component.validate = (d: CloneCreationDraft): boolean => {
  const invites = d.coownerInvites ?? [];
  return invites.every(e => EMAIL_RE.test(e));
};

const MemlowVisibility = Component as typeof Component & {
  validate: (d: CloneCreationDraft) => boolean;
};
export default MemlowVisibility;

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.violet100, padding: 12, borderRadius: RADIUS.sm },
  lockedText: { flex: 1, fontSize: 13, color: COLORS.violet700 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.zinc700, marginTop: 12 },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: COLORS.zinc200,
    borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 10 },
  addBtn: { backgroundColor: COLORS.violet600, width: 44,
    alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.sm },
  inviteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 10, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.zinc200 },
  inviteRowBad: { borderColor: COLORS.rose500 },
  inviteEmail: { fontSize: 13, color: COLORS.zinc800 },
});
