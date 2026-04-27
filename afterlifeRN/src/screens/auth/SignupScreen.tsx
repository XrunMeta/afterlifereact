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
import { requestEmailCode, AuthApiError } from "../../api/auth";
import { requestPushPermission } from "../../lib/pushNotifications";
import { getOrCreateDeviceId } from "../../lib/deviceId";

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Signup">;
};

const GENDER_OPTIONS = [
  { value: "male" as const, label: "남성" },
  { value: "female" as const, label: "여성" },
  { value: "other" as const, label: "기타" },
];

const INTEREST_OPTIONS = ALL_INTERESTS;

export default function SignupScreen({ navigation }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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
          "푸시 알림 권한 필요",
          "마케팅 정보 알림을 받으려면 푸시 알림 권한이 필요합니다.\n기기 설정 → 알림 → AfterLife 에서 허용해주세요.",
        );
        return;
      }
      const did = await getOrCreateDeviceId();
      setAgreeMarketing(true);
      setPushToken(reg.token ?? null);
      setPushPlatform(reg.platform);
      setDeviceId(did);
    } catch {
      Alert.alert("오류", "권한 요청 중 문제가 발생했습니다.");
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
      Alert.alert("알림", "필수 항목을 모두 입력해주세요.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert("알림", "이메일 형식이 올바르지 않습니다. (예: hello@example.com)");
      return;
    }

    if (password.length < 8) {
      Alert.alert("알림", "비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("알림", "비밀번호가 일치하지 않습니다.");
      return;
    }

    if (phone.length < 4) {
      Alert.alert("알림", "전화번호를 4자 이상으로 입력해주세요.");
      return;
    }
    if (!agreeRequired) {
      Alert.alert("알림", "이용약관에 동의해주세요.");
      return;
    }

    const ageNum = parseInt(age, 10);
    if (Number.isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
      Alert.alert("알림", "나이를 13~120 사이 숫자로 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
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
            ? "잠시 후 다시 시도해주세요. (1분 쿨다운)"
            : err.message
          : "코드 발송에 실패했습니다. 네트워크를 확인해주세요.";
      Alert.alert("오류", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeView backgroundColor={COLORS.zinc50}>
      <PageHeader
        title="회원가입"
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
            <Text style={styles.subtitle}>베타 기간, 타입별 클론 1개씩 무료</Text>
          </View>

          {}
          <TextField
            placeholder="이름"
            value={name}
            onChangeText={setName}
            leftIcon={<Feather name="user" size={20} color={COLORS.zinc500} />}
          />

          {}
          <TextField
            placeholder="이메일"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Feather name="mail" size={20} color={COLORS.zinc500} />}
          />

          {}
          <TextField
            placeholder="비밀번호"
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

          {}
          <TextField
            placeholder="비밀번호 확인"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            leftIcon={<Feather name="lock" size={20} color={COLORS.zinc500} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Feather name={showConfirmPassword ? "eye-off" : "eye"} size={20} color={COLORS.zinc500} />
              </TouchableOpacity>
            }
          />

          {}
          <TextField
            placeholder="전화번호"
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
                placeholder="성별"
              />
            </View>
            <View style={styles.ageField}>
              <TextField
                placeholder="나이"
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>관심사 선택 (선택사항)</Text>
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
              <Text style={styles.termText}>
                <Text style={styles.termBold}>(필수)</Text> 이용약관 및 개인정보 처리방침에 동의합니다
              </Text>
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
                <Text style={styles.termOptional}>(선택)</Text> 마케팅 정보 수신에 동의합니다
                {requestingPush ? " (권한 요청 중...)" : ""}
              </Text>
            </TouchableOpacity>
          </View>

          {}
          <Button
            title={submitting ? "코드 전송 중..." : "가입하기"}
            onPress={handleSubmit}
            disabled={submitting}
          />

          {}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>이미 계정이 있으신가요? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>로그인</Text>
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
