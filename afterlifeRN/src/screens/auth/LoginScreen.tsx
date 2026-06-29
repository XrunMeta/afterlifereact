import { showAlert } from "../../stores/dialogStore";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import {
  AuthApiError,
  googleSignIn,
  googleCheck,
  getMe,
  requestEmailLoginCode,
} from "../../api/auth";
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

const AUTO_LOGIN_PREF_KEY = "@afterlifeRN/auth/autoLoginPref";
const LAST_EMAIL_KEY = "@afterlifeRN/auth/lastEmail";

export default function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);

  const hydrate = useAuthStore((s) => s.hydrate);
  const loginWithApi = useAuthStore((s) => s.loginWithApi);
  const [loggingIn, setLoggingIn] = useState(false);

  const [mode, setMode] = useState<"account" | "otp">("account");
  const [otpBusy, setOtpBusy] = useState(false);

  const finishApiLogin = async (userEmail: string) => {
    if (autoLogin) {
      await AsyncStorage.setItem(AUTO_LOGIN_PREF_KEY, "1");
      await AsyncStorage.setItem(LAST_EMAIL_KEY, userEmail);
    } else {
      await AsyncStorage.removeItem(AUTO_LOGIN_PREF_KEY);
      await AsyncStorage.removeItem(LAST_EMAIL_KEY);
    }
    await hydrate();
  };

  useEffect(() => {
    void (async () => {
      try {
        const [pref, savedEmail] = await Promise.all([
          AsyncStorage.getItem(AUTO_LOGIN_PREF_KEY),
          AsyncStorage.getItem(LAST_EMAIL_KEY),
        ]);
        if (pref === "1") setAutoLogin(true);
        if (savedEmail) setEmail(savedEmail);
      } catch (err) {
        console.warn("[AUTH/login] restore prefs failed:", err);
      }
    })();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert(t("common.notice"), t("auth.signup.emailRequired"));
      return;
    }
    setLoggingIn(true);
    try {
      const deviceId = await getOrCreateDeviceId();

      const user = await loginWithApi(
        { email, password, deviceId },
        { persist: autoLogin },
      );
      console.log(
        `[AUTH/login] user: ${user.email} autoLogin=${autoLogin ? "ON" : "OFF"}`,
      );

      await finishApiLogin(email);
    } catch (err) {

      if (err instanceof AuthApiError && err.code === "ACCOUNT_DELETED") {
        showAlert(t("auth.login.accountDeletedTitle"), t("auth.login.accountDeletedMessage"));
        return;
      }

      if (err instanceof AuthApiError && err.code === "ACCOUNT_SUSPENDED") {
        showAlert("계정 사용 정지", err.message || "신고 누적으로 계정 사용이 정지되었습니다.");
        return;
      }
      let msg = t("auth.login.loginFailed");
      if (err instanceof AuthApiError) {
        if (err.code === "ACCOUNT_LOCKED") {
          msg = t("auth.login.accountLocked");
        } else if (err.code === "UNAUTHENTICATED") {
          msg = t("auth.login.invalidCredentials");
        } else {
          msg = err.message;
        }
      }
      showAlert(t("auth.login.loginFailed"), msg);
    } finally {
      setLoggingIn(false);
    }
  };

  const setApiAuth = useAuthStore((s) => s.setApiAuth);
  const setApiTokens = useAuthStore((s) => s.setApiTokens);

  const handleSendOtp = async () => {
    const e = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(e)) {
      showAlert(t("common.notice"), "이메일 형식이 올바르지 않아요.");
      return;
    }
    setOtpBusy(true);
    try {
      await requestEmailLoginCode(e);

      navigation.navigate("EmailOtpLogin", { email: e, autoLogin });
    } catch (err) {
      const msg = err instanceof AuthApiError ? err.message : t("common.error");
      showAlert(t("common.error"), msg);
    } finally {
      setOtpBusy(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
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
          showAlert("오류", "Google 로그인 토큰을 받지 못했습니다.");
          return;
        }

        const check = await googleCheck(idToken);

        if (check.afterlifeExists) {

          const deviceId = await getOrCreateDeviceId();
          const res = await googleSignIn({ idToken, deviceId, platform: "android" });
          const meRes = await getMe(res.accessToken);
          await setApiAuth(res.accessToken, meRes.user, { persist: autoLogin });

          const googleRefreshToken = (res as { refreshToken?: string }).refreshToken;
          if (googleRefreshToken) {
            await setApiTokens(res.accessToken, googleRefreshToken, { persist: autoLogin });
          }
          if (autoLogin) {
            await AsyncStorage.setItem(AUTO_LOGIN_PREF_KEY, "1");
            await AsyncStorage.setItem(LAST_EMAIL_KEY, meRes.user.email);
          } else {
            await AsyncStorage.removeItem(AUTO_LOGIN_PREF_KEY);
            await AsyncStorage.removeItem(LAST_EMAIL_KEY);
          }
          console.log("[AUTH/google] user:", meRes.user);
          await hydrate();
        } else {

          navigation.navigate("Signup", {
            google: { idToken, email: check.email, name: check.name },
          });
        }
      } catch (err: any) {
        if (err?.code === statusCodes.SIGN_IN_CANCELLED) return;

        if (err instanceof AuthApiError && err.code === "ACCOUNT_DELETED") {
          showAlert(t("auth.login.accountDeletedTitle"), t("auth.login.accountDeletedMessage"));
          return;
        }
        let msg = t("auth.login.googleFailed");
        if (err instanceof AuthApiError) msg = err.message;
        else if (err?.message) msg = err.message;
        showAlert(t("auth.login.googleFailed"), msg);
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
          </View>

          {}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, mode === "account" && styles.tabActive]}
              onPress={() => setMode("account")}
            >
              <Text style={[styles.tabText, mode === "account" && styles.tabTextActive]}>
                계정 로그인 ✅ OTA
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === "otp" && styles.tabActive]}
              onPress={() => setMode("otp")}
            >
              <Text style={[styles.tabText, mode === "otp" && styles.tabTextActive]}>
                이메일 OTP 로그인
              </Text>
            </TouchableOpacity>
          </View>

          {}
          {mode === "account" && (
            <>
              <TextField
                value={email}
                onChangeText={setEmail}
                placeholder={t("auth.login.emailLabel")}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Feather name="mail" size={20} color={COLORS.zinc500} />}
              />
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
              <View style={styles.optionsRow}>
                <TouchableOpacity onPress={() => setAutoLogin(!autoLogin)} style={styles.checkboxRow}>
                  <View style={[styles.checkbox, autoLogin && styles.checkboxChecked]}>
                    {autoLogin && <Feather name="check" size={14} color={COLORS.white} />}
                  </View>
                  <Text style={styles.checkboxLabel}>{t("auth.login.autoLoginLabel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
                  <Text style={styles.forgotPassword}>{t("auth.login.forgotPassword")}</Text>
                </TouchableOpacity>
              </View>
              <Button
                title={loggingIn ? t("auth.login.loggingIn") : t("auth.login.loginBtn")}
                onPress={handleLogin}
                variant="primary"
                disabled={loggingIn}
                style={{ marginTop: SIZES.medium }}
              />
            </>
          )}

          {}
          {mode === "otp" && (
            <>
              <TextField
                value={email}
                onChangeText={setEmail}
                placeholder={t("auth.login.emailLabel")}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Feather name="mail" size={20} color={COLORS.zinc500} />}
              />
              <TouchableOpacity onPress={() => setAutoLogin(!autoLogin)} style={styles.checkboxRow}>
                <View style={[styles.checkbox, autoLogin && styles.checkboxChecked]}>
                  {autoLogin && <Feather name="check" size={14} color={COLORS.white} />}
                </View>
                <Text style={styles.checkboxLabel}>{t("auth.login.autoLoginLabel")}</Text>
              </TouchableOpacity>
              <Button
                title={otpBusy ? "전송 중..." : "인증코드 받기"}
                onPress={handleSendOtp}
                variant="primary"
                disabled={otpBusy || !email.trim()}
                style={{ marginTop: SIZES.medium }}
              />
            </>
          )}

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
    marginBottom: 16,
  },
  symbolImage: {
    width: 60,
    height: 48,
    marginBottom: 8,
  },
  logoImage: {
    width: 120,
    height: 24,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: COLORS.zinc100,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: SIZES.small,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: COLORS.white,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.zinc500,
  },
  tabTextActive: {
    color: COLORS.zinc900,
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
  lockHint: {
    fontSize: 12,
    color: COLORS.zinc500,
    paddingHorizontal: 4,
    marginTop: -4,
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
