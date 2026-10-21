

import v_a3453e, { v_5ab095, v_e662ae, v_df9f57, v_c4deb2 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_326be8,
  v_4623af,
  v_39a996,
  v_122070,
  v_700696,
  v_aa7413,
  v_9cabcb,
  v_79c4f2,
  v_0e1f26,
  type v_bd64bf,
  type v_da479e,
  type v_e99fe0,
} from "rcmrninabrnb";
import { v_dec439, v_25515d } from "zvyjokvuouwvifyzks";
import { v_5ade23 } from "xbfwaaanosqvazmrqoah";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_ee3714 } from "ixigazcpvfldbecwtbvavtbi";

import { v_889fad } from "../../stores/dialogStore";
import { v_c65c18 } from "../../lib/activateAuthSession";
import v_556baf from "../../components/ui/SafeView";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import v_c0caa9, { type v_3ac6ea } from "../../components/common/TermsModal";
import { v_1bfbd0, v_9b1a04, v_8b0c90, v_8f28b1, v_7fd157, v_d43669, v_c10a43 } from "../../components/constants";
import {
  v_97ea8d,
  v_35200c,
  v_2efafe,
  v_84a859,
} from "../../api/auth";
import {
  v_7f847d,
  v_421733,
  v_2d09bf,
} from "../../api/consent";
import { v_fa872d } from "../../hooks/useSsoReconsentGate";
import { v_d2929b } from "./faceBiometricSignupFlag";
import * as v_8a44cb from "zryrlwvgokjhz";
import { v_6d7a3d, v_704bef } from "../../lib/pushNotifications";
import { v_ea1c99 } from "../../lib/deviceId";
import type { v_384e19 } from "../../navigation/types";
import type { v_da1883 } from "../../types/country";
import {
  v_867937,
  v_51973b,
} from "../../constants/xrunCodes";
import { v_1bd8ad, v_202d44 } from "../../constants";

const SIGNUP_COUNTRIES: v_da1883[] = (() => {
  const v_110a8b = new Set<string>();
  const v_2ac933 = v_202d44.filter((v_3f4e2e) => {
    const v_b24339 = `${v_3f4e2e.iso2}|${v_3f4e2e.dialCode}`;
    if (v_110a8b.has(v_b24339)) return false;
    v_110a8b.add(v_b24339);
    return true;
  });
  const v_f886ba = v_2ac933.find((v_3f4e2e) => v_3f4e2e.iso2.toLowerCase() === "kr");
  const v_83bbcd = v_2ac933.filter((v_3f4e2e) => v_3f4e2e.iso2.toLowerCase() !== "kr");
  return v_f886ba ? [v_f886ba, ...v_83bbcd] : v_2ac933;
})();

type Props = {
  navigation: v_390fcc<v_384e19, "Signup">;
  route: v_ee3714<v_384e19, "Signup">;
};

const v_cafb6f = {
  mutedText: "#8e9bae",
  headingText: "#343A5A",
  cardBg: "#ffffff",
  pageBg: "#f9fafc",
  fieldBorder: "#ededed",
  divider: "#f0f0f0",

  primary: v_1bfbd0.primary,
  danger: "#ff6b6b",
};

const v_843035 = {
  regular: "Roboto-Regular",
  medium: "Roboto-Medium",
  semi: "Roboto-SemiBold",
  bold: "Roboto-Bold",
};

const v_24cba0 = 80;

function v_89c10a({
  label: v_2869c1,
  selected: v_587413,
  onPress: v_719eed,
  style: v_7fa4e4,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: object;
}) {
  return (
    <TouchableOpacity
      onPress={v_719eed}
      activeOpacity={0.7}
      style={[
        v_3da94c.base,
        v_587413 ? v_3da94c.selected : v_3da94c.unselected,
        v_7fa4e4,
      ]}
    >
      <Text
        style={[
          v_3da94c.label,
          v_587413 ? v_3da94c.labelSelected : v_3da94c.labelUnselected,
        ]}
        numberOfLines={1}
      >
        {v_2869c1}
      </Text>
    </TouchableOpacity>
  );
}

const v_3da94c = v_472849.create({

  base: {
    ...v_d43669.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  selected: {
    backgroundColor: v_cafb6f.primary,
    borderColor: v_cafb6f.primary,
  },
  unselected: {
    backgroundColor: v_cafb6f.cardBg,
    borderColor: "#e3e9ed", 
  },
  label: {
    ...v_c10a43.sm,
    fontFamily: v_843035.medium, 
  },

  labelSelected: { color: "#ffffff" },
  labelUnselected: { color: v_cafb6f.headingText },
});

function v_d7c611({
  checked: v_da90dc,
  onToggle: v_0a2cea,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={v_0a2cea}
      hitSlop={8}
      activeOpacity={0.7}
      style={[
        v_4b34c0.box,
        v_da90dc ? v_4b34c0.boxChecked : v_4b34c0.boxUnchecked,
      ]}
    >
      {}
      {v_da90dc ? <View style={v_4b34c0.checkMark} /> : null}
    </TouchableOpacity>
  );
}

const v_4b34c0 = v_472849.create({

  box: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  boxChecked: {
    backgroundColor: v_cafb6f.primary,
    borderColor: v_cafb6f.primary,
  },
  boxUnchecked: {
    backgroundColor: v_cafb6f.cardBg,
    borderColor: "#dedede",
  },
  checkMark: {
    width: 10,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderLeftColor: "#ffffff",
    borderBottomColor: "#ffffff",
    transform: [{ rotate: "-45deg" }],
    marginTop: -2,
  },
});

const v_368e80 = v_a3453e.forwardRef<
  v_79c4f2,
  {
    label: string;
    placeholder?: string;
    value: string;
    onChangeText?: (v: string) => void;
    keyboardType?: any;
    autoCapitalize?: any;
    secureTextEntry?: boolean;
    editable?: boolean;
    maxLength?: number;
    onPress?: () => void;
    leftAccessory?: v_a3453e.ReactNode;
    rightAccessory?: v_a3453e.ReactNode;
    errorText?: string;
    showPressStyle?: boolean;
  }
>(function v_368e80(v_b1927c, v_6d4ed3) {
  const {
    label: v_2869c1,
    placeholder: v_c6baea,
    value: v_3b402b,
    onChangeText: v_271a69,
    keyboardType: v_130cff,
    autoCapitalize: v_7cdc04,
    secureTextEntry: v_458725,
    editable: v_87d063 = true,
    maxLength: v_701c63,
    onPress: v_719eed,
    leftAccessory: v_bea0eb,
    rightAccessory: v_de8f73,
    errorText: v_74dc8b,
  } = v_b1927c;

  const v_db991d = (
    <View style={[v_eff3be.inputWrap, !v_87d063 && v_eff3be.inputWrapDisabled]}>
      {v_bea0eb}
      <TextInput
        ref={v_6d4ed3}
        style={v_eff3be.input}
        value={v_3b402b}
        onChangeText={v_271a69}
        placeholder={v_c6baea}
        placeholderTextColor="#c4c7d1"
        keyboardType={v_130cff}
        autoCapitalize={v_7cdc04}
        secureTextEntry={v_458725}
        editable={v_87d063 && !v_719eed}
        maxLength={v_701c63}
      />
      {v_de8f73}
    </View>
  );

  return (
    <View style={v_eff3be.container}>
      <Text style={v_eff3be.label}>{v_2869c1}</Text>
      {v_719eed ? (
        <TouchableOpacity onPress={v_719eed} activeOpacity={0.7}>
          {v_db991d}
        </TouchableOpacity>
      ) : (
        v_db991d
      )}
      {v_74dc8b ? <Text style={v_eff3be.errorText}>{v_74dc8b}</Text> : null}
    </View>
  );
});

const v_eff3be = v_472849.create({
  container: {
    width: "100%",
  },
  label: {

    fontSize: 15,
    lineHeight: 24,
    color: "#2a2727",
    marginBottom: 8,
    fontFamily: v_843035.medium,
  },
  inputWrap: {

    flexDirection: "row",
    alignItems: "center",
    height: v_8f28b1.height,
    borderWidth: 1,
    borderColor: "#dedede",
    borderRadius: v_8f28b1.borderRadius,
    backgroundColor: "#fefefe",
    paddingHorizontal: v_8f28b1.paddingHorizontal,
    gap: 8,
  },
  inputWrapDisabled: {
    backgroundColor: "#f5f5f5",
    borderColor: "#e0e0e0",
  },
  input: {
    flex: 1,
    fontSize: v_8f28b1.fontSize,
    lineHeight: v_8f28b1.lineHeight,
    color: "#2a2727",
    paddingVertical: 0,
    textAlignVertical: v_8f28b1.textAlignVertical,
    fontFamily: v_843035.medium,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: v_cafb6f.danger,
  },
});

export default function v_f40fc5({ navigation: v_c65f5d, route: v_c7daf6 }: Props) {
  const { t: v_8d41d7 } = v_772971();

  const v_a8d185 = v_c7daf6.params?.google;

  const [v_1833e7, v_318f24] = v_5ab095(v_a8d185?.name ?? "");
  const [v_e0c7e8, v_fedf34] = v_5ab095(v_a8d185?.email ?? "");
  const [v_adc076, v_52b279] = v_5ab095("");
  const [v_0b3ebe, v_241a35] = v_5ab095("");

  type EmailStatus = "idle" | "checking" | "invalid" | "duplicate" | "ok";
  const [v_b37c6e, v_11c6c1] = v_5ab095<EmailStatus>("idle");

  type PasswordStatus = "idle" | "invalid" | "ok";
  const v_2d9119 = /[a-z]/.test(v_adc076);
  const v_a25735 = /[A-Z]/.test(v_adc076);
  const v_9b89a6 = /\d/.test(v_adc076);
  const v_8a4e12 = v_adc076.length >= 7;
  const v_78c4a6 = v_2d9119 && v_a25735 && v_9b89a6 && v_8a4e12;
  const v_eb6846 = !v_adc076
    ? "idle" 
    : v_78c4a6
      ? "ok"
      : "invalid";

  const v_79f04d = v_78c4a6
    ? ""
    : [
        !v_2d9119 ? (v_8d41d7("auth.signup.pwNeedLower", { defaultValue: "영문 소문자" }) as string) : null,
        !v_a25735 ? (v_8d41d7("auth.signup.pwNeedUpper", { defaultValue: "영문 대문자" }) as string) : null,
        !v_9b89a6 ? (v_8d41d7("auth.signup.pwNeedDigit", { defaultValue: "숫자" }) as string) : null,
        !v_8a4e12 ? (v_8d41d7("auth.signup.pwNeedLen", { defaultValue: "7자 이상" }) as string) : null,
      ]
        .filter(Boolean)
        .join(" · ") +
      " " +
      (v_8d41d7("auth.signup.pwNeedSuffix", { defaultValue: "입력해주세요" }) as string);
  type ConfirmStatus = "idle" | "mismatch" | "ok";
  const v_a41c7b = !v_0b3ebe
    ? "idle"
    : v_adc076 === v_0b3ebe
      ? "ok"
      : "mismatch";
  const [v_d74a81, v_fcce73] = v_5ab095("");
  const [v_c3eac4, v_bdc43c] = v_5ab095<"male" | "female" | "">("");
  const [v_f83808, v_64a312] = v_5ab095<number | null>(null);

  const [v_1ddc1c, v_02b737] = v_5ab095(true);
  const v_8781da = v_e662ae(0);
  const v_8ffe3e = v_e662ae(0);
  const v_17db1f = (v_cbddfc = 0) => {
    const v_65a8ff = v_8781da.current;
    const v_708a6a = v_8ffe3e.current;
    if (v_65a8ff <= 0 || v_708a6a <= 0) {
      v_02b737(true);
      return;
    }
    v_02b737(v_cbddfc + v_65a8ff < v_708a6a - 8);
  };

  const [v_b9bbbd, v_b7066f] = v_5ab095<v_da1883>(v_1bd8ad[0]);
  const [v_a6c30b, v_c030e3] = v_5ab095<number | null>(null);
  const [v_b5ab16, v_b7733b] = v_5ab095(false);
  const [v_0b85b1, v_3c4c2d] = v_5ab095(false);

  const [v_51b53b, v_c8f346] = v_5ab095(false);
  const [v_09b7fa, v_1d4807] = v_5ab095(false);
  const [v_540cd3, v_a67880] = v_5ab095(false);
  const [v_7f128f, v_06ec09] = v_5ab095(false); 
  const [v_8c98c4, v_e378a4] = v_5ab095(false);

  const [v_a03498, v_d34fc9] = v_5ab095(false);

  const [v_d39271, v_fe0d62] = v_5ab095<v_3ac6ea | null>(null);
  const [v_b67b40, v_a259be] = v_5ab095(false);
  const [v_3a64df, v_c73419] = v_5ab095(false);
  const [v_bd30a1, v_e03dd9] = v_5ab095("");
  const [v_7962f1, v_6a0bf8] = v_5ab095("");

  const [v_cb66b4, v_ee9ec1] = v_5ab095(false);
  const [v_1a29d0, v_704175] = v_5ab095<string | null>(null);
  const [v_ea920b, v_73f064] = v_5ab095<"ios" | "android" | "web" | null>(null);
  const [v_929b58, v_94f796] = v_5ab095<string | null>(null);
  const [v_8d0e18, v_3bb4d3] = v_5ab095(false);

  const [v_60cad9, v_f1fd7a] = v_5ab095(false);

  const v_237bb3 = v_e662ae<v_79c4f2>(null);
  const v_776c12 = v_e662ae<v_79c4f2>(null);
  const v_15e85c = v_e662ae<v_79c4f2>(null);
  const v_68cd31 = v_e662ae<v_79c4f2>(null);
  const v_11ccfc = v_e662ae<v_79c4f2>(null);
  const v_8fb688 = (ref: v_a3453e.RefObject<v_79c4f2 | null>) => () => {
    setTimeout(() => v_6d4ed3.current?.focus(), 100);
  };

  const v_56f818 = (v_cb35cb): number => {
    switch (v_cb35cb) {
      case 2210: return 15;
      case 2220: return 25;
      case 2230: return 35;
      case 2240: return 45;
      case 2250: return 55;
      default: return 0;
    }
  };

  const v_5c764d =
    v_51b53b && v_09b7fa && v_540cd3 && v_7f128f;
  const v_33f2ba =
    v_5c764d && v_8c98c4 && v_a03498;

  const v_26e7c7 = async () => {
    if (v_540cd3) {
      v_a67880(false);
      return;
    }
    try {

      const v_fc6010 = await v_8a44cb.getForegroundPermissionsAsync();
      if (v_fc6010.granted) {
        v_a67880(true);
        return;
      }
      v_f1fd7a(true);
      const v_d60769 = await v_8a44cb.requestForegroundPermissionsAsync().finally(() =>
        v_f1fd7a(false),
      );
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
      console.warn("[SignupScreen] location permission request failed:", v_49263d);
      v_889fad(
        v_8d41d7("common.error"),
        v_8d41d7("auth.signup.locationPermError", {
          defaultValue: "위치 권한 요청 중 문제가 발생했습니다.",
        }),
      );
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

    try {
      if (await v_6d7a3d()) {
        v_e378a4(true);
        void (async () => {
          try {
            const [v_e43fa5, v_de2b1c] = await Promise.all([v_704bef(), v_ea1c99()]);
            v_704175(v_e43fa5.token ?? null);
            v_73f064(v_e43fa5.platform);
            v_94f796(v_de2b1c);
          } catch (v_49263d) {
            console.warn("[SignupScreen] background push token failed:", v_49263d);
          }
        })();
        return;
      }
    } catch {

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

  const v_0217e6 = async () => {
    if (v_33f2ba) {
      v_c8f346(false);
      v_1d4807(false);
      v_a67880(false);
      v_06ec09(false);
      v_e378a4(false);
      v_d34fc9(false);
      v_704175(null);
      v_73f064(null);
      v_94f796(null);
      return;
    }
    v_c8f346(true);
    v_1d4807(true);
    v_06ec09(true);
    v_d34fc9(true);

    const [v_2de974, v_c4bf69] = await Promise.all([
      v_8a44cb.getForegroundPermissionsAsync().then((v_e2a85c) => v_e2a85c.granted).catch(() => false),
      v_6d7a3d().catch(() => false),
    ]);
    if (!v_540cd3 && v_2de974) v_a67880(true);
    if (!v_8c98c4 && v_c4bf69) void v_349606();
    if (!v_540cd3 && !v_2de974) await v_26e7c7();
    if (!v_8c98c4 && !v_c4bf69) await v_349606();
  };

  const v_daa71c = v_df9f57(() => {
    const v_ab6401 = v_bd30a1.trim().toLowerCase();

    if (!v_ab6401) return v_df5e5f;
    return v_df5e5f.filter((v_3f4e2e) => {
      const v_8cb36b = v_3f4e2e.name.toLowerCase().includes(v_ab6401);
      const v_6fc191 = v_3f4e2e.iso2.toLowerCase() === v_ab6401;
      const v_4ba62b = v_3f4e2e.dialCode.replace(/[^0-9]/g, "").includes(v_ab6401.replace(/^\+/, ""));
      const v_6dce25 = v_8d41d7(`countries:${v_3f4e2e.iso2.toUpperCase()}`, { defaultValue: "" }).toLowerCase();
      return v_8cb36b || v_6fc191 || v_4ba62b || (v_6dce25 && v_6dce25.includes(v_ab6401));
    });
  }, [v_bd30a1, v_8d41d7]);

  const v_afb146 = v_df9f57(() => {
    const v_0ad8c5 =
      typeof v_b9bbbd.countryCode === "number"
        ? v_b9bbbd.countryCode
        : Number(v_b9bbbd.dialCode.replace(/^\+/, "")) || 0;
    return v_51973b(v_0ad8c5, v_b9bbbd.iso2).map((v_cb35cb) => ({
      value: v_cb35cb.value,
      label: v_8d41d7(`regions:${v_0ad8c5}_${v_cb35cb.value}`, { defaultValue: v_cb35cb.label }),
    }));
  }, [v_b9bbbd, v_8d41d7]);

  const v_4e187d = v_df9f57(() => {
    const v_ab6401 = v_7962f1.trim().toLowerCase();
    if (!v_ab6401) return v_afb146;
    return v_afb146.filter((v_cb35cb) =>
      v_cb35cb.label.toLowerCase().includes(v_ab6401) || String(v_cb35cb.value).includes(v_ab6401),
    );
  }, [v_7962f1, v_afb146]);

  const v_56743f = v_df9f57(() => {
    if (v_a6c30b == null) {
      return v_8d41d7("auth.signup.regionPlaceholder", { defaultValue: "지역 선택" });
    }
    const v_68b2be = v_afb146.find((v_cb35cb) => v_cb35cb.value === v_a6c30b);
    return v_68b2be ? v_68b2be.label : "-";
  }, [v_a6c30b, v_afb146, v_8d41d7]);

  const v_de5bf5 = (c: v_da1883) => {
    v_b7066f(v_3f4e2e);
    v_c030e3(null);
    v_a259be(false);
    v_e03dd9("");
  };

  const v_477add = (v_68b2be) => {
    v_c030e3(v_68b2be.value);
    v_c73419(false);
    v_6a0bf8("");
  };

  const v_2be27a = new Set<string>([

    "naver.com",
    "daum.net",
    "hanmail.net",
    "kakao.com",
    "nate.com",

    "gmail.com",
    "hotmail.com",
    "outlook.com",
    "yahoo.com",
    "icloud.com",
    "me.com",
    "aol.com",
    "msn.com",
    "live.com",
    "protonmail.com",

    "yahoo.co.id",
  ]);
  const v_b40551 = (v_33c3a8): boolean => {
    const v_83d291 = v_33c3a8.lastIndexOf("@");
    if (v_83d291 < 0) return false;
    const v_52b478 = v_33c3a8.slice(v_83d291 + 1).trim().toLowerCase();
    return v_2be27a.has(v_52b478);
  };

  v_c4deb2(() => {
    if (v_a8d185) return; 
    const v_2f361a = v_e0c7e8.trim();
    if (!v_2f361a) {
      v_11c6c1("idle");
      return;
    }

    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v_2f361a)) {
      v_11c6c1("invalid");
      return;
    }

    if (!v_b40551(v_2f361a)) {
      v_11c6c1("invalid");
      return;
    }
    v_11c6c1("checking");
    const v_cb36b1 = setTimeout(async () => {
      try {
        const v_de130a = await v_2efafe(v_2f361a);

        if (v_de130a.afterlifeExists || v_de130a.xrunExists) {
          v_11c6c1("duplicate");
        } else {
          v_11c6c1("ok");
        }
      } catch (v_49263d) {

        console.warn("[SignupScreen] email check failed:", (v_49263d as Error).message);
        v_11c6c1("idle");
      }
    }, 500);
    return () => clearTimeout(v_cb36b1);
  }, [v_e0c7e8, v_a8d185]);

  const [v_7e4acc, v_de86c2] = v_5ab095(0);
  v_c4deb2(() => {
    if (!v_b67b40 && !v_3a64df) {
      v_de86c2(0);
      return;
    }
    const v_ef3bab = v_326be8.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const v_ffd7d0 = v_326be8.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const v_fdffe1 = v_0e1f26.addListener(v_ef3bab, (v_9e86fd) => v_de86c2(v_9e86fd.endCoordinates.height));
    const v_2f19d2 = v_0e1f26.addListener(v_ffd7d0, () => v_de86c2(0));
    return () => {
      v_fdffe1.remove();
      v_2f19d2.remove();
    };
  }, [v_b67b40, v_3a64df]);

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

    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v_e0c7e8)) {
      v_889fad(
        v_8d41d7("common.notice"),
        v_8d41d7("auth.signup.emailInvalid", { defaultValue: "이메일 형식이 올바르지 않아요" }),
        [{ text: v_8d41d7("common.confirm", { defaultValue: "확인" }), onPress: v_8fb688(v_776c12) }],
      );
      return;
    }

    if (!v_b40551(v_e0c7e8.trim())) {
      v_889fad(
        v_8d41d7("common.notice"),
        v_8d41d7("auth.signup.emailDomainNotAllowed", { defaultValue: "지원하지 않는 이메일 도메인입니다. gmail.com / naver.com / kakao.com 등 유명 도메인을 사용해주세요." }),
        [{ text: v_8d41d7("common.confirm", { defaultValue: "확인" }), onPress: v_8fb688(v_776c12) }],
      );
      return;
    }

    if (!v_a8d185) {
      if (v_b37c6e === "checking") {
        v_889fad(
          v_8d41d7("common.notice"),
          v_8d41d7("auth.signup.emailChecking", { defaultValue: "이메일 확인 중입니다. 잠시만 기다려 주세요." }),
          [{ text: v_8d41d7("common.confirm", { defaultValue: "확인" }) }],
        );
        return;
      }
      if (v_b37c6e === "duplicate") {
        v_889fad(
          v_8d41d7("common.notice"),
          v_8d41d7("auth.signup.emailDuplicateHint", { defaultValue: "이미 가입된 이메일입니다" }),
          [{ text: v_8d41d7("common.confirm", { defaultValue: "확인" }), onPress: v_8fb688(v_776c12) }],
        );
        return;
      }
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

    const v_f4fe8e = v_f83808 != null ? v_56f818(v_f83808) : undefined;

    v_ee9ec1(true);
    try {
      const v_a4d981 = v_b9bbbd ? v_b9bbbd.iso2.toUpperCase() : undefined;
      const v_6c3a47 = v_b9bbbd
        ? (v_b9bbbd.countryCode ?? (Number(v_b9bbbd.dialCode.replace(/[^\d]/g, "")) || 0))
        : undefined;
      const v_222917 = v_a6c30b != null ? String(v_a6c30b) : undefined;

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
          await v_421733(
            v_8f00b9.accessToken,
            v_d2929b(v_a03498),
            { termsVersion: "v1", channel: "signup" },
          );
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
        void v_fa872d(v_8f00b9.accessToken);
        void v_c65c18({
          accessToken: v_8f00b9.accessToken,
          refreshToken: v_8f00b9.refreshToken ?? null,
          persist: true,
          registrationMethod: "google",
        });
        return;
      }

      try {
        const v_de130a = await v_2efafe(v_e0c7e8);
        if (v_de130a.afterlifeExists || v_de130a.xrunExists) {
          v_ee9ec1(false);
          v_889fad(
            v_8d41d7("auth.signup.xrunFoundTitle", { defaultValue: "XRUN 계정 발견" }),
            v_8d41d7("auth.signup.xrunFoundDesc", {
              defaultValue:
                "등록된 XRUN 계정이 존재합니다.\n\nXRUN 계정 정보로 로그인하면 Afterlife도 함께 이용하실 수 있습니다.",
            }),
            [
              { text: v_8d41d7("common.cancel", { defaultValue: "취소" }), style: "cancel" },
              {
                text: v_8d41d7("auth.login.loginBtn", { defaultValue: "로그인" }),
                onPress: () => v_c65f5d.navigate("Login" as never),
              },
            ],
          );
          return;
        }
      } catch (v_49263d) {
        console.warn("[AUTH/signup] checkEmailXrun failed:", (v_49263d as Error).message);
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
        } else if (v_49263d.code === "VALIDATION_FAILED" && v_49263d.details) {

          console.warn(
            "[AUTH/signup] VALIDATION_FAILED details:",
            JSON.stringify(v_49263d.details, null, 2),
          );
          const v_f8a42c = v_49263d.details as Array<{ path?: string[]; message?: string }>;
          const v_b64199 = Array.isArray(v_f8a42c) && v_f8a42c.some((v_ebec57) =>
            (v_ebec57.path ?? []).some((v_e2a85c) => String(v_e2a85c).toLowerCase() === "email"),
          );
          if (v_b64199) {
            v_badeaf = v_8d41d7("auth.signup.emailInvalid", { defaultValue: "이메일 형식이 올바르지 않아요" }) as string;
          } else {
            v_badeaf = v_8d41d7("auth.signup.validationFailed", { defaultValue: "입력값이 올바르지 않습니다" }) as string;
          }
        } else {
          v_badeaf = v_49263d.message;
        }
      }
      v_889fad(v_8d41d7("common.error"), v_badeaf);
    } finally {
      v_ee9ec1(false);
    }
  };

  const v_8a9788 = v_867937; 

  return (
    <SafeView backgroundColor={v_cafb6f.pageBg}>
      <PageHeader
        title={v_a8d185 ? v_8d41d7("auth.signup.googleTitle", { defaultValue: "Google 회원가입" }) : v_8d41d7("auth.signup.title")}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />

      <SafeScrollView
        contentContainerStyle={v_d81136.scrollContent}
        autoAdjustKeyboardPadding
        showBottomBackground={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={v_d81136.formFieldContainer}>
          {}
          <FormField
            ref={v_237bb3}
            label={v_8d41d7("auth.signup.name", { defaultValue: "이름" })}
            placeholder={v_8d41d7("auth.signup.name", { defaultValue: "이름" })}
            value={v_1833e7}
            onChangeText={v_318f24}
            autoCapitalize="none"
          />

          {}
          <FormField
            ref={v_776c12}
            label={v_8d41d7("auth.signup.email", { defaultValue: "이메일" })}
            placeholder={v_8d41d7("auth.signup.email", { defaultValue: "이메일" })}
            value={v_e0c7e8}
            onChangeText={v_a8d185 ? undefined : v_fedf34}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!v_a8d185}
            rightAccessory={

              v_a8d185
                ? <Feather name="lock" size={16} color={v_1bfbd0.zinc400} />
                : v_b37c6e === "checking"
                  ? <ActivityIndicator size="small" color={v_cafb6f.primary} />
                  : v_b37c6e === "invalid" || v_b37c6e === "duplicate"
                    ? <Feather name="x-circle" size={18} color={v_cafb6f.danger} />
                    : v_b37c6e === "ok"
                      ? <Feather name="check-circle" size={18} color="#1A9450" />
                      : undefined
            }
            errorText={
              v_b37c6e === "invalid"
                ? (/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v_e0c7e8.trim()) && !v_b40551(v_e0c7e8.trim())
                    ? (v_8d41d7("auth.signup.emailDomainNotAllowed", { defaultValue: "지원하지 않는 도메인입니다 (gmail.com / naver.com 등)" }) as string)
                    : (v_8d41d7("auth.signup.emailInvalid", { defaultValue: "이메일 형식이 올바르지 않아요" }) as string))
                : v_b37c6e === "duplicate"
                  ? (v_8d41d7("auth.signup.emailDuplicateHint", { defaultValue: "이미 가입된 이메일입니다" }) as string)
                  : undefined
            }
          />

          {}
          <FormField
            ref={v_15e85c}
            label={v_8d41d7("auth.signup.password", { defaultValue: "비밀번호" })}
            placeholder={v_8d41d7("auth.signup.password", { defaultValue: "비밀번호" })}
            value={v_adc076}
            onChangeText={v_52b279}
            secureTextEntry={!v_b5ab16}
            autoCapitalize="none"
            rightAccessory={

              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {v_eb6846 === "ok" ? (
                  <Feather name="check-circle" size={18} color="#1A9450" />
                ) : v_eb6846 === "invalid" ? (
                  <Feather name="x-circle" size={18} color={v_cafb6f.danger} />
                ) : null}
                <TouchableOpacity
                  onPress={() => v_b7733b((v_81e2ef) => !v_81e2ef)}
                  hitSlop={8}
                  style={v_d81136.eyeButton}
                >
                  <Ionicons
                    name={v_b5ab16 ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#666666"
                  />
                </TouchableOpacity>
              </View>
            }
            errorText={

              v_eb6846 !== "ok" ? v_79f04d : undefined
            }
          />

          {}
          <FormField
            ref={v_68cd31}
            label={v_8d41d7("auth.signup.passwordConfirm", { defaultValue: "비밀번호 확인" })}
            placeholder={v_8d41d7("auth.signup.passwordConfirm", { defaultValue: "비밀번호 확인" })}
            value={v_0b3ebe}
            onChangeText={v_241a35}
            secureTextEntry={!v_0b85b1}
            autoCapitalize="none"
            rightAccessory={

              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {v_a41c7b === "ok" ? (
                  <Feather name="check-circle" size={18} color="#1A9450" />
                ) : v_a41c7b === "mismatch" ? (
                  <Feather name="x-circle" size={18} color={v_cafb6f.danger} />
                ) : null}
                <TouchableOpacity
                  onPress={() => v_3c4c2d((v_81e2ef) => !v_81e2ef)}
                  hitSlop={8}
                  style={v_d81136.eyeButton}
                >
                  <Ionicons
                    name={v_0b85b1 ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#666666"
                  />
                </TouchableOpacity>
              </View>
            }
            errorText={
              v_a41c7b === "mismatch"
                ? (v_8d41d7("auth.signup.passwordsNotMatch", { defaultValue: "비밀번호가 일치하지 않습니다" }) as string)
                : undefined
            }
          />

          {
}
          {}
          <FormField
            ref={v_11ccfc}
            label={
              v_326be8.OS === "android"
                ? (v_8d41d7("auth.signup.phone", { defaultValue: "전화번호" }) as string)
                : `${v_8d41d7("auth.signup.phone", { defaultValue: "전화번호" })} (${v_8d41d7(
                    "auth.signup.optional",
                    { defaultValue: "선택사항" },
                  )})`
            }
            placeholder="01012345678"
            value={v_d74a81}
            onChangeText={(v_81e2ef) => v_fcce73(v_81e2ef.replace(/[^0-9]/g, "").slice(0, 11))}
            keyboardType="phone-pad"
            maxLength={11}
            leftAccessory={
              <TouchableOpacity
                style={v_d81136.phonePrefix}
                onPress={() => v_a259be(true)}
                activeOpacity={0.7}
              >
                <Text style={v_d81136.flagEmoji}>{v_b9bbbd.flagEmoji}</Text>
                <Text style={v_d81136.countryCode}>{v_b9bbbd.dialCode}</Text>
              </TouchableOpacity>
            }
          />

          {}
          {v_afb146.length > 0 ? (
            <FormField
              label={
                v_326be8.OS === "android"
                  ? (v_8d41d7("auth.signup.region", { defaultValue: "지역" }) as string)
                  : `${v_8d41d7("auth.signup.region", { defaultValue: "지역" })} (${v_8d41d7(
                      "auth.signup.optional",
                      { defaultValue: "선택사항" },
                    )})`
              }
              placeholder={v_8d41d7("auth.signup.regionPlaceholder", { defaultValue: "지역 선택" })}
              value={v_a6c30b != null ? v_56743f : ""}
              editable={false}
              onPress={() => v_c73419(true)}
            />
          ) : null}

          {}
          <View style={v_d81136.fieldContainer}>
            <Text style={v_d81136.sectionLabel}>
              {v_8d41d7("auth.signup.gender", { defaultValue: "성별" })}
              {v_326be8.OS !== "android" && ` (${v_8d41d7("auth.signup.optional", { defaultValue: "선택사항" })})`}
            </Text>
            <View style={v_d81136.inlineOptions}>
              <OptionButton
                label={v_8d41d7("auth.signup.genderSelect", { defaultValue: "선택" })}
                selected={v_c3eac4 === ""}
                onPress={() => v_bdc43c("")}
                style={v_d81136.optionPill}
              />
              <OptionButton
                label={v_8d41d7("auth.signup.male", { defaultValue: "남성" })}
                selected={v_c3eac4 === "male"}
                onPress={() => v_bdc43c("male")}
                style={v_d81136.optionPill}
              />
              <OptionButton
                label={v_8d41d7("auth.signup.female", { defaultValue: "여성" })}
                selected={v_c3eac4 === "female"}
                onPress={() => v_bdc43c("female")}
                style={v_d81136.optionPill}
              />
            </View>
          </View>

          {
}
          <View style={v_d81136.fieldContainer}>
            <Text style={v_d81136.sectionLabel}>
              {v_8d41d7("auth.signup.ageRange", { defaultValue: "연령대" })}
              {v_326be8.OS !== "android" && ` (${v_8d41d7("auth.signup.optional", { defaultValue: "선택사항" })})`}
            </Text>
            <View style={v_d81136.ageScrollWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={v_d81136.ageScrollContent}
                onLayout={(e: v_e99fe0) => {
                  v_8781da.current = v_9e86fd.nativeEvent.layout.width;
                  v_17db1f(0);
                }}
                onContentSizeChange={(v_32f7b8) => {
                  v_8ffe3e.current = v_32f7b8;
                  v_17db1f(0);
                }}
                onScroll={(e: v_bd64bf<v_da479e>) => {
                  v_17db1f(v_9e86fd.nativeEvent.contentOffset.x);
                }}
                scrollEventThrottle={16}
              >
                <OptionButton
                  label={v_8d41d7("auth.signup.ageSelect", { defaultValue: "선택" })}
                  selected={v_f83808 == null}
                  onPress={() => v_64a312(null)}
                  style={v_d81136.optionPill}
                />
                {v_8a9788.map((v_68b2be) => (
                  <OptionButton
                    key={v_68b2be.value}
                    label={v_8d41d7(`auth.signup.ageRange${v_68b2be.value}`, { defaultValue: v_68b2be.label })}
                    selected={v_f83808 === v_68b2be.value}
                    onPress={() => v_64a312(v_68b2be.value)}
                    style={v_d81136.optionPill}
                  />
                ))}
              </ScrollView>
              {v_1ddc1c ? (
                <View style={v_d81136.ageScrollHint} pointerEvents="none">
                  <LinearGradient
                    colors={["rgba(249,250,252,0)", v_cafb6f.pageBg]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={v_d81136.ageScrollFade}
                  />
                  <View style={v_d81136.ageScrollChevron}>
                    <Feather name="chevron-right" size={18} color={v_1bfbd0.zinc500} />
                  </View>
                </View>
              ) : null}
            </View>
          </View>

          {}
          <View style={v_d81136.termsSection}>
            {}
            <View style={v_d81136.termsRow}>
              <SquareCheckbox
                checked={v_51b53b}
                onToggle={() => v_c8f346((v_81e2ef) => !v_81e2ef)}
              />
              <Text style={v_d81136.termsText}>
                <Text style={v_d81136.termsHighlight} onPress={() => v_fe0d62(1)}>
                  {v_8d41d7("auth.signup.termsService", { defaultValue: "[필수] SSO 통합 서비스 이용약관" })}
                </Text>{" "}
                {v_8d41d7("auth.signup.termsAgree", { defaultValue: "동의" })}
              </Text>
            </View>

            {}
            <View style={v_d81136.termsRow}>
              <SquareCheckbox
                checked={v_09b7fa}
                onToggle={() => v_1d4807((v_81e2ef) => !v_81e2ef)}
              />
              <Text style={v_d81136.termsText}>
                <Text style={v_d81136.termsHighlight} onPress={() => v_fe0d62(3)}>
                  {v_8d41d7("auth.signup.termsPrivacy", { defaultValue: "[필수] SSO 통합 개인정보 처리방침" })}
                </Text>{" "}
                {v_8d41d7("auth.signup.termsAgree", { defaultValue: "동의" })}
              </Text>
            </View>

            {}
            <View style={v_d81136.termsRow}>
              <SquareCheckbox
                checked={v_540cd3}
                onToggle={() => void v_26e7c7()}
              />
              <Text style={v_d81136.termsText}>
                <Text style={v_d81136.termsHighlight} onPress={() => v_fe0d62(2)}>
                  {v_8d41d7("auth.signup.locationConsent", { defaultValue: "[필수] 위치기반서비스 이용약관" })}
                </Text>{" "}
                {v_8d41d7("auth.signup.termsAgree", { defaultValue: "동의" })}
                {v_60cad9 ? ` (${v_8d41d7("auth.signup.verifying", { defaultValue: "확인 중" })})` : ""}
              </Text>
            </View>

            {}
            <View style={v_d81136.termsRow}>
              <SquareCheckbox
                checked={v_7f128f}
                onToggle={() => v_06ec09((v_81e2ef) => !v_81e2ef)}
              />
              <Text style={v_d81136.termsText}>
                <Text style={v_d81136.termsHighlight} onPress={() => v_fe0d62(5)}>
                  {v_8d41d7("auth.signup.callLearningConsent", { defaultValue: "[필수] AI 데이터 활용 및 생성 동의" })}
                </Text>{" "}
                {v_8d41d7("auth.signup.termsAgree", { defaultValue: "동의" })}
              </Text>
            </View>

            {}
            <View style={v_d81136.termsRow}>
              <SquareCheckbox
                checked={v_8c98c4}
                onToggle={v_349606}
              />
              <Text style={v_d81136.termsText}>
                {}
                <Text style={v_d81136.termsHighlight} onPress={() => v_fe0d62(7)}>
                  {v_8d41d7("auth.signup.marketingConsent", { defaultValue: "[선택] 마케팅 정보 수집 및 활용 동의" })}
                </Text>
                {v_8d0e18 ? ` (${v_8d41d7("auth.signup.verifying", { defaultValue: "확인 중" })})` : ""}
              </Text>
            </View>

            {}
            <View style={v_d81136.termsRow}>
              <SquareCheckbox
                checked={v_a03498}
                onToggle={() => v_d34fc9((v_81e2ef) => !v_81e2ef)}
              />
              <Text style={v_d81136.termsText}>
                <Text style={v_d81136.termsHighlight} onPress={() => v_fe0d62(4)}>
                  {v_8d41d7("auth.signup.faceBiometricConsent", { defaultValue: "[선택] 얼굴 생체정보 처리 동의" })}
                </Text>{" "}
                {v_8d41d7("auth.signup.termsAgree", { defaultValue: "동의" })}
              </Text>
            </View>

            <View style={v_d81136.termsDivider} />

            {}
            <View style={[v_d81136.termsRow, v_d81136.termsRowAll]}>
              <SquareCheckbox checked={v_33f2ba} onToggle={v_0217e6} />
              <Text style={[v_d81136.termsText, v_d81136.termsTextAll]}>
                {v_8d41d7("auth.signup.termsAgreeAll", { defaultValue: "전체 동의" })}
              </Text>
            </View>
          </View>

          {}
          <View style={v_d81136.buttonWrapper}>
            <TouchableOpacity
              style={[v_d81136.primaryButton, v_cb66b4 && v_d81136.primaryButtonDisabled]}
              onPress={v_585b02}
              disabled={v_cb66b4}
              activeOpacity={0.85}
            >
              <Text style={v_d81136.primaryButtonText}>
                {v_cb66b4
                  ? v_8d41d7("auth.signup.signingUp", { defaultValue: "가입 중..." })
                  : v_8d41d7("auth.signup.signupBtn", { defaultValue: "회원가입" })}
              </Text>
            </TouchableOpacity>
            {v_cb66b4 ? (
              <View style={v_d81136.loadingContainer}>
                <ActivityIndicator size="small" color={v_cafb6f.primary} />
              </View>
            ) : null}
          </View>
        </View>
      </SafeScrollView>

      {}
      <Modal
        animationType="slide"
        transparent
        visible={v_b67b40}
        onRequestClose={() => v_a259be(false)}
      >
        <View style={v_d81136.modalOverlay}>
          <TouchableOpacity
            style={v_d81136.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              v_a259be(false);
              v_e03dd9("");
            }}
          />
          <View style={[v_d81136.modalContent, v_7e4acc > 0 && { paddingBottom: v_7e4acc }]}>
            <View style={v_d81136.modalHeader}>
              <Text style={v_d81136.modalTitle}>
                {v_8d41d7("auth.signup.countryPlaceholder", { defaultValue: "국가 선택" })}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  v_a259be(false);
                  v_e03dd9("");
                }}
              >
                <Text style={v_d81136.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={v_d81136.modalSearchBox}>
              <Ionicons name="search" size={18} color="#9ca3af" />
              <TextInput
                style={v_d81136.modalSearchInput}
                value={v_bd30a1}
                onChangeText={v_e03dd9}
                placeholder={v_8d41d7("auth.signup.countrySearch", { defaultValue: "국가 검색" })}
                placeholderTextColor="#c4c7d1"
                autoCorrect={false}
              />
            </View>
            <FlatList
              data={v_daa71c}
              keyExtractor={(v_8c0b26) => `${v_8c0b26.iso2}-${v_8c0b26.dialCode}`}
              renderItem={({ item: v_8c0b26 }) => {
                const v_587413 =
                  v_8c0b26.iso2.toLowerCase() === v_b9bbbd.iso2.toLowerCase() &&
                  v_8c0b26.dialCode === v_b9bbbd.dialCode;
                const v_2869c1 = v_8d41d7(`countries:${v_8c0b26.iso2.toUpperCase()}`, {
                  defaultValue: v_8c0b26.name,
                });
                return (
                  <TouchableOpacity
                    style={[v_d81136.modalListItem, v_587413 && v_d81136.modalListItemSelected]}
                    onPress={() => v_de5bf5(v_8c0b26)}
                    activeOpacity={0.7}
                  >
                    {}
                    <View style={v_d81136.modalListFlagBadge}>
                      <Text style={v_d81136.modalListFlag}>{v_8c0b26.flagEmoji}</Text>
                    </View>
                    <View style={v_d81136.modalListInfo}>
                      <Text style={v_d81136.modalListLabel}>{v_2869c1}</Text>
                      <Text style={v_d81136.modalListIso}>{v_8c0b26.iso2.toUpperCase()}</Text>
                    </View>
                    <Text style={v_d81136.modalListMeta}>{v_8c0b26.dialCode}</Text>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={v_d81136.modalListContent}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={v_d81136.modalEmptyState}>
                  <Text style={v_d81136.modalEmptyText}>
                    {v_8d41d7("auth.signup.noResults", { defaultValue: "검색 결과가 없습니다." })}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {}
      <Modal
        animationType="slide"
        transparent
        visible={v_3a64df}
        onRequestClose={() => v_c73419(false)}
      >
        <View style={v_d81136.modalOverlay}>
          <TouchableOpacity
            style={v_d81136.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              v_c73419(false);
              v_6a0bf8("");
            }}
          />
          <View style={[v_d81136.modalContent, v_7e4acc > 0 && { paddingBottom: v_7e4acc }]}>
            <View style={v_d81136.modalHeader}>
              <Text style={v_d81136.modalTitle}>
                {v_8d41d7("auth.signup.regionPlaceholder", { defaultValue: "지역 선택" })}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  v_c73419(false);
                  v_6a0bf8("");
                }}
              >
                <Text style={v_d81136.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={v_d81136.modalSearchBox}>
              <Ionicons name="search" size={18} color="#9ca3af" />
              <TextInput
                style={v_d81136.modalSearchInput}
                value={v_7962f1}
                onChangeText={v_6a0bf8}
                placeholder={v_8d41d7("auth.signup.regionSearch", { defaultValue: "지역 검색" })}
                placeholderTextColor="#c4c7d1"
                autoCorrect={false}
              />
            </View>
            <FlatList
              data={v_4e187d as Array<{ value: number; label: string }>}
              keyExtractor={(v_8c0b26) => String(v_8c0b26.value)}
              renderItem={({ item: v_8c0b26 }) => {
                const v_587413 = v_a6c30b === v_8c0b26.value;
                return (
                  <TouchableOpacity
                    style={[v_d81136.modalListItem, v_587413 && v_d81136.modalListItemSelected]}
                    onPress={() => v_477add(v_8c0b26)}
                    activeOpacity={0.7}
                  >
                    {}
                    <View style={v_d81136.modalListInfo}>
                      <Text style={v_d81136.modalListLabel}>{v_8c0b26.label}</Text>
                    </View>
                    {v_587413 ? (
                      <Feather name="check" size={18} color={v_cafb6f.primary} />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={v_d81136.modalListContent}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={v_d81136.modalEmptyState}>
                  <Text style={v_d81136.modalEmptyText}>
                    {v_8d41d7("auth.signup.noResults", { defaultValue: "검색 결과가 없습니다." })}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {}
      <TermsModal
        visible={v_d39271 !== null}
        type={v_d39271}
        onClose={() => v_fe0d62(null)}
        onAgree={() => {
          const v_357868 = v_d39271;
          v_fe0d62(null);
          if (v_357868 === 1) v_c8f346(true);
          else if (v_357868 === 2) void v_26e7c7();
          else if (v_357868 === 3) v_1d4807(true);
          else if (v_357868 === 4) v_d34fc9(true);
          else if (v_357868 === 5) v_06ec09(true);
          else if (v_357868 === 7) { if (!v_8c98c4) void v_349606(); }
        }}
      />
    </SafeView>
  );
}

const v_d81136 = v_472849.create({
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: v_9b1a04.large,
    paddingVertical: v_9b1a04.xlarge,
  },
  formFieldContainer: {
    width: "100%",
    maxWidth: 780,

    gap: 20,
  },
  fieldContainer: {
    width: "100%",
  },
  sectionLabel: {

    fontSize: 15,
    color: "#2a2727",
    marginBottom: 10,
    fontFamily: v_843035.medium,
  },
  phonePrefix: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 12,
    paddingVertical: 4,
    borderRightWidth: 1,
    borderRightColor: v_cafb6f.fieldBorder,
    gap: 6,
  },
  flagEmoji: {
    fontSize: 18,
  },
  countryCode: {
    fontSize: 14,
    color: "#2a2727",
    fontWeight: "500",
  },
  inlineOptions: {
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "flex-start",
    gap: 8,
    width: "100%",
  },
  ageScrollWrap: {
    width: "100%",
    position: "relative",
  },
  ageScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,

    paddingRight: 28,
  },
  optionPill: {
    width: v_24cba0,
    paddingHorizontal: 8,
  },
  ageScrollHint: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  ageScrollFade: {
    ...v_472849.absoluteFillObject,
  },
  ageScrollChevron: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 2,
  },
  eyeButton: {
    height: 24,
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  termsSection: {
    width: "100%",
    gap: 10,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    maxWidth: 780,
    alignSelf: "center",
    gap: 12,
  },
  termsRowAll: {
    paddingVertical: 4,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 15, 
    color: v_cafb6f.mutedText,
    alignSelf: "center",
    fontFamily: v_843035.regular,
  },
  termsTextAll: {
    fontSize: 14,
    fontFamily: v_843035.bold,
    color: v_cafb6f.headingText,
  },
  termsHighlight: {

    fontFamily: v_843035.semi,
    color: v_cafb6f.headingText,
  },
  termsDivider: {
    height: 1,
    backgroundColor: v_cafb6f.divider,
    marginVertical: 4,
    width: "100%",
    maxWidth: 780,
    alignSelf: "center",
  },
  buttonWrapper: {
    width: "100%",
    marginTop: 12,
  },
  primaryButton: {

    ...v_d43669.lg,
    backgroundColor: v_1bfbd0.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.5, 
  },
  primaryButtonText: {
    ...v_c10a43.lg,
    color: "#ffffff",
    lineHeight: 24,
    fontFamily: v_843035.medium, 
  },
  loadingContainer: {
    marginTop: 12,
    alignItems: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: v_700696.get("window").height * 0.8,
    minHeight: v_700696.get("window").height * 0.6,
    maxHeight: v_700696.get("window").height * 0.8,
    paddingBottom: v_326be8.OS === "ios" ? 34 : 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: v_cafb6f.divider,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: v_843035.bold,
    color: v_cafb6f.headingText,
  },
  modalCloseButton: {
    fontSize: 24,
    color: v_cafb6f.mutedText,
    lineHeight: 24,
  },
  modalSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: v_cafb6f.pageBg,
    borderRadius: v_8f28b1.borderRadius,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    height: v_8f28b1.height,
  },
  modalSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: v_8f28b1.fontSize,
    lineHeight: v_8f28b1.lineHeight,
    paddingVertical: 0,
    textAlignVertical: v_8f28b1.textAlignVertical,
    color: v_cafb6f.headingText,
    fontFamily: v_843035.regular,
  },
  modalListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  modalListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#fff",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  modalListItemSelected: {
    borderColor: v_cafb6f.primary,
  },

  modalListFlagBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: v_cafb6f.pageBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  modalListFlag: {
    fontSize: 24,
    textAlign: "center",
  },
  modalListInfo: {
    flex: 1,
  },
  modalListLabel: {
    fontSize: 15,
    color: v_cafb6f.headingText,
    fontFamily: v_843035.medium,
  },
  modalListIso: {

    fontSize: 12,
    color: v_cafb6f.mutedText,
    textTransform: "uppercase",
    fontFamily: v_843035.regular,
    marginTop: 2,
  },
  modalListMeta: {

    fontSize: 15,
    color: "#1f2933",
    fontFamily: v_843035.bold,
  },
  modalEmptyState: {
    paddingVertical: 40,
    alignItems: "center",
  },
  modalEmptyText: {
    fontSize: 14,
    color: v_cafb6f.mutedText,
  },
});
