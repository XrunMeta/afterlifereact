import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import i18n, { changeLanguage } from "../../i18n";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, RADIUS } from "../../components/constants";

const LANGUAGE_OPTIONS = [
  { code: "ko", labelKey: "settings.language.ko" },
  { code: "ja", labelKey: "settings.language.ja" },
  { code: "en", labelKey: "settings.language.en" },
  { code: "zh-CN", labelKey: "settings.language.zh-CN" },
  { code: "id", labelKey: "settings.language.id" },
] as const;

type LanguageCode = (typeof LANGUAGE_OPTIONS)[number]["code"];

export default function LanguageSettingsScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<LanguageCode>(
    (i18n.language as LanguageCode) ?? "ko",
  );

  const handleSelect = (code: LanguageCode) => {
    setSelected(code);
    void changeLanguage(code);
  };

  return (
    <SafeScrollView backgroundColor={COLORS.white} showBottomBackground={false}>
      <PageHeader
        title={t("settings.language.title")}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <View style={s.content}>
        <View style={s.card}>
          {LANGUAGE_OPTIONS.map((lang, i) => (
            <View key={lang.code}>
              <TouchableOpacity
                style={s.row}
                onPress={() => handleSelect(lang.code)}
              >
                <Text style={s.rowLabel}>{t(lang.labelKey)}</Text>
                {selected === lang.code && (
                  <Feather name="check" size={20} color={COLORS.violet500} />
                )}
              </TouchableOpacity>
              {i < LANGUAGE_OPTIONS.length - 1 && <View style={s.divider} />}
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
