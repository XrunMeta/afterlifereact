

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
import { listPersons, saveFaceConsent, type Person } from "../../api/persons";

export default function AcquaintanceManagementScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const accessToken = useAuthStore((s) => s.accessToken);

  const [items, setItems] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    try {
      const res = await listPersons(accessToken);
      setItems(res.items);
    } catch (err) {
      console.warn("[Acquaintance] list failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => { void refresh(); }, [refresh]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const onPullRefresh = useCallback(() => {
    setRefreshing(true);
    void refresh();
  }, [refresh]);

  const handleRevoke = useCallback((person: Person) => {
    showAlert(
      t("settings.privacy.faceConsent.revokeConfirmTitle"),
      t("settings.privacy.faceConsent.revokeConfirmMessage"),
      [
        { text: t("settings.privacy.faceConsent.revokeConfirmCancel"), style: "cancel" },
        {
          text: t("settings.privacy.faceConsent.revokeConfirmOk"),
          style: "destructive",
          onPress: async () => {
            if (!accessToken) return;
            setRevokingId(person.id);
            try {
              await saveFaceConsent(accessToken, person.id, "revoked");

              setItems((prev) =>
                prev.map((p) =>
                  p.id === person.id ? { ...p, consentState: "revoked" } : p,
                ),
              );
            } catch (err) {
              const msg =
                err instanceof Error
                  ? err.message
                  : t("settings.privacy.faceConsent.revokeError");
              showAlert(t("settings.privacy.faceConsent.revokeConfirmTitle"), msg);
            } finally {
              setRevokingId(null);
            }
          },
        },
      ],
    );
  }, [accessToken, t]);

  const granted = items.filter((p) => p.consentState === "granted");

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      <PageHeader
        title={t("settings.acquaintance.title", { defaultValue: "지인 관리" })}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onPullRefresh}
            tintColor={COLORS.zinc400}
          />
        }
      >
        {loading ? (
          <ActivityIndicator color={COLORS.zinc400} style={{ marginTop: 40 }} />
        ) : granted.length === 0 ? (
          <View style={s.empty}>
            <Feather name="eye-off" size={32} color={COLORS.zinc300} />
            <Text style={s.emptyText}>
              {t("settings.privacy.faceConsent.noConsent", {
                defaultValue: "동의한 지인이 없어요",
              })}
            </Text>
            <Text style={s.emptySub}>
              {t("settings.privacy.faceConsent.noConsentSub", {
                defaultValue: "얼굴 감지 동의가 여기에 표시돼요.",
              })}
            </Text>
          </View>
        ) : (
          <>
            <Text style={s.countLabel}>
              {t("settings.acquaintance.count", {
                defaultValue: "총 {{n}}명",
                n: granted.length,
              })}
            </Text>
            <View style={s.card}>
              {granted.map((person, i) => {
                const busy = revokingId === person.id;
                const consentLabel = person.createdAt
                  ? t("settings.privacy.faceConsent.consentedAt", {
                      date: new Date(person.createdAt).toLocaleDateString(),
                    })
                  : t("settings.privacy.faceConsent.stateGranted");
                const cloneLabel = person.cloneId
                  ? t("settings.privacy.faceConsent.cloneLabel", { cloneId: person.cloneId })
                  : `Person #${person.id}`;

                const primaryName = person.displayName?.trim() || cloneLabel;
                return (
                  <View key={person.id}>
                    <View style={s.row}>
                      <View style={[s.avatar, s.avatarPh]}>
                        <Feather name="eye" size={20} color={COLORS.zinc400} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.rowName} numberOfLines={1}>
                          {primaryName}
                        </Text>
                        <Text style={s.rowSub} numberOfLines={1}>
                          {consentLabel}
                        </Text>
                      </View>
                      <TouchableOpacity
                        testID={`revoke-btn-${person.id}`}
                        style={[s.revokeBtn, busy && { opacity: 0.6 }]}
                        onPress={() => handleRevoke(person)}
                        disabled={busy}
                        accessibilityLabel={t("settings.privacy.faceConsent.revokeButton")}
                        accessibilityRole="button"
                      >
                        {busy ? (
                          <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                          <Text style={s.revokeBtnText}>
                            {t("settings.privacy.faceConsent.revokeButton")}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                    {i < granted.length - 1 && <View style={s.divider} />}
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60 },
  countLabel: {
    fontSize: 13,
    color: COLORS.zinc500,
    marginBottom: 12,
    fontWeight: "500",
  },
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
  divider: { height: 1, backgroundColor: COLORS.zinc100, marginLeft: 72 },
  revokeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.zinc900,
    minWidth: 76,
    alignItems: "center",
  },
  revokeBtnText: { fontSize: 12, fontWeight: "700", color: COLORS.white },
  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 24, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: "600", color: COLORS.zinc700, marginTop: 8 },
  emptySub: {
    fontSize: 13,
    color: COLORS.zinc500,
    textAlign: "center",
    lineHeight: 20,
  },
});
