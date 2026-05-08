import v_a3453e, { v_5ab095 } from "bapkr";
import { v_3094a2, v_19b633, v_4623af, v_472849, v_03e392, v_cf9c33 } from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
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
  const { t: v_8d41d7 } = v_772971();
  const [v_e0c7e8, v_fedf34] = v_5ab095("");
  const [v_6bee94, v_240fbf] = v_5ab095("");
  const [v_bfa721, v_28a496] = v_5ab095(false);
  const [v_cb66b4, v_ee9ec1] = v_5ab095(false);

  const v_420661 = async () => {
    if (!v_e0c7e8 || !v_6bee94) {
      v_03e392.alert(v_8d41d7("common.notice"), v_8d41d7("auth.signup.requiredFields"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v_e0c7e8)) {
      v_03e392.alert(v_8d41d7("common.notice"), v_8d41d7("auth.signup.emailInvalid"));
      return;
    }
    v_ee9ec1(true);
    try {
      await v_dd506d(v_e0c7e8, v_6bee94);
      v_c65f5d.navigate("XrunOtp", { email: v_e0c7e8, pin: v_6bee94 });
    } catch (v_49263d) {
      let v_badeaf = v_8d41d7("auth.login.loginFailed");
      let v_252435 = false;
      if (v_49263d instanceof v_84a859) {
        if (v_49263d.code === "UNAUTHENTICATED") v_badeaf = v_8d41d7("auth.login.invalidCredentials");
        else if (v_49263d.code === "NOT_FOUND") v_badeaf = v_8d41d7("auth.login.invalidCredentials");
        else if (v_49263d.code === "CONFLICT") {
          v_badeaf = v_8d41d7("auth.signup.alreadyExists");
          v_252435 = true;
        } else v_badeaf = v_49263d.message;
      }
      if (v_252435) {
        v_03e392.alert(v_8d41d7("auth.signup.alreadyExists"), v_badeaf, [
          { text: v_8d41d7("common.ok"), onPress: () => v_c65f5d.goBack() },
        ]);
      } else {
        v_03e392.alert(v_8d41d7("common.error"), v_badeaf);
      }
    } finally {
      v_ee9ec1(false);
    }
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.zinc50}>
      <PageHeader title={v_8d41d7("auth.login.xrunBtn")} showBackButton onBackPress={() => v_c65f5d.goBack()} />
      <SafeScrollView contentContainerStyle={v_d81136.content} autoAdjustKeyboardPadding showBottomBackground={false}>
        <View style={v_d81136.container}>
          <View style={v_d81136.header}>
            <Image source={require("../../../assets/images/symbol.png")} style={v_d81136.symbol} />
            <Text style={v_d81136.title}>{v_8d41d7("auth.xrun.loginTitle")}</Text>
            <Text style={v_d81136.subtitle}>{v_8d41d7("auth.xrun.loginDesc")}</Text>
          </View>

          <TextField
            placeholder={v_8d41d7("auth.xrun.emailPlaceholder")}
            value={v_e0c7e8}
            onChangeText={v_fedf34}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Feather name="mail" size={20} color={v_1bfbd0.zinc500} />}
          />
          <TextField
            placeholder={v_8d41d7("auth.xrun.pinPlaceholder")}
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
            title={v_cb66b4 ? v_8d41d7("auth.signup.verifying") : v_8d41d7("auth.xrun.next")}
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
