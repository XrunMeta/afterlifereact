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
import type { TFunction } from "i18next";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import NotificationBell from "../../components/common/NotificationBell";
import { useAuthStore } from "../../stores/authStore";
import { useFollowStore } from "../../stores/followStore";
import { useCloneStore } from "../../stores/cloneStore";
import { seedSource } from "../../api/source";
import { deleteMe, AuthApiError } from "../../api/auth";
import { listMyClones, listMyFollowedClones, type FollowedClone, type MyClone } from "../../api/clones";
import { getCreditBalance, type CreditBalance } from "../../api/credits";
import { useFocusEffect } from "@react-navigation/native";

import AppVersionFooter from "../../components/my/AppVersionFooter";
import { COLORS, SIZES, RADIUS } from "../../components/constants";
import type { MyStackParamList } from "../../navigation/types";

const DEFAULT_USER_ID = 1;

function formatMinutes(sec: number, t: TFunction): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m === 0) return t("common.durationSec", { s: rem, defaultValue: `${rem}초` });
  return rem > 0
    ? t("common.durationMinSec", { m, s: rem, defaultValue: `${m}분 ${rem}초` })
    : t("common.durationMin", { m, defaultValue: `${m}분` });
}

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

  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

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

      setBalanceLoading(true);
      getCreditBalance(accessToken)
        .then((b) => { if (!cancelled) setBalance(b); })
        .catch((err) => console.warn("[MyScreen] balance fail:", err))
        .finally(() => { if (!cancelled) setBalanceLoading(false); });

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
      apiUser?.name ||
      apiUser?.email?.split("@")[0] ||
      t("my.delete.userFallback", { defaultValue: "회원" });
    showAlert(
      t("my.delete.title", { defaultValue: "벌써 떠나시나요?" }),
      t("my.delete.desc", {
        name: displayName,
        defaultValue: `${displayName} 님과 함께한 소중한 시간들을 기억할게요.\n계정과 클론은 영구적으로 사라져요.`,
      }),
      [

        { text: t("my.delete.stay", { defaultValue: "조금 더 써볼래요" }), style: "cancel" },
        {
          text: t("my.delete.leave", { defaultValue: "탈퇴하기" }),
          style: "destructive",
          onPress: async () => {
            if (!accessToken) return;
            setDeleting(true);
            try {
              await deleteMe(accessToken);
              await logout();
            } catch (err) {
              const msg =
                err instanceof AuthApiError
                  ? err.message
                  : t("my.delete.failed", { defaultValue: "탈퇴에 실패했어요." });
              showAlert(t("common.error", { defaultValue: "오류" }), msg);
              setDeleting(false);
            }
          },
        },
      ],
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

      icon: "inbox",
      labelKey: "my.menu.notificationsList",
      descKey: "my.menu.notificationsListDesc",
      action: () => {
        navigation.getParent()?.dispatch(
          CommonActions.navigate({ name: "Notifications" }),
        );
      },
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
      icon: "credit-card",
      labelKey: "my.menu.purchase",
      descKey: "my.menu.purchaseDesc",
      route: "Purchase",
    },
    {
      icon: "file-text",
      labelKey: "my.coin.transactions",
      descKey: "my.coin.viewAll",
      route: "Transactions",
    },

    {
      icon: "film",
      labelKey: "Pangle 광고 테스트",
      descKey: "즉시 rewarded 광고 표시 (개발용)",
      action: async () => {
        try {
          const { loadAndShowRewardedAd } = await import("../../lib/pangle");
          console.log("[pangle-test] load+show 시작");
          await loadAndShowRewardedAd();
          console.log("[pangle-test] 광고 닫힘");
          showAlert("Pangle 테스트", "광고 정상 종료됨.");
        } catch (err) {
          console.warn("[pangle-test] 실패:", err);
          showAlert("Pangle 테스트 실패", (err as Error).message ?? String(err));
        }
      },
    },

    ...(["oth-staff@example.invalid", "oth-user@example.invalid"].includes(apiUser?.email ?? "")
      ? [
          {
            icon: "cpu" as const,
            labelKey: "실험 페르소나 만들기 (베타)",
            descKey: "자연스러운 얼굴 · 응답 5~10초 지연",
            action: async () => {
              try {
                const { setNextPipeline } = await import(
                  "../../lib/experimentalPipelineFlag"
                );
                setNextPipeline("echomimic_v3");

                navigation.getParent()?.dispatch(
                  CommonActions.navigate({ name: "CreateTab" }),
                );
              } catch (err) {
                console.warn("[experimental-persona] nav failed:", err);
                showAlert("오류", "페르소나 만들기 화면 이동 실패");
              }
            },
          },

          {
            icon: "mic" as const,
            labelKey: "분리 재생 페르소나 만들기 (실험)",
            descKey: "TTS + 사전 렌더 viseme 클립 sync",
            action: async () => {
              try {
                const { setNextPipeline } = await import(
                  "../../lib/experimentalPipelineFlag"
                );
                setNextPipeline("viseme_playback");
                navigation.getParent()?.dispatch(
                  CommonActions.navigate({ name: "CreateTab" }),
                );
              } catch (err) {
                console.warn("[viseme-persona] nav failed:", err);
                showAlert("오류", "페르소나 만들기 화면 이동 실패");
              }
            },
          },

          {
            icon: "box" as const,
            labelKey: "3D 페르소나 만들기 (베타)",
            descKey: "Avatar SDK 3D 얼굴 · GLB URL 별도 세팅 필요",
            action: async () => {
              try {
                const { setNextPipeline } = await import(
                  "../../lib/experimentalPipelineFlag"
                );
                setNextPipeline("threed");
                navigation.getParent()?.dispatch(
                  CommonActions.navigate({ name: "CreateTab" }),
                );
              } catch (err) {
                console.warn("[threed-persona] nav failed:", err);
                showAlert("오류", "페르소나 만들기 화면 이동 실패");
              }
            },
          },

          {
            icon: "activity" as const,
            labelKey: "Viseme 파이프라인 테스트 (dev)",
            descKey: "합성 + 재생 · 사전 렌더 이미지 필요",
            action: () => navigation.navigate("VisemeTest"),
          },

          {
            icon: "target" as const,
            labelKey: "얼굴 임계값 테스트 (dev)",
            descKey: "이미지 업로드 → 매칭 score 확인",
            action: () => navigation.navigate("FaceThresholdTest"),
          },

          {
            icon: "box" as const,
            labelKey: "3D 생성 테스트 (dev)",
            descKey: "사진 → mesh + 5각도 렌더 · 5~30초",
            action: () => navigation.navigate("ThreeDLab"),
          },

          {
            icon: "user" as const,
            labelKey: "3D 페르소나 (dev)",
            descKey: "GLB 헤드 렌더 + 립싱크 데모 · Phase 1",
            action: () => navigation.navigate("ThreeDPersona"),
          },

          {
            icon: "user-plus" as const,
            labelKey: "얼굴 5각도 등록 (dev)",
            descKey: "정면·좌·우·위·아래 촬영 → clones 첫 통화 대비",
            action: () => {

              const firstClone = apiMyClonesList?.[0];
              if (!firstClone) {
                showAlert("페르소나 없음", "먼저 페르소나를 만들어주세요.");
                return;
              }
              navigation.getParent()?.dispatch(
                CommonActions.navigate({
                  name: "PreCallFaceEnroll",
                  params: {
                    cloneId: firstClone.id,
                    name: firstClone.name,
                    image: firstClone.avatarUrl ?? undefined,
                  },
                }),
              );
            },
          },
        ]
      : []),
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
      action: () => {

        showAlert(
          t("my.logout.title", { defaultValue: "로그아웃할까요?" }),
          t("my.logout.desc", {
            defaultValue: "다시 사용하려면 로그인이 필요해요.",
          }),
          [
            { text: t("common.cancel", { defaultValue: "취소" }), style: "cancel" },
            {
              text: t("my.logout.confirm", { defaultValue: "로그아웃" }),
              style: "destructive",
              onPress: () => void logout(),
            },
          ],
        );
      },
    },
  ];

  return (
    <SafeScrollView backgroundColor={COLORS.white} showBottomBackground={false}>
      <PageHeader
        title={t("my.headerTitle", { defaultValue: "설정" })}
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

                  else (navigation.navigate as (name: string) => void)(item.route);
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
                    <Text style={s.statsEmptyText}>
                      {t("my.stats.emptyFollowing", {
                        defaultValue: "아직 구독한 클론이 없어요",
                      })}
                    </Text>
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
                            {followed
                              ? t("feed.following", { defaultValue: "구독 중" })
                              : t("feed.follow", { defaultValue: "구독" })}
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
                    <Text style={s.statsEmptyText}>
                      {t("my.stats.emptyMyClones", {
                        defaultValue: "아직 만든 클론이 없어요",
                      })}
                    </Text>
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

  balanceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.violet100,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  balanceLabel: { fontSize: 12, color: COLORS.zinc600, marginBottom: 4 },
  balanceTotal: { fontSize: 24, fontWeight: "700", color: COLORS.violet700 },
  balanceBreakdown: { fontSize: 12, color: COLORS.zinc600, marginTop: 4 },
  balanceEmpty: { fontSize: 13, color: COLORS.zinc500, marginTop: 6 },
  balanceCta: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.violet600,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 2,
  },
  balanceCtaText: { fontSize: 13, fontWeight: "700", color: "#fff" },

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
