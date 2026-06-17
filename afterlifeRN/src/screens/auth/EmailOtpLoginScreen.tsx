

import { v_889fad } from "../../stores/dialogStore";
import v_a3453e, { v_c4deb2, v_5ab095 } from "bapkr";
import { v_3094a2, v_472849 } from "rcmrninabrnb";
import v_e84827 from "bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv";
import type { v_432191 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_384e19 } from "../../navigation/types";

import v_556baf from "../../components/ui/SafeView";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import v_92f073 from "../../components/auth/OtpVerifyView";
import { v_1bfbd0, v_9b1a04 } from "../../components/constants";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_84a859, v_1d5b64, v_c0c425, v_7ef860 } from "../../api/auth";
import { v_ea1c99 } from "../../lib/deviceId";

const v_101856 = "@afterlifeRN/auth/autoLoginPref";
const v_6a7868 = "@afterlifeRN/auth/lastEmail";

type Props = v_432191<v_384e19, "EmailOtpLogin">;

const v_d812cb = 60;

export default function v_415807({ navigation: v_c65f5d, route: v_c7daf6 }: Props) {
  const { email: v_e0c7e8, autoLogin: v_f53eaa } = v_c7daf6.params;
  const [v_c99bd2, v_537cbb] = v_5ab095("");
  const [v_cb66b4, v_ee9ec1] = v_5ab095(false);
  const [v_600d5b, v_ec979d] = v_5ab095(v_d812cb);

  const v_232d52 = v_1ed7d9((v_fd5f43) => v_fd5f43.hydrate);
  const v_31080f = v_1ed7d9((v_fd5f43) => v_fd5f43.setApiAuth);
  const v_3345cb = v_1ed7d9((v_fd5f43) => v_fd5f43.setApiTokens);

  v_c4deb2(() => {
    if (v_600d5b <= 0) return;
    const v_389afb = setInterval(() => v_ec979d((v_fd5f43) => (v_fd5f43 > 0 ? v_fd5f43 - 1 : 0)), 1000);
    return () => clearInterval(v_389afb);
  }, [v_600d5b]);

  const v_cf9840 = async () => {
    if (v_600d5b > 0) return;
    try {
      await v_1d5b64(v_e0c7e8);
      v_537cbb("");
      v_ec979d(v_d812cb);
      v_889fad("인증코드 재발송", "이메일로 코드를 다시 보냈어요.");
    } catch (v_49263d) {
      const v_badeaf = v_49263d instanceof v_84a859 ? v_49263d.message : "코드 재발송에 실패했어요.";
      v_889fad("오류", v_badeaf);
    }
  };

  const v_83b05b = async () => {
    if (v_c99bd2.length !== 6) return;
    v_ee9ec1(true);
    try {
      const v_929b58 = await v_ea1c99();
      const v_8f00b9 = await v_c0c425({ email: v_e0c7e8, verificationCode: v_c99bd2, deviceId: v_929b58 });
      const v_9ec4c0 = await v_7ef860(v_8f00b9.accessToken);
      await v_31080f(v_8f00b9.accessToken, v_9ec4c0.user, { persist: v_f53eaa });
      const v_46eca9 = (v_8f00b9 as { refreshToken?: string }).refreshToken;
      if (v_46eca9) await v_3345cb(v_8f00b9.accessToken, v_46eca9, { persist: v_f53eaa });
      if (v_f53eaa) {
        await v_e84827.setItem(v_101856, "1");
        await v_e84827.setItem(v_6a7868, v_e0c7e8);
      } else {
        await v_e84827.removeItem(v_101856);
        await v_e84827.removeItem(v_6a7868);
      }
      await v_232d52();
    } catch (v_49263d) {
      let v_badeaf = "로그인에 실패했어요.";
      if (v_49263d instanceof v_84a859) {
        if (v_49263d.code === "ACCOUNT_DELETED") {
          v_889fad("로그인 실패", "이미 탈퇴한 계정이에요.");
          return;
        }
        if (v_49263d.code === "OTP_INVALID") v_badeaf = "인증코드가 올바르지 않아요.";
        else if (v_49263d.code === "OTP_EXPIRED") v_badeaf = "인증코드가 만료됐어요. 다시 받아주세요.";
        else if (v_49263d.code === "NOT_FOUND") v_badeaf = "가입된 이메일이 아니에요.";
        else v_badeaf = v_49263d.message;
      }
      v_889fad("로그인 실패", v_badeaf);
    } finally {
      v_ee9ec1(false);
    }
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.zinc50}>
      <PageHeader title="이메일 OTP 로그인" showBackButton onBackPress={() => v_c65f5d.goBack()} />
      <SafeScrollView
        contentContainerStyle={v_d81136.content}
        autoAdjustKeyboardPadding
        showBottomBackground={false}
      >
        <View style={v_d81136.container}>
          <OtpVerifyView
            title="이메일 OTP 로그인"
            email={v_e0c7e8}
            code={v_c99bd2}
            onChangeCode={v_537cbb}
            onSubmit={v_83b05b}
            submitting={v_cb66b4}
            submitLabel="로그인"
            submittingLabel="로그인 중..."
            resendIn={v_600d5b}
            onResend={v_cf9840}
            resendLabel="코드 재발송"
          />
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
  container: { width: "100%", maxWidth: 480 },
});
