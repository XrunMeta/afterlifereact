

import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAndroidNavigationBarHeight } from "react-native-navigation-bar-height";
import SwipeDownSheet from "../ui/SwipeDownSheet";
import { COLORS, RADIUS } from "../constants";
import { useAuthStore } from "../../stores/authStore";
import {
  listCloneIntimacyEvents,
  type IntimacyEventsResponse,
} from "../../api/clones";
import { formatRelativeKo } from "../../lib/relativeTime";

interface Props {
  visible: boolean;
  cloneId: number | null;
  cloneName: string;
  onClose: () => void;
}

export default function IntimacyEventsSheet({ visible, cloneId, cloneName, onClose }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const navBarHeight = useAndroidNavigationBarHeight(0);
  const androidMinNavBar = Platform.OS === "android" ? 56 : 0;
  const bottomInset = Math.max(insets.bottom, navBarHeight, androidMinNavBar);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [data, setData] = useState<IntimacyEventsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);

  useEffect(() => {
    if (!visible || !cloneId || !accessToken) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setData(null);
    listCloneIntimacyEvents(accessToken, cloneId, { limit: 100 })
      .then((res) => {
        if (cancelled) return;
        setData(res);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("[IntimacyEventsSheet] listCloneIntimacyEvents failed:", err);
        setData({
          items: [],
          summary: { totalScore: 0, eventCount: 0, chat: 0, call: 0, learn: 0, feed: 0 },
          nextCursor: null,
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, cloneId, accessToken]);

  return (
    <>
      <Modal visible={visible} transparent animationType="slide">
        <Pressable style={s.bottomOverlay} onPress={onClose}>
          <SwipeDownSheet
            onClose={onClose}
            style={[s.eventsSheet, { paddingBottom: 32 + bottomInset }]}
          >
            <View style={s.eventsSheetHandle} />
            <View style={s.eventsSheetTitleRow}>
              <View style={{ width: 28 }} />
              <Text style={s.eventsSheetTitle}>{t("feed.eventsTitle")}</Text>
              <TouchableOpacity
                onPress={() => setInfoVisible(true)}
                hitSlop={8}
                style={{ width: 28, alignItems: "flex-end" }}
              >
                <Feather name="help-circle" size={20} color={COLORS.zinc400} />
              </TouchableOpacity>
            </View>
            <Text style={s.eventsSheetSub}>{cloneName}</Text>

            {data?.summary && (
              <View style={s.eventsSummary}>
                <View style={s.eventsSummaryRow}>
                  <Feather name="thermometer" size={20} color="#fb923c" />
                  <Text style={s.eventsSummaryScore}>
                    {Math.min(100, data.summary.totalScore)}°C
                  </Text>
                  <Text style={s.eventsSummaryCount}>
                    · {t("feed.summaryCount", { n: data.summary.eventCount })}
                  </Text>
                </View>
                <View style={s.eventsBreakdownRow}>
                  <Text style={s.eventsBreakdownItem}>{t("feed.summaryLabelChat")} <Text style={s.eventsBreakdownVal}>{data.summary.chat}°C</Text></Text>
                  <Text style={s.eventsBreakdownItem}>{t("feed.summaryLabelCall")} <Text style={s.eventsBreakdownVal}>{data.summary.call}°C</Text></Text>
                  <Text style={s.eventsBreakdownItem}>{t("feed.summaryLabelLearn")} <Text style={s.eventsBreakdownVal}>{data.summary.learn}°C</Text></Text>
                  <Text style={s.eventsBreakdownItem}>{t("feed.summaryLabelFeed")} <Text style={s.eventsBreakdownVal}>{data.summary.feed}°C</Text></Text>
                </View>
              </View>
            )}

            <ScrollView
              style={s.eventsScrollArea}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {loading ? (
                <ActivityIndicator color={COLORS.zinc500} style={{ paddingVertical: 24 }} />
              ) : !data || data.items.length === 0 ? (
                <View style={{ paddingVertical: 24, alignItems: "center" }}>
                  <Text style={{ color: COLORS.zinc500, fontSize: 13 }}>{t("feed.emptyEvents")}</Text>
                </View>
              ) : (
                data.items.map((ev) => {
                  const META: Record<
                    "chat" | "call" | "learn" | "feed",
                    { label: string; icon: keyof typeof Feather.glyphMap; color: string }
                  > = {
                    chat: { label: t("feed.actionLabelChat"), icon: "message-circle", color: "#60a5fa" },
                    call: { label: t("feed.actionLabelCall"), icon: "phone", color: "#34d399" },
                    learn: { label: t("feed.actionLabelLearn"), icon: "search", color: "#a78bfa" },
                    feed: { label: t("feed.actionLabelFeed"), icon: "heart", color: "#ef4444" },
                  };
                  const meta = META[ev.action];
                  return (
                    <View key={ev.id} style={s.eventRow}>
                      <View style={[s.eventIcon, { backgroundColor: meta.color + "22" }]}>
                        <Feather name={meta.icon} size={14} color={meta.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.eventLabel}>{meta.label}</Text>
                        <Text style={s.eventTime}>{formatRelativeKo(ev.createdAt)}</Text>
                      </View>
                      <Text style={s.eventScore}>+{ev.score}°C</Text>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </SwipeDownSheet>
        </Pressable>
      </Modal>

      <Modal visible={infoVisible} transparent animationType="fade">
        <Pressable style={s.centerOverlay} onPress={() => setInfoVisible(false)}>
          <Pressable style={s.infoBox} onPress={(e) => e.stopPropagation()}>
            <View style={s.infoHeader}>
              <View style={s.infoHeaderLeft}>
                <Feather name="thermometer" size={18} color="#fb923c" />
                <Text style={s.infoTitle}>{t("feed.intimacyInfoTitle")}</Text>
              </View>
              <TouchableOpacity onPress={() => setInfoVisible(false)}>
                <Feather name="x" size={20} color={COLORS.zinc400} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              <Text style={s.infoSectionTitleInline}>{t("feed.intimacyTempSectionLabel")}</Text>
              <Text style={s.infoDescInline}>{t("feed.intimacyTempShortDesc")}</Text>
              {[
                ["0-30°C", t("feed.intimacyL1")],
                ["31-60°C", t("feed.intimacyL2")],
                ["61-90°C", t("feed.intimacyL3")],
                ["91-100°C", t("feed.intimacyL4")],
              ].map(([range, desc], i) => (
                <View key={i} style={s.levelRow}>
                  <Text style={[s.levelRange, i === 3 && { color: "#f97316" }]}>{range}</Text>
                  <Text style={[s.levelDesc, i === 3 && { color: "#f97316" }]}>{desc}</Text>
                </View>
              ))}
              <Text style={s.infoSectionTitleInline}>{t("feed.intimacyHowToTitle")}</Text>
              <View style={s.activityBox}>
                <Text style={s.activityItem}>• {t("feed.intimacyHowChat")}</Text>
                <Text style={s.activityItem}>• {t("feed.intimacyHowCall")}</Text>
                <Text style={s.activityItem}>• {t("feed.intimacyHowLearn")}</Text>
                <Text style={s.activityItem}>• {t("feed.intimacyHowFeed")}</Text>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  bottomOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  centerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 24 },
  eventsSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: "80%",
  },
  eventsSheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.zinc300, alignSelf: "center", marginBottom: 12,
  },
  eventsSheetTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },
  eventsSheetTitle: { fontSize: 17, fontWeight: "700", color: COLORS.zinc900, textAlign: "center" },
  eventsSheetSub: { fontSize: 13, color: COLORS.zinc500, textAlign: "center", marginTop: 4, marginBottom: 12 },
  eventsSummary: { paddingHorizontal: 4, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.zinc100, marginBottom: 8 },
  eventsSummaryRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  eventsSummaryScore: { fontSize: 24, fontWeight: "700", color: "#fb923c" },
  eventsSummaryCount: { fontSize: 13, color: COLORS.zinc500 },
  eventsBreakdownRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  eventsBreakdownItem: { fontSize: 12, color: COLORS.zinc500 },
  eventsBreakdownVal: { color: COLORS.zinc900, fontWeight: "600" },

  eventsScrollArea: { flexShrink: 1 },
  eventRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.zinc100 },
  eventIcon: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  eventLabel: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900 },
  eventTime: { fontSize: 11, color: COLORS.zinc500, marginTop: 2 },
  eventScore: { fontSize: 14, fontWeight: "700", color: "#fb923c" },
  infoBox: { width: "100%", maxWidth: 360, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 20 },
  infoHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  infoHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoTitle: { fontSize: 17, fontWeight: "700", color: COLORS.zinc900 },
  infoDescInline: { fontSize: 13, color: COLORS.zinc600, lineHeight: 20, marginBottom: 10 },
  infoSectionTitleInline: { fontSize: 14, fontWeight: "700", color: COLORS.zinc900, marginTop: 12, marginBottom: 8 },
  levelRow: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  levelRange: { width: 90, fontSize: 13, fontWeight: "600", color: COLORS.zinc700 },
  levelDesc: { fontSize: 13, color: COLORS.zinc500 },
  activityBox: { backgroundColor: COLORS.zinc50, borderRadius: 8, padding: 12, gap: 6 },
  activityItem: { fontSize: 13, color: COLORS.zinc700, lineHeight: 20 },
});
