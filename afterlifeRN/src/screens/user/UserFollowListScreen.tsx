

import v_a3453e, { v_de06a3, v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_cf9c33,
  v_9cabcb,
  v_39a996,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_ada615, v_2d8264, type v_ee3714 } from "ixigazcpvfldbecwtbvavtbi";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import { v_772971 } from "jmpfvteuuztnp";
import v_556baf from "../../components/ui/SafeView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_98d20a } from "../../stores/userFollowStore";
import {
  v_00fbca,
  v_5959d8,
  type v_7428e9,
} from "../../api/users";
import type { v_8ad91b } from "../../navigation/types";

type RouteProps = v_ee3714<v_8ad91b, "UserFollowList">;
type NavProp = v_390fcc<v_8ad91b>;

export default function v_7d236a() {
  const { t: v_8d41d7 } = v_772971();
  const v_c65f5d = v_ada615<NavProp>();
  const v_c7daf6 = v_2d8264<RouteProps>();

  const { userId: v_43e90c, mode: v_34e5bb } = v_c7daf6.params;
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_f5f393 = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser?.id ?? v_fd5f43.user?.id ?? null);

  const v_da0fb9 = v_98d20a((v_72c7a6) => v_72c7a6.followingIds);
  const v_a5842c = v_98d20a((v_72c7a6) => v_72c7a6.isFollowing);
  const v_eb95ab = v_98d20a((v_72c7a6) => v_72c7a6.toggleFollow);
  const v_5721c1 = v_98d20a((v_72c7a6) => v_72c7a6.hydrate);
  const v_e8ed0f = v_98d20a((v_72c7a6) => v_72c7a6.hydrated);
  void v_da0fb9; 

  v_c4deb2(() => {
    if (!v_e8ed0f) void v_5721c1();
  }, [v_e8ed0f, v_5721c1]);

  const [v_4622b9, v_fa923c] = v_5ab095<v_7428e9[]>([]);
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_5e9bfe, v_3a7d09] = v_5ab095<string | null>(null);

  const v_f6f5de = v_de06a3(async () => {
    if (!v_2ca7e0) return;
    v_34a50a(true);
    v_3a7d09(null);
    try {
      const v_8f00b9 =
        v_34e5bb === "followers"
          ? await v_00fbca(v_2ca7e0, v_43e90c, 200)
          : await v_5959d8(v_2ca7e0, v_43e90c, 200);
      v_fa923c(v_8f00b9.items);
    } catch (v_49263d) {
      console.warn("[UserFollowList] load failed:", v_49263d);
      v_3a7d09(
        (v_49263d as Error).message ??
          v_8d41d7("user.followListLoadFailed", { defaultValue: "불러오지 못했어요." }),
      );
    } finally {
      v_34a50a(false);
    }
  }, [v_2ca7e0, v_43e90c, v_34e5bb, v_8d41d7]);

  v_c4deb2(() => {
    v_f6f5de();
  }, [v_f6f5de]);

  const v_f6ad52 = ({ item: v_8c0b26 }: { item: v_7428e9 }) => {
    const v_0c8fa1 = v_8c0b26.userId === v_f5f393;
    const v_10387a = v_a5842c(v_8c0b26.userId);
    return (
      <TouchableOpacity
        style={v_fd5f43.row}
        onPress={() => v_c65f5d.push("UserProfile", { userId: v_8c0b26.userId })}
        activeOpacity={0.7}
      >
        {v_8c0b26.avatarUrl ? (
          <Image source={{ uri: v_8c0b26.avatarUrl }} style={v_fd5f43.avatar} />
        ) : (
          <View style={[v_fd5f43.avatar, v_fd5f43.avatarPh]}>
            <Feather name="user" size={20} color={v_1bfbd0.zinc400} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={v_fd5f43.name} numberOfLines={1}>
            {v_8c0b26.name ?? v_8c0b26.email}
          </Text>
          <Text style={v_fd5f43.email} numberOfLines={1}>
            {v_8c0b26.email}
          </Text>
        </View>
        {}
        {!v_0c8fa1 && (
          <TouchableOpacity
            onPress={(v_9e86fd) => {
              v_9e86fd.stopPropagation?.();
              void v_eb95ab(v_8c0b26.userId);
            }}
            style={[v_fd5f43.followBtn, v_10387a && v_fd5f43.followBtnActive]}
            activeOpacity={0.8}
          >
            <Text style={[v_fd5f43.followBtnText, v_10387a && v_fd5f43.followBtnTextActive]}>
              {v_10387a
                ? v_8d41d7("user.followingBtn", { defaultValue: "팔로잉" })
                : v_8d41d7("user.followBtn", { defaultValue: "팔로우" })}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const v_9f1622 =
    v_34e5bb === "followers"
      ? v_8d41d7("user.statFollowers", { defaultValue: "팔로워" })
      : v_8d41d7("user.statFollowing", { defaultValue: "팔로잉" });

  return (
    <SafeView backgroundColor={v_1bfbd0.white}>
      <PageHeader
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
        title={v_9f1622}
      />
      {v_683210 ? (
        <View style={v_fd5f43.center}>
          <ActivityIndicator color={v_1bfbd0.zinc500} />
        </View>
      ) : v_5e9bfe ? (
        <View style={v_fd5f43.center}>
          <Feather name="alert-circle" size={32} color={v_1bfbd0.zinc400} />
          <Text style={v_fd5f43.errorText}>{v_5e9bfe}</Text>
        </View>
      ) : v_4622b9.length === 0 ? (
        <View style={v_fd5f43.center}>
          <Feather name="users" size={32} color={v_1bfbd0.zinc300} />
          <Text style={v_fd5f43.emptyText}>
            {v_34e5bb === "followers"
              ? v_8d41d7("user.followListEmptyFollowers", { defaultValue: "아직 팔로워가 없어요" })
              : v_8d41d7("user.followListEmptyFollowing", { defaultValue: "아직 팔로잉이 없어요" })}
          </Text>
        </View>
      ) : (
        <FlatList
          data={v_4622b9}
          keyExtractor={(v_23805a) => String(v_23805a.userId)}
          renderItem={v_f6ad52}
        />
      )}
    </SafeView>
  );
}

const v_fd5f43 = v_472849.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { color: v_1bfbd0.zinc500, fontSize: 14 },
  emptyText: { color: v_1bfbd0.zinc500, fontSize: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPh: {
    backgroundColor: v_1bfbd0.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
  email: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: v_8b0c90.full,
    backgroundColor: v_1bfbd0.violet600,
    minWidth: 70,
    alignItems: "center",
  },
  followBtnActive: {
    backgroundColor: v_1bfbd0.white,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc300,
  },
  followBtnText: { color: v_1bfbd0.white, fontSize: 13, fontWeight: "700" },
  followBtnTextActive: { color: v_1bfbd0.zinc700 },
});
