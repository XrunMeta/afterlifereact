

import { v_889fad } from "../../stores/dialogStore";
import v_a3453e, { v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_79c4f2,
  v_4623af,
  v_03e392,
  v_39a996,
} from "rcmrninabrnb";
import { v_ada615, v_2d8264, type v_ee3714 } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import v_556baf from "../../components/ui/SafeView";
import v_92f073 from "../../components/auth/OtpVerifyView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_8b0c90, v_8f28b1, v_d43669, v_c10a43 } from "../../components/constants";
import {
  v_84a859,
  v_2efafe,
  v_63aa82,
  v_7e714c,
} from "../../api/auth";

const v_57ffc4 = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
type EmailStatus = "idle" | "checking" | "invalid" | "notFound" | "ok";

type Step = "email" | "otp" | "password";

type Params = { email?: string } | undefined;

export default function v_040c8f() {
  const { t: v_8d41d7 } = v_772971();
  const v_c65f5d = v_ada615();
  const v_c7daf6 = v_2d8264<v_ee3714<{ key: Params }, "key">>();
  const v_44ec09 = (v_c7daf6.params as { email?: string } | undefined)?.email;
  const v_c76a8b = !!v_44ec09;

  const [v_729796, v_fd7d1f] = v_5ab095<Step>(v_44ec09 ? "otp" : "email");
  const [v_e0c7e8, v_fedf34] = v_5ab095(v_44ec09 ?? "");
  const [v_c99bd2, v_537cbb] = v_5ab095("");
  const [v_adc076, v_52b279] = v_5ab095("");
  const [v_1e51a9, v_014c88] = v_5ab095("");

  const [v_b5ab16, v_b7733b] = v_5ab095(false);
  const [v_e7340a, v_30513e] = v_5ab095(false);
  const [v_cb66b4, v_ee9ec1] = v_5ab095(false);

  const [v_b37c6e, v_11c6c1] = v_5ab095<EmailStatus>(v_c76a8b ? "ok" : "idle");
  v_c4deb2(() => {
    if (v_c76a8b) return;
    const v_2f361a = v_e0c7e8.trim().toLowerCase();
    if (!v_2f361a) {
      v_11c6c1("idle");
      return;
    }
    if (!v_57ffc4.test(v_2f361a)) {
      v_11c6c1("invalid");
      return;
    }
    v_11c6c1("checking");
    const v_cb36b1 = setTimeout(async () => {
      try {
        const v_de130a = await v_2efafe(v_2f361a);
        v_11c6c1(v_de130a.xrunExists || v_de130a.afterlifeExists ? "ok" : "notFound");
      } catch (v_49263d) {

        console.warn("[ForgotPassword] email check failed:", (v_49263d as Error).message);
        v_11c6c1("idle");
      }
    }, 500);
    return () => clearTimeout(v_cb36b1);
  }, [v_e0c7e8, v_c76a8b]);

  const v_2d9119 = /[a-z]/.test(v_adc076);
  const v_a25735 = /[A-Z]/.test(v_adc076);
  const v_9b89a6 = /\d/.test(v_adc076);
  const v_8a4e12 = v_adc076.length >= 7;
  const v_78c4a6 = v_2d9119 && v_a25735 && v_9b89a6 && v_8a4e12;
  const v_79f04d = v_78c4a6
    ? ""
    : [
        !v_2d9119 ? (v_8d41d7("auth.signup.pwNeedLower", { defaultValue: "영문 소문자" }) as string) : null,
        !v_a25735 ? (v_8d41d7("auth.signup.pwNeedUpper", { defaultValue: "영문 대문자" }) as string) : null,
        !v_9b89a6 ? (v_8d41d7("auth.signup.pwNeedDigit", { defaultValue: "숫자" }) as string) : null,
        !v_8a4e12 ? (v_8d41d7("auth.signup.pwNeedLen", { defaultValue: "7자 이상" }) as string) : null,
      ]
        .filter(Boolean)
        .join(" · ") +
      " " +
      (v_8d41d7("auth.signup.pwNeedSuffix", { defaultValue: "입력해주세요" }) as string);
  const v_a41c7b = !v_1e51a9
    ? "idle"
    : v_adc076 === v_1e51a9
      ? "ok"
      : "mismatch";

  const v_2de427 = async () => {
    const v_9e86fd = v_e0c7e8.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(v_9e86fd)) {
      v_889fad(v_8d41d7("common.notice"), v_8d41d7("common.emailInvalid"));
      return;
    }
    v_ee9ec1(true);
    try {
      await v_63aa82(v_9e86fd);
      v_889fad(v_8d41d7("auth.forgot.title"), v_8d41d7("auth.forgot.codeSent"));
      v_fd7d1f("otp");
    } catch (v_49263d) {

      if (v_49263d instanceof v_84a859 && v_49263d.code === "NOT_FOUND") {
        v_889fad(
          v_8d41d7("auth.forgot.emailNotFoundTitle", { defaultValue: "가입되지 않은 이메일" }),
          v_8d41d7("auth.forgot.emailNotFoundMessage", {
            defaultValue: "입력하신 이메일로 가입된 계정이 없습니다.\n이메일을 다시 확인하거나 회원가입을 해주세요.",
          }),
          [
            { text: v_8d41d7("common.confirm", { defaultValue: "확인" }), style: "cancel" },
            {
              text: v_8d41d7("auth.login.goSignup", { defaultValue: "회원가입" }),
              onPress: () => (v_c65f5d as unknown as { navigate: (name: string, params?: object) => void }).navigate("Signup", {}),
            },
          ],
        );
        return;
      }
      let v_badeaf = v_8d41d7("auth.forgot.resetFailed");
      if (v_49263d instanceof v_84a859 && v_49263d.code === "OTP_COOLDOWN") {

        const v_a63110 = v_49263d.message.match(/(\d+)\s*s/);
        const v_c3e86f = v_a63110 ? v_a63110[1] : "";
        v_badeaf = v_c3e86f
          ? v_8d41d7("auth.forgot.cooldown", { secs: v_c3e86f })
          : v_8d41d7("auth.signup.rateLimit");
      }
      v_889fad(v_8d41d7("common.error"), v_badeaf);
    } finally {
      v_ee9ec1(false);
    }
  };

  v_c4deb2(() => {
    if (!v_44ec09) return;
    void v_2de427();

  }, []);

  const v_4f034c = () => {
    if (!/^\d{6}$/.test(v_c99bd2.trim())) {
      v_889fad(v_8d41d7("common.notice"), v_8d41d7("auth.forgot.wrongCode"));
      return;
    }

    v_fd7d1f("password");
  };

  const v_9831a6 = async () => {

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{7,}$/.test(v_adc076)) {
      v_889fad(v_8d41d7("common.notice"), v_8d41d7("auth.forgot.passwordTooShort"));
      return;
    }
    if (v_adc076 !== v_1e51a9) {
      v_889fad(v_8d41d7("common.notice"), v_8d41d7("auth.forgot.passwordMismatch"));
      return;
    }
    v_ee9ec1(true);
    try {
      await v_7e714c({
        email: v_e0c7e8.trim().toLowerCase(),
        verificationCode: v_c99bd2.trim(),
        newPassword: v_adc076,
      });
      v_889fad(v_8d41d7("auth.forgot.successTitle"), v_8d41d7("auth.forgot.successDesc"), [
        { text: v_8d41d7("common.confirm"), onPress: () => v_c65f5d.goBack() },
      ]);
    } catch (v_49263d) {
      let v_badeaf = v_8d41d7("auth.forgot.resetFailed");
      if (v_49263d instanceof v_84a859) {
        if (v_49263d.code === "OTP_INVALID") v_badeaf = v_8d41d7("auth.forgot.wrongCode");
        else if (v_49263d.code === "OTP_EXPIRED") {
          v_badeaf = v_8d41d7("auth.forgot.expiredCode");

          if (!v_c76a8b) v_fd7d1f("email");
          else v_fd7d1f("otp");
        } else if (v_49263d.code === "NOT_FOUND") v_badeaf = v_8d41d7("auth.forgot.notFound");
        else if (v_49263d.code === "VALIDATION_FAILED") {

          v_badeaf = v_8d41d7("auth.forgot.passwordTooShort");
        }

      }
      v_889fad(v_8d41d7("common.error"), v_badeaf);
    } finally {
      v_ee9ec1(false);
    }
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.white}>
      <PageHeader
        title={v_8d41d7("auth.forgot.title")}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />
      <View style={v_fd5f43.body}>
        {v_729796 === "email" && (
          <>
            <Text style={v_fd5f43.desc}>{v_8d41d7("auth.forgot.step1Desc")}</Text>
            <View style={v_fd5f43.inputRow}>
              <Feather name="mail" size={18} color={v_1bfbd0.zinc500} style={v_fd5f43.inputIcon} />
              <TextInput
                style={v_fd5f43.input}
                value={v_e0c7e8}
                onChangeText={v_fedf34}
                placeholder={v_8d41d7("auth.forgot.emailPlaceholder")}
                placeholderTextColor={v_1bfbd0.placeholder}
                autoCapitalize="none"
                keyboardType="email-address"
                autoFocus={!v_c76a8b}
                editable={!v_c76a8b}
              />
              {v_b37c6e === "checking" ? (
                <ActivityIndicator size="small" color={v_1bfbd0.zinc500} />
              ) : v_b37c6e === "invalid" || v_b37c6e === "notFound" ? (
                <Feather name="x-circle" size={18} color={v_1bfbd0.error} />
              ) : v_b37c6e === "ok" && !v_c76a8b ? (
                <Feather name="check-circle" size={18} color={v_1bfbd0.success} />
              ) : null}
            </View>
            {v_b37c6e === "invalid" ? (
              <Text style={v_fd5f43.errorText}>
                {v_8d41d7("auth.signup.emailInvalid", { defaultValue: "이메일 형식이 올바르지 않아요" })}
              </Text>
            ) : v_b37c6e === "notFound" ? (
              <Text style={v_fd5f43.errorText}>
                {v_8d41d7("auth.forgot.emailNotRegisteredHint", { defaultValue: "가입되지 않은 이메일입니다" })}
              </Text>
            ) : null}
            <TouchableOpacity
              style={[v_fd5f43.primaryBtn, (v_cb66b4 || v_b37c6e !== "ok") && v_fd5f43.btnDisabled]}
              disabled={v_cb66b4 || v_b37c6e !== "ok"}
              onPress={v_2de427}
            >
              {v_cb66b4 ? (
                <ActivityIndicator color={v_1bfbd0.white} />
              ) : (
                <Text style={v_fd5f43.primaryBtnText}>{v_8d41d7("auth.forgot.sendCode")}</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {v_729796 === "otp" && (
          <OtpVerifyView
            title={v_8d41d7("auth.forgot.title")}
            subtitle={v_8d41d7("auth.forgot.step2Desc")}
            email={v_e0c7e8}
            code={v_c99bd2}
            onChangeCode={(v_81e2ef) => v_537cbb(v_81e2ef)}
            onSubmit={v_4f034c}
            submitting={false}
            submitLabel={v_8d41d7("auth.forgot.verify")}
            resendIn={0}
            onResend={v_2de427}
            resendLabel={v_8d41d7("auth.forgot.sendCode")}
          />
        )}

        {v_729796 === "password" && (
          <>
            <Text style={v_fd5f43.desc}>{v_8d41d7("auth.forgot.step3Desc")}</Text>
            <View style={v_fd5f43.inputRow}>
              <Feather name="key" size={18} color={v_1bfbd0.zinc500} style={v_fd5f43.inputIcon} />
              <TextInput
                style={v_fd5f43.input}
                value={v_adc076}
                onChangeText={v_52b279}
                placeholder={v_8d41d7("auth.forgot.newPasswordPlaceholder")}
                placeholderTextColor={v_1bfbd0.placeholder}
                secureTextEntry={!v_b5ab16}
                autoFocus
              />
              {v_adc076 ? (
                <Feather
                  name={v_78c4a6 ? "check-circle" : "x-circle"}
                  size={18}
                  color={v_78c4a6 ? v_1bfbd0.success : v_1bfbd0.error}
                />
              ) : null}
              <TouchableOpacity
                onPress={() => v_b7733b((v_81e2ef) => !v_81e2ef)}
                hitSlop={8}
                accessibilityLabel={v_8d41d7("auth.forgot.togglePasswordLabel")}
                style={v_fd5f43.toggleBtn}
              >
                <Feather
                  name={v_b5ab16 ? "eye-off" : "eye"}
                  size={18}
                  color={v_1bfbd0.zinc500}
                />
              </TouchableOpacity>
            </View>
            {!v_78c4a6 ? <Text style={v_fd5f43.errorText}>{v_79f04d}</Text> : null}
            <View style={v_fd5f43.inputRow}>
              <Feather name="key" size={18} color={v_1bfbd0.zinc500} style={v_fd5f43.inputIcon} />
              <TextInput
                style={v_fd5f43.input}
                value={v_1e51a9}
                onChangeText={v_014c88}
                placeholder={v_8d41d7("auth.forgot.confirmPasswordPlaceholder")}
                placeholderTextColor={v_1bfbd0.placeholder}
                secureTextEntry={!v_e7340a}
              />
              {v_a41c7b !== "idle" ? (
                <Feather
                  name={v_a41c7b === "ok" ? "check-circle" : "x-circle"}
                  size={18}
                  color={v_a41c7b === "ok" ? v_1bfbd0.success : v_1bfbd0.error}
                />
              ) : null}
              <TouchableOpacity
                onPress={() => v_30513e((v_81e2ef) => !v_81e2ef)}
                hitSlop={8}
                accessibilityLabel={v_8d41d7("auth.forgot.toggleConfirmLabel")}
                style={v_fd5f43.toggleBtn}
              >
                <Feather
                  name={v_e7340a ? "eye-off" : "eye"}
                  size={18}
                  color={v_1bfbd0.zinc500}
                />
              </TouchableOpacity>
            </View>
            {v_a41c7b === "mismatch" ? (
              <Text style={v_fd5f43.errorText}>
                {v_8d41d7("auth.signup.passwordsNotMatch", { defaultValue: "비밀번호가 일치하지 않습니다" })}
              </Text>
            ) : null}
            <TouchableOpacity
              style={[v_fd5f43.primaryBtn, (v_cb66b4 || !v_78c4a6 || v_a41c7b !== "ok") && v_fd5f43.btnDisabled]}
              disabled={v_cb66b4 || !v_78c4a6 || v_a41c7b !== "ok"}
              onPress={v_9831a6}
            >
              {v_cb66b4 ? (
                <ActivityIndicator color={v_1bfbd0.white} />
              ) : (
                <Text style={v_fd5f43.primaryBtnText}>{v_8d41d7("auth.forgot.save")}</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeView>
  );
}

const v_fd5f43 = v_472849.create({
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 24, gap: 16 },
  desc: { fontSize: 14, color: v_1bfbd0.zinc600, lineHeight: 20 },
  emailHint: {
    fontSize: 13,
    color: v_1bfbd0.zinc900,
    fontFamily: "monospace",
    backgroundColor: v_1bfbd0.zinc100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: v_8b0c90.md,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: v_1bfbd0.zinc50,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: v_8f28b1.borderRadius,
    paddingHorizontal: v_8f28b1.paddingHorizontal,
    height: v_8f28b1.height,
  },
  inputIcon: { marginRight: 10 },
  errorText: { marginTop: -8, fontSize: 12, color: v_1bfbd0.error },
  toggleBtn: { paddingHorizontal: 6, paddingVertical: 8 },
  input: {
    flex: 1,
    fontSize: v_8f28b1.fontSize,
    lineHeight: v_8f28b1.lineHeight,
    color: v_1bfbd0.zinc900,
    paddingVertical: 0,
    textAlignVertical: v_8f28b1.textAlignVertical,
  },
  primaryBtn: {
    ...v_d43669.lg,
    backgroundColor: v_1bfbd0.zinc900,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  primaryBtnText: { ...v_c10a43.lg, color: v_1bfbd0.white },
  btnDisabled: { backgroundColor: v_1bfbd0.zinc300 },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryBtnText: { fontSize: 13, color: v_1bfbd0.zinc500 },
});
