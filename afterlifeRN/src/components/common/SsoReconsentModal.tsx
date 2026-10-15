

import v_a3453e, { v_5ab095 } from "bapkr";
import {
  v_aa7413,
  v_3094a2,
  v_19b633,
  v_09d0e5,
  v_122070,
  v_472849,
  v_e45a99,
  v_326be8,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_c18c22 } from "svuoaeceudfxfjvvpmmmchnwljywbphjgb";
import v_c0caa9, { type v_3ac6ea } from "./TermsModal";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_fa872d } from "../../hooks/useSsoReconsentGate";
import { v_1bfbd0, v_8b0c90 } from "../constants";

type Props = {
  visible: boolean;
  onDone: () => void;
};

export default function v_d53ede({ visible: v_cf55be, onDone: v_7b5712 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const { height: v_c86e33 } = v_e45a99();
  const v_033e14 = v_e0068c();
  const v_f9771e = v_c18c22(0);
  const v_ad9bbd = v_326be8.OS === "android" ? 56 : 0;
  const v_2b650d = Math.max(v_033e14.bottom, v_f9771e, v_ad9bbd);

  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const [v_d39271, v_fe0d62] = v_5ab095<v_3ac6ea | null>(null);
  const [v_51b53b, v_c8f346] = v_5ab095(false);
  const [v_09b7fa, v_1d4807] = v_5ab095(false);
  const [v_540cd3, v_a67880] = v_5ab095(false);
  const [v_ae0efb, v_f2d945] = v_5ab095(false);
  const [v_cb66b4, v_ee9ec1] = v_5ab095(false);

  const v_8c2724 = v_51b53b && v_09b7fa && v_540cd3 && v_ae0efb;

  const v_0217e6 = () => {
    const v_a448ad = !v_8c2724;
    v_c8f346(v_a448ad);
    v_1d4807(v_a448ad);
    v_a67880(v_a448ad);
    v_f2d945(v_a448ad);
  };

  const v_0577ff = async () => {
    if (!v_8c2724 || v_cb66b4) return;
    v_ee9ec1(true);
    try {
      await v_fa872d(v_2ca7e0);
      await v_1ed7d9.getState().refreshApiUser?.();
      v_7b5712();
    } finally {
      v_ee9ec1(false);
    }
  };

  return (
    <Modal
      visible={v_cf55be}
      transparent
      animationType="slide"
      onRequestClose={() => {}}
    >
      <View style={v_d81136.backdrop}>
        <View
          style={[
            v_d81136.sheet,
            { maxHeight: v_c86e33 * 0.9, paddingBottom: 24 + v_2b650d },
          ]}
        >
          <View style={v_d81136.handle} />

          {}
          <View style={v_d81136.header}>
            <View style={v_d81136.iconCircle}>
              <Feather name="shield" size={28} color={v_1bfbd0.violet600} />
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

          <ScrollView
            style={{ flexGrow: 0 }}
            contentContainerStyle={v_d81136.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {}
            <Pressable
              style={({ pressed: v_aba1d2 }) => [
                v_d81136.rowAll,
                v_8c2724 && v_d81136.rowAllActive,
                v_aba1d2 && { opacity: 0.9 },
              ]}
              onPress={v_0217e6}
            >
              <View
                style={[
                  v_d81136.checkbox,
                  v_d81136.checkboxLarge,
                  v_8c2724 && v_d81136.checkboxChecked,
                ]}
              >
                {v_8c2724 && <Feather name="check" size={16} color={v_1bfbd0.white} />}
              </View>
              <Text
                style={[v_d81136.rowAllText, v_8c2724 && v_d81136.rowAllTextActive]}
              >
                {v_8d41d7("sso.reconsent.agreeAll", { defaultValue: "4개 필수 약관 모두 동의" })}
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
              onCheck={() => v_a67880(!v_540cd3)}
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
          </ScrollView>

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
        </View>
      </View>

      <TermsModal
        visible={v_d39271 !== null}
        type={v_d39271}
        onClose={() => v_fe0d62(null)}
        onAgree={() => {
          if (v_d39271 === 1) v_c8f346(true);
          else if (v_d39271 === 3) v_1d4807(true);
          else if (v_d39271 === 2) v_a67880(true);
          else if (v_d39271 === 5) v_f2d945(true);
          v_fe0d62(null);
        }}
      />
    </Modal>
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
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: v_1bfbd0.zinc300,
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: v_1bfbd0.violet100 ?? "#f3f0ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: v_1bfbd0.zinc600,
    lineHeight: 20,
    textAlign: "center",
  },
  scrollContent: {
    paddingBottom: 10,
  },
  rowAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: v_1bfbd0.zinc50 ?? "#fafafa",
    borderRadius: v_8b0c90.small,
  },
  rowAllActive: {
    backgroundColor: v_1bfbd0.violet100 ?? "#f3f0ff",
  },
  rowAllText: {
    fontSize: 15,
    fontWeight: "600",
    color: v_1bfbd0.zinc700,
  },
  rowAllTextActive: {
    color: v_1bfbd0.violet600,
  },
  divider: {
    height: v_472849.hairlineWidth,
    backgroundColor: v_1bfbd0.zinc200,
    marginVertical: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  rowTextWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowText: {
    flex: 1,
    fontSize: 14,
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
    backgroundColor: v_1bfbd0.violet600,
    borderColor: v_1bfbd0.violet600,
  },
  continueBtn: {
    marginTop: 16,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: v_1bfbd0.violet600,
    alignItems: "center",
  },
  continueBtnDisabled: {
    backgroundColor: v_1bfbd0.zinc300,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: v_1bfbd0.white,
  },
});
