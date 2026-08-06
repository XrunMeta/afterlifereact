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
  Platform,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { SvgXml } from "react-native-svg";

const GOOGLE_G_SVG = `<svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M15 7.8271C15 7.28444 14.9513 6.76264 14.8609 6.26172H7.65308V9.22204H11.7718C11.5944 10.1787 11.0552 10.9892 10.2447 11.5318V13.4521H12.718C14.1651 12.1197 15 10.1578 15 7.8271Z" fill="#4285F4"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M7.65302 15.3059C9.71935 15.3059 11.4517 14.6206 12.718 13.4517L10.2446 11.5315C9.55933 11.9907 8.6827 12.2621 7.65302 12.2621C5.65974 12.2621 3.97259 10.9158 3.37078 9.10693H0.813965V11.0898C2.07324 13.5909 4.66137 15.3059 7.65302 15.3059Z" fill="#34A853"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M3.37083 9.10727C3.21776 8.64809 3.1308 8.1576 3.1308 7.6532C3.1308 7.1488 3.21776 6.65831 3.37083 6.19913V4.21631H0.814007C0.295686 5.24946 0 6.41828 0 7.6532C0 8.88811 0.295686 10.0569 0.814007 11.0901L3.37083 9.10727Z" fill="#FBBC05"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M7.65302 3.0438C8.77663 3.0438 9.78544 3.42993 10.5786 4.18828L12.7736 1.99326C11.4482 0.758342 9.71587 0 7.65302 0C4.66137 0 2.07324 1.71497 0.813965 4.2161L3.37078 6.19893C3.97259 4.39004 5.65974 3.0438 7.65302 3.0438Z" fill="#EA4335"/>
</svg>`;
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
  appleSignIn,
  googleCheck,
  getMe,
  requestEmailLoginCode,
} from "../../api/auth";
import { getOrCreateDeviceId } from "../../lib/deviceId";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { COLORS, SIZES, RADIUS } from "../../components/constants";
import { useAuthConfigStore } from "../../stores/authConfigStore";
import { ensureGoogleConfigured } from "../../lib/googleAuth";

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

  const googleEnabled = useAuthConfigStore((s) => s.googleEnabled);

  useEffect(() => {
    if (useAuthConfigStore.getState().loadedFrom === 'default') {
      void useAuthConfigStore.getState().refresh();
    }
  }, []);

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
    if (!email.trim()) {
      showAlert(
        t("common.notice"),
        t("auth.signup.emailRequired", { defaultValue: "이메일을 입력해주세요." }),
      );
      return;
    }
    if (!password) {
      showAlert(
        t("common.notice"),
        t("auth.signup.passwordRequired", { defaultValue: "비밀번호를 입력해주세요." }),
      );
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
        showAlert(
          t("auth.login.accountSuspendedTitle"),
          err.message || t("auth.login.accountSuspendedMessage"),
        );
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

  const handleSendOtp = async () => {
    const e = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(e)) {
      showAlert(t("common.notice"), t("common.emailInvalid"));
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
        if (!ensureGoogleConfigured()) {
          showAlert(
            t("auth.login.googleUnavailableTitle"),
            t("auth.login.googleUnavailableMessage"),
          );
          return;
        }
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
          showAlert(t("common.error"), t("auth.login.googleNoToken"));
          return;
        }

        const check = await googleCheck(idToken);

        if (check.afterlifeExists) {

          const deviceId = await getOrCreateDeviceId();
          const res = await googleSignIn({
            idToken,
            deviceId,
            platform: Platform.OS === "ios" ? "ios" : "android",
          });
          const meRes = await getMe(res.accessToken);
          await setApiAuth(res.accessToken, meRes.user, {
            persist: autoLogin,
            refreshToken: res.refreshToken ?? null,
          });
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
    if (provider === "apple") {
      if (Platform.OS !== "ios") {
        showAlert(t("common.notice"), t("auth.login.appleIosOnly"));
        return;
      }
      try {
        const AppleAuth = await import("expo-apple-authentication");
        const credential = await AppleAuth.signInAsync({
          requestedScopes: [
            AppleAuth.AppleAuthenticationScope.FULL_NAME,
            AppleAuth.AppleAuthenticationScope.EMAIL,
          ],
        });
        if (!credential.identityToken) {
          showAlert(t("common.error"), t("auth.login.appleNoToken"));
          return;
        }
        const deviceId = await getOrCreateDeviceId();
        const res = await appleSignIn({
          identityToken: credential.identityToken,
          fullName: credential.fullName
            ? { givenName: credential.fullName.givenName, familyName: credential.fullName.familyName }
            : null,
          deviceId,
          platform: "ios",
        });
        const meRes = await getMe(res.accessToken);
        await setApiAuth(res.accessToken, meRes.user, {
          persist: autoLogin,
          refreshToken: res.refreshToken ?? null,
        });
        if (autoLogin) {
          await AsyncStorage.setItem(AUTO_LOGIN_PREF_KEY, "1");
          await AsyncStorage.setItem(LAST_EMAIL_KEY, meRes.user.email);
        } else {
          await AsyncStorage.removeItem(AUTO_LOGIN_PREF_KEY);
          await AsyncStorage.removeItem(LAST_EMAIL_KEY);
        }
        console.log("[AUTH/apple] user:", meRes.user);
        await hydrate();
      } catch (err: any) {
        if (err?.code === "ERR_REQUEST_CANCELED") return;
        if (err instanceof AuthApiError && err.code === "ACCOUNT_DELETED") {
          showAlert(t("auth.login.accountDeletedTitle"), t("auth.login.accountDeletedMessage"));
          return;
        }

        const rawMsg = typeof err?.message === "string" ? err.message : "";
        if (
          rawMsg.includes("authorization attempt failed for an unknown reason") ||
          err?.code === "ERR_REQUEST_UNKNOWN" ||
          err?.code === "ERR_REQUEST_NOT_HANDLED"
        ) {
          console.warn("[AppleAuth] system noise (silent):", rawMsg || err?.code);
          return;
        }
        const msg = (err instanceof AuthApiError ? err.message : err?.message) || t("auth.login.appleFailed");
        showAlert(t("auth.login.appleFailed"), msg);
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

          {}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, mode === "account" && styles.tabActive]}
              onPress={() => setMode("account")}
            >
              <Text style={[styles.tabText, mode === "account" && styles.tabTextActive]}>
                {t("auth.login.tabAccount")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === "otp" && styles.tabActive]}
              onPress={() => setMode("otp")}
            >
              <Text style={[styles.tabText, mode === "otp" && styles.tabTextActive]}>
                {t("auth.login.tabOtp")}
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

                style={{ marginTop: SIZES.xxlarge }}
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
                title={otpBusy ? t("auth.login.sendingOtp") : t("auth.login.requestOtp")}
                onPress={handleSendOtp}
                variant="primary"
                disabled={otpBusy || !email.trim()}
                style={{ marginTop: SIZES.medium }}
              />
            </>
          )}

          {

}
          {(Platform.OS === "ios" || googleEnabled !== false) && (
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>—</Text>
              <View style={styles.dividerLine} />
            </View>
          )}

          {
}
          {googleEnabled === null ? (
            <View style={styles.googleButtonPlaceholder} />
          ) : (
            <View style={styles.snsLoginContainer}>
              <Text style={styles.snsLoginLabel}>{t("auth.login.googleBtn")}</Text>
              <View style={styles.snsButtonContainer}>
                {googleEnabled && (
                  <TouchableOpacity
                    style={styles.snsButton}
                    onPress={() => handleSocialLogin("google")}
                    activeOpacity={0.7}
                    accessibilityLabel="google-signin"
                  >
                    <SvgXml xml={GOOGLE_G_SVG} width={22} height={22} />
                  </TouchableOpacity>
                )}
                {Platform.OS === "ios" && (
                  <TouchableOpacity
                    style={styles.snsButton}
                    onPress={() => handleSocialLogin("apple")}
                    activeOpacity={0.7}
                    accessibilityLabel="apple-signin"
                  >
                    <Ionicons name="logo-apple" size={24} color={COLORS.zinc900} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {}
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>{t("auth.login.signupHint")} </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text style={styles.signupLink}>{t("auth.login.signupBtn")}</Text>
            </TouchableOpacity>
          </View>

          {}
          <Text style={styles.forgotPasswordHint}>
            {t("auth.login.forgotPasswordHint")}
          </Text>
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
  logoImage: {
    width: 140,
    height: 105,
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

  googleButtonPlaceholder: {
    height: 116,
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

  forgotPasswordHint: {
    marginTop: SIZES.small,
    color: COLORS.zinc500,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },

  snsLoginContainer: {
    marginTop: SIZES.xxlarge,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SIZES.small,
    width: "100%",
  },
  snsLoginLabel: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.zinc500,
  },
  snsButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.small,
  },
  snsButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    borderColor: COLORS.zinc200,
    borderWidth: 1,
  },
});
