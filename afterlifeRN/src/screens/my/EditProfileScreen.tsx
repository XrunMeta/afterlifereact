import React, { useEffect, useState } from "react";
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
import { useAuthStore } from "../../stores/authStore";
import { getMe } from "../../api/auth";

const GENDER_LABEL: Record<string, string> = {
  male: "남성",
  female: "여성",
  other: "기타",
};

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const apiUser = useAuthStore((s) => s.apiUser);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [interests, setInterests] = useState<string[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const me = await getMe(accessToken);
        if (cancelled) return;
        setInterests(me.interests ?? []);
      } catch (err) {
        console.warn("[EditProfile] getMe failed:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const name = apiUser?.name ?? "";
  const phone = apiUser?.phone ?? "";
  const gender = apiUser?.gender ?? null;
  const age = apiUser?.age ?? null;

  return (
    <SafeScrollView backgroundColor={COLORS.white} showBottomBackground={false}>
      <PageHeader
        title={t("settings.editProfile.title")}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <View style={s.content}>
        <View style={s.card}>
          {}
          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>{t("settings.editProfile.fields.name")}</Text>
            <TextInput
              style={s.fieldInput}
              editable={false}
              value={name}
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
              value={phone}
              placeholder="—"
              placeholderTextColor={COLORS.zinc400}
            />
          </View>

          <View style={s.divider} />

          {}
          <TouchableOpacity style={s.fieldRow}>
            <Text style={s.fieldLabel}>{t("settings.editProfile.fields.gender")}</Text>
            <Text style={[s.fieldValue, gender && s.fieldValueFilled]}>
              {gender ? GENDER_LABEL[gender] ?? gender : "—"}
            </Text>
            <Feather name="chevron-right" size={18} color={COLORS.zinc400} />
          </TouchableOpacity>

          <View style={s.divider} />

          {}
          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>{t("settings.editProfile.fields.age")}</Text>
            <TextInput
              style={s.fieldInput}
              editable={false}
              value={age != null ? String(age) : ""}
              placeholder="—"
              placeholderTextColor={COLORS.zinc400}
              keyboardType="numeric"
            />
          </View>

          <View style={s.divider} />

          {}
          <TouchableOpacity style={s.fieldRow}>
            <Text style={s.fieldLabel}>{t("settings.editProfile.fields.interests")}</Text>
            <Text
              style={[s.fieldValue, interests.length > 0 && s.fieldValueFilled]}
              numberOfLines={1}
            >
              {interests.length > 0 ? interests.join(", ") : "—"}
            </Text>
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
    color: COLORS.zinc900,
    textAlign: "right",
  },
  fieldValue: {
    flex: 1,
    fontSize: 14,
    color: COLORS.zinc400,
    textAlign: "right",
  },
  fieldValueFilled: {
    color: COLORS.zinc900,
  },
  divider: { height: 1, backgroundColor: COLORS.zinc100, marginLeft: 20 },
});
