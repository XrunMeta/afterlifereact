import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";

import SafeView from "../../components/ui/SafeView";
import SafeScrollView from "../../components/ui/SafeScrollView";
import TextField from "../../components/ui/TextField";
import Button from "../../components/ui/Button";
import { useAuthStore } from "../../stores/authStore";
import { AuthApiError } from "../../api/auth";
import { getOrCreateDeviceId } from "../../lib/deviceId";
import { COLORS, SIZES, RADIUS } from "../../components/constants";

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Login">;
};

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);

  const hydrate = useAuthStore((s) => s.hydrate);
  const loginWithApi = useAuthStore((s) => s.loginWithApi);
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("알림", "이메일과 비밀번호를 입력해주세요.");
      return;
    }
    setLoggingIn(true);
    try {
      const deviceId = await getOrCreateDeviceId();
      const user = await loginWithApi({ email, password, deviceId });
      console.log("[AUTH/login] user:", user);

      await hydrate();
    } catch (err) {
      let msg = "로그인에 실패했습니다.";
      if (err instanceof AuthApiError) {
        if (err.code === "UNAUTHENTICATED") {
          msg = "이메일 또는 비밀번호가 올바르지 않습니다.";
        } else if (err.code === "ACCOUNT_LOCKED") {
          msg = "비밀번호를 너무 많이 틀려 일시적으로 잠겼습니다. 잠시 후 다시 시도해주세요.";
        } else {
          msg = err.message;
        }
      }
      Alert.alert("로그인 실패", msg);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    if (provider === "xrun") {
      navigation.navigate("XrunLogin");
      return;
    }
    console.log("Social login:", provider);
  };

  return (
    <SafeView backgroundColor={COLORS.zinc50}>
      <SafeScrollView
        contentContainerStyle={styles.scrollContent}
        showBottomBackground={false}
        autoAdjustKeyboardPadding={true}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {}
          <View style={styles.logoContainer}>
            <Image source={require("../../../assets/images/symbol.png")} style={styles.symbolImage} />
            <Image source={require("../../../assets/images/logo.png")} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.subtitle}>돌아오신 걸 환영해요</Text>
          </View>

          {}
          <TextField
            value={email}
            onChangeText={setEmail}
            placeholder="이메일"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Feather name="mail" size={20} color={COLORS.zinc500} />}
          />

          {}
          <TextField
            value={password}
            onChangeText={setPassword}
            placeholder="비밀번호"
            secureTextEntry={!showPassword}
            leftIcon={<Feather name="lock" size={20} color={COLORS.zinc900} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={COLORS.zinc900}
                />
              </TouchableOpacity>
            }
          />

          {}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              onPress={() => setAutoLogin(!autoLogin)}
              style={styles.checkboxRow}
            >
              <View
                style={[
                  styles.checkbox,
                  autoLogin && styles.checkboxChecked,
                ]}
              >
                {autoLogin && (
                  <Feather name="check" size={14} color={COLORS.white} />
                )}
              </View>
              <Text style={styles.checkboxLabel}>자동 로그인</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.forgotPassword}>비밀번호 찾기</Text>
            </TouchableOpacity>
          </View>

          {}
          <Button
            title={loggingIn ? "로그인 중..." : "로그인"}
            onPress={handleLogin}
            variant="primary"
            disabled={loggingIn}
            style={{ marginTop: SIZES.medium }}
          />

          {}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.dividerLine} />
          </View>

          {}
          <Button
            title="Google로 계속하기"
            onPress={() => handleSocialLogin("google")}
            variant="secondary"
            size="md"
            leftIcon={<Text style={{ fontSize: 18, fontWeight: "bold" }}>G</Text>}
          />

          {}
          <Button
            title="Xrun으로 계속하기"
            onPress={() => handleSocialLogin("xrun")}
            variant="secondary"
            size="md"
            leftIcon={<Feather name="smartphone" size={18} color={COLORS.zinc900} />}
          />

          {}
          <Button
            title="Telegram으로 계속하기"
            onPress={() => handleSocialLogin("telegram")}
            size="md"
            backgroundColor={COLORS.telegram}
            textColor={COLORS.white}
            leftIcon={<Feather name="send" size={18} color={COLORS.white} />}
          />

          {}
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>계정이 없으신가요? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text style={styles.signupLink}>회원가입</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: SIZES.xlarge,
    paddingVertical: 48,
  },
  container: {
    width: "100%",
    maxWidth: 780,
    alignSelf: "center",
    gap: SIZES.medium,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  symbolImage: {
    width: 100,
    height: 80,
    marginBottom: 12,
  },
  logoImage: {
    width: 160,
    height: 32,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.zinc500,
  },
  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  },
  checkboxChecked: {
    backgroundColor: COLORS.violet500,
    borderColor: COLORS.violet500,
  },
  checkboxLabel: {
    color: COLORS.zinc600,
    fontSize: 14,
  },
  forgotPassword: {
    color: COLORS.zinc900,
    fontSize: 14,
    fontWeight: "500",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: SIZES.medium,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.zinc200,
  },
  dividerText: {
    marginHorizontal: SIZES.medium,
    color: COLORS.zinc400,
    fontSize: 14,
  },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: SIZES.medium,
  },
  signupText: {
    color: COLORS.zinc500,
    fontSize: 14,
  },
  signupLink: {
    color: COLORS.zinc900,
    fontSize: 14,
    fontWeight: "600",
  },
});
