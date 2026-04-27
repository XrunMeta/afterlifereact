import v_a3453e, { v_c4deb2, v_e662ae, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_4623af,
  v_472849,
  v_03e392,
  v_39a996,
  v_79c4f2,
} from "rcmrninabrnb";
import type { v_432191 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_384e19 } from "../../navigation/types";

import v_556baf from "../../components/ui/SafeView";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_1a40c4 from "../../components/ui/Button";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";
import { v_97ea8d, v_35200c, v_84a859 } from "../../api/auth";

type Props = v_432191<v_384e19, "EmailVerify">;

const v_d812cb = 60;

export default function v_e1aa8b({ navigation: v_c65f5d, route: v_c7daf6 }: Props) {
  const v_24baff = v_c7daf6.params;
  const [v_c99bd2, v_537cbb] = v_5ab095("");
  const [v_cb66b4, v_ee9ec1] = v_5ab095(false);
  const [v_600d5b, v_ec979d] = v_5ab095(v_d812cb);
  const v_32f473 = v_e662ae<v_79c4f2>(null);

  v_c4deb2(() => {
    const v_8d41d7 = setInterval(() => v_ec979d((v_fd5f43) => (v_fd5f43 > 0 ? v_fd5f43 - 1 : 0)), 1000);
    return () => clearInterval(v_8d41d7);
  }, []);

  v_c4deb2(() => {
    const v_8d41d7 = setTimeout(() => v_32f473.current?.focus(), 200);
    return () => clearTimeout(v_8d41d7);
  }, []);

  const v_cf9840 = async () => {
    if (v_600d5b > 0) return;
    try {
      await v_97ea8d(v_24baff.email);
      v_ec979d(v_d812cb);
      v_03e392.alert("재발송", "인증 코드를 다시 보냈습니다. 메일함을 확인하세요.");
    } catch (v_49263d) {
      const v_badeaf =
        v_49263d instanceof v_84a859 ? v_49263d.message : "재발송에 실패했습니다.";
      v_03e392.alert("오류", v_badeaf);
    }
  };

  const v_83b05b = async () => {
    if (v_c99bd2.length !== 6) {
      v_03e392.alert("알림", "6자리 인증 코드를 입력해주세요.");
      return;
    }
    v_ee9ec1(true);
    try {

      await v_35200c({
        email: v_24baff.email,
        password: v_24baff.password,
        name: v_24baff.name,
        verificationCode: v_c99bd2,
        phone: v_24baff.phone,
        gender: v_24baff.gender,
        age: v_24baff.age,
        interests: v_24baff.interests,
        marketingConsent: v_24baff.marketingConsent,
        deviceId: v_24baff.deviceId,
        pushToken: v_24baff.pushToken,
        platform: v_24baff.platform,
      });

      v_03e392.alert("가입 완료", "회원가입이 완료되었습니다.", [
        { text: "확인", onPress: () => v_c65f5d.navigate("Login") },
      ]);
    } catch (v_49263d) {
      let v_badeaf = "가입 처리 중 오류가 발생했습니다.";
      if (v_49263d instanceof v_84a859) {
        v_badeaf = v_49263d.message;

        if (/public breaches/i.test(v_49263d.message)) {
          v_badeaf = "보안상 사용할 수 없는 비밀번호입니다. 다른 비밀번호를 사용해주세요.";
        } else if (v_49263d.code === "CONFLICT") {
          v_badeaf = "이미 가입된 이메일입니다. 로그인을 진행해주세요.";
        } else if (v_49263d.code === "OTP_EXPIRED") {
          v_badeaf = "인증 코드가 만료됐습니다. 재발송을 눌러 새 코드를 받아주세요.";
        } else if (v_49263d.code === "OTP_INVALID") {
          const v_dbaa7f = v_49263d.message.match(/(\d+)\s*attempts? left/)?.[1];
          v_badeaf = v_dbaa7f
            ? `잘못된 인증 코드입니다. (${v_dbaa7f}회 시도 가능)`
            : "인증 코드를 너무 많이 틀렸습니다. 재발송 받아 다시 시도해주세요.";
        } else if (v_49263d.code === "OTP_REQUIRED") {
          v_badeaf = "인증 코드가 만료됐거나 폐기됐습니다. 재발송을 눌러주세요.";
        } else if (v_49263d.code === "VALIDATION_FAILED" && Array.isArray(v_49263d.details)) {

          const v_712957 = v_49263d.details
            .map((v_d5dda0) => `• ${(v_d5dda0.path ?? []).join(".")}: ${v_d5dda0.message}`)
            .join("\n");
          v_badeaf = `${v_badeaf}\n\n${v_712957}`;
        }
      }
      v_03e392.alert("오류", v_badeaf);
    } finally {
      v_ee9ec1(false);
    }
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.zinc50}>
      <PageHeader
        title="이메일 인증"
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />
      <SafeScrollView
        contentContainerStyle={v_d81136.content}
        autoAdjustKeyboardPadding
        showBottomBackground={false}
      >
        <View style={v_d81136.container}>
          <Text style={v_d81136.title}>이메일로 코드를 보냈어요</Text>
          <Text style={v_d81136.subtitle}>
            <Text style={v_d81136.email}>{v_24baff.email}</Text>
            {"\n"}메일함의 6자리 인증 코드를 입력해주세요. (5분간 유효)
          </Text>

          <TextInput
            ref={v_32f473}
            value={v_c99bd2}
            onChangeText={(v_8d41d7) => v_537cbb(v_8d41d7.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor={v_1bfbd0.zinc300}
            style={v_d81136.codeInput}
            editable={!v_cb66b4}
            autoFocus
          />

          <Button
            title={v_cb66b4 ? "처리 중..." : "인증하고 가입 완료"}
            onPress={v_83b05b}
            disabled={v_cb66b4 || v_c99bd2.length !== 6}
          />
          {v_cb66b4 && (
            <View style={v_d81136.loadingRow}>
              <ActivityIndicator color={v_1bfbd0.zinc500} />
            </View>
          )}

          <View style={v_d81136.resendRow}>
            <Text style={v_d81136.resendText}>코드를 못 받으셨나요?</Text>
            <TouchableOpacity onPress={v_cf9840} disabled={v_600d5b > 0}>
              <Text
                style={[
                  v_d81136.resendLink,
                  v_600d5b > 0 && v_d81136.resendLinkDisabled,
                ]}
              >
                {v_600d5b > 0 ? `재발송 (${v_600d5b}s)` : "재발송"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeScrollView>
    </SafeView>
  );
}

const v_d81136 = v_472849.create({
  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: v_9b1a04.xlarge,
    paddingVertical: v_9b1a04.xxlarge,
  },
  container: {
    width: "100%",
    maxWidth: 480,
    gap: v_9b1a04.large,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
    textAlign: "center",
    marginTop: v_9b1a04.large,
  },
  subtitle: {
    fontSize: 14,
    color: v_1bfbd0.zinc600,
    textAlign: "center",
    lineHeight: 22,
  },
  email: {
    fontWeight: "600",
    color: v_1bfbd0.zinc900,
  },
  codeInput: {
    height: 64,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc300,
    borderRadius: v_8b0c90.md,
    backgroundColor: v_1bfbd0.white,
    textAlign: "center",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 12,
    color: v_1bfbd0.zinc900,
    paddingHorizontal: v_9b1a04.large,
  },
  loadingRow: {
    alignItems: "center",
    marginTop: -8,
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: v_9b1a04.medium,
  },
  resendText: {
    fontSize: 14,
    color: v_1bfbd0.zinc500,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: "600",
    color: v_1bfbd0.zinc900,
  },
  resendLinkDisabled: {
    color: v_1bfbd0.zinc400,
  },
});
