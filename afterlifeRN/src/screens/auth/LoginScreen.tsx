import { v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_4623af,
  v_472849,
  v_cf9c33,
  v_03e392,
  v_39a996,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_384e19 } from "../../navigation/types";

import v_556baf from "../../components/ui/SafeView";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_e775af from "../../components/ui/TextField";
import v_1a40c4 from "../../components/ui/Button";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";

type Props = {
  navigation: v_390fcc<v_384e19, "Login">;
};

export default function v_f4f851({ navigation: v_c65f5d }: Props) {
  const [v_e0c7e8, v_fedf34] = v_5ab095("");
  const [v_adc076, v_52b279] = v_5ab095("");
  const [v_b5ab16, v_b7733b] = v_5ab095(false);
  const [v_f53eaa, v_36bbbe] = v_5ab095(false);
  const [v_cb66b4, v_ee9ec1] = v_5ab095(false);

  const v_182fdb = v_1ed7d9((v_fd5f43) => v_fd5f43.login);

  const v_ec4736 = async () => {
    if (!v_e0c7e8.trim() || !v_adc076) {
      v_03e392.alert("알림", "이메일과 비밀번호를 입력해주세요.");
      return;
    }
    v_ee9ec1(true);
    try {
      await v_182fdb(v_e0c7e8.trim(), v_adc076);
    } catch (v_9e86fd) {
      const v_badeaf = v_9e86fd instanceof Error ? v_9e86fd.message : "로그인에 실패했어요.";
      v_03e392.alert("로그인 실패", v_badeaf);
    } finally {
      v_ee9ec1(false);
    }
  };

  const v_78c15c = (v_e38ca2) => {
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
            title={v_cb66b4 ? "로그인 중..." : "로그인"}
            onPress={v_ec4736}
            variant="primary"
            disabled={v_cb66b4}
            style={{ marginTop: v_9b1a04.medium }}
            leftIcon={v_cb66b4 ? <ActivityIndicator size="small" color={v_1bfbd0.white} /> : undefined}
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
            title="Apple로 계속하기"
            onPress={() => v_78c15c("apple")}
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
