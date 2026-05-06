import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, RADIUS } from "../../components/constants";

export default function PrivacySettingsScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const items = [

    { key: "blockList", labelKey: "settings.privacy.blockList", icon: "slash" as const },
    { key: "dataDownload", labelKey: "settings.privacy.dataDownload", icon: "download" as const },
    { key: "deleteAccount", labelKey: "settings.privacy.deleteAccount", icon: "trash-2" as const, danger: true },
  ];

  return (
    <SafeScrollView backgroundColor={COLORS.white} showBottomBackground={false}>
      <PageHeader
        title={t("settings.privacy.title")}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <View style={s.content}>
        <View style={s.card}>
          {items.map((item, i) => (
            <View key={item.key}>
              <TouchableOpacity style={s.row}>
                <Feather
                  name={item.icon}
                  size={20}
                  color={item.danger ? COLORS.error : COLORS.zinc700}
                  style={s.rowIcon}
                />
                <Text style={[s.rowLabel, item.danger && s.rowLabelDanger]}>
                  {t(item.labelKey)}
                </Text>
                <Feather name="chevron-right" size={18} color={COLORS.zinc400} />
              </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 12,
  },
  rowIcon: { width: 24, textAlign: "center" },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: "500", color: COLORS.zinc900 },
  rowLabelDanger: { color: COLORS.error },
  divider: { height: 1, backgroundColor: COLORS.zinc100, marginLeft: 20 },
});
