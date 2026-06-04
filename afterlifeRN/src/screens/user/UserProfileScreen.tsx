

import v_a3453e, { v_de06a3, v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_cf9c33,
  v_9cabcb,
  v_39a996,
  v_700696,
  v_aa7413,
  v_09d0e5,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_ada615, v_2d8264, type v_ee3714 } from "ixigazcpvfldbecwtbvavtbi";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import v_556baf from "../../components/ui/SafeView";
import v_258c1c from "../../components/common/PageHeader";
import v_8e7ad4 from "../../components/ui/SwipeDownSheet";
import v_4d58d7 from "../../components/common/ReportReasonModal";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_889fad } from "../../stores/dialogStore";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_98d20a } from "../../stores/userFollowStore";
import {
  v_9fd740,
  v_b9d616,
  v_83b07d,
  v_095ba5,
  type v_909903,
  type v_d64743,
} from "../../api/users";
import type { v_8ad91b } from "../../navigation/types";

type RouteProps = v_ee3714<v_8ad91b, "UserProfile">;
type NavProp = v_390fcc<v_8ad91b>;

const v_ae5c4a = 4;
const v_a564de = 3;

export default function v_c501aa() {
  const v_c65f5d = v_ada615<NavProp>();
  const v_c7daf6 = v_2d8264<RouteProps>();
  const { userId: v_43e90c } = v_c7daf6.params;
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_e1bd47 = v_98d20a((v_fd5f43) =>
    v_fd5f43.followingIds.has(v_43e90c),
  );
  const v_cd488d = v_98d20a((v_fd5f43) => v_fd5f43.setFollowing);
  const v_3094d4 = v_98d20a((v_fd5f43) => v_fd5f43.toggleFollow);

  const [v_727031, v_4ffb1e] = v_5ab095<v_909903 | null>(null);
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_5e9bfe, v_3a7d09] = v_5ab095<string | null>(null);
  const [v_79e290, v_27990a] = v_5ab095(false);

  const [v_3e9618, v_eda097] = v_5ab095(false);
  const [v_d61813, v_9b20ec] = v_5ab095(false);
  const v_033e14 = v_e0068c();

  const v_bcfa24 = v_700696.get("window").width;
  const v_3bf7ea = v_9b1a04.medium;
  const v_e66b8c = Math.floor(
    (v_bcfa24 - v_3bf7ea * 2 - v_ae5c4a * (v_a564de - 1)) / v_a564de,
  );

  const v_f6f5de = v_de06a3(async () => {
    if (!v_2ca7e0) {
      v_3a7d09("로그인이 필요합니다.");
      v_34a50a(false);
      return;
    }
    v_34a50a(true);
    v_3a7d09(null);
    try {
      const v_8f00b9 = await v_9fd740(v_2ca7e0, v_43e90c);
      v_4ffb1e(v_8f00b9);

      v_cd488d(v_43e90c, v_8f00b9.user.isFollowing);
    } catch (v_49263d) {
      console.warn("[UserProfile] load failed:", v_49263d);
      v_3a7d09((v_49263d as Error).message ?? "프로필을 불러오지 못했어요.");
    } finally {
      v_34a50a(false);
    }
  }, [v_2ca7e0, v_43e90c, v_cd488d]);

  v_c4deb2(() => {
    v_f6f5de();
  }, [v_f6f5de]);

  const v_c5469e = async () => {
    if (v_79e290) return;
    v_27990a(true);
    try {
      const v_612414 = await v_3094d4(v_43e90c);

      v_4ffb1e((v_ba2215) =>
        v_ba2215
          ? {
              ...v_ba2215,
              user: {
                ...v_ba2215.user,
                isFollowing: v_612414,
                followersCount:
                  v_ba2215.user.followersCount + (v_612414 ? 1 : -1),
              },
            }
          : v_ba2215,
      );
    } catch (v_a429e4) {

    } finally {
      v_27990a(false);
    }
  };

  const v_956c7b = (v_34e5bb) => {
    if (!v_727031) return;
    v_c65f5d.navigate("UserFollowList", {
      userId: v_43e90c,
      mode: v_34e5bb,
      userName: v_727031.user.name ?? v_727031.user.email,
    });
  };

  const v_74ecfc = (c: v_d64743) => {
    v_c65f5d.navigate("CloneFeed", {
      feed: {
        id: -v_3f4e2e.id,
        cloneId: v_3f4e2e.id,
        content: v_3f4e2e.description ?? "",
        mediaUrl: v_3f4e2e.avatarUrl,
        mediaType: null,
        likesCount: v_3f4e2e.likesCount ?? 0,
        commentsCount: 0,
        likedByMe: false,
        createdAt: v_3f4e2e.createdAt,
        clone: {
          id: v_3f4e2e.id,
          ownerId: v_43e90c, 
          name: v_3f4e2e.name,
          username: v_3f4e2e.username,
          avatarUrl: v_3f4e2e.avatarUrl,
          cloneType: v_3f4e2e.cloneType as never,
          visibility: v_3f4e2e.visibility,
        },
        interests: [],
      },
    });
  };

  const v_3a0774 = ({
    item: v_8c0b26,
    index: v_a56041,
  }: {
    item: v_d64743;
    index: number;
  }) => {
    const v_c8b83f = v_a56041 % v_a564de;
    const v_d88de1 = v_c8b83f < v_a564de - 1 ? v_ae5c4a : 0;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => v_74ecfc(v_8c0b26)}
        style={{ width: v_e66b8c, marginRight: v_d88de1, marginBottom: v_ae5c4a }}
      >
        <View style={[v_fd5f43.cellImageWrap, { width: v_e66b8c, height: v_e66b8c }]}>
          {v_8c0b26.avatarUrl ? (
            <Image source={{ uri: v_8c0b26.avatarUrl }} style={v_fd5f43.cellImage} />
          ) : (
            <View style={[v_fd5f43.cellImage, v_fd5f43.cellPlaceholder]}>
              <Feather name="user" size={28} color={v_1bfbd0.zinc400} />
            </View>
          )}
        </View>
        <Text style={v_fd5f43.cellName} numberOfLines={1}>
          {v_8c0b26.name}
        </Text>
        <Text style={v_fd5f43.cellSub} numberOfLines={1}>
          @{v_8c0b26.username}
        </Text>
      </TouchableOpacity>
    );
  };

  const v_8fecb8 = v_727031?.user.name ?? v_727031?.user.email ?? "";
  const v_0c8fa1 = v_727031?.user.isMe ?? false;
  const v_4258ec = v_727031?.user.isBlocked ?? false;
  const v_b7489c = v_727031?.user.name ?? v_727031?.user.email ?? "이 사용자";

  const v_21738e = async () => {
    v_eda097(false);
    if (!v_2ca7e0 || !v_727031) return;
    try {
      if (v_4258ec) {
        await v_83b07d(v_2ca7e0, v_43e90c);
        v_4ffb1e((v_e2a85c) => (v_e2a85c ? { ...v_e2a85c, user: { ...v_e2a85c.user, isBlocked: false } } : v_e2a85c));
        v_889fad("차단 해제", `${v_b7489c} 님을 차단 해제했어요.`);
      } else {
        v_889fad(
          "차단하기",
          `${v_b7489c} 님을 차단할까요?\n팔로우/팔로워 관계도 해제돼요.`,
          [
            { text: "취소", style: "cancel" },
            {
              text: "차단하기",
              style: "destructive",
              onPress: async () => {
                try {
                  await v_b9d616(v_2ca7e0, v_43e90c);
                  v_4ffb1e((v_e2a85c) =>
                    v_e2a85c ? { ...v_e2a85c, user: { ...v_e2a85c.user, isBlocked: true, isFollowing: false } } : v_e2a85c,
                  );
                  v_cd488d(v_43e90c, false);
                  v_889fad("차단 완료", `${v_b7489c} 님을 차단했어요.`);
                } catch (v_49263d) {
                  console.warn("[UserProfile] block failed:", v_49263d);
                  v_889fad("실패", "차단에 실패했어요.");
                }
              },
            },
          ],
        );
      }
    } catch (v_49263d) {
      console.warn("[UserProfile] toggle block failed:", v_49263d);
      v_889fad("실패", "처리에 실패했어요.");
    }
  };

  const v_2ecc65 = async (v_58ca36) => {
    v_9b20ec(false);
    if (!v_2ca7e0) return;
    try {
      await v_095ba5(v_2ca7e0, v_43e90c, v_58ca36 || undefined);

      v_4ffb1e((v_e2a85c) =>
        v_e2a85c ? { ...v_e2a85c, user: { ...v_e2a85c.user, isBlocked: true, isFollowing: false } } : v_e2a85c,
      );
      v_cd488d(v_43e90c, false);
      v_889fad("신고 완료", "신고가 접수됐어요. 이 사용자는 차단됐어요.");
    } catch (v_49263d) {
      console.warn("[UserProfile] report failed:", v_49263d);
      v_889fad("실패", "신고에 실패했어요.");
    }
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.white}>
      <PageHeader
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
        title={v_8fecb8}
        rightAction={

          !v_0c8fa1 && v_727031 ? (
            <TouchableOpacity
              onPress={() => v_eda097(true)}
              hitSlop={12}
              style={{ padding: 8 }}
              accessibilityLabel="더 보기"
            >
              <Feather name="more-vertical" size={22} color={v_1bfbd0.zinc900} />
            </TouchableOpacity>
          ) : null
        }
      />

      {v_683210 ? (
        <View style={v_fd5f43.center}>
          <ActivityIndicator color={v_1bfbd0.zinc500} />
        </View>
      ) : v_5e9bfe || !v_727031 ? (
        <View style={v_fd5f43.center}>
          <Feather name="alert-circle" size={32} color={v_1bfbd0.zinc400} />
          <Text style={v_fd5f43.errorText}>{v_5e9bfe ?? "프로필을 불러올 수 없어요"}</Text>
          <TouchableOpacity onPress={v_f6f5de} style={v_fd5f43.retryBtn}>
            <Text style={v_fd5f43.retryBtnText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={v_727031.clones}
          numColumns={v_a564de}
          keyExtractor={(v_23805a) => String(v_23805a.id)}
          renderItem={v_3a0774}
          contentContainerStyle={{
            paddingHorizontal: v_3bf7ea,
            paddingBottom: 32,
          }}
          ListHeaderComponent={
            <>
              {}
              <View style={v_fd5f43.profileSection}>
                <View style={v_fd5f43.profileLeft}>
                  {v_727031.user.avatarUrl ? (
                    <Image
                      source={{ uri: v_727031.user.avatarUrl }}
                      style={v_fd5f43.profileAvatar}
                    />
                  ) : (
                    <View
                      style={[v_fd5f43.profileAvatar, v_fd5f43.profileAvatarPlaceholder]}
                    >
                      <Feather name="user" size={28} color={v_1bfbd0.zinc400} />
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: 26 }}>
                    <Text style={v_fd5f43.profileName} numberOfLines={1}>
                      {v_727031.user.name ?? "사용자"}
                    </Text>
                    <View style={v_fd5f43.profileStatsRow}>
                      <TouchableOpacity
                        style={v_fd5f43.profileStatItem}
                        onPress={() => v_956c7b("followers")}
                      >
                        <Text style={v_fd5f43.profileStatValue}>
                          {v_727031.user.followersCount}
                        </Text>
                        <Text style={v_fd5f43.profileStatLabel}>팔로워</Text>
                      </TouchableOpacity>
                      <View style={v_fd5f43.profileStatDivider} />
                      <TouchableOpacity
                        style={v_fd5f43.profileStatItem}
                        onPress={() => v_956c7b("following")}
                      >
                        <Text style={v_fd5f43.profileStatValue}>
                          {v_727031.user.followingCount}
                        </Text>
                        <Text style={v_fd5f43.profileStatLabel}>팔로잉</Text>
                      </TouchableOpacity>
                      <View style={v_fd5f43.profileStatDivider} />
                      <View style={v_fd5f43.profileStatItem}>
                        <Text style={v_fd5f43.profileStatValue}>
                          {v_727031.clones.length}
                        </Text>
                        <Text style={v_fd5f43.profileStatLabel}>클론</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {!v_0c8fa1 && (
                  <TouchableOpacity
                    onPress={v_c5469e}
                    disabled={v_79e290}
                    activeOpacity={0.85}
                    style={[
                      v_fd5f43.followBtn,
                      (v_e1bd47 || v_727031.user.isFollowing) &&
                        v_fd5f43.followBtnFollowing,
                    ]}
                  >
                    {v_79e290 ? (
                      <ActivityIndicator
                        size="small"
                        color={
                          v_e1bd47 || v_727031.user.isFollowing
                            ? v_1bfbd0.zinc900
                            : v_1bfbd0.white
                        }
                      />
                    ) : (
                      <Text
                        style={[
                          v_fd5f43.followBtnText,
                          (v_e1bd47 || v_727031.user.isFollowing) &&
                            v_fd5f43.followBtnTextFollowing,
                        ]}
                      >
                        {v_e1bd47 || v_727031.user.isFollowing
                          ? "팔로잉"
                          : "팔로우"}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              <Text style={v_fd5f43.sectionTitle}>
                만든 클론 ({v_727031.clones.length})
              </Text>
            </>
          }
          ListEmptyComponent={
            <View style={v_fd5f43.empty}>
              <Feather name="users" size={32} color={v_1bfbd0.zinc300} />
              <Text style={v_fd5f43.emptyText}>아직 만든 클론이 없어요</Text>
            </View>
          }
        />
      )}

      {}
      <Modal visible={v_3e9618} transparent animationType="fade">
        <Pressable style={v_fd5f43.moreOverlay} onPress={() => v_eda097(false)}>
          <SwipeDownSheet
            onClose={() => v_eda097(false)}
            style={[v_fd5f43.moreSheet, { paddingBottom: 24 + Math.max(v_033e14.bottom, 0) }]}
          >
            <View style={v_fd5f43.moreSheetHandle} />
            <Text style={v_fd5f43.moreTitle}>{v_b7489c}</Text>
            <TouchableOpacity
              style={v_fd5f43.moreItem}
              onPress={() => {
                v_eda097(false);
                v_9b20ec(true);
              }}
            >
              <Feather name="flag" size={20} color="#ef4444" />
              <Text style={[v_fd5f43.moreItemText, { color: "#ef4444" }]}>신고하기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[v_fd5f43.moreItem, { borderBottomWidth: 0 }]}
              onPress={v_21738e}
            >
              <Feather
                name={v_4258ec ? "unlock" : "slash"}
                size={20}
                color={v_1bfbd0.zinc900}
              />
              <Text style={v_fd5f43.moreItemText}>
                {v_4258ec ? "차단 해제" : "차단하기"}
              </Text>
            </TouchableOpacity>
          </SwipeDownSheet>
        </Pressable>
      </Modal>

      {}
      <ReportReasonModal
        visible={v_d61813}
        targetName={v_b7489c}
        onCancel={() => v_9b20ec(false)}
        onConfirm={v_2ecc65}
      />
    </SafeView>
  );
}

const v_fd5f43 = v_472849.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { color: v_1bfbd0.zinc500, fontSize: 14 },
  retryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: v_1bfbd0.zinc100,
    borderRadius: v_8b0c90.md,
  },
  retryBtnText: { fontSize: 13, fontWeight: "600", color: v_1bfbd0.zinc900 },

  profileSection: {
    paddingTop: 20,
    paddingBottom: 14,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  profileLeft: { flexDirection: "row", alignItems: "center" },
  profileAvatar: { width: 64, height: 64, borderRadius: 32 },
  profileAvatarPlaceholder: {
    backgroundColor: v_1bfbd0.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontSize: 17,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
    marginBottom: 8,
  },
  profileStatsRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  profileStatItem: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  profileStatValue: { fontSize: 14, fontWeight: "700", color: v_1bfbd0.zinc900 },
  profileStatLabel: { fontSize: 12, color: v_1bfbd0.zinc500 },
  profileStatDivider: { width: 1, height: 12, backgroundColor: v_1bfbd0.zinc200 },

  followBtn: {
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: v_8b0c90.md,
    backgroundColor: v_1bfbd0.violet600,
    alignItems: "center",
    justifyContent: "center",
  },
  followBtnFollowing: {
    backgroundColor: v_1bfbd0.zinc100,
  },
  followBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: v_1bfbd0.white,
  },
  followBtnTextFollowing: {
    color: v_1bfbd0.zinc900,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  cellImageWrap: { borderRadius: v_8b0c90.sm, overflow: "hidden" },
  cellImage: { width: "100%", height: "100%", backgroundColor: v_1bfbd0.zinc100 },
  cellPlaceholder: { alignItems: "center", justifyContent: "center" },
  cellName: {
    fontSize: 12,
    fontWeight: "600",
    color: v_1bfbd0.zinc900,
    marginTop: 6,
  },
  cellSub: { fontSize: 11, color: v_1bfbd0.zinc500, marginTop: 1 },

  empty: { alignItems: "center", paddingTop: 40, gap: 8 },
  emptyText: { fontSize: 13, color: v_1bfbd0.zinc500 },

  moreOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  moreSheet: {
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
  },
  moreSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: v_1bfbd0.zinc300,
    alignSelf: "center",
    marginVertical: 12,
  },
  moreTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: v_1bfbd0.zinc500,
    textAlign: "center",
    marginBottom: 8,
  },
  moreItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  moreItemText: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc900 },
});
