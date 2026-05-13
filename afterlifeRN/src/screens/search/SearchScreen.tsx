

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
  Pressable,
  Keyboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CompositeNavigationProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SafeView from "../../components/ui/SafeView";
import { useAuthStore } from "../../stores/authStore";
import {
  listDiscoverFeeds,
  type DiscoverFeedItem,
} from "../../api/clones";
import { searchUsers, type UserSearchItem } from "../../api/auth";
import { COLORS, RADIUS } from "../../components/constants";
import type { MainTabParamList, RootStackParamList } from "../../navigation/types";

type TabNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

const GAP = 4; 
const NUM_COLS = 2;
const RECENT_STORAGE_KEY = "@search_recent";
const RECENT_MAX = 10;

type TabKey = "recommend" | "clone" | "account" | "tag";
const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "recommend", label: "추천" },
  { key: "clone", label: "클론" },
  { key: "account", label: "계정" },
  { key: "tag", label: "태그" },
];

export default function SearchScreen() {
  const nav = useNavigation<TabNav>();
  const accessToken = useAuthStore((s) => s.accessToken);
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("recommend");
  const [feeds, setFeeds] = useState<DiscoverFeedItem[]>([]);
  const [feedsLoading, setFeedsLoading] = useState(true);
  const [users, setUsers] = useState<UserSearchItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  const screenWidth = Dimensions.get("window").width;
  const cellWidth = useMemo(
    () => Math.floor((screenWidth - GAP * (NUM_COLS - 1)) / NUM_COLS),
    [screenWidth],
  );

  const cellHeight = useMemo(
    () => Math.floor(cellWidth * (16 / 9)),
    [cellWidth],
  );

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(RECENT_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setRecent(parsed.filter((x) => typeof x === "string").slice(0, RECENT_MAX));
          }
        }
      } catch (err) {
        console.warn("[Search] recent load failed:", err);
      }
    })();
  }, []);

  const saveRecent = useCallback(async (term: string) => {
    const t = term.trim();
    if (!t) return;
    const next = [t, ...recent.filter((x) => x.toLowerCase() !== t.toLowerCase())]
      .slice(0, RECENT_MAX);
    setRecent(next);
    try {
      await AsyncStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.warn("[Search] recent save failed:", err);
    }
  }, [recent]);

  const removeRecent = useCallback(async (term: string) => {
    const next = recent.filter((x) => x !== term);
    setRecent(next);
    try {
      await AsyncStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.warn("[Search] recent remove failed:", err);
    }
  }, [recent]);

  const clearAllRecent = useCallback(async () => {
    setRecent([]);
    try {
      await AsyncStorage.removeItem(RECENT_STORAGE_KEY);
    } catch (err) {
      console.warn("[Search] recent clear failed:", err);
    }
  }, []);

  const loadFeeds = useCallback(async () => {
    setFeedsLoading(true);
    try {
      const res = await listDiscoverFeeds({
        limit: 60,
        accessToken: accessToken ?? null,
      });
      setFeeds(res.items);
    } catch (err) {
      console.warn("[Search] discover fetch failed:", err);
    } finally {
      setFeedsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadFeeds();
  }, [loadFeeds]);

  const usersDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (usersDebounceRef.current) clearTimeout(usersDebounceRef.current);
    const q = query.trim();
    if (!q || !accessToken) {
      setUsers([]);
      return;
    }
    usersDebounceRef.current = setTimeout(async () => {
      setUsersLoading(true);
      try {
        const res = await searchUsers(accessToken, q);
        setUsers(res.items);
      } catch (err) {
        console.warn("[Search] searchUsers failed:", err);
        setUsers([]);
      } finally {
        setUsersLoading(false);
      }
    }, 300);
    return () => {
      if (usersDebounceRef.current) clearTimeout(usersDebounceRef.current);
    };
  }, [query, accessToken]);

  const isSearching = query.trim().length > 0;
  const showRecent = !isSearching && focused;

  const filteredFeeds = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return feeds;
    return feeds.filter((f) => {
      const name = f.clone.name.toLowerCase();
      const uname = f.clone.username.toLowerCase();
      const interestsMatch = f.interests.some((it) =>
        it.toLowerCase().includes(q),
      );
      const contentMatch = (f.content ?? "").toLowerCase().includes(q);
      return name.includes(q) || uname.includes(q) || interestsMatch || contentMatch;
    });
  }, [feeds, query]);

  const filteredClones = useMemo(() => {
    const q = query.trim().toLowerCase();
    const seen = new Set<number>();
    const out: DiscoverFeedItem["clone"][] = [];
    for (const f of feeds) {
      if (seen.has(f.clone.id)) continue;
      seen.add(f.clone.id);
      if (
        !q ||
        f.clone.name.toLowerCase().includes(q) ||
        f.clone.username.toLowerCase().includes(q)
      ) {
        out.push(f.clone);
      }
    }
    return out;
  }, [feeds, query]);

  const filteredTags = useMemo(() => {
    const q = query.trim().toLowerCase();
    const set = new Set<string>();
    for (const f of feeds) for (const it of f.interests) set.add(it);
    const all = Array.from(set);
    if (!q) return all.slice(0, 30);
    return all.filter((t) => t.toLowerCase().includes(q));
  }, [feeds, query]);

  const goToClone = (cloneId: number, term?: string) => {
    if (term) saveRecent(term);

    nav.navigate("ClonesTab", { screen: "CloneDetail", params: { cloneId } });
  };

  const onSubmitSearch = () => {
    const t = query.trim();
    if (t) saveRecent(t);
    Keyboard.dismiss();
    setFocused(false);
  };

  const pickRecent = (term: string) => {
    setQuery(term);
    saveRecent(term);
    inputRef.current?.blur();
  };

  const renderFeedCell = ({
    item,
    index,
  }: {
    item: DiscoverFeedItem;
    index: number;
  }) => {
    const col = index % NUM_COLS;
    const marginRight = col < NUM_COLS - 1 ? GAP : 0;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => goToClone(item.cloneId, query)}
        style={{ width: cellWidth, height: cellHeight, marginRight, marginBottom: GAP }}
      >
        {item.mediaUrl ? (
          <Image source={{ uri: item.mediaUrl }} style={s.cellImage} />
        ) : (
          <View style={[s.cellImage, s.cellPlaceholder]}>
            <Feather name="image" size={24} color={COLORS.zinc400} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderCloneRow = ({ item }: { item: DiscoverFeedItem["clone"] }) => (
    <TouchableOpacity style={s.row} onPress={() => goToClone(item.id, item.name)}>
      {item.avatarUrl ? (
        <Image source={{ uri: item.avatarUrl }} style={s.rowAvatar} />
      ) : (
        <View style={[s.rowAvatar, s.rowAvatarPh]}>
          <Feather name="user" size={20} color={COLORS.zinc400} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={s.rowName} numberOfLines={1}>{item.name}</Text>
        <Text style={s.rowSub} numberOfLines={1}>@{item.username}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderUserRow = ({ item }: { item: UserSearchItem }) => (
    <Pressable
      style={s.row}
      onPress={() => {
        saveRecent(item.name ?? item.email);
        Keyboard.dismiss();

        nav.navigate("UserProfile", { userId: item.id });
      }}
    >
      {item.avatarUrl ? (
        <Image source={{ uri: item.avatarUrl }} style={s.rowAvatar} />
      ) : (
        <View style={[s.rowAvatar, s.rowAvatarPh]}>
          <Feather name="user" size={20} color={COLORS.zinc400} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={s.rowName} numberOfLines={1}>{item.name ?? item.email}</Text>
        <Text style={s.rowSub} numberOfLines={1}>{item.email}</Text>
      </View>
    </Pressable>
  );

  const renderTagRow = ({ item }: { item: string }) => (
    <Pressable style={s.row} onPress={() => { setQuery(item); saveRecent(item); }}>
      <View style={[s.rowAvatar, s.rowAvatarTag]}>
        <Feather name="hash" size={20} color={COLORS.zinc700} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowName} numberOfLines={1}>#{item}</Text>
      </View>
    </Pressable>
  );

  const renderRecentRow = ({ item }: { item: string }) => (
    <View style={s.recentRow}>
      <TouchableOpacity
        style={s.recentLeft}
        onPress={() => pickRecent(item)}
      >
        <Feather name="clock" size={18} color={COLORS.zinc400} />
        <Text style={s.recentText} numberOfLines={1}>{item}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={s.recentRemoveBtn}
        onPress={() => removeRecent(item)}
        hitSlop={8}
      >
        <Feather name="x" size={16} color={COLORS.zinc400} />
      </TouchableOpacity>
    </View>
  );

  const EmptyResult = ({ label }: { label: string }) => (
    <View style={s.empty}>
      <Feather name="search" size={36} color={COLORS.zinc300} />
      <Text style={s.emptyText}>{label}</Text>
    </View>
  );

  return (
    <SafeView backgroundColor={COLORS.white} showBottomBackground={false}>
      {}
      <View style={[s.searchWrap, { paddingTop: insets.top + 8 }]}>
        <View style={s.searchBar}>
          <Feather name="search" size={18} color={COLORS.zinc500} />
          <TextInput
            ref={inputRef}
            style={s.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="태그나 닉네임 검색"
            placeholderTextColor={COLORS.zinc400}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={onSubmitSearch}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")} hitSlop={8}>
              <Feather name="x-circle" size={18} color={COLORS.zinc400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showRecent ? (

        recent.length === 0 ? (
          <View style={s.empty}>
            <Feather name="clock" size={36} color={COLORS.zinc300} />
            <Text style={s.emptyText}>최근 검색어가 없어요</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <View style={s.recentHeader}>
              <Text style={s.recentHeaderTitle}>최근 검색</Text>
              <TouchableOpacity onPress={clearAllRecent} hitSlop={8}>
                <Text style={s.recentClearText}>모두 삭제</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={recent}
              keyExtractor={(it) => it}
              renderItem={renderRecentRow}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
            />
          </View>
        )
      ) : isSearching ? (
        <>
          {}
          <View style={s.tabRow}>
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={s.tabItem}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Text style={[s.tabLabel, active && s.tabLabelActive]}>
                    {tab.label}
                  </Text>
                  {active && <View style={s.tabUnderline} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {activeTab === "recommend" && (
            feedsLoading ? (
              <ActivityIndicator style={s.loader} color={COLORS.zinc500} />
            ) : filteredFeeds.length === 0 ? (
              <EmptyResult label="검색 결과가 없어요" />
            ) : (
              <FlatList
                data={filteredFeeds}
                keyExtractor={(it) => String(it.id)}
                renderItem={renderFeedCell}
                numColumns={NUM_COLS}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
              />
            )
          )}

          {activeTab === "clone" && (
            filteredClones.length === 0 ? (
              <EmptyResult label="일치하는 클론이 없어요" />
            ) : (
              <FlatList
                data={filteredClones}
                keyExtractor={(it) => String(it.id)}
                renderItem={renderCloneRow}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
              />
            )
          )}

          {activeTab === "account" && (
            usersLoading ? (
              <ActivityIndicator style={s.loader} color={COLORS.zinc500} />
            ) : users.length === 0 ? (
              <EmptyResult label="일치하는 계정이 없어요" />
            ) : (
              <FlatList
                data={users}
                keyExtractor={(it) => String(it.id)}
                renderItem={renderUserRow}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
              />
            )
          )}

          {activeTab === "tag" && (
            filteredTags.length === 0 ? (
              <EmptyResult label="일치하는 태그가 없어요" />
            ) : (
              <FlatList
                data={filteredTags}
                keyExtractor={(it) => it}
                renderItem={renderTagRow}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
              />
            )
          )}
        </>
      ) : (

        feedsLoading ? (
          <ActivityIndicator style={s.loader} color={COLORS.zinc500} />
        ) : (
          <FlatList
            data={feeds}
            keyExtractor={(it) => String(it.id)}
            renderItem={renderFeedCell}
            numColumns={NUM_COLS}
            contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
            showsVerticalScrollIndicator={false}
          />
        )
      )}
    </SafeView>
  );
}

const s = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: COLORS.white,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    height: 40,
    backgroundColor: COLORS.zinc100,
    borderRadius: RADIUS.lg,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.zinc900, padding: 0 },

  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 12, position: "relative" },
  tabLabel: { fontSize: 14, fontWeight: "500", color: COLORS.zinc500 },
  tabLabelActive: { color: COLORS.zinc900, fontWeight: "700" },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: "25%",
    right: "25%",
    height: 2,
    backgroundColor: COLORS.zinc900,
  },

  cellImage: { width: "100%", height: "100%", backgroundColor: COLORS.zinc100 },
  cellPlaceholder: { alignItems: "center", justifyContent: "center" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  rowAvatar: { width: 44, height: 44, borderRadius: 22 },
  rowAvatarPh: { backgroundColor: COLORS.zinc100, alignItems: "center", justifyContent: "center" },
  rowAvatarTag: { backgroundColor: COLORS.zinc100, alignItems: "center", justifyContent: "center" },
  rowName: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900 },
  rowSub: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },

  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  recentHeaderTitle: { fontSize: 14, fontWeight: "700", color: COLORS.zinc900 },
  recentClearText: { fontSize: 13, color: COLORS.violet600, fontWeight: "500" },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  recentLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  recentText: { flex: 1, fontSize: 14, color: COLORS.zinc900 },
  recentRemoveBtn: { padding: 4 },

  loader: { paddingTop: 60 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { color: COLORS.zinc500, fontSize: 14 },
});
