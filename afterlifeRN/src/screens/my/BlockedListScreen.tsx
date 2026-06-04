
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import SafeView from "../../components/ui/SafeView";
import PageHeader from "../../components/common/PageHeader";
import { useAuthStore } from "../../stores/authStore";
import { listMyBlocks, unblockClone, type BlockedClone } from "../../api/clones";
import { COLORS, RADIUS, SIZES } from "../../components/constants";

export default function BlockedListScreen() {
  const navigation = useNavigation();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [items, setItems] = useState<BlockedClone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async () => {
    if (!accessToken) {
      setItems([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const res = await listMyBlocks(accessToken);
      setItems(res.items);
    } catch (err) {
      console.warn("[BlockedList] failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleUnblock = async (cloneId: number) => {
    if (!accessToken) return;
    try {
      await unblockClone(accessToken, cloneId);
      setItems((prev) => prev.filter((b) => b.clone.id !== cloneId));
    } catch (err) {
      console.warn("[BlockedList] unblock failed:", err);
    }
  };

  return (
    <SafeView backgroundColor={COLORS.zinc50}>
      <PageHeader
        title="차단 목록"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={COLORS.zinc500} />
        </View>
      ) : items.length === 0 ? (
        <View style={s.center}>
          <Feather name="slash" size={32} color={COLORS.zinc300} />
          <Text style={s.empty}>차단한 클론이 없어요</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.blockId)}
          renderItem={({ item }) => (
            <View style={s.row}>
              {item.clone.avatarUrl ? (
                <Image source={{ uri: item.clone.avatarUrl }} style={s.avatar} />
              ) : (
                <View style={[s.avatar, s.avatarPh]}>
                  <Feather name="user" size={18} color={COLORS.zinc400} />
                </View>
              )}
              <View style={s.body}>
                <Text style={s.name}>{item.clone.name}</Text>
                <Text style={s.sub}>@{item.clone.username}</Text>
              </View>
              <TouchableOpacity style={s.unblockBtn} onPress={() => handleUnblock(item.clone.id)}>
                <Text style={s.unblockText}>차단 해제</Text>
              </TouchableOpacity>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                reload();
              }}
            />
          }
          contentContainerStyle={{ paddingVertical: 8 }}
        />
      )}
    </SafeView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  empty: { color: COLORS.zinc500, fontSize: 13 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: SIZES.large,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  avatar: { width: 40, height: 40, borderRadius: 12 },
  avatarPh: {
    backgroundColor: COLORS.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1 },
  name: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900 },
  sub: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },
  unblockBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.zinc900,
  },
  unblockText: { color: COLORS.white, fontSize: 12, fontWeight: "600" },
});
