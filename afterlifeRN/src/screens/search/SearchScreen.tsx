

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
  v_0e1f26,
} from "rcmrninabrnb";
import v_e84827 from "bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_ada615, v_2d8264, v_cf763b } from "ixigazcpvfldbecwtbvavtbi";
import type { v_5b8240 } from "ykfzqfftuciufdadykzsyvzknqnwb";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_34614d } from "ixigazcpvfldbecwtbvavtbi";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_772971 } from "jmpfvteuuztnp";
import v_556baf from "../../components/ui/SafeView";
import { v_1ed7d9 } from "../../stores/authStore";
import {
  v_f5cc38,
  type v_4c75cf,
} from "../../api/clones";
import { v_a41961, type v_3a673b } from "../../api/auth";
import { v_cbe7de } from "../../lib/similarity";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import type { v_97a9a8, v_8ad91b } from "../../navigation/types";

type TabNav = v_34614d<
  v_5b8240<v_97a9a8>,
  v_390fcc<v_8ad91b>
>;

const v_296ef9 = 4; 
const v_f229b8 = 2;
const v_d056d4 = "@search_recent";
const v_0ee015 = 10;

type TabKey = "recommend" | "clone" | "account" | "tag";
const v_322c3f = [
  { key: "recommend", labelKey: "search.tabRecommend" },
  { key: "clone", labelKey: "search.tabClone" },
  { key: "account", labelKey: "search.tabAccount" },
  { key: "tag", labelKey: "search.tabTag" },
];

export default function v_5db6c6() {
  const { t: v_8d41d7 } = v_772971();
  const v_3c9f12 = v_ada615<TabNav>();
  const v_c7daf6 = v_2d8264();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_033e14 = v_e0068c();

  const [v_7c5791, v_c57190] = v_5ab095("");
  const [v_50c827, v_b6749d] = v_5ab095(false);
  const [v_ac1d22, v_02dd63] = v_5ab095<TabKey>("recommend");

  v_cf763b(
    v_a3453e.useCallback(() => {
      const v_24baff = v_c7daf6.params as { initialQuery?: string } | undefined;
      const v_fc6010 = v_24baff?.initialQuery;
      if (typeof v_fc6010 === "string" && v_fc6010.trim().length > 0) {

        const v_f23d49 = v_fc6010.replace(/^#+/, "").trim();
        v_c57190(v_f23d49);
        v_02dd63("recommend");

        v_3c9f12.setParams({ initialQuery: undefined } as never);
      }

    }, [v_c7daf6.params, v_3c9f12]),
  );
  const [v_632473, v_5593fb] = v_5ab095<v_4c75cf[]>([]);
  const [v_9debb9, v_dbbd5d] = v_5ab095(true);
  const [v_de7ba7, v_28d82a] = v_5ab095<v_3a673b[]>([]);
  const [v_866dc6, v_7c1422] = v_5ab095(false);
  const [v_4cd692, v_895d47] = v_5ab095<string[]>([]);
  const v_32f473 = v_e662ae<v_79c4f2>(null);

  const v_bcfa24 = v_700696.get("window").width;
  const v_675c6a = v_df9f57(
    () => Math.floor((v_bcfa24 - v_296ef9 * (v_f229b8 - 1)) / v_f229b8),
    [v_bcfa24],
  );

  const v_6367e4 = v_df9f57(
    () => Math.floor(v_675c6a * (16 / 9)),
    [v_675c6a],
  );

  v_c4deb2(() => {
    (async () => {
      try {
        const v_479f05 = await v_e84827.getItem(v_d056d4);
        if (v_479f05) {
          const v_8decf8 = JSON.parse(v_479f05);
          if (Array.isArray(v_8decf8)) {
            v_895d47(v_8decf8.filter((v_62c214) => typeof v_62c214 === "string").slice(0, v_0ee015));
          }
        }
      } catch (v_49263d) {
        console.warn("[Search] recent load failed:", v_49263d);
      }
    })();
  }, []);

  const v_2dbcf9 = v_de06a3(async (v_ebaa25) => {
    const v_8d41d7 = v_ebaa25.trim();
    if (!v_8d41d7) return;
    const v_a448ad = [v_8d41d7, ...v_4cd692.filter((v_62c214) => v_62c214.toLowerCase() !== v_8d41d7.toLowerCase())]
      .slice(0, v_0ee015);
    v_895d47(v_a448ad);
    try {
      await v_e84827.setItem(v_d056d4, JSON.stringify(v_a448ad));
    } catch (v_49263d) {
      console.warn("[Search] recent save failed:", v_49263d);
    }
  }, [v_4cd692]);

  const v_c26d3f = v_de06a3(async (v_ebaa25) => {
    const v_a448ad = v_4cd692.filter((v_62c214) => v_62c214 !== v_ebaa25);
    v_895d47(v_a448ad);
    try {
      await v_e84827.setItem(v_d056d4, JSON.stringify(v_a448ad));
    } catch (v_49263d) {
      console.warn("[Search] recent remove failed:", v_49263d);
    }
  }, [v_4cd692]);

  const v_e51925 = v_de06a3(async () => {
    v_895d47([]);
    try {
      await v_e84827.removeItem(v_d056d4);
    } catch (v_49263d) {
      console.warn("[Search] recent clear failed:", v_49263d);
    }
  }, []);

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
  const v_9c529a = !v_3ddc98 && v_50c827;

  const v_ff422a = v_df9f57(() => {

    const v_ab6401 = v_7c5791.trim().replace(/^#+/, "").toLowerCase();
    if (!v_ab6401) return v_632473;
    return v_632473.filter((v_8b5cd8) => {
      const v_1833e7 = v_8b5cd8.clone.name.toLowerCase();
      const v_1ed516 = v_8b5cd8.clone.username.toLowerCase();
      const v_3e7de0 = v_8b5cd8.interests.some((v_23805a) =>
        v_23805a.toLowerCase().includes(v_ab6401),
      );

      const v_73c4d7 = (v_8b5cd8.content ?? "").toLowerCase().includes(v_ab6401);

      return (
        v_1833e7.includes(v_ab6401) || v_1ed516.includes(v_ab6401) ||
        v_cbe7de(v_ab6401, v_1833e7) || v_cbe7de(v_ab6401, v_1ed516) ||
        v_3e7de0 || v_73c4d7
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
      const v_1833e7 = v_8b5cd8.clone.name.toLowerCase();
      const v_1ed516 = v_8b5cd8.clone.username.toLowerCase();
      if (
        !v_ab6401 ||
        v_1833e7.includes(v_ab6401) || v_1ed516.includes(v_ab6401) ||
        v_cbe7de(v_ab6401, v_1833e7) || v_cbe7de(v_ab6401, v_1ed516)
      ) {
        v_8d4337.push(v_8b5cd8.clone);
      }
    }
    return v_8d4337;
  }, [v_632473, v_7c5791]);

  const v_fc704f = v_df9f57(() => {

    const v_ab6401 = v_7c5791.trim().replace(/^#+/, "").toLowerCase();
    const v_bb8024 = new Set<string>();
    for (const v_8b5cd8 of v_632473) {
      for (const v_23805a of v_8b5cd8.interests) v_bb8024.add(v_23805a);
      const v_b43b74 = v_8b5cd8.content ?? "";

      const v_a49907 = v_b43b74.match(/#[a-zA-Z0-9_가-힣ᄀ-ᇿㄱ-ㆎ]+/g) ?? [];
      for (const v_35f85c of v_a49907) v_bb8024.add(v_35f85c.replace(/^#+/, ""));
    }
    const v_48c915 = Array.from(v_bb8024);
    if (!v_ab6401) return v_48c915.slice(0, 30);
    return v_48c915.filter((v_8d41d7) => v_8d41d7.toLowerCase().includes(v_ab6401));
  }, [v_632473, v_7c5791]);

  const v_8787bb = (feedItem: v_4c75cf, v_ebaa25) => {
    if (v_ebaa25) v_2dbcf9(v_ebaa25);
    v_0e1f26.dismiss();

    v_3c9f12.navigate("CloneFeed", { feed: v_e89481 });
  };

  const v_670702 = () => {
    const v_8d41d7 = v_7c5791.trim();
    if (v_8d41d7) v_2dbcf9(v_8d41d7);
    v_0e1f26.dismiss();
    v_b6749d(false);
  };

  const v_ba29e7 = (v_ebaa25) => {
    v_c57190(v_ebaa25);
    v_2dbcf9(v_ebaa25);
    v_32f473.current?.blur();
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
        onPress={() => v_8787bb(v_8c0b26, v_7c5791)}
        style={{ width: v_675c6a, height: v_6367e4, marginRight: v_d88de1, marginBottom: v_296ef9 }}
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

  const v_51e832 = ({ item: v_8c0b26 }: { item: v_4c75cf["clone"] }) => {

    const v_f9cc7f = v_632473.find((v_8b5cd8) => v_8b5cd8.cloneId === v_8c0b26.id);
    return (
      <TouchableOpacity
        style={v_fd5f43.row}
        onPress={() => {
          if (v_f9cc7f) {
            v_8787bb(v_f9cc7f, v_8c0b26.name);
          } else {

            v_8787bb(
              {
                id: -v_8c0b26.id,
                cloneId: v_8c0b26.id,
                content: null,
                mediaUrl: v_8c0b26.avatarUrl,
                mediaType: null,
                likesCount: 0,
                commentsCount: 0,
                likedByMe: false,
                createdAt: new Date().toISOString(),
                clone: v_8c0b26,
                interests: [],
              },
              v_8c0b26.name,
            );
          }
        }}
      >
        {v_8c0b26.avatarUrl ? (
          <Image source={{ uri: v_8c0b26.avatarUrl }} style={v_fd5f43.rowAvatar} />
        ) : (
          <View style={[v_fd5f43.rowAvatar, v_fd5f43.rowAvatarPh]}>
            <Feather name="user" size={20} color={v_1bfbd0.zinc400} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={v_fd5f43.rowName} numberOfLines={1}>{v_8c0b26.name}</Text>
          <Text style={v_fd5f43.rowSub} numberOfLines={1}>@{v_8c0b26.username}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const v_358f4f = ({ item: v_8c0b26 }: { item: v_3a673b }) => (
    <Pressable
      style={v_fd5f43.row}
      onPress={() => {
        v_2dbcf9(v_8c0b26.name ?? v_8c0b26.email);
        v_0e1f26.dismiss();

        v_3c9f12.navigate("UserProfile", { userId: v_8c0b26.id });
      }}
    >
      {v_8c0b26.avatarUrl ? (
        <Image source={{ uri: v_8c0b26.avatarUrl }} style={v_fd5f43.rowAvatar} />
      ) : (
        <View style={[v_fd5f43.rowAvatar, v_fd5f43.rowAvatarPh]}>
          <Feather name="user" size={20} color={v_1bfbd0.zinc400} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={v_fd5f43.rowName} numberOfLines={1}>{v_8c0b26.name ?? v_8c0b26.email}</Text>
        <Text style={v_fd5f43.rowSub} numberOfLines={1}>{v_8c0b26.email}</Text>
      </View>
    </Pressable>
  );

  const v_854a87 = ({ item: v_8c0b26 }: { item: string }) => (
    <Pressable
      style={v_fd5f43.row}
      onPress={() => {

        v_c57190(v_8c0b26);
        v_02dd63("recommend");
        v_2dbcf9(v_8c0b26);
      }}
    >
      <View style={[v_fd5f43.rowAvatar, v_fd5f43.rowAvatarTag]}>
        <Feather name="hash" size={20} color={v_1bfbd0.zinc700} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={v_fd5f43.rowName} numberOfLines={1}>#{v_8c0b26}</Text>
      </View>
    </Pressable>
  );

  const v_35b27e = ({ item: v_8c0b26 }: { item: string }) => (
    <TouchableOpacity
      style={v_fd5f43.recentRow}
      activeOpacity={0.7}
      onPress={() => v_ba29e7(v_8c0b26)}
    >
      <View style={v_fd5f43.recentLeft}>
        <Feather name="clock" size={18} color={v_1bfbd0.zinc400} />
        <Text style={v_fd5f43.recentText} numberOfLines={1}>{v_8c0b26}</Text>
      </View>
      <TouchableOpacity
        style={v_fd5f43.recentRemoveBtn}
        onPress={() => v_c26d3f(v_8c0b26)}
        hitSlop={8}
      >
        <Feather name="x" size={16} color={v_1bfbd0.zinc400} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const v_e544cb = ({ label: v_2869c1 }: { label: string }) => (
    <View style={v_fd5f43.empty}>
      <Feather name="search" size={36} color={v_1bfbd0.zinc300} />
      <Text style={v_fd5f43.emptyText}>{v_2869c1}</Text>
    </View>
  );

  return (
    <SafeView backgroundColor={v_1bfbd0.white} showBottomBackground={false}>
      {
}
      <Pressable
        style={{ flex: 1 }}
        onPress={() => v_0e1f26.dismiss()}

      >
      {}
      <View style={[v_fd5f43.searchWrap, { paddingTop: v_033e14.top + 8 }]}>
        <View style={v_fd5f43.searchBar}>
          <Feather name="search" size={18} color={v_1bfbd0.zinc500} />
          <TextInput
            ref={v_32f473}
            style={v_fd5f43.searchInput}
            value={v_7c5791}
            onChangeText={v_c57190}
            placeholder={v_8d41d7("search.placeholder")}
            placeholderTextColor={v_1bfbd0.zinc400}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onFocus={() => v_b6749d(true)}
            onBlur={() => v_b6749d(false)}
            onSubmitEditing={v_670702}
          />
          {v_7c5791.length > 0 && (
            <TouchableOpacity onPress={() => v_c57190("")} hitSlop={8}>
              <Feather name="x-circle" size={18} color={v_1bfbd0.zinc400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {v_9c529a ? (

        v_4cd692.length === 0 ? (
          <View style={v_fd5f43.empty}>
            <Feather name="clock" size={36} color={v_1bfbd0.zinc300} />
            <Text style={v_fd5f43.emptyText}>{v_8d41d7("search.emptyRecent")}</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <View style={v_fd5f43.recentHeader}>
              <Text style={v_fd5f43.recentHeaderTitle}>{v_8d41d7("search.recentTitle")}</Text>
              <TouchableOpacity onPress={v_e51925} hitSlop={8}>
                <Text style={v_fd5f43.recentClearText}>{v_8d41d7("search.clearAll")}</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={v_4cd692}
              keyExtractor={(v_23805a) => v_23805a}
              renderItem={v_35b27e}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: v_033e14.bottom + 32 }}
            />
          </View>
        )
      ) : v_3ddc98 ? (
        <>
          {}
          <View style={v_fd5f43.tabRow}>
            {v_322c3f.map((v_11083e) => {
              const v_f8b770 = v_ac1d22 === v_11083e.key;
              return (
                <TouchableOpacity
                  key={v_11083e.key}
                  style={v_fd5f43.tabItem}
                  onPress={() => v_02dd63(v_11083e.key)}
                >
                  <Text style={[v_fd5f43.tabLabel, v_f8b770 && v_fd5f43.tabLabelActive]}>
                    {v_8d41d7(v_11083e.labelKey)}
                  </Text>
                  {v_f8b770 && <View style={v_fd5f43.tabUnderline} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {v_ac1d22 === "recommend" && (
            v_9debb9 ? (
              <ActivityIndicator style={v_fd5f43.loader} color={v_1bfbd0.zinc500} />
            ) : v_ff422a.length === 0 ? (
              <EmptyResult label={v_8d41d7("search.noResults")} />
            ) : (
              <FlatList
                data={v_ff422a}
                keyExtractor={(v_23805a) => String(v_23805a.id)}
                renderItem={v_71d43d}
                numColumns={v_f229b8}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: v_033e14.bottom + 32 }}
              />
            )
          )}

          {v_ac1d22 === "clone" && (
            v_e12281.length === 0 ? (
              <EmptyResult label={v_8d41d7("search.noClones")} />
            ) : (
              <FlatList
                data={v_e12281}
                keyExtractor={(v_23805a) => String(v_23805a.id)}
                renderItem={v_51e832}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: v_033e14.bottom + 32 }}
              />
            )
          )}

          {v_ac1d22 === "account" && (
            v_866dc6 ? (
              <ActivityIndicator style={v_fd5f43.loader} color={v_1bfbd0.zinc500} />
            ) : v_de7ba7.length === 0 ? (
              <EmptyResult label={v_8d41d7("search.noAccounts")} />
            ) : (
              <FlatList
                data={v_de7ba7}
                keyExtractor={(v_23805a) => String(v_23805a.id)}
                renderItem={v_358f4f}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: v_033e14.bottom + 32 }}
              />
            )
          )}

          {v_ac1d22 === "tag" && (
            v_fc704f.length === 0 ? (
              <EmptyResult label={v_8d41d7("search.noTags")} />
            ) : (
              <FlatList
                data={v_fc704f}
                keyExtractor={(v_23805a) => v_23805a}
                renderItem={v_854a87}
                keyboardShouldPersistTaps="handled"
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
      </Pressable>
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
  searchInput: { flex: 1, fontSize: 14, color: v_1bfbd0.zinc900, padding: 0 },

  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 12, position: "relative" },
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
  rowAvatarPh: { backgroundColor: v_1bfbd0.zinc100, alignItems: "center", justifyContent: "center" },
  rowAvatarTag: { backgroundColor: v_1bfbd0.zinc100, alignItems: "center", justifyContent: "center" },
  rowName: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
  rowSub: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },

  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  recentHeaderTitle: { fontSize: 14, fontWeight: "700", color: v_1bfbd0.zinc900 },
  recentClearText: { fontSize: 13, color: v_1bfbd0.violet600, fontWeight: "500" },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  recentLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  recentText: { flex: 1, fontSize: 14, color: v_1bfbd0.zinc900 },
  recentRemoveBtn: { padding: 4 },

  loader: { paddingTop: 60 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { color: v_1bfbd0.zinc500, fontSize: 14 },
});
