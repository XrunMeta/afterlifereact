import v_a3453e, { v_5ab095 } from "bapkr";
import { v_3094a2, v_19b633, v_4623af, v_472849, v_03e392 } from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import type { v_432191 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_384e19 } from "../../navigation/types";

import v_556baf from "../../components/ui/SafeView";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_1a40c4 from "../../components/ui/Button";
import v_84e2fc from "../../components/ui/InterestChip";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_9b1a04 } from "../../components/constants";
import { v_bf4124 } from "../../mocks/interestHelpers";
import { v_f3a3a5, v_84a859, v_7ef860 } from "../../api/auth";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_704bef } from "../../lib/pushNotifications";
import { v_ea1c99 } from "../../lib/deviceId";

type Props = v_432191<v_384e19, "XrunOnboarding">;

export default function v_033f95({ navigation: v_c65f5d, route: v_c7daf6 }: Props) {
  const { email: v_e0c7e8, pin: v_6bee94, verificationCode: v_8e7cda } = v_c7daf6.params;
  const [v_976e06, v_770327] = v_5ab095<string[]>([]);
  const [v_5c764d, v_c5baa3] = v_5ab095(false);
  const [v_8c98c4, v_e378a4] = v_5ab095(false);
  const [v_8d0e18, v_3bb4d3] = v_5ab095(false);
  const [v_1a29d0, v_704175] = v_5ab095<string | null>(null);
  const [v_ea920b, v_73f064] = v_5ab095<"ios" | "android" | "web" | null>(null);
  const [v_929b58, v_94f796] = v_5ab095<string | null>(null);
  const [v_cb66b4, v_ee9ec1] = v_5ab095(false);

  const v_31080f = v_1ed7d9((v_fd5f43) => v_fd5f43.setApiAuth);
  const v_232d52 = v_1ed7d9((v_fd5f43) => v_fd5f43.hydrate);

  const v_d82a00 = (v_e4601c) => {
    v_770327((v_ba2215) =>
      v_ba2215.includes(v_e4601c) ? v_ba2215.filter((v_ebec57) => v_ebec57 !== v_e4601c) : [...v_ba2215, v_e4601c],
    );
  };

  const v_349606 = async () => {
    if (v_8c98c4) {
      v_e378a4(false);
      v_704175(null);
      v_73f064(null);
      v_94f796(null);
      return;
    }
    v_3bb4d3(true);
    try {
      const v_e43fa5 = await v_704bef();
      if (!v_e43fa5.granted) {
        v_03e392.alert(
          "푸시 알림 권한 필요",
          "마케팅 정보 알림을 받으려면 푸시 알림 권한이 필요합니다.\n기기 설정 → 알림 → AfterLife 에서 허용해주세요.",
        );
        return;
      }
      const v_de2b1c = await v_ea1c99();
      v_e378a4(true);
      v_704175(v_e43fa5.token ?? null);
      v_73f064(v_e43fa5.platform);
      v_94f796(v_de2b1c);
    } catch {
      v_03e392.alert("오류", "권한 요청 중 문제가 발생했습니다.");
    } finally {
      v_3bb4d3(false);
    }
  };

  const v_44851c = async () => {
    if (!v_5c764d) {
      v_03e392.alert("알림", "이용약관에 동의해주세요.");
      return;
    }
    v_ee9ec1(true);
    try {
      const v_8f00b9 = await v_f3a3a5({
        email: v_e0c7e8,
        pin: v_6bee94,
        verificationCode: v_8e7cda,
        interests: v_976e06.length > 0 ? v_976e06 : undefined,
        marketingConsent: v_8c98c4,
        deviceId: v_929b58 ?? undefined,
        pushToken: v_1a29d0 ?? undefined,
        platform: v_ea920b ?? undefined,
      });

      const v_9ec4c0 = await v_7ef860(v_8f00b9.accessToken);
      await v_31080f(v_8f00b9.accessToken, v_9ec4c0.user);
      console.log("[AUTH/xrun] user:", v_9ec4c0.user);
      await v_232d52();
    } catch (v_49263d) {
      let v_badeaf = "처리 중 오류가 발생했습니다.";
      if (v_49263d instanceof v_84a859) {
        if (v_49263d.code === "OTP_EXPIRED") v_badeaf = "인증 코드가 만료됐습니다. 처음부터 다시 시도해주세요.";
        else if (v_49263d.code === "OTP_INVALID") v_badeaf = "잘못된 인증 코드입니다.";
        else if (v_49263d.code === "UNAUTHENTICATED") v_badeaf = "xrun 자격증명이 무효합니다.";
        else v_badeaf = v_49263d.message;
      }
      v_03e392.alert("오류", v_badeaf);
    } finally {
      v_ee9ec1(false);
    }
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.zinc50}>
      <PageHeader title="가입 마지막 단계" showBackButton onBackPress={() => v_c65f5d.goBack()} />
      <SafeScrollView contentContainerStyle={v_d81136.content} autoAdjustKeyboardPadding showBottomBackground={false}>
        <View style={v_d81136.container}>
          <Text style={v_d81136.title}>관심사와 약관 확인</Text>
          <Text style={v_d81136.subtitle}>
            xrun 인증이 완료됐어요. 마지막으로 관심사와 약관을 확인해주세요.
          </Text>

          {}
          <View style={v_d81136.section}>
            <Text style={v_d81136.sectionLabel}>관심사 선택 (선택사항)</Text>
            <View style={v_d81136.chipGrid}>
              {v_bf4124.map((v_e4601c) => (
                <InterestChip
                  key={v_e4601c}
                  label={v_e4601c}
                  selected={v_976e06.includes(v_e4601c)}
                  onPress={() => v_d82a00(v_e4601c)}
                />
              ))}
            </View>
          </View>

          {}
          <View style={v_d81136.terms}>
            <TouchableOpacity onPress={() => v_c5baa3(!v_5c764d)} style={v_d81136.checkRow}>
              <View style={[v_d81136.checkbox, v_5c764d && v_d81136.checkboxChecked]}>
                {v_5c764d && <Feather name="check" size={14} color={v_1bfbd0.white} />}
              </View>
              <Text style={v_d81136.termText}>
                <Text style={v_d81136.termBold}>(필수)</Text> 이용약관 및 개인정보 처리방침에 동의합니다
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={v_349606} disabled={v_8d0e18} style={v_d81136.checkRow}>
              <View style={[v_d81136.checkbox, v_8c98c4 && v_d81136.checkboxChecked]}>
                {v_8c98c4 && <Feather name="check" size={14} color={v_1bfbd0.white} />}
              </View>
              <Text style={v_d81136.termText}>
                <Text style={v_d81136.termOptional}>(선택)</Text> 마케팅 정보 수신에 동의합니다
                {v_8d0e18 ? " (권한 요청 중...)" : ""}
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            title={v_cb66b4 ? "가입 처리 중..." : "가입 완료"}
            onPress={v_44851c}
            disabled={v_cb66b4 || !v_5c764d}
          />
        </View>
      </SafeScrollView>
    </SafeView>
  );
}

const v_d81136 = v_472849.create({
  content: { flexGrow: 1, alignItems: "center", paddingHorizontal: v_9b1a04.xlarge, paddingVertical: v_9b1a04.xxlarge },
  container: { width: "100%", maxWidth: 780, gap: v_9b1a04.medium },
  title: { fontSize: 20, fontWeight: "700", color: v_1bfbd0.zinc900, textAlign: "center", marginTop: v_9b1a04.large },
  subtitle: { fontSize: 14, color: v_1bfbd0.zinc600, textAlign: "center", lineHeight: 22, marginBottom: v_9b1a04.medium },
  section: { gap: 12 },
  sectionLabel: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  terms: { gap: 12, paddingTop: v_9b1a04.medium },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc300,
    backgroundColor: v_1bfbd0.white,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: v_1bfbd0.zinc900, borderColor: v_1bfbd0.zinc900 },
  termText: { flex: 1, fontSize: 13, color: v_1bfbd0.zinc600, lineHeight: 20 },
  termBold: { fontWeight: "600", color: v_1bfbd0.zinc900 },
  termOptional: { color: v_1bfbd0.zinc400 },
});
