

import { v_fec9c0 } from "../../lib/accountStatusAlert";
import { v_889fad } from "../../stores/dialogStore";
import v_a3453e, { v_c4deb2, v_5ab095 } from "bapkr";
import { v_3094a2, v_472849 } from "rcmrninabrnb";
import v_e84827 from "bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_432191 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_384e19 } from "../../navigation/types";

import v_556baf from "../../components/ui/SafeView";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import v_92f073 from "../../components/auth/OtpVerifyView";
import { v_1bfbd0, v_9b1a04 } from "../../components/constants";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_84a859, v_1d5b64, v_c0c425, v_7ef860, v_182fdb as v_ac9e58 } from "../../api/auth";
import { v_ea1c99 } from "../../lib/deviceId";
import { v_e41029 } from "../../lib/appsFlyer";

const v_101856 = "@afterlifeRN/auth/autoLoginPref";
const v_6a7868 = "@afterlifeRN/auth/lastEmail";

type Props = v_432191<v_384e19, "EmailOtpLogin">;

const v_d812cb = 60;

export default function v_415807({ navigation: v_c65f5d, route: v_c7daf6 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const { email: v_e0c7e8, autoLogin: v_f53eaa, password: v_adc076 } = v_c7daf6.params;

  const v_34ad95 = !!v_adc076;
  const [v_c99bd2, v_537cbb] = v_5ab095("");
  const [v_cb66b4, v_ee9ec1] = v_5ab095(false);
  const [v_600d5b, v_ec979d] = v_5ab095(v_d812cb);

  const v_232d52 = v_1ed7d9((v_fd5f43) => v_fd5f43.hydrate);
  const v_31080f = v_1ed7d9((v_fd5f43) => v_fd5f43.setApiAuth);

  v_c4deb2(() => {
    if (v_600d5b <= 0) return;
    const v_389afb = setInterval(() => v_ec979d((v_fd5f43) => (v_fd5f43 > 0 ? v_fd5f43 - 1 : 0)), 1000);
    return () => clearInterval(v_389afb);
  }, [v_600d5b]);

  const v_cf9840 = async () => {
    if (v_600d5b > 0) return;
    try {
      console.log(`[AUTH/otpResend] mode=${v_34ad95 && v_adc076 ? "firstLoginGate" : "emailLoginCode"} email=${v_e0c7e8}`);
      if (v_34ad95 && v_adc076) {

        const v_929b58 = await v_ea1c99();
        await v_ac9e58({ email: v_e0c7e8, password: v_adc076, deviceId: v_929b58 });
      } else {
        await v_1d5b64(v_e0c7e8);
      }
      console.log(`[AUTH/otpResend] 서버 발송 요청 성공. 메일 안 오면 wrangler tail 로 sendMail 결과 확인.`);
      v_537cbb("");
      v_ec979d(v_d812cb);
      v_889fad(v_8d41d7("auth.emailOtpLogin.resendTitle"), v_8d41d7("auth.emailOtpLogin.resendToast"));
    } catch (v_49263d) {
      console.warn(`[AUTH/otpResend] failed:`, v_49263d instanceof v_84a859 ? `${v_49263d.code} ${v_49263d.message}` : (v_49263d as Error)?.message);
      const v_badeaf = v_49263d instanceof v_84a859 ? v_49263d.message : v_8d41d7("auth.emailOtpLogin.resendFailed");
      v_889fad(v_8d41d7("common.error"), v_badeaf);
    }
  };

  const v_83b05b = async () => {
    if (v_c99bd2.length !== 6) return;
    v_ee9ec1(true);
    try {
      const v_929b58 = await v_ea1c99();

      console.log(`[AUTH/otpVerify] mode=${v_34ad95 && v_adc076 ? "firstLoginGate" : "emailLogin"} email=${v_e0c7e8} code=${v_c99bd2}`);
      const v_8f00b9 = v_34ad95 && v_adc076
        ? await v_ac9e58({ email: v_e0c7e8, password: v_adc076, deviceId: v_929b58, verificationCode: v_c99bd2 })
        : await v_c0c425({ email: v_e0c7e8, verificationCode: v_c99bd2, deviceId: v_929b58 });
      console.log(`[AUTH/otpVerify] response: hasToken=${!!v_8f00b9.accessToken}`);
      if (!v_8f00b9.accessToken) {

        throw new v_84a859(400, "OTP_INVALID", v_8d41d7("auth.emailOtpLogin.wrongCode"));
      }
      const v_9ec4c0 = await v_7ef860(v_8f00b9.accessToken);
      await v_31080f(v_8f00b9.accessToken, v_9ec4c0.user, {
        persist: v_f53eaa,
        refreshToken: v_8f00b9.refreshToken ?? null,
      });
      v_e41029(v_34ad95 && v_adc076 ? "email" : "email_otp");
      if (v_f53eaa) {
        await v_e84827.setItem(v_101856, "1");
        await v_e84827.setItem(v_6a7868, v_e0c7e8);
      } else {
        await v_e84827.setItem(v_101856, "0"); 
        await v_e84827.removeItem(v_6a7868);
      }
      await v_232d52();
    } catch (v_49263d) {

      const v_c5c078 = v_fec9c0(v_49263d, v_8d41d7, {
        deviceId: await v_ea1c99(),
        onReactivated: async (v_fd5f43) => {
          const v_9ec4c0 = await v_7ef860(v_fd5f43.accessToken);
          await v_31080f(v_fd5f43.accessToken, v_9ec4c0.user, { persist: v_f53eaa, refreshToken: v_fd5f43.refreshToken ?? null });
          v_e41029("email_otp");
          await v_232d52();
        },
      });
      if (v_c5c078) return;
      let v_badeaf = v_8d41d7("auth.emailOtpLogin.loginFailed");
      if (v_49263d instanceof v_84a859) {
        if (v_49263d.code === "ACCOUNT_DELETED") {
          v_889fad(v_8d41d7("auth.emailOtpLogin.loginFailedTitle"), v_8d41d7("auth.emailOtpLogin.accountDeleted"));
          return;
        }
        if (v_49263d.code === "OTP_INVALID") v_badeaf = v_8d41d7("auth.emailOtpLogin.wrongCode");
        else if (v_49263d.code === "OTP_EXPIRED") v_badeaf = v_8d41d7("auth.emailOtpLogin.expiredCode");
        else if (v_49263d.code === "NOT_FOUND") v_badeaf = v_8d41d7("auth.emailOtpLogin.notFound");
        else v_badeaf = v_49263d.message;
      }
      v_889fad(v_8d41d7("auth.emailOtpLogin.loginFailedTitle"), v_badeaf);
    } finally {
      v_ee9ec1(false);
    }
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.zinc50}>
      <PageHeader title={v_8d41d7("auth.emailOtpLogin.title")} showBackButton onBackPress={() => v_c65f5d.goBack()} />
      <SafeScrollView
        contentContainerStyle={v_d81136.content}
        autoAdjustKeyboardPadding
        showBottomBackground={false}
      >
        <View style={v_d81136.container}>
          <OtpVerifyView
            title={v_8d41d7("auth.emailOtpLogin.title")}
            email={v_e0c7e8}
            code={v_c99bd2}
            onChangeCode={v_537cbb}
            onSubmit={v_83b05b}
            submitting={v_cb66b4}
            submitLabel={v_8d41d7("auth.emailOtpLogin.loginBtn")}
            submittingLabel={v_8d41d7("auth.emailOtpLogin.loggingIn")}
            resendIn={v_600d5b}
            onResend={v_cf9840}
            resendLabel={v_8d41d7("auth.emailVerify.resend")}
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
