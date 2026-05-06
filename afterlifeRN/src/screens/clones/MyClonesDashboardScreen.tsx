import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import SafeView from "../../components/ui/SafeView";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/common/PageHeader";
import { useCloneStore } from "../../stores/cloneStore";
import { useAuthStore } from "../../stores/authStore";
import { useFollowStore } from "../../stores/followStore";
import { seedSource } from "../../api/source";
import { listMyClones, createInvite, deleteClone, type MyClone } from "../../api/clones";
import NotificationBell from "../../components/common/NotificationBell";
import { searchUsers, AuthApiError, type UserSearchItem } from "../../api/auth";
import { COLORS, SIZES, RADIUS } from "../../components/constants";
import type { Clone, Visibility } from "../../types/clone";
import type { ClonesStackParamList } from "../../navigation/types";
import type { RootStackParamList } from "../../navigation/types";

type ClonesNav = NativeStackNavigationProp<ClonesStackParamList>;

const DEFAULT_USER_ID = 1;

function adaptMyClone(c: MyClone): Clone {
  return {
    id: c.id,
    cloneType: c.cloneType,
    ownerId: c.ownerId,
    displayName: c.name,
    description: c.description ?? "",
    interests: [],
    imageUrl: c.avatarUrl ?? undefined,
    visibility: c.visibility,
    status: (c.trainingStatus as Clone["status"]) ?? "active",
    createdAt: c.createdAt,
    ...(c.l1Profile ? { l1Profile: c.l1Profile } : {}),
  };
}

export default function MyClonesDashboardScreen() {
  const navigation = useNavigation<ClonesNav>();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const authUser = useAuthStore((s) => s.user);
  const apiUser = useAuthStore((s) => s.apiUser);
  const accessToken = useAuthStore((s) => s.accessToken);
  const localClones = useCloneStore((s) => s.localClones);
  const upsertClones = useCloneStore((s) => s.upsertClones);
  const follows = useFollowStore((s) => s.follows);

  const [apiClones, setApiClones] = useState<Clone[] | null>(null);

  const fetchMyClones = React.useCallback(async () => {
    if (!accessToken) {
      setApiClones(null);
      return;
    }
    try {
      const res = await listMyClones(accessToken);
      const adapted = res.items.map(adaptMyClone);
      setApiClones(adapted);

      upsertClones(adapted);
    } catch (err) {
      console.warn("[Dashboard] listMyClones failed:", err);

    }
  }, [accessToken, upsertClones]);

  useEffect(() => {
    fetchMyClones();
  }, [fetchMyClones]);

  useFocusEffect(
    React.useCallback(() => {
      fetchMyClones();
    }, [fetchMyClones]),
  );

  const myClones = useMemo<Clone[]>(() => {
    const uid = apiUser?.id ?? authUser?.id ?? DEFAULT_USER_ID;
    if (apiClones != null) {

      const apiIds = new Set(apiClones.map((c) => c.id));
      const localOnly = localClones.filter(
        (c) => c.ownerId === uid && !apiIds.has(c.id),
      );
      return [...apiClones, ...localOnly];
    }

    return [
      ...seedSource.clones().filter((c) => c.ownerId === uid),
      ...localClones.filter((c) => c.ownerId === uid),
    ];
  }, [apiClones, apiUser, authUser, localClones]);

  const [cloneStates, setCloneStates] = useState<
    Record<number, { isActive: boolean; visibility: Visibility }>
  >(
    myClones.reduce(
      (acc, clone, i) => ({
        ...acc,
        [clone.id]: {
          isActive: i !== 1, 
          visibility: clone.visibility,
        },
      }),
      {},
    ),
  );

  const [hiddenCloneIds, setHiddenCloneIds] = useState<Set<number>>(new Set());
  const [menuCloneId, setMenuCloneId] = useState<number | null>(null);
  const [inviteModal, setInviteModal] = useState<{ cloneId: number } | null>(null);
  const [inviteSearch, setInviteSearch] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [invitedIds, setInvitedIds] = useState<Set<number>>(new Set());

  const [statsModal, setStatsModal] = useState<{
    type: "likes" | "interactions" | "comments" | "followers";
    cloneName: string;
  } | null>(null);
  const [toggleModal, setToggleModal] = useState<{
    cloneId: number;
    currentState: boolean;
  } | null>(null);
  const [visibilityModal, setVisibilityModal] = useState<{
    cloneId: number;
    currentVisibility: Visibility;
  } | null>(null);
  const [deleteModal, setDeleteModal] = useState<number | null>(null);

  const visibleClones = myClones.filter((c) => !hiddenCloneIds.has(c.id));

  const activeCount = visibleClones.filter(
    (c) => cloneStates[c.id]?.isActive ?? true,
  ).length;

  const handleToggle = (cloneId: number) => {
    const currentState = cloneStates[cloneId]?.isActive ?? true;
    setToggleModal({ cloneId, currentState });
  };

  const confirmToggle = () => {
    if (!toggleModal) return;
    setCloneStates((prev) => ({
      ...prev,
      [toggleModal.cloneId]: {
        ...prev[toggleModal.cloneId],
        isActive: !toggleModal.currentState,
      },
    }));
    setToggleModal(null);
  };

  const handleVisibility = (cloneId: number) => {
    const current = cloneStates[cloneId]?.visibility ?? "public";
    setVisibilityModal({ cloneId, currentVisibility: current });
    setMenuCloneId(null);
  };

  useEffect(() => {
    if (!inviteModal || !accessToken) return;
    const q = inviteSearch.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await searchUsers(accessToken, q);
        setSearchResults(res.items);
      } catch (err) {
        console.warn("[Dashboard] searchUsers failed:", err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [inviteSearch, accessToken, inviteModal]);

  const handleSendInvite = async (user: UserSearchItem) => {
    if (!accessToken || !inviteModal) {
      console.warn("[Dashboard] handleSendInvite: missing accessToken or inviteModal");
      return;
    }
    console.log("[Dashboard] sendInvite start:", { cloneId: inviteModal.cloneId, email: user.email });
    try {
      const res = await createInvite(accessToken, inviteModal.cloneId, {
        invite_email: user.email,
      });
      console.log("[Dashboard] sendInvite success:", res);
      setInvitedIds((prev) => new Set(prev).add(user.id));
      setDeleteResultMessage(t("invite.sentToast", { target: user.name ?? user.email }));
    } catch (err) {
      if (err instanceof AuthApiError) {
        console.warn(
          "[Dashboard] createInvite failed:",
          err.code,
          err.status,
          err.message,
          "details=",
          JSON.stringify(err.details),
        );
        if (err.code === "UNAUTHENTICATED" || err.status === 401) {
          await useAuthStore.getState().apiLogout();
          setDeleteResultMessage(t("dashboard.sessionExpired"));
          return;
        }
      } else {
        console.warn("[Dashboard] createInvite failed:", err);
      }
      const msg = err instanceof AuthApiError ? err.message : t("invite.sendFailed");
      setDeleteResultMessage(msg);
    }
  };

  const confirmVisibility = (v: Visibility) => {
    if (!visibilityModal) return;
    setCloneStates((prev) => ({
      ...prev,
      [visibilityModal.cloneId]: {
        ...prev[visibilityModal.cloneId],
        visibility: v,
      },
    }));
    setVisibilityModal(null);
  };

  const handleDelete = (cloneId: number) => {
    setDeleteModal(cloneId);
    setMenuCloneId(null);
  };

  const [deleteResultMessage, setDeleteResultMessage] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!deleteModal) return;
    const targetId = deleteModal;
    setDeleteModal(null);

    if (!accessToken) {

      setHiddenCloneIds((prev) => new Set(prev).add(targetId));
      return;
    }
    console.log("[Dashboard] deleteClone start:", targetId);
    try {
      const res = await deleteClone(accessToken, targetId);
      console.log("[Dashboard] deleteClone success:", res);
      if (res.state === "transferred" && res.transferred) {
        setDeleteResultMessage(t("dashboard.deleteSuccessTransferred"));
      } else {
        setDeleteResultMessage(t("dashboard.deleteSuccessSimple"));
      }

      setHiddenCloneIds((prev) => new Set(prev).add(targetId));
      await fetchMyClones();
    } catch (err) {
      if (err instanceof AuthApiError) {
        console.warn(
          "[Dashboard] deleteClone failed:",
          err.code,
          err.status,
          err.message,
          "details=",
          JSON.stringify(err.details),
        );

        if (err.code === "CONFLICT" && /already deleted/i.test(err.message)) {
          setHiddenCloneIds((prev) => new Set(prev).add(targetId));
          setDeleteResultMessage(t("dashboard.deleteAlreadyDeleted"));
          await fetchMyClones();
          return;
        }

        if (err.code === "UNAUTHENTICATED" || err.status === 401) {
          await useAuthStore.getState().apiLogout();
          setDeleteResultMessage(t("dashboard.sessionExpired"));
          return;
        }
      } else {
        console.warn("[Dashboard] deleteClone failed:", err);
      }
      const msg = err instanceof AuthApiError ? err.message : t("dashboard.deleteFailed");
      setDeleteResultMessage(msg);
    }
  };

  const getVisibilityLabel = (v: Visibility) => {
    switch (v) {
      case "public": return "공개";
      case "private": return "비공개";
      case "followers": return "지인공개";
    }
  };

  const getVisibilityIcon = (v: Visibility): keyof typeof Feather.glyphMap => {
    switch (v) {
      case "public": return "eye";
      case "private": return "eye-off";
      case "followers": return "user-check";
    }
  };

  const renderCloneCard = ({ item: clone }: { item: Clone }) => {
    const state = cloneStates[clone.id];
    const isActive = state?.isActive ?? true;
    const visibility = state?.visibility ?? clone.visibility;
    const isMemlow = clone.cloneType === "memlow";
    const followerCount = follows.filter(
      (f) => f.followingCloneId === clone.id,
    ).length;
    const coownerCount =
      clone.cloneType === "memlow"
        ? seedSource.coowners().filter(
            (co) => co.cloneId === clone.id && co.status === "approved",
          ).length
        : 0;

    return (
      <View style={s.card}>
        {}
        <View style={s.cardTopRow}>
          <TouchableOpacity
            style={s.activeToggle}
            onPress={() => handleToggle(clone.id)}
          >
            <Feather
              name={isActive ? "check-circle" : "circle"}
              size={18}
              color={isActive ? COLORS.success : COLORS.zinc400}
            />
            <Text style={s.activeText}>
              {isActive ? t("dashboard.active") : t("dashboard.inactive")}
            </Text>
          </TouchableOpacity>

          <View style={s.cardTopRight}>
            {}
            {!isMemlow && (
              <View style={s.visibilityBadge}>
                <Feather name={getVisibilityIcon(visibility)} size={14} color={COLORS.zinc500} />
                <Text style={s.visibilityText}>{getVisibilityLabel(visibility)}</Text>
              </View>
            )}
            <TouchableOpacity
              style={s.moreBtn}
              onPress={() => setMenuCloneId(clone.id)}
            >
              <Feather name="more-vertical" size={18} color={COLORS.zinc400} />
            </TouchableOpacity>
          </View>
        </View>

        {}
        <View style={s.cloneHeader}>
          <View style={s.avatarWrap}>
            {clone.imageUrl ? (
              <Image source={{ uri: clone.imageUrl }} style={s.avatar} />
            ) : (
              <View style={[s.avatar, { backgroundColor: COLORS.zinc100, alignItems: 'center', justifyContent: 'center' }]}>
                <Feather name="user" size={20} color={COLORS.zinc400} />
              </View>
            )}
            {isActive && <View style={s.activeDot} />}
          </View>
          <View style={s.cloneInfo}>
            <Text style={s.cloneName}>{clone.displayName}</Text>
            <Text style={s.cloneCategory}>{clone.interests?.[0] ?? ""}</Text>
          </View>
        </View>

        {}
        <Text style={s.description} numberOfLines={2}>
          {clone.description}
        </Text>

        {}
        {isMemlow ? (
          <TouchableOpacity
            style={s.coownerBadge}
            onPress={() =>
              navigation.navigate("CloneInvite", { cloneId: clone.id })
            }
            activeOpacity={0.7}
          >
            <Feather name="users" size={14} color={COLORS.zinc600} />
            <Text style={s.coownerText}>
              {t("dashboard.coownerCount", { n: coownerCount })}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={s.statsRow}>
            <TouchableOpacity
              style={s.stat}
              onPress={() => setStatsModal({ type: "likes", cloneName: clone.displayName })}
            >
              <Feather name="heart" size={14} color={COLORS.zinc500} />
              <Text style={s.statText}>2.4k</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.stat}
              onPress={() => setStatsModal({ type: "interactions", cloneName: clone.displayName })}
            >
              <Ionicons name="chatbubbles-outline" size={14} color={COLORS.zinc500} />
              <Text style={s.statText}>4.5k</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.stat}
              onPress={() => setStatsModal({ type: "comments", cloneName: clone.displayName })}
            >
              <Feather name="message-circle" size={14} color={COLORS.zinc500} />
              <Text style={s.statText}>328</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.stat}
              onPress={() => setStatsModal({ type: "followers", cloneName: clone.displayName })}
            >
              <Feather name="user" size={14} color={COLORS.zinc500} />
              <Text style={s.statText} testID={`follower-count-${clone.id}`}>
                {followerCount} 팔로워
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {}
        {clone.status === 'pending_assets' && (
          <View style={s.pendingBadge}>
            <Feather name="clock" size={12} color={COLORS.zinc600} />
            <Text style={s.pendingText}>생성대기중</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CloneEdit', { cloneId: clone.id })}>
              <Text style={s.pendingCta}>사진/음성 추가하기</Text>
            </TouchableOpacity>
          </View>
        )}

        {}
        <View style={s.tagsRow}>
          {(clone.interests ?? []).map((tag, i) => (
            <View key={i} style={s.tag}>
              <Text style={s.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>

        {}
        <View style={s.actionsRow}>
          <TouchableOpacity
            style={s.actionBtn}
            onPress={() => rootNav.navigate("Chat", { cloneId: clone.id })}
          >
            <Feather name="message-circle" size={16} color={COLORS.zinc700} />
            <Text style={s.actionText}>{t("dashboard.actionLearn")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.actionBtn}
            onPress={() => rootNav.navigate("Call", { cloneId: clone.id })}
          >
            <Feather name="video" size={16} color={COLORS.zinc700} />
            <Text style={s.actionText}>{t("dashboard.actionCall")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.actionBtn}
            onPress={() => {
              setInviteSearch("");
              setSearchResults([]);
              setInvitedIds(new Set());
              setInviteModal({ cloneId: clone.id });
            }}
          >
            <Feather name="user-plus" size={16} color={COLORS.zinc700} />
            <Text style={s.actionText}>{t("dashboard.actionInvite")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeView backgroundColor={COLORS.white} showBottomBackground={false}>
      <PageHeader
        title={t("dashboard.title")}
        rightAction={<NotificationBell />}
      />

      <FlatList
        data={visibleClones}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderCloneCard}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {}
            <View style={s.dashTitleRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.dashTitleText}>{t("dashboard.headerTitle")}</Text>
                <Text style={s.dashSubText}>{t("dashboard.headerDesc")}</Text>
              </View>
              <TouchableOpacity
                style={s.inviteStatusBtn}
                onPress={() => navigation.navigate("InviteStatus")}
                activeOpacity={0.7}
              >
                <Feather name="send" size={14} color={COLORS.violet600} />
                <Text style={s.inviteStatusBtnText}>{t("inviteStatus.title")}</Text>
              </TouchableOpacity>
            </View>

            {}
            <View style={s.statsOverview}>
              <View style={s.statsCard}>
                <View style={s.statsCardHeader}>
                  <Ionicons name="chatbubbles-outline" size={14} color={COLORS.zinc500} />
                  <Text style={s.statsCardLabel}>{t("dashboard.statsTotalInteractions")}</Text>
                </View>
                <Text style={s.statsCardValue}>12.8k</Text>
                <Text style={s.statsCardDelta}>{t("dashboard.statsDelta")}</Text>
              </View>

              <View style={[s.statsCard, s.statsCardDark]}>
                <View style={s.statsCardHeader}>
                  <Feather name="user" size={14} color={COLORS.zinc400} />
                  <Text style={[s.statsCardLabel, { color: COLORS.zinc400 }]}>
                    {t("dashboard.statsActivity")}
                  </Text>
                </View>
                <View style={s.activityCount}>
                  <Text style={s.activityActive}>{activeCount}</Text>
                  <Text style={s.activityTotal}>/ {visibleClones.length}</Text>
                </View>
              </View>
            </View>
          </>
        }
        ListFooterComponent={
          <TouchableOpacity style={s.loadMore}>
            <Text style={s.loadMoreText}>{t("dashboard.loadMore")}</Text>
          </TouchableOpacity>
        }
      />

      {}
      <Modal visible={!!menuCloneId} transparent animationType="fade">
        <Pressable style={s.modalOverlay} onPress={() => setMenuCloneId(null)}>
          <Pressable style={s.menuBox} onPress={(e) => e.stopPropagation()}>
            <Text style={s.menuTitle}>{t("dashboard.manage")}</Text>
            <TouchableOpacity
              style={s.menuItem}
              onPress={() => {
                const id = menuCloneId!;
                setMenuCloneId(null);
                navigation.navigate("CloneEdit", { cloneId: id });
              }}
            >
              <Feather name="edit-2" size={18} color={COLORS.zinc700} />
              <Text style={s.menuItemText}>{t("dashboard.menuEdit")}</Text>
            </TouchableOpacity>

            {}
            {menuCloneId != null && (() => {
              const isActive = cloneStates[menuCloneId]?.isActive ?? true;
              return (
                <TouchableOpacity
                  style={s.menuItem}
                  onPress={() => {
                    const id = menuCloneId!;
                    setMenuCloneId(null);
                    handleToggle(id);
                  }}
                >
                  <Feather
                    name={isActive ? "pause-circle" : "play-circle"}
                    size={18}
                    color={isActive ? COLORS.zinc700 : COLORS.success}
                  />
                  <Text style={s.menuItemText}>
                    {isActive ? t("dashboard.menuDeactivate") : t("dashboard.menuActivate")}
                  </Text>
                </TouchableOpacity>
              );
            })()}

            {}
            {menuCloneId != null &&
              myClones.find((c) => c.id === menuCloneId)?.cloneType !== "memlow" && (
                <TouchableOpacity
                  style={s.menuItem}
                  onPress={() => {
                    const id = menuCloneId!;
                    handleVisibility(id);
                  }}
                >
                  <Feather
                    name={getVisibilityIcon(cloneStates[menuCloneId!]?.visibility ?? "public")}
                    size={18}
                    color={COLORS.zinc700}
                  />
                  <Text style={s.menuItemText}>{t("dashboard.menuVisibility")}</Text>
                </TouchableOpacity>
              )}
            <View style={s.menuDivider} />
            <TouchableOpacity
              style={s.menuItem}
              onPress={() => {
                const id = menuCloneId!;
                handleDelete(id);
              }}
            >
              <Feather name="trash-2" size={18} color={COLORS.error} />
              <Text style={[s.menuItemText, { color: COLORS.error }]}>{t("dashboard.menuDelete")}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={!!toggleModal} transparent animationType="fade">
        <Pressable style={s.modalOverlay} onPress={() => setToggleModal(null)}>
          <Pressable style={s.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={s.modalTitle}>
              {toggleModal?.currentState ? "페르소나 비활성화" : "페르소나 활성화"}
            </Text>
            <Text style={s.modalDesc}>
              {toggleModal?.currentState
                ? "페르소나를 비활성화하시겠습니까? 비활성화 시 다른 사용자에게 노출되지 않습니다."
                : "페르소나를 활성화하시겠습니까? 활성화 시 다른 사용자에게 노출됩니다."}
            </Text>
            <View style={s.modalBtns}>
              <Button
                title="취소"
                variant="ghost"
                onPress={() => setToggleModal(null)}
                style={s.modalBtnHalf}
              />
              <Button
                title="확인"
                variant="primary"
                onPress={confirmToggle}
                style={s.modalBtnHalf}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={!!visibilityModal} transparent animationType="fade">
        <Pressable style={s.modalOverlay} onPress={() => setVisibilityModal(null)}>
          <Pressable style={s.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={s.modalTitle}>공개 설정</Text>
            <Text style={s.modalDesc}>페르소나의 공개 범위를 선택하세요</Text>
            <View style={s.visibilityOptions}>
              {(["public", "private", "followers"] as Visibility[]).map((v) => {
                const selected = visibilityModal?.currentVisibility === v;
                return (
                  <TouchableOpacity
                    key={v}
                    style={[s.visibilityOption, selected && s.visibilityOptionSelected]}
                    onPress={() => confirmVisibility(v)}
                  >
                    <Feather
                      name={getVisibilityIcon(v)}
                      size={16}
                      color={selected ? COLORS.white : COLORS.zinc700}
                    />
                    <Text
                      style={[
                        s.visibilityOptionText,
                        selected && { color: COLORS.white },
                      ]}
                    >
                      {getVisibilityLabel(v)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Button
              title="취소"
              variant="ghost"
              onPress={() => setVisibilityModal(null)}
              style={{ marginTop: 12, width: "100%" }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={!!deleteModal} transparent animationType="fade">
        <Pressable style={s.modalOverlay} onPress={() => setDeleteModal(null)}>
          <Pressable style={s.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={s.modalTitle}>{t("dashboard.deleteTitle")}</Text>
            <Text style={s.modalDesc}>
              {deleteModal &&
              myClones.find((c) => c.id === deleteModal)?.cloneType === "memlow"
                ? t("dashboard.deleteDescMemlow")
                : t("dashboard.deleteDescDefault")}
            </Text>
            <View style={s.modalBtns}>
              <Button
                title="취소"
                variant="ghost"
                onPress={() => setDeleteModal(null)}
                style={s.modalBtnHalf}
              />
              <Button
                title="삭제"
                variant="danger"
                onPress={confirmDelete}
                style={s.modalBtnHalf}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={!!deleteResultMessage} transparent animationType="fade">
        <Pressable style={s.modalOverlay} onPress={() => setDeleteResultMessage(null)}>
          <Pressable style={s.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={s.modalTitle}>알림</Text>
            <Text style={s.modalDesc}>{deleteResultMessage}</Text>
            <Button
              title="확인"
              variant="primary"
              onPress={() => setDeleteResultMessage(null)}
              style={{ width: "100%" }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {
}
      <Modal
        visible={!!inviteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setInviteModal(null)}
      >
        <Pressable style={s.bottomSheetOverlay} onPress={() => setInviteModal(null)}>
          <View
            style={s.inviteSheet}
            onStartShouldSetResponder={() => true}
          >
            <View style={s.sheetHandle} />
            <View style={s.inviteHeader}>
              <Text style={s.inviteTitle}>{t("invite.create")}</Text>
              <TouchableOpacity onPress={() => setInviteModal(null)}>
                <Feather name="x" size={20} color={COLORS.zinc500} />
              </TouchableOpacity>
            </View>

            {}
            <View style={s.inviteSearchWrap}>
              <Feather name="search" size={18} color={COLORS.zinc400} />
              <TextInput
                style={s.inviteSearchInput}
                value={inviteSearch}
                onChangeText={setInviteSearch}
                placeholder={t("dashboard.inviteSearchHint")}
                placeholderTextColor={COLORS.placeholder}
                autoFocus
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {inviteSearch.length > 0 && (
                <TouchableOpacity onPress={() => setInviteSearch("")}>
                  <Feather name="x-circle" size={16} color={COLORS.zinc400} />
                </TouchableOpacity>
              )}
            </View>

            {}
            <ScrollView style={s.inviteList} showsVerticalScrollIndicator={false}>
              {inviteSearch.trim().length < 2 ? (
                <View style={{ padding: 32, alignItems: "center" }}>
                  <Feather name="search" size={32} color={COLORS.zinc300} />
                  <Text style={{ color: COLORS.zinc500, marginTop: 8, fontSize: 13 }}>
                    {t("invite.inviteSearchEmpty")}
                  </Text>
                  <Text style={{ color: COLORS.zinc400, marginTop: 4, fontSize: 11 }}>
                    {t("invite.inviteSearchEmptyHint")}
                  </Text>
                </View>
              ) : searching ? (
                <View style={{ padding: 32, alignItems: "center" }}>
                  <ActivityIndicator color={COLORS.zinc500} />
                </View>
              ) : searchResults.length === 0 ? (
                <View style={{ padding: 32, alignItems: "center" }}>
                  <Text style={{ color: COLORS.zinc500, fontSize: 13 }}>
                    {t("invite.inviteNoResults")}
                  </Text>
                  <Text style={{ color: COLORS.zinc400, marginTop: 4, fontSize: 11 }}>
                    {t("invite.inviteSearchEmptyHint")}
                  </Text>
                </View>
              ) : (
                searchResults.map((user) => {
                  const sent = invitedIds.has(user.id);
                  return (
                    <View key={user.id} style={s.inviteRow}>
                      {user.avatarUrl ? (
                        <Image source={{ uri: user.avatarUrl }} style={s.inviteAvatar} />
                      ) : (
                        <View style={[s.inviteAvatar, { backgroundColor: COLORS.zinc100, alignItems: "center", justifyContent: "center" }]}>
                          <Feather name="user" size={20} color={COLORS.zinc400} />
                        </View>
                      )}
                      <View style={s.inviteInfo}>
                        <Text style={s.inviteName}>{user.name ?? user.email}</Text>
                        <Text style={s.inviteUsername}>{user.email}</Text>
                      </View>
                      <TouchableOpacity
                        style={[s.inviteBtn, sent && s.inviteBtnSent]}
                        disabled={sent}
                        onPress={() => handleSendInvite(user)}
                      >
                        <Feather
                          name={sent ? "check" : "send"}
                          size={14}
                          color={sent ? COLORS.success : COLORS.white}
                        />
                        <Text style={[s.inviteBtnText, sent && s.inviteBtnTextSent]}>
                          {sent ? "전송됨" : "초대"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {}
      <Modal visible={!!statsModal} transparent animationType="slide">
        <Pressable style={s.modalOverlay} onPress={() => setStatsModal(null)}>
          <View style={s.statsSheet} onStartShouldSetResponder={() => true}>
            <View style={s.sheetHandle} />
            <Text style={s.statsSheetTitle}>
              {statsModal?.type === "likes" && "좋아요"}
              {statsModal?.type === "interactions" && "상호작용"}
              {statsModal?.type === "comments" && "댓글"}
              {statsModal?.type === "followers" && "팔로워"}
            </Text>
            <Text style={s.statsSheetSub}>
              {statsModal?.cloneName}
            </Text>

            <ScrollView style={s.statsScrollArea} showsVerticalScrollIndicator={false}>
              {}
              {statsModal?.type === "comments" && MOCK_COMMENTS.map((c) => (
                <View key={c.id} style={s.commentRow}>
                  <View style={s.commentTop}>
                    <Image source={{ uri: c.avatar }} style={s.commentAvatar} />
                    <Text style={s.commentName}>{c.name}</Text>
                    <Text style={s.commentTime}>{c.time}</Text>
                  </View>
                  <Text style={s.commentText}>{c.text}</Text>
                </View>
              ))}

              {}
              {(statsModal?.type === "likes" || statsModal?.type === "followers") &&
                MOCK_ACCOUNTS.map((account) => (
                  <View key={account.id} style={s.accountRow}>
                    <Image source={{ uri: account.avatar }} style={s.accountAvatar} />
                    <View style={s.accountInfo}>
                      <Text style={s.accountName}>{account.name}</Text>
                      <Text style={s.accountSub}>{account.detail}</Text>
                    </View>
                  </View>
                ))}

              {}
              {statsModal?.type === "interactions" &&
                MOCK_INTERACTIONS.map((account) => (
                  <View key={account.id} style={s.accountRow}>
                    <Image source={{ uri: account.avatar }} style={s.accountAvatar} />
                    <View style={s.accountInfo}>
                      <Text style={s.accountName}>{account.name}</Text>
                      <Text style={s.accountSub}>{account.detail}</Text>
                    </View>
                  </View>
                ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </SafeView>
  );
}

const MOCK_ACCOUNTS = [
  { id: "u1", name: "김민수", avatar: "https://i.pravatar.cc/100?img=1", detail: "@minsu_k" },
  { id: "u2", name: "이서연", avatar: "https://i.pravatar.cc/100?img=5", detail: "@seoyeon_lee" },
  { id: "u3", name: "박지훈", avatar: "https://i.pravatar.cc/100?img=3", detail: "@jihun.park" },
  { id: "u4", name: "최유진", avatar: "https://i.pravatar.cc/100?img=9", detail: "@yujin_choi" },
  { id: "u5", name: "정하은", avatar: "https://i.pravatar.cc/100?img=10", detail: "@haeun_j" },
];

const MOCK_INTERACTIONS = [
  { id: "i1", name: "김민수", avatar: "https://i.pravatar.cc/100?img=1", detail: "마지막 대화: 2시간 전" },
  { id: "i2", name: "이서연", avatar: "https://i.pravatar.cc/100?img=5", detail: "마지막 대화: 어제" },
  { id: "i3", name: "박지훈", avatar: "https://i.pravatar.cc/100?img=3", detail: "마지막 대화: 3일 전" },
  { id: "i4", name: "최유진", avatar: "https://i.pravatar.cc/100?img=9", detail: "마지막 대화: 1주 전" },
];

const MOCK_COMMENTS = [
  { id: "c1", name: "김민수", avatar: "https://i.pravatar.cc/100?img=1", text: "정말 도움이 많이 됐어요! 감사합니다.", time: "2시간 전" },
  { id: "c2", name: "이서연", avatar: "https://i.pravatar.cc/100?img=5", text: "이 페르소나 대화 퀄리티가 진짜 좋네요", time: "5시간 전" },
  { id: "c3", name: "박지훈", avatar: "https://i.pravatar.cc/100?img=3", text: "위로가 되는 말씀 감사해요 ㅠㅠ", time: "어제" },
  { id: "c4", name: "최유진", avatar: "https://i.pravatar.cc/100?img=9", text: "매일 대화하고 있어요 추천합니다!", time: "2일 전" },
  { id: "c5", name: "정하은", avatar: "https://i.pravatar.cc/100?img=10", text: "목소리도 자연스럽고 너무 좋아요", time: "3일 전" },
];

const s = StyleSheet.create({
  listContent: {
    paddingHorizontal: SIZES.medium,
    paddingBottom: 24,
  },

  dashTitle: { marginTop: 16, marginBottom: 20 },
  dashTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  dashTitleText: { fontSize: 20, fontWeight: "700", color: COLORS.zinc900 },
  inviteStatusBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.violet100,
    borderRadius: RADIUS.full,
  },
  inviteStatusBtnText: { fontSize: 12, fontWeight: "600", color: COLORS.violet600 },
  dashSubText: { fontSize: 13, color: COLORS.zinc500, marginTop: 4 },

  statsOverview: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statsCard: {
    flex: 1,
    backgroundColor: COLORS.zinc50,
    borderRadius: 24,
    padding: 20,
  },
  statsCardDark: {
    backgroundColor: COLORS.zinc900,
  },
  statsCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  statsCardLabel: { fontSize: 11, color: COLORS.zinc500 },
  statsCardValue: { fontSize: 28, fontWeight: "700", color: COLORS.zinc900 },
  statsCardDelta: { fontSize: 11, color: COLORS.success, fontWeight: "500", marginTop: 4 },
  activityCount: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  activityActive: { fontSize: 44, fontWeight: "700", color: COLORS.white },
  activityTotal: { fontSize: 28, color: COLORS.zinc400 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    marginBottom: 16,
  },

  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  activeToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activeText: { fontSize: 12, fontWeight: "500", color: COLORS.zinc600 },
  cardTopRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  visibilityBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  visibilityText: { fontSize: 13, color: COLORS.zinc500 },
  moreBtn: { padding: 4 },

  menuBox: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 8,
    width: "100%",
    maxWidth: 320,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.zinc900,
    textAlign: "center",
    paddingVertical: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
  },
  menuItemText: { fontSize: 15, color: COLORS.zinc700 },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.zinc200,
    marginHorizontal: 16,
    marginVertical: 4,
  },

  cloneHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  activeDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  cloneInfo: { flex: 1 },
  cloneName: { fontSize: 16, fontWeight: "700", color: COLORS.zinc900 },
  cloneCategory: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },

  description: {
    fontSize: 14,
    color: COLORS.zinc600,
    lineHeight: 20,
    marginBottom: 14,
  },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 14,
  },
  stat: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 13, color: COLORS.zinc500 },

  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.zinc100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  pendingText: { fontSize: 11, color: COLORS.zinc600 },
  pendingCta: { fontSize: 11, color: COLORS.violet600, marginLeft: 4, textDecorationLine: 'underline' },

  coownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.violet100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  coownerText: { fontSize: 11, color: COLORS.violet600, fontWeight: '500' },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: COLORS.zinc100,
    borderRadius: RADIUS.full,
  },
  tagText: { fontSize: 12, color: COLORS.zinc600 },

  actionsRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.zinc100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionText: { fontSize: 12, fontWeight: "500", color: COLORS.zinc700 },

  loadMore: {
    height: 48,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  loadMoreText: { fontSize: 14, fontWeight: "500", color: COLORS.zinc900 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.zinc900,
    textAlign: "center",
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: COLORS.zinc600,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  modalBtns: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalBtnHalf: { flex: 1 },

  visibilityOptions: { gap: 8, width: "100%" },
  visibilityOption: {
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.zinc100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  visibilityOptionSelected: {
    backgroundColor: COLORS.zinc900,
  },
  visibilityOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.zinc700,
  },

  statsSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 32,
    maxHeight: "60%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.zinc300,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  statsSheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.zinc900,
    marginBottom: 4,
  },
  statsSheetSub: {
    fontSize: 13,
    color: COLORS.zinc500,
    marginBottom: 16,
  },
  statsScrollArea: {
    flex: 1,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  accountAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.zinc200,
  },
  accountInfo: { flex: 1 },
  accountName: { fontSize: 15, fontWeight: "600", color: COLORS.zinc900 },
  accountSub: { fontSize: 13, color: COLORS.zinc500, marginTop: 2 },

  commentRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  commentTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.zinc200,
  },
  commentName: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900 },
  commentTime: { fontSize: 12, color: COLORS.zinc400 },
  commentText: {
    fontSize: 14,
    color: COLORS.zinc700,
    lineHeight: 20,
    paddingLeft: 36,
  },

  inviteSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 8,
    width: "100%",
    height: "70%",
  },
  inviteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  inviteTitle: { fontSize: 18, fontWeight: "700", color: COLORS.zinc900 },
  inviteSearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.zinc100,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    height: 44,
    marginBottom: 16,
  },
  inviteSearchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.zinc900,
  },
  inviteList: { flex: 1 },
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  inviteAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.zinc200,
  },
  inviteInfo: { flex: 1 },
  inviteName: { fontSize: 15, fontWeight: "600", color: COLORS.zinc900 },
  inviteUsername: { fontSize: 13, color: COLORS.zinc500, marginTop: 2 },
  inviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.zinc900,
  },
  inviteBtnSent: {
    backgroundColor: COLORS.zinc100,
  },
  inviteBtnText: { fontSize: 13, fontWeight: "600", color: COLORS.white },
  inviteBtnTextSent: { color: COLORS.success },
});
