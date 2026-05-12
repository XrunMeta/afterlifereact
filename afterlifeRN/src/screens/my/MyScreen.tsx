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
  Linking,
  Platform,
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
import { getPaymentPinStatus, getXrunBalance, getMyTransactions, type TransactionItem } from "../../api/payments";
import PaymentPinPromptModal, {
  shouldShowPaymentPinPrompt,
} from "../../components/my/PaymentPinPromptModal";
import { COLORS, SIZES, RADIUS } from "../../components/constants";
import type { MyStackParamList } from "../../navigation/types";

const DEFAULT_USER_ID = 1;

function fmtTxDate(iso: string): string {
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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

  const [xrunBalance, setXrunBalance] = useState<number | null | undefined>(undefined);
  const [adBalance, setAdBalance] = useState<number | null | undefined>(undefined);
  const [xrunBalanceLoading, setXrunBalanceLoading] = useState(true);

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
    if (!accessToken) {

      setXrunBalanceLoading(false);
      setXrunBalance(undefined);
      setAdBalance(undefined);
      return;
    }
    setXrunBalanceLoading(true);
    (async () => {
      try {
        const res = await getXrunBalance(accessToken);
        console.log("[XRUN-BALANCE]", res);
        if (cancelled) return;
        if (res.linked) {

          setXrunBalance(res.xrun ?? 0);
          setAdBalance(res.ad ?? 0);
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
      } finally {
        if (!cancelled) setXrunBalanceLoading(false);
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

  const balanceLoading = xrunBalanceLoading;
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
  const [chargeModalVisible, setChargeModalVisible] = useState(false);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  const handleOpenXrunApp = async () => {
    setChargeModalVisible(false);
    const playStoreScheme = "market://details?id=run.xrun.xrunapp";
    const playStoreWeb = "https://play.google.com/store/apps/details?id=run.xrun.xrunapp";
    const appStoreSearch = "https://apps.apple.com/kr/search?term=xrun";
    try {
      if (Platform.OS === "android") {

        const canMarket = await Linking.canOpenURL(playStoreScheme);
        await Linking.openURL(canMarket ? playStoreScheme : playStoreWeb);
      } else {
        await Linking.openURL(appStoreSearch);
      }
    } catch (err) {
      console.warn("[MyScreen] open xrun app failed:", err);
      Alert.alert("오류", "스토어를 열 수 없어요. 직접 xrun 을 검색해 주세요.");
    }
  };

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

      getMyTransactions(accessToken, { limit: 20 })
        .then((r) => {
          if (!cancelled) {
            console.log(`[MyScreen] transactions ← ${r.items.length} items`);
            setTransactions(r.items);
          }
        })
        .catch((err) => console.warn("[MyScreen] transactions fail:", err));
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
            <TouchableOpacity
              style={s.statItem}
              onPress={() => {
                console.log(
                  `[MyScreen] stat TAP "팔로우 중" — apiFollowingCount=${apiFollowingCount} apiFollowingList=${apiFollowingList?.length ?? "null"}`,
                );
                setStatsModal("following");
              }}
            >
              <Text style={s.statValue}>{followingCount}</Text>
              <Text style={s.statLabel}>{t("my.stats.following")}</Text>
            </TouchableOpacity>
            <View style={s.statDivider} />
            <TouchableOpacity
              style={s.statItem}
              onPress={() => {
                console.log(
                  `[MyScreen] stat TAP "내 페르소나" — apiMyClonesCount=${apiMyClonesCount} apiMyClonesList=${apiMyClonesList?.length ?? "null"}`,
                );
                setStatsModal("myClones");
              }}
            >
              <Text style={s.statValue}>{myClonesCount}</Text>
              <Text style={s.statLabel}>{t("my.stats.myPersona")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {}
        <View style={s.sectionHeader}>
          <Text style={s.sectionLabel}>{t("my.coin.title")}</Text>
        </View>

        {
}
        <View style={s.coinRow}>
          <Image
            source={require("../../../assets/images/xrun-round-logo.png")}
            style={s.coinIcon}
          />
          <View style={s.coinTextWrap}>
            <Text style={s.coinSymbol}>XRUN</Text>
            <Text style={s.coinNetwork}>Polygon</Text>
          </View>
          <View style={s.coinAmountWrap}>
            {balanceLoading ? (
              <ActivityIndicator color={COLORS.zinc900} />
            ) : xrunDisplay != null ? (
              <Text style={s.coinAmountText}>
                {xrunDisplay.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                <Text style={s.coinUnit}> XRUN</Text>
              </Text>
            ) : (
              <Text style={s.coinAmountText}>
                —<Text style={s.coinUnit}> XRUN</Text>
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={s.coinChargeBtn}
            onPress={() => setChargeModalVisible(true)}
            hitSlop={8}
          >
            <Feather name="plus-circle" size={24} color={COLORS.violet600} />
          </TouchableOpacity>
        </View>
        {adDisplay != null && adDisplay > 0 && (
          <Text style={s.adNote}>AD {adDisplay.toLocaleString()}</Text>
        )}

        {}
        <View style={s.transactionsCard}>
          <View style={s.transactionsHeader}>
            <Text style={s.transactionsTitle}>{t("my.coin.transactions")}</Text>
          </View>
          {transactions.length === 0 ? (
            <View style={[s.txRow, { justifyContent: "center" }]}>
              <Text style={[s.txDate, { textAlign: "center" }]}>
                아직 거래 내역이 없어요
              </Text>
            </View>
          ) : (
            transactions.map((tx, i) => {
              const label =
                tx.type === "gift_sent"
                  ? `${tx.cloneName ?? "페르소나"}에게 ${tx.giftName} 선물`
                  : `${tx.cloneName ?? "페르소나"}로부터 ${tx.giftName} 선물 수익`;
              return (
                <View
                  key={tx.id}
                  style={[s.txRow, i < transactions.length - 1 && s.txRowBorder]}
                >
                  <View style={s.txInfo}>
                    <Text style={s.txLabel}>{label}</Text>
                    <Text style={s.txDate}>{fmtTxDate(tx.createdAt)}</Text>
                  </View>
                  <Text style={[s.txAmount, tx.amount > 0 ? s.txGreen : s.txRed]}>
                    {tx.amount > 0 ? "+" : ""}
                    {tx.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })} xrun
                  </Text>
                </View>
              );
            })
          )}
          <TouchableOpacity
            style={s.viewAllBtn}
            onPress={() => navigation.navigate("Transactions")}
          >
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
      <Modal visible={chargeModalVisible} transparent animationType="fade">
        <Pressable style={s.chargeOverlay} onPress={() => setChargeModalVisible(false)}>
          <Pressable style={s.chargeBox} onPress={(e) => e.stopPropagation()}>
            <View style={s.chargeIconWrap}>
              <Feather name="zap" size={28} color={COLORS.violet600} />
            </View>
            <Text style={s.chargeTitle}>포인트 충전 안내</Text>
            <Text style={s.chargeDesc}>
              금액을 충전하고 싶다면{"\n"}xrun 앱에서 포인트를 얻어보세요
            </Text>
            <Text style={s.chargeHint}>※ 같은 아이디로 로그인 하셔야 합니다</Text>
            <View style={s.chargeBtns}>
              <TouchableOpacity
                style={s.chargeCancelBtn}
                onPress={() => setChargeModalVisible(false)}
              >
                <Text style={s.chargeCancelText}>닫기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.chargeGoBtn} onPress={handleOpenXrunApp}>
                <Feather name="external-link" size={14} color={COLORS.white} />
                <Text style={s.chargeGoText}>바로가기</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
