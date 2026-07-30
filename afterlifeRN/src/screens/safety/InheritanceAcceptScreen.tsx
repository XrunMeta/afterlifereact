import { showAlert } from "../../stores/dialogStore";
import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Alert } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/ui/Button";
import { COLORS, RADIUS, SIZES } from "../../components/constants";

export default function InheritanceAcceptScreen() {
  const { t } = useTranslation();
  const route = useRoute();
  const initialToken = (route.params as { token?: string } | undefined)?.token ?? "";
  const [token, setToken] = useState(initialToken);

  async function respond(decision: "accept" | "decline") {
    if (token.length < 32) {
      showAlert(t("safety.inheritance.invalidToken"));
      return;
    }
    showAlert(
      decision === "accept" ? t("safety.inheritance.acceptDoneTitle") : t("safety.inheritance.declineDoneTitle"),
      decision === "accept"
        ? t("safety.inheritance.acceptDoneDesc")
        : t("safety.inheritance.declineDoneDesc"),
    );
  }

  return (
    <SafeScrollView backgroundColor={COLORS.white}>
      <PageHeader title={t("safety.inheritance.title")} />
      <View style={s.wrap}>
        <Text style={s.intro}>
          {t("safety.inheritance.intro")}
        </Text>

        <Text style={s.label}>{t("safety.inheritance.tokenLabel")}</Text>
        <TextInput
          value={token}
          onChangeText={setToken}
          placeholder={t("safety.inheritance.tokenPlaceholder")}
          style={s.input}
          autoCapitalize="none"
        />

        <View style={s.btnRow}>
          <Button title={t("safety.inheritance.accept")} onPress={() => respond("accept")} />
          <View style={{ height: 12 }} />
          <Button title={t("safety.inheritance.decline")} variant="ghost" onPress={() => respond("decline")} />
        </View>
      </View>
    </SafeScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: SIZES.medium, gap: 12 },
  intro: { color: COLORS.zinc600, fontSize: 13, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.zinc700, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 15,
  },
  btnRow: { marginTop: 24 },
});
