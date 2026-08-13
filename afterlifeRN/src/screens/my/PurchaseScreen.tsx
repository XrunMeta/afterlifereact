

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import SafeView from "../../components/ui/SafeView";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, SIZES } from "../../components/constants";

export default function PurchaseScreen() {
  const { t } = useTranslation();
  return (
    <SafeView backgroundColor={COLORS.zinc50}>
      <PageHeader title={t("purchase.title", { defaultValue: "안내" })} />
      <View style={styles.container}>
        <Text style={styles.title}>
          {t("purchase.comingSoonTitle", { defaultValue: "준비 중입니다" })}
        </Text>
        <Text style={styles.desc}>
          {t("purchase.comingSoonDesc", {
            defaultValue: "이 기능은 곧 제공될 예정입니다.",
          })}
        </Text>
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SIZES.large,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.zinc900,
    marginBottom: SIZES.small,
    textAlign: "center",
  },
  desc: {
    fontSize: 15,
    color: COLORS.zinc600,
    textAlign: "center",
    lineHeight: 22,
  },
});
