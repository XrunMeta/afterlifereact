import { v_889fad } from "../../stores/dialogStore";
import v_a3453e, { v_5ab095, v_e662ae } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_4623af,
  v_472849,
  v_03e392,
  v_79c4f2,
} from "rcmrninabrnb";
import v_1a40c4 from "../../components/ui/Button";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_384e19 } from "../../navigation/types";

import v_556baf from "../../components/ui/SafeView";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_e775af from "../../components/ui/TextField";
import v_d56c0a from "../../components/ui/SelectField";
import v_258c1c from "../../components/common/PageHeader";
import v_57037e from "../../components/common/CountryRegionPicker";
import v_c0caa9, { type v_3ac6ea } from "../../components/common/TermsModal";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";
import { v_97ea8d, v_35200c, v_84a859 } from "../../api/auth";
import { v_7f847d, v_421733, v_2d09bf } from "../../api/consent";
import { v_d2929b } from "./faceBiometricSignupFlag";
import { v_704bef } from "../../lib/pushNotifications";
import { v_ea1c99 } from "../../lib/deviceId";
import type { v_ee3714 } from "ixigazcpvfldbecwtbvavtbi";
import type { v_da1883 } from "../../types/country";
import { v_789afd } from "../../constants/regions";

type Props = {
  navigation: v_390fcc<v_384e19, "Signup">;
  route: v_ee3714<v_384e19, "Signup">;
};

export default function v_f40fc5({ navigation: v_c65f5d, route: v_c7daf6 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const v_798085 = [
    { value: "male" as const, label: v_8d41d7("auth.signup.male") },
    { value: "female" as const, label: v_8d41d7("auth.signup.female") },
  ];

  const v_ac0935 = v_a3453e.useMemo(
    () => [
      { value: "10", label: v_8d41d7("auth.signup.ageRange10", { defaultValue: "10대" }) },
      { value: "20", label: v_8d41d7("auth.signup.ageRange20", { defaultValue: "20대" }) },
      { value: "30", label: v_8d41d7("auth.signup.ageRange30", { defaultValue: "30대" }) },
      { value: "40", label: v_8d41d7("auth.signup.ageRange40", { defaultValue: "40대" }) },
      { value: "50+", label: v_8d41d7("auth.signup.ageRange50Plus", { defaultValue: "50대 이상" }) },
    ],
    [v_8d41d7],
  );

  const v_56f818 = (v_cb35cb): number => {
    switch (v_cb35cb) {
      case "10":
        return 15;
      case "20":
        return 25;
      case "30":
        return 35;
      case "40":
        return 45;
      case "50+":
        return 55;
      default:
        return 0;
    }
  };
  const v_a8d185 = v_c7daf6.params?.google;

  const [v_1833e7, v_318f24] = v_5ab095(v_a8d185?.name ?? "");
  const [v_e0c7e8, v_fedf34] = v_5ab095(v_a8d185?.email ?? "");
  const [v_adc076, v_52b279] = v_5ab095("");
  const [v_0b3ebe, v_241a35] = v_5ab095("");
  const [v_d74a81, v_fcce73] = v_5ab095("");
  const [v_c3eac4, v_bdc43c] = v_5ab095<"male" | "female" | "">("");

  const [v_f83808, v_64a312] = v_5ab095<string>("");
  const [v_b9bbbd, v_b7066f] = v_5ab095<v_da1883 | null>(null);
  const [v_a6c30b, v_c030e3] = v_5ab095<v_da1883 | null>(null);
  const [v_9d56c4, v_7168a2] = v_5ab095(false);

  const [v_d39271, v_fe0d62] = v_5ab095<v_3ac6ea | null>(null);
  const [v_b5ab16, v_b7733b] = v_5ab095(false);
  const [v_0b85b1, v_3c4c2d] = v_5ab095(false);

  const v_237bb3 = v_e662ae<v_79c4f2>(null);
  const v_776c12 = v_e662ae<v_79c4f2>(null);
  const v_15e85c = v_e662ae<v_79c4f2>(null);
  const v_68cd31 = v_e662ae<v_79c4f2>(null);
  const v_11ccfc = v_e662ae<v_79c4f2>(null);
  const v_8fb688 = (ref: v_a3453e.RefObject<v_79c4f2 | null>) => () => {
    setTimeout(() => v_6d4ed3.current?.focus(), 100);
  };

  const [v_51b53b, v_c8f346] = v_5ab095(false);
  const [v_09b7fa, v_1d4807] = v_5ab095(false);
  const [v_8c98c4, v_e378a4] = v_5ab095(false);

  const [v_7f128f, v_06ec09] = v_5ab095(false);

  const [v_a03498, v_d34fc9] = v_5ab095(false);

  const [v_540cd3, v_a67880] = v_5ab095(false);

  const v_26e7c7 = async () => {

    if (v_540cd3) {
      v_a67880(false);
      return;
    }
    try {
      const v_8a44cb = await import('zryrlwvgokjhz');
      const v_fc6010 = await v_8a44cb.getForegroundPermissionsAsync();
      console.log(`[SignupScreen] location initial perm: granted=${v_fc6010.granted} status=${v_fc6010.status} canAskAgain=${v_fc6010.canAskAgain}`);

      const v_d60769 = v_fc6010.granted
        ? v_fc6010
        : await v_8a44cb.requestForegroundPermissionsAsync();
      console.log(`[SignupScreen] location after request: granted=${v_d60769.granted} status=${v_d60769.status} canAskAgain=${v_d60769.canAskAgain}`);
      if (!v_d60769.granted) {

        console.log(`[SignupScreen] location DENIED — showing alert`);
        v_889fad(
          v_8d41d7("auth.signup.locationPermTitle", { defaultValue: "위치 권한 필요" }),
          v_8d41d7("auth.signup.locationPermDesc", {
            defaultValue: "통화 시 지역 기반 대화를 하려면 위치 권한이 필요합니다.\n기기 설정 → 위치 → AfterLife 에서 허용해 주십시오.",
          }),
        );
        return;
      }
      console.log(`[SignupScreen] location GRANTED — checking box`);
      v_a67880(true);
    } catch (v_49263d) {
      console.warn('[SignupScreen] location permission request failed:', v_49263d);
      v_889fad(
        v_8d41d7("common.error"),
        v_8d41d7("auth.signup.locationPermError", { defaultValue: "위치 권한 요청 중 문제가 발생했습니다." }),
      );
    }
  };

  const v_5c764d = v_51b53b && v_09b7fa;
  const v_33f2ba =
    v_5c764d && v_8c98c4 && v_7f128f && v_a03498 && v_540cd3;
  const [v_cb66b4, v_ee9ec1] = v_5ab095(false);

  const [v_1a29d0, v_704175] = v_5ab095<string | null>(null);
  const [v_ea920b, v_73f064] = v_5ab095<"ios" | "android" | "web" | null>(null);
  const [v_929b58, v_94f796] = v_5ab095<string | null>(null);
  const [v_8d0e18, v_3bb4d3] = v_5ab095(false);

  const v_0217e6 = async () => {
    if (v_33f2ba) {

      v_c8f346(false);
      v_1d4807(false);
      v_e378a4(false);
      v_06ec09(false);
      v_d34fc9(false);
      v_a67880(false);
      v_704175(null);
      v_73f064(null);
      v_94f796(null);
      return;
    }

    v_c8f346(true);
    v_1d4807(true);
    v_06ec09(true);
    v_d34fc9(true);
    v_a67880(true);
    if (!v_8c98c4) {
      await v_349606();
    }
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
        v_889fad(
          v_8d41d7("auth.signup.pushPermTitle"),
          v_8d41d7("auth.signup.pushPermDesc"),
        );
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

  const v_585b02 = async () => {

    if (!v_1833e7.trim()) {
      v_889fad(
        v_8d41d7("common.notice"),
        v_8d41d7("auth.signup.nameRequired", { defaultValue: "이름을 입력해주세요." }),
        [{ text: v_8d41d7("common.confirm", { defaultValue: "확인" }), onPress: v_8fb688(v_237bb3) }],
      );
      return;
    }
    if (!v_e0c7e8.trim()) {
      v_889fad(
        v_8d41d7("common.notice"),
        v_8d41d7("auth.signup.emailRequired", { defaultValue: "이메일을 입력해주세요." }),
        [{ text: v_8d41d7("common.confirm", { defaultValue: "확인" }), onPress: v_8fb688(v_776c12) }],
      );
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v_e0c7e8)) {
      v_889fad(
        v_8d41d7("common.notice"),
        v_8d41d7("auth.signup.emailInvalid"),
        [{ text: v_8d41d7("common.confirm", { defaultValue: "확인" }), onPress: v_8fb688(v_776c12) }],
      );
      return;
    }
    if (!v_adc076) {
      v_889fad(
        v_8d41d7("common.notice"),
        v_8d41d7("auth.signup.passwordRequired", { defaultValue: "비밀번호를 입력해주세요." }),
        [{ text: v_8d41d7("common.confirm", { defaultValue: "확인" }), onPress: v_8fb688(v_15e85c) }],
      );
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{7,}$/.test(v_adc076)) {
      v_889fad(
        v_8d41d7("common.notice"),
        v_8d41d7("auth.signup.passwordTooShort"),
        [{ text: v_8d41d7("common.confirm", { defaultValue: "확인" }), onPress: v_8fb688(v_15e85c) }],
      );
      return;
    }
    if (!v_0b3ebe) {
      v_889fad(
        v_8d41d7("common.notice"),
        v_8d41d7("auth.signup.passwordConfirmRequired", { defaultValue: "비밀번호 확인을 입력해주세요." }),
        [{ text: v_8d41d7("common.confirm", { defaultValue: "확인" }), onPress: v_8fb688(v_68cd31) }],
      );
      return;
    }
    if (v_adc076 !== v_0b3ebe) {
      v_889fad(
        v_8d41d7("common.notice"),
        v_8d41d7("auth.signup.passwordsNotMatch"),
        [{ text: v_8d41d7("common.confirm", { defaultValue: "확인" }), onPress: v_8fb688(v_68cd31) }],
      );
      return;
    }

    if (v_d74a81.trim() && v_d74a81.length < 4) {
      v_889fad(
        v_8d41d7("common.notice"),
        v_8d41d7("auth.signup.phoneTooShort"),
        [{ text: v_8d41d7("common.confirm", { defaultValue: "확인" }), onPress: v_8fb688(v_11ccfc) }],
      );
      return;
    }
    if (!v_5c764d) {
      v_889fad(v_8d41d7("common.notice"), v_8d41d7("auth.signup.termsAccept"));
      return;
    }

    const v_f4fe8e = v_f83808 ? v_56f818(v_f83808) : undefined;

    v_ee9ec1(true);
    try {

      const v_a4d981 = v_b9bbbd ? v_b9bbbd.iso2.toUpperCase() : undefined;
      const v_6c3a47 = v_b9bbbd
        ? (v_b9bbbd.countryCode ??
            (Number(v_b9bbbd.dialCode.replace(/[^\d]/g, "")) || 0))
        : undefined;
      const v_222917 =
        v_a6c30b && v_a6c30b.iso2 !== "global" ? v_a6c30b.dialCode : undefined;

      if (v_a8d185) {

        const v_931bf0 = {
          email: v_e0c7e8,
          password: v_adc076,
          name: v_1833e7,
          phone: v_d74a81.trim() || undefined,
          gender: v_c3eac4 || undefined,
          age: v_f4fe8e,
          country: v_a4d981,
          mobileCode: v_6c3a47,
          region: v_222917,
          marketingConsent: v_8c98c4,
          deviceId: v_929b58 ?? undefined,
          pushToken: v_1a29d0 ?? undefined,
          platform: v_ea920b ?? undefined,
          googleIdToken: v_a8d185.idToken,
        };
        console.log("[AUTH/google.signup] payload:", JSON.stringify(v_931bf0, null, 2));
        const v_8f00b9 = await v_35200c(v_931bf0);

        if (v_7f128f) {
          try {
            await v_7f847d(v_8f00b9.accessToken, "granted", { channel: "signup" });
          } catch (v_49263d) {
            console.warn("[AUTH/signup] saveCallLearningConsent (google) failed:", v_49263d);
          }
        }

        try {
          await v_421733(v_8f00b9.accessToken, v_d2929b(v_a03498), {
            termsVersion: "v1",
            channel: "signup",
          });
        } catch (v_49263d) {
          console.warn("[AUTH/signup] saveFaceBiometricConsent (google) failed:", v_49263d);
        }

        if (v_540cd3) {
          try {
            await v_2d09bf(v_8f00b9.accessToken, "granted", { channel: "signup" });
          } catch (v_49263d) {
            console.warn("[AUTH/signup] saveLocationConsent (google) failed:", v_49263d);
          }
        }

        void activateAuthSession({
          accessToken: v_8f00b9.accessToken,
          refreshToken: v_8f00b9.refreshToken ?? null,
          persist: true,
        });
        return;
      }
      await v_97ea8d(v_e0c7e8);
      v_c65f5d.navigate("EmailVerify", {
        email: v_e0c7e8,
        password: v_adc076,
        name: v_1833e7,
        phone: v_d74a81.trim() || undefined,
        gender: v_c3eac4 || undefined,
        age: v_f4fe8e,
        country: v_a4d981,
        mobileCode: v_6c3a47,
        region: v_222917,
        marketingConsent: v_8c98c4,
        agreeCallLearning: v_7f128f,
        agreeFaceBiometric: v_a03498,
        agreeLocation: v_540cd3,
        pushToken: v_1a29d0 ?? undefined,
        platform: v_ea920b ?? undefined,
        deviceId: v_929b58 ?? undefined,
      });
    } catch (v_49263d) {
      let v_badeaf = v_8d41d7("auth.signup.sendCodeFailed");
      if (v_49263d instanceof v_84a859) {
        if (v_49263d.code === "OTP_COOLDOWN") {
          v_badeaf = v_8d41d7("auth.signup.rateLimit");
        } else {
          v_badeaf = v_49263d.message;

          if (v_49263d.code === "VALIDATION_FAILED" && v_49263d.details) {
            console.warn(
              "[AUTH/signup] VALIDATION_FAILED details:",
              JSON.stringify(v_49263d.details, null, 2),
            );
            const v_f8a42c = v_49263d.details as Array<{ path?: string[]; message?: string }>;
            if (Array.isArray(v_f8a42c) && v_f8a42c.length > 0) {
              const v_a52412 = v_f8a42c
                .map((v_ebec57) => `• ${(v_ebec57.path ?? []).join(".")}: ${v_ebec57.message ?? "?"}`)
                .join("\n");
              v_badeaf = `${v_49263d.message}\n\n${v_a52412}`;
            }
          }
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
        title={v_8d41d7("auth.signup.title")}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />
      <SafeScrollView
        contentContainerStyle={v_d81136.content}
        autoAdjustKeyboardPadding
        showBottomBackground={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={v_d81136.container}>
          {}
          <TextField
            ref={v_237bb3}
            placeholder={v_8d41d7("auth.signup.name")}
            value={v_1833e7}
            onChangeText={v_318f24}
            leftIcon={<Feather name="user" size={20} color={v_1bfbd0.zinc500} />}
          />

          {
}
          <TextField
            ref={v_776c12}
            placeholder={v_8d41d7("auth.signup.email")}
            value={v_e0c7e8}
            onChangeText={v_a8d185 ? undefined : v_fedf34}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!v_a8d185}
            leftIcon={<Feather name="mail" size={20} color={v_1bfbd0.zinc500} />}
            rightIcon={
              v_a8d185 ? (
                <Feather name="lock" size={16} color={v_1bfbd0.zinc400} />
              ) : undefined
            }
            containerStyle={v_a8d185 ? v_d81136.lockedField : undefined}
          />

          {}
          <View>
            <TextField
              ref={v_15e85c}
              placeholder={v_8d41d7("auth.signup.password")}
              value={v_adc076}
              onChangeText={v_52b279}
              secureTextEntry={!v_b5ab16}
              leftIcon={<Feather name="lock" size={20} color={v_1bfbd0.zinc500} />}
              rightIcon={
                <TouchableOpacity onPress={() => v_b7733b(!v_b5ab16)}>
                  <Feather name={v_b5ab16 ? "eye-off" : "eye"} size={20} color={v_1bfbd0.zinc500} />
                </TouchableOpacity>
              }
            />
            <Text style={v_d81136.passwordHint}>{v_8d41d7("auth.signup.passwordHint")}</Text>
          </View>

          {}
          <TextField
            ref={v_68cd31}
            placeholder={v_8d41d7("auth.signup.passwordConfirm")}
            value={v_0b3ebe}
            onChangeText={v_241a35}
            secureTextEntry={!v_0b85b1}
            leftIcon={<Feather name="lock" size={20} color={v_1bfbd0.zinc500} />}
            rightIcon={
              <TouchableOpacity onPress={() => v_3c4c2d(!v_0b85b1)}>
                <Feather name={v_0b85b1 ? "eye-off" : "eye"} size={20} color={v_1bfbd0.zinc500} />
              </TouchableOpacity>
            }
            errorText={
              v_0b3ebe.length > 0 && v_0b3ebe !== v_adc076
                ? v_8d41d7("auth.signup.passwordsNotMatch")
                : undefined
            }
          />

          {}
          <TextField
            ref={v_11ccfc}
            placeholder={v_8d41d7("auth.signup.phone")}
            value={v_d74a81}
            onChangeText={v_fcce73}
            keyboardType="phone-pad"
            leftIcon={<Feather name="phone" size={20} color={v_1bfbd0.zinc500} />}
          />

          {}
          <View style={v_d81136.row}>
            <View style={{ flex: 1 }}>
              <SelectField<"male" | "female">
                options={v_798085}
                value={v_c3eac4}
                onChange={v_bdc43c}
                placeholder={v_8d41d7("auth.signup.gender")}
              />
            </View>
            <View style={{ flex: 1 }}>
              <SelectField<string>
                options={v_ac0935}
                value={v_f83808}
                onChange={v_64a312}
                placeholder={v_8d41d7("auth.signup.ageRangePlaceholder", { defaultValue: "연령대" })}
              />
            </View>
          </View>

          {}
          <TouchableOpacity
            style={v_d81136.pickerField}
            onPress={() => v_7168a2(true)}
            activeOpacity={0.7}
          >
            <Feather name="globe" size={18} color={v_1bfbd0.zinc500} />
            <View style={v_d81136.pickerLabelWrap}>
              {v_b9bbbd ? (
                <Text style={v_d81136.pickerValue} numberOfLines={1}>
                  {v_8d41d7(`countries:${v_b9bbbd.iso2.toUpperCase()}`, {
                    defaultValue: v_b9bbbd.name,
                  })}
                  {v_a6c30b && v_a6c30b.iso2 !== "global" && (
                    <Text style={v_d81136.pickerRegion}>
                      {"  ·  "}
                      {v_8d41d7(`regions:${v_a6c30b.countryCode}_${v_a6c30b.dialCode}`, {
                        defaultValue: v_a6c30b.name,
                      })}
                    </Text>
                  )}
                </Text>
              ) : (
                <Text style={v_d81136.pickerPlaceholder}>
                  {v_8d41d7("auth.signup.countryPlaceholder")}
                </Text>
              )}
            </View>
            <Feather name="chevron-right" size={18} color={v_1bfbd0.zinc400} />
          </TouchableOpacity>

          {}
          <View style={v_d81136.terms}>
            {}
            <TouchableOpacity
              onPress={v_0217e6}
              disabled={v_8d0e18}
              style={[v_d81136.checkRow, v_d81136.checkRowAll]}
            >
              <View style={[v_d81136.checkbox, v_33f2ba && v_d81136.checkboxChecked]}>
                {v_33f2ba && <Feather name="check" size={14} color={v_1bfbd0.white} />}
              </View>
              <Text style={[v_d81136.termText, v_d81136.termTextAll]}>
                {v_8d41d7("auth.signup.termsAgreeAll")}
              </Text>
            </TouchableOpacity>

            <View style={v_d81136.termsDivider} />

            {}
            <View style={v_d81136.checkRow}>
              <TouchableOpacity
                onPress={() => v_c8f346(!v_51b53b)}
                hitSlop={8}
              >
                <View style={[v_d81136.checkbox, v_51b53b && v_d81136.checkboxChecked]}>
                  {v_51b53b && <Feather name="check" size={14} color={v_1bfbd0.white} />}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={v_d81136.termTextWrap}
                onPress={() => v_fe0d62(1)}
                activeOpacity={0.7}
              >
                <Text style={[v_d81136.termText, v_d81136.termLink]}>
                  {v_8d41d7("auth.signup.termsService")}
                </Text>
              </TouchableOpacity>
            </View>

            {}
            <View style={v_d81136.checkRow}>
              <TouchableOpacity
                onPress={() => v_1d4807(!v_09b7fa)}
                hitSlop={8}
              >
                <View style={[v_d81136.checkbox, v_09b7fa && v_d81136.checkboxChecked]}>
                  {v_09b7fa && <Feather name="check" size={14} color={v_1bfbd0.white} />}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={v_d81136.termTextWrap}
                onPress={() => v_fe0d62(3)}
                activeOpacity={0.7}
              >
                <Text style={[v_d81136.termText, v_d81136.termLink]}>
                  {v_8d41d7("auth.signup.termsPrivacy")}
                </Text>
              </TouchableOpacity>
            </View>

            {}
            <TouchableOpacity
              onPress={v_349606}
              disabled={v_8d0e18}
              style={v_d81136.checkRow}
            >
              <View style={[v_d81136.checkbox, v_8c98c4 && v_d81136.checkboxChecked]}>
                {v_8c98c4 && <Feather name="check" size={14} color={v_1bfbd0.white} />}
              </View>
              <Text style={v_d81136.termText}>
                {v_8d41d7("auth.signup.marketingConsent")}
                {v_8d0e18 ? ` (${v_8d41d7("auth.signup.verifying")})` : ""}
              </Text>
            </TouchableOpacity>

            {}
            <View style={v_d81136.checkRow}>
              <TouchableOpacity
                onPress={() => v_06ec09(!v_7f128f)}
                hitSlop={8}
              >
                <View style={[v_d81136.checkbox, v_7f128f && v_d81136.checkboxChecked]}>
                  {v_7f128f && <Feather name="check" size={14} color={v_1bfbd0.white} />}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={v_d81136.termTextWrap}
                onPress={() => v_fe0d62(5)}
                activeOpacity={0.7}
              >
                <Text style={[v_d81136.termText, v_d81136.termLink]}>
                  {v_8d41d7("auth.signup.callLearningConsent")}
                </Text>
              </TouchableOpacity>
            </View>

            {}
            <View style={v_d81136.checkRow}>
              <TouchableOpacity
                onPress={() => v_d34fc9(!v_a03498)}
                hitSlop={8}
              >
                <View style={[v_d81136.checkbox, v_a03498 && v_d81136.checkboxChecked]}>
                  {v_a03498 && <Feather name="check" size={14} color={v_1bfbd0.white} />}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={v_d81136.termTextWrap}
                onPress={() => v_fe0d62(4)}
                activeOpacity={0.7}
              >
                <Text style={[v_d81136.termText, v_d81136.termLink]}>
                  {v_8d41d7("auth.signup.faceBiometricConsent")}
                </Text>
              </TouchableOpacity>
            </View>

            {
}
            <View style={v_d81136.checkRow}>
              <TouchableOpacity
                onPress={() => void v_26e7c7()}
                hitSlop={8}
              >
                <View style={[v_d81136.checkbox, v_540cd3 && v_d81136.checkboxChecked]}>
                  {v_540cd3 && <Feather name="check" size={14} color={v_1bfbd0.white} />}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={v_d81136.termTextWrap}
                onPress={() => v_fe0d62(2)}
                activeOpacity={0.7}
              >
                <Text style={[v_d81136.termText, v_d81136.termLink]}>
                  {v_8d41d7("auth.signup.locationConsent", { defaultValue: "[선택] 위치기반 서비스 이용동의" })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {}
          <Button
            title={v_cb66b4 ? v_8d41d7("auth.signup.signingUp") : v_8d41d7("auth.signup.signupBtn")}
            onPress={v_585b02}
            disabled={v_cb66b4}
          />
        </View>
      </SafeScrollView>

      {

}
      <CountryRegionPicker
        visible={v_9d56c4}
        onClose={() => v_7168a2(false)}
        selectedCountry={v_b9bbbd}
        selectedRegion={v_a6c30b}
        onSelect={(v_3f4e2e, v_cb35cb) => {
          v_b7066f(v_3f4e2e);
          v_c030e3(v_cb35cb);
        }}
      />

      {
}
      <TermsModal
        visible={v_d39271 !== null}
        type={v_d39271}
        onClose={() => v_fe0d62(null)}
        onAgree={() => {
          if (v_d39271 === 1) v_c8f346(true);
          else if (v_d39271 === 3) v_1d4807(true);
          else if (v_d39271 === 4) v_d34fc9(true);
          else if (v_d39271 === 5) v_06ec09(true);
          v_fe0d62(null);
        }}
      />
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
    maxWidth: 780,
    gap: v_9b1a04.medium,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  ageField: {
    width: 100,
  },

  lockedField: {
    opacity: 0.75,
  },
  pickerField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: v_8b0c90.md,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    backgroundColor: v_1bfbd0.white,
  },
  pickerLabelWrap: { flex: 1 },
  pickerPlaceholder: { fontSize: 14, color: v_1bfbd0.zinc400 },
  pickerValue: { fontSize: 14, color: v_1bfbd0.zinc900 },
  pickerRegion: { color: v_1bfbd0.zinc500, fontSize: 13 },
  passwordHint: {
    fontSize: 12,
    color: v_1bfbd0.zinc500,
    marginTop: 6,
    marginLeft: 4,
  },
  terms: {
    gap: 10,
    paddingTop: v_9b1a04.medium,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  checkRowAll: {
    paddingVertical: 4,
  },
  termTextAll: {
    fontSize: 14,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
  },
  termsDivider: {
    height: 1,
    backgroundColor: v_1bfbd0.zinc200,
    marginVertical: 4,
  },
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
  checkboxChecked: {
    backgroundColor: v_1bfbd0.zinc900,
    borderColor: v_1bfbd0.zinc900,
  },
  termText: {
    flex: 1,
    fontSize: 13,
    color: v_1bfbd0.zinc600,
    lineHeight: 20,
  },
  termTextWrap: {
    flex: 1,
  },

  termLink: {
    textDecorationLine: "underline",
  },
  termBold: {
    fontWeight: "600",
    color: v_1bfbd0.zinc900,
  },
  termOptional: {
    color: v_1bfbd0.zinc400,
  },
});
