

import { v_889fad } from "../../stores/dialogStore";
import v_a3453e, { v_de06a3, v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_39a996,
  v_cf9c33,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_cf763b, v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import { v_772971 } from "jmpfvteuuztnp";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import type { v_e57140 } from "../../navigation/types";
import { v_1ed7d9 } from "../../stores/authStore";
import {
  v_dbedc9,
  v_c0dd8d,
  type v_370311,
} from "../../api/clones";
import { v_83b07d } from "../../api/users";

const v_28895b = (it: v_370311) => `${v_23805a.type}-${v_23805a.blockId}`;

export default function v_9232cf() {
  const v_c65f5d = v_ada615<v_390fcc<v_e57140>>();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const { t: v_8d41d7 } = v_772971();

  const [v_4622b9, v_fa923c] = v_5ab095<v_370311[]>([]);
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_426335, v_70378d] = v_5ab095<string | null>(null);
  const [v_11083e, v_94ee83] = v_5ab095<"user" | "clone">("user");

  const v_62f9dc = (item: v_370311) => {
    if (v_8c0b26.type === "user") {
      (v_c65f5d as unknown as { navigate: (n: string, p?: object) => void }).navigate(
        "UserProfile",
        { userId: v_8c0b26.user.id },
      );
    } else {
      const v_3f4e2e = v_8c0b26.clone;
      (v_c65f5d as unknown as { navigate: (n: string, p?: object) => void }).navigate("CloneFeed", {
        feed: {
          id: -v_3f4e2e.id,
          cloneId: v_3f4e2e.id,
          content: "",
          mediaUrl: v_3f4e2e.avatarUrl,
          mediaType: null,
          likesCount: 0,
          commentsCount: 0,
          likedByMe: false,
          createdAt: new Date().toISOString(),
          clone: {
            id: v_3f4e2e.id,
            ownerId: v_3f4e2e.ownerId,
            name: v_3f4e2e.name,
            username: v_3f4e2e.username,
            avatarUrl: v_3f4e2e.avatarUrl,
            cloneType: v_3f4e2e.cloneType,
            visibility: v_3f4e2e.visibility,
          },
          interests: [],
        },
      });
    }
  };

  const v_1a1b9b = v_de06a3(async () => {
    if (!v_2ca7e0) {
      v_fa923c([]);
      v_34a50a(false);
      return;
    }
    v_34a50a(true);
    try {
      const v_8f00b9 = await v_dbedc9(v_2ca7e0);
      v_fa923c(v_8f00b9.items);
    } catch (v_49263d) {
      console.warn("[Privacy] listMyBlocks failed:", v_49263d);
    } finally {
      v_34a50a(false);
    }
  }, [v_2ca7e0]);

  v_c4deb2(() => {
    v_1a1b9b();
  }, [v_1a1b9b]);

  v_cf763b(
    v_a3453e.useCallback(() => {
      v_1a1b9b();
    }, [v_1a1b9b]),
  );

  const v_55b20d = (item: v_370311) => {
    const v_2869c1 =
      v_8c0b26.type === "clone"
        ? v_8c0b26.clone.name
        : v_8c0b26.user.name || v_8c0b26.user.email.split("@")[0];
    const v_b24339 = v_28895b(v_8c0b26);
    v_889fad(
      v_8d41d7("settings.privacy.unblockConfirmTitle", { defaultValue: "차단 해제" }),
      v_8d41d7("settings.privacy.unblockConfirmDesc", { name: v_2869c1, defaultValue: "{{name}} 차단을 해제하시겠어요?" }),
      [
        { text: v_8d41d7("common.cancel", { defaultValue: "취소" }), style: "cancel" },
        {
          text: v_8d41d7("settings.privacy.unblockConfirmOk", { defaultValue: "해제" }),
          onPress: async () => {
            if (!v_2ca7e0) return;
            v_70378d(v_b24339);
            try {
              if (v_8c0b26.type === "clone") {
                await v_c0dd8d(v_2ca7e0, v_8c0b26.clone.id);
              } else {
                await v_83b07d(v_2ca7e0, v_8c0b26.user.id);
              }
              v_fa923c((v_ba2215) => v_ba2215.filter((v_148ff6) => v_28895b(v_148ff6) !== v_b24339));
            } catch (v_49263d) {
              const v_badeaf = v_49263d instanceof Error ? v_49263d.message : v_8d41d7("settings.privacy.unblockFailed", { defaultValue: "해제에 실패했어요." });
              v_889fad(v_8d41d7("common.error", { defaultValue: "오류" }), v_badeaf);
            } finally {
              v_70378d(null);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeScrollView backgroundColor={v_1bfbd0.white} showBottomBackground={false}>
      <PageHeader
        title={v_8d41d7("settings.privacy.title")}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />

      {}
      <View style={v_fd5f43.tabBar}>
        {(["user", "clone"] as const).map((v_9edd60) => {
          const v_9e8c70 = v_4622b9.filter((v_23805a) => v_23805a.type === v_9edd60).length;
          const v_f8b770 = v_11083e === v_9edd60;
          const v_4c59c8 = v_9edd60 === "user"
            ? v_8d41d7("settings.privacy.tabUser", { defaultValue: "유저" })
            : v_8d41d7("settings.privacy.tabClone", { defaultValue: "페르소나" });
          return (
            <TouchableOpacity
              key={v_9edd60}
              style={[v_fd5f43.tab, v_f8b770 && v_fd5f43.tabActive]}
              onPress={() => v_94ee83(v_9edd60)}
            >
              <Text style={[v_fd5f43.tabText, v_f8b770 && v_fd5f43.tabTextActive]}>
                {v_9e8c70 > 0
                  ? v_8d41d7("settings.privacy.tabWithCount", { label: v_4c59c8, n: v_9e8c70, defaultValue: "{{label}} ({{n}})" })
                  : v_4c59c8}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={v_fd5f43.content}>
        {v_683210 ? (
          <ActivityIndicator color={v_1bfbd0.zinc500} style={{ paddingTop: 60 }} />
        ) : (
          (() => {
            const v_cf55be = v_4622b9.filter((v_23805a) => v_23805a.type === v_11083e);
            if (v_cf55be.length === 0) {
              return (
                <View style={v_fd5f43.empty}>
                  <Feather name="slash" size={36} color={v_1bfbd0.zinc300} />
                  <Text style={v_fd5f43.emptyText}>
                    {v_11083e === "user"
                      ? v_8d41d7("settings.privacy.emptyUser", { defaultValue: "차단한 유저가 없어요" })
                      : v_8d41d7("settings.privacy.emptyClone", { defaultValue: "차단한 페르소나가 없어요" })}
                  </Text>
                  <Text style={v_fd5f43.emptySub}>
                    {v_11083e === "user"
                      ? v_8d41d7("settings.privacy.emptyUserHint", { defaultValue: "사용자 프로필에서 차단할 수 있어요" })
                      : v_8d41d7("settings.privacy.emptyCloneHint", { defaultValue: "페르소나 메뉴에서 차단할 수 있어요" })}
                  </Text>
                </View>
              );
            }
            return (
              <View style={v_fd5f43.card}>
                {v_cf55be.map((v_23805a, v_ebec57) => {
                  const v_b24339 = v_28895b(v_23805a);
                  const v_bf6b43 =
                    v_23805a.type === "clone" ? v_23805a.clone.avatarUrl : v_23805a.user.avatarUrl;
                  const v_1833e7 =
                    v_23805a.type === "clone"
                      ? v_23805a.clone.name
                      : v_23805a.user.name || v_23805a.user.email.split("@")[0];
                  const v_1ae212 =
                    v_23805a.type === "clone" ? `@${v_23805a.clone.username}` : v_23805a.user.email;
                  const v_3f8465 = v_426335 === v_b24339;
                  return (
                    <View key={v_b24339}>
                      <View style={v_fd5f43.row}>
                        <TouchableOpacity
                          style={v_fd5f43.rowMain}
                          onPress={() => v_62f9dc(v_23805a)}
                          activeOpacity={0.6}
                        >
                          {v_bf6b43 ? (
                            <Image source={{ uri: v_bf6b43 }} style={v_fd5f43.avatar} />
                          ) : (
                            <View style={[v_fd5f43.avatar, v_fd5f43.avatarPh]}>
                              <Feather name="user" size={20} color={v_1bfbd0.zinc400} />
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={v_fd5f43.rowName} numberOfLines={1}>
                              {v_1833e7}
                            </Text>
                            <Text style={v_fd5f43.rowSub} numberOfLines={1}>
                              {v_1ae212}
                            </Text>
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[v_fd5f43.unblockBtn, v_3f8465 && { opacity: 0.6 }]}
                          onPress={() => v_55b20d(v_23805a)}
                          disabled={v_3f8465}
                        >
                          {v_3f8465 ? (
                            <ActivityIndicator size="small" color={v_1bfbd0.white} />
                          ) : (
                            <Text style={v_fd5f43.unblockText}>{v_8d41d7("settings.privacy.unblockBtn", { defaultValue: "차단 해제" })}</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                      {v_ebec57 < v_cf55be.length - 1 && <View style={v_fd5f43.divider} />}
                    </View>
                  );
                })}
              </View>
            );
          })()
        )}
      </View>
    </SafeScrollView>
  );
}

const v_fd5f43 = v_472849.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 780,
    alignSelf: "center",
    width: "100%",
  },
  card: {
    backgroundColor: v_1bfbd0.white,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: v_8b0c90.lg,
    overflow: "hidden",
  },
  tabBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxWidth: 780,
    alignSelf: "center",
    width: "100%",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: v_8b0c90.md,
    alignItems: "center",
    backgroundColor: v_1bfbd0.zinc100,
  },
  tabActive: { backgroundColor: v_1bfbd0.zinc900 },
  tabText: { fontSize: 13, fontWeight: "700", color: v_1bfbd0.zinc500 },
  tabTextActive: { color: v_1bfbd0.white },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPh: {
    backgroundColor: v_1bfbd0.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  rowName: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc900 },
  rowSub: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  unblockBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: v_1bfbd0.zinc900,
    minWidth: 78,
    alignItems: "center",
  },
  unblockText: { fontSize: 12, fontWeight: "700", color: v_1bfbd0.white },
  divider: { height: 1, backgroundColor: v_1bfbd0.zinc100, marginLeft: 72 },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { color: v_1bfbd0.zinc600, fontSize: 14, fontWeight: "600" },
  emptySub: { color: v_1bfbd0.zinc400, fontSize: 12 },
});
