import { v_889fad } from "../../stores/dialogStore";
import { v_c4deb2, v_5ab095 } from "bapkr";
import v_e84827 from "bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv";
import {
  v_3094a2,
  v_19b633,
  v_4623af,
  v_472849,
  v_cf9c33,
  v_03e392,
  v_326be8,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_384e19 } from "../../navigation/types";

import v_556baf from "../../components/ui/SafeView";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_e775af from "../../components/ui/TextField";
import v_1a40c4 from "../../components/ui/Button";
import { v_1ed7d9 } from "../../stores/authStore";
import {
  v_84a859,
  v_dd2158,
  v_5c746e,
  v_7ef860,
  v_1d5b64,
} from "../../api/auth";
import { v_ea1c99 } from "../../lib/deviceId";
import { v_4eac84, v_8d3720 } from "tdbilgxptaometuphydosyywsglhnlfgkfkzstthk";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";

const v_93942f =
  "oth-client.googleusercontent.invalid";

try {
  v_4eac84.configure({
    webClientId: v_93942f,
    offlineAccess: false,
  });
} catch (v_49263d) {
  console.warn("[GoogleSignin] configure failed:", v_49263d);
}

type Props = {
  navigation: v_390fcc<v_384e19, "Login">;
};

const v_101856 = "@afterlifeRN/auth/autoLoginPref";
const v_6a7868 = "@afterlifeRN/auth/lastEmail";

export default function v_f4f851({ navigation: v_c65f5d }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const [v_e0c7e8, v_fedf34] = v_5ab095("");
  const [v_adc076, v_52b279] = v_5ab095("");
  const [v_b5ab16, v_b7733b] = v_5ab095(false);
  const [v_f53eaa, v_36bbbe] = v_5ab095(false);

  const v_232d52 = v_1ed7d9((v_fd5f43) => v_fd5f43.hydrate);
  const v_957ace = v_1ed7d9((v_fd5f43) => v_fd5f43.loginWithApi);
  const [v_a5d73f, v_7ba4a6] = v_5ab095(false);

  const [v_34e5bb, v_038d7f] = v_5ab095<"account" | "otp">("account");
  const [v_5a69f1, v_9d5a9f] = v_5ab095(false);

  const v_679b55 = async (v_f4fb5e) => {
    if (v_f53eaa) {
      await v_e84827.setItem(v_101856, "1");
      await v_e84827.setItem(v_6a7868, v_f4fb5e);
    } else {
      await v_e84827.removeItem(v_101856);
      await v_e84827.removeItem(v_6a7868);
    }
    await v_232d52();
  };

  v_c4deb2(() => {
    void (async () => {
      try {
        const [v_6e1e74, v_60fc43] = await Promise.all([
          v_e84827.getItem(v_101856),
          v_e84827.getItem(v_6a7868),
        ]);
        if (v_6e1e74 === "1") v_36bbbe(true);
        if (v_60fc43) v_fedf34(v_60fc43);
      } catch (v_49263d) {
        console.warn("[AUTH/login] restore prefs failed:", v_49263d);
      }
    })();
  }, []);

  const v_ec4736 = async () => {
    if (!v_e0c7e8.trim()) {
      v_889fad(
        v_8d41d7("common.notice"),
        v_8d41d7("auth.signup.emailRequired", { defaultValue: "이메일을 입력해주세요." }),
      );
      return;
    }
    if (!v_adc076) {
      v_889fad(
        v_8d41d7("common.notice"),
        v_8d41d7("auth.signup.passwordRequired", { defaultValue: "비밀번호를 입력해주세요." }),
      );
      return;
    }
    v_7ba4a6(true);
    try {
      const v_929b58 = await v_ea1c99();

      const v_625c74 = await v_957ace(
        { email: v_e0c7e8, password: v_adc076, deviceId: v_929b58 },
        { persist: v_f53eaa },
      );
      console.log(
        `[AUTH/login] user: ${v_625c74.email} autoLogin=${v_f53eaa ? "ON" : "OFF"}`,
      );

      await v_679b55(v_e0c7e8);
    } catch (v_49263d) {

      if (v_49263d instanceof v_84a859 && v_49263d.code === "ACCOUNT_DELETED") {
        v_889fad(v_8d41d7("auth.login.accountDeletedTitle"), v_8d41d7("auth.login.accountDeletedMessage"));
        return;
      }

      if (v_49263d instanceof v_84a859 && v_49263d.code === "ACCOUNT_SUSPENDED") {
        v_889fad("계정 사용 정지", v_49263d.message || "신고 누적으로 계정 사용이 정지되었습니다.");
        return;
      }
      let v_badeaf = v_8d41d7("auth.login.loginFailed");
      if (v_49263d instanceof v_84a859) {
        if (v_49263d.code === "ACCOUNT_LOCKED") {
          v_badeaf = v_8d41d7("auth.login.accountLocked");
        } else if (v_49263d.code === "UNAUTHENTICATED") {
          v_badeaf = v_8d41d7("auth.login.invalidCredentials");
        } else {
          v_badeaf = v_49263d.message;
        }
      }
      v_889fad(v_8d41d7("auth.login.loginFailed"), v_badeaf);
    } finally {
      v_7ba4a6(false);
    }
  };

  const v_31080f = v_1ed7d9((v_fd5f43) => v_fd5f43.setApiAuth);
  const v_3345cb = v_1ed7d9((v_fd5f43) => v_fd5f43.setApiTokens);

  const v_894a7c = async () => {
    const v_9e86fd = v_e0c7e8.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(v_9e86fd)) {
      v_889fad(v_8d41d7("common.notice"), "이메일 형식이 올바르지 않아요.");
      return;
    }
    v_9d5a9f(true);
    try {
      await v_1d5b64(v_9e86fd);

      v_c65f5d.navigate("EmailOtpLogin", { email: v_9e86fd, autoLogin: v_f53eaa });
    } catch (v_49263d) {
      const v_badeaf = v_49263d instanceof v_84a859 ? v_49263d.message : v_8d41d7("common.error");
      v_889fad(v_8d41d7("common.error"), v_badeaf);
    } finally {
      v_9d5a9f(false);
    }
  };

  const v_78c15c = async (v_e38ca2) => {
    if (v_e38ca2 === "google") {
      try {
        await v_4eac84.hasPlayServices({ showPlayServicesUpdateDialog: true });
        try {
          await v_4eac84.signOut();
        } catch {

        }
        const v_bb789b = (await v_4eac84.signIn()) as unknown as {
          idToken?: string | null;
          data?: { idToken?: string | null };
        };
        const v_b50834 = v_bb789b?.idToken ?? v_bb789b?.data?.idToken;
        if (!v_b50834) {
          v_889fad("오류", "Google 로그인 토큰을 받지 못했습니다.");
          return;
        }

        const v_de130a = await v_5c746e(v_b50834);

        if (v_de130a.afterlifeExists) {

          const v_929b58 = await v_ea1c99();
          const v_8f00b9 = await v_dd2158({ idToken: v_b50834, deviceId: v_929b58, platform: "android" });
          const v_9ec4c0 = await v_7ef860(v_8f00b9.accessToken);
          await v_31080f(v_8f00b9.accessToken, v_9ec4c0.user, { persist: v_f53eaa });

          const v_2d5dcc = (v_8f00b9 as { refreshToken?: string }).refreshToken;
          if (v_2d5dcc) {
            await v_3345cb(v_8f00b9.accessToken, v_2d5dcc, { persist: v_f53eaa });
          }
          if (v_f53eaa) {
            await v_e84827.setItem(v_101856, "1");
            await v_e84827.setItem(v_6a7868, v_9ec4c0.user.email);
          } else {
            await v_e84827.removeItem(v_101856);
            await v_e84827.removeItem(v_6a7868);
          }
          console.log("[AUTH/google] user:", v_9ec4c0.user);
          await v_232d52();
        } else {

          v_c65f5d.navigate("Signup", {
            google: { idToken: v_b50834, email: v_de130a.email, name: v_de130a.name },
          });
        }
      } catch (v_49263d) {
        if (v_49263d?.code === v_8d3720.SIGN_IN_CANCELLED) return;

        if (v_49263d instanceof v_84a859 && v_49263d.code === "ACCOUNT_DELETED") {
          v_889fad(v_8d41d7("auth.login.accountDeletedTitle"), v_8d41d7("auth.login.accountDeletedMessage"));
          return;
        }
        let v_badeaf = v_8d41d7("auth.login.googleFailed");
        if (v_49263d instanceof v_84a859) v_badeaf = v_49263d.message;
        else if (v_49263d?.message) v_badeaf = v_49263d.message;
        v_889fad(v_8d41d7("auth.login.googleFailed"), v_badeaf);
      }
      return;
    }
    console.log("Social login:", v_e38ca2);
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.zinc50}>
      <SafeScrollView
        contentContainerStyle={v_d81136.scrollContent}
        showBottomBackground={false}
        autoAdjustKeyboardPadding={true}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={v_d81136.container}>
          {}
          <View style={v_d81136.logoContainer}>
            {}
            <Image source={require("../../../assets/images/logo.png")} style={v_d81136.logoImage} resizeMode="contain" />
          </View>

          {}
          <View style={v_d81136.tabRow}>
            <TouchableOpacity
              style={[v_d81136.tab, v_34e5bb === "account" && v_d81136.tabActive]}
              onPress={() => v_038d7f("account")}
            >
              <Text style={[v_d81136.tabText, v_34e5bb === "account" && v_d81136.tabTextActive]}>
                계정 로그인
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[v_d81136.tab, v_34e5bb === "otp" && v_d81136.tabActive]}
              onPress={() => v_038d7f("otp")}
            >
              <Text style={[v_d81136.tabText, v_34e5bb === "otp" && v_d81136.tabTextActive]}>
                이메일 OTP 로그인
              </Text>
            </TouchableOpacity>
          </View>

          {}
          {v_34e5bb === "account" && (
            <>
              <TextField
                value={v_e0c7e8}
                onChangeText={v_fedf34}
                placeholder={v_8d41d7("auth.login.emailLabel")}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Feather name="mail" size={20} color={v_1bfbd0.zinc500} />}
              />
              <TextField
                value={v_adc076}
                onChangeText={v_52b279}
                placeholder={v_8d41d7("auth.login.passwordLabel")}
                secureTextEntry={!v_b5ab16}
                leftIcon={<Feather name="lock" size={20} color={v_1bfbd0.zinc900} />}
                rightIcon={
                  <TouchableOpacity onPress={() => v_b7733b(!v_b5ab16)}>
                    <Feather
                      name={v_b5ab16 ? "eye-off" : "eye"}
                      size={20}
                      color={v_1bfbd0.zinc900}
                    />
                  </TouchableOpacity>
                }
              />
              <View style={v_d81136.optionsRow}>
                <TouchableOpacity onPress={() => v_36bbbe(!v_f53eaa)} style={v_d81136.checkboxRow}>
                  <View style={[v_d81136.checkbox, v_f53eaa && v_d81136.checkboxChecked]}>
                    {v_f53eaa && <Feather name="check" size={14} color={v_1bfbd0.white} />}
                  </View>
                  <Text style={v_d81136.checkboxLabel}>{v_8d41d7("auth.login.autoLoginLabel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => v_c65f5d.navigate("ForgotPassword")}>
                  <Text style={v_d81136.forgotPassword}>{v_8d41d7("auth.login.forgotPassword")}</Text>
                </TouchableOpacity>
              </View>
              <Button
                title={v_a5d73f ? v_8d41d7("auth.login.loggingIn") : v_8d41d7("auth.login.loginBtn")}
                onPress={v_ec4736}
                variant="primary"
                disabled={v_a5d73f}
                style={{ marginTop: v_9b1a04.medium }}
              />
            </>
          )}

          {}
          {v_34e5bb === "otp" && (
            <>
              <TextField
                value={v_e0c7e8}
                onChangeText={v_fedf34}
                placeholder={v_8d41d7("auth.login.emailLabel")}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Feather name="mail" size={20} color={v_1bfbd0.zinc500} />}
              />
              <TouchableOpacity onPress={() => v_36bbbe(!v_f53eaa)} style={v_d81136.checkboxRow}>
                <View style={[v_d81136.checkbox, v_f53eaa && v_d81136.checkboxChecked]}>
                  {v_f53eaa && <Feather name="check" size={14} color={v_1bfbd0.white} />}
                </View>
                <Text style={v_d81136.checkboxLabel}>{v_8d41d7("auth.login.autoLoginLabel")}</Text>
              </TouchableOpacity>
              <Button
                title={v_5a69f1 ? "전송 중..." : "인증코드 받기"}
                onPress={v_894a7c}
                variant="primary"
                disabled={v_5a69f1 || !v_e0c7e8.trim()}
                style={{ marginTop: v_9b1a04.medium }}
              />
            </>
          )}

          {

}
          {v_326be8.OS !== "ios" && (
            <>
              {}
              <View style={v_d81136.divider}>
                <View style={v_d81136.dividerLine} />
                <Text style={v_d81136.dividerText}>—</Text>
                <View style={v_d81136.dividerLine} />
              </View>

              <Button
                title={v_8d41d7("auth.login.googleBtn")}
                onPress={() => v_78c15c("google")}
                variant="secondary"
                size="md"
                leftIcon={<Text style={{ fontSize: 18, fontWeight: "bold" }}>G</Text>}
              />
            </>
          )}

          {}
          <View style={v_d81136.signupRow}>
            <Text style={v_d81136.signupText}>{v_8d41d7("auth.login.signupHint")} </Text>
            <TouchableOpacity onPress={() => v_c65f5d.navigate("Signup")}>
              <Text style={v_d81136.signupLink}>{v_8d41d7("auth.login.signupBtn")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeScrollView>
    </SafeView>
  );
}

const v_d81136 = v_472849.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: v_9b1a04.xlarge,
    paddingVertical: 48,
  },
  container: {
    width: "100%",
    maxWidth: 780,
    alignSelf: "center",
    gap: v_9b1a04.medium,
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
    backgroundColor: v_1bfbd0.zinc100,
    borderRadius: v_8b0c90.md,
    padding: 4,
    marginBottom: v_9b1a04.small,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: v_8b0c90.sm,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: v_1bfbd0.white,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: v_1bfbd0.zinc500,
  },
  tabTextActive: {
    color: v_1bfbd0.zinc900,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 14,
    color: v_1bfbd0.zinc500,
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
    borderColor: v_1bfbd0.zinc300,
    backgroundColor: v_1bfbd0.white,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: v_1bfbd0.violet500,
    borderColor: v_1bfbd0.violet500,
  },
  checkboxLabel: {
    color: v_1bfbd0.zinc600,
    fontSize: 14,
  },
  forgotPassword: {
    color: v_1bfbd0.zinc900,
    fontSize: 14,
    fontWeight: "500",
  },
  lockHint: {
    fontSize: 12,
    color: v_1bfbd0.zinc500,
    paddingHorizontal: 4,
    marginTop: -4,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: v_9b1a04.medium,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: v_1bfbd0.zinc200,
  },
  dividerText: {
    marginHorizontal: v_9b1a04.medium,
    color: v_1bfbd0.zinc400,
    fontSize: 14,
  },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: v_9b1a04.medium,
  },
  signupText: {
    color: v_1bfbd0.zinc500,
    fontSize: 14,
  },
  signupLink: {
    color: v_1bfbd0.zinc900,
    fontSize: 14,
    fontWeight: "600",
  },
});
