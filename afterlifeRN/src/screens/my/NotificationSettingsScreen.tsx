import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, RADIUS } from "../../components/constants";

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const items = [
    { key: "push", labelKey: "settings.notifications.push" },
    { key: "comment", labelKey: "settings.notifications.comment" },
    { key: "like", labelKey: "settings.notifications.like" },
    { key: "marketing", labelKey: "settings.notifications.marketing" },
  ] as const;

  return (
    <SafeScrollView backgroundColor={COLORS.white} showBottomBackground={false}>
      <PageHeader
        title={t("settings.notifications.title")}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <View style={s.content}>
        <View style={s.card}>
          {items.map((item, i) => (
            <View key={item.key}>
              <View style={s.row}>
                <Text style={s.rowLabel}>{t(item.labelKey)}</Text>
                {}
                <Switch value={false} onValueChange={() => {}} disabled />
              </View>
              {i < items.length - 1 && <View style={s.divider} />}
            </View>
          ))}
        </View>
      </View>
    </SafeScrollView>
  );
}

const s = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 780,
    alignSelf: "center",
    width: "100%",
  },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  rowLabel: { fontSize: 15, fontWeight: "500", color: COLORS.zinc900 },
  divider: { height: 1, backgroundColor: COLORS.zinc100, marginLeft: 20 },
});
