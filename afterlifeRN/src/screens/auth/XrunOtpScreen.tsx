import v_a3453e, { v_c4deb2, v_e662ae, v_5ab095 } from "bapkr";
import { v_3094a2, v_19b633, v_4623af, v_472849, v_03e392, v_79c4f2 } from "rcmrninabrnb";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_432191 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_384e19 } from "../../navigation/types";

import v_556baf from "../../components/ui/SafeView";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_1a40c4 from "../../components/ui/Button";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";
import { v_dd506d, v_84a859 } from "../../api/auth";

type Props = v_432191<v_384e19, "XrunOtp">;

const v_d812cb = 60;

export default function v_e24882({ navigation: v_c65f5d, route: v_c7daf6 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const { email: v_e0c7e8, pin: v_6bee94 } = v_c7daf6.params;
  const [v_c99bd2, v_537cbb] = v_5ab095("");
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
      await v_dd506d(v_e0c7e8, v_6bee94); 
      v_ec979d(v_d812cb);
      v_03e392.alert(v_8d41d7("auth.emailVerify.resend"), v_8d41d7("auth.emailVerify.resentToast"));
    } catch (v_49263d) {
      const v_badeaf = v_49263d instanceof v_84a859 ? v_49263d.message : v_8d41d7("common.error");
      v_03e392.alert(v_8d41d7("common.error"), v_badeaf);
    }
  };

  const v_420661 = () => {
    if (v_c99bd2.length !== 6) {
      v_03e392.alert(v_8d41d7("common.notice"), v_8d41d7("auth.emailVerify.codePlaceholder"));
      return;
    }
    v_c65f5d.navigate("XrunOnboarding", { email: v_e0c7e8, pin: v_6bee94, verificationCode: v_c99bd2 });
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.zinc50}>
      <PageHeader title={v_8d41d7("auth.xrun.otpTitle")} showBackButton onBackPress={() => v_c65f5d.goBack()} />
      <SafeScrollView contentContainerStyle={v_d81136.content} autoAdjustKeyboardPadding showBottomBackground={false}>
        <View style={v_d81136.container}>
          <Text style={v_d81136.title}>{v_8d41d7("auth.xrun.otpTitle")}</Text>
          <Text style={v_d81136.subtitle}>
            {v_8d41d7("auth.xrun.otpDesc")}
            {"\n"}<Text style={v_d81136.email}>{v_e0c7e8}</Text>
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
            autoFocus
          />

          <Button title={v_8d41d7("auth.xrun.next")} onPress={v_420661} disabled={v_c99bd2.length !== 6} />

          <View style={v_d81136.resendRow}>
            <TouchableOpacity onPress={v_cf9840} disabled={v_600d5b > 0}>
              <Text style={[v_d81136.resendLink, v_600d5b > 0 && v_d81136.resendLinkDisabled]}>
                {v_600d5b > 0 ? `${v_8d41d7("auth.emailVerify.resend")} (${v_600d5b}s)` : v_8d41d7("auth.emailVerify.resend")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeScrollView>
    </SafeView>
  );
}

const v_d81136 = v_472849.create({
  content: { flexGrow: 1, alignItems: "center", paddingHorizontal: v_9b1a04.xlarge, paddingVertical: v_9b1a04.xxlarge },
  container: { width: "100%", maxWidth: 480, gap: v_9b1a04.large },
  title: { fontSize: 22, fontWeight: "700", color: v_1bfbd0.zinc900, textAlign: "center", marginTop: v_9b1a04.large },
  subtitle: { fontSize: 14, color: v_1bfbd0.zinc600, textAlign: "center", lineHeight: 22 },
  email: { fontWeight: "600", color: v_1bfbd0.zinc900 },
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
  resendRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: v_9b1a04.medium },
  resendText: { fontSize: 14, color: v_1bfbd0.zinc500 },
  resendLink: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
  resendLinkDisabled: { color: v_1bfbd0.zinc400 },
});
