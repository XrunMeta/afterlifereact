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
import { useTranslation } from "react-i18next";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";

import SafeView from "../../components/ui/SafeView";
import SafeScrollView from "../../components/ui/SafeScrollView";
import TextField from "../../components/ui/TextField";
import Button from "../../components/ui/Button";
import { useAuthStore } from "../../stores/authStore";
import { AuthApiError, googleSignIn, googleCheck, getMe } from "../../api/auth";
import { getOrCreateDeviceId } from "../../lib/deviceId";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { COLORS, SIZES, RADIUS } from "../../components/constants";

const GOOGLE_WEB_CLIENT_ID =
  "oth-client.googleusercontent.invalid";

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  offlineAccess: false,
});

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Login">;
};

export default function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);

  const hydrate = useAuthStore((s) => s.hydrate);
  const loginWithApi = useAuthStore((s) => s.loginWithApi);
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t("common.notice"), t("auth.signup.emailRequired"));
      return;
    }
    setLoggingIn(true);
    try {
      const deviceId = await getOrCreateDeviceId();
      const user = await loginWithApi({ email, password, deviceId });
      console.log("[AUTH/login] user:", user);

      await hydrate();
    } catch (err) {
      let msg = t("auth.login.loginFailed");
      if (err instanceof AuthApiError) {
        if (err.code === "UNAUTHENTICATED") {
          msg = t("auth.login.invalidCredentials");
        } else {
          msg = err.message;
        }
      }
      Alert.alert(t("auth.login.loginFailed"), msg);
    } finally {
      setLoggingIn(false);
    }
  };

  const setApiAuth = useAuthStore((s) => s.setApiAuth);

  const handleSocialLogin = async (provider: string) => {
    if (provider === "xrun") {
      navigation.navigate("XrunLogin");
      return;
    }
    if (provider === "google") {
      try {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        try {
          await GoogleSignin.signOut();
        } catch {

        }
        const userInfo = (await GoogleSignin.signIn()) as unknown as {
          idToken?: string | null;
          data?: { idToken?: string | null };
        };
        const idToken = userInfo?.idToken ?? userInfo?.data?.idToken;
        if (!idToken) {
          Alert.alert("오류", "Google 로그인 토큰을 받지 못했습니다.");
          return;
        }

        const check = await googleCheck(idToken);

        if (check.afterlifeExists) {

          const deviceId = await getOrCreateDeviceId();
          const res = await googleSignIn({ idToken, deviceId, platform: "android" });
          const meRes = await getMe(res.accessToken);
          await setApiAuth(res.accessToken, meRes.user);
          console.log("[AUTH/google] user:", meRes.user);
          await hydrate();
        } else if (check.xrunExists) {

          navigation.navigate("XrunOnboarding", { email: check.email, google: { idToken } });
        } else {

          navigation.navigate("Signup", { google: { idToken, email: check.email, name: check.name } });
        }
      } catch (err: any) {
        if (err?.code === statusCodes.SIGN_IN_CANCELLED) return;
        let msg = t("auth.login.googleFailed");
        if (err instanceof AuthApiError) msg = err.message;
        else if (err?.message) msg = err.message;
        Alert.alert(t("auth.login.googleFailed"), msg);
      }
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
            <Text style={styles.subtitle}>{t("auth.login.title")}</Text>
          </View>

          {}
          <TextField
            value={email}
            onChangeText={setEmail}
            placeholder={t("auth.login.emailLabel")}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Feather name="mail" size={20} color={COLORS.zinc500} />}
          />

          {}
          <TextField
            value={password}
            onChangeText={setPassword}
            placeholder={t("auth.login.passwordLabel")}
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
              <Text style={styles.checkboxLabel}>{t("auth.login.autoLoginLabel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
              <Text style={styles.forgotPassword}>{t("auth.login.forgotPassword")}</Text>
            </TouchableOpacity>
          </View>

          {}
          <Button
            title={loggingIn ? t("auth.signup.verifying") : t("auth.login.loginBtn")}
            onPress={handleLogin}
            variant="primary"
            disabled={loggingIn}
            style={{ marginTop: SIZES.medium }}
          />

          {}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>—</Text>
            <View style={styles.dividerLine} />
          </View>

          {}
          <Button
            title={t("auth.login.googleBtn")}
            onPress={() => handleSocialLogin("google")}
            variant="secondary"
            size="md"
            leftIcon={<Text style={{ fontSize: 18, fontWeight: "bold" }}>G</Text>}
          />

          {}
          <Button
            title={t("auth.login.xrunBtn")}
            onPress={() => handleSocialLogin("xrun")}
            variant="secondary"
            size="md"
            leftIcon={<Feather name="smartphone" size={18} color={COLORS.zinc900} />}
          />

          {}
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>{t("auth.login.signupHint")} </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text style={styles.signupLink}>{t("auth.login.signupBtn")}</Text>
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
