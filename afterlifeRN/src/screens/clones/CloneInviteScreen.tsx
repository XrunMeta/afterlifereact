

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import type { RouteProp } from "@react-navigation/native";
import type { ClonesStackParamList } from "../../navigation/types";
import SafeView from "../../components/ui/SafeView";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, RADIUS, SIZES } from "../../components/constants";
import { useAuthStore } from "../../stores/authStore";
import { useCloneStore } from "../../stores/cloneStore";
import {
  cancelInvite,
  createInvite,
  deleteShare,
  listPendingInvites,
  listShares,
  type PendingInvite,
  type ShareMember,
} from "../../api/clones";
import { AuthApiError, searchUsers } from "../../api/auth";

type Route = RouteProp<ClonesStackParamList, "CloneInvite">;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CloneInviteScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { params } = useRoute<Route>();
  const cloneId = params.cloneId;
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentUserId = useAuthStore((s) => s.apiUser?.id ?? s.user?.id ?? null);
  const myEmail = useAuthStore((s) => s.apiUser?.email ?? s.user?.email ?? null);
  const clone = useCloneStore((s) => s.getCloneById(cloneId));

  const isOwner =
    clone?.ownerId != null && currentUserId != null && clone.ownerId === currentUserId;

  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [members, setMembers] = useState<ShareMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reload = useCallback(async () => {
    if (!accessToken) return;
    setLoading((l) => (members.length === 0 ? true : l));
    try {

      const sharesRes = await listShares(accessToken, cloneId);
      setMembers(sharesRes.items);
      if (isOwner) {
        try {
          const inv = await listPendingInvites(accessToken, cloneId);
          setPending(inv.items);
        } catch {
          setPending([]);
        }
      } else {
        setPending([]);
      }
    } catch (err) {
      console.warn("[CloneInvite] reload failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, cloneId, isOwner, members.length]);

  useEffect(() => {
    reload();

  }, [accessToken, cloneId]);

  const handleAddInvite = async () => {
    const email = newEmail.trim();
    if (!EMAIL_RE.test(email)) {
      Alert.alert(t("common.notice"), t("invite.invalidEmail"));
      return;
    }
    if (myEmail && email.toLowerCase() === myEmail.toLowerCase()) {
      Alert.alert(t("common.notice"), t("invite.selfNotAllowed"));
      return;
    }
    if (!accessToken) return;
    setSubmitting(true);
    try {
      const search = await searchUsers(accessToken, email);
      const target = email.toLowerCase();
      const exact = search.items.find((u) => u.email.toLowerCase() === target);
      if (!exact) {
        Alert.alert(t("common.notice"), t("invite.memberNotFound"));
        setSubmitting(false);
        return;
      }

      const res = await createInvite(accessToken, cloneId, { invite_email: email });
      console.log("[CloneInvite] sent:", res);
      setNewEmail("");
      await reload();
      Alert.alert(t("common.success"), t("invite.sentToast", { target: email }));
      void res;
    } catch (err) {
      let msg = t("invite.sendFailed");
      if (err instanceof AuthApiError) {
        if (err.code === "QUOTA_EXCEEDED") msg = t("invite.quotaExceeded");
        else if (err.code === "ALREADY_INVITED") msg = t("invite.alreadyInvited");
        else if (err.code === "ALREADY_MEMBER") msg = t("invite.alreadyMember");
        else msg = err.message;
      }
      Alert.alert(t("common.error"), msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (inv: PendingInvite) => {
    if (!accessToken) return;
    Alert.alert(
      t("invite.cancelInviteTitle"),
      t("invite.cancelInviteDesc", { target: inv.inviteEmail ?? t("invite.create") }),
      [
        { text: t("common.close"), style: "cancel" },
        {
          text: t("common.cancel"),
          style: "destructive",
          onPress: async () => {
            try {
              await cancelInvite(accessToken, cloneId, inv.id);
              await reload();
            } catch (err) {
              const msg = err instanceof AuthApiError ? err.message : t("invite.cancelFailed");
              Alert.alert(t("common.error"), msg);
            }
          },
        },
      ],
    );
  };

  const handleKickOrLeave = async (m: ShareMember) => {
    if (!accessToken) return;
    const isSelf = m.targetUserId === currentUserId;
    const actionLabel = isSelf ? t("invite.leave") : t("invite.kick");
    const targetText = isSelf
      ? t("invite.leaveTitle")
      : t("invite.kickTitle", { name: m.targetUser?.name ?? m.inviteEmail ?? "—" });
    Alert.alert(actionLabel, targetText, [
      { text: t("common.close"), style: "cancel" },
      {
        text: actionLabel,
        style: "destructive",
        onPress: async () => {
          try {
            const res = await deleteShare(accessToken, cloneId, m.id);
            console.log("[CloneInvite] delete share:", res);
            if (res.action === "leave") {
              navigation.goBack();
            } else {
              await reload();
            }
          } catch (err) {
            const msg =
              err instanceof AuthApiError
                ? err.message
                : t("invite.actionFailed", { action: actionLabel });
            Alert.alert(t("common.error"), msg);
          }
        },
      },
    ]);
  };

  return (
    <SafeView backgroundColor={COLORS.zinc50}>
      <PageHeader
        title={t("invite.title")}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              reload();
            }}
          />
        }
      >
        {loading ? (
          <ActivityIndicator color={COLORS.zinc500} style={{ marginTop: 32 }} />
        ) : (
          <>
            {}
            {isOwner && (
              <View style={s.card}>
                <Text style={s.sectionTitle}>{t("invite.create")}</Text>
                <Text style={s.sectionDesc}>{t("invite.createHint")}</Text>
                <View style={s.inviteRow}>
                  <TextInput
                    style={s.emailInput}
                    placeholder={t("invite.emailPlaceholder")}
                    placeholderTextColor={COLORS.zinc400}
                    value={newEmail}
                    onChangeText={setNewEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  <TouchableOpacity
                    style={[s.sendBtn, (!newEmail || submitting) && s.sendBtnDisabled]}
                    onPress={handleAddInvite}
                    disabled={!newEmail || submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Text style={s.sendBtnText}>{t("invite.send")}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {}
            {isOwner && pending.length > 0 && (
              <View style={s.card}>
                <Text style={s.sectionTitle}>{t("invite.pending", { n: pending.length })}</Text>
                {pending.map((inv) => (
                  <View key={inv.id} style={s.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.rowEmail}>{inv.inviteEmail ?? t("invite.noEmail")}</Text>
                      <Text style={s.rowSub}>
                        {formatExpiresHint(inv.expiresAt, t)}
                      </Text>
                    </View>
                    <TouchableOpacity style={s.cancelBtn} onPress={() => handleCancel(inv)}>
                      <Text style={s.cancelBtnText}>{t("common.cancel")}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {}
            <View style={s.card}>
              <Text style={s.sectionTitle}>{t("invite.members", { n: members.length })}</Text>
              {members.length === 0 ? (
                <Text style={s.empty}>{t("invite.noMembers")}</Text>
              ) : (
                members.map((m) => {
                  const isSelf = m.targetUserId === currentUserId;
                  const isOwnerRow = m.role === "owner";
                  return (
                    <View key={m.id} style={s.row}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.rowEmail}>
                          {m.targetUser?.name ?? m.targetUser?.email ?? m.inviteEmail ?? "—"}
                          {isSelf && <Text style={s.selfBadge}> {t("invite.self")}</Text>}
                          {isOwnerRow && <Text style={s.ownerBadge}> {t("invite.ownerBadge")}</Text>}
                        </Text>
                        <Text style={s.rowSub}>
                          {m.targetUser?.email ?? m.inviteEmail ?? ""}
                        </Text>
                      </View>
                      {}
                      {!(isSelf && isOwnerRow) && (isOwner || isSelf) && (
                        <TouchableOpacity
                          style={isSelf ? s.leaveBtn : s.kickBtn}
                          onPress={() => handleKickOrLeave(m)}
                        >
                          <Text style={isSelf ? s.leaveBtnText : s.kickBtnText}>
                            {isSelf ? t("invite.leave") : t("invite.kick")}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeView>
  );
}

function formatExpiresHint(
  expiresAt: string,
  t: (k: string, opts?: Record<string, unknown>) => string,
): string {
  try {
    const exp = new Date(expiresAt.replace(" ", "T") + "Z").getTime();
    const ms = exp - Date.now();
    if (ms <= 0) return t("invite.expired");
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (days > 0) return t("invite.expiresInDays", { days, hours });
    return t("invite.expiresInHours", { hours });
  } catch {
    return t("invite.noExpiresInfo");
  }
}

const s = StyleSheet.create({
  content: { padding: SIZES.large, gap: SIZES.medium },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    padding: SIZES.large,
    gap: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.zinc900 },
  sectionDesc: { fontSize: 12, color: COLORS.zinc500, marginTop: -4 },
  inviteRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  emailInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.zinc900,
    backgroundColor: COLORS.zinc50,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sendBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.zinc900,
    alignItems: "center",
  },
  sendBtnDisabled: { backgroundColor: COLORS.zinc300 },
  sendBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.white },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  rowEmail: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900 },
  rowSub: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },
  selfBadge: { fontSize: 12, color: COLORS.violet500, fontWeight: "500" },
  ownerBadge: {
    fontSize: 11,
    color: COLORS.success,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: "hidden",
  },

  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.zinc300,
  },
  cancelBtnText: { fontSize: 12, color: COLORS.zinc700, fontWeight: "600" },
  kickBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.error,
  },
  kickBtnText: { fontSize: 12, color: COLORS.white, fontWeight: "700" },
  leaveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  leaveBtnText: { fontSize: 12, color: COLORS.error, fontWeight: "600" },

  empty: { fontSize: 13, color: COLORS.zinc500, textAlign: "center", paddingVertical: 12 },
});
