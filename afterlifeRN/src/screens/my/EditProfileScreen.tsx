import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, RADIUS } from "../../components/constants";

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  return (
    <SafeScrollView backgroundColor={COLORS.white} showBottomBackground={false}>
      <PageHeader
        title={t("settings.editProfile.title")}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <View style={s.content}>
        {}
        <TouchableOpacity style={s.avatarRow}>
          <View style={s.avatarPlaceholder}>
            <Feather name="camera" size={28} color={COLORS.zinc400} />
          </View>
          <Text style={s.avatarLabel}>{t("settings.editProfile.fields.avatar")}</Text>
          <Feather name="chevron-right" size={20} color={COLORS.zinc400} />
        </TouchableOpacity>

        <View style={s.card}>
          {}
          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>{t("settings.editProfile.fields.name")}</Text>
            <TextInput
              style={s.fieldInput}
              editable={false}
              placeholder="—"
              placeholderTextColor={COLORS.zinc400}
            />
          </View>

          <View style={s.divider} />

          {}
          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>{t("settings.editProfile.fields.phone")}</Text>
            <TextInput
              style={s.fieldInput}
              editable={false}
              placeholder="—"
              placeholderTextColor={COLORS.zinc400}
            />
          </View>

          <View style={s.divider} />

          {}
          <TouchableOpacity style={s.fieldRow}>
            <Text style={s.fieldLabel}>{t("settings.editProfile.fields.gender")}</Text>
            <Text style={s.fieldValue}>—</Text>
            <Feather name="chevron-right" size={18} color={COLORS.zinc400} />
          </TouchableOpacity>

          <View style={s.divider} />

          {}
          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>{t("settings.editProfile.fields.age")}</Text>
            <TextInput
              style={s.fieldInput}
              editable={false}
              placeholder="—"
              placeholderTextColor={COLORS.zinc400}
              keyboardType="numeric"
            />
          </View>

          <View style={s.divider} />

          {}
          <TouchableOpacity style={s.fieldRow}>
            <Text style={s.fieldLabel}>{t("settings.editProfile.fields.interests")}</Text>
            <Text style={s.fieldValue}>—</Text>
            <Feather name="chevron-right" size={18} color={COLORS.zinc400} />
          </TouchableOpacity>
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
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLabel: { flex: 1, fontSize: 15, fontWeight: "500", color: COLORS.zinc700 },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  fieldLabel: {
    width: 80,
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.zinc700,
  },
  fieldInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.zinc400,
    textAlign: "right",
  },
  fieldValue: {
    flex: 1,
    fontSize: 14,
    color: COLORS.zinc400,
    textAlign: "right",
  },
  divider: { height: 1, backgroundColor: COLORS.zinc100, marginLeft: 20 },
});
