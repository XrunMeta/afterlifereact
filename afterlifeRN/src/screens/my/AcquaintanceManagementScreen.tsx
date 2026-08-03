

import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
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

  const refresh = useCallback(async () => {
    if (!accessToken) {
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
    }
  }, [accessToken]);

  useEffect(() => { void refresh(); }, [refresh]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      <PageHeader
        title={t("settings.acquaintance.title", { defaultValue: "지인 관리" })}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={s.content}>
        {loading ? (
          <ActivityIndicator color={COLORS.zinc400} style={{ marginTop: 40 }} />
        ) : items.length === 0 ? (
          <Text style={s.empty}>
            {t("settings.acquaintance.empty", { defaultValue: "등록된 지인이 없어요" })}
          </Text>
        ) : (
          items.map((item) => (
            <View key={item.id} style={s.row}>
              <Text style={s.name} numberOfLines={1}>
                {item.displayName?.trim() || `Person #${item.id}`}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  content: { padding: 20, paddingBottom: 60 },
  row: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.zinc100,
  },
  name: { fontSize: 15, fontWeight: "600", color: COLORS.zinc900 },
  empty: { fontSize: 15, color: COLORS.zinc500, textAlign: "center", marginTop: 60 },
});
