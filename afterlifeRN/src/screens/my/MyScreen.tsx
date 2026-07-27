import { showAlert } from "../../stores/dialogStore";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation, CommonActions } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import NotificationBell from "../../components/common/NotificationBell";
import { useAuthStore } from "../../stores/authStore";
import { useFollowStore } from "../../stores/followStore";
import { useCloneStore } from "../../stores/cloneStore";
import { seedSource } from "../../api/source";
import { deleteMe, AuthApiError } from "../../api/auth";
import { listMyClones, listMyFollowedClones, type FollowedClone, type MyClone } from "../../api/clones";
import { useFocusEffect } from "@react-navigation/native";

import AppVersionFooter from "../../components/my/AppVersionFooter";
import { COLORS, SIZES, RADIUS } from "../../components/constants";
import type { MyStackParamList } from "../../navigation/types";

const DEFAULT_USER_ID = 1;

type MyNav = NativeStackNavigationProp<MyStackParamList>;

export default function MyScreen() {
  const navigation = useNavigation<MyNav>();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const apiUser = useAuthStore((s) => s.apiUser);
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const follows = useFollowStore((s) => s.follows);
  const isFollowing = useFollowStore((s) => s.isFollowing);
  const toggleFollow = useFollowStore((s) => s.toggleFollow);
  const localClones = useCloneStore((s) => s.localClones);

  const uid = apiUser?.id ?? user?.id ?? DEFAULT_USER_ID;
  const [apiFollowingCount, setApiFollowingCount] = useState<number | null>(null);
  const [apiMyClonesCount, setApiMyClonesCount] = useState<number | null>(null);

  const goToClone = (cloneId: number) => {
    setStatsModal(null);
    navigation.getParent()?.dispatch(
      CommonActions.navigate({
        name: "ClonesTab",
        params: { screen: "CloneDetail", params: { cloneId } },
      }),
    );
  };
  const [apiFollowingList, setApiFollowingList] = useState<FollowedClone[] | null>(null);
  const [apiMyClonesList, setApiMyClonesList] = useState<MyClone[] | null>(null);
  const [statsModal, setStatsModal] = useState<"following" | "myClones" | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      if (!accessToken || !apiUser?.id) {
        setApiFollowingCount(null);
        setApiMyClonesCount(null);
        return;
      }
      const userId = apiUser.id;
      console.log(`[MyScreen] fetch start userId=${userId}`);
      listMyFollowedClones(accessToken, userId)
        .then((r) => {
          if (!cancelled) {
            console.log(
              `[MyScreen] followedClones ← ${r.items.length} items`,
              r.items.map((it) => ({ id: it.id, name: it.name })),
            );
            setApiFollowingCount(r.items.length);
            setApiFollowingList(r.items);
          }
        })
        .catch((err) => console.warn("[MyScreen] followedClones fail:", err));
      listMyClones(accessToken)
        .then((r) => {
          if (!cancelled) {
            console.log(
              `[MyScreen] myClones ← ${r.items.length} items`,
              r.items.map((it) => ({ id: it.id, name: it.name })),
            );
            setApiMyClonesCount(r.items.length);
            setApiMyClonesList(r.items);
          }
        })
        .catch((err) => console.warn("[MyScreen] myClones fail:", err));

      return () => {
        cancelled = true;
      };
    }, [accessToken, apiUser?.id]),
  );

  const followingCount =
    apiFollowingCount ??
    follows.filter((f) => f.followerUserId === uid).length;
  const myClonesCount =
    apiMyClonesCount ??
    seedSource.clones().filter((c) => c.ownerId === uid).length +
      localClones.filter((c) => c.ownerId === uid).length;

  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = () => {

    const displayName =
      apiUser?.name || apiUser?.email?.split("@")[0] || "회원";
    showAlert(
      "벌써 떠나시나요?",
      `${displayName} 님과 함께한 소중한 시간들을 기억할게요.\n계정과 클론은 영구적으로 사라져요.`,
      [

        { text: "조금 더 써볼래요", style: "cancel" },
        {
          text: "탈퇴하기",
          style: "destructive",
          onPress: async () => {
            if (!accessToken) return;
            setDeleting(true);
            try {
              await deleteMe(accessToken);
              await logout();
            } catch (err) {
              const msg = err instanceof AuthApiError ? err.message : "탈퇴에 실패했어요.";
              showAlert("오류", msg);
              setDeleting(false);
            }
          },
        },
      ],

      { subMessage: "xrun 가입자라면 xrun 계정은 유지됩니다" },
    );
  };

  type SettingsItem = {
    icon: keyof typeof Feather.glyphMap;
    labelKey: string;
    descKey: string;
    danger?: boolean;
  } & ({ route: keyof MyStackParamList } | { action: () => void });

  const settingsItems: SettingsItem[] = [
    {
      icon: "user",
      labelKey: "my.menu.editProfile",
      descKey: "settings.editProfile.title",
      route: "EditProfile",
    },
    {
      icon: "bell",
      labelKey: "my.menu.notifications",
      descKey: "settings.notifications.title",
      route: "NotificationSettings",
    },
    {
      icon: "globe",
      labelKey: "my.menu.language",
      descKey: "settings.language.title",
      route: "LanguageSettings",
    },
    {
      icon: "slash",
      labelKey: "my.menu.privacy",
      descKey: "settings.privacy.title",
      route: "PrivacySettings",
    },
    {
      icon: "check-square",
      labelKey: "my.menu.agreements",
      descKey: "settings.agreements.title",
      route: "Agreements",
    },
    {
      icon: "flag",
      labelKey: "my.menu.reports",
      descKey: "my.menu.reportsDesc",
      route: "Reports",
    },
    {
      icon: "file-text",
      labelKey: "my.coin.transactions",
      descKey: "my.coin.viewAll",
      route: "Transactions",
    },

    {
      icon: "trash-2",
      labelKey: "settings.privacy.deleteAccount",
      descKey: "settings.privacy.deleteAccount",
      action: handleDeleteAccount,
    },
    {
      icon: "log-out",
      labelKey: "my.menu.logout",
      descKey: "my.menu.logout",
      action: () => void logout(),
    },
  ];

  return (
    <SafeScrollView backgroundColor={COLORS.white} showBottomBackground={false}>
      <PageHeader
        title="설정"
        showBackButton
        onBackPress={() => {

          navigation.getParent()?.dispatch(
            CommonActions.navigate({
              name: "ClonesTab",
              params: { screen: "Dashboard" },
            }),
          );
        }}
      />

      <View style={s.content}>
        {
}

        {}

        {
}

        {
}
        <View style={s.settingsCard}>
          {settingsItems.map((item, i) => {
            const isAction = "action" in item;
            const isDeleteRow = item.labelKey === "settings.privacy.deleteAccount";
            const disabled = isDeleteRow && deleting;
            const iconColor = item.danger ? COLORS.error : COLORS.zinc900;
            return (
              <TouchableOpacity
                key={item.labelKey}
                style={[
                  s.settingsRow,
                  i < settingsItems.length - 1 && s.settingsRowBorder,
                ]}
                disabled={disabled}
                onPress={() => {
                  if (isAction) item.action();
                  else navigation.navigate(item.route);
                }}
              >
                <View style={s.settingsIcon}>
                  <Feather name={item.icon} size={22} color={iconColor} />
                </View>
                <View style={s.settingsInfo}>
                  <Text style={[s.settingsLabel, item.danger && { color: COLORS.error }]}>
                    {t(item.labelKey)}
                  </Text>
                  <Text style={s.settingsDesc}>{t(item.descKey)}</Text>
                </View>
                {disabled ? (
                  <ActivityIndicator color={COLORS.zinc500} />
                ) : (
                  <Feather name="chevron-right" size={20} color={COLORS.zinc400} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {}
        <AppVersionFooter />
      </View>

      {}

      {}
      <Modal visible={statsModal !== null} transparent animationType="slide">
        <Pressable style={s.statsOverlay} onPress={() => setStatsModal(null)}>
          <Pressable style={s.statsSheet} onPress={(e) => e.stopPropagation()}>
            <View style={s.sheetHandle} />
            <Text style={s.statsTitle}>
              {statsModal === "following" ? t("my.stats.following") : t("my.stats.myPersona")}
            </Text>
            <ScrollView style={{ maxHeight: 480 }}>
              {statsModal === "following" && (
                !apiFollowingList || apiFollowingList.length === 0 ? (
                  <View style={s.statsEmpty}>
                    <Feather name="users" size={28} color={COLORS.zinc300} />
                    <Text style={s.statsEmptyText}>아직 구독한 클론이 없어요</Text>
                  </View>
                ) : (
                  apiFollowingList.map((c) => {
                    const followed = isFollowing(c.id);
                    console.log(
                      `[MyScreen] following row render — cloneId=${c.id} name=${c.name} isFollowing=${followed}`,
                    );
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={s.listRow}
                        activeOpacity={0.6}
                        onPress={() => {
                          console.log(
                            `[MyScreen] following row TAP — goToClone cloneId=${c.id} name=${c.name}`,
                          );
                          goToClone(c.id);
                        }}
                      >
                        {c.avatarUrl ? (
                          <Image source={{ uri: c.avatarUrl }} style={s.listAvatar} />
                        ) : (
                          <View style={[s.listAvatar, { backgroundColor: COLORS.zinc200 }]} />
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={s.listName}>{c.name}</Text>
                          <Text style={s.listSub}>@{c.username}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={async () => {
                            console.log(
                              `[MyScreen] follow toggle TAP cloneId=${c.id} wasFollowing=${followed}`,
                            );
                            await toggleFollow(c.id);

                            if (followed) {
                              console.log(
                                `[MyScreen] post-unfollow → list filter + count -1 cloneId=${c.id}`,
                              );
                              setApiFollowingList((prev) =>
                                prev ? prev.filter((x) => x.id !== c.id) : prev,
                              );
                              setApiFollowingCount((prev) =>
                                typeof prev === "number" ? Math.max(0, prev - 1) : prev,
                              );
                            } else {
                              console.log(
                                `[MyScreen] post-follow → count +1 cloneId=${c.id}`,
                              );
                              setApiFollowingCount((prev) =>
                                typeof prev === "number" ? prev + 1 : prev,
                              );
                            }
                          }}
                          style={[s.followToggleBtn, followed && s.followToggleBtnActive]}
                        >
                          <Text style={[s.followToggleText, followed && s.followToggleTextActive]}>
                            {followed ? "구독 중" : "구독"}
                          </Text>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })
                )
              )}
              {statsModal === "myClones" && (
                !apiMyClonesList || apiMyClonesList.length === 0 ? (
                  <View style={s.statsEmpty}>
                    <Feather name="user" size={28} color={COLORS.zinc300} />
                    <Text style={s.statsEmptyText}>아직 만든 클론이 없어요</Text>
                  </View>
                ) : (
                  apiMyClonesList.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={s.listRow}
                      activeOpacity={0.6}
                      onPress={() => goToClone(c.id)}
                    >
                      {c.avatarUrl ? (
                        <Image source={{ uri: c.avatarUrl }} style={s.listAvatar} />
                      ) : (
                        <View style={[s.listAvatar, { backgroundColor: COLORS.zinc200 }]} />
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={s.listName}>{c.name}</Text>
                        <Text style={s.listSub}>@{c.username}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeScrollView>
  );
}

const s = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 780,
    alignSelf: "center",
    width: "100%",
  },
  headerRight: { flexDirection: "row", gap: 4 },
  headerBtn: { padding: 4 },

  profileSection: { alignItems: "center", marginBottom: 32 },
  avatarWrap: { position: "relative", marginBottom: 16 },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: {
    backgroundColor: COLORS.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  editAvatarBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.zinc900,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  userName: { fontSize: 24, fontWeight: "700", color: COLORS.zinc900, marginBottom: 4 },
  userHandle: { fontSize: 15, color: COLORS.zinc500 },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.zinc50,
    borderRadius: 16,
    alignSelf: "stretch",
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "700", color: COLORS.zinc900 },
  statLabel: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },
  statDivider: { width: 1, height: 24, backgroundColor: COLORS.zinc200 },

  sectionHeader: { marginBottom: 10 },
  sectionLabel: { fontSize: 13, fontWeight: "500", color: COLORS.zinc400, paddingHorizontal: 4 },

  coinRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.zinc100,
  },
  coinIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  coinTextWrap: { flex: 1 },
  coinSymbol: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.zinc900,
  },
  coinNetwork: {
    fontSize: 12,
    color: COLORS.zinc500,
    marginTop: 2,
  },
  coinAmountWrap: {
    alignItems: "flex-end",
    marginRight: 8,
  },
  coinAmountText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.zinc900,
  },
  coinUnit: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.zinc700,
  },
  coinChargeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  adNote: {
    fontSize: 12,
    color: COLORS.zinc500,
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: -4,
  },

  coinCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  coinCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  coinLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  coinLabel: { fontSize: 14, fontWeight: "500", color: COLORS.zinc600 },
  chargeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: COLORS.zinc900,
    borderRadius: RADIUS.full,
  },
  chargeBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.white },

  chargeOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  chargeBox: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 20,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  chargeIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.violet100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  chargeTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.zinc900,
    marginBottom: 10,
  },
  chargeDesc: {
    fontSize: 14,
    color: COLORS.zinc600,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 12,
  },
  chargeHint: {
    fontSize: 11,
    color: COLORS.zinc400,
    textAlign: "center",
    marginBottom: 20,
  },
  chargeBtns: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  chargeCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    alignItems: "center",
    justifyContent: "center",
  },
  chargeCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.zinc600,
  },
  chargeGoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.violet600,
  },
  chargeGoText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },
  coinAmount: { fontSize: 32, fontWeight: "700", color: COLORS.zinc900 },
  coinWon: { fontSize: 12, color: COLORS.zinc500, marginTop: 4 },

  transactionsCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 32,
  },
  transactionsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  transactionsTitle: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900 },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  txRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.zinc100 },
  txInfo: { flex: 1 },
  txLabel: { fontSize: 14, fontWeight: "500", color: COLORS.zinc900, marginBottom: 4 },
  txDate: { fontSize: 12, color: COLORS.zinc500 },
  txAmount: { fontSize: 14, fontWeight: "700" },
  txGreen: { color: COLORS.success },
  txRed: { color: COLORS.error },
  viewAllBtn: {
    paddingVertical: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc100,
  },
  viewAllText: { fontSize: 14, fontWeight: "500", color: COLORS.violet500 },

  settingsCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  settingsRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.zinc100 },
  settingsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.zinc50,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsInfo: { flex: 1 },
  settingsLabel: { fontSize: 15, fontWeight: "600", color: COLORS.zinc900, marginBottom: 2 },
  settingsDesc: { fontSize: 13, color: COLORS.zinc500 },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  logoutText: { fontSize: 14, color: COLORS.zinc600 },

  logoutBigBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    backgroundColor: COLORS.zinc900,
    borderRadius: RADIUS.lg,
    marginTop: 4,
  },
  logoutBigText: { fontSize: 15, fontWeight: "700", color: COLORS.white },

  statsOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  statsSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    height: "70%",
  },
  followToggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.zinc900,
  },
  followToggleBtnActive: {
    backgroundColor: COLORS.zinc100,
    borderWidth: 1,
    borderColor: COLORS.zinc300,
  },
  followToggleText: { fontSize: 12, fontWeight: "700", color: COLORS.white },
  followToggleTextActive: { color: COLORS.zinc700 },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.zinc300,
    alignSelf: "center",
    marginVertical: 12,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.zinc900,
    marginBottom: 12,
  },
  statsEmpty: { alignItems: "center", paddingVertical: 36, gap: 8 },
  statsEmptyText: { color: COLORS.zinc500, fontSize: 13 },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  listAvatar: { width: 40, height: 40, borderRadius: 20 },
  listName: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900 },
  listSub: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },
});
