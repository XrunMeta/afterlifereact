import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/ui/Button";
import { COLORS, RADIUS, SIZES } from "../../components/constants";

export default function GDPRDeleteScreen() {
  const { t } = useTranslation();
  const CONFIRM_PHRASE = t("gdpr.phrase");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (confirm.trim() !== CONFIRM_PHRASE) {
      Alert.alert(t("gdpr.phraseMismatch"), t("gdpr.phraseMismatchMsg", { phrase: CONFIRM_PHRASE }));
      return;
    }
    Alert.alert(
      t("gdpr.finalTitle"),
      t("gdpr.finalDesc"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("gdpr.finalConfirm"),
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await new Promise((r) => setTimeout(r, 600));
              Alert.alert(t("gdpr.successTitle"), t("gdpr.successMsg"));
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeScrollView backgroundColor={COLORS.white}>
      <PageHeader title={t("gdpr.title")} />
      <View style={s.wrap}>
        <Text style={s.warn}>{t("gdpr.warning")}</Text>
        <Text style={s.body}>
          {t("gdpr.desc1")}
          {"\n\n"}
          {t("gdpr.desc2")}
        </Text>

        <Text style={s.label}>{t("gdpr.label")}</Text>
        <Text style={s.helper}>{t("gdpr.helper", { phrase: CONFIRM_PHRASE })}</Text>
        <TextInput
          value={confirm}
          onChangeText={setConfirm}
          style={s.input}
          autoCapitalize="none"
        />

        <View style={{ height: 16 }} />
        <Button
          title={loading ? t("gdpr.submitting") : t("gdpr.submit")}
          onPress={submit}
          disabled={loading}
          variant="danger"
        />
      </View>
    </SafeScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: SIZES.medium },
  warn: { fontSize: 16, fontWeight: "700", color: "#dc2626", marginBottom: 12 },
  body: { fontSize: 14, lineHeight: 22, color: COLORS.zinc700 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.zinc700, marginTop: 20 },
  helper: { fontSize: 12, color: COLORS.zinc500, marginTop: 4, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.zinc300,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 15,
  },
});
