import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
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
import InterestChip from "../../components/ui/InterestChip";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, SIZES, RADIUS } from "../../components/constants";
import { ALL_INTERESTS } from "../../mocks/interestHelpers";
import { requestEmailCode, signup, getMe, AuthApiError } from "../../api/auth";
import { requestPushPermission } from "../../lib/pushNotifications";
import { getOrCreateDeviceId } from "../../lib/deviceId";
import type { RouteProp } from "@react-navigation/native";
import { useAuthStore } from "../../stores/authStore";

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Signup">;
  route: RouteProp<AuthStackParamList, "Signup">;
};

const INTEREST_OPTIONS = ALL_INTERESTS;

export default function SignupScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const GENDER_OPTIONS = [
    { value: "male" as const, label: t("auth.signup.male") },
    { value: "female" as const, label: t("auth.signup.female") },
    { value: "other" as const, label: t("auth.signup.other") },
  ];
  const google = route.params?.google;
  const setApiAuth = useAuthStore((s) => s.setApiAuth);
  const hydrate = useAuthStore((s) => s.hydrate);

  const [name, setName] = useState(google?.name ?? "");
  const [email, setEmail] = useState(google?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [age, setAge] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeRequired, setAgreeRequired] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [pushToken, setPushToken] = useState<string | null>(null);
  const [pushPlatform, setPushPlatform] = useState<"ios" | "android" | "web" | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [requestingPush, setRequestingPush] = useState(false);

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

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async () => {
    if (!name || !email || !password || !phone || !gender || !age) {
      Alert.alert(t("common.notice"), t("auth.signup.requiredFields"));
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

    const ageNum = parseInt(age, 10);
    if (Number.isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
      Alert.alert(t("common.notice"), t("auth.signup.ageInvalid"));
      return;
    }

    setSubmitting(true);
    try {
      if (google) {

        const res = await signup({
          email,
          password,
          name,
          phone,
          gender: gender || undefined,
          age: ageNum,
          interests: selectedInterests.length > 0 ? selectedInterests : undefined,
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
        interests: selectedInterests.length > 0 ? selectedInterests : undefined,
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
          <View style={styles.logoRow}>
            <Image source={require("../../../assets/images/symbol.png")} style={styles.symbolImage} />
            <Image source={require("../../../assets/images/logo.png")} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.subtitle}>{t("auth.signup.subtitle")}</Text>
          </View>

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
              <SelectField<"male" | "female" | "other">
                options={GENDER_OPTIONS}
                value={gender}
                onChange={setGender}
                placeholder={t("auth.signup.gender")}
              />
            </View>
            <View style={styles.ageField}>
              <TextField
                placeholder={t("auth.signup.age")}
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t("auth.signup.interests")}</Text>
            <View style={styles.chipGrid}>
              {INTEREST_OPTIONS.map((interest) => (
                <InterestChip
                  key={interest}
                  label={interest}
                  selected={selectedInterests.includes(interest)}
                  onPress={() => toggleInterest(interest)}
                />
              ))}
            </View>
          </View>

          {}
          <View style={styles.terms}>
            <TouchableOpacity
              onPress={() => setAgreeRequired(!agreeRequired)}
              style={styles.checkRow}
            >
              <View style={[styles.checkbox, agreeRequired && styles.checkboxChecked]}>
                {agreeRequired && <Feather name="check" size={14} color={COLORS.white} />}
              </View>
              <Text style={styles.termText}>{t("auth.signup.termsRequired")}</Text>
            </TouchableOpacity>
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

          {}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>{t("auth.login.signupHint")} </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>{t("auth.login.loginBtn")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeScrollView>
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
  logoRow: {
    alignItems: "center",
    marginBottom: SIZES.large,
  },
  symbolImage: {
    width: 100,
    height: 80,
    marginBottom: 12,
  },
  logoImage: {
    width: 160,
    height: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.zinc600,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  ageField: {
    width: 100,
  },
  passwordHint: {
    fontSize: 12,
    color: COLORS.zinc500,
    marginTop: 6,
    marginLeft: 4,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.zinc900,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  terms: {
    gap: 12,
    paddingTop: SIZES.medium,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
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
  termBold: {
    fontWeight: "600",
    color: COLORS.zinc900,
  },
  termOptional: {
    color: COLORS.zinc400,
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: SIZES.medium,
  },
  loginText: {
    fontSize: 14,
    color: COLORS.zinc500,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.zinc900,
  },
});
