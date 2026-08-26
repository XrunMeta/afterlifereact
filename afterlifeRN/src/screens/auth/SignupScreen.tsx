import { showAlert } from "../../stores/dialogStore";
import { activateAuthSession } from "../../lib/activateAuthSession";
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
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
import { requestEmailCode, signup, AuthApiError } from "../../api/auth";
import { saveCallLearningConsent, saveFaceBiometricConsent, saveLocationConsent } from "../../api/consent";
import { faceBiometricSignupState } from "./faceBiometricSignupFlag";
import { requestPushPermission } from "../../lib/pushNotifications";
import { getOrCreateDeviceId } from "../../lib/deviceId";
import type { RouteProp } from "@react-navigation/native";
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

  const AGE_RANGE_OPTIONS = React.useMemo(
    () => [
      { value: "10", label: t("auth.signup.ageRange10", { defaultValue: "10대" }) },
      { value: "20", label: t("auth.signup.ageRange20", { defaultValue: "20대" }) },
      { value: "30", label: t("auth.signup.ageRange30", { defaultValue: "30대" }) },
      { value: "40", label: t("auth.signup.ageRange40", { defaultValue: "40대" }) },
      { value: "50+", label: t("auth.signup.ageRange50Plus", { defaultValue: "50대 이상" }) },
    ],
    [t],
  );

  const ageRangeToAge = (r: string): number => {
    switch (r) {
      case "10":
        return 15;
      case "20":
        return 25;
      case "30":
        return 35;
      case "40":
        return 45;
      case "50+":
        return 55;
      default:
        return 0;
    }
  };
  const google = route.params?.google;

  const [name, setName] = useState(google?.name ?? "");
  const [email, setEmail] = useState(google?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");

  const [ageRange, setAgeRange] = useState<string>("");
  const [country, setCountry] = useState<CountryDialCode | null>(null);
  const [region, setRegion] = useState<CountryDialCode | null>(null);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

  const [termsModalType, setTermsModalType] = useState<AgreementType | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const focusAfterAlert = (ref: React.RefObject<TextInput | null>) => () => {
    setTimeout(() => ref.current?.focus(), 100);
  };

  const [agreeService, setAgreeService] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  const [agreeCallLearning, setAgreeCallLearning] = useState(false);

  const [agreeFaceBiometric, setAgreeFaceBiometric] = useState(false);

  const [agreeLocation, setAgreeLocation] = useState(false);

  const toggleLocationConsent = async () => {

    if (agreeLocation) {
      setAgreeLocation(false);
      return;
    }
    try {
      const Location = await import('expo-location');
      const initial = await Location.getForegroundPermissionsAsync();
      console.log(`[SignupScreen] location initial perm: granted=${initial.granted} status=${initial.status} canAskAgain=${initial.canAskAgain}`);

      const perm = initial.granted
        ? initial
        : await Location.requestForegroundPermissionsAsync();
      console.log(`[SignupScreen] location after request: granted=${perm.granted} status=${perm.status} canAskAgain=${perm.canAskAgain}`);
      if (!perm.granted) {

        console.log(`[SignupScreen] location DENIED — showing alert`);
        showAlert(
          t("auth.signup.locationPermTitle", { defaultValue: "위치 권한 필요" }),
          t("auth.signup.locationPermDesc", {
            defaultValue: "통화 시 지역 기반 대화를 하려면 위치 권한이 필요합니다.\n기기 설정 → 위치 → AfterLife 에서 허용해 주십시오.",
          }),
        );
        return;
      }
      console.log(`[SignupScreen] location GRANTED — checking box`);
      setAgreeLocation(true);
    } catch (err) {
      console.warn('[SignupScreen] location permission request failed:', err);
      showAlert(
        t("common.error"),
        t("auth.signup.locationPermError", { defaultValue: "위치 권한 요청 중 문제가 발생했습니다." }),
      );
    }
  };

  const agreeRequired = agreeService && agreePrivacy;
  const agreeAll =
    agreeRequired && agreeMarketing && agreeCallLearning && agreeFaceBiometric && agreeLocation;
  const [submitting, setSubmitting] = useState(false);

  const [pushToken, setPushToken] = useState<string | null>(null);
  const [pushPlatform, setPushPlatform] = useState<"ios" | "android" | "web" | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [requestingPush, setRequestingPush] = useState(false);

  const toggleAll = async () => {
    if (agreeAll) {

      setAgreeService(false);
      setAgreePrivacy(false);
      setAgreeMarketing(false);
      setAgreeCallLearning(false);
      setAgreeFaceBiometric(false);
      setAgreeLocation(false);
      setPushToken(null);
      setPushPlatform(null);
      setDeviceId(null);
      return;
    }

    setAgreeService(true);
    setAgreePrivacy(true);
    setAgreeCallLearning(true);
    setAgreeFaceBiometric(true);
    setAgreeLocation(true);
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
        showAlert(
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
      showAlert(t("common.error"), t("auth.signup.pushPermError"));
    } finally {
      setRequestingPush(false);
    }
  };

  const handleSubmit = async () => {

    if (!name.trim()) {
      showAlert(
        t("common.notice"),
        t("auth.signup.nameRequired", { defaultValue: "이름을 입력해주세요." }),
        [{ text: t("common.confirm", { defaultValue: "확인" }), onPress: focusAfterAlert(nameRef) }],
      );
      return;
    }
    if (!email.trim()) {
      showAlert(
        t("common.notice"),
        t("auth.signup.emailRequired", { defaultValue: "이메일을 입력해주세요." }),
        [{ text: t("common.confirm", { defaultValue: "확인" }), onPress: focusAfterAlert(emailRef) }],
      );
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showAlert(
        t("common.notice"),
        t("auth.signup.emailInvalid"),
        [{ text: t("common.confirm", { defaultValue: "확인" }), onPress: focusAfterAlert(emailRef) }],
      );
      return;
    }
    if (!password) {
      showAlert(
        t("common.notice"),
        t("auth.signup.passwordRequired", { defaultValue: "비밀번호를 입력해주세요." }),
        [{ text: t("common.confirm", { defaultValue: "확인" }), onPress: focusAfterAlert(passwordRef) }],
      );
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{7,}$/.test(password)) {
      showAlert(
        t("common.notice"),
        t("auth.signup.passwordTooShort"),
        [{ text: t("common.confirm", { defaultValue: "확인" }), onPress: focusAfterAlert(passwordRef) }],
      );
      return;
    }
    if (!confirmPassword) {
      showAlert(
        t("common.notice"),
        t("auth.signup.passwordConfirmRequired", { defaultValue: "비밀번호 확인을 입력해주세요." }),
        [{ text: t("common.confirm", { defaultValue: "확인" }), onPress: focusAfterAlert(confirmPasswordRef) }],
      );
      return;
    }
    if (password !== confirmPassword) {
      showAlert(
        t("common.notice"),
        t("auth.signup.passwordsNotMatch"),
        [{ text: t("common.confirm", { defaultValue: "확인" }), onPress: focusAfterAlert(confirmPasswordRef) }],
      );
      return;
    }

    if (phone.trim() && phone.length < 4) {
      showAlert(
        t("common.notice"),
        t("auth.signup.phoneTooShort"),
        [{ text: t("common.confirm", { defaultValue: "확인" }), onPress: focusAfterAlert(phoneRef) }],
      );
      return;
    }
    if (!agreeRequired) {
      showAlert(t("common.notice"), t("auth.signup.termsAccept"));
      return;
    }

    const ageNum = ageRange ? ageRangeToAge(ageRange) : undefined;

    setSubmitting(true);
    try {

      const countryCode = country ? country.iso2.toUpperCase() : undefined;
      const mobileCode = country
        ? (country.countryCode ??
            (Number(country.dialCode.replace(/[^\d]/g, "")) || 0))
        : undefined;
      const regionCode =
        region && region.iso2 !== "global" ? region.dialCode : undefined;

      if (google) {

        const payload = {
          email,
          password,
          name,
          phone: phone.trim() || undefined,
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
        };
        console.log("[AUTH/google.signup] payload:", JSON.stringify(payload, null, 2));
        const res = await signup(payload);

        if (agreeCallLearning) {
          try {
            await saveCallLearningConsent(res.accessToken, "granted", { channel: "signup" });
          } catch (err) {
            console.warn("[AUTH/signup] saveCallLearningConsent (google) failed:", err);
          }
        }

        try {
          await saveFaceBiometricConsent(res.accessToken, faceBiometricSignupState(agreeFaceBiometric), {
            termsVersion: "v1",
            channel: "signup",
          });
        } catch (err) {
          console.warn("[AUTH/signup] saveFaceBiometricConsent (google) failed:", err);
        }

        if (agreeLocation) {
          try {
            await saveLocationConsent(res.accessToken, "granted", { channel: "signup" });
          } catch (err) {
            console.warn("[AUTH/signup] saveLocationConsent (google) failed:", err);
          }
        }

        void activateAuthSession({
          accessToken: res.accessToken,
          refreshToken: res.refreshToken ?? null,
          persist: true,
        });
        return;
      }
      await requestEmailCode(email);
      navigation.navigate("EmailVerify", {
        email,
        password,
        name,
        phone: phone.trim() || undefined,
        gender: gender || undefined,
        age: ageNum,
        country: countryCode,
        mobileCode,
        region: regionCode,
        marketingConsent: agreeMarketing,
        agreeCallLearning,
        agreeFaceBiometric,
        agreeLocation,
        pushToken: pushToken ?? undefined,
        platform: pushPlatform ?? undefined,
        deviceId: deviceId ?? undefined,
      });
    } catch (err) {
      let msg: string = t("auth.signup.sendCodeFailed");
      if (err instanceof AuthApiError) {
        if (err.code === "OTP_COOLDOWN") {
          msg = t("auth.signup.rateLimit");
        } else {
          msg = err.message;

          if (err.code === "VALIDATION_FAILED" && err.details) {
            console.warn(
              "[AUTH/signup] VALIDATION_FAILED details:",
              JSON.stringify(err.details, null, 2),
            );
            const issues = err.details as Array<{ path?: string[]; message?: string }>;
            if (Array.isArray(issues) && issues.length > 0) {
              const lines = issues
                .map((i) => `• ${(i.path ?? []).join(".")}: ${i.message ?? "?"}`)
                .join("\n");
              msg = `${err.message}\n\n${lines}`;
            }
          }
        }
      }
      showAlert(t("common.error"), msg);
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
            ref={nameRef}
            placeholder={t("auth.signup.name")}
            value={name}
            onChangeText={setName}
            leftIcon={<Feather name="user" size={20} color={COLORS.zinc500} />}
          />

          {
}
          <TextField
            ref={emailRef}
            placeholder={t("auth.signup.email")}
            value={email}
            onChangeText={google ? undefined : setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!google}
            leftIcon={<Feather name="mail" size={20} color={COLORS.zinc500} />}
            rightIcon={
              google ? (
                <Feather name="lock" size={16} color={COLORS.zinc400} />
              ) : undefined
            }
            containerStyle={google ? styles.lockedField : undefined}
          />

          {}
          <View>
            <TextField
              ref={passwordRef}
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
            ref={confirmPasswordRef}
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
            ref={phoneRef}
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
                options={AGE_RANGE_OPTIONS}
                value={ageRange}
                onChange={setAgeRange}
                placeholder={t("auth.signup.ageRangePlaceholder", { defaultValue: "연령대" })}
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

            {}
            <View style={styles.checkRow}>
              <TouchableOpacity
                onPress={() => setAgreeCallLearning(!agreeCallLearning)}
                hitSlop={8}
              >
                <View style={[styles.checkbox, agreeCallLearning && styles.checkboxChecked]}>
                  {agreeCallLearning && <Feather name="check" size={14} color={COLORS.white} />}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.termTextWrap}
                onPress={() => setTermsModalType(5)}
                activeOpacity={0.7}
              >
                <Text style={[styles.termText, styles.termLink]}>
                  {t("auth.signup.callLearningConsent")}
                </Text>
              </TouchableOpacity>
            </View>

            {}
            <View style={styles.checkRow}>
              <TouchableOpacity
                onPress={() => setAgreeFaceBiometric(!agreeFaceBiometric)}
                hitSlop={8}
              >
                <View style={[styles.checkbox, agreeFaceBiometric && styles.checkboxChecked]}>
                  {agreeFaceBiometric && <Feather name="check" size={14} color={COLORS.white} />}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.termTextWrap}
                onPress={() => setTermsModalType(4)}
                activeOpacity={0.7}
              >
                <Text style={[styles.termText, styles.termLink]}>
                  {t("auth.signup.faceBiometricConsent")}
                </Text>
              </TouchableOpacity>
            </View>

            {
}
            <View style={styles.checkRow}>
              <TouchableOpacity
                onPress={() => void toggleLocationConsent()}
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
                  {t("auth.signup.locationConsent", { defaultValue: "[선택] 위치기반 서비스 이용동의" })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {}
          <Button
            title={submitting ? t("auth.signup.signingUp") : t("auth.signup.signupBtn")}
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
          else if (termsModalType === 3) setAgreePrivacy(true);
          else if (termsModalType === 4) setAgreeFaceBiometric(true);
          else if (termsModalType === 5) setAgreeCallLearning(true);
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

  lockedField: {
    opacity: 0.75,
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
