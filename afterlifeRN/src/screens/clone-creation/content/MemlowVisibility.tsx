import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { CloneCreationDraft } from '../../../types/clone';
import { COLORS, RADIUS } from '../../../components/constants';
import { useAuthStore } from '../../../stores/authStore';
import { searchUsers } from '../../../api/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  draft: CloneCreationDraft;
  onChange: (patch: Partial<CloneCreationDraft>) => void;
}

function Component({ draft, onChange }: Props) {
  const [pending, setPending] = useState('');
  const [checking, setChecking] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);
  const myEmail = useAuthStore((s) => s.apiUser?.email ?? s.user?.email ?? null);
  useEffect(() => {
    if (draft.visibility !== 'private') onChange({ visibility: 'private' });
  }, []); 

  const invites = draft.coownerInvites ?? [];

  const addInvite = async () => {
    const v = pending.trim();
    if (!v) return;
    if (!EMAIL_RE.test(v)) {
      Alert.alert('알림', '올바른 이메일을 입력해주세요.');
      return;
    }
    if (myEmail && v.toLowerCase() === myEmail.toLowerCase()) {
      Alert.alert('알림', '본인은 초대할 수 없어요.');
      return;
    }
    if (invites.some((e) => e.toLowerCase() === v.toLowerCase())) {
      Alert.alert('알림', '이미 추가된 이메일이에요.');
      return;
    }
    if (!accessToken) {

      onChange({ coownerInvites: [...invites, v] });
      setPending('');
      return;
    }
    setChecking(true);
    try {
      const res = await searchUsers(accessToken, v);
      const exact = res.items.find((u) => u.email.toLowerCase() === v.toLowerCase());
      if (!exact) {

        Alert.alert('알림', '해당 이메일을 가진 회원이 없습니다 다시 입력해주세요');
        return;
      }
      onChange({ coownerInvites: [...invites, v] });
      setPending('');
    } catch (err) {

      console.warn('[MemlowVisibility] searchUsers failed:', err);
      Alert.alert('오류', '회원 확인 중 오류가 났어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setChecking(false);
    }
  };
  const removeInvite = (i: number) =>
    onChange({ coownerInvites: invites.filter((_, j) => j !== i) });

  return (
    <View style={styles.wrap}>
      <View style={styles.lockedRow}>
        <Feather name="lock" size={16} color={COLORS.violet600} />
        <Text style={styles.lockedText}>
          고인 클론은 비공개로 고정돼요. 공동관리자만 볼 수 있어요.
        </Text>
      </View>

      <Text style={styles.label}>공동관리자 초대 (이메일)</Text>
      <Text style={styles.hint}>afterlife 가입 회원만 초대 가능해요.</Text>
      <View style={styles.inputRow}>
        <TextInput
          placeholder="email@example.com"
          value={pending} onChangeText={setPending}
          autoCapitalize="none" keyboardType="email-address"
          style={styles.input} onSubmitEditing={addInvite}
          editable={!checking}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addInvite} disabled={checking}>
          {checking ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Feather name="plus" size={18} color={COLORS.white} />
          )}
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
  hint: { fontSize: 12, color: COLORS.zinc500, marginTop: -8 },
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
