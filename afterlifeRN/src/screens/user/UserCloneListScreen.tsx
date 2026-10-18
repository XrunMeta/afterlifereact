

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
import { v_b4902e } from "../../stores/followStore";
import { v_9fd740, type v_d64743 } from "../../api/users";

import { v_d60cdf } from "../../api/clones";
import type { v_8ad91b } from "../../navigation/types";

type RouteProps = v_ee3714<v_8ad91b, "UserCloneList">;
type NavProp = v_390fcc<v_8ad91b>;

export default function v_dab470() {
  const { t: v_8d41d7 } = v_772971();
  const v_c65f5d = v_ada615<NavProp>();
  const v_c7daf6 = v_2d8264<RouteProps>();
  const { userId: v_43e90c } = v_c7daf6.params;
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);

  const v_1e752a = v_b4902e((v_fd5f43) => v_fd5f43.follows);
  const v_b30b81 = v_b4902e((v_fd5f43) => v_fd5f43.isFollowing);
  const v_3094d4 = v_b4902e((v_fd5f43) => v_fd5f43.toggleFollow);
  const v_931ef7 = v_b4902e((v_fd5f43) => v_fd5f43.hydrate);
  const v_4c9ed3 = v_b4902e((v_fd5f43) => v_fd5f43.hydrated);
  void v_1e752a; 

  v_c4deb2(() => {
    if (!v_4c9ed3) void v_931ef7();
  }, [v_4c9ed3, v_931ef7]);

  const [v_4622b9, v_fa923c] = v_5ab095<v_d64743[]>([]);
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_5e9bfe, v_3a7d09] = v_5ab095<string | null>(null);

  const v_44e218 = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser?.id ?? null);
  const v_0c8fa1 = v_44e218 != null && v_44e218 === v_43e90c;

  const v_f6f5de = v_de06a3(async () => {
    if (!v_2ca7e0) return;
    v_34a50a(true);
    v_3a7d09(null);
    try {
      if (v_0c8fa1) {

        const v_8f00b9 = await v_d60cdf(v_2ca7e0);
        const mapped: v_d64743[] = v_8f00b9.items.map((v_3f4e2e) => ({
          id: v_3f4e2e.id,
          name: v_3f4e2e.name,
          username: v_3f4e2e.username,
          description: v_3f4e2e.description ?? null,
          cloneType: v_3f4e2e.cloneType as string,
          category: v_3f4e2e.category ?? null,
          avatarUrl: v_3f4e2e.avatarUrl ?? null,
          visibility: v_3f4e2e.visibility as string,
          followersCount: v_3f4e2e.followersCount ?? 0,
          likesCount: v_3f4e2e.likesCount ?? 0,
          createdAt: v_3f4e2e.createdAt,
        }));
        v_fa923c(v_f15433);
      } else {
        const v_727031 = await v_9fd740(v_2ca7e0, v_43e90c);
        v_fa923c(v_727031.clones);
      }
    } catch (v_49263d) {
      console.warn("[UserCloneList] load failed:", v_49263d);
      v_3a7d09(
        (v_49263d as Error).message ??
          v_8d41d7("user.cloneListLoadFailed", { defaultValue: "불러오지 못했어요." }),
      );
    } finally {
      v_34a50a(false);
    }
  }, [v_2ca7e0, v_43e90c, v_0c8fa1, v_8d41d7]);

  v_c4deb2(() => {
    v_f6f5de();
  }, [v_f6f5de]);

  const v_74ecfc = (c: v_d64743) => {
    v_c65f5d.push("CloneFeed", {
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
          visibility: v_3f4e2e.visibility as never,
        },
        interests: [],
      },
    });
  };

  const v_f6ad52 = ({ item: v_8c0b26 }: { item: v_d64743 }) => {
    const v_10387a = v_b30b81(v_8c0b26.id);
    return (
      <TouchableOpacity
        style={v_fd5f43.row}
        onPress={() => v_74ecfc(v_8c0b26)}
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
            {v_8c0b26.name}
          </Text>
          <Text style={v_fd5f43.sub} numberOfLines={1}>
            @{v_8c0b26.username}
          </Text>
        </View>
        {}
        {!v_0c8fa1 && (
          <TouchableOpacity
            onPress={(v_9e86fd) => {
              v_9e86fd.stopPropagation?.();
              void v_3094d4(v_8c0b26.id);
            }}
            style={[v_fd5f43.followBtn, v_10387a && v_fd5f43.followBtnActive]}
            activeOpacity={0.8}
          >
            <Text style={[v_fd5f43.followBtnText, v_10387a && v_fd5f43.followBtnTextActive]}>
              {v_10387a
                ? v_8d41d7("user.subscribingBtn", { defaultValue: "구독중" })
                : v_8d41d7("user.subscribeBtn", { defaultValue: "구독" })}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const v_9f1622 = v_8d41d7("user.statClones", { defaultValue: "클론" });

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
          <Feather name="user" size={32} color={v_1bfbd0.zinc300} />
          <Text style={v_fd5f43.emptyText}>
            {v_8d41d7("user.cloneListEmpty", { defaultValue: "아직 만든 클론이 없어요" })}
          </Text>
        </View>
      ) : (
        <FlatList
          data={v_4622b9}
          keyExtractor={(v_23805a) => String(v_23805a.id)}
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
  sub: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: v_8b0c90.full,
    backgroundColor: v_1bfbd0.primary,
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
