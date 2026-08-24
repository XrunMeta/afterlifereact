

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, RADIUS } from "../../components/constants";
import { useAuthStore } from "../../stores/authStore";
import { showAlert } from "../../stores/dialogStore";
import { listPersons, deletePerson, type Person } from "../../api/persons";
import type { MyStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<MyStackParamList, "RememberingCloneDetail">;
type Rt = RouteProp<MyStackParamList, "RememberingCloneDetail">;

export default function RememberingCloneDetailScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { t } = useTranslation();
  const accessToken = useAuthStore((s) => s.accessToken);
  const { cloneId, cloneName } = route.params;

  const [items, setItems] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken) { setLoading(false); return; }
    try {
      const r = await listPersons(accessToken, cloneId);

      setItems(r.items.filter((p) => !p.isSelf));
    } catch (err) {
      console.warn("[RememberingCloneDetail] listPersons failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, cloneId]);

  useEffect(() => { void refresh(); }, [refresh]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const onRevoke = useCallback(
    (person: Person) => {
      if (!accessToken) return;
      const displayName = person.displayName ?? t("common.unknown", { defaultValue: "이름 없음" });
      showAlert(
        t("settings.rememberingCloneDetail.revokeTitle", { defaultValue: "동의를 철회할까요?" }),
        t("settings.rememberingCloneDetail.revokeMessage", {
          defaultValue: `${displayName} 의 얼굴 데이터 ${person.faceCount ?? 0}개가 모두 삭제돼요. 되돌릴 수 없어요.`,
        }),
        [
          { text: t("common.cancel", { defaultValue: "취소" }), style: "cancel" },
          {
            text: t("common.confirm", { defaultValue: "철회" }),
            style: "destructive",
            onPress: async () => {
              setRevokingId(person.id);
              try {
                await deletePerson(accessToken, person.id);
                setItems((prev) => prev.filter((p) => p.id !== person.id));
              } catch (err) {
                const msg = err instanceof Error ? err.message : "삭제에 실패했어요.";
                showAlert(t("common.error", { defaultValue: "오류" }), msg);
              } finally {
                setRevokingId(null);
              }
            },
          },
        ],
      );
    },
    [accessToken, t],
  );

  return (
    <View style={s.root}>
      <PageHeader
        title={cloneName ?? t("settings.rememberingCloneDetail.title", { defaultValue: "얼굴 인식된 사람" })}
        showBackButton
        onBackPress={() => nav.goBack()}
      />
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); void refresh(); }}
          />
        }
      >
        <Text style={s.desc}>
          {t("settings.rememberingCloneDetail.desc", {
            defaultValue: "이 페르소나가 얼굴을 인식해 저장한 사람들이에요. 동의를 철회하면 그 사람의 얼굴 데이터가 모두 삭제됩니다.",
          })}
        </Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 32 }} />
        ) : items.length === 0 ? (
          <Text style={s.empty}>
            {t("settings.rememberingCloneDetail.empty", { defaultValue: "아직 등록된 사람이 없어요." })}
          </Text>
        ) : (
          <>
            <Text style={s.countLabel}>
              {t("settings.rememberingCloneDetail.count", { count: items.length, defaultValue: `${items.length}명` })}
            </Text>
            <View style={s.card}>
              {items.map((person, i) => (
                <View key={person.id}>
                  <View style={s.row}>
                    <View style={[s.avatar, s.avatarPh]}>
                      <Feather name="user" size={20} color={COLORS.zinc400} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.rowName} numberOfLines={1}>
                        {person.displayName ?? t("common.unknown", { defaultValue: "이름 없음" })}
                      </Text>
                      <Text style={s.rowSub} numberOfLines={1}>
                        {t("settings.rememberingCloneDetail.faceCount", {
                          count: person.faceCount ?? 0,
                          defaultValue: `얼굴 데이터 ${person.faceCount ?? 0}개`,
                        })}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[s.revokeBtn, revokingId === person.id && { opacity: 0.6 }]}
                      onPress={() => onRevoke(person)}
                      disabled={revokingId === person.id}
                      accessibilityRole="button"
                    >
                      {revokingId === person.id ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <Text style={s.revokeBtnText}>
                          {t("settings.rememberingCloneDetail.revoke", { defaultValue: "동의 철회" })}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                  {i < items.length - 1 && <View style={s.divider} />}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60 },
  desc: { fontSize: 13, color: COLORS.zinc500, lineHeight: 20, marginBottom: 16 },
  countLabel: { fontSize: 13, color: COLORS.zinc500, marginBottom: 12, fontWeight: "500" },
  empty: { marginTop: 32, textAlign: "center", color: COLORS.zinc400 },
  card: {
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.zinc100,
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 14, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPh: { backgroundColor: COLORS.zinc100, alignItems: "center", justifyContent: "center" },
  rowName: { fontSize: 15, fontWeight: "600", color: COLORS.zinc900 },
  rowSub: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },
  revokeBtn: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    minWidth: 76,
    alignItems: "center",
  },
  revokeBtnText: { color: COLORS.white, fontSize: 13, fontWeight: "600" },
  divider: { height: 1, backgroundColor: COLORS.zinc100, marginLeft: 70 },
});
