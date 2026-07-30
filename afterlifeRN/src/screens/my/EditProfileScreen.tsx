

import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import SelectField from "../../components/ui/SelectField";
import CountryRegionPicker from "../../components/common/CountryRegionPicker";
import { showAlert } from "../../stores/dialogStore";
import { COLORS, RADIUS } from "../../components/constants";
import { useAuthStore } from "../../stores/authStore";
import {
  patchMe,
  AuthApiError,
  type PatchMePayload,
} from "../../api/auth";
import type { CountryDialCode } from "../../types/country";
import { COUNTRY_DIAL_CODES } from "../../constants/countryDialCodes";
import { getRegionsByCountryIso2 } from "../../constants/regions";
import type { RootStackParamList } from "../../navigation/types";

type Gender = "male" | "female";
type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function EditProfileScreen() {
  const navigation = useNavigation<NavProp>();
  const { t } = useTranslation();
  const apiUser = useAuthStore((s) => s.apiUser);
  const accessToken = useAuthStore((s) => s.accessToken);
  const patchApiUser = useAuthStore((s) => s.patchApiUser);

  const GENDER_OPTIONS = useMemo(
    () => [
      { value: "male" as const, label: t("auth.signup.male") },
      { value: "female" as const, label: t("auth.signup.female") },
    ],
    [t],
  );

  const AGE_RANGE_OPTIONS = useMemo(
    () => [
      { value: "10", label: t("auth.signup.ageRange10", { defaultValue: "10대" }) },
      { value: "20", label: t("auth.signup.ageRange20", { defaultValue: "20대" }) },
      { value: "30", label: t("auth.signup.ageRange30", { defaultValue: "30대" }) },
      { value: "40", label: t("auth.signup.ageRange40", { defaultValue: "40대" }) },
      { value: "50+", label: t("auth.signup.ageRange50Plus", { defaultValue: "50대 이상" }) },
    ],
    [t],
  );
  const ageRangeToAge = (r: string): number | null => {
    switch (r) {
      case "10": return 15;
      case "20": return 25;
      case "30": return 35;
      case "40": return 45;
      case "50+": return 55;
      default: return null;
    }
  };

  const ageToRange = (a: number | null | undefined): string => {
    if (a == null || !Number.isFinite(a)) return "";
    if (a < 20) return "10";
    if (a < 30) return "20";
    if (a < 40) return "30";
    if (a < 50) return "40";
    return "50+";
  };

  const [name, setName] = useState(apiUser?.name ?? "");
  const [phone, setPhone] = useState(apiUser?.phone ?? "");

  const [gender, setGender] = useState<Gender | "">(
    apiUser?.gender === "male" || apiUser?.gender === "female"
      ? apiUser.gender
      : "",
  );

  const [ageRange, setAgeRange] = useState<string>(ageToRange(apiUser?.age));

  const initialCountry = useMemo<CountryDialCode | null>(() => {
    if (!apiUser?.country) return null;
    return (
      COUNTRY_DIAL_CODES.find(
        (c) => c.iso2.toUpperCase() === apiUser.country!.toUpperCase(),
      ) ?? null
    );
  }, [apiUser]);
  const [country, setCountry] = useState<CountryDialCode | null>(initialCountry);

  const initialRegion = useMemo<CountryDialCode | null>(() => {
    if (!apiUser?.country || !apiUser.region) return null;
    const regions = getRegionsByCountryIso2(apiUser.country.toLowerCase());
    return regions.find((r) => r.dialCode === apiUser.region) ?? null;
  }, [apiUser]);
  const [region, setRegion] = useState<CountryDialCode | null>(initialRegion);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

  const [saving, setSaving] = useState(false);

  const dirty = useMemo(() => {
    const ageNum = ageRangeToAge(ageRange);
    return (
      name.trim() !== (apiUser?.name ?? "") ||
      phone.trim() !== (apiUser?.phone ?? "") ||
      gender !== ((apiUser?.gender as Gender) ?? "") ||
      ageNum !== (apiUser?.age ?? null) ||
      (country?.iso2 ?? null) !== (apiUser?.country?.toLowerCase() ?? null) ||
      (region && region.iso2 !== "global" ? region.dialCode : null) !==
        (apiUser?.region ?? null)
    );
  }, [name, phone, gender, ageRange, country, region, apiUser]);

  const handleSave = async () => {
    if (!accessToken || !apiUser || saving || !dirty) return;

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const ageNum = ageRangeToAge(ageRange);

    if (trimmedName.length === 0) {
      showAlert(
        t("common.notice", { defaultValue: "알림" }),
        t("settings.editProfile.nameRequired", {
          defaultValue: "이름은 비워둘 수 없습니다.",
        }),
      );
      return;
    }
    if (ageNum == null) {
      showAlert(
        t("common.notice", { defaultValue: "알림" }),
        t("auth.signup.ageRangeRequired", {
          defaultValue: "연령대를 선택해주세요.",
        }),
      );
      return;
    }
    if (trimmedPhone !== "" && trimmedPhone.length < 4) {
      showAlert(
        t("common.notice", { defaultValue: "알림" }),
        t("settings.editProfile.phoneTooShort", {
          defaultValue: "전화번호는 4자 이상 입력하거나 비워두세요.",
        }),
      );
      return;
    }

    const patch: PatchMePayload = {};
    if (trimmedName !== (apiUser.name ?? "")) patch.name = trimmedName;
    if (trimmedPhone !== (apiUser.phone ?? ""))
      patch.phone = trimmedPhone || null;
    if (gender !== ((apiUser.gender as Gender) ?? ""))
      patch.gender = gender || null;
    if (ageNum !== (apiUser.age ?? null)) patch.age = ageNum;
    if (country) {
      const iso = country.iso2.toUpperCase();
      if (iso !== (apiUser.country?.toUpperCase() ?? null)) patch.country = iso;
      const mobileCodeNum =
        country.countryCode ??
        (Number(country.dialCode.replace(/[^\d]/g, "")) || null);
      if (mobileCodeNum !== (apiUser.mobileCode ?? null))
        patch.mobileCode = mobileCodeNum;
    }
    if (region && region.iso2 !== "global") {
      if (region.dialCode !== (apiUser.region ?? null))
        patch.region = region.dialCode;
    }

    setSaving(true);
    try {
      if (Object.keys(patch).length > 0) {
        await patchMe(accessToken, patch);
        patchApiUser(patch);
      }
      showAlert(
        t("settings.editProfile.savedTitle", { defaultValue: "저장됨" }),
        t("settings.editProfile.savedMsg", { defaultValue: "프로필이 저장되었습니다." }),
        [
          {
            text: t("common.ok", { defaultValue: "확인" }),
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (err) {
      let msg = t("settings.editProfile.saveFailedMsg", {
        defaultValue: "저장 중 오류가 발생했습니다.",
      });
      if (err instanceof AuthApiError) msg = err.message;
      showAlert(
        t("settings.editProfile.saveFailedTitle", { defaultValue: "저장 실패" }),
        msg,
      );
    } finally {
      setSaving(false);
    }
  };

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
              value={name}
              onChangeText={setName}
              placeholder="—"
              placeholderTextColor={COLORS.zinc400}
              maxLength={30}
            />
          </View>
          <View style={s.divider} />

          {}
          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>{t("settings.editProfile.fields.phone")}</Text>
            <TextInput
              style={s.fieldInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="—"
              placeholderTextColor={COLORS.zinc400}
              keyboardType="phone-pad"
              maxLength={20}
            />
          </View>
          <View style={s.divider} />

          {}
          <View style={s.fieldRowStack}>
            <Text style={s.fieldLabelStack}>
              {t("settings.editProfile.fields.gender")}
            </Text>
            <View style={s.selectWrap}>
              <SelectField<"male" | "female">
                options={GENDER_OPTIONS}
                value={gender}
                onChange={setGender}
                placeholder={t("auth.signup.gender")}
              />
            </View>
          </View>
          <View style={s.divider} />

          {}
          <View style={s.fieldRowStack}>
            <Text style={s.fieldLabelStack}>{t("settings.editProfile.fields.age")}</Text>
            <View style={s.selectWrap}>
              <SelectField<string>
                options={AGE_RANGE_OPTIONS}
                value={ageRange}
                onChange={setAgeRange}
                placeholder={t("auth.signup.ageRangePlaceholder", { defaultValue: "연령대" })}
              />
            </View>
          </View>
          <View style={s.divider} />

          {}
          <View style={s.fieldRowStack}>
            <Text style={s.fieldLabelStack}>
              {t("settings.editProfile.fields.country", { defaultValue: "국가" })}
            </Text>
            <TouchableOpacity
              style={s.pickerField}
              onPress={() => setCountryPickerOpen(true)}
              activeOpacity={0.7}
            >
              <Feather name="globe" size={18} color={COLORS.zinc500} />
              <View style={{ flex: 1 }}>
                {country ? (
                  <Text style={s.pickerValue} numberOfLines={1}>
                    {t(`countries:${country.iso2.toUpperCase()}`, {
                      defaultValue: country.name,
                    })}
                  </Text>
                ) : (
                  <Text style={s.pickerPlaceholder}>
                    {t("auth.signup.countryPlaceholder", {
                      defaultValue: "국가를 선택해주세요",
                    })}
                  </Text>
                )}
              </View>
              <Feather name="chevron-down" size={18} color={COLORS.zinc500} />
            </TouchableOpacity>
          </View>
          <View style={s.divider} />

          {}
          <View style={s.fieldRowStack}>
            <Text style={s.fieldLabelStack}>
              {t("settings.editProfile.fields.region", { defaultValue: "지역" })}
            </Text>
            <TouchableOpacity
              style={s.pickerField}
              onPress={() => setCountryPickerOpen(true)}
              activeOpacity={0.7}
            >
              <Feather name="map-pin" size={18} color={COLORS.zinc500} />
              <View style={{ flex: 1 }}>
                {region && region.iso2 !== "global" ? (
                  <Text style={s.pickerValue} numberOfLines={1}>
                    {t(`regions:${region.countryCode}_${region.dialCode}`, {
                      defaultValue: region.name,
                    })}
                  </Text>
                ) : (
                  <Text style={s.pickerPlaceholder}>
                    {country
                      ? t("auth.signup.regionPlaceholder", {
                          defaultValue: "지역을 선택해주세요",
                        })
                      : t("settings.editProfile.regionAfterCountry", {
                          defaultValue: "먼저 국가를 선택해주세요",
                        })}
                  </Text>
                )}
              </View>
              <Feather name="chevron-down" size={18} color={COLORS.zinc500} />
            </TouchableOpacity>
          </View>
          <View style={s.divider} />

          {

}
          <TouchableOpacity
            style={s.fieldRow}
            onPress={() => {
              if (!apiUser?.email) {
                showAlert(
                  t("settings.editProfile.noEmailTitle", {
                    defaultValue: "이메일 없음",
                  }),
                  t("settings.editProfile.noEmailMsg", {
                    defaultValue:
                      "계정 이메일이 없어요. 로그아웃 후 [비밀번호를 잊으셨나요?] 에서 진행해주세요.",
                  }),
                );
                return;
              }
              navigation.navigate("ResetPassword", { email: apiUser.email });
            }}
          >
            <Text style={s.fieldLabel}>
              {t("settings.editProfile.fields.password", { defaultValue: "비밀번호" })}
            </Text>
            <Text style={[s.fieldValueLink]}>
              {t("settings.editProfile.fields.passwordReset", { defaultValue: "재설정" })}
            </Text>
            <Feather
              name="chevron-right"
              size={18}
              color={COLORS.zinc400}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[s.saveBtn, (!dirty || saving) && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!dirty || saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={s.saveBtnText}>
              {t("common.save", { defaultValue: "저장" })}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <CountryRegionPicker
        visible={countryPickerOpen}
        selectedCountry={country}
        selectedRegion={region}
        onClose={() => setCountryPickerOpen(false)}
        onSelect={(c: CountryDialCode, r: CountryDialCode | null) => {
          setCountry(c);
          setRegion(r);
        }}
      />
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
    minHeight: 56,
  },
  fieldRowStack: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  fieldLabel: {
    width: 80,
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.zinc700,
  },
  fieldLabelStack: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.zinc700,
  },
  fieldInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.zinc900,
    textAlign: "right",
    padding: 0,
  },
  fieldValueLink: {
    flex: 1,
    fontSize: 14,
    color: COLORS.violet600,
    textAlign: "right",
    fontWeight: "600",
  },
  divider: { height: 1, backgroundColor: COLORS.zinc100, marginLeft: 20 },
  selectWrap: {
    width: "100%",
  },
  pickerField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  pickerValue: { fontSize: 14, color: COLORS.zinc900 },
  pickerRegion: { fontSize: 12, color: COLORS.zinc500 },
  pickerPlaceholder: { fontSize: 14, color: COLORS.zinc400 },
  saveBtn: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.violet600,
    alignItems: "center",
  },
  saveBtnDisabled: { backgroundColor: COLORS.zinc300 },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: COLORS.white },
});
