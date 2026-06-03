import { v_889fad } from "../../stores/dialogStore";
import v_a3453e, { v_c4deb2, v_e662ae, v_5ab095 } from "bapkr";
import { v_3094a2, v_19b633, v_4623af, v_472849, v_03e392, v_79c4f2 } from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_432191 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_384e19 } from "../../navigation/types";

import v_556baf from "../../components/ui/SafeView";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_1a40c4 from "../../components/ui/Button";
import v_84e2fc from "../../components/ui/InterestChip";
import v_e775af from "../../components/ui/TextField";
import v_d56c0a from "../../components/ui/SelectField";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";
import { v_bf4124 } from "../../mocks/interestHelpers";
import { v_f3a3a5, v_97ea8d, v_84a859, v_7ef860 } from "../../api/auth";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_704bef } from "../../lib/pushNotifications";
import { v_ea1c99 } from "../../lib/deviceId";

type Props = v_432191<v_384e19, "XrunOnboarding">;

export default function v_033f95({ navigation: v_c65f5d, route: v_c7daf6 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const v_798085 = [
    { value: "male" as const, label: v_8d41d7("auth.signup.male") },
    { value: "female" as const, label: v_8d41d7("auth.signup.female") },
    { value: "other" as const, label: v_8d41d7("auth.signup.other") },
  ];
  const { email: v_e0c7e8 } = v_c7daf6.params;
  const v_6bee94 = "pin" in v_c7daf6.params ? v_c7daf6.params.pin : undefined;
  const v_8e7cda =
    "verificationCode" in v_c7daf6.params ? v_c7daf6.params.verificationCode : undefined;
  const v_a8d185 = "google" in v_c7daf6.params ? v_c7daf6.params.google : undefined;
  const [v_1833e7, v_318f24] = v_5ab095("");
  const [v_d74a81, v_fcce73] = v_5ab095("");
  const [v_c3eac4, v_bdc43c] = v_5ab095<"male" | "female" | "other" | "">("");
  const [v_2694bd, v_6e5c76] = v_5ab095("");
  const [v_976e06, v_770327] = v_5ab095<string[]>([]);
  const [v_5c764d, v_c5baa3] = v_5ab095(false);
  const [v_8c98c4, v_e378a4] = v_5ab095(false);
  const [v_8d0e18, v_3bb4d3] = v_5ab095(false);
  const [v_1a29d0, v_704175] = v_5ab095<string | null>(null);
  const [v_ea920b, v_73f064] = v_5ab095<"ios" | "android" | "web" | null>(null);
  const [v_929b58, v_94f796] = v_5ab095<string | null>(null);
  const [v_cb66b4, v_ee9ec1] = v_5ab095(false);

  const [v_729796, v_fd7d1f] = v_5ab095<1 | 2>(1);
  const [v_aa596d, v_f07cc4] = v_5ab095("");
  const [v_600d5b, v_ec979d] = v_5ab095(0);
  const v_756f7e = v_e662ae<v_79c4f2>(null);

  const v_31080f = v_1ed7d9((v_fd5f43) => v_fd5f43.setApiAuth);
  const v_232d52 = v_1ed7d9((v_fd5f43) => v_fd5f43.hydrate);

  v_c4deb2(() => {
    if (v_729796 !== 2 || v_600d5b <= 0) return;
    const v_8d41d7 = setInterval(() => v_ec979d((v_fd5f43) => (v_fd5f43 > 0 ? v_fd5f43 - 1 : 0)), 1000);
    return () => clearInterval(v_8d41d7);
  }, [v_729796, v_600d5b]);

  const v_d82a00 = (v_e4601c) => {
    v_770327((v_ba2215) =>
      v_ba2215.includes(v_e4601c) ? v_ba2215.filter((v_ebec57) => v_ebec57 !== v_e4601c) : [...v_ba2215, v_e4601c],
    );
  };

  const v_e1874e = (): boolean => {
    const v_affc3e = v_1833e7.trim();
    const v_d1d8b2 = v_d74a81.trim();
    if (!v_affc3e) {
      v_889fad(v_8d41d7("common.notice"), v_8d41d7("auth.signup.requiredFields"));
      return false;
    }
    if (!v_d1d8b2) {
      v_889fad(v_8d41d7("common.notice"), v_8d41d7("auth.signup.phoneTooShort"));
      return false;
    }
    if (v_d1d8b2.length < 4) {
      v_889fad(v_8d41d7("common.notice"), v_8d41d7("auth.signup.phoneTooShort"));
      return false;
    }
    if (!v_c3eac4) {
      v_889fad(v_8d41d7("common.notice"), v_8d41d7("auth.signup.requiredFields"));
      return false;
    }
    if (!v_2694bd) {
      v_889fad(v_8d41d7("common.notice"), v_8d41d7("auth.signup.requiredFields"));
      return false;
    }
    const v_f4fe8e = parseInt(v_2694bd, 10);
    if (Number.isNaN(v_f4fe8e) || v_f4fe8e < 13 || v_f4fe8e > 120) {
      v_889fad(v_8d41d7("common.notice"), v_8d41d7("auth.signup.ageInvalid"));
      return false;
    }
    return true;
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
        v_889fad(v_8d41d7("auth.signup.pushPermTitle"), v_8d41d7("auth.signup.pushPermDesc"));
        return;
      }
      const v_de2b1c = await v_ea1c99();
      v_e378a4(true);
      v_704175(v_e43fa5.token ?? null);
      v_73f064(v_e43fa5.platform);
      v_94f796(v_de2b1c);
    } catch {
      v_889fad(v_8d41d7("common.error"), v_8d41d7("auth.signup.pushPermError"));
    } finally {
      v_3bb4d3(false);
    }
  };

  const v_b54880 = async () => {
    if (!v_5c764d) {
      v_889fad(v_8d41d7("common.notice"), v_8d41d7("auth.signup.termsAccept"));
      return;
    }
    v_ee9ec1(true);
    try {
      await v_97ea8d(v_e0c7e8);
      v_fd7d1f(2);
      v_ec979d(60);
      setTimeout(() => v_756f7e.current?.focus(), 200);
    } catch (v_49263d) {
      const v_badeaf = v_49263d instanceof v_84a859
        ? v_49263d.code === "OTP_COOLDOWN" ? v_8d41d7("auth.signup.rateLimit") : v_49263d.message
        : v_8d41d7("auth.signup.sendCodeFailed");
      v_889fad(v_8d41d7("common.error"), v_badeaf);
    } finally {
      v_ee9ec1(false);
    }
  };

  const v_cf9840 = async () => {
    if (v_600d5b > 0) return;
    try {
      await v_97ea8d(v_e0c7e8);
      v_ec979d(60);
      v_889fad(v_8d41d7("auth.emailVerify.resend"), v_8d41d7("auth.emailVerify.resentToast"));
    } catch (v_49263d) {
      const v_badeaf = v_49263d instanceof v_84a859 ? v_49263d.message : v_8d41d7("common.error");
      v_889fad(v_8d41d7("common.error"), v_badeaf);
    }
  };

  const v_44851c = async () => {
    if (v_a8d185 && v_729796 === 1) {
      if (!v_e1874e()) return;
      await v_b54880();
      return;
    }
    if (!v_5c764d) {
      v_889fad(v_8d41d7("common.notice"), v_8d41d7("auth.signup.termsAccept"));
      return;
    }
    if (!v_a8d185 && !v_e1874e()) return;
    if (v_a8d185 && v_aa596d.length !== 6) {
      v_889fad(v_8d41d7("common.notice"), v_8d41d7("auth.emailVerify.codePlaceholder"));
      return;
    }
    v_ee9ec1(true);
    try {
      const v_8f00b9 = await v_f3a3a5({
        email: v_e0c7e8,
        pin: v_6bee94,
        verificationCode: v_a8d185 ? v_aa596d : v_8e7cda,
        googleIdToken: v_a8d185?.idToken,
        name: v_1833e7.trim(),
        phone: v_d74a81.trim(),
        gender: v_c3eac4 || undefined,
        age: parseInt(v_2694bd, 10),
        interests: v_976e06.length > 0 ? v_976e06 : undefined,
        marketingConsent: v_8c98c4,
        deviceId: v_929b58 ?? undefined,
        pushToken: v_1a29d0 ?? undefined,
        platform: v_ea920b ?? undefined,
      });

      console.log("[AUTH/xrun] success");
      v_c65f5d.replace("SignupComplete", {
        accessToken: v_8f00b9.accessToken,
        persist: true,
        email: v_e0c7e8,
      });
    } catch (v_49263d) {
      let v_badeaf = v_8d41d7("common.error");
      if (v_49263d instanceof v_84a859) {
        if (v_49263d.code === "OTP_EXPIRED") v_badeaf = v_8d41d7("auth.emailVerify.expired");
        else if (v_49263d.code === "OTP_INVALID") v_badeaf = v_8d41d7("auth.emailVerify.wrongCode");
        else if (v_49263d.code === "UNAUTHENTICATED") v_badeaf = v_8d41d7("auth.login.invalidCredentials");
        else v_badeaf = v_49263d.message;
      }
      v_889fad(v_8d41d7("common.error"), v_badeaf);
    } finally {
      v_ee9ec1(false);
    }
  };

  if (v_a8d185 && v_729796 === 2) {
    return (
      <SafeView backgroundColor={v_1bfbd0.zinc50}>
        <PageHeader title={v_8d41d7("auth.emailVerify.title")} showBackButton onBackPress={() => v_fd7d1f(1)} />
        <SafeScrollView contentContainerStyle={v_d81136.content} autoAdjustKeyboardPadding showBottomBackground={false}>
          <View style={v_d81136.container}>
            <Text style={v_d81136.title}>{v_8d41d7("auth.emailVerify.title")}</Text>
            <Text style={v_d81136.subtitle}>
              {v_8d41d7("auth.emailVerify.desc", { email: v_e0c7e8 })}
            </Text>
            <TextInput
              ref={v_756f7e}
              value={v_aa596d}
              onChangeText={(v_8d41d7) => v_f07cc4(v_8d41d7.replace(/\D/g, "").slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="000000"
              placeholderTextColor={v_1bfbd0.zinc300}
              style={v_d81136.codeInput}
              autoFocus
            />
            <Button
              title={v_cb66b4 ? v_8d41d7("auth.signup.signingUp") : v_8d41d7("auth.xrun.submit")}
              onPress={v_44851c}
              disabled={v_cb66b4 || v_aa596d.length !== 6}
            />
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

  return (
    <SafeView backgroundColor={v_1bfbd0.zinc50}>
      <PageHeader title={v_8d41d7("auth.xrun.onboardingTitle")} showBackButton onBackPress={() => v_c65f5d.goBack()} />
      <SafeScrollView contentContainerStyle={v_d81136.content} autoAdjustKeyboardPadding showBottomBackground={false}>
        <View style={v_d81136.container}>
          <Text style={v_d81136.title}>{v_8d41d7("auth.xrun.onboardingTitle")}</Text>
          <Text style={v_d81136.subtitle}>
            {v_a8d185 ? v_8d41d7("auth.xrun.googleOnboardingDesc") : v_8d41d7("auth.xrun.onboardingDesc")}
          </Text>

          {}
          <View style={v_d81136.section}>
            <Text style={v_d81136.sectionLabel}>{v_8d41d7("edit.basicSection")}</Text>
            <TextField
              placeholder={v_8d41d7("auth.signup.name")}
              value={v_1833e7}
              onChangeText={v_318f24}
              autoCapitalize="none"
            />
            <TextField
              placeholder={v_8d41d7("auth.signup.phone")}
              value={v_d74a81}
              onChangeText={v_fcce73}
              keyboardType="phone-pad"
              maxLength={20}
            />
            <View style={v_d81136.row}>
              <View style={{ flex: 1 }}>
                <SelectField<"male" | "female" | "other">
                  options={v_798085}
                  value={v_c3eac4 || null}
                  onChange={(v_81e2ef) => v_bdc43c(v_81e2ef ?? "")}
                  placeholder={v_8d41d7("auth.signup.gender")}
                />
              </View>
              <View style={v_d81136.ageField}>
                <TextField
                  placeholder="나이"
                  value={v_2694bd}
                  onChangeText={(v_81e2ef) => v_6e5c76(v_81e2ef.replace(/\D/g, "").slice(0, 3))}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
            </View>
          </View>

          {}
          <View style={v_d81136.section}>
            <Text style={v_d81136.sectionLabel}>{v_8d41d7("auth.signup.interests")}</Text>
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
              <Text style={v_d81136.termText}>{v_8d41d7("auth.signup.termsRequired")}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={v_349606} disabled={v_8d0e18} style={v_d81136.checkRow}>
              <View style={[v_d81136.checkbox, v_8c98c4 && v_d81136.checkboxChecked]}>
                {v_8c98c4 && <Feather name="check" size={14} color={v_1bfbd0.white} />}
              </View>
              <Text style={v_d81136.termText}>
                {v_8d41d7("auth.signup.marketingConsent")}
                {v_8d0e18 ? ` (${v_8d41d7("auth.signup.verifying")})` : ""}
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            title={
              v_cb66b4
                ? v_8d41d7("auth.xrun.submitting")
                : v_a8d185
                  ? v_8d41d7("auth.xrun.next")
                  : v_8d41d7("auth.xrun.submit")
            }
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
  row: { flexDirection: "row", gap: 12 },
  ageField: { width: 100 },
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
