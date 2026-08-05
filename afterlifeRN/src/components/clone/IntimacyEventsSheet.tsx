

import v_a3453e, { v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_aa7413,
  v_09d0e5,
  v_122070,
  v_472849,
  v_19b633,
  v_4623af,
  v_3094a2,
  v_39a996,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import v_8e7ad4 from "../ui/SwipeDownSheet";
import { v_1bfbd0, v_8b0c90 } from "../constants";
import { v_1ed7d9 } from "../../stores/authStore";
import {
  v_8ce643,
  type v_6349d0,
} from "../../api/clones";
import { v_bfd883 } from "../../lib/relativeTime";

interface Props {
  visible: boolean;
  cloneId: number | null;
  cloneName: string;
  onClose: () => void;
}

export default function v_06b8c0({ visible: v_cf55be, cloneId: v_6e0fd3, cloneName: v_f2ff36, onClose: v_0890f8 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const v_033e14 = v_e0068c();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);

  const [v_9390e8, v_d57c80] = v_5ab095<v_6349d0 | null>(null);
  const [v_683210, v_34a50a] = v_5ab095(false);
  const [v_c04d0d, v_2dc045] = v_5ab095(false);

  v_c4deb2(() => {
    if (!v_cf55be || !v_6e0fd3 || !v_2ca7e0) {
      v_d57c80(null);
      return;
    }
    let v_2008a4 = false;
    v_34a50a(true);
    v_d57c80(null);
    v_8ce643(v_2ca7e0, v_6e0fd3, { limit: 100 })
      .then((v_8f00b9) => {
        if (v_2008a4) return;
        v_d57c80(v_8f00b9);
      })
      .catch((v_49263d) => {
        if (v_2008a4) return;
        console.warn("[IntimacyEventsSheet] listCloneIntimacyEvents failed:", v_49263d);
        v_d57c80({
          items: [],
          summary: { totalScore: 0, eventCount: 0, chat: 0, call: 0, learn: 0, feed: 0 },
          nextCursor: null,
        });
      })
      .finally(() => {
        if (!v_2008a4) v_34a50a(false);
      });
    return () => {
      v_2008a4 = true;
    };
  }, [v_cf55be, v_6e0fd3, v_2ca7e0]);

  return (
    <>
      <Modal visible={v_cf55be} transparent animationType="slide">
        <Pressable style={v_fd5f43.bottomOverlay} onPress={v_0890f8}>
          <SwipeDownSheet
            onClose={v_0890f8}
            style={[v_fd5f43.eventsSheet, { paddingBottom: 32 + Math.max(v_033e14.bottom, 0) }]}
          >
            <View style={v_fd5f43.eventsSheetHandle} />
            <View style={v_fd5f43.eventsSheetTitleRow}>
              <View style={{ width: 28 }} />
              <Text style={v_fd5f43.eventsSheetTitle}>{v_8d41d7("feed.eventsTitle")}</Text>
              <TouchableOpacity
                onPress={() => v_2dc045(true)}
                hitSlop={8}
                style={{ width: 28, alignItems: "flex-end" }}
              >
                <Feather name="help-circle" size={20} color={v_1bfbd0.zinc400} />
              </TouchableOpacity>
            </View>
            <Text style={v_fd5f43.eventsSheetSub}>{v_f2ff36}</Text>

            {v_9390e8?.summary && (
              <View style={v_fd5f43.eventsSummary}>
                <View style={v_fd5f43.eventsSummaryRow}>
                  <Feather name="thermometer" size={20} color="#fb923c" />
                  <Text style={v_fd5f43.eventsSummaryScore}>
                    {Math.min(100, v_9390e8.summary.totalScore)}°C
                  </Text>
                  <Text style={v_fd5f43.eventsSummaryCount}>
                    · {v_8d41d7("feed.summaryCount", { n: v_9390e8.summary.eventCount })}
                  </Text>
                </View>
                <View style={v_fd5f43.eventsBreakdownRow}>
                  <Text style={v_fd5f43.eventsBreakdownItem}>{v_8d41d7("feed.summaryLabelChat")} <Text style={v_fd5f43.eventsBreakdownVal}>{v_9390e8.summary.chat}°C</Text></Text>
                  <Text style={v_fd5f43.eventsBreakdownItem}>{v_8d41d7("feed.summaryLabelCall")} <Text style={v_fd5f43.eventsBreakdownVal}>{v_9390e8.summary.call}°C</Text></Text>
                  <Text style={v_fd5f43.eventsBreakdownItem}>{v_8d41d7("feed.summaryLabelLearn")} <Text style={v_fd5f43.eventsBreakdownVal}>{v_9390e8.summary.learn}°C</Text></Text>
                  <Text style={v_fd5f43.eventsBreakdownItem}>{v_8d41d7("feed.summaryLabelFeed")} <Text style={v_fd5f43.eventsBreakdownVal}>{v_9390e8.summary.feed}°C</Text></Text>
                </View>
              </View>
            )}

            <ScrollView style={v_fd5f43.eventsScrollArea} showsVerticalScrollIndicator={false}>
              {v_683210 ? (
                <ActivityIndicator color={v_1bfbd0.zinc500} style={{ paddingVertical: 24 }} />
              ) : !v_9390e8 || v_9390e8.items.length === 0 ? (
                <View style={{ paddingVertical: 24, alignItems: "center" }}>
                  <Text style={{ color: v_1bfbd0.zinc500, fontSize: 13 }}>{v_8d41d7("feed.emptyEvents")}</Text>
                </View>
              ) : (
                v_9390e8.items.map((v_1d299c) => {
                  const META: Record<
                    "chat" | "call" | "learn" | "feed",
                    { label: string; icon: keyof typeof v_dec439.glyphMap; color: string }
                  > = {
                    chat: { label: v_8d41d7("feed.actionLabelChat"), icon: "message-circle", color: "#60a5fa" },
                    call: { label: v_8d41d7("feed.actionLabelCall"), icon: "phone", color: "#34d399" },
                    learn: { label: v_8d41d7("feed.actionLabelLearn"), icon: "search", color: "#a78bfa" },
                    feed: { label: v_8d41d7("feed.actionLabelFeed"), icon: "heart", color: "#ef4444" },
                  };
                  const v_ab4c96 = v_afc1e0[v_1d299c.action];
                  return (
                    <View key={v_1d299c.id} style={v_fd5f43.eventRow}>
                      <View style={[v_fd5f43.eventIcon, { backgroundColor: v_ab4c96.color + "22" }]}>
                        <Feather name={v_ab4c96.icon} size={14} color={v_ab4c96.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={v_fd5f43.eventLabel}>{v_ab4c96.label}</Text>
                        <Text style={v_fd5f43.eventTime}>{v_bfd883(v_1d299c.createdAt)}</Text>
                      </View>
                      <Text style={v_fd5f43.eventScore}>+{v_1d299c.score}°C</Text>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </SwipeDownSheet>
        </Pressable>
      </Modal>

      <Modal visible={v_c04d0d} transparent animationType="fade">
        <Pressable style={v_fd5f43.centerOverlay} onPress={() => v_2dc045(false)}>
          <Pressable style={v_fd5f43.infoBox} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <View style={v_fd5f43.infoHeader}>
              <View style={v_fd5f43.infoHeaderLeft}>
                <Feather name="thermometer" size={18} color="#fb923c" />
                <Text style={v_fd5f43.infoTitle}>{v_8d41d7("feed.intimacyInfoTitle")}</Text>
              </View>
              <TouchableOpacity onPress={() => v_2dc045(false)}>
                <Feather name="x" size={20} color={v_1bfbd0.zinc400} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              <Text style={v_fd5f43.infoSectionTitleInline}>{v_8d41d7("feed.intimacyTempSectionLabel")}</Text>
              <Text style={v_fd5f43.infoDescInline}>{v_8d41d7("feed.intimacyTempShortDesc")}</Text>
              {[
                ["0-30°C", v_8d41d7("feed.intimacyL1")],
                ["31-60°C", v_8d41d7("feed.intimacyL2")],
                ["61-90°C", v_8d41d7("feed.intimacyL3")],
                ["91-100°C", v_8d41d7("feed.intimacyL4")],
              ].map(([v_4f2c9c, v_41b99d], v_ebec57) => (
                <View key={v_ebec57} style={v_fd5f43.levelRow}>
                  <Text style={[v_fd5f43.levelRange, v_ebec57 === 3 && { color: "#f97316" }]}>{v_4f2c9c}</Text>
                  <Text style={[v_fd5f43.levelDesc, v_ebec57 === 3 && { color: "#f97316" }]}>{v_41b99d}</Text>
                </View>
              ))}
              <Text style={v_fd5f43.infoSectionTitleInline}>{v_8d41d7("feed.intimacyHowToTitle")}</Text>
              <View style={v_fd5f43.activityBox}>
                <Text style={v_fd5f43.activityItem}>• {v_8d41d7("feed.intimacyHowChat")}</Text>
                <Text style={v_fd5f43.activityItem}>• {v_8d41d7("feed.intimacyHowCall")}</Text>
                <Text style={v_fd5f43.activityItem}>• {v_8d41d7("feed.intimacyHowLearn")}</Text>
                <Text style={v_fd5f43.activityItem}>• {v_8d41d7("feed.intimacyHowFeed")}</Text>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const v_fd5f43 = v_472849.create({
  bottomOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  centerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 24 },
  eventsSheet: {
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: "80%",
  },
  eventsSheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: v_1bfbd0.zinc300, alignSelf: "center", marginBottom: 12,
  },
  eventsSheetTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },
  eventsSheetTitle: { fontSize: 17, fontWeight: "700", color: v_1bfbd0.zinc900, textAlign: "center" },
  eventsSheetSub: { fontSize: 13, color: v_1bfbd0.zinc500, textAlign: "center", marginTop: 4, marginBottom: 12 },
  eventsSummary: { paddingHorizontal: 4, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: v_1bfbd0.zinc100, marginBottom: 8 },
  eventsSummaryRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  eventsSummaryScore: { fontSize: 24, fontWeight: "700", color: "#fb923c" },
  eventsSummaryCount: { fontSize: 13, color: v_1bfbd0.zinc500 },
  eventsBreakdownRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  eventsBreakdownItem: { fontSize: 12, color: v_1bfbd0.zinc500 },
  eventsBreakdownVal: { color: v_1bfbd0.zinc900, fontWeight: "600" },
  eventsScrollArea: { maxHeight: 400 },
  eventRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: v_1bfbd0.zinc100 },
  eventIcon: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  eventLabel: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
  eventTime: { fontSize: 11, color: v_1bfbd0.zinc500, marginTop: 2 },
  eventScore: { fontSize: 14, fontWeight: "700", color: "#fb923c" },
  infoBox: { width: "100%", maxWidth: 360, backgroundColor: v_1bfbd0.white, borderRadius: v_8b0c90.lg, padding: 20 },
  infoHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  infoHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoTitle: { fontSize: 17, fontWeight: "700", color: v_1bfbd0.zinc900 },
  infoDescInline: { fontSize: 13, color: v_1bfbd0.zinc600, lineHeight: 20, marginBottom: 10 },
  infoSectionTitleInline: { fontSize: 14, fontWeight: "700", color: v_1bfbd0.zinc900, marginTop: 12, marginBottom: 8 },
  levelRow: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  levelRange: { width: 90, fontSize: 13, fontWeight: "600", color: v_1bfbd0.zinc700 },
  levelDesc: { fontSize: 13, color: v_1bfbd0.zinc500 },
  activityBox: { backgroundColor: v_1bfbd0.zinc50, borderRadius: 8, padding: 12, gap: 6 },
  activityItem: { fontSize: 13, color: v_1bfbd0.zinc700, lineHeight: 20 },
});
