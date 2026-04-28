import { v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_4623af,
  v_472849,
  v_cf9c33,
  v_03e392,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_384e19 } from "../../navigation/types";

import v_556baf from "../../components/ui/SafeView";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_e775af from "../../components/ui/TextField";
import v_1a40c4 from "../../components/ui/Button";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_84a859, v_dd2158, v_5c746e, v_7ef860 } from "../../api/auth";
import { v_ea1c99 } from "../../lib/deviceId";
import { v_4eac84, v_8d3720 } from "tdbilgxptaometuphydosyywsglhnlfgkfkzstthk";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";

const v_93942f =
  "oth-client.googleusercontent.invalid";

v_4eac84.configure({
  webClientId: v_93942f,
  offlineAccess: false,
});

type Props = {
  navigation: v_390fcc<v_384e19, "Login">;
};

export default function v_f4f851({ navigation: v_c65f5d }: Props) {
  const [v_e0c7e8, v_fedf34] = v_5ab095("");
  const [v_adc076, v_52b279] = v_5ab095("");
  const [v_b5ab16, v_b7733b] = v_5ab095(false);
  const [v_f53eaa, v_36bbbe] = v_5ab095(false);

  const v_232d52 = v_1ed7d9((v_fd5f43) => v_fd5f43.hydrate);
  const v_957ace = v_1ed7d9((v_fd5f43) => v_fd5f43.loginWithApi);
  const [v_a5d73f, v_7ba4a6] = v_5ab095(false);

  const v_ec4736 = async () => {
    if (!v_e0c7e8 || !v_adc076) {
      v_03e392.alert("알림", "이메일과 비밀번호를 입력해주세요.");
      return;
    }
    v_7ba4a6(true);
    try {
      const v_929b58 = await v_ea1c99();
      const v_625c74 = await v_957ace({ email: v_e0c7e8, password: v_adc076, deviceId: v_929b58 });
      console.log("[AUTH/login] user:", v_625c74);

      await v_232d52();
    } catch (v_49263d) {
      let v_badeaf = "로그인에 실패했습니다.";
      if (v_49263d instanceof v_84a859) {
        if (v_49263d.code === "UNAUTHENTICATED") {
          v_badeaf = "이메일 또는 비밀번호가 올바르지 않습니다.";
        } else if (v_49263d.code === "ACCOUNT_LOCKED") {
          v_badeaf = "비밀번호를 너무 많이 틀려 일시적으로 잠겼습니다. 잠시 후 다시 시도해주세요.";
        } else {
          v_badeaf = v_49263d.message;
        }
      }
      v_03e392.alert("로그인 실패", v_badeaf);
    } finally {
      v_7ba4a6(false);
    }
  };

  const v_31080f = v_1ed7d9((v_fd5f43) => v_fd5f43.setApiAuth);

  const v_78c15c = async (v_e38ca2) => {
    if (v_e38ca2 === "xrun") {
      v_c65f5d.navigate("XrunLogin");
      return;
    }
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
          v_03e392.alert("오류", "Google 로그인 토큰을 받지 못했습니다.");
          return;
        }

        const v_de130a = await v_5c746e(v_b50834);

        if (v_de130a.afterlifeExists) {

          const v_929b58 = await v_ea1c99();
          const v_8f00b9 = await v_dd2158({ idToken: v_b50834, deviceId: v_929b58, platform: "android" });
          const v_9ec4c0 = await v_7ef860(v_8f00b9.accessToken);
          await v_31080f(v_8f00b9.accessToken, v_9ec4c0.user);
          console.log("[AUTH/google] user:", v_9ec4c0.user);
          await v_232d52();
        } else if (v_de130a.xrunExists) {

          v_c65f5d.navigate("XrunOnboarding", { email: v_de130a.email, google: { idToken: v_b50834 } });
        } else {

          v_c65f5d.navigate("Signup", { google: { idToken: v_b50834, email: v_de130a.email, name: v_de130a.name } });
        }
      } catch (v_49263d) {
        if (v_49263d?.code === v_8d3720.SIGN_IN_CANCELLED) return;
        let v_badeaf = "Google 로그인 중 오류가 발생했습니다.";
        if (v_49263d instanceof v_84a859) v_badeaf = v_49263d.message;
        else if (v_49263d?.code === v_8d3720.PLAY_SERVICES_NOT_AVAILABLE)
          v_badeaf = "Google Play 서비스가 필요합니다.";
        else if (v_49263d?.message) v_badeaf = v_49263d.message;
        v_03e392.alert("Google 로그인 실패", v_badeaf);
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
            <Image source={require("../../../assets/images/symbol.png")} style={v_d81136.symbolImage} />
            <Image source={require("../../../assets/images/logo.png")} style={v_d81136.logoImage} resizeMode="contain" />
            <Text style={v_d81136.subtitle}>돌아오신 걸 환영해요</Text>
          </View>

          {}
          <TextField
            value={v_e0c7e8}
            onChangeText={v_fedf34}
            placeholder="이메일"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Feather name="mail" size={20} color={v_1bfbd0.zinc500} />}
          />

          {}
          <TextField
            value={v_adc076}
            onChangeText={v_52b279}
            placeholder="비밀번호"
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

          {}
          <View style={v_d81136.optionsRow}>
            <TouchableOpacity
              onPress={() => v_36bbbe(!v_f53eaa)}
              style={v_d81136.checkboxRow}
            >
              <View
                style={[
                  v_d81136.checkbox,
                  v_f53eaa && v_d81136.checkboxChecked,
                ]}
              >
                {v_f53eaa && (
                  <Feather name="check" size={14} color={v_1bfbd0.white} />
                )}
              </View>
              <Text style={v_d81136.checkboxLabel}>자동 로그인</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={v_d81136.forgotPassword}>비밀번호 찾기</Text>
            </TouchableOpacity>
          </View>

          {}
          <Button
            title={v_a5d73f ? "로그인 중..." : "로그인"}
            onPress={v_ec4736}
            variant="primary"
            disabled={v_a5d73f}
            style={{ marginTop: v_9b1a04.medium }}
          />

          {}
          <View style={v_d81136.divider}>
            <View style={v_d81136.dividerLine} />
            <Text style={v_d81136.dividerText}>또는</Text>
            <View style={v_d81136.dividerLine} />
          </View>

          {}
          <Button
            title="Google로 계속하기"
            onPress={() => v_78c15c("google")}
            variant="secondary"
            size="md"
            leftIcon={<Text style={{ fontSize: 18, fontWeight: "bold" }}>G</Text>}
          />

          {}
          <Button
            title="Xrun으로 계속하기"
            onPress={() => v_78c15c("xrun")}
            variant="secondary"
            size="md"
            leftIcon={<Feather name="smartphone" size={18} color={v_1bfbd0.zinc900} />}
          />

          {}
          <Button
            title="Telegram으로 계속하기"
            onPress={() => v_78c15c("telegram")}
            size="md"
            backgroundColor={v_1bfbd0.telegram}
            textColor={v_1bfbd0.white}
            leftIcon={<Feather name="send" size={18} color={v_1bfbd0.white} />}
          />

          {}
          <View style={v_d81136.signupRow}>
            <Text style={v_d81136.signupText}>계정이 없으신가요? </Text>
            <TouchableOpacity onPress={() => v_c65f5d.navigate("Signup")}>
              <Text style={v_d81136.signupLink}>회원가입</Text>
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
