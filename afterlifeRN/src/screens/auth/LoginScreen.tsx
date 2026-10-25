import { v_889fad } from "../../stores/dialogStore";
import { v_fec9c0 } from "../../lib/accountStatusAlert";
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
import { v_dec439, v_25515d } from "zvyjokvuouwvifyzks";
import { v_b6a872 } from "vpztcxjmsfanunln";

const v_eb1004 = `<svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M15 7.8271C15 7.28444 14.9513 6.76264 14.8609 6.26172H7.65308V9.22204H11.7718C11.5944 10.1787 11.0552 10.9892 10.2447 11.5318V13.4521H12.718C14.1651 12.1197 15 10.1578 15 7.8271Z" fill="#4285F4"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M7.65302 15.3059C9.71935 15.3059 11.4517 14.6206 12.718 13.4517L10.2446 11.5315C9.55933 11.9907 8.6827 12.2621 7.65302 12.2621C5.65974 12.2621 3.97259 10.9158 3.37078 9.10693H0.813965V11.0898C2.07324 13.5909 4.66137 15.3059 7.65302 15.3059Z" fill="#34A853"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M3.37083 9.10727C3.21776 8.64809 3.1308 8.1576 3.1308 7.6532C3.1308 7.1488 3.21776 6.65831 3.37083 6.19913V4.21631H0.814007C0.295686 5.24946 0 6.41828 0 7.6532C0 8.88811 0.295686 10.0569 0.814007 11.0901L3.37083 9.10727Z" fill="#FBBC05"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M7.65302 3.0438C8.77663 3.0438 9.78544 3.42993 10.5786 4.18828L12.7736 1.99326C11.4482 0.758342 9.71587 0 7.65302 0C4.66137 0 2.07324 1.71497 0.813965 4.2161L3.37078 6.19893C3.97259 4.39004 5.65974 3.0438 7.65302 3.0438Z" fill="#EA4335"/>
</svg>`;
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
  v_c93bd8,
  v_5c746e,
  v_7ef860,
  v_1d5b64,
  v_182fdb as v_ac9e58,
} from "../../api/auth";
import { v_ea1c99 } from "../../lib/deviceId";
import { v_e41029 } from "../../lib/appsFlyer";
import { v_4eac84, v_8d3720 } from "tdbilgxptaometuphydosyywsglhnlfgkfkzstthk";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";
import { v_688424 } from "../../stores/authConfigStore";
import { v_220c23 } from "../../lib/googleAuth";

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

  const [v_f53eaa, v_36bbbe] = v_5ab095(true);

  const v_232d52 = v_1ed7d9((v_fd5f43) => v_fd5f43.hydrate);
  const [v_a5d73f, v_7ba4a6] = v_5ab095(false);

  const v_c39df9 = v_688424((v_fd5f43) => v_fd5f43.googleEnabled);

  v_c4deb2(() => {
    if (v_688424.getState().loadedFrom === 'default') {
      void v_688424.getState().refresh();
    }
  }, []);

  const [v_34e5bb, v_038d7f] = v_5ab095<"account" | "otp">("account");
  const [v_5a69f1, v_9d5a9f] = v_5ab095(false);

  const v_679b55 = async (v_f4fb5e) => {
    if (v_f53eaa) {
      await v_e84827.setItem(v_101856, "1");
      await v_e84827.setItem(v_6a7868, v_f4fb5e);
    } else {
      await v_e84827.setItem(v_101856, "0"); 
      await v_e84827.removeItem(v_6a7868);
    }
    await v_232d52();
  };

  const v_1f78cc = async (
    v_a3ff5a,
    v_bfe9b9,
  ) => {
    const v_9ec4c0 = await v_7ef860(v_a3ff5a.accessToken);
    await v_31080f(v_a3ff5a.accessToken, v_9ec4c0.user, {
      persist: v_f53eaa,
      refreshToken: v_a3ff5a.refreshToken ?? null,
    });
    v_e41029(v_bfe9b9);
    await v_679b55(v_9ec4c0.user.email);

    try {
      const { resetToMyClonesDashboard: v_a3ff58 } = await import("../../lib/resetToMyClonesDashboard");
      await v_a3ff58();
    } catch (v_49263d) {
      console.warn("[AUTH/reactivate] nav reset failed:", v_49263d);
    }
  };
  const v_bab7a9 = async (v_49263d, v_bfe9b9) =>
    v_fec9c0(v_49263d, v_8d41d7, {
      deviceId: await v_ea1c99(),
      onReactivated: (v_fd5f43) => v_1f78cc(v_fd5f43, v_bfe9b9),
    });

  v_c4deb2(() => {
    void (async () => {
      try {
        const [v_6e1e74, v_60fc43] = await Promise.all([
          v_e84827.getItem(v_101856),
          v_e84827.getItem(v_6a7868),
        ]);
        if (v_6e1e74 === "1") v_36bbbe(true);
        else if (v_6e1e74 === "0") v_36bbbe(false);
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

      console.log(`[AUTH/login] POST /oth-path email=${v_e0c7e8}`);
      const v_5cce2c = await v_ac9e58({ email: v_e0c7e8, password: v_adc076, deviceId: v_929b58 });
      console.log(
        `[AUTH/login] response: requiresEmailVerification=${!!v_5cce2c.requiresEmailVerification} ` +
          (v_5cce2c.requiresEmailVerification
            ? `email=${v_5cce2c.email} expiresInSec=${v_5cce2c.expiresInSec}`
            : "token issued"),
      );
      if (v_5cce2c.requiresEmailVerification) {
        console.log(`[AUTH/login] OTP sent to ${v_5cce2c.email}. 유저가 이메일 못받으면 서버 wrangler tail 로 UPSTREAM_FAILURE / sendMail 에러 확인 필요.`);
        v_c65f5d.navigate("EmailOtpLogin", {
          email: v_e0c7e8.trim().toLowerCase(),
          autoLogin: v_f53eaa,
          password: v_adc076,
        });
        return;
      }

      if (!v_5cce2c.accessToken) {
        throw new v_84a859(500, "INTERNAL_ERROR", v_8d41d7("auth.login.loginFailed"));
      }
      const v_9ec4c0 = await v_7ef860(v_5cce2c.accessToken);
      await v_31080f(v_5cce2c.accessToken, v_9ec4c0.user, {
        persist: v_f53eaa,
        refreshToken: v_5cce2c.refreshToken ?? null,
      });
      v_e41029("email");
      console.log(
        `[AUTH/login] user: ${v_9ec4c0.user.email} autoLogin=${v_f53eaa ? "ON" : "OFF"}`,
      );

      await v_679b55(v_e0c7e8);
    } catch (v_49263d) {

      if (await v_bab7a9(v_49263d, "email")) return;

      if (v_49263d instanceof v_84a859 && v_49263d.code === "ACCOUNT_DELETED") {
        v_889fad(v_8d41d7("auth.login.accountDeletedTitle"), v_8d41d7("auth.login.accountDeletedMessage"));
        return;
      }

      if (v_49263d instanceof v_84a859 && v_49263d.code === "NOT_FOUND") {
        v_889fad(
          v_8d41d7("auth.login.accountNotFoundTitle", { defaultValue: "계정 없음" }),
          v_8d41d7("auth.login.accountNotFoundMessage", {
            defaultValue: "가입된 계정이 없습니다.\n회원가입을 해주세요.",
          }),
          [
            { text: v_8d41d7("common.cancel", { defaultValue: "취소" }), style: "cancel" },
            {
              text: v_8d41d7("auth.login.goSignup", { defaultValue: "회원가입" }),
              onPress: () => v_c65f5d.navigate("Signup", {}),
            },
          ],
        );
        return;
      }

      if (v_49263d instanceof v_84a859 && v_49263d.code === "ACCOUNT_SUSPENDED") {
        v_889fad(
          v_8d41d7("auth.login.accountSuspendedTitle"),
          v_49263d.message || v_8d41d7("auth.login.accountSuspendedMessage"),
        );
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

  const v_894a7c = async () => {
    const v_9e86fd = v_e0c7e8.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(v_9e86fd)) {
      v_889fad(v_8d41d7("common.notice"), v_8d41d7("common.emailInvalid"));
      return;
    }
    v_9d5a9f(true);
    try {
      console.log(`[AUTH/sendOtp] POST /oth-path email=${v_9e86fd}`);
      const v_cb35cb = await v_1d5b64(v_9e86fd);
      console.log(`[AUTH/sendOtp] response: expiresInSec=${v_cb35cb.expiresInSec}. 이메일 못받으면 서버 wrangler tail 로 sendMail/UPSTREAM_FAILURE 확인.`);

      v_c65f5d.navigate("EmailOtpLogin", { email: v_9e86fd, autoLogin: v_f53eaa });
    } catch (v_49263d) {
      console.warn(`[AUTH/sendOtp] failed:`, v_49263d instanceof v_84a859 ? `${v_49263d.code} ${v_49263d.message}` : (v_49263d as Error)?.message);
      const v_badeaf = v_49263d instanceof v_84a859 ? v_49263d.message : v_8d41d7("common.error");
      v_889fad(v_8d41d7("common.error"), v_badeaf);
    } finally {
      v_9d5a9f(false);
    }
  };

  const v_78c15c = async (v_e38ca2) => {
    if (v_e38ca2 === "google") {
      try {
        if (!v_220c23()) {
          v_889fad(
            v_8d41d7("auth.login.googleUnavailableTitle"),
            v_8d41d7("auth.login.googleUnavailableMessage"),
          );
          return;
        }
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
          v_889fad(v_8d41d7("common.error"), v_8d41d7("auth.login.googleNoToken"));
          return;
        }

        const v_de130a = await v_5c746e(v_b50834);

        if (v_de130a.afterlifeExists || v_de130a.xrunExists) {

          const v_929b58 = await v_ea1c99();
          const v_8f00b9 = await v_dd2158({
            idToken: v_b50834,
            deviceId: v_929b58,
            platform: v_326be8.OS === "ios" ? "ios" : "android",
          });
          const v_9ec4c0 = await v_7ef860(v_8f00b9.accessToken);
          await v_31080f(v_8f00b9.accessToken, v_9ec4c0.user, {
            persist: v_f53eaa,
            refreshToken: v_8f00b9.refreshToken ?? null,
          });
          v_e41029("google");
          if (v_f53eaa) {
            await v_e84827.setItem(v_101856, "1");
            await v_e84827.setItem(v_6a7868, v_9ec4c0.user.email);
          } else {
            await v_e84827.setItem(v_101856, "0"); 
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
        if (await v_bab7a9(v_49263d, "google")) return;

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
    if (v_e38ca2 === "apple") {
      if (v_326be8.OS !== "ios") {
        v_889fad(v_8d41d7("common.notice"), v_8d41d7("auth.login.appleIosOnly"));
        return;
      }
      try {
        const v_c8d70e = await import("rpswwnotkqebxswfnogjwnyum");
        const v_68e4c4 = await v_c8d70e.signInAsync({
          requestedScopes: [
            v_c8d70e.AppleAuthenticationScope.FULL_NAME,
            v_c8d70e.AppleAuthenticationScope.EMAIL,
          ],
        });
        if (!v_68e4c4.identityToken) {
          v_889fad(v_8d41d7("common.error"), v_8d41d7("auth.login.appleNoToken"));
          return;
        }
        const v_929b58 = await v_ea1c99();
        const v_8f00b9 = await v_c93bd8({
          identityToken: v_68e4c4.identityToken,
          fullName: v_68e4c4.fullName
            ? { givenName: v_68e4c4.fullName.givenName, familyName: v_68e4c4.fullName.familyName }
            : null,
          deviceId: v_929b58,
          platform: "ios",
        });
        const v_9ec4c0 = await v_7ef860(v_8f00b9.accessToken);
        await v_31080f(v_8f00b9.accessToken, v_9ec4c0.user, {
          persist: v_f53eaa,
          refreshToken: v_8f00b9.refreshToken ?? null,
        });
        v_e41029("apple");
        if (v_f53eaa) {
          await v_e84827.setItem(v_101856, "1");
          await v_e84827.setItem(v_6a7868, v_9ec4c0.user.email);
        } else {
          await v_e84827.setItem(v_101856, "0"); 
          await v_e84827.removeItem(v_6a7868);
        }
        console.log("[AUTH/apple] user:", v_9ec4c0.user);
        await v_232d52();
      } catch (v_49263d) {
        if (v_49263d?.code === "ERR_REQUEST_CANCELED") return;
        if (await v_bab7a9(v_49263d, "apple")) return;
        if (v_49263d instanceof v_84a859 && v_49263d.code === "ACCOUNT_DELETED") {
          v_889fad(v_8d41d7("auth.login.accountDeletedTitle"), v_8d41d7("auth.login.accountDeletedMessage"));
          return;
        }

        const v_44854f = typeof v_49263d?.message === "string" ? v_49263d.message : "";
        if (
          v_44854f.includes("authorization attempt failed for an unknown reason") ||
          v_49263d?.code === "ERR_REQUEST_UNKNOWN" ||
          v_49263d?.code === "ERR_REQUEST_NOT_HANDLED"
        ) {
          console.warn("[AppleAuth] system noise (silent):", v_44854f || v_49263d?.code);
          return;
        }
        const v_badeaf = (v_49263d instanceof v_84a859 ? v_49263d.message : v_49263d?.message) || v_8d41d7("auth.login.appleFailed");
        v_889fad(v_8d41d7("auth.login.appleFailed"), v_badeaf);
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
        {}
        <View style={v_d81136.topSpacer} />
        <View style={v_d81136.container}>
          {}

          {}
          <View style={v_d81136.tabRow}>
            <TouchableOpacity
              style={[v_d81136.tab, v_34e5bb === "account" && v_d81136.tabActive]}
              onPress={() => v_038d7f("account")}
            >
              <Text style={[v_d81136.tabText, v_34e5bb === "account" && v_d81136.tabTextActive]}>
                {v_8d41d7("auth.login.tabAccount")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[v_d81136.tab, v_34e5bb === "otp" && v_d81136.tabActive]}
              onPress={() => v_038d7f("otp")}
            >
              <Text style={[v_d81136.tabText, v_34e5bb === "otp" && v_d81136.tabTextActive]}>
                {v_8d41d7("auth.login.tabOtp")}
              </Text>
            </TouchableOpacity>
          </View>

          {}
          {v_34e5bb === "account" && (
            <>
              {}
              <Text style={v_d81136.fieldLabel}>{v_8d41d7("auth.login.emailLabel")}</Text>
              <TextField
                value={v_e0c7e8}
                onChangeText={v_fedf34}
                placeholder={v_8d41d7("auth.login.emailLabel")}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Feather name="mail" size={20} color={v_1bfbd0.zinc500} />}
              />
              <Text style={v_d81136.fieldLabel}>{v_8d41d7("auth.login.passwordLabel")}</Text>
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

                style={{ marginTop: 32 }}
              />
            </>
          )}

          {}
          {v_34e5bb === "otp" && (
            <>
              {}
              <Text style={v_d81136.fieldLabel}>{v_8d41d7("auth.login.emailLabel")}</Text>
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
                title={v_5a69f1 ? v_8d41d7("auth.login.sendingOtp") : v_8d41d7("auth.login.requestOtp")}
                onPress={v_894a7c}
                variant="primary"
                disabled={v_5a69f1 || !v_e0c7e8.trim()}
                style={{ marginTop: v_9b1a04.medium }}
              />
            </>
          )}

          {

}
          {}
          {(v_326be8.OS === "ios" || v_c39df9 !== false) && (
            <View style={v_d81136.divider}>
              <View style={v_d81136.dividerLine} />
              <Text style={v_d81136.dividerText}>—</Text>
              <View style={v_d81136.dividerLine} />
            </View>
          )}

          {
}
          {v_c39df9 === null ? (
            <View style={v_d81136.googleButtonPlaceholder} />
          ) : (
            <View style={v_d81136.snsLoginContainer}>
              <Text style={v_d81136.snsLoginLabel}>{v_8d41d7("auth.login.googleBtn")}</Text>
              <View style={v_d81136.snsButtonContainer}>
                {v_c39df9 && (
                  <TouchableOpacity
                    style={v_d81136.snsButton}
                    onPress={() => v_78c15c("google")}
                    activeOpacity={0.7}
                    accessibilityLabel="google-signin"
                  >
                    <SvgXml xml={v_eb1004} width={22} height={22} />
                  </TouchableOpacity>
                )}
                {v_326be8.OS === "ios" && (
                  <TouchableOpacity
                    style={v_d81136.snsButton}
                    onPress={() => v_78c15c("apple")}
                    activeOpacity={0.7}
                    accessibilityLabel="apple-signin"
                  >
                    <Ionicons name="logo-apple" size={24} color={v_1bfbd0.zinc900} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {
}
          <View style={v_d81136.signupRow}>
            <Text style={v_d81136.signupText}>{v_8d41d7("auth.login.signupHint")} </Text>
            <TouchableOpacity onPress={() => v_c65f5d.navigate("Signup", {})}>
              <Text style={v_d81136.signupLink}>{v_8d41d7("auth.login.signupBtn")}</Text>
            </TouchableOpacity>
          </View>

          {}
          <Text style={v_d81136.forgotPasswordHint}>
            {v_8d41d7("auth.login.forgotPasswordHint")}
          </Text>
        </View>
        {}
        <View style={v_d81136.bottomSpacer} />
      </SafeScrollView>
    </SafeView>
  );
}

const v_d81136 = v_472849.create({
  scrollContent: {

    flexGrow: 1,
    paddingHorizontal: v_9b1a04.xlarge,
    paddingVertical: 24,
  },
  topSpacer: {

    height: 60,
  },
  bottomSpacer: {
    flex: 1,
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

    marginTop: 0,
    flexDirection: "row",
    backgroundColor: v_1bfbd0.zinc100,
    borderRadius: v_8b0c90.md,
    padding: 4,
    marginBottom: v_9b1a04.small,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: v_1bfbd0.zinc700,
    marginBottom: -v_9b1a04.small,
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
    backgroundColor: v_1bfbd0.primary,
    borderColor: v_1bfbd0.primary,
  },
  checkboxLabel: {
    color: v_1bfbd0.zinc600,
    fontSize: 14,
  },
  forgotPassword: {

    color: v_1bfbd0.zinc900,
    fontSize: 12,
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

  googleButtonPlaceholder: {
    height: 116,
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

  forgotPasswordHint: {

    marginTop: v_9b1a04.small,
    color: v_1bfbd0.zinc500,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "left",
  },

  snsLoginContainer: {
    marginTop: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: v_9b1a04.small,
    width: "100%",
  },
  snsLoginLabel: {

    fontSize: 14,
    lineHeight: 20,
    color: v_1bfbd0.zinc600,
  },
  snsButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: v_9b1a04.small,
  },
  snsButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: v_1bfbd0.white,
    alignItems: "center",
    justifyContent: "center",
    borderColor: v_1bfbd0.zinc200,
    borderWidth: 1,
  },
});
