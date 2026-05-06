

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
import { useNavigation, CommonActions } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import SafeView from "../../components/ui/SafeView";
import PageHeader from "../../components/common/PageHeader";
import { useAuthStore } from "../../stores/authStore";
import { listMyInvites, type SentInvite, type SentInviteStatus } from "../../api/clones";
import { COLORS, RADIUS, SIZES } from "../../components/constants";
import type { MyStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<MyStackParamList>;

const STATUS_META: Record<
  SentInviteStatus,
  { color: string; bg: string; icon: keyof typeof Feather.glyphMap }
> = {
  pending: { color: "#92400e", bg: "#fef3c7", icon: "clock" },
  accepted: { color: "#166534", bg: "#dcfce7", icon: "check-circle" },
  cancelled: { color: "#475569", bg: "#e2e8f0", icon: "x-circle" },
  expired: { color: "#991b1b", bg: "#fee2e2", icon: "alert-triangle" },
};

export default function InviteStatusScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const accessToken = useAuthStore((s) => s.accessToken);

  const FILTERS: Array<{ key: "all" | SentInviteStatus; label: string }> = [
    { key: "all", label: t("inviteStatus.filterAll") },
    { key: "pending", label: t("inviteStatus.statusPending") },
    { key: "accepted", label: t("inviteStatus.statusAccepted") },
    { key: "cancelled", label: t("inviteStatus.statusCancelled") },
    { key: "expired", label: t("inviteStatus.statusExpired") },
  ];

  const STATUS_LABEL: Record<SentInviteStatus, string> = {
    pending: t("inviteStatus.statusPending"),
    accepted: t("inviteStatus.statusAccepted"),
    cancelled: t("inviteStatus.statusCancelled"),
    expired: t("inviteStatus.statusExpired"),
  };
  const [items, setItems] = useState<SentInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | SentInviteStatus>("all");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!accessToken) {
      setItems([]);
      setErrorMsg(t("my.loginRequired"));
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      console.log("[InviteStatus] fetching me/invites...");
      const res = await listMyInvites(accessToken);
      console.log("[InviteStatus] fetched", res.items.length, "items");
      setItems(res.items);
      setErrorMsg(null);
    } catch (err) {
      console.warn("[InviteStatus] failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, t]);

  useEffect(() => {
    reload();
  }, [reload]);

  const filtered = filter === "all" ? items : items.filter((it) => it.status === filter);

  const counts = {
    all: items.length,
    pending: items.filter((it) => it.status === "pending").length,
    accepted: items.filter((it) => it.status === "accepted").length,
    cancelled: items.filter((it) => it.status === "cancelled").length,
    expired: items.filter((it) => it.status === "expired").length,
  };

  const renderItem = ({ item }: { item: SentInvite }) => {
    const meta = STATUS_META[item.status];
    return (
      <TouchableOpacity
        style={s.row}
        activeOpacity={0.7}
        onPress={() => {

          navigation.getParent()?.dispatch(
            CommonActions.navigate({
              name: "ClonesTab",
              params: { screen: "CloneInvite", params: { cloneId: item.clone.id } },
            }),
          );
        }}
      >
        {item.clone.avatarUrl ? (
          <Image source={{ uri: item.clone.avatarUrl }} style={s.avatar} />
        ) : (
          <View style={[s.avatar, s.avatarPh]}>
            <Feather name="user" size={18} color={COLORS.zinc400} />
          </View>
        )}
        <View style={s.body}>
          <View style={s.line1}>
            <Text style={s.cloneName} numberOfLines={1}>
              {item.clone.name}
            </Text>
            <View style={[s.badge, { backgroundColor: meta.bg }]}>
              <Feather name={meta.icon} size={11} color={meta.color} />
              <Text style={[s.badgeText, { color: meta.color }]}>{STATUS_LABEL[item.status]}</Text>
            </View>
          </View>
          <Text style={s.email} numberOfLines={1}>
            {item.inviteEmail ?? t("invite.noEmail")}
          </Text>
          <Text style={s.subtle}>
            {formatStatusHint(item, t)}
          </Text>
        </View>
        <Feather name="chevron-right" size={18} color={COLORS.zinc400} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeView backgroundColor={COLORS.zinc50}>
      <PageHeader
        title={t("inviteStatus.title")}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      {}
      <View style={s.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const cnt = counts[f.key];
          return (
            <TouchableOpacity
              key={f.key}
              style={[s.filter, active && s.filterActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[s.filterText, active && s.filterTextActive]}>
                {f.label} {cnt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={COLORS.zinc500} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <Feather name={errorMsg ? "alert-triangle" : "send"} size={32} color={errorMsg ? COLORS.error : COLORS.zinc300} />
          <Text style={s.empty}>
            {errorMsg
              ? errorMsg
              : filter === "all"
                ? t("inviteStatus.emptyAll")
                : t("inviteStatus.emptyFilter")}
          </Text>
          {errorMsg && (
            <TouchableOpacity
              onPress={() => {
                setLoading(true);
                reload();
              }}
              style={{ marginTop: 8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: COLORS.zinc900, borderRadius: 8 }}
            >
              <Text style={{ color: COLORS.white, fontSize: 13, fontWeight: "600" }}>{t("common.retry")}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it) => String(it.id)}
          renderItem={renderItem}
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

type T = (k: string, opts?: Record<string, unknown>) => string;

function formatRel(iso: string, t: T): string {
  try {
    const ms = new Date(iso.replace(" ", "T") + "Z").getTime();
    const diff = Date.now() - ms;
    const min = Math.floor(diff / 60000);
    if (min < 1) return t("common.now");
    if (min < 60) return t("common.agoMinutes", { n: min });
    const hr = Math.floor(min / 60);
    if (hr < 24) return t("common.agoHours", { n: hr });
    const d = Math.floor(hr / 24);
    if (d < 30) return t("common.agoDays", { n: d });
    return new Date(ms).toLocaleDateString();
  } catch {
    return iso;
  }
}

function formatStatusHint(it: SentInvite, t: T): string {
  switch (it.status) {
    case "pending":
      return t("inviteStatus.hintPending", { rel: formatRel(it.createdAt, t) });
    case "accepted":
      return t("inviteStatus.hintAccepted", { rel: it.usedAt ? formatRel(it.usedAt, t) : "—" });
    case "cancelled":
      return t("inviteStatus.hintCancelled", { rel: it.cancelledAt ? formatRel(it.cancelledAt, t) : "—" });
    case "expired":
      return t("inviteStatus.hintExpired", { rel: formatRel(it.expiresAt, t) });
  }
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  empty: { color: COLORS.zinc500, fontSize: 13 },

  filterRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: SIZES.large,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  filter: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    backgroundColor: COLORS.white,
  },
  filterActive: { backgroundColor: COLORS.zinc900, borderColor: COLORS.zinc900 },
  filterText: { fontSize: 12, color: COLORS.zinc600, fontWeight: "500" },
  filterTextActive: { color: COLORS.white, fontWeight: "600" },

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
  line1: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  cloneName: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900, flexShrink: 1 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { fontSize: 11, fontWeight: "600" },
  email: { fontSize: 13, color: COLORS.zinc700 },
  subtle: { fontSize: 11, color: COLORS.zinc500, marginTop: 2 },
});
