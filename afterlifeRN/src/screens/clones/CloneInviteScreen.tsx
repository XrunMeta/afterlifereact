

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
import { AuthApiError } from "../../api/auth";

type Route = RouteProp<ClonesStackParamList, "CloneInvite">;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CloneInviteScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Route>();
  const cloneId = params.cloneId;
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentUserId = useAuthStore((s) => s.apiUser?.id ?? s.user?.id ?? null);
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
      Alert.alert("알림", "올바른 이메일을 입력해주세요.");
      return;
    }
    if (!accessToken) return;
    setSubmitting(true);
    try {
      const res = await createInvite(accessToken, cloneId, { invite_email: email });
      console.log("[CloneInvite] sent:", res);
      setNewEmail("");
      await reload();
      const notify = res.notify;
      Alert.alert(
        "초대 발송",
        notify
          ? `${email}로 초대를 보냈어요.\n이메일: ${notify.emailSent ? "✓" : "실패"} / 푸시: ${notify.pushSent}건`
          : `${email}로 초대를 보냈어요.`,
      );
    } catch (err) {
      let msg = "초대 발송에 실패했습니다.";
      if (err instanceof AuthApiError) {
        if (err.code === "QUOTA_EXCEEDED") msg = "초대 가능 한도를 초과했어요.";
        else msg = err.message;
      }
      Alert.alert("오류", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (inv: PendingInvite) => {
    if (!accessToken) return;
    Alert.alert("초대 취소", `"${inv.inviteEmail ?? "초대"}"을(를) 취소하시겠어요?`, [
      { text: "닫기", style: "cancel" },
      {
        text: "취소",
        style: "destructive",
        onPress: async () => {
          try {
            await cancelInvite(accessToken, cloneId, inv.id);
            await reload();
          } catch (err) {
            const msg = err instanceof AuthApiError ? err.message : "취소 실패";
            Alert.alert("오류", msg);
          }
        },
      },
    ]);
  };

  const handleKickOrLeave = async (m: ShareMember) => {
    if (!accessToken) return;
    const isSelf = m.targetUserId === currentUserId;
    const action = isSelf ? "나가기" : "강퇴";
    const target = isSelf
      ? "공동관리자에서 나가시겠어요?"
      : `${m.targetUser?.name ?? m.inviteEmail ?? "이 멤버"}을(를) 강퇴하시겠어요?`;
    Alert.alert(action, target, [
      { text: "닫기", style: "cancel" },
      {
        text: action,
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
            const msg = err instanceof AuthApiError ? err.message : `${action} 실패`;
            Alert.alert("오류", msg);
          }
        },
      },
    ]);
  };

  return (
    <SafeView backgroundColor={COLORS.zinc50}>
      <PageHeader
        title="공동관리자"
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
                <Text style={s.sectionTitle}>공동관리자 초대</Text>
                <Text style={s.sectionDesc}>
                  이메일로 초대할게요. 3일 내 미수락 시 자동 만료돼요.
                </Text>
                <View style={s.inviteRow}>
                  <TextInput
                    style={s.emailInput}
                    placeholder="example@email.com"
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
                      <Text style={s.sendBtnText}>초대</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {}
            {isOwner && pending.length > 0 && (
              <View style={s.card}>
                <Text style={s.sectionTitle}>대기 중 ({pending.length})</Text>
                {pending.map((inv) => (
                  <View key={inv.id} style={s.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.rowEmail}>{inv.inviteEmail ?? "(이메일 없음)"}</Text>
                      <Text style={s.rowSub}>
                        {formatExpiresHint(inv.expiresAt)}
                      </Text>
                    </View>
                    <TouchableOpacity style={s.cancelBtn} onPress={() => handleCancel(inv)}>
                      <Text style={s.cancelBtnText}>취소</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {}
            <View style={s.card}>
              <Text style={s.sectionTitle}>
                멤버 ({members.length})
              </Text>
              {members.length === 0 ? (
                <Text style={s.empty}>아직 공동관리자가 없어요.</Text>
              ) : (
                members.map((m) => {
                  const isSelf = m.targetUserId === currentUserId;
                  const isOwnerRow = m.role === "owner";
                  return (
                    <View key={m.id} style={s.row}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.rowEmail}>
                          {m.targetUser?.name ?? m.targetUser?.email ?? m.inviteEmail ?? "—"}
                          {isSelf && <Text style={s.selfBadge}> (나)</Text>}
                          {isOwnerRow && <Text style={s.ownerBadge}> 반장</Text>}
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
                            {isSelf ? "나가기" : "강퇴"}
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

function formatExpiresHint(expiresAt: string): string {
  try {
    const exp = new Date(expiresAt.replace(" ", "T") + "Z").getTime();
    const ms = exp - Date.now();
    if (ms <= 0) return "만료됨";
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (days > 0) return `${days}일 ${hours}시간 후 만료`;
    return `${hours}시간 후 만료`;
  } catch {
    return "만료 정보 없음";
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
