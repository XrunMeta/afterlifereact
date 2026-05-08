import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/ui/Button";
import { COLORS, SIZES } from "../../components/constants";

export default function RestoreDeletedScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  async function restore() {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      Alert.alert(t("restore.successTitle"), t("restore.successMsg"));
    } catch (e) {
      Alert.alert(t("restore.failTitle"), t("restore.failMsg"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeScrollView backgroundColor={COLORS.white}>
      <PageHeader title={t("restore.title")} />
      <View style={s.wrap}>
        <Text style={s.title}>{t("restore.headTitle")}</Text>
        <Text style={s.body}>
          {t("restore.desc1")}
          {"\n\n"}
          {t("restore.desc2")}
          {"\n\n"}
          {t("restore.desc3")}
        </Text>
        <View style={{ height: 20 }} />
        <Button title={loading ? t("restore.submitting") : t("restore.submit")} onPress={restore} disabled={loading} />
      </View>
    </SafeScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: SIZES.medium },
  title: { fontSize: 18, fontWeight: "700", color: COLORS.zinc900, marginBottom: 12 },
  body: { fontSize: 14, lineHeight: 22, color: COLORS.zinc600 },
});
