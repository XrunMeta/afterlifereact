

import v_a3453e, { v_de06a3, v_c4deb2, v_df9f57, v_e662ae, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_79c4f2,
  v_4623af,
  v_9cabcb,
  v_cf9c33,
  v_39a996,
  v_700696,
  v_09d0e5,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import type { v_5b8240 } from "ykfzqfftuciufdadykzsyvzknqnwb";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import v_556baf from "../../components/ui/SafeView";
import { v_1ed7d9 } from "../../stores/authStore";
import {
  v_f5cc38,
  type v_4c75cf,
} from "../../api/clones";
import { v_a41961, type v_3a673b } from "../../api/auth";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import type { v_97a9a8 } from "../../navigation/types";

type TabNav = v_5b8240<v_97a9a8>;

const v_296ef9 = 2; 
const v_f229b8 = 3;

type TabKey = "recommend" | "clone" | "account" | "tag";
const v_1bc355 = [
  { key: "recommend", label: "추천" },
  { key: "clone", label: "클론" },
  { key: "account", label: "계정" },
  { key: "tag", label: "태그" },
];

export default function v_5db6c6() {
  const v_3c9f12 = v_ada615<TabNav>();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_033e14 = v_e0068c();

  const [v_7c5791, v_c57190] = v_5ab095("");
  const [v_ac1d22, v_02dd63] = v_5ab095<TabKey>("recommend");
  const [v_632473, v_5593fb] = v_5ab095<v_4c75cf[]>([]);
  const [v_9debb9, v_dbbd5d] = v_5ab095(true);
  const [v_de7ba7, v_28d82a] = v_5ab095<v_3a673b[]>([]);
  const [v_866dc6, v_7c1422] = v_5ab095(false);

  const v_bcfa24 = v_700696.get("window").width;
  const v_af8b43 = v_df9f57(
    () => Math.floor((v_bcfa24 - v_296ef9 * (v_f229b8 - 1)) / v_f229b8),
    [v_bcfa24],
  );

  const v_b0ad70 = v_de06a3(async () => {
    v_dbbd5d(true);
    try {
      const v_8f00b9 = await v_f5cc38({
        limit: 60,
        accessToken: v_2ca7e0 ?? null,
      });
      v_5593fb(v_8f00b9.items);
    } catch (v_49263d) {
      console.warn("[Search] discover fetch failed:", v_49263d);
    } finally {
      v_dbbd5d(false);
    }
  }, [v_2ca7e0]);

  v_c4deb2(() => {
    v_b0ad70();
  }, [v_b0ad70]);

  const v_f47618 = v_e662ae<ReturnType<typeof setTimeout> | null>(null);
  v_c4deb2(() => {
    if (v_f47618.current) clearTimeout(v_f47618.current);
    const v_ab6401 = v_7c5791.trim();
    if (!v_ab6401 || !v_2ca7e0) {
      v_28d82a([]);
      return;
    }
    v_f47618.current = setTimeout(async () => {
      v_7c1422(true);
      try {
        const v_8f00b9 = await v_a41961(v_2ca7e0, v_ab6401);
        v_28d82a(v_8f00b9.items);
      } catch (v_49263d) {
        console.warn("[Search] searchUsers failed:", v_49263d);
        v_28d82a([]);
      } finally {
        v_7c1422(false);
      }
    }, 300);
    return () => {
      if (v_f47618.current) clearTimeout(v_f47618.current);
    };
  }, [v_7c5791, v_2ca7e0]);

  const v_3ddc98 = v_7c5791.trim().length > 0;

  const v_ff422a = v_df9f57(() => {
    const v_ab6401 = v_7c5791.trim().toLowerCase();
    if (!v_ab6401) return v_632473;
    return v_632473.filter((v_8b5cd8) => {
      const v_1833e7 = v_8b5cd8.clone.name.toLowerCase();
      const v_1ed516 = v_8b5cd8.clone.username.toLowerCase();
      const v_3e7de0 = v_8b5cd8.interests.some((v_23805a) =>
        v_23805a.toLowerCase().includes(v_ab6401),
      );
      const v_73c4d7 = (v_8b5cd8.content ?? "").toLowerCase().includes(v_ab6401);
      return (
        v_1833e7.includes(v_ab6401) ||
        v_1ed516.includes(v_ab6401) ||
        v_3e7de0 ||
        v_73c4d7
      );
    });
  }, [v_632473, v_7c5791]);

  const v_e12281 = v_df9f57(() => {
    const v_ab6401 = v_7c5791.trim().toLowerCase();
    const v_110a8b = new Set<number>();
    const out: v_4c75cf["clone"][] = [];
    for (const v_8b5cd8 of v_632473) {
      if (v_110a8b.has(v_8b5cd8.clone.id)) continue;
      v_110a8b.add(v_8b5cd8.clone.id);
      if (
        !v_ab6401 ||
        v_8b5cd8.clone.name.toLowerCase().includes(v_ab6401) ||
        v_8b5cd8.clone.username.toLowerCase().includes(v_ab6401)
      ) {
        v_8d4337.push(v_8b5cd8.clone);
      }
    }
    return v_8d4337;
  }, [v_632473, v_7c5791]);

  const v_fc704f = v_df9f57(() => {
    const v_ab6401 = v_7c5791.trim().toLowerCase();
    const v_bb8024 = new Set<string>();
    for (const v_8b5cd8 of v_632473) for (const v_23805a of v_8b5cd8.interests) v_bb8024.add(v_23805a);
    const v_48c915 = Array.from(v_bb8024);
    if (!v_ab6401) return v_48c915.slice(0, 30);
    return v_48c915.filter((v_8d41d7) => v_8d41d7.toLowerCase().includes(v_ab6401));
  }, [v_632473, v_7c5791]);

  const v_74ecfc = (v_6e0fd3) => {

    v_3c9f12.navigate("ClonesTab", { screen: "CloneDetail", params: { cloneId: v_6e0fd3 } });
  };

  const v_71d43d = ({
    item: v_8c0b26,
    index: v_a56041,
  }: {
    item: v_4c75cf;
    index: number;
  }) => {
    const v_c8b83f = v_a56041 % v_f229b8;
    const v_d88de1 = v_c8b83f < v_f229b8 - 1 ? v_296ef9 : 0;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => v_74ecfc(v_8c0b26.cloneId)}
        style={{ width: v_af8b43, height: v_af8b43, marginRight: v_d88de1, marginBottom: v_296ef9 }}
      >
        {v_8c0b26.mediaUrl ? (
          <Image source={{ uri: v_8c0b26.mediaUrl }} style={v_fd5f43.cellImage} />
        ) : (
          <View style={[v_fd5f43.cellImage, v_fd5f43.cellPlaceholder]}>
            <Feather name="image" size={24} color={v_1bfbd0.zinc400} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const v_51e832 = ({ item: v_8c0b26 }: { item: v_4c75cf["clone"] }) => (
    <TouchableOpacity style={v_fd5f43.row} onPress={() => v_74ecfc(v_8c0b26.id)}>
      {v_8c0b26.avatarUrl ? (
        <Image source={{ uri: v_8c0b26.avatarUrl }} style={v_fd5f43.rowAvatar} />
      ) : (
        <View style={[v_fd5f43.rowAvatar, v_fd5f43.rowAvatarPh]}>
          <Feather name="user" size={20} color={v_1bfbd0.zinc400} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={v_fd5f43.rowName} numberOfLines={1}>
          {v_8c0b26.name}
        </Text>
        <Text style={v_fd5f43.rowSub} numberOfLines={1}>
          @{v_8c0b26.username}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const v_358f4f = ({ item: v_8c0b26 }: { item: v_3a673b }) => (
    <View style={v_fd5f43.row}>
      {v_8c0b26.avatarUrl ? (
        <Image source={{ uri: v_8c0b26.avatarUrl }} style={v_fd5f43.rowAvatar} />
      ) : (
        <View style={[v_fd5f43.rowAvatar, v_fd5f43.rowAvatarPh]}>
          <Feather name="user" size={20} color={v_1bfbd0.zinc400} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={v_fd5f43.rowName} numberOfLines={1}>
          {v_8c0b26.name ?? v_8c0b26.email}
        </Text>
        <Text style={v_fd5f43.rowSub} numberOfLines={1}>
          {v_8c0b26.email}
        </Text>
      </View>
    </View>
  );

  const v_854a87 = ({ item: v_8c0b26 }: { item: string }) => (
    <Pressable style={v_fd5f43.row} onPress={() => v_c57190(v_8c0b26)}>
      <View style={[v_fd5f43.rowAvatar, v_fd5f43.rowAvatarTag]}>
        <Feather name="hash" size={20} color={v_1bfbd0.zinc700} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={v_fd5f43.rowName} numberOfLines={1}>
          #{v_8c0b26}
        </Text>
      </View>
    </Pressable>
  );

  const v_e544cb = ({ label: v_2869c1 }: { label: string }) => (
    <View style={v_fd5f43.empty}>
      <Feather name="search" size={36} color={v_1bfbd0.zinc300} />
      <Text style={v_fd5f43.emptyText}>{v_2869c1}</Text>
    </View>
  );

  return (
    <SafeView backgroundColor={v_1bfbd0.white} showBottomBackground={false}>
      {}
      <View style={[v_fd5f43.searchWrap, { paddingTop: 8 }]}>
        <View style={v_fd5f43.searchBar}>
          <Feather name="search" size={18} color={v_1bfbd0.zinc500} />
          <TextInput
            style={v_fd5f43.searchInput}
            value={v_7c5791}
            onChangeText={v_c57190}
            placeholder="태그나 닉네임 검색"
            placeholderTextColor={v_1bfbd0.zinc400}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {v_7c5791.length > 0 && (
            <TouchableOpacity onPress={() => v_c57190("")} hitSlop={8}>
              <Feather name="x-circle" size={18} color={v_1bfbd0.zinc400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {v_3ddc98 ? (
        <>
          {}
          <View style={v_fd5f43.tabRow}>
            {v_1bc355.map((v_11083e) => {
              const v_f8b770 = v_ac1d22 === v_11083e.key;
              return (
                <TouchableOpacity
                  key={v_11083e.key}
                  style={v_fd5f43.tabItem}
                  onPress={() => v_02dd63(v_11083e.key)}
                >
                  <Text style={[v_fd5f43.tabLabel, v_f8b770 && v_fd5f43.tabLabelActive]}>
                    {v_11083e.label}
                  </Text>
                  {v_f8b770 && <View style={v_fd5f43.tabUnderline} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {}
          {v_ac1d22 === "recommend" && (
            v_9debb9 ? (
              <ActivityIndicator style={v_fd5f43.loader} color={v_1bfbd0.zinc500} />
            ) : v_ff422a.length === 0 ? (
              <EmptyResult label="검색 결과가 없어요" />
            ) : (
              <FlatList
                data={v_ff422a}
                keyExtractor={(v_23805a) => String(v_23805a.id)}
                renderItem={v_71d43d}
                numColumns={v_f229b8}
                contentContainerStyle={{ paddingBottom: v_033e14.bottom + 32 }}
              />
            )
          )}

          {v_ac1d22 === "clone" && (
            v_e12281.length === 0 ? (
              <EmptyResult label="일치하는 클론이 없어요" />
            ) : (
              <FlatList
                data={v_e12281}
                keyExtractor={(v_23805a) => String(v_23805a.id)}
                renderItem={v_51e832}
                contentContainerStyle={{ paddingBottom: v_033e14.bottom + 32 }}
              />
            )
          )}

          {v_ac1d22 === "account" && (
            v_866dc6 ? (
              <ActivityIndicator style={v_fd5f43.loader} color={v_1bfbd0.zinc500} />
            ) : v_de7ba7.length === 0 ? (
              <EmptyResult label="일치하는 계정이 없어요" />
            ) : (
              <FlatList
                data={v_de7ba7}
                keyExtractor={(v_23805a) => String(v_23805a.id)}
                renderItem={v_358f4f}
                contentContainerStyle={{ paddingBottom: v_033e14.bottom + 32 }}
              />
            )
          )}

          {v_ac1d22 === "tag" && (
            v_fc704f.length === 0 ? (
              <EmptyResult label="일치하는 태그가 없어요" />
            ) : (
              <FlatList
                data={v_fc704f}
                keyExtractor={(v_23805a) => v_23805a}
                renderItem={v_854a87}
                contentContainerStyle={{ paddingBottom: v_033e14.bottom + 32 }}
              />
            )
          )}
        </>
      ) : (

        v_9debb9 ? (
          <ActivityIndicator style={v_fd5f43.loader} color={v_1bfbd0.zinc500} />
        ) : (
          <FlatList
            data={v_632473}
            keyExtractor={(v_23805a) => String(v_23805a.id)}
            renderItem={v_71d43d}
            numColumns={v_f229b8}
            contentContainerStyle={{ paddingBottom: v_033e14.bottom + 32 }}
            showsVerticalScrollIndicator={false}
          />
        )
      )}
    </SafeView>
  );
}

const v_fd5f43 = v_472849.create({
  searchWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: v_1bfbd0.white,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    height: 40,
    backgroundColor: v_1bfbd0.zinc100,
    borderRadius: v_8b0c90.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: v_1bfbd0.zinc900,
    padding: 0,
  },

  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    position: "relative",
  },
  tabLabel: { fontSize: 14, fontWeight: "500", color: v_1bfbd0.zinc500 },
  tabLabelActive: { color: v_1bfbd0.zinc900, fontWeight: "700" },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: "25%",
    right: "25%",
    height: 2,
    backgroundColor: v_1bfbd0.zinc900,
  },

  cellImage: { width: "100%", height: "100%", backgroundColor: v_1bfbd0.zinc100 },
  cellPlaceholder: { alignItems: "center", justifyContent: "center" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  rowAvatar: { width: 44, height: 44, borderRadius: 22 },
  rowAvatarPh: {
    backgroundColor: v_1bfbd0.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  rowAvatarTag: { backgroundColor: v_1bfbd0.zinc100, alignItems: "center", justifyContent: "center" },
  rowName: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
  rowSub: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },

  loader: { paddingTop: 60 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { color: v_1bfbd0.zinc500, fontSize: 14 },
});
