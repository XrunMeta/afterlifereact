

import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Modal,
  FlatList,
  TextInput,
  Keyboard,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type LayoutChangeEvent,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import { showAlert } from "../../stores/dialogStore";
import { activateAuthSession } from "../../lib/activateAuthSession";
import SafeView from "../../components/ui/SafeView";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import TermsModal, { type AgreementType } from "../../components/common/TermsModal";
import { COLORS, SIZES, RADIUS } from "../../components/constants";
import {
  requestEmailCode,
  signup,
  checkEmailXrun,
  AuthApiError,
} from "../../api/auth";
import {
  saveCallLearningConsent,
  saveFaceBiometricConsent,
  saveLocationConsent,
} from "../../api/consent";
import { markSsoReconsentDone } from "../../hooks/useSsoReconsentGate";
import { faceBiometricSignupState } from "./faceBiometricSignupFlag";
import { requestPushPermission } from "../../lib/pushNotifications";
import { getOrCreateDeviceId } from "../../lib/deviceId";
import type { AuthStackParamList } from "../../navigation/types";
import type { CountryDialCode } from "../../types/country";
import {
  XRUN_AGES_OPTIONS,
  getXrunRegionsOrFallback,
} from "../../constants/xrunCodes";
import { ALLOWED_COUNTRIES, COUNTRY_DIAL_CODES } from "../../constants";

const SIGNUP_COUNTRIES: CountryDialCode[] = (() => {
  const seen = new Set<string>();
  const unique = COUNTRY_DIAL_CODES.filter((c) => {
    const key = `${c.iso2}|${c.dialCode}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const kr = unique.find((c) => c.iso2.toLowerCase() === "kr");
  const rest = unique.filter((c) => c.iso2.toLowerCase() !== "kr");
  return kr ? [kr, ...rest] : unique;
})();

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Signup">;
  route: RouteProp<AuthStackParamList, "Signup">;
};

const XRUN = {
  mutedText: "#8e9bae",
  headingText: "#343A5A",
  cardBg: "#ffffff",
  pageBg: "#f9fafc",
  fieldBorder: "#ededed",
  divider: "#f0f0f0",

  primary: COLORS.primary,
  danger: "#ff6b6b",
};

const FONTS = {
  regular: "Roboto-Regular",
  medium: "Roboto-Medium",
  semi: "Roboto-SemiBold",
  bold: "Roboto-Bold",
};

const OPTION_PILL_WIDTH = 80;

function OptionButton({
  label,
  selected,
  onPress,
  style,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: object;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        pillStyles.base,
        selected ? pillStyles.selected : pillStyles.unselected,
        style,
      ]}
    >
      <Text
        style={[
          pillStyles.label,
          selected ? pillStyles.labelSelected : pillStyles.labelUnselected,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const pillStyles = StyleSheet.create({

  base: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  selected: {
    backgroundColor: XRUN.primary,
    borderColor: XRUN.primary,
  },
  unselected: {
    backgroundColor: XRUN.cardBg,
    borderColor: "#e3e9ed", 
  },
  label: {
    fontSize: 14,
    fontFamily: FONTS.medium, 
  },

  labelSelected: { color: "#ffffff" },
  labelUnselected: { color: XRUN.headingText },
});

function SquareCheckbox({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      hitSlop={8}
      activeOpacity={0.7}
      style={[
        cbStyles.box,
        checked ? cbStyles.boxChecked : cbStyles.boxUnchecked,
      ]}
    >
      {}
      {checked ? <View style={cbStyles.checkMark} /> : null}
    </TouchableOpacity>
  );
}

const cbStyles = StyleSheet.create({

  box: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  boxChecked: {
    backgroundColor: XRUN.primary,
    borderColor: XRUN.primary,
  },
  boxUnchecked: {
    backgroundColor: XRUN.cardBg,
    borderColor: "#dedede",
  },
  checkMark: {
    width: 10,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderLeftColor: "#ffffff",
    borderBottomColor: "#ffffff",
    transform: [{ rotate: "-45deg" }],
    marginTop: -2,
  },
});

const FormField = React.forwardRef<
  TextInput,
  {
    label: string;
    placeholder?: string;
    value: string;
    onChangeText?: (v: string) => void;
    keyboardType?: any;
    autoCapitalize?: any;
    secureTextEntry?: boolean;
    editable?: boolean;
    maxLength?: number;
    onPress?: () => void;
    leftAccessory?: React.ReactNode;
    rightAccessory?: React.ReactNode;
    errorText?: string;
    showPressStyle?: boolean;
  }
>(function FormField(props, ref) {
  const {
    label,
    placeholder,
    value,
    onChangeText,
    keyboardType,
    autoCapitalize,
    secureTextEntry,
    editable = true,
    maxLength,
    onPress,
    leftAccessory,
    rightAccessory,
    errorText,
  } = props;

  const inner = (
    <View style={[ffStyles.inputWrap, !editable && ffStyles.inputWrapDisabled]}>
      {leftAccessory}
      <TextInput
        ref={ref}
        style={ffStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#c4c7d1"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        editable={editable && !onPress}
        maxLength={maxLength}
      />
      {rightAccessory}
    </View>
  );

  return (
    <View style={ffStyles.container}>
      <Text style={ffStyles.label}>{label}</Text>
      {onPress ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          {inner}
        </TouchableOpacity>
      ) : (
        inner
      )}
      {errorText ? <Text style={ffStyles.errorText}>{errorText}</Text> : null}
    </View>
  );
});

const ffStyles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {

    fontSize: 15,
    lineHeight: 24,
    color: "#2a2727",
    marginBottom: 8,
    fontFamily: FONTS.medium,
  },
  inputWrap: {

    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#dedede",
    borderRadius: 10,
    backgroundColor: "#fefefe",
    paddingHorizontal: 16,
    gap: 8,
  },
  inputWrapDisabled: {
    backgroundColor: "#f5f5f5",
    borderColor: "#e0e0e0",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#2a2727",
    paddingVertical: 0,
    fontFamily: FONTS.medium, 
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: XRUN.danger,
  },
});

export default function SignupScreen({ navigation, route }: Props) {
  const { t } = useTranslation();

  const google = route.params?.google;

  const [name, setName] = useState(google?.name ?? "");
  const [email, setEmail] = useState(google?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  type EmailStatus = "idle" | "checking" | "invalid" | "duplicate" | "ok";
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");

  type PasswordStatus = "idle" | "invalid" | "ok";
  const pwHasLower = /[a-z]/.test(password);
  const pwHasUpper = /[A-Z]/.test(password);
  const pwHasDigit = /\d/.test(password);
  const pwHasLen = password.length >= 7;
  const pwAllOk = pwHasLower && pwHasUpper && pwHasDigit && pwHasLen;
  const passwordStatus: PasswordStatus = !password
    ? "idle" 
    : pwAllOk
      ? "ok"
      : "invalid";

  const passwordMissingHint = pwAllOk
    ? ""
    : [
        !pwHasLower ? (t("auth.signup.pwNeedLower", { defaultValue: "영문 소문자" }) as string) : null,
        !pwHasUpper ? (t("auth.signup.pwNeedUpper", { defaultValue: "영문 대문자" }) as string) : null,
        !pwHasDigit ? (t("auth.signup.pwNeedDigit", { defaultValue: "숫자" }) as string) : null,
        !pwHasLen ? (t("auth.signup.pwNeedLen", { defaultValue: "7자 이상" }) as string) : null,
      ]
        .filter(Boolean)
        .join(" · ") +
      " " +
      (t("auth.signup.pwNeedSuffix", { defaultValue: "입력해주세요" }) as string);
  type ConfirmStatus = "idle" | "mismatch" | "ok";
  const confirmStatus: ConfirmStatus = !confirmPassword
    ? "idle"
    : password === confirmPassword
      ? "ok"
      : "mismatch";
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [ageRange, setAgeRange] = useState<number | null>(null);

  const [ageScrollHasMore, setAgeScrollHasMore] = useState(true);
  const ageScrollViewW = useRef(0);
  const ageScrollContentW = useRef(0);
  const updateAgeScrollHasMore = (offsetX = 0) => {
    const viewW = ageScrollViewW.current;
    const contentW = ageScrollContentW.current;
    if (viewW <= 0 || contentW <= 0) {
      setAgeScrollHasMore(true);
      return;
    }
    setAgeScrollHasMore(offsetX + viewW < contentW - 8);
  };

  const [country, setCountry] = useState<CountryDialCode>(ALLOWED_COUNTRIES[0]);
  const [region, setRegion] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [agreeService, setAgreeService] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeLocation, setAgreeLocation] = useState(false);
  const [agreeCallLearning, setAgreeCallLearning] = useState(false); 
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [agreeFaceBiometric, setAgreeFaceBiometric] = useState(false);

  const [termsModalType, setTermsModalType] = useState<AgreementType | null>(null);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [regionModalVisible, setRegionModalVisible] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const [regionSearchQuery, setRegionSearchQuery] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [pushPlatform, setPushPlatform] = useState<"ios" | "android" | "web" | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [requestingPush, setRequestingPush] = useState(false);

  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const focusAfterAlert = (ref: React.RefObject<TextInput | null>) => () => {
    setTimeout(() => ref.current?.focus(), 100);
  };

  const ageRangeToAge = (r: number | null): number => {
    switch (r) {
      case 2210: return 15;
      case 2220: return 25;
      case 2230: return 35;
      case 2240: return 45;
      case 2250: return 55;
      default: return 0;
    }
  };

  const agreeRequired =
    agreeService && agreePrivacy && agreeLocation && agreeCallLearning;
  const agreeAll =
    agreeRequired && agreeMarketing && agreeFaceBiometric;

  const toggleLocationConsent = async () => {
    if (agreeLocation) {
      setAgreeLocation(false);
      return;
    }
    try {
      const Location = await import("expo-location");
      const initial = await Location.getForegroundPermissionsAsync();
      const perm = initial.granted
        ? initial
        : await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        showAlert(
          t("auth.signup.locationPermTitle", { defaultValue: "위치 권한 필요" }),
          t("auth.signup.locationPermDesc", {
            defaultValue:
              "통화 시 지역 기반 대화를 하려면 위치 권한이 필요합니다.\n기기 설정 → 위치 → AfterLife 에서 허용해 주십시오.",
          }),
        );
        return;
      }
      setAgreeLocation(true);
    } catch (err) {
      console.warn("[SignupScreen] location permission request failed:", err);
      showAlert(
        t("common.error"),
        t("auth.signup.locationPermError", {
          defaultValue: "위치 권한 요청 중 문제가 발생했습니다.",
        }),
      );
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

  const toggleAll = async () => {
    if (agreeAll) {
      setAgreeService(false);
      setAgreePrivacy(false);
      setAgreeLocation(false);
      setAgreeCallLearning(false);
      setAgreeMarketing(false);
      setAgreeFaceBiometric(false);
      setPushToken(null);
      setPushPlatform(null);
      setDeviceId(null);
      return;
    }
    setAgreeService(true);
    setAgreePrivacy(true);
    setAgreeCallLearning(true);
    setAgreeFaceBiometric(true);
    if (!agreeLocation) await toggleLocationConsent();
    if (!agreeMarketing) await toggleMarketing();
  };

  const filteredCountries = useMemo(() => {
    const q = countrySearchQuery.trim().toLowerCase();

    if (!q) return SIGNUP_COUNTRIES;
    return SIGNUP_COUNTRIES.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(q);
      const iso = c.iso2.toLowerCase() === q;
      const dial = c.dialCode.replace(/[^0-9]/g, "").includes(q.replace(/^\+/, ""));
      const translated = t(`countries:${c.iso2.toUpperCase()}`, { defaultValue: "" }).toLowerCase();
      return nameMatch || iso || dial || (translated && translated.includes(q));
    });
  }, [countrySearchQuery, t]);

  const regionOptions = useMemo(() => {
    const num =
      typeof country.countryCode === "number"
        ? country.countryCode
        : Number(country.dialCode.replace(/^\+/, "")) || 0;
    return getXrunRegionsOrFallback(num, country.iso2);
  }, [country]);

  const filteredRegions = useMemo(() => {
    const q = regionSearchQuery.trim().toLowerCase();
    if (!q) return regionOptions;
    return regionOptions.filter((r) =>
      r.label.toLowerCase().includes(q) || String(r.value).includes(q),
    );
  }, [regionSearchQuery, regionOptions]);

  const regionDisplayValue = useMemo(() => {
    if (region == null) {
      return t("auth.signup.regionPlaceholder", { defaultValue: "지역 선택" });
    }
    const opt = regionOptions.find((r) => r.value === region);
    return opt ? opt.label : "-";
  }, [region, regionOptions, t]);

  const handleSelectCountry = (c: CountryDialCode) => {
    setCountry(c);
    setRegion(null);
    setCountryModalVisible(false);
    setCountrySearchQuery("");
  };

  const handleSelectRegion = (opt: { value: number; label: string }) => {
    setRegion(opt.value);
    setRegionModalVisible(false);
    setRegionSearchQuery("");
  };

  const ALLOWED_EMAIL_DOMAINS = new Set<string>([

    "naver.com",
    "daum.net",
    "hanmail.net",
    "kakao.com",
    "nate.com",

    "gmail.com",
    "hotmail.com",
    "outlook.com",
    "yahoo.com",
    "icloud.com",
    "me.com",
    "aol.com",
    "msn.com",
    "live.com",
    "protonmail.com",

    "yahoo.co.id",
  ]);
  const isAllowedEmailDomain = (addr: string): boolean => {
    const at = addr.lastIndexOf("@");
    if (at < 0) return false;
    const domain = addr.slice(at + 1).trim().toLowerCase();
    return ALLOWED_EMAIL_DOMAINS.has(domain);
  };

  useEffect(() => {
    if (google) return; 
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailStatus("idle");
      return;
    }

    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(trimmed)) {
      setEmailStatus("invalid");
      return;
    }

    if (!isAllowedEmailDomain(trimmed)) {
      setEmailStatus("invalid");
      return;
    }
    setEmailStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const check = await checkEmailXrun(trimmed);

        if (check.afterlifeExists || check.xrunExists) {
          setEmailStatus("duplicate");
        } else {
          setEmailStatus("ok");
        }
      } catch (err) {

        console.warn("[SignupScreen] email check failed:", (err as Error).message);
        setEmailStatus("idle");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [email, google]);

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    if (!countryModalVisible && !regionModalVisible) {
      setKeyboardHeight(0);
      return;
    }
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [countryModalVisible, regionModalVisible]);

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

    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
      showAlert(
        t("common.notice"),
        t("auth.signup.emailInvalid", { defaultValue: "이메일 형식이 올바르지 않아요" }),
        [{ text: t("common.confirm", { defaultValue: "확인" }), onPress: focusAfterAlert(emailRef) }],
      );
      return;
    }

    if (!isAllowedEmailDomain(email.trim())) {
      showAlert(
        t("common.notice"),
        t("auth.signup.emailDomainNotAllowed", { defaultValue: "지원하지 않는 이메일 도메인입니다. gmail.com / naver.com / kakao.com 등 유명 도메인을 사용해주세요." }),
        [{ text: t("common.confirm", { defaultValue: "확인" }), onPress: focusAfterAlert(emailRef) }],
      );
      return;
    }

    if (!google) {
      if (emailStatus === "checking") {
        showAlert(
          t("common.notice"),
          t("auth.signup.emailChecking", { defaultValue: "이메일 확인 중입니다. 잠시만 기다려 주세요." }),
          [{ text: t("common.confirm", { defaultValue: "확인" }) }],
        );
        return;
      }
      if (emailStatus === "duplicate") {
        showAlert(
          t("common.notice"),
          t("auth.signup.emailDuplicateHint", { defaultValue: "이미 가입된 이메일입니다" }),
          [{ text: t("common.confirm", { defaultValue: "확인" }), onPress: focusAfterAlert(emailRef) }],
        );
        return;
      }
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

    const ageNum = ageRange != null ? ageRangeToAge(ageRange) : undefined;

    setSubmitting(true);
    try {
      const countryCode = country ? country.iso2.toUpperCase() : undefined;
      const mobileCode = country
        ? (country.countryCode ?? (Number(country.dialCode.replace(/[^\d]/g, "")) || 0))
        : undefined;
      const regionCode = region != null ? String(region) : undefined;

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
          await saveFaceBiometricConsent(
            res.accessToken,
            faceBiometricSignupState(agreeFaceBiometric),
            { termsVersion: "v1", channel: "signup" },
          );
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
        void markSsoReconsentDone(res.accessToken);
        void activateAuthSession({
          accessToken: res.accessToken,
          refreshToken: res.refreshToken ?? null,
          persist: true,
          registrationMethod: "google",
        });
        return;
      }

      try {
        const check = await checkEmailXrun(email);
        if (check.afterlifeExists || check.xrunExists) {
          setSubmitting(false);
          showAlert(
            t("auth.signup.xrunFoundTitle", { defaultValue: "XRUN 계정 발견" }),
            t("auth.signup.xrunFoundDesc", {
              defaultValue:
                "등록된 XRUN 계정이 존재합니다.\n\nXRUN 계정 정보로 로그인하면 Afterlife도 함께 이용하실 수 있습니다.",
            }),
            [
              { text: t("common.cancel", { defaultValue: "취소" }), style: "cancel" },
              {
                text: t("auth.login.loginBtn", { defaultValue: "로그인" }),
                onPress: () => navigation.navigate("Login" as never),
              },
            ],
          );
          return;
        }
      } catch (err) {
        console.warn("[AUTH/signup] checkEmailXrun failed:", (err as Error).message);
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
        } else if (err.code === "VALIDATION_FAILED" && err.details) {

          console.warn(
            "[AUTH/signup] VALIDATION_FAILED details:",
            JSON.stringify(err.details, null, 2),
          );
          const issues = err.details as Array<{ path?: string[]; message?: string }>;
          const hasEmail = Array.isArray(issues) && issues.some((i) =>
            (i.path ?? []).some((p) => String(p).toLowerCase() === "email"),
          );
          if (hasEmail) {
            msg = t("auth.signup.emailInvalid", { defaultValue: "이메일 형식이 올바르지 않아요" }) as string;
          } else {
            msg = t("auth.signup.validationFailed", { defaultValue: "입력값이 올바르지 않습니다" }) as string;
          }
        } else {
          msg = err.message;
        }
      }
      showAlert(t("common.error"), msg);
    } finally {
      setSubmitting(false);
    }
  };

  const ageOptions = XRUN_AGES_OPTIONS; 

  return (
    <SafeView backgroundColor={XRUN.pageBg}>
      <PageHeader
        title={google ? t("auth.signup.googleTitle", { defaultValue: "Google 회원가입" }) : t("auth.signup.title")}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <SafeScrollView
        contentContainerStyle={styles.scrollContent}
        autoAdjustKeyboardPadding
        showBottomBackground={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formFieldContainer}>
          {}
          <FormField
            ref={nameRef}
            label={t("auth.signup.name", { defaultValue: "이름" })}
            placeholder={t("auth.signup.name", { defaultValue: "이름" })}
            value={name}
            onChangeText={setName}
            autoCapitalize="none"
          />

          {}
          <FormField
            ref={emailRef}
            label={t("auth.signup.email", { defaultValue: "이메일" })}
            placeholder={t("auth.signup.email", { defaultValue: "이메일" })}
            value={email}
            onChangeText={google ? undefined : setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!google}
            rightAccessory={

              google
                ? <Feather name="lock" size={16} color={COLORS.zinc400} />
                : emailStatus === "checking"
                  ? <ActivityIndicator size="small" color={XRUN.primary} />
                  : emailStatus === "invalid" || emailStatus === "duplicate"
                    ? <Feather name="x-circle" size={18} color={XRUN.danger} />
                    : emailStatus === "ok"
                      ? <Feather name="check-circle" size={18} color="#1A9450" />
                      : undefined
            }
            errorText={
              emailStatus === "invalid"
                ? (/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email.trim()) && !isAllowedEmailDomain(email.trim())
                    ? (t("auth.signup.emailDomainNotAllowed", { defaultValue: "지원하지 않는 도메인입니다 (gmail.com / naver.com 등)" }) as string)
                    : (t("auth.signup.emailInvalid", { defaultValue: "이메일 형식이 올바르지 않아요" }) as string))
                : emailStatus === "duplicate"
                  ? (t("auth.signup.emailDuplicateHint", { defaultValue: "이미 가입된 이메일입니다" }) as string)
                  : undefined
            }
          />

          {}
          <FormField
            ref={passwordRef}
            label={t("auth.signup.password", { defaultValue: "비밀번호" })}
            placeholder={t("auth.signup.password", { defaultValue: "비밀번호" })}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            rightAccessory={

              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {passwordStatus === "ok" ? (
                  <Feather name="check-circle" size={18} color="#1A9450" />
                ) : passwordStatus === "invalid" ? (
                  <Feather name="x-circle" size={18} color={XRUN.danger} />
                ) : null}
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={8}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#666666"
                  />
                </TouchableOpacity>
              </View>
            }
            errorText={

              passwordStatus !== "ok" ? passwordMissingHint : undefined
            }
          />

          {}
          <FormField
            ref={confirmPasswordRef}
            label={t("auth.signup.passwordConfirm", { defaultValue: "비밀번호 확인" })}
            placeholder={t("auth.signup.passwordConfirm", { defaultValue: "비밀번호 확인" })}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            rightAccessory={

              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {confirmStatus === "ok" ? (
                  <Feather name="check-circle" size={18} color="#1A9450" />
                ) : confirmStatus === "mismatch" ? (
                  <Feather name="x-circle" size={18} color={XRUN.danger} />
                ) : null}
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword((v) => !v)}
                  hitSlop={8}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#666666"
                  />
                </TouchableOpacity>
              </View>
            }
            errorText={
              confirmStatus === "mismatch"
                ? (t("auth.signup.passwordsNotMatch", { defaultValue: "비밀번호가 일치하지 않습니다" }) as string)
                : undefined
            }
          />

          {
}
          {}
          <FormField
            ref={phoneRef}
            label={
              Platform.OS === "android"
                ? (t("auth.signup.phone", { defaultValue: "전화번호" }) as string)
                : `${t("auth.signup.phone", { defaultValue: "전화번호" })} (${t(
                    "auth.signup.optional",
                    { defaultValue: "선택사항" },
                  )})`
            }
            placeholder="01012345678"
            value={phone}
            onChangeText={(v) => setPhone(v.replace(/[^0-9]/g, "").slice(0, 11))}
            keyboardType="phone-pad"
            maxLength={11}
            leftAccessory={
              <TouchableOpacity
                style={styles.phonePrefix}
                onPress={() => setCountryModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.flagEmoji}>{country.flagEmoji}</Text>
                <Text style={styles.countryCode}>{country.dialCode}</Text>
              </TouchableOpacity>
            }
          />

          {}
          {regionOptions.length > 0 ? (
            <FormField
              label={
                Platform.OS === "android"
                  ? (t("auth.signup.region", { defaultValue: "지역" }) as string)
                  : `${t("auth.signup.region", { defaultValue: "지역" })} (${t(
                      "auth.signup.optional",
                      { defaultValue: "선택사항" },
                    )})`
              }
              placeholder={t("auth.signup.regionPlaceholder", { defaultValue: "지역 선택" })}
              value={region != null ? regionDisplayValue : ""}
              editable={false}
              onPress={() => setRegionModalVisible(true)}
            />
          ) : null}

          {}
          <View style={styles.fieldContainer}>
            <Text style={styles.sectionLabel}>
              {t("auth.signup.gender", { defaultValue: "성별" })}
              {Platform.OS !== "android" && ` (${t("auth.signup.optional", { defaultValue: "선택사항" })})`}
            </Text>
            <View style={styles.inlineOptions}>
              <OptionButton
                label={t("auth.signup.genderSelect", { defaultValue: "선택" })}
                selected={gender === ""}
                onPress={() => setGender("")}
                style={styles.optionPill}
              />
              <OptionButton
                label={t("auth.signup.male", { defaultValue: "남성" })}
                selected={gender === "male"}
                onPress={() => setGender("male")}
                style={styles.optionPill}
              />
              <OptionButton
                label={t("auth.signup.female", { defaultValue: "여성" })}
                selected={gender === "female"}
                onPress={() => setGender("female")}
                style={styles.optionPill}
              />
            </View>
          </View>

          {
}
          <View style={styles.fieldContainer}>
            <Text style={styles.sectionLabel}>
              {t("auth.signup.ageRange", { defaultValue: "연령대" })}
              {Platform.OS !== "android" && ` (${t("auth.signup.optional", { defaultValue: "선택사항" })})`}
            </Text>
            <View style={styles.ageScrollWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.ageScrollContent}
                onLayout={(e: LayoutChangeEvent) => {
                  ageScrollViewW.current = e.nativeEvent.layout.width;
                  updateAgeScrollHasMore(0);
                }}
                onContentSizeChange={(w) => {
                  ageScrollContentW.current = w;
                  updateAgeScrollHasMore(0);
                }}
                onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                  updateAgeScrollHasMore(e.nativeEvent.contentOffset.x);
                }}
                scrollEventThrottle={16}
              >
                <OptionButton
                  label={t("auth.signup.ageSelect", { defaultValue: "선택" })}
                  selected={ageRange == null}
                  onPress={() => setAgeRange(null)}
                  style={styles.optionPill}
                />
                {ageOptions.map((opt) => (
                  <OptionButton
                    key={opt.value}
                    label={t(`auth.signup.ageRange${opt.value}`, { defaultValue: opt.label })}
                    selected={ageRange === opt.value}
                    onPress={() => setAgeRange(opt.value)}
                    style={styles.optionPill}
                  />
                ))}
              </ScrollView>
              {ageScrollHasMore ? (
                <View style={styles.ageScrollHint} pointerEvents="none">
                  <LinearGradient
                    colors={["rgba(249,250,252,0)", XRUN.pageBg]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.ageScrollFade}
                  />
                  <View style={styles.ageScrollChevron}>
                    <Feather name="chevron-right" size={18} color={COLORS.zinc500} />
                  </View>
                </View>
              ) : null}
            </View>
          </View>

          {}
          <View style={styles.termsSection}>
            {}
            <View style={styles.termsRow}>
              <SquareCheckbox
                checked={agreeService}
                onToggle={() => setAgreeService((v) => !v)}
              />
              <Text style={styles.termsText}>
                <Text style={styles.termsHighlight} onPress={() => setTermsModalType(1)}>
                  {t("auth.signup.termsService", { defaultValue: "[필수] SSO 통합 서비스 이용약관" })}
                </Text>{" "}
                {t("auth.signup.termsAgree", { defaultValue: "동의" })}
              </Text>
            </View>

            {}
            <View style={styles.termsRow}>
              <SquareCheckbox
                checked={agreePrivacy}
                onToggle={() => setAgreePrivacy((v) => !v)}
              />
              <Text style={styles.termsText}>
                <Text style={styles.termsHighlight} onPress={() => setTermsModalType(3)}>
                  {t("auth.signup.termsPrivacy", { defaultValue: "[필수] SSO 통합 개인정보 처리방침" })}
                </Text>{" "}
                {t("auth.signup.termsAgree", { defaultValue: "동의" })}
              </Text>
            </View>

            {}
            <View style={styles.termsRow}>
              <SquareCheckbox
                checked={agreeLocation}
                onToggle={() => void toggleLocationConsent()}
              />
              <Text style={styles.termsText}>
                <Text style={styles.termsHighlight} onPress={() => setTermsModalType(2)}>
                  {t("auth.signup.locationConsent", { defaultValue: "[필수] 위치기반서비스 이용약관" })}
                </Text>{" "}
                {t("auth.signup.termsAgree", { defaultValue: "동의" })}
              </Text>
            </View>

            {}
            <View style={styles.termsRow}>
              <SquareCheckbox
                checked={agreeCallLearning}
                onToggle={() => setAgreeCallLearning((v) => !v)}
              />
              <Text style={styles.termsText}>
                <Text style={styles.termsHighlight} onPress={() => setTermsModalType(5)}>
                  {t("auth.signup.callLearningConsent", { defaultValue: "[필수] AI 데이터 활용 및 생성 동의" })}
                </Text>{" "}
                {t("auth.signup.termsAgree", { defaultValue: "동의" })}
              </Text>
            </View>

            {}
            <View style={styles.termsRow}>
              <SquareCheckbox
                checked={agreeMarketing}
                onToggle={toggleMarketing}
              />
              <Text style={styles.termsText}>
                <Text style={styles.termsHighlight}>
                  {t("auth.signup.marketingConsent", { defaultValue: "[선택] 마케팅 정보 수집 및 활용 동의" })}
                </Text>
                {requestingPush ? ` (${t("auth.signup.verifying", { defaultValue: "확인 중" })})` : ""}
              </Text>
            </View>

            {}
            <View style={styles.termsRow}>
              <SquareCheckbox
                checked={agreeFaceBiometric}
                onToggle={() => setAgreeFaceBiometric((v) => !v)}
              />
              <Text style={styles.termsText}>
                <Text style={styles.termsHighlight} onPress={() => setTermsModalType(4)}>
                  {t("auth.signup.faceBiometricConsent", { defaultValue: "[선택] 얼굴 생체정보 처리 동의" })}
                </Text>{" "}
                {t("auth.signup.termsAgree", { defaultValue: "동의" })}
              </Text>
            </View>

            <View style={styles.termsDivider} />

            {}
            <View style={[styles.termsRow, styles.termsRowAll]}>
              <SquareCheckbox checked={agreeAll} onToggle={toggleAll} />
              <Text style={[styles.termsText, styles.termsTextAll]}>
                {t("auth.signup.termsAgreeAll", { defaultValue: "전체 동의" })}
              </Text>
            </View>
          </View>

          {}
          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>
                {submitting
                  ? t("auth.signup.signingUp", { defaultValue: "가입 중..." })
                  : t("auth.signup.signupBtn", { defaultValue: "회원가입" })}
              </Text>
            </TouchableOpacity>
            {submitting ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={XRUN.primary} />
              </View>
            ) : null}
          </View>
        </View>
      </SafeScrollView>

      {}
      <Modal
        animationType="slide"
        transparent
        visible={countryModalVisible}
        onRequestClose={() => setCountryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setCountryModalVisible(false);
              setCountrySearchQuery("");
            }}
          />
          <View style={[styles.modalContent, keyboardHeight > 0 && { paddingBottom: keyboardHeight }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("auth.signup.countryPlaceholder", { defaultValue: "국가 선택" })}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setCountryModalVisible(false);
                  setCountrySearchQuery("");
                }}
              >
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalSearchBox}>
              <Ionicons name="search" size={18} color="#9ca3af" />
              <TextInput
                style={styles.modalSearchInput}
                value={countrySearchQuery}
                onChangeText={setCountrySearchQuery}
                placeholder={t("auth.signup.countrySearch", { defaultValue: "국가 검색" })}
                placeholderTextColor="#c4c7d1"
                autoCorrect={false}
              />
            </View>
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => `${item.iso2}-${item.dialCode}`}
              renderItem={({ item }) => {
                const selected =
                  item.iso2.toLowerCase() === country.iso2.toLowerCase() &&
                  item.dialCode === country.dialCode;
                const label = t(`countries:${item.iso2.toUpperCase()}`, {
                  defaultValue: item.name,
                });
                return (
                  <TouchableOpacity
                    style={[styles.modalListItem, selected && styles.modalListItemSelected]}
                    onPress={() => handleSelectCountry(item)}
                    activeOpacity={0.7}
                  >
                    {}
                    <View style={styles.modalListFlagBadge}>
                      <Text style={styles.modalListFlag}>{item.flagEmoji}</Text>
                    </View>
                    <View style={styles.modalListInfo}>
                      <Text style={styles.modalListLabel}>{label}</Text>
                      <Text style={styles.modalListIso}>{item.iso2.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.modalListMeta}>{item.dialCode}</Text>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.modalListContent}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.modalEmptyState}>
                  <Text style={styles.modalEmptyText}>
                    {t("auth.signup.noResults", { defaultValue: "검색 결과가 없습니다." })}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {}
      <Modal
        animationType="slide"
        transparent
        visible={regionModalVisible}
        onRequestClose={() => setRegionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setRegionModalVisible(false);
              setRegionSearchQuery("");
            }}
          />
          <View style={[styles.modalContent, keyboardHeight > 0 && { paddingBottom: keyboardHeight }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("auth.signup.regionPlaceholder", { defaultValue: "지역 선택" })}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setRegionModalVisible(false);
                  setRegionSearchQuery("");
                }}
              >
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalSearchBox}>
              <Ionicons name="search" size={18} color="#9ca3af" />
              <TextInput
                style={styles.modalSearchInput}
                value={regionSearchQuery}
                onChangeText={setRegionSearchQuery}
                placeholder={t("auth.signup.regionSearch", { defaultValue: "지역 검색" })}
                placeholderTextColor="#c4c7d1"
                autoCorrect={false}
              />
            </View>
            <FlatList
              data={filteredRegions as Array<{ value: number; label: string }>}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => {
                const selected = region === item.value;
                return (
                  <TouchableOpacity
                    style={[styles.modalListItem, selected && styles.modalListItemSelected]}
                    onPress={() => handleSelectRegion(item)}
                    activeOpacity={0.7}
                  >
                    {}
                    <View style={styles.modalListInfo}>
                      <Text style={styles.modalListLabel}>{item.label}</Text>
                    </View>
                    {selected ? (
                      <Feather name="check" size={18} color={XRUN.primary} />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.modalListContent}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.modalEmptyState}>
                  <Text style={styles.modalEmptyText}>
                    {t("auth.signup.noResults", { defaultValue: "검색 결과가 없습니다." })}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {}
      <TermsModal
        visible={termsModalType !== null}
        type={termsModalType}
        onClose={() => setTermsModalType(null)}
        onAgree={() => {
          const tp = termsModalType;
          setTermsModalType(null);
          if (tp === 1) setAgreeService(true);
          else if (tp === 2) void toggleLocationConsent();
          else if (tp === 3) setAgreePrivacy(true);
          else if (tp === 4) setAgreeFaceBiometric(true);
          else if (tp === 5) setAgreeCallLearning(true);
        }}
      />
    </SafeView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: SIZES.large,
    paddingVertical: SIZES.xlarge,
  },
  formFieldContainer: {
    width: "100%",
    maxWidth: 780,

    gap: 20,
  },
  fieldContainer: {
    width: "100%",
  },
  sectionLabel: {

    fontSize: 15,
    color: "#2a2727",
    marginBottom: 10,
    fontFamily: FONTS.medium,
  },
  phonePrefix: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 12,
    paddingVertical: 4,
    borderRightWidth: 1,
    borderRightColor: XRUN.fieldBorder,
    gap: 6,
  },
  flagEmoji: {
    fontSize: 18,
  },
  countryCode: {
    fontSize: 14,
    color: "#2a2727",
    fontWeight: "500",
  },
  inlineOptions: {
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "flex-start",
    gap: 8,
    width: "100%",
  },
  ageScrollWrap: {
    width: "100%",
    position: "relative",
  },
  ageScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,

    paddingRight: 28,
  },
  optionPill: {
    width: OPTION_PILL_WIDTH,
    paddingHorizontal: 8,
  },
  ageScrollHint: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  ageScrollFade: {
    ...StyleSheet.absoluteFillObject,
  },
  ageScrollChevron: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 2,
  },
  eyeButton: {
    height: 24,
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  termsSection: {
    width: "100%",
    gap: 10,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    maxWidth: 780,
    alignSelf: "center",
    gap: 12,
  },
  termsRowAll: {
    paddingVertical: 4,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 15, 
    color: XRUN.mutedText,
    alignSelf: "center",
    fontFamily: FONTS.regular,
  },
  termsTextAll: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: XRUN.headingText,
  },
  termsHighlight: {

    fontFamily: FONTS.semi,
    color: XRUN.headingText,
  },
  termsDivider: {
    height: 1,
    backgroundColor: XRUN.divider,
    marginVertical: 4,
    width: "100%",
    maxWidth: 780,
    alignSelf: "center",
  },
  buttonWrapper: {
    width: "100%",
    marginTop: 12,
  },
  primaryButton: {

    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.5, 
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONTS.medium, 
  },
  loadingContainer: {
    marginTop: 12,
    alignItems: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: Dimensions.get("window").height * 0.8,
    minHeight: Dimensions.get("window").height * 0.6,
    maxHeight: Dimensions.get("window").height * 0.8,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: XRUN.divider,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: XRUN.headingText,
  },
  modalCloseButton: {
    fontSize: 24,
    color: XRUN.mutedText,
    lineHeight: 24,
  },
  modalSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: XRUN.pageBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    height: 48,
  },
  modalSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: XRUN.headingText,
    fontFamily: FONTS.regular,
  },
  modalListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  modalListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#fff",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  modalListItemSelected: {
    borderColor: XRUN.primary,
  },

  modalListFlagBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: XRUN.pageBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  modalListFlag: {
    fontSize: 24,
    textAlign: "center",
  },
  modalListInfo: {
    flex: 1,
  },
  modalListLabel: {
    fontSize: 15,
    color: XRUN.headingText,
    fontFamily: FONTS.medium,
  },
  modalListIso: {

    fontSize: 12,
    color: XRUN.mutedText,
    textTransform: "uppercase",
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  modalListMeta: {

    fontSize: 15,
    color: "#1f2933",
    fontFamily: FONTS.bold,
  },
  modalEmptyState: {
    paddingVertical: 40,
    alignItems: "center",
  },
  modalEmptyText: {
    fontSize: 14,
    color: XRUN.mutedText,
  },
});
    