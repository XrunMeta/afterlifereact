

import v_a3453e, { v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_09d0e5,
  v_122070,
  v_472849,
  v_326be8,
  v_b5df25,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_c18c22 } from "svuoaeceudfxfjvvpmmmchnwljywbphjgb";
import v_c0caa9, { type v_3ac6ea } from "../../components/common/TermsModal";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_fa872d } from "../../hooks/useSsoReconsentGate";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";

import {
  v_7f847d,
  v_505b50,
  v_421733,
  v_2d09bf,
} from "../../api/consent";
import { v_d2929b } from "./faceBiometricSignupFlag";
import { v_704bef, v_9bedf5 } from "../../lib/pushNotifications";
import { v_889fad } from "../../stores/dialogStore";

type Props = {
  onDone: () => void;
};

export default function v_ac767f({ onDone: v_7b5712 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const v_033e14 = v_e0068c();
  const v_f9771e = v_c18c22(0);
  const v_ad9bbd = v_326be8.OS === "android" ? 56 : 0;
  const v_53dd92 = Math.max(v_033e14.bottom, v_f9771e, v_ad9bbd);

  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const [v_d39271, v_fe0d62] = v_5ab095<v_3ac6ea | null>(null);
  const [v_51b53b, v_c8f346] = v_5ab095(false);
  const [v_09b7fa, v_1d4807] = v_5ab095(false);
  const [v_540cd3, v_a67880] = v_5ab095(false);
  const [v_ae0efb, v_f2d945] = v_5ab095(false);

  const [v_a03498, v_d34fc9] = v_5ab095(false);

  const [v_8c98c4, v_e378a4] = v_5ab095(false);

  const [v_4513fd, v_9537cd] = v_5ab095(false);
  const [v_8d0e18, v_3bb4d3] = v_5ab095(false);
  const [v_cb66b4, v_ee9ec1] = v_5ab095(false);
  const v_9b51bc = v_1ed7d9((v_fd5f43) => v_fd5f43.apiLogout);

  const v_8c2724 = v_51b53b && v_09b7fa && v_540cd3 && v_ae0efb;
  const v_33f2ba = v_8c2724 && v_a03498 && v_8c98c4 && v_4513fd;

  const v_8d4692 = async () => {
    if (v_540cd3) {
      v_a67880(false);
      return;
    }
    try {
      const v_8a44cb = await import("zryrlwvgokjhz");
      const v_fc6010 = await v_8a44cb.getForegroundPermissionsAsync();
      const v_d60769 = v_fc6010.granted ? v_fc6010 : await v_8a44cb.requestForegroundPermissionsAsync();
      if (!v_d60769.granted) {
        v_889fad(
          v_8d41d7("auth.signup.locationPermTitle", { defaultValue: "위치 권한 필요" }),
          v_8d41d7("auth.signup.locationPermDesc", {
            defaultValue:
              "통화 시 지역 기반 대화를 하려면 위치 권한이 필요합니다.\n기기 설정 → 위치 → AfterLife 에서 허용해 주십시오.",
          }),
        );
        return;
      }
      v_a67880(true);
    } catch (v_49263d) {
      console.warn("[SsoReconsent] location permission request failed:", v_49263d);
      v_889fad(
        v_8d41d7("common.error"),
        v_8d41d7("auth.signup.locationPermError", { defaultValue: "위치 권한 요청 중 문제가 발생했습니다." }),
      );
    }
  };

  const v_349606 = async () => {
    if (v_8c98c4) {
      v_e378a4(false);
      return;
    }
    v_3bb4d3(true);
    try {
      const v_e43fa5 = await v_704bef();
      if (!v_e43fa5.granted) {
        v_889fad(v_8d41d7("auth.signup.pushPermTitle"), v_8d41d7("auth.signup.pushPermDesc"));
        return;
      }
      v_e378a4(true);
    } catch {
      v_889fad(v_8d41d7("common.error"), v_8d41d7("auth.signup.pushPermError"));
    } finally {
      v_3bb4d3(false);
    }
  };

  const v_0217e6 = async () => {
    const v_a448ad = !v_33f2ba;
    v_c8f346(v_a448ad);
    v_1d4807(v_a448ad);
    v_f2d945(v_a448ad);
    v_d34fc9(v_a448ad);
    v_9537cd(v_a448ad);
    if (!v_a448ad) {
      v_a67880(false);
      v_e378a4(false);
      return;
    }
    if (!v_540cd3) await v_8d4692();
    if (!v_8c98c4) await v_349606();
  };

  const v_0577ff = async () => {
    if (!v_8c2724 || v_cb66b4) return;
    v_ee9ec1(true);
    try {

      if (v_2ca7e0) {
        if (v_540cd3) {
          try {
            await v_2d09bf(v_2ca7e0, "granted", { channel: "settings" });
          } catch (v_49263d) {
            console.warn("[SsoReconsent] saveLocationConsent failed:", v_49263d);
          }
        }
        if (v_ae0efb) {
          try {
            await v_7f847d(v_2ca7e0, "granted", { channel: "settings" });
          } catch (v_49263d) {
            console.warn("[SsoReconsent] saveCallLearningConsent failed:", v_49263d);
          }
        }

        try {
          await v_421733(
            v_2ca7e0,
            v_d2929b(v_a03498),
            { termsVersion: "v1", channel: "settings" },
          );
        } catch (v_49263d) {
          console.warn("[SsoReconsent] saveFaceBiometricConsent failed:", v_49263d);
        }

        try {
          await v_505b50(v_2ca7e0, v_4513fd ? "granted" : "revoked", {
            termsVersion: "v1",
            channel: "settings",
          });
        } catch (v_49263d) {
          console.warn("[SsoReconsent] saveCloneFaceConsent failed:", v_49263d);
        }
      }
      await v_fa872d(v_2ca7e0, { marketingConsent: v_8c98c4 });
      if (v_8c98c4) void v_9bedf5(v_2ca7e0);
      await v_1ed7d9.getState().refreshApiUser?.();
      v_7b5712();
    } finally {
      v_ee9ec1(false);
    }
  };

  return (
    <View style={[v_d81136.container, { paddingTop: v_033e14.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={v_1bfbd0.white} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          v_d81136.scrollContent,
          { paddingBottom: 24 + v_53dd92 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {}
        <View style={v_d81136.header}>
          <View style={v_d81136.iconCircle}>
            <Feather name="shield" size={32} color={v_1bfbd0.violet600} />
          </View>
          <Text style={v_d81136.title}>
            {v_8d41d7("sso.reconsent.title", { defaultValue: "SSO 통합 계정 전환" })}
          </Text>
          <Text style={v_d81136.subtitle}>
            {v_8d41d7("sso.reconsent.subtitle", {
              defaultValue:
                "서비스 통합을 위해 약관이 개정되었습니다.\n아래 필수 약관에 다시 동의해 주세요.",
            })}
          </Text>
        </View>

        {}
        <Pressable
          style={({ pressed: v_aba1d2 }) => [
            v_d81136.rowAll,
            v_33f2ba && v_d81136.rowAllActive,
            v_aba1d2 && { opacity: 0.9 },
          ]}
          onPress={() => void v_0217e6()}
        >
          <View
            style={[
              v_d81136.checkbox,
              v_d81136.checkboxLarge,
              v_33f2ba && v_d81136.checkboxChecked,
            ]}
          >
            {v_33f2ba && <Feather name="check" size={16} color={v_1bfbd0.white} />}
          </View>
          <Text style={[v_d81136.rowAllText, v_33f2ba && v_d81136.rowAllTextActive]}>
            {v_8d41d7("auth.signup.termsAgreeAll", { defaultValue: "전체 동의" })}
          </Text>
        </Pressable>

        <View style={v_d81136.divider} />

        <ConsentRow
          checked={v_51b53b}
          onCheck={() => v_c8f346(!v_51b53b)}
          onReadMore={() => v_fe0d62(1)}
          label={v_8d41d7("auth.signup.termsService", {
            defaultValue: "[필수] SSO 통합 서비스 이용약관",
          })}
        />
        <ConsentRow
          checked={v_09b7fa}
          onCheck={() => v_1d4807(!v_09b7fa)}
          onReadMore={() => v_fe0d62(3)}
          label={v_8d41d7("auth.signup.termsPrivacy", {
            defaultValue: "[필수] SSO 통합 개인정보 처리방침",
          })}
        />
        <ConsentRow
          checked={v_540cd3}
          onCheck={() => void v_8d4692()}
          onReadMore={() => v_fe0d62(2)}
          label={v_8d41d7("auth.signup.locationConsent", {
            defaultValue: "[필수] 위치기반서비스 이용약관",
          })}
        />
        <ConsentRow
          checked={v_ae0efb}
          onCheck={() => v_f2d945(!v_ae0efb)}
          onReadMore={() => v_fe0d62(5)}
          label={v_8d41d7("auth.signup.callLearningConsent", {
            defaultValue: "[필수] AI 데이터 활용 및 생성 동의",
          })}
        />
        {}
        <ConsentRow
          checked={v_a03498}
          onCheck={() => v_d34fc9(!v_a03498)}
          onReadMore={() => v_fe0d62(4)}
          label={v_8d41d7("auth.signup.faceBiometricConsent", {
            defaultValue: "[선택] 얼굴 생체정보 처리 동의",
          })}
        />
        {}
        <ConsentRow
          checked={v_4513fd}
          onCheck={() => v_9537cd(!v_4513fd)}
          onReadMore={() => v_fe0d62(6)}
          label={v_8d41d7("auth.signup.cloneFaceConsent", {
            defaultValue: "[선택] 클론별 얼굴 인식 동의",
          })}
        />
        {}
        <ConsentRow
          checked={v_8c98c4}
          onCheck={() => void v_349606()}
          onReadMore={() => void v_349606()}
          label={`${v_8d41d7("auth.signup.marketingConsent", {
            defaultValue: "[선택] 마케팅 정보 수집 및 활용 동의",
          })}${v_8d0e18 ? ` (${v_8d41d7("auth.signup.verifying", { defaultValue: "확인 중" })})` : ""}`}
        />
      </ScrollView>

      <View style={[v_d81136.footer, { paddingBottom: 16 + v_53dd92 }]}>
        <Pressable
          style={({ pressed: v_aba1d2 }) => [
            v_d81136.continueBtn,
            !v_8c2724 && v_d81136.continueBtnDisabled,
            v_aba1d2 && v_8c2724 && { opacity: 0.85 },
          ]}
          onPress={v_0577ff}
          disabled={!v_8c2724 || v_cb66b4}
        >
          <Text style={v_d81136.continueBtnText}>
            {v_cb66b4
              ? v_8d41d7("sso.reconsent.saving", { defaultValue: "처리 중..." })
              : v_8d41d7("sso.reconsent.continue", { defaultValue: "동의하고 계속" })}
          </Text>
        </Pressable>
        {}
        <Pressable onPress={() => void v_9b51bc()} style={v_d81136.logoutLink} hitSlop={8}>
          <Text style={v_d81136.logoutLinkText}>
            {v_8d41d7("permissionGate.logout", { defaultValue: "로그아웃" })}
          </Text>
        </Pressable>
      </View>

      <TermsModal
        visible={v_d39271 !== null}
        type={v_d39271}
        onClose={() => v_fe0d62(null)}
        onAgree={() => {

          const v_357868 = v_d39271;
          v_fe0d62(null);
          if (v_357868 === 1) v_c8f346(true);

          else if (v_357868 === 2) { if (!v_540cd3) void v_8d4692(); }
          else if (v_357868 === 3) v_1d4807(true);
          else if (v_357868 === 4) v_d34fc9(true);
          else if (v_357868 === 5) v_f2d945(true);
          else if (v_357868 === 6) v_9537cd(true);
        }}
      />
    </View>
  );
}

function v_303c42({
  checked: v_da90dc,
  onCheck: v_11e7c0,
  onReadMore: v_1f5aec,
  label: v_2869c1,
}: {
  checked: boolean;
  onCheck: () => void;
  onReadMore: () => void;
  label: string;
}) {
  return (
    <View style={v_d81136.row}>
      <Pressable onPress={v_11e7c0} hitSlop={8}>
        <View style={[v_d81136.checkbox, v_da90dc && v_d81136.checkboxChecked]}>
          {v_da90dc && <Feather name="check" size={13} color={v_1bfbd0.white} />}
        </View>
      </Pressable>
      <Pressable style={v_d81136.rowTextWrap} onPress={v_1f5aec}>
        <Text style={v_d81136.rowText}>{v_2869c1}</Text>
        <Feather name="chevron-right" size={16} color={v_1bfbd0.zinc400} />
      </Pressable>
    </View>
  );
}

const v_d81136 = v_472849.create({
  container: {
    flex: 1,
    backgroundColor: v_1bfbd0.white,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: v_1bfbd0.violet100 ?? "#f3f0ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: v_1bfbd0.zinc600,
    lineHeight: 22,
    textAlign: "center",
  },
  rowAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: v_1bfbd0.zinc50 ?? "#fafafa",
    borderRadius: v_8b0c90.sm,
  },
  rowAllActive: {
    backgroundColor: v_1bfbd0.violet100 ?? "#f3f0ff",
  },
  rowAllText: {
    fontSize: 16,
    fontWeight: "600",
    color: v_1bfbd0.zinc700,
  },
  rowAllTextActive: {
    color: v_1bfbd0.violet600,
  },
  divider: {
    height: v_472849.hairlineWidth,
    backgroundColor: v_1bfbd0.zinc200,
    marginVertical: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  rowTextWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowText: {
    flex: 1,
    fontSize: 15,
    color: v_1bfbd0.zinc800,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: v_1bfbd0.zinc300,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxLarge: {
    width: 24,
    height: 24,
  },
  checkboxChecked: {
    backgroundColor: v_1bfbd0.primary,
    borderColor: v_1bfbd0.primary,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: v_472849.hairlineWidth,
    borderTopColor: v_1bfbd0.zinc200,
    backgroundColor: v_1bfbd0.white,
  },
  continueBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: v_1bfbd0.primary,
    alignItems: "center",
  },
  continueBtnDisabled: {
    backgroundColor: v_1bfbd0.zinc300,
  },
  logoutLink: {
    alignItems: "center",
    paddingTop: 12,
  },
  logoutLinkText: {
    fontSize: 13,
    color: v_1bfbd0.zinc400,
    textDecorationLine: "underline",
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: v_1bfbd0.white,
  },
});
