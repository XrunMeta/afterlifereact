import React, { useEffect, useMemo, useState } from "react";
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
import * as ImagePicker from "expo-image-picker";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import NotificationBell from "../../components/common/NotificationBell";
import { useAuthStore } from "../../stores/authStore";
import { useFollowStore } from "../../stores/followStore";
import { useCloneStore } from "../../stores/cloneStore";
import { seedSource } from "../../api/source";
import { uploadFile } from "../../api/files";
import { patchMe } from "../../api/auth";
import { listMyClones, listMyFollowedClones, type FollowedClone, type MyClone } from "../../api/clones";
import { useFocusEffect } from "@react-navigation/native";
import { getPaymentPinStatus, getXrunBalance } from "../../api/payments";
import PaymentPinPromptModal, {
  shouldShowPaymentPinPrompt,
} from "../../components/my/PaymentPinPromptModal";
import { COLORS, SIZES, RADIUS } from "../../components/constants";
import type { MyStackParamList } from "../../navigation/types";

const DEFAULT_USER_ID = 1;

const recentTransactions: Array<{ labelKey: string; date: string; amount: number }> = [];

type MyNav = NativeStackNavigationProp<MyStackParamList>;

export default function MyScreen() {
  const navigation = useNavigation<MyNav>();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const apiUser = useAuthStore((s) => s.apiUser);
  const accessToken = useAuthStore((s) => s.accessToken);
  const patchApiUser = useAuthStore((s) => s.patchApiUser);
  const logout = useAuthStore((s) => s.logout);
  const follows = useFollowStore((s) => s.follows);
  const isFollowing = useFollowStore((s) => s.isFollowing);
  const toggleFollow = useFollowStore((s) => s.toggleFollow);
  const localClones = useCloneStore((s) => s.localClones);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showPinPrompt, setShowPinPrompt] = useState(false);

  const [xrunBalance, setXrunBalance] = useState<number | null | undefined>(null);
  const [adBalance, setAdBalance] = useState<number | null | undefined>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!accessToken) return;
      const allowed = await shouldShowPaymentPinPrompt();
      if (!allowed || cancelled) return;
      try {
        const status = await getPaymentPinStatus(accessToken);
        console.log("[PIN-STATUS]", status);
        if (cancelled) return;

        if (status.linked && !status.hasPin) {
          setShowPinPrompt(true);
        }
      } catch (err) {
        console.warn("[PIN-STATUS] fetch failed:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!accessToken) return;
      try {
        const res = await getXrunBalance(accessToken);
        console.log("[XRUN-BALANCE]", res);
        if (cancelled) return;
        if (res.linked) {
          setXrunBalance(res.xrun);
          setAdBalance(res.ad);
        } else {
          setXrunBalance(undefined);
          setAdBalance(undefined);
        }
      } catch (err) {
        console.warn("[XRUN-BALANCE] fetch failed:", err);
        if (!cancelled) {
          setXrunBalance(undefined);
          setAdBalance(undefined);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const handleEditAvatar = async () => {
    if (!accessToken) {
      Alert.alert(t("common.notice"), t("my.loginRequired"));
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t("my.permTitle"), t("my.permDesc"));
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];

    setUploadingAvatar(true);
    try {
      const uploaded = await uploadFile(accessToken, asset.uri, {
        purpose: "avatar",
        fileName: asset.fileName ?? "avatar.jpg",
        mimeType: asset.mimeType ?? "image/jpeg",
      });
      await patchMe(accessToken, { avatarUrl: uploaded.url });
      patchApiUser({ avatarUrl: uploaded.url });
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("my.uploadFailed");
      Alert.alert(t("common.error"), msg);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const displayName = apiUser?.name ?? user?.displayName ?? t("my.userFallback");
  const subLabel = apiUser?.email ?? user?.handle ?? "@afterlife";
  const avatarUrl = apiUser ? apiUser.avatarUrl : user?.avatarUrl ?? null;

  const balanceLoading = xrunBalance === null;
  const xrunDisplay = xrunBalance ?? null;
  const adDisplay = adBalance ?? null;

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
      listMyFollowedClones(accessToken, userId)
        .then((r) => {
          if (!cancelled) {
            setApiFollowingCount(r.items.length);
            setApiFollowingList(r.items);
          }
        })
        .catch((err) => console.warn("[MyScreen] followedClones fail:", err));
      listMyClones(accessToken)
        .then((r) => {
          if (!cancelled) {
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

  const settingsItems: Array<{
    icon: keyof typeof Feather.glyphMap;
    labelKey: string;
    descKey: string;
    route: keyof MyStackParamList;
  }> = [

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
      icon: "shield",
      labelKey: "my.menu.privacy",
      descKey: "settings.privacy.title",
      route: "PrivacySettings",
    },
  ];

  return (
    <SafeScrollView backgroundColor={COLORS.white} showBottomBackground={false}>
      <PageHeader
        title="My Page"
        rightAction={<NotificationBell />}
      />

      <View style={s.content}>
        {}
        <View style={s.profileSection}>
          <View style={s.avatarWrap}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={s.avatar} />
            ) : (
              <View style={[s.avatar, s.avatarPlaceholder]}>
                <Feather name="user" size={40} color={COLORS.zinc400} />
              </View>
            )}
            <TouchableOpacity
              style={s.editAvatarBtn}
              onPress={() => navigation.navigate("EditProfile")}
            >
              <Feather name="edit-2" size={14} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <Text style={s.userName}>{displayName}</Text>
          <Text style={s.userHandle}>{subLabel}</Text>

          <View style={s.statsRow}>
            <TouchableOpacity style={s.statItem} onPress={() => setStatsModal("following")}>
              <Text style={s.statValue}>{followingCount}</Text>
              <Text style={s.statLabel}>{t("my.stats.following")}</Text>
            </TouchableOpacity>
            <View style={s.statDivider} />
            <TouchableOpacity style={s.statItem} onPress={() => setStatsModal("myClones")}>
              <Text style={s.statValue}>{myClonesCount}</Text>
              <Text style={s.statLabel}>{t("my.stats.myPersona")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {}
        <View style={s.sectionHeader}>
          <Text style={s.sectionLabel}>{t("my.coin.title")}</Text>
        </View>

        {}
        <View style={s.coinCard}>
          <View style={s.coinCardTop}>
            <View style={s.coinLabelRow}>
              <Feather name="dollar-sign" size={18} color={COLORS.zinc700} />
              <Text style={s.coinLabel}>{t("my.coin.balance")}</Text>
            </View>
            <TouchableOpacity style={s.chargeBtn}>
              <Feather name="plus" size={14} color={COLORS.white} />
              <Text style={s.chargeBtnText}>{t("my.coin.charge")}</Text>
            </TouchableOpacity>
          </View>
          {balanceLoading ? (
            <ActivityIndicator color={COLORS.zinc900} style={{ alignSelf: "flex-start", marginTop: 4 }} />
          ) : xrunDisplay != null ? (
            <>
              <Text style={s.coinAmount}>{xrunDisplay.toLocaleString(undefined, { maximumFractionDigits: 4 })}</Text>
              <Text style={s.coinWon}>
                XRUN
                {adDisplay != null && adDisplay > 0 ? `  ·  AD ${adDisplay.toLocaleString()}` : ""}
              </Text>
            </>
          ) : (
            <>
              <Text style={s.coinAmount}>—</Text>
              <Text style={s.coinWon}>{t("my.coin.notMapped")}</Text>
            </>
          )}
        </View>

        {}
        <View style={s.transactionsCard}>
          <View style={s.transactionsHeader}>
            <Text style={s.transactionsTitle}>{t("my.coin.transactions")}</Text>
          </View>
          {recentTransactions.map((tx, i) => (
            <View
              key={i}
              style={[
                s.txRow,
                i < recentTransactions.length - 1 && s.txRowBorder,
              ]}
            >
              <View style={s.txInfo}>
                <Text style={s.txLabel}>{t(tx.labelKey)}</Text>
                <Text style={s.txDate}>{tx.date}</Text>
              </View>
              <Text style={[s.txAmount, tx.amount > 0 ? s.txGreen : s.txRed]}>
                {tx.amount > 0 ? "+" : ""}
                {tx.amount.toLocaleString()} xrun
              </Text>
            </View>
          ))}
          <TouchableOpacity style={s.viewAllBtn}>
            <Text style={s.viewAllText}>{t("my.coin.viewAll")}</Text>
          </TouchableOpacity>
        </View>

        {}
        <View style={s.sectionHeader}>
          <Text style={s.sectionLabel}>{t("my.coin.settings")}</Text>
        </View>

        <View style={s.settingsCard}>
          {settingsItems.map((item, i) => (
            <TouchableOpacity
              key={item.route}
              style={[
                s.settingsRow,
                i < settingsItems.length - 1 && s.settingsRowBorder,
              ]}
              onPress={() => navigation.navigate(item.route)}
            >
              <View style={s.settingsIcon}>
                <Feather name={item.icon} size={22} color={COLORS.zinc900} />
              </View>
              <View style={s.settingsInfo}>
                <Text style={s.settingsLabel}>{t(item.labelKey)}</Text>
                <Text style={s.settingsDesc}>{t(item.descKey)}</Text>
              </View>
              <Feather name="chevron-right" size={20} color={COLORS.zinc400} />
            </TouchableOpacity>
          ))}
        </View>

        {}
        <TouchableOpacity style={s.logoutBtn} onPress={() => void logout()}>
          <Feather name="log-out" size={16} color={COLORS.zinc600} />
          <Text style={s.logoutText}>{t("my.menu.logout")}</Text>
        </TouchableOpacity>
      </View>

      <PaymentPinPromptModal
        visible={showPinPrompt}
        onClose={() => setShowPinPrompt(false)}
      />

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
                    <Text style={s.statsEmptyText}>아직 팔로우한 페르소나가 없어요</Text>
                  </View>
                ) : (
                  apiFollowingList.map((c) => {
                    const followed = isFollowing(c.id);
                    return (
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
                        <TouchableOpacity
                          onPress={async () => {
                            await toggleFollow(c.id);

                            if (followed) {
                              setApiFollowingList((prev) =>
                                prev ? prev.filter((x) => x.id !== c.id) : prev,
                              );
                              setApiFollowingCount((prev) =>
                                typeof prev === "number" ? Math.max(0, prev - 1) : prev,
                              );
                            } else {
                              setApiFollowingCount((prev) =>
                                typeof prev === "number" ? prev + 1 : prev,
                              );
                            }
                          }}
                          style={[s.followToggleBtn, followed && s.followToggleBtnActive]}
                        >
                          <Text style={[s.followToggleText, followed && s.followToggleTextActive]}>
                            {followed ? "팔로잉" : "팔로우"}
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
                    <Text style={s.statsEmptyText}>아직 만든 페르소나가 없어요</Text>
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
    gap: 24,
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.zinc50,
    borderRadius: 16,
  },
  statItem: { alignItems: "center", minWidth: 64 },
  statValue: { fontSize: 20, fontWeight: "700", color: COLORS.zinc900 },
  statLabel: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },
  statDivider: { width: 1, height: 24, backgroundColor: COLORS.zinc200 },

  sectionHeader: { marginBottom: 10 },
  sectionLabel: { fontSize: 13, fontWeight: "500", color: COLORS.zinc400, paddingHorizontal: 4 },

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
