

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import SafeView from "../../components/ui/SafeView";
import PageHeader from "../../components/common/PageHeader";
import { COLORS } from "../../components/constants";
import { useAuthStore } from "../../stores/authStore";
import { listPersons, type Person } from "../../api/persons";

export default function AcquaintanceManagementScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const accessToken = useAuthStore((s) => s.accessToken);

  const [items, setItems] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (!accessToken) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      const res = await listPersons(accessToken);

      setItems(res.items.filter((p) => p.consentState === "granted"));
    } catch (err) {
      console.warn("[Acquaintance] list failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => { void refresh(); }, [refresh]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const renderItem = ({ item }: { item: Person }) => {
    const primaryName = item.displayName?.trim() || `Person #${item.id}`;
    const consentedAt = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString()
      : "-";
    const cloneLabel = item.cloneId ? `#${item.cloneId}` : "-";
    return (
      <View style={s.row}>
        <View style={s.avatar}>
          <Feather name="user" size={20} color={COLORS.zinc400} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name} numberOfLines={1}>{primaryName}</Text>
          <Text style={s.meta} numberOfLines={1}>
            {t("settings.acquaintance.metaLine", {
              date: consentedAt,
              clone: cloneLabel,
              defaultValue: `동의 ${consentedAt} · 클론 ${cloneLabel}`,
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeView backgroundColor={COLORS.white}>
      <PageHeader
        title={t("settings.acquaintance.title")}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      {loading ? (
        <View style={s.emptyState}>
          <ActivityIndicator color={COLORS.zinc400} />
        </View>
      ) : items.length === 0 ? (
        <View style={s.emptyState}>
          <View style={s.emptyIcon}>
            <Feather name="users" size={40} color={COLORS.zinc300} />
          </View>
          <Text style={s.emptyText}>{t("settings.acquaintance.empty")}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => String(p.id)}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          ItemSeparatorComponent={() => <View style={s.divider} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); void refresh(); }}
              tintColor={COLORS.zinc400}
            />
          }
        />
      )}
    </SafeView>
  );
}

const s = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 15, fontWeight: "600", color: COLORS.zinc900 },
  meta: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.zinc100 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 16,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.zinc500,
    textAlign: "center",
  },
});
