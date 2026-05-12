import v_a3453e, { v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_4623af,
  v_472849,
  v_03e392,
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
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";
import { v_97ea8d, v_35200c, v_7ef860, v_84a859 } from "../../api/auth";
import { v_704bef } from "../../lib/pushNotifications";
import { v_ea1c99 } from "../../lib/deviceId";
import type { v_ee3714 } from "ixigazcpvfldbecwtbvavtbi";
import { v_1ed7d9 } from "../../stores/authStore";
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

  const v_f701fd = v_a3453e.useMemo(() => {
    const v_7d8cc0 = new Date().getFullYear();
    const v_8ce3bd = v_7d8cc0 - 13; 
    const v_b77ebc = v_7d8cc0 - 120;
    const v_d47c2d = [];
    for (let v_64877a = v_8ce3bd; v_64877a >= v_b77ebc; v_64877a--) {
      const v_1f7c90 = String(v_64877a);
      v_d47c2d.push({
        value: v_1f7c90,
        label: v_8d41d7("auth.signup.birthYearLabel", { year: v_1f7c90, defaultValue: `${v_1f7c90}년생` }),
      });
    }
    return v_d47c2d;
  }, [v_8d41d7]);
  const v_a8d185 = v_c7daf6.params?.google;
  const v_31080f = v_1ed7d9((v_fd5f43) => v_fd5f43.setApiAuth);
  const v_232d52 = v_1ed7d9((v_fd5f43) => v_fd5f43.hydrate);

  const [v_1833e7, v_318f24] = v_5ab095(v_a8d185?.name ?? "");
  const [v_e0c7e8, v_fedf34] = v_5ab095(v_a8d185?.email ?? "");
  const [v_adc076, v_52b279] = v_5ab095("");
  const [v_0b3ebe, v_241a35] = v_5ab095("");
  const [v_d74a81, v_fcce73] = v_5ab095("");
  const [v_c3eac4, v_bdc43c] = v_5ab095<"male" | "female" | "">("");

  const [v_a95e84, v_8d7b85] = v_5ab095<string>("");
  const [v_b9bbbd, v_b7066f] = v_5ab095<v_da1883 | null>(null);
  const [v_a6c30b, v_c030e3] = v_5ab095<v_da1883 | null>(null);
  const [v_9d56c4, v_7168a2] = v_5ab095(false);
  const [v_b5ab16, v_b7733b] = v_5ab095(false);
  const [v_0b85b1, v_3c4c2d] = v_5ab095(false);
  const [v_5c764d, v_c5baa3] = v_5ab095(false);
  const [v_8c98c4, v_e378a4] = v_5ab095(false);
  const [v_cb66b4, v_ee9ec1] = v_5ab095(false);

  const [v_1a29d0, v_704175] = v_5ab095<string | null>(null);
  const [v_ea920b, v_73f064] = v_5ab095<"ios" | "android" | "web" | null>(null);
  const [v_929b58, v_94f796] = v_5ab095<string | null>(null);
  const [v_8d0e18, v_3bb4d3] = v_5ab095(false);

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
      v_03e392.alert(v_8d41d7("common.error"), v_8d41d7("auth.signup.pushPermError"));
    } finally {
      v_3bb4d3(false);
    }
  };

  const v_585b02 = async () => {
    if (!v_1833e7 || !v_e0c7e8 || !v_adc076 || !v_d74a81 || !v_c3eac4 || !v_a95e84) {
      v_03e392.alert(v_8d41d7("common.notice"), v_8d41d7("auth.signup.requiredFields"));
      return;
    }
    if (!v_b9bbbd) {
      v_03e392.alert(v_8d41d7("common.notice"), v_8d41d7("auth.signup.countryRequired"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v_e0c7e8)) {
      v_03e392.alert(v_8d41d7("common.notice"), v_8d41d7("auth.signup.emailInvalid"));
      return;
    }
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(v_adc076)) {
      v_03e392.alert(v_8d41d7("common.notice"), v_8d41d7("auth.signup.passwordTooShort"));
      return;
    }
    if (v_adc076 !== v_0b3ebe) {
      v_03e392.alert(v_8d41d7("common.notice"), v_8d41d7("auth.signup.passwordsNotMatch"));
      return;
    }
    if (v_d74a81.length < 4) {
      v_03e392.alert(v_8d41d7("common.notice"), v_8d41d7("auth.signup.phoneTooShort"));
      return;
    }
    if (!v_5c764d) {
      v_03e392.alert(v_8d41d7("common.notice"), v_8d41d7("auth.signup.termsAccept"));
      return;
    }

    const v_dc9d4a = parseInt(v_a95e84, 10);
    const v_7d8cc0 = new Date().getFullYear();
    const v_f4fe8e = v_7d8cc0 - v_dc9d4a;
    if (Number.isNaN(v_f4fe8e) || v_f4fe8e < 13 || v_f4fe8e > 120) {
      v_03e392.alert(v_8d41d7("common.notice"), v_8d41d7("auth.signup.ageInvalid"));
      return;
    }

    v_ee9ec1(true);
    try {

      const v_a4d981 = v_b9bbbd.iso2.toUpperCase();
      const v_6c3a47 = v_b9bbbd.countryCode ?? 0;
      const v_222917 =
        v_a6c30b && v_a6c30b.iso2 !== "global" ? v_a6c30b.dialCode : undefined;

      if (v_a8d185) {

        const v_8f00b9 = await v_35200c({
          email: v_e0c7e8,
          password: v_adc076,
          name: v_1833e7,
          phone: v_d74a81,
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
        });
        const v_9ec4c0 = await v_7ef860(v_8f00b9.accessToken);
        await v_31080f(v_8f00b9.accessToken, v_9ec4c0.user);
        console.log("[AUTH/google.signup] user:", v_9ec4c0.user);
        await v_232d52();
        return;
      }
      await v_97ea8d(v_e0c7e8);
      v_c65f5d.navigate("EmailVerify", {
        email: v_e0c7e8,
        password: v_adc076,
        name: v_1833e7,
        phone: v_d74a81,
        gender: v_c3eac4 || undefined,
        age: v_f4fe8e,
        country: v_a4d981,
        mobileCode: v_6c3a47,
        region: v_222917,
        marketingConsent: v_8c98c4,
        pushToken: v_1a29d0 ?? undefined,
        platform: v_ea920b ?? undefined,
        deviceId: v_929b58 ?? undefined,
      });
    } catch (v_49263d) {
      const v_badeaf =
        v_49263d instanceof v_84a859
          ? v_49263d.code === "OTP_COOLDOWN"
            ? v_8d41d7("auth.signup.rateLimit")
            : v_49263d.message
          : v_8d41d7("auth.signup.sendCodeFailed");
      v_03e392.alert(v_8d41d7("common.error"), v_badeaf);
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
            placeholder={v_8d41d7("auth.signup.name")}
            value={v_1833e7}
            onChangeText={v_318f24}
            leftIcon={<Feather name="user" size={20} color={v_1bfbd0.zinc500} />}
          />

          {}
          <TextField
            placeholder={v_8d41d7("auth.signup.email")}
            value={v_e0c7e8}
            onChangeText={v_a8d185 ? undefined : v_fedf34}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!v_a8d185}
            leftIcon={<Feather name="mail" size={20} color={v_1bfbd0.zinc500} />}
          />

          {}
          <View>
            <TextField
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
                options={v_f701fd}
                value={v_a95e84}
                onChange={v_8d7b85}
                placeholder={v_8d41d7("auth.signup.birthYearPlaceholder")}
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
                  {v_b9bbbd.flagEmoji}{" "}
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
            <TouchableOpacity
              onPress={() => v_c5baa3(!v_5c764d)}
              style={v_d81136.checkRow}
            >
              <View style={[v_d81136.checkbox, v_5c764d && v_d81136.checkboxChecked]}>
                {v_5c764d && <Feather name="check" size={14} color={v_1bfbd0.white} />}
              </View>
              <Text style={v_d81136.termText}>{v_8d41d7("auth.signup.termsRequired")}</Text>
            </TouchableOpacity>
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
          </View>

          {}
          <Button
            title={v_cb66b4 ? v_8d41d7("auth.signup.verifying") : v_8d41d7("auth.signup.signupBtn")}
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
    gap: 12,
    paddingTop: v_9b1a04.medium,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
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
  termBold: {
    fontWeight: "600",
    color: v_1bfbd0.zinc900,
  },
  termOptional: {
    color: v_1bfbd0.zinc400,
  },
});
