import { showAlert } from "../../../stores/dialogStore";
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [pending, setPending] = useState('');
  const [checking, setChecking] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);

  const myEmail = useAuthStore((s) => s.apiUser?.email ?? null);
  useEffect(() => {
    if (draft.visibility !== 'private') onChange({ visibility: 'private' });
  }, []); 

  const invites = draft.coownerInvites ?? [];

  const addInvite = async () => {
    const v = pending.trim();
    if (!v) return;
    if (!EMAIL_RE.test(v)) {
      showAlert(t("common.notice"), t("invite.invalidEmail"));
      return;
    }
    if (myEmail && v.toLowerCase() === myEmail.toLowerCase()) {
      showAlert(t("common.notice"), t("invite.selfNotAllowed"));
      return;
    }
    if (invites.some((e) => e.toLowerCase() === v.toLowerCase())) {
      showAlert(t("common.notice"), t("invite.alreadyAdded"));
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
        showAlert(t("common.notice"), t("invite.memberNotFound"));
        return;
      }
      onChange({ coownerInvites: [...invites, v] });
      setPending('');
    } catch (err) {
      console.warn('[MemlowVisibility] searchUsers failed:', err);
      showAlert(t("common.error"), t("invite.memberNotFound"));
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
          {t("create.visibility.memlowLocked")}
        </Text>
      </View>

      <Text style={styles.label}>{t("create.visibility.coownerInviteLabel")}</Text>
      <Text style={styles.hint}>{t("create.visibility.coownerHint")}</Text>
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
