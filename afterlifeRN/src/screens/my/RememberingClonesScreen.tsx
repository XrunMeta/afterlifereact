

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
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, RADIUS } from "../../components/constants";
import { useAuthStore } from "../../stores/authStore";
import { showAlert } from "../../stores/dialogStore";
import { TID, rowId } from "../../testIDs";
import {
  listRememberingClones,
  deleteRememberingClone,
  type RememberingClone,
} from "../../api/persons";

export default function RememberingClonesScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const accessToken = useAuthStore((s) => s.accessToken);

  const [items, setItems] = useState<RememberingClone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    try {
      const res = await listRememberingClones(accessToken);
      setItems(res.clones);
    } catch (err) {
      console.warn("[RememberingClones] list failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const onDelete = useCallback(
    (clone: RememberingClone) => {
      if (!accessToken) return;
      showAlert(
        t("settings.rememberingClones.deleteConfirmTitle", { defaultValue: "기억을 지울까요?" }),
        t("settings.rememberingClones.deleteConfirmMessage", {
          defaultValue: `${clone.name} 이(가) 나를 기억하는 내용과 얼굴 정보가 모두 삭제돼요. 되돌릴 수 없어요.`,
        }),
        [
          { text: t("common.cancel", { defaultValue: "취소" }), style: "cancel" },
          {
            text: t("common.delete", { defaultValue: "삭제" }),
            style: "destructive",
            onPress: async () => {
              setDeletingId(clone.cloneId);
              try {
                await deleteRememberingClone(accessToken, clone.cloneId);
                setItems((prev) => prev.filter((c) => c.cloneId !== clone.cloneId));
              } catch (err) {
                const msg =
                  err instanceof Error
                    ? err.message
                    : t("settings.rememberingClones.deleteError", { defaultValue: "삭제에 실패했어요." });
                showAlert(
                  t("settings.rememberingClones.deleteErrorTitle", { defaultValue: "삭제 실패" }),
                  msg,
                );
              } finally {
                setDeletingId(null);
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
        title={t("settings.rememberingClones.title", { defaultValue: "나를 기억하는 클론" })}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void refresh();
            }}
          />
        }
      >
        {loading ? (
          <ActivityIndicator style={{ marginTop: 32 }} />
        ) : items.length === 0 ? (
          <Text style={s.empty}>
            {t("settings.rememberingClones.empty", {
              defaultValue: "아직 나를 기억하는 클론이 없어요.",
            })}
          </Text>
        ) : (
          <>
            {}
            <Text style={s.countLabel}>
              {t("settings.rememberingClones.count", {
                count: items.length,
                defaultValue: `${items.length}개`,
              })}
            </Text>
            <View style={s.card}>
            {items.map((clone, i) => (
              <View key={clone.cloneId}>
                <View style={s.row}>
                  <View style={[s.avatar, s.avatarPh]}>
                    <Feather name="user" size={20} color={COLORS.zinc400} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowName} numberOfLines={1}>
                      {clone.name}
                    </Text>
                    <Text style={s.rowSub} numberOfLines={1}>
                      @{clone.username}
                    </Text>
                  </View>
                  <TouchableOpacity
                    testID={rowId(TID.rememberingClones.delete, clone.cloneId)}
                    style={[s.deleteBtn, deletingId === clone.cloneId && { opacity: 0.6 }]}
                    onPress={() => onDelete(clone)}
                    disabled={deletingId === clone.cloneId}
                    accessibilityRole="button"
                  >
                    {deletingId === clone.cloneId ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Text style={s.deleteBtnText}>
                        {t("settings.rememberingClones.deleteButton", { defaultValue: "지우기" })}
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
  countLabel: {
    fontSize: 13,
    color: COLORS.zinc500,
    marginBottom: 12,
    fontWeight: "500",
  },
  empty: { marginTop: 32, textAlign: "center", color: COLORS.zinc400 },
  card: {
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.zinc100,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPh: {
    backgroundColor: COLORS.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  rowName: { fontSize: 15, fontWeight: "600", color: COLORS.zinc900 },
  rowSub: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },

  divider: { height: 1, backgroundColor: COLORS.zinc100, marginLeft: 70 },
  deleteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.zinc900,
  },
  deleteBtnText: { color: COLORS.white, fontSize: 13, fontWeight: "600" },
});
