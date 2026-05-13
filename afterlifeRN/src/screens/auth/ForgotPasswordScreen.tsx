

import v_a3453e, { v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_79c4f2,
  v_4623af,
  v_03e392,
  v_39a996,
} from "rcmrninabrnb";
import { v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import { v_772971 } from "jmpfvteuuztnp";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import v_556baf from "../../components/ui/SafeView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import type { v_384e19 } from "../../navigation/types";
import {
  v_84a859,
  v_63aa82,
  v_7e714c,
} from "../../api/auth";

type Step = "email" | "otp" | "password";

export default function v_040c8f() {
  const { t: v_8d41d7 } = v_772971();
  const v_c65f5d = v_ada615<v_390fcc<v_384e19>>();

  const [v_729796, v_fd7d1f] = v_5ab095<Step>("email");
  const [v_e0c7e8, v_fedf34] = v_5ab095("");
  const [v_c99bd2, v_537cbb] = v_5ab095("");
  const [v_adc076, v_52b279] = v_5ab095("");
  const [v_1e51a9, v_014c88] = v_5ab095("");
  const [v_cb66b4, v_ee9ec1] = v_5ab095(false);

  const v_2de427 = async () => {
    const v_9e86fd = v_e0c7e8.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(v_9e86fd)) {
      v_03e392.alert("알림", "이메일 형식이 올바르지 않아요.");
      return;
    }
    v_ee9ec1(true);
    try {
      await v_63aa82(v_9e86fd);
      v_03e392.alert(v_8d41d7("auth.forgot.title"), v_8d41d7("auth.forgot.codeSent"));
      v_fd7d1f("otp");
    } catch (v_49263d) {
      const v_badeaf =
        v_49263d instanceof v_84a859 && v_49263d.code === "OTP_COOLDOWN"
          ? v_49263d.message
          : v_8d41d7("auth.forgot.resetFailed");
      v_03e392.alert("오류", v_badeaf);
    } finally {
      v_ee9ec1(false);
    }
  };

  const v_4f034c = () => {
    if (!/^\d{6}$/.test(v_c99bd2.trim())) {
      v_03e392.alert("알림", v_8d41d7("auth.forgot.wrongCode"));
      return;
    }

    v_fd7d1f("password");
  };

  const v_9831a6 = async () => {

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{7,}$/.test(v_adc076)) {
      v_03e392.alert("알림", v_8d41d7("auth.forgot.passwordTooShort"));
      return;
    }
    if (v_adc076 !== v_1e51a9) {
      v_03e392.alert("알림", v_8d41d7("auth.forgot.passwordMismatch"));
      return;
    }
    v_ee9ec1(true);
    try {
      await v_7e714c({
        email: v_e0c7e8.trim().toLowerCase(),
        verificationCode: v_c99bd2.trim(),
        newPassword: v_adc076,
      });
      v_03e392.alert(v_8d41d7("auth.forgot.successTitle"), v_8d41d7("auth.forgot.successDesc"), [
        { text: "확인", onPress: () => v_c65f5d.goBack() },
      ]);
    } catch (v_49263d) {
      let v_badeaf = v_8d41d7("auth.forgot.resetFailed");
      if (v_49263d instanceof v_84a859) {
        if (v_49263d.code === "OTP_INVALID") v_badeaf = v_8d41d7("auth.forgot.wrongCode");
        else if (v_49263d.code === "OTP_EXPIRED") {
          v_badeaf = v_8d41d7("auth.forgot.expiredCode");
          v_fd7d1f("email");
        } else if (v_49263d.code === "NOT_FOUND") v_badeaf = v_8d41d7("auth.forgot.notFound");
        else if (v_49263d.message) v_badeaf = v_49263d.message;
      }
      v_03e392.alert("오류", v_badeaf);
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
                autoFocus
              />
            </View>
            <TouchableOpacity
              style={[v_fd5f43.primaryBtn, (v_cb66b4 || !v_e0c7e8.trim()) && v_fd5f43.btnDisabled]}
              disabled={v_cb66b4 || !v_e0c7e8.trim()}
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
          <>
            <Text style={v_fd5f43.desc}>{v_8d41d7("auth.forgot.step2Desc")}</Text>
            <Text style={v_fd5f43.emailHint}>{v_e0c7e8}</Text>
            <View style={v_fd5f43.inputRow}>
              <Feather name="lock" size={18} color={v_1bfbd0.zinc500} style={v_fd5f43.inputIcon} />
              <TextInput
                style={[v_fd5f43.input, { letterSpacing: 4, fontSize: 16 }]}
                value={v_c99bd2}
                onChangeText={(v_81e2ef) => v_537cbb(v_81e2ef.replace(/\D/g, "").slice(0, 6))}
                placeholder={v_8d41d7("auth.forgot.codePlaceholder")}
                placeholderTextColor={v_1bfbd0.placeholder}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
            </View>
            <TouchableOpacity
              style={[v_fd5f43.primaryBtn, v_c99bd2.length !== 6 && v_fd5f43.btnDisabled]}
              disabled={v_c99bd2.length !== 6}
              onPress={v_4f034c}
            >
              <Text style={v_fd5f43.primaryBtnText}>{v_8d41d7("auth.forgot.verify")}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={v_2de427} disabled={v_cb66b4} style={v_fd5f43.secondaryBtn}>
              <Text style={v_fd5f43.secondaryBtnText}>
                {v_cb66b4 ? v_8d41d7("auth.forgot.sendingCode") : v_8d41d7("auth.forgot.sendCode")}
              </Text>
            </TouchableOpacity>
          </>
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
                secureTextEntry
                autoFocus
              />
            </View>
            <View style={v_fd5f43.inputRow}>
              <Feather name="key" size={18} color={v_1bfbd0.zinc500} style={v_fd5f43.inputIcon} />
              <TextInput
                style={v_fd5f43.input}
                value={v_1e51a9}
                onChangeText={v_014c88}
                placeholder={v_8d41d7("auth.forgot.confirmPasswordPlaceholder")}
                placeholderTextColor={v_1bfbd0.placeholder}
                secureTextEntry
              />
            </View>
            <TouchableOpacity
              style={[v_fd5f43.primaryBtn, (v_cb66b4 || !v_adc076 || !v_1e51a9) && v_fd5f43.btnDisabled]}
              disabled={v_cb66b4 || !v_adc076 || !v_1e51a9}
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
    borderRadius: v_8b0c90.md,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: v_1bfbd0.zinc900,
  },
  primaryBtn: {
    height: 50,
    borderRadius: v_8b0c90.md,
    backgroundColor: v_1bfbd0.zinc900,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  primaryBtnText: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.white },
  btnDisabled: { backgroundColor: v_1bfbd0.zinc300 },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryBtnText: { fontSize: 13, color: v_1bfbd0.zinc500 },
});
