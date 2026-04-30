import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import { COLORS } from "../../components/constants";

export default function SavedItemsScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  return (
    <SafeScrollView backgroundColor={COLORS.white} showBottomBackground={false}>
      <PageHeader
        title={t("settings.saved.title")}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <View style={s.content}>
        <View style={s.emptyState}>
          <View style={s.emptyIcon}>
            <Feather name="bookmark" size={40} color={COLORS.zinc300} />
          </View>
          <Text style={s.emptyText}>{t("settings.saved.empty")}</Text>
        </View>
      </View>
    </SafeScrollView>
  );
}

const s = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 780,
    alignSelf: "center",
    width: "100%",
  },
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
