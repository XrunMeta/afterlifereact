

import v_a3453e, { v_df9f57, v_5ab095 } from "bapkr";
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
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import { v_1ed7d9 } from "../../stores/authStore";
import {
  v_976b89,
  v_84a859,
  type v_fd8a01,
} from "../../api/auth";
import type { v_da1883 } from "../../types/country";
import { v_202d44 } from "../../constants/countryDialCodes";
import { v_369014 } from "../../constants/regions";
import type { v_8ad91b } from "../../navigation/types";

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

  const [v_1833e7, v_318f24] = v_5ab095(v_b113dd?.name ?? "");
  const [v_d74a81, v_fcce73] = v_5ab095(v_b113dd?.phone ?? "");

  const [v_c3eac4, v_bdc43c] = v_5ab095<Gender | "">(
    v_b113dd?.gender === "male" || v_b113dd?.gender === "female"
      ? v_b113dd.gender
      : "",
  );
  const [v_8894cf, v_d74734] = v_5ab095(
    v_b113dd?.age != null ? String(v_b113dd.age) : "",
  );

  const v_686096 = v_df9f57<v_da1883 | null>(() => {
    if (!v_b113dd?.country) return null;
    return (
      v_202d44.find(
        (v_3f4e2e) => v_3f4e2e.iso2.toUpperCase() === v_b113dd.country!.toUpperCase(),
      ) ?? null
    );
  }, [v_b113dd]);
  const [v_b9bbbd, v_b7066f] = v_5ab095<v_da1883 | null>(v_686096);

  const v_2a5c62 = v_df9f57<v_da1883 | null>(() => {
    if (!v_b113dd?.country || !v_b113dd.region) return null;
    const v_e94fdf = v_369014(v_b113dd.country.toLowerCase());
    return v_e94fdf.find((v_cb35cb) => v_cb35cb.dialCode === v_b113dd.region) ?? null;
  }, [v_b113dd]);
  const [v_a6c30b, v_c030e3] = v_5ab095<v_da1883 | null>(v_2a5c62);
  const [v_9d56c4, v_7168a2] = v_5ab095(false);

  const [v_35bf26, v_04e389] = v_5ab095(false);

  const v_12b1d1 = v_df9f57(() => {
    const v_f4fe8e = v_8894cf.trim() === "" ? null : Number(v_8894cf.trim());
    return (
      v_1833e7.trim() !== (v_b113dd?.name ?? "") ||
      v_d74a81.trim() !== (v_b113dd?.phone ?? "") ||
      v_c3eac4 !== ((v_b113dd?.gender as Gender) ?? "") ||
      v_f4fe8e !== (v_b113dd?.age ?? null) ||
      (v_b9bbbd?.iso2 ?? null) !== (v_b113dd?.country?.toLowerCase() ?? null) ||
      (v_a6c30b && v_a6c30b.iso2 !== "global" ? v_a6c30b.dialCode : null) !==
        (v_b113dd?.region ?? null)
    );
  }, [v_1833e7, v_d74a81, v_c3eac4, v_8894cf, v_b9bbbd, v_a6c30b, v_b113dd]);

  const v_1b8283 = async () => {
    if (!v_2ca7e0 || !v_b113dd || v_35bf26 || !v_12b1d1) return;

    const v_affc3e = v_1833e7.trim();
    const v_d1d8b2 = v_d74a81.trim();
    const v_435fbe = v_8894cf.trim();
    const v_f4fe8e = v_435fbe === "" ? null : Number(v_435fbe);

    if (v_affc3e.length === 0) {
      v_889fad("알림", "이름은 비워둘 수 없습니다.");
      return;
    }
    if (
      v_435fbe !== "" &&
      (!Number.isInteger(v_f4fe8e) || v_f4fe8e! < 13 || v_f4fe8e! > 120)
    ) {
      v_889fad("알림", "나이는 13~120 사이의 숫자여야 합니다.");
      return;
    }
    if (v_d1d8b2 !== "" && v_d1d8b2.length < 4) {
      v_889fad("알림", "전화번호는 4자 이상 입력하거나 비워두세요.");
      return;
    }

    const patch: v_fd8a01 = {};
    if (v_affc3e !== (v_b113dd.name ?? "")) v_17dc8a.name = v_affc3e;
    if (v_d1d8b2 !== (v_b113dd.phone ?? ""))
      v_17dc8a.phone = v_d1d8b2 || null;
    if (v_c3eac4 !== ((v_b113dd.gender as Gender) ?? ""))
      v_17dc8a.gender = v_c3eac4 || null;
    if (v_f4fe8e !== (v_b113dd.age ?? null)) v_17dc8a.age = v_f4fe8e;
    if (v_b9bbbd) {
      const v_6fc191 = v_b9bbbd.iso2.toUpperCase();
      if (v_6fc191 !== (v_b113dd.country?.toUpperCase() ?? null)) v_17dc8a.country = v_6fc191;
      const v_15594c =
        v_b9bbbd.countryCode ??
        (Number(v_b9bbbd.dialCode.replace(/[^\d]/g, "")) || null);
      if (v_15594c !== (v_b113dd.mobileCode ?? null))
        v_17dc8a.mobileCode = v_15594c;
    }
    if (v_a6c30b && v_a6c30b.iso2 !== "global") {
      if (v_a6c30b.dialCode !== (v_b113dd.region ?? null))
        v_17dc8a.region = v_a6c30b.dialCode;
    }

    v_04e389(true);
    try {
      if (Object.keys(v_17dc8a).length > 0) {
        await v_976b89(v_2ca7e0, v_17dc8a);
        v_21f395(v_17dc8a);
      }
      v_889fad("저장됨", "프로필이 저장되었습니다.", [
        { text: "확인", onPress: () => v_c65f5d.goBack() },
      ]);
    } catch (v_49263d) {
      let v_badeaf = "저장 중 오류가 발생했습니다.";
      if (v_49263d instanceof v_84a859) v_badeaf = v_49263d.message;
      v_889fad("저장 실패", v_badeaf);
    } finally {
      v_04e389(false);
    }
  };

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
              onChangeText={v_fcce73}
              placeholder="—"
              placeholderTextColor={v_1bfbd0.zinc400}
              keyboardType="phone-pad"
              maxLength={20}
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
          <View style={v_fd5f43.fieldRow}>
            <Text style={v_fd5f43.fieldLabel}>{v_8d41d7("settings.editProfile.fields.age")}</Text>
            <TextInput
              style={v_fd5f43.fieldInput}
              value={v_8894cf}
              onChangeText={(v_81e2ef) => v_d74734(v_81e2ef.replace(/[^\d]/g, ""))}
              placeholder="—"
              placeholderTextColor={v_1bfbd0.zinc400}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
          <View style={v_fd5f43.divider} />

          {}
          <View style={v_fd5f43.fieldRowStack}>
            <Text style={v_fd5f43.fieldLabelStack}>국가 / 지역</Text>
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
                    {v_a6c30b && v_a6c30b.iso2 !== "global" && (
                      <Text style={v_fd5f43.pickerRegion}>
                        {"  ·  "}
                        {v_8d41d7(`regions:${v_a6c30b.countryCode}_${v_a6c30b.dialCode}`, {
                          defaultValue: v_a6c30b.name,
                        })}
                      </Text>
                    )}
                  </Text>
                ) : (
                  <Text style={v_fd5f43.pickerPlaceholder}>국가를 선택해주세요</Text>
                )}
              </View>
              <Feather name="chevron-down" size={18} color={v_1bfbd0.zinc500} />
            </TouchableOpacity>
          </View>
          <View style={v_fd5f43.divider} />

          {

}
          <TouchableOpacity
            style={v_fd5f43.fieldRow}
            onPress={() => {
              if (!v_b113dd?.email) {
                v_889fad(
                  "이메일 없음",
                  "계정 이메일이 없어요. 로그아웃 후 [비밀번호를 잊으셨나요?] 에서 진행해주세요.",
                );
                return;
              }
              v_c65f5d.navigate("ResetPassword", { email: v_b113dd.email });
            }}
          >
            <Text style={v_fd5f43.fieldLabel}>비밀번호</Text>
            <Text style={[v_fd5f43.fieldValueLink]}>재설정</Text>
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
            <Text style={v_fd5f43.saveBtnText}>저장</Text>
          )}
        </TouchableOpacity>
      </View>

      <CountryRegionPicker
        visible={v_9d56c4}
        selectedCountry={v_b9bbbd}
        selectedRegion={v_a6c30b}
        onClose={() => v_7168a2(false)}
        onSelect={(c: v_da1883, r: v_da1883 | null) => {
          v_b7066f(v_3f4e2e);
          v_c030e3(v_cb35cb);
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
    borderRadius: v_8b0c90.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: v_1bfbd0.white,
  },
  pickerValue: { fontSize: 14, color: v_1bfbd0.zinc900 },
  pickerRegion: { fontSize: 12, color: v_1bfbd0.zinc500 },
  pickerPlaceholder: { fontSize: 14, color: v_1bfbd0.zinc400 },
  saveBtn: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.violet600,
    alignItems: "center",
  },
  saveBtnDisabled: { backgroundColor: v_1bfbd0.zinc300 },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.white },
});
