import v_a3453e, { v_5ab095 } from "bapkr";
import { v_3094a2, v_19b633, v_4623af, v_472849, v_03e392, v_cf9c33 } from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import type { v_432191 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_384e19 } from "../../navigation/types";

import v_556baf from "../../components/ui/SafeView";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_e775af from "../../components/ui/TextField";
import v_1a40c4 from "../../components/ui/Button";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_9b1a04 } from "../../components/constants";
import { v_dd506d, v_84a859 } from "../../api/auth";

type Props = v_432191<v_384e19, "XrunLogin">;

export default function v_61d670({ navigation: v_c65f5d }: Props) {
  const [v_e0c7e8, v_fedf34] = v_5ab095("");
  const [v_6bee94, v_240fbf] = v_5ab095("");
  const [v_bfa721, v_28a496] = v_5ab095(false);
  const [v_cb66b4, v_ee9ec1] = v_5ab095(false);

  const v_420661 = async () => {
    if (!v_e0c7e8 || !v_6bee94) {
      v_03e392.alert("알림", "xrun 이메일과 비밀번호를 입력해주세요.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v_e0c7e8)) {
      v_03e392.alert("알림", "이메일 형식이 올바르지 않습니다.");
      return;
    }
    v_ee9ec1(true);
    try {
      await v_dd506d(v_e0c7e8, v_6bee94);
      v_c65f5d.navigate("XrunOtp", { email: v_e0c7e8, pin: v_6bee94 });
    } catch (v_49263d) {
      let v_badeaf = "xrun 검증에 실패했습니다.";
      let v_252435 = false;
      if (v_49263d instanceof v_84a859) {
        if (v_49263d.code === "UNAUTHENTICATED") v_badeaf = "xrun 이메일 또는 비밀번호가 올바르지 않습니다.";
        else if (v_49263d.code === "NOT_FOUND") v_badeaf = "xrun 계정을 찾을 수 없습니다.";
        else if (v_49263d.code === "CONFLICT") {
          v_badeaf = "이미 afterlife에 가입된 이메일입니다.\n로그인 화면에서 일반 로그인을 사용해주세요.";
          v_252435 = true;
        } else v_badeaf = v_49263d.message;
      }
      if (v_252435) {
        v_03e392.alert("이미 가입된 이메일", v_badeaf, [
          { text: "확인", onPress: () => v_c65f5d.goBack() },
        ]);
      } else {
        v_03e392.alert("오류", v_badeaf);
      }
    } finally {
      v_ee9ec1(false);
    }
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.zinc50}>
      <PageHeader title="Xrun으로 계속하기" showBackButton onBackPress={() => v_c65f5d.goBack()} />
      <SafeScrollView contentContainerStyle={v_d81136.content} autoAdjustKeyboardPadding showBottomBackground={false}>
        <View style={v_d81136.container}>
          <View style={v_d81136.header}>
            <Image source={require("../../../assets/images/symbol.png")} style={v_d81136.symbol} />
            <Text style={v_d81136.title}>Xrun 계정으로 계속</Text>
            <Text style={v_d81136.subtitle}>
              Xrun에서 사용하시는 이메일과 비밀번호를{"\n"}입력해주세요. 인증 후 AfterLife에 연결됩니다.
            </Text>
          </View>

          <TextField
            placeholder="Xrun 이메일"
            value={v_e0c7e8}
            onChangeText={v_fedf34}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Feather name="mail" size={20} color={v_1bfbd0.zinc500} />}
          />
          <TextField
            placeholder="Xrun 비밀번호"
            value={v_6bee94}
            onChangeText={v_240fbf}
            secureTextEntry={!v_bfa721}
            leftIcon={<Feather name="lock" size={20} color={v_1bfbd0.zinc500} />}
            rightIcon={
              <TouchableOpacity onPress={() => v_28a496(!v_bfa721)}>
                <Feather name={v_bfa721 ? "eye-off" : "eye"} size={20} color={v_1bfbd0.zinc500} />
              </TouchableOpacity>
            }
          />

          <Button
            title={v_cb66b4 ? "확인 중..." : "다음 (OTP 전송)"}
            onPress={v_420661}
            disabled={v_cb66b4}
            style={{ marginTop: v_9b1a04.medium }}
          />
        </View>
      </SafeScrollView>
    </SafeView>
  );
}

const v_d81136 = v_472849.create({
  content: { flexGrow: 1, alignItems: "center", paddingHorizontal: v_9b1a04.xlarge, paddingVertical: v_9b1a04.xxlarge },
  container: { width: "100%", maxWidth: 480, gap: v_9b1a04.medium },
  header: { alignItems: "center", marginBottom: v_9b1a04.large },
  symbol: { width: 80, height: 64, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "700", color: v_1bfbd0.zinc900, marginBottom: 8 },
  subtitle: { fontSize: 14, color: v_1bfbd0.zinc600, textAlign: "center", lineHeight: 22 },
});
