import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import Button from "../../components/ui/Button";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";

import SafeView from "../../components/ui/SafeView";
import SafeScrollView from "../../components/ui/SafeScrollView";
import TextField from "../../components/ui/TextField";
import SelectField from "../../components/ui/SelectField";
import PageHeader from "../../components/common/PageHeader";
import CountryRegionPicker from "../../components/common/CountryRegionPicker";
import TermsModal, { type AgreementType } from "../../components/common/TermsModal";
import { COLORS, SIZES, RADIUS } from "../../components/constants";
import { requestEmailCode, signup, getMe, AuthApiError } from "../../api/auth";
import { requestPushPermission } from "../../lib/pushNotifications";
import { getOrCreateDeviceId } from "../../lib/deviceId";
import type { RouteProp } from "@react-navigation/native";
import { useAuthStore } from "../../stores/authStore";
import type { CountryDialCode } from "../../types/country";
import { GLOBAL_REGION } from "../../constants/regions";

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Signup">;
  route: RouteProp<AuthStackParamList, "Signup">;
};

export default function SignupScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const GENDER_OPTIONS = [
    { value: "male" as const, label: t("auth.signup.male") },
    { value: "female" as const, label: t("auth.signup.female") },
  ];

  const BIRTH_YEAR_OPTIONS = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const maxYear = currentYear - 13; 
    const minYear = currentYear - 120;
    const years: { value: string; label: string }[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      const yStr = String(y);
      years.push({
        value: yStr,
        label: t("auth.signup.birthYearLabel", { year: yStr, defaultValue: `${yStr}년생` }),
      });
    }
    return years;
  }, [t]);
  const google = route.params?.google;
  const setApiAuth = useAuthStore((s) => s.setApiAuth);
  const hydrate = useAuthStore((s) => s.hydrate);

  const [name, setName] = useState(google?.name ?? "");
  const [email, setEmail] = useState(google?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");

  const [birthYear, setBirthYear] = useState<string>("");
  const [country, setCountry] = useState<CountryDialCode | null>(null);
  const [region, setRegion] = useState<CountryDialCode | null>(null);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

  const [termsModalType, setTermsModalType] = useState<AgreementType | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [agreeService, setAgreeService] = useState(false);
  const [agreeLocation, setAgreeLocation] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  const agreeRequired = agreeService && agreeLocation && agreePrivacy;
  const agreeAll = agreeRequired && agreeMarketing;
  const [submitting, setSubmitting] = useState(false);

  const [pushToken, setPushToken] = useState<string | null>(null);
  const [pushPlatform, setPushPlatform] = useState<"ios" | "android" | "web" | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [requestingPush, setRequestingPush] = useState(false);

  const toggleAll = async () => {
    if (agreeAll) {

      setAgreeService(false);
      setAgreeLocation(false);
      setAgreePrivacy(false);
      setAgreeMarketing(false);
      setPushToken(null);
      setPushPlatform(null);
      setDeviceId(null);
      return;
    }

    setAgreeService(true);
    setAgreeLocation(true);
    setAgreePrivacy(true);
    if (!agreeMarketing) {
      await toggleMarketing();
    }
  };

  const toggleMarketing = async () => {

    if (agreeMarketing) {
      setAgreeMarketing(false);
      setPushToken(null);
      setPushPlatform(null);
      setDeviceId(null);
      return;
    }

    setRequestingPush(true);
    try {
      const reg = await requestPushPermission();
      if (!reg.granted) {
        Alert.alert(
          t("auth.signup.pushPermTitle"),
          t("auth.signup.pushPermDesc"),
        );
        return;
      }
      const did = await getOrCreateDeviceId();
      setAgreeMarketing(true);
      setPushToken(reg.token ?? null);
      setPushPlatform(reg.platform);
      setDeviceId(did);
    } catch {
      Alert.alert(t("common.error"), t("auth.signup.pushPermError"));
    } finally {
      setRequestingPush(false);
    }
  };

  const handleSubmit = async () => {
    if (!name || !email || !password || !phone || !gender || !birthYear) {
      Alert.alert(t("common.notice"), t("auth.signup.requiredFields"));
      return;
    }
    if (!country) {
      Alert.alert(t("common.notice"), t("auth.signup.countryRequired"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert(t("common.notice"), t("auth.signup.emailInvalid"));
      return;
    }
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password)) {
      Alert.alert(t("common.notice"), t("auth.signup.passwordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t("common.notice"), t("auth.signup.passwordsNotMatch"));
      return;
    }
    if (phone.length < 4) {
      Alert.alert(t("common.notice"), t("auth.signup.phoneTooShort"));
      return;
    }
    if (!agreeRequired) {
      Alert.alert(t("common.notice"), t("auth.signup.termsAccept"));
      return;
    }

    const birthYearNum = parseInt(birthYear, 10);
    const currentYear = new Date().getFullYear();
    const ageNum = currentYear - birthYearNum;
    if (Number.isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
      Alert.alert(t("common.notice"), t("auth.signup.ageInvalid"));
      return;
    }

    setSubmitting(true);
    try {

      const countryCode = country.iso2.toUpperCase();
      const mobileCode = country.countryCode ?? 0;
      const regionCode =
        region && region.iso2 !== "global" ? region.dialCode : undefined;

      if (google) {

        const res = await signup({
          email,
          password,
          name,
          phone,
          gender: gender || undefined,
          age: ageNum,
          country: countryCode,
          mobileCode,
          region: regionCode,
          marketingConsent: agreeMarketing,
          deviceId: deviceId ?? undefined,
          pushToken: pushToken ?? undefined,
          platform: pushPlatform ?? undefined,
          googleIdToken: google.idToken,
        });
        const meRes = await getMe(res.accessToken);
        await setApiAuth(res.accessToken, meRes.user);
        console.log("[AUTH/google.signup] user:", meRes.user);
        await hydrate();
        return;
      }
      await requestEmailCode(email);
      navigation.navigate("EmailVerify", {
        email,
        password,
        name,
        phone,
        gender: gender || undefined,
        age: ageNum,
        country: countryCode,
        mobileCode,
        region: regionCode,
        marketingConsent: agreeMarketing,
        pushToken: pushToken ?? undefined,
        platform: pushPlatform ?? undefined,
        deviceId: deviceId ?? undefined,
      });
    } catch (err) {
      const msg =
        err instanceof AuthApiError
          ? err.code === "OTP_COOLDOWN"
            ? t("auth.signup.rateLimit")
            : err.message
          : t("auth.signup.sendCodeFailed");
      Alert.alert(t("common.error"), msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeView backgroundColor={COLORS.zinc50}>
      <PageHeader
        title={t("auth.signup.title")}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <SafeScrollView
        contentContainerStyle={styles.content}
        autoAdjustKeyboardPadding
        showBottomBackground={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {}
          <TextField
            placeholder={t("auth.signup.name")}
            value={name}
            onChangeText={setName}
            leftIcon={<Feather name="user" size={20} color={COLORS.zinc500} />}
          />

          {}
          <TextField
            placeholder={t("auth.signup.email")}
            value={email}
            onChangeText={google ? undefined : setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!google}
            leftIcon={<Feather name="mail" size={20} color={COLORS.zinc500} />}
          />

          {}
          <View>
            <TextField
              placeholder={t("auth.signup.password")}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              leftIcon={<Feather name="lock" size={20} color={COLORS.zinc500} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Feather name={showPassword ? "eye-off" : "eye"} size={20} color={COLORS.zinc500} />
                </TouchableOpacity>
              }
            />
            <Text style={styles.passwordHint}>{t("auth.signup.passwordHint")}</Text>
          </View>

          {}
          <TextField
            placeholder={t("auth.signup.passwordConfirm")}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            leftIcon={<Feather name="lock" size={20} color={COLORS.zinc500} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Feather name={showConfirmPassword ? "eye-off" : "eye"} size={20} color={COLORS.zinc500} />
              </TouchableOpacity>
            }
            errorText={
              confirmPassword.length > 0 && confirmPassword !== password
                ? t("auth.signup.passwordsNotMatch")
                : undefined
            }
          />

          {}
          <TextField
            placeholder={t("auth.signup.phone")}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon={<Feather name="phone" size={20} color={COLORS.zinc500} />}
          />

          {}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <SelectField<"male" | "female">
                options={GENDER_OPTIONS}
                value={gender}
                onChange={setGender}
                placeholder={t("auth.signup.gender")}
              />
            </View>
            <View style={{ flex: 1 }}>
              <SelectField<string>
                options={BIRTH_YEAR_OPTIONS}
                value={birthYear}
                onChange={setBirthYear}
                placeholder={t("auth.signup.birthYearPlaceholder")}
              />
            </View>
          </View>

          {}
          <TouchableOpacity
            style={styles.pickerField}
            onPress={() => setCountryPickerOpen(true)}
            activeOpacity={0.7}
          >
            <Feather name="globe" size={18} color={COLORS.zinc500} />
            <View style={styles.pickerLabelWrap}>
              {country ? (
                <Text style={styles.pickerValue} numberOfLines={1}>
                  {country.flagEmoji}{" "}
                  {t(`countries:${country.iso2.toUpperCase()}`, {
                    defaultValue: country.name,
                  })}
                  {region && region.iso2 !== "global" && (
                    <Text style={styles.pickerRegion}>
                      {"  ·  "}
                      {t(`regions:${region.countryCode}_${region.dialCode}`, {
                        defaultValue: region.name,
                      })}
                    </Text>
                  )}
                </Text>
              ) : (
                <Text style={styles.pickerPlaceholder}>
                  {t("auth.signup.countryPlaceholder")}
                </Text>
              )}
            </View>
            <Feather name="chevron-right" size={18} color={COLORS.zinc400} />
          </TouchableOpacity>

          {}
          <View style={styles.terms}>
            {}
            <TouchableOpacity
              onPress={toggleAll}
              disabled={requestingPush}
              style={[styles.checkRow, styles.checkRowAll]}
            >
              <View style={[styles.checkbox, agreeAll && styles.checkboxChecked]}>
                {agreeAll && <Feather name="check" size={14} color={COLORS.white} />}
              </View>
              <Text style={[styles.termText, styles.termTextAll]}>
                {t("auth.signup.termsAgreeAll")}
              </Text>
            </TouchableOpacity>

            <View style={styles.termsDivider} />

            {}
            <View style={styles.checkRow}>
              <TouchableOpacity
                onPress={() => setAgreeService(!agreeService)}
                hitSlop={8}
              >
                <View style={[styles.checkbox, agreeService && styles.checkboxChecked]}>
                  {agreeService && <Feather name="check" size={14} color={COLORS.white} />}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.termTextWrap}
                onPress={() => setTermsModalType(1)}
                activeOpacity={0.7}
              >
                <Text style={[styles.termText, styles.termLink]}>
                  {t("auth.signup.termsService")}
                </Text>
              </TouchableOpacity>
            </View>

            {}
            <View style={styles.checkRow}>
              <TouchableOpacity
                onPress={() => setAgreeLocation(!agreeLocation)}
                hitSlop={8}
              >
                <View style={[styles.checkbox, agreeLocation && styles.checkboxChecked]}>
                  {agreeLocation && <Feather name="check" size={14} color={COLORS.white} />}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.termTextWrap}
                onPress={() => setTermsModalType(2)}
                activeOpacity={0.7}
              >
                <Text style={[styles.termText, styles.termLink]}>
                  {t("auth.signup.termsLocation")}
                </Text>
              </TouchableOpacity>
            </View>

            {}
            <View style={styles.checkRow}>
              <TouchableOpacity
                onPress={() => setAgreePrivacy(!agreePrivacy)}
                hitSlop={8}
              >
                <View style={[styles.checkbox, agreePrivacy && styles.checkboxChecked]}>
                  {agreePrivacy && <Feather name="check" size={14} color={COLORS.white} />}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.termTextWrap}
                onPress={() => setTermsModalType(3)}
                activeOpacity={0.7}
              >
                <Text style={[styles.termText, styles.termLink]}>
                  {t("auth.signup.termsPrivacy")}
                </Text>
              </TouchableOpacity>
            </View>

            {}
            <TouchableOpacity
              onPress={toggleMarketing}
              disabled={requestingPush}
              style={styles.checkRow}
            >
              <View style={[styles.checkbox, agreeMarketing && styles.checkboxChecked]}>
                {agreeMarketing && <Feather name="check" size={14} color={COLORS.white} />}
              </View>
              <Text style={styles.termText}>
                {t("auth.signup.marketingConsent")}
                {requestingPush ? ` (${t("auth.signup.verifying")})` : ""}
              </Text>
            </TouchableOpacity>
          </View>

          {}
          <Button
            title={submitting ? t("auth.signup.verifying") : t("auth.signup.signupBtn")}
            onPress={handleSubmit}
            disabled={submitting}
          />
        </View>
      </SafeScrollView>

      {

}
      <CountryRegionPicker
        visible={countryPickerOpen}
        onClose={() => setCountryPickerOpen(false)}
        selectedCountry={country}
        selectedRegion={region}
        onSelect={(c, r) => {
          setCountry(c);
          setRegion(r);
        }}
      />

      {
}
      <TermsModal
        visible={termsModalType !== null}
        type={termsModalType}
        onClose={() => setTermsModalType(null)}
        onAgree={() => {
          if (termsModalType === 1) setAgreeService(true);
          else if (termsModalType === 2) setAgreeLocation(true);
          else if (termsModalType === 3) setAgreePrivacy(true);
          setTermsModalType(null);
        }}
      />
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: SIZES.xlarge,
    paddingVertical: SIZES.xxlarge,
  },
  container: {
    width: "100%",
    maxWidth: 780,
    gap: SIZES.medium,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  ageField: {
    width: 100,
  },
  pickerField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    backgroundColor: COLORS.white,
  },
  pickerLabelWrap: { flex: 1 },
  pickerPlaceholder: { fontSize: 14, color: COLORS.zinc400 },
  pickerValue: { fontSize: 14, color: COLORS.zinc900 },
  pickerRegion: { color: COLORS.zinc500, fontSize: 13 },
  passwordHint: {
    fontSize: 12,
    color: COLORS.zinc500,
    marginTop: 6,
    marginLeft: 4,
  },
  terms: {
    gap: 10,
    paddingTop: SIZES.medium,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  checkRowAll: {
    paddingVertical: 4,
  },
  termTextAll: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.zinc900,
  },
  termsDivider: {
    height: 1,
    backgroundColor: COLORS.zinc200,
    marginVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.zinc300,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.zinc900,
    borderColor: COLORS.zinc900,
  },
  termText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.zinc600,
    lineHeight: 20,
  },
  termTextWrap: {
    flex: 1,
  },

  termLink: {
    textDecorationLine: "underline",
  },
  termBold: {
    fontWeight: "600",
    color: COLORS.zinc900,
  },
  termOptional: {
    color: COLORS.zinc400,
  },
});
