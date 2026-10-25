

import v_a3453e, { v_c4deb2, v_df9f57, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_79c4f2,
  v_39a996,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import { v_772971 } from "jmpfvteuuztnp";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import v_d56c0a from "../../components/ui/SelectField";
import v_57037e from "../../components/common/CountryRegionPicker";
import { v_889fad } from "../../stores/dialogStore";
import { v_1bfbd0, v_8b0c90, v_8f28b1, v_d43669, v_c10a43 } from "../../components/constants";
import { v_1ed7d9 } from "../../stores/authStore";
import {
  v_2c296e,
  v_ad7aba,
  v_84a859,
  type v_fa06b2,
  type v_cc333b,
} from "../../api/auth";
import type { v_da1883 } from "../../types/country";
import { v_202d44 } from "../../constants/countryDialCodes";
import {
  v_7b2d46,
  v_a2df5a,
  v_867937,
  v_51973b,
} from "../../constants/xrunCodes";
import type { v_8ad91b } from "../../navigation/types";

const v_b8da6a = (v_81e2ef): number | null => {
  if (v_81e2ef == null || v_81e2ef === "") return null;
  const v_f4e98d = typeof v_81e2ef === "number" ? v_81e2ef : Number(v_81e2ef);
  return Number.isFinite(v_f4e98d) ? v_f4e98d : null;
};

const v_d97109 = (v_206b88): number | null => {
  if (v_206b88 === "male") return v_7b2d46;
  if (v_206b88 === "female") return v_a2df5a;
  return null;
};
const v_048a83 = (v_f4e98d): "male" | "female" | "" => {
  const v_c99bd2 = v_b8da6a(v_f4e98d);
  if (v_c99bd2 === v_7b2d46) return "male";
  if (v_c99bd2 === v_a2df5a) return "female";
  return "";
};

const v_23ffb0 = (p: Pick<v_fa06b2, "ages" | "age">): number | null => {
  const v_6e272b = v_b8da6a(v_e2a85c.ages);
  if (v_6e272b != null) {
    if (v_867937.some((v_b6c474) => v_b6c474.value === v_6e272b)) return v_6e272b;
    if (v_6e272b === 2260) return 2250;
  }
  const v_2694bd = v_b8da6a(v_e2a85c.age);
  if (v_2694bd == null || v_2694bd < 10) return v_6e272b;
  if (v_2694bd >= 50) return 2250;
  const v_74f5e8 = Math.floor(v_2694bd / 10);
  return 2200 + v_74f5e8 * 10;
};

type Gender = "male" | "female";
type NavProp = v_390fcc<v_8ad91b>;

export default function v_e2b396() {
  const v_c65f5d = v_ada615<NavProp>();
  const { t: v_8d41d7 } = v_772971();
  const v_b113dd = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser);
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_21f395 = v_1ed7d9((v_fd5f43) => v_fd5f43.patchApiUser);

  const v_798085 = v_df9f57(
    () => [
      { value: "male" as const, label: v_8d41d7("auth.signup.male") },
      { value: "female" as const, label: v_8d41d7("auth.signup.female") },
    ],
    [v_8d41d7],
  );

  const v_ac0935 = v_df9f57(
    () =>
      v_867937.map((v_68b2be) => ({
        value: v_68b2be.value,

        label: v_8d41d7(`auth.signup.ageRange${v_68b2be.value}`, { defaultValue: v_68b2be.label }),
      })),
    [v_8d41d7],
  );

  const [v_786737, v_9ed797] = v_5ab095<v_fa06b2 | null>(null);
  const [v_6361b5, v_824d29] = v_5ab095<boolean>(!!v_2ca7e0);
  const [v_c538e4, v_8bd811] = v_5ab095<string | null>(null);

  v_c4deb2(() => {
    if (!v_2ca7e0) {
      v_824d29(false);
      return;
    }
    let v_2008a4 = false;
    console.log("[EditProfile] fetch xrun-profile start");
    void (async () => {
      try {
        const v_e2a85c = await v_2c296e(v_2ca7e0);
        console.log("[EditProfile] xrun-profile fetched:", JSON.stringify(v_e2a85c));
        if (!v_2008a4) v_9ed797(v_e2a85c);
      } catch (v_49263d) {
        if (!v_2008a4) {
          const v_badeaf =
            v_49263d instanceof v_84a859
              ? v_49263d.message
              : (v_49263d as Error)?.message ?? "unknown";
          console.warn("[EditProfile] getXrunProfile failed:", v_badeaf);
          v_8bd811(v_badeaf);
        }
      } finally {
        if (!v_2008a4) v_824d29(false);
      }
    })();
    return () => {
      v_2008a4 = true;
    };
  }, [v_2ca7e0]);

  const [v_1833e7, v_318f24] = v_5ab095(v_b113dd?.name ?? "");
  const [v_d74a81, v_fcce73] = v_5ab095(v_b113dd?.phone ?? "");

  const [v_c3eac4, v_bdc43c] = v_5ab095<Gender | "">(
    v_b113dd?.gender === "male" || v_b113dd?.gender === "female"
      ? v_b113dd.gender
      : "",
  );

  const [v_f83808, v_64a312] = v_5ab095<number | null>(null);

  v_c4deb2(() => {
    if (!v_786737) return;
    const v_32d8c3 = v_786737.firstname ?? "";
    const v_f8874f = v_786737.mobile ?? "";
    const v_3b9456 = v_048a83(v_786737.gender);
    const v_17ab8c = v_23ffb0(v_786737);
    console.log("[EditProfile] prefill from xrun:", JSON.stringify({
      name: v_32d8c3,
      phone: v_f8874f,
      gender: v_3b9456,
      ages: v_786737.ages,
      age: v_786737.age,
      resolvedAges: v_17ab8c,
      country: v_786737.country,
      region: v_786737.region,
    }));
    v_318f24(v_32d8c3);
    v_fcce73(v_f8874f);
    v_bdc43c(v_3b9456);
    v_64a312(v_17ab8c);
    if (v_32d8c3 && v_32d8c3 !== v_b113dd?.name) {
      v_21f395({ name: v_32d8c3 });
    }
  }, [v_786737]);

  const [v_b9bbbd, v_b7066f] = v_5ab095<v_da1883 | null>(null);
  const [v_a6c30b, v_c030e3] = v_5ab095<number | null>(null);
  const [v_9d56c4, v_7168a2] = v_5ab095(false);

  v_c4deb2(() => {
    if (!v_786737) return;

    const v_7ebb7c = v_b8da6a(v_786737.country);
    console.log(
      `[EditProfile] country prefill — xrun country=${v_786737.country} (target=${v_7ebb7c})`,
    );
    if (v_7ebb7c != null && v_7ebb7c > 0) {

      const v_4b037d = v_202d44.find((v_3f4e2e) => {
        const v_c99bd2 =
          typeof v_3f4e2e.countryCode === "number"
            ? v_3f4e2e.countryCode
            : Number(v_3f4e2e.dialCode?.replace(/^\+/, "") ?? "");
        return Number.isFinite(v_c99bd2) && v_c99bd2 === v_7ebb7c;
      });
      console.log(
        `[EditProfile] matched country:`,
        v_4b037d ? `${v_4b037d.iso2}/${v_4b037d.name}` : "null",
      );
      v_b7066f(v_4b037d ?? null);
    } else {
      v_b7066f(null);
    }
    const v_fb2a0d = v_b8da6a(v_786737.region);
    console.log(
      `[EditProfile] region prefill — xrun region=${v_786737.region} (target=${v_fb2a0d})`,
    );
    v_c030e3(v_fb2a0d != null && v_fb2a0d > 0 ? v_fb2a0d : null);
  }, [v_786737]);

  const v_afb146 = v_df9f57(
    () => {
      if (!v_b9bbbd) return [];
      const v_f6907d =
        typeof v_b9bbbd.countryCode === "number"
          ? v_b9bbbd.countryCode
          : Number(v_b9bbbd.dialCode?.replace(/^\+/, "") ?? "");
      if (!Number.isFinite(v_f6907d) || v_f6907d <= 0) return [];
      return v_51973b(v_f6907d, v_b9bbbd.iso2).map((v_cb35cb) => ({
        value: v_cb35cb.value,
        label: v_8d41d7(`regions:${v_f6907d}_${v_cb35cb.value}`, { defaultValue: v_cb35cb.label }),
      }));
    },
    [v_b9bbbd, v_8d41d7],
  );

  const [v_35bf26, v_04e389] = v_5ab095(false);

  const v_12b1d1 = v_df9f57(() => {
    if (!v_786737) {
      return v_1833e7.trim() !== "" || v_d74a81.trim() !== "" || v_c3eac4 !== "" || v_f83808 != null || v_b9bbbd != null || v_a6c30b != null;
    }
    const v_c6f320 = v_23ffb0(v_786737);
    const v_6f86ba = v_b8da6a(v_786737.country);
    const v_f6907d =
      v_b9bbbd == null
        ? null
        : typeof v_b9bbbd.countryCode === "number"
          ? v_b9bbbd.countryCode
          : Number(v_b9bbbd.dialCode?.replace(/^\+/, "") ?? "") || null;
    return (
      v_1833e7.trim() !== (v_786737.firstname ?? "") ||
      v_d74a81.trim() !== (v_786737.mobile ?? "") ||
      v_c3eac4 !== v_048a83(v_786737.gender) ||
      v_f83808 !== v_c6f320 ||
      v_f6907d !== v_6f86ba ||
      v_a6c30b !== v_b8da6a(v_786737.region)
    );
  }, [v_1833e7, v_d74a81, v_c3eac4, v_f83808, v_b9bbbd, v_a6c30b, v_786737]);

  const v_1b8283 = async () => {
    if (!v_2ca7e0 || !v_b113dd || v_35bf26 || !v_12b1d1) return;

    const v_affc3e = v_1833e7.trim();
    const v_d1d8b2 = v_d74a81.trim();

    if (v_affc3e.length === 0) {
      v_889fad(
        v_8d41d7("common.notice", { defaultValue: "알림" }),
        v_8d41d7("settings.editProfile.nameRequired", {
          defaultValue: "이름은 비워둘 수 없습니다.",
        }),
      );
      return;
    }
    if (v_f83808 == null) {
      v_889fad(
        v_8d41d7("common.notice", { defaultValue: "알림" }),
        v_8d41d7("auth.signup.ageRangeRequired", {
          defaultValue: "연령대를 선택해주세요.",
        }),
      );
      return;
    }
    if (v_d1d8b2 !== "" && v_d1d8b2.length < 4) {
      v_889fad(
        v_8d41d7("common.notice", { defaultValue: "알림" }),
        v_8d41d7("settings.editProfile.phoneTooShort", {
          defaultValue: "전화번호는 4자 이상 입력하거나 비워두세요.",
        }),
      );
      return;
    }

    const xrunPatch: v_cc333b = {};
    if (v_affc3e !== (v_786737?.firstname ?? "")) v_588fa6.firstname = v_affc3e;
    if (v_d1d8b2 !== (v_786737?.mobile ?? "")) v_588fa6.mobile = v_d1d8b2 || null;
    const v_7ac969 = v_d97109(v_c3eac4);
    if (v_7ac969 !== v_b8da6a(v_786737?.gender)) v_588fa6.gender = v_7ac969;
    if (v_f83808 !== v_23ffb0(v_786737 ?? { ages: null, age: null })) {
      v_588fa6.age = v_f83808;
    }
    if (v_b9bbbd) {

      const v_f6907d =
        typeof v_b9bbbd.countryCode === "number"
          ? v_b9bbbd.countryCode
          : Number(v_b9bbbd.dialCode?.replace(/^\+/, "") ?? "");
      if (Number.isFinite(v_f6907d) && v_f6907d > 0) {
        if (v_f6907d !== v_b8da6a(v_786737?.country)) {
          v_588fa6.country = v_f6907d;
        }
        v_588fa6.mobilecode = String(v_f6907d);
      }
      const v_6f9eff = v_b9bbbd.iso2.toLowerCase();
      if (v_6f9eff !== (v_786737?.countrycode?.toLowerCase() ?? null)) {
        v_588fa6.countrycode = v_6f9eff;
      }
    }
    if (v_a6c30b !== v_b8da6a(v_786737?.region)) {
      v_588fa6.region = v_a6c30b;
    }

    v_04e389(true);
    try {
      console.log("[EditProfile] save start — xrun patch:", JSON.stringify(v_588fa6));
      if (Object.keys(v_588fa6).length === 0) {
        v_04e389(false);
        v_c65f5d.goBack();
        return;
      }
      const v_43c42e = await v_ad7aba(v_2ca7e0, v_588fa6);
      console.log("[EditProfile] patchXrunProfile ok:", JSON.stringify(v_43c42e));
      if (v_43c42e.profile) v_9ed797(v_43c42e.profile);

      if (v_588fa6.firstname) {
        v_21f395({ name: v_588fa6.firstname });
      }
      v_889fad(
        v_8d41d7("settings.editProfile.savedTitle", { defaultValue: "저장됨" }),
        v_8d41d7("settings.editProfile.savedMsg", { defaultValue: "프로필이 저장되었습니다." }),
        [
          {
            text: v_8d41d7("common.ok", { defaultValue: "확인" }),
            onPress: () => v_c65f5d.goBack(),
          },
        ],
      );
    } catch (v_49263d) {
      let v_badeaf = v_8d41d7("settings.editProfile.saveFailedMsg", {
        defaultValue: "저장 중 오류가 발생했습니다.",
      });
      if (v_49263d instanceof v_84a859) v_badeaf = v_49263d.message;
      v_889fad(
        v_8d41d7("settings.editProfile.saveFailedTitle", { defaultValue: "저장 실패" }),
        v_badeaf,
      );
    } finally {
      v_04e389(false);
    }
  };

  if (v_6361b5 || (!v_b113dd && !v_786737)) {
    return (
      <SafeScrollView backgroundColor={v_1bfbd0.white} showBottomBackground={false}>
        <PageHeader
          title={v_8d41d7("settings.editProfile.title")}
          showBackButton
          onBackPress={() => v_c65f5d.goBack()}
        />
        <View style={[v_fd5f43.content, { alignItems: "center", paddingVertical: 60 }]}>
          <ActivityIndicator color={v_1bfbd0.violet600} />
          {v_c538e4 ? (
            <Text style={{ marginTop: 12, color: v_1bfbd0.zinc500, fontSize: 13 }}>
              {v_c538e4}
            </Text>
          ) : null}
        </View>
      </SafeScrollView>
    );
  }

  return (
    <SafeScrollView backgroundColor={v_1bfbd0.white} showBottomBackground={false}>
      <PageHeader
        title={v_8d41d7("settings.editProfile.title")}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />

      <View style={v_fd5f43.content}>
        <View style={v_fd5f43.card}>
          {}
          <View style={v_fd5f43.fieldRow}>
            <Text style={v_fd5f43.fieldLabel}>{v_8d41d7("settings.editProfile.fields.name")}</Text>
            <TextInput
              style={v_fd5f43.fieldInput}
              value={v_1833e7}
              onChangeText={v_318f24}
              placeholder="—"
              placeholderTextColor={v_1bfbd0.zinc400}
              maxLength={30}
            />
          </View>
          <View style={v_fd5f43.divider} />

          {}
          <View style={v_fd5f43.fieldRow}>
            <Text style={v_fd5f43.fieldLabel}>{v_8d41d7("settings.editProfile.fields.phone")}</Text>
            <TextInput
              style={v_fd5f43.fieldInput}
              value={v_d74a81}

              onChangeText={(v_81e2ef) => v_fcce73(v_81e2ef.replace(/[^0-9]/g, "").slice(0, 11))}
              placeholder="01012345678"
              placeholderTextColor={v_1bfbd0.zinc400}
              keyboardType="phone-pad"
              maxLength={11}
            />
          </View>
          <View style={v_fd5f43.divider} />

          {}
          <View style={v_fd5f43.fieldRowStack}>
            <Text style={v_fd5f43.fieldLabelStack}>
              {v_8d41d7("settings.editProfile.fields.gender")}
            </Text>
            <View style={v_fd5f43.selectWrap}>
              <SelectField<"male" | "female">
                options={v_798085}
                value={v_c3eac4}
                onChange={v_bdc43c}
                placeholder={v_8d41d7("auth.signup.gender")}
              />
            </View>
          </View>
          <View style={v_fd5f43.divider} />

          {}
          <View style={v_fd5f43.fieldRowStack}>
            <Text style={v_fd5f43.fieldLabelStack}>{v_8d41d7("settings.editProfile.fields.age")}</Text>
            <View style={v_fd5f43.selectWrap}>
              <SelectField<number>
                options={v_ac0935}
                value={v_f83808 ?? undefined}
                onChange={(v_81e2ef) => v_64a312(v_81e2ef ?? null)}
                placeholder={v_8d41d7("auth.signup.ageRangePlaceholder", { defaultValue: "연령대" })}
              />
            </View>
          </View>
          <View style={v_fd5f43.divider} />

          {}
          <View style={v_fd5f43.fieldRowStack}>
            <Text style={v_fd5f43.fieldLabelStack}>
              {v_8d41d7("settings.editProfile.fields.country", { defaultValue: "국가" })}
            </Text>
            <TouchableOpacity
              style={v_fd5f43.pickerField}
              onPress={() => v_7168a2(true)}
              activeOpacity={0.7}
            >
              <Feather name="globe" size={18} color={v_1bfbd0.zinc500} />
              <View style={{ flex: 1 }}>
                {v_b9bbbd ? (
                  <Text style={v_fd5f43.pickerValue} numberOfLines={1}>
                    {v_8d41d7(`countries:${v_b9bbbd.iso2.toUpperCase()}`, {
                      defaultValue: v_b9bbbd.name,
                    })}
                  </Text>
                ) : (
                  <Text style={v_fd5f43.pickerPlaceholder}>
                    {v_8d41d7("auth.signup.countryPlaceholder", {
                      defaultValue: "국가를 선택해주세요",
                    })}
                  </Text>
                )}
              </View>
              <Feather name="chevron-down" size={18} color={v_1bfbd0.zinc500} />
            </TouchableOpacity>
          </View>
          <View style={v_fd5f43.divider} />

          {
}
          <View style={v_fd5f43.fieldRowStack}>
            <Text style={v_fd5f43.fieldLabelStack}>
              {v_8d41d7("settings.editProfile.fields.region", { defaultValue: "지역" })}
            </Text>
            <View style={v_fd5f43.selectWrap}>
              {v_afb146.length > 0 ? (
                <SelectField<number>
                  options={v_afb146.map((v_b6c474) => ({ value: v_b6c474.value, label: v_b6c474.label }))}
                  value={v_a6c30b ?? undefined}
                  onChange={(v_81e2ef) => v_c030e3(v_81e2ef ?? null)}
                  placeholder={v_8d41d7("auth.signup.regionPlaceholder", { defaultValue: "지역을 선택해주세요" })}
                />
              ) : (
                <View style={v_fd5f43.pickerField}>
                  <Feather name="map-pin" size={18} color={v_1bfbd0.zinc500} />
                  <Text style={[v_fd5f43.pickerPlaceholder, { flex: 1 }]}>
                    {v_b9bbbd
                      ? v_8d41d7("settings.editProfile.regionUnsupported", {
                          defaultValue: "선택한 국가의 지역은 아직 지원하지 않아요",
                        })
                      : v_8d41d7("settings.editProfile.regionAfterCountry", {
                          defaultValue: "먼저 국가를 선택해주세요",
                        })}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={v_fd5f43.divider} />

          {

}
          <TouchableOpacity
            style={v_fd5f43.fieldRow}
            onPress={() => {
              if (!v_b113dd?.email) {
                v_889fad(
                  v_8d41d7("settings.editProfile.noEmailTitle", {
                    defaultValue: "이메일 없음",
                  }),
                  v_8d41d7("settings.editProfile.noEmailMsg", {
                    defaultValue:
                      "계정 이메일이 없어요. 로그아웃 후 [비밀번호를 잊으셨나요?] 에서 진행해주세요.",
                  }),
                );
                return;
              }
              v_c65f5d.navigate("ResetPassword", { email: v_b113dd.email });
            }}
          >
            <Text style={v_fd5f43.fieldLabel}>
              {v_8d41d7("settings.editProfile.fields.password", { defaultValue: "비밀번호" })}
            </Text>
            <Text style={[v_fd5f43.fieldValueLink]}>
              {v_8d41d7("settings.editProfile.fields.passwordReset", { defaultValue: "재설정" })}
            </Text>
            <Feather
              name="chevron-right"
              size={18}
              color={v_1bfbd0.zinc400}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[v_fd5f43.saveBtn, (!v_12b1d1 || v_35bf26) && v_fd5f43.saveBtnDisabled]}
          onPress={v_1b8283}
          disabled={!v_12b1d1 || v_35bf26}
        >
          {v_35bf26 ? (
            <ActivityIndicator color={v_1bfbd0.white} />
          ) : (
            <Text style={v_fd5f43.saveBtnText}>
              {v_8d41d7("common.save", { defaultValue: "저장" })}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {
}
      <CountryRegionPicker
        visible={v_9d56c4}
        selectedCountry={v_b9bbbd}
        selectedRegion={null}
        countryOnly
        onClose={() => v_7168a2(false)}
        onSelect={(c: v_da1883, _r: v_da1883 | null) => {
          v_b7066f(v_3f4e2e);
          v_c030e3(null); 
        }}
      />
    </SafeScrollView>
  );
}

const v_fd5f43 = v_472849.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 780,
    alignSelf: "center",
    width: "100%",
  },
  card: {
    backgroundColor: v_1bfbd0.white,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: v_8b0c90.lg,
    overflow: "hidden",
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    minHeight: 56,
  },
  fieldRowStack: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  fieldLabel: {
    width: 80,
    fontSize: 14,
    fontWeight: "500",
    color: v_1bfbd0.zinc700,
  },
  fieldLabelStack: {
    fontSize: 14,
    fontWeight: "500",
    color: v_1bfbd0.zinc700,
  },
  fieldInput: {
    flex: 1,
    fontSize: 14,
    color: v_1bfbd0.zinc900,
    textAlign: "right",
    padding: 0,
  },
  fieldValueLink: {
    flex: 1,
    fontSize: 14,
    color: v_1bfbd0.violet600,
    textAlign: "right",
    fontWeight: "600",
  },
  divider: { height: 1, backgroundColor: v_1bfbd0.zinc100, marginLeft: 20 },
  selectWrap: {
    width: "100%",
  },
  pickerField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: v_8f28b1.borderRadius,
    paddingHorizontal: v_8f28b1.paddingHorizontal,
    height: v_8f28b1.height,
    backgroundColor: v_1bfbd0.white,
  },
  pickerValue: { fontSize: v_8f28b1.fontSize, lineHeight: v_8f28b1.lineHeight, color: v_1bfbd0.zinc900 },
  pickerRegion: { fontSize: 12, color: v_1bfbd0.zinc500 },
  pickerPlaceholder: { fontSize: v_8f28b1.fontSize, lineHeight: v_8f28b1.lineHeight, color: v_1bfbd0.zinc400 },
  saveBtn: {
    marginTop: 24,
    ...v_d43669.lg,
    backgroundColor: v_1bfbd0.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnDisabled: { backgroundColor: v_1bfbd0.zinc300 },
  saveBtnText: { ...v_c10a43.lg, color: v_1bfbd0.white },
});
