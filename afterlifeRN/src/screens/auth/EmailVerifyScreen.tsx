import { v_889fad } from "../../stores/dialogStore";
import { v_c65c18 } from "../../lib/activateAuthSession";
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
import { v_772971 } from "jmpfvteuuztnp";
import type { v_432191 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_384e19 } from "../../navigation/types";

import v_556baf from "../../components/ui/SafeView";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_1a40c4 from "../../components/ui/Button";
import v_92f073 from "../../components/auth/OtpVerifyView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";
import { v_97ea8d, v_35200c, v_5c746e, v_dd2158, v_84a859 } from "../../api/auth";
import { v_7f847d, v_421733 } from "../../api/consent";
import { v_d2929b } from "./faceBiometricSignupFlag";
import { v_4eac84, v_8d3720 } from "tdbilgxptaometuphydosyywsglhnlfgkfkzstthk";
import { v_ea1c99 } from "../../lib/deviceId";
import { v_326be8 } from "rcmrninabrnb";
import { v_688424 } from "../../stores/authConfigStore";
import { v_220c23 } from "../../lib/googleAuth";

type Props = v_432191<v_384e19, "EmailVerify">;

const v_d812cb = 60;

export default function v_e1aa8b({ navigation: v_c65f5d, route: v_c7daf6 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const v_24baff = v_c7daf6.params;
  const [v_c99bd2, v_537cbb] = v_5ab095("");
  const [v_cb66b4, v_ee9ec1] = v_5ab095(false);
  const [v_600d5b, v_ec979d] = v_5ab095(v_d812cb);
  const [v_77cdad, v_13dcee] = v_5ab095(false);
  const v_32f473 = v_e662ae<v_79c4f2>(null);

  const v_f6037c = (v_2ca7e0, v_dfaee3) => {
    void v_c65c18({ accessToken: v_2ca7e0, refreshToken: v_dfaee3, persist: true });
  };

  const v_1fe71f = (v_2ca7e0, v_dfaee3) => {
    v_889fad(
      v_8d41d7("auth.emailVerify.googleLinkTitle", { defaultValue: "구글 계정 연동" }),
      v_8d41d7("auth.emailVerify.googleLinkDesc", {
        defaultValue:
          "가입하신 Gmail 계정을 Google 로그인과 연동하시겠어요?\n연동하면 다음부터 간편하게 로그인할 수 있습니다.",
      }),
      [
        {
          text: v_8d41d7("auth.emailVerify.later", { defaultValue: "나중에" }),
          style: "cancel",
          onPress: () => v_f6037c(v_2ca7e0, v_dfaee3),
        },
        {
          text: v_8d41d7("auth.emailVerify.linkNow", { defaultValue: "연동하기" }),
          onPress: () => void v_ac1a42(v_2ca7e0, v_dfaee3),
        },
      ],
    );
  };

  const v_ac1a42 = async (v_2ca7e0, v_dfaee3) => {

    if (!v_220c23()) {
      v_f6037c(v_2ca7e0, v_dfaee3);
      return;
    }
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
        console.warn("[google-link] no idToken");
        v_f6037c(v_2ca7e0, v_dfaee3);
        return;
      }

      const v_de130a = await v_5c746e(v_b50834);
      const v_3639b5 = (v_de130a.email ?? "").toLowerCase();
      const v_b450eb = v_24baff.email.toLowerCase();
      if (v_3639b5 !== v_b450eb) {
        v_889fad(
          v_8d41d7("common.notice"),
          v_8d41d7("auth.emailVerify.googleEmailMismatch", {
            defaultValue:
              "가입 시 입력하신 이메일과 구글 로그인 이메일이 다릅니다. 연동 없이 계속 진행합니다.",
          }),
          [{ text: v_8d41d7("common.confirm", { defaultValue: "확인" }), onPress: () => v_f6037c(v_2ca7e0, v_dfaee3) }],
        );
        return;
      }

      const v_929b58 = await v_ea1c99();
      const v_6202c8 = await v_dd2158({
        idToken: v_b50834,
        deviceId: v_929b58,
        platform: v_326be8.OS === "ios" ? "ios" : "android",
      });
      v_f6037c(v_6202c8.accessToken, v_6202c8.refreshToken ?? null);
    } catch (v_49263d) {
      const v_98136a = v_49263d as { code?: string };
      if (v_98136a?.code === v_8d3720.SIGN_IN_CANCELLED) {
        v_f6037c(v_2ca7e0, v_dfaee3);
        return;
      }
      console.warn("[google-link] failed:", v_49263d);
      v_f6037c(v_2ca7e0, v_dfaee3);
    }
  };

  v_c4deb2(() => {
    const v_8d41d7 = setInterval(() => v_ec979d((v_fd5f43) => (v_fd5f43 > 0 ? v_fd5f43 - 1 : 0)), 1000);
    return () => clearInterval(v_8d41d7);
  }, []);

  v_c4deb2(() => {
    const v_8d41d7 = setTimeout(() => v_32f473.current?.focus(), 200);
    return () => clearTimeout(v_8d41d7);
  }, []);

  const v_cf9840 = async () => {

    if (v_600d5b > 0 || v_77cdad) return;
    v_13dcee(true);
    v_ec979d(v_d812cb);
    try {
      await v_97ea8d(v_24baff.email);
      v_889fad(v_8d41d7("auth.emailVerify.resend"), v_8d41d7("auth.emailVerify.resentToast"));
    } catch (v_49263d) {
      const v_badeaf =
        v_49263d instanceof v_84a859 ? v_49263d.message : v_8d41d7("common.error");
      v_889fad(v_8d41d7("common.error"), v_badeaf);
    } finally {
      v_13dcee(false);
    }
  };

  const v_83b05b = async () => {
    if (v_c99bd2.length !== 6) {
      v_889fad(v_8d41d7("common.notice"), v_8d41d7("auth.emailVerify.codePlaceholder"));
      return;
    }
    v_ee9ec1(true);
    try {

      const v_8f00b9 = await v_35200c({
        email: v_24baff.email,
        password: v_24baff.password,
        name: v_24baff.name,
        verificationCode: v_c99bd2,
        phone: v_24baff.phone,
        gender: v_24baff.gender,
        age: v_24baff.age,
        interests: v_24baff.interests,
        country: v_24baff.country,
        mobileCode: v_24baff.mobileCode,
        region: v_24baff.region,
        marketingConsent: v_24baff.marketingConsent,
        deviceId: v_24baff.deviceId,
        pushToken: v_24baff.pushToken,
        platform: v_24baff.platform,
      });

      if (v_24baff.agreeCallLearning) {
        try {
          await v_7f847d(v_8f00b9.accessToken, "granted", { channel: "signup" });
        } catch (v_49263d) {
          console.warn("[AUTH/signup] saveCallLearningConsent failed:", v_49263d);
        }
      }

      try {
        await v_421733(v_8f00b9.accessToken, v_d2929b(!!v_24baff.agreeFaceBiometric), {
          termsVersion: "v1",
          channel: "signup",
        });
      } catch (v_49263d) {
        console.warn("[AUTH/signup] saveFaceBiometricConsent failed:", v_49263d);
      }

      console.log("[AUTH/signup] success, accessExpiresIn:", v_8f00b9.accessExpiresIn);

      if (
        v_688424.getState().googleEnabled === true &&
        v_24baff.email.toLowerCase().endsWith("@gmail.com")
      ) {
        v_1fe71f(v_8f00b9.accessToken, v_8f00b9.refreshToken ?? null);
      } else {
        v_f6037c(v_8f00b9.accessToken, v_8f00b9.refreshToken ?? null);
      }
    } catch (v_49263d) {
      let v_badeaf = v_8d41d7("auth.signup.signupFailed");
      if (v_49263d instanceof v_84a859) {
        v_badeaf = v_49263d.message;
        if (v_49263d.code === "CONFLICT") {
          v_badeaf = v_8d41d7("auth.signup.alreadyExists");
        } else if (v_49263d.code === "OTP_EXPIRED") {
          v_badeaf = v_8d41d7("auth.emailVerify.expired");
        } else if (v_49263d.code === "OTP_INVALID") {
          v_badeaf = v_8d41d7("auth.emailVerify.wrongCode");
        } else if (v_49263d.code === "OTP_REQUIRED") {
          v_badeaf = v_8d41d7("auth.emailVerify.expired");
        } else if (v_49263d.code === "VALIDATION_FAILED" && Array.isArray(v_49263d.details)) {
          const v_712957 = v_49263d.details
            .map((v_d5dda0) => `• ${(v_d5dda0.path ?? []).join(".")}: ${v_d5dda0.message}`)
            .join("\n");
          v_badeaf = `${v_badeaf}\n\n${v_712957}`;
        }
      }
      v_889fad(v_8d41d7("common.error"), v_badeaf);
    } finally {
      v_ee9ec1(false);
    }
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.zinc50}>
      <PageHeader
        title={v_8d41d7("auth.emailVerify.title")}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />
      <SafeScrollView
        contentContainerStyle={v_d81136.content}
        autoAdjustKeyboardPadding
        showBottomBackground={false}
      >
        <OtpVerifyView
          title={v_8d41d7("auth.emailVerify.title")}
          subtitle={v_8d41d7("auth.emailVerify.desc", { email: v_24baff.email })}
          code={v_c99bd2}
          onChangeCode={v_537cbb}
          onSubmit={v_83b05b}
          submitting={v_cb66b4}
          submitLabel={v_8d41d7("auth.emailVerify.verifyBtn")}
          submittingLabel={v_8d41d7("auth.signup.verifying")}
          resendIn={v_600d5b}
          onResend={v_cf9840}
          resendLabel={v_8d41d7("auth.emailVerify.resend")}
        />
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
