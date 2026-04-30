import v_a3453e, { v_c4deb2, v_df9f57, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_79c4f2,
  v_03e392,
  v_39a996,
} from "rcmrninabrnb";
import { v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_7ef860, v_976b89, v_84a859, type v_fd8a01 } from "../../api/auth";

type Gender = "male" | "female" | "other";

const v_798085 = [
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
  { value: "other", label: "기타" },
];

export default function v_e2b396() {
  const v_c65f5d = v_ada615();
  const { t: v_8d41d7 } = v_772971();
  const v_b113dd = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser);
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_21f395 = v_1ed7d9((v_fd5f43) => v_fd5f43.patchApiUser);

  const [v_1833e7, v_318f24] = v_5ab095(v_b113dd?.name ?? "");
  const [v_d74a81, v_fcce73] = v_5ab095(v_b113dd?.phone ?? "");
  const [v_c3eac4, v_bdc43c] = v_5ab095<Gender | null>((v_b113dd?.gender as Gender) ?? null);
  const [v_8894cf, v_d74734] = v_5ab095(v_b113dd?.age != null ? String(v_b113dd.age) : "");
  const [v_774c91, v_8cb9cf] = v_5ab095<string[]>([]);
  const [v_35bf26, v_04e389] = v_5ab095(false);

  v_c4deb2(() => {
    if (!v_2ca7e0) return;
    let v_2008a4 = false;
    (async () => {
      try {
        const v_b32680 = await v_7ef860(v_2ca7e0);
        if (v_2008a4) return;
        v_8cb9cf(v_b32680.interests ?? []);
      } catch (v_49263d) {
        console.warn("[EditProfile] getMe failed:", v_49263d);
      }
    })();
    return () => {
      v_2008a4 = true;
    };
  }, [v_2ca7e0]);

  const v_12b1d1 = v_df9f57(() => {
    const v_f4fe8e = v_8894cf.trim() === "" ? null : Number(v_8894cf.trim());
    return (
      v_1833e7.trim() !== (v_b113dd?.name ?? "") ||
      v_d74a81.trim() !== (v_b113dd?.phone ?? "") ||
      v_c3eac4 !== (v_b113dd?.gender ?? null) ||
      v_f4fe8e !== (v_b113dd?.age ?? null)
    );
  }, [v_1833e7, v_d74a81, v_c3eac4, v_8894cf, v_b113dd]);

  const v_1b8283 = async () => {
    if (!v_2ca7e0 || !v_b113dd || v_35bf26 || !v_12b1d1) return;

    const v_affc3e = v_1833e7.trim();
    const v_d1d8b2 = v_d74a81.trim();
    const v_435fbe = v_8894cf.trim();
    const v_f4fe8e = v_435fbe === "" ? null : Number(v_435fbe);

    if (v_affc3e.length === 0) {
      v_03e392.alert("알림", "이름은 비워둘 수 없습니다.");
      return;
    }
    if (v_435fbe !== "" && (!Number.isInteger(v_f4fe8e) || v_f4fe8e! < 0 || v_f4fe8e! > 150)) {
      v_03e392.alert("알림", "나이는 0~150 사이의 숫자여야 합니다.");
      return;
    }

    const patch: v_fd8a01 = {};
    if (v_affc3e !== (v_b113dd.name ?? "")) v_17dc8a.name = v_affc3e;
    if (v_d1d8b2 !== (v_b113dd.phone ?? "")) v_17dc8a.phone = v_d1d8b2 || null;
    if (v_c3eac4 !== (v_b113dd.gender ?? null)) v_17dc8a.gender = v_c3eac4;
    if (v_f4fe8e !== (v_b113dd.age ?? null)) v_17dc8a.age = v_f4fe8e;

    v_04e389(true);
    try {
      const v_8f00b9 = await v_976b89(v_2ca7e0, v_17dc8a);
      console.log("[EditProfile] patchMe ok:", v_8f00b9.updatedFields);
      v_21f395(v_17dc8a);
      v_03e392.alert("저장됨", "프로필이 저장되었습니다.", [
        { text: "확인", onPress: () => v_c65f5d.goBack() },
      ]);
    } catch (v_49263d) {
      console.warn("[EditProfile] patchMe failed:", v_49263d);
      let v_badeaf = "저장 중 오류가 발생했습니다.";
      if (v_49263d instanceof v_84a859) v_badeaf = v_49263d.message;
      v_03e392.alert("저장 실패", v_badeaf);
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
          <View style={v_fd5f43.fieldRow}>
            <Text style={v_fd5f43.fieldLabel}>{v_8d41d7("settings.editProfile.fields.gender")}</Text>
            <View style={v_fd5f43.genderChips}>
              {v_798085.map((v_68b2be) => {
                const v_587413 = v_c3eac4 === v_68b2be.value;
                return (
                  <TouchableOpacity
                    key={v_68b2be.value}
                    style={[v_fd5f43.chip, v_587413 && v_fd5f43.chipSelected]}
                    onPress={() => v_bdc43c(v_587413 ? null : v_68b2be.value)}
                  >
                    <Text style={[v_fd5f43.chipText, v_587413 && v_fd5f43.chipTextSelected]}>
                      {v_68b2be.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
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
          <View style={v_fd5f43.fieldRow}>
            <Text style={v_fd5f43.fieldLabel}>{v_8d41d7("settings.editProfile.fields.interests")}</Text>
            <Text
              style={[v_fd5f43.fieldValue, v_774c91.length > 0 && v_fd5f43.fieldValueFilled]}
              numberOfLines={1}
            >
              {v_774c91.length > 0 ? v_774c91.join(", ") : "—"}
            </Text>
          </View>
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
  fieldLabel: {
    width: 80,
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
  fieldValue: {
    flex: 1,
    fontSize: 14,
    color: v_1bfbd0.zinc400,
    textAlign: "right",
  },
  fieldValueFilled: {
    color: v_1bfbd0.zinc900,
  },
  divider: { height: 1, backgroundColor: v_1bfbd0.zinc100, marginLeft: 20 },
  genderChips: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: v_8b0c90.full ?? 999,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    backgroundColor: v_1bfbd0.white,
  },
  chipSelected: {
    backgroundColor: v_1bfbd0.zinc900,
    borderColor: v_1bfbd0.zinc900,
  },
  chipText: { fontSize: 13, color: v_1bfbd0.zinc600, fontWeight: "500" },
  chipTextSelected: { color: v_1bfbd0.white },
  saveBtn: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.zinc900,
    alignItems: "center",
  },
  saveBtnDisabled: {
    backgroundColor: v_1bfbd0.zinc300,
  },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.white },
});
