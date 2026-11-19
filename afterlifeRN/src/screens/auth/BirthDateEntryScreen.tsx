

import v_a3453e, { v_df9f57, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_39a996,
  v_aa7413,
  v_9cabcb,
  v_700696,
  v_326be8,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import { v_889fad } from "../../stores/dialogStore";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_b27ae9, v_84a859 } from "../../api/auth";
import v_556baf from "../../components/ui/SafeView";
import { v_1bfbd0, v_9b1a04, v_8f28b1, v_d43669, v_c10a43 } from "../../components/constants";

const v_cafb6f = {
  mutedText: "#8e9bae",
  headingText: "#343A5A",
  pageBg: "#f9fafc",
  primary: v_1bfbd0.primary,
  danger: "#ff6b6b",
};
const v_843035 = {
  regular: "Roboto-Regular",
  medium: "Roboto-Medium",
  semi: "Roboto-SemiBold",
  bold: "Roboto-Bold",
};

const v_929bb7 = 14;

function v_43142a(v_64877a, v_35f85c): number {
  return new Date(v_64877a, v_35f85c, 0).getDate();
}
function v_b08de6(v_64877a, v_35f85c, v_d5dda0): number {
  const v_227df7 = new Date();
  let v_2694bd = v_227df7.getFullYear() - v_64877a;
  const v_3bafb7 = v_227df7.getMonth() + 1;
  const v_f0b456 = v_227df7.getDate();
  if (v_3bafb7 < v_35f85c || (v_3bafb7 === v_35f85c && v_f0b456 < v_d5dda0)) v_2694bd -= 1;
  return v_2694bd;
}
function v_315245(v_64877a, v_35f85c, v_d5dda0): string {
  return `${v_64877a.toString().padStart(4, "0")}-${v_35f85c.toString().padStart(2, "0")}-${v_d5dda0.toString().padStart(2, "0")}`;
}

export default function v_cb9b4f({ onDone: v_7b5712 }: { onDone: () => void }) {
  const { t: v_8d41d7 } = v_772971();
  const v_d7d5a2 = v_1ed7d9((v_fd5f43) => v_fd5f43.logout);
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);

  const [v_0eaaff, v_1bc832] = v_5ab095<number | null>(null);
  const [v_033a94, v_b48742] = v_5ab095<number | null>(null);
  const [v_087ffc, v_75e821] = v_5ab095<number | null>(null);
  const [v_855c14, v_be8eb2] = v_5ab095<"year" | "month" | "day" | null>(null);
  const [v_cb66b4, v_ee9ec1] = v_5ab095(false);

  const v_7d8cc0 = new Date().getFullYear();
  const v_294ec5 = v_df9f57(() => {
    const v_d0c056 = [];
    for (let v_64877a = v_7d8cc0; v_64877a >= 1910; v_64877a -= 1) v_d0c056.push(v_64877a);
    return v_d0c056;
  }, [v_7d8cc0]);
  const v_b50d00 = v_df9f57(() => Array.from({ length: 12 }, (v_37eab7, v_ebec57) => v_ebec57 + 1), []);
  const v_780719 = v_df9f57(() => {
    const v_d2c6bf = v_0eaaff != null && v_033a94 != null ? v_43142a(v_0eaaff, v_033a94) : 31;
    return Array.from({ length: v_d2c6bf }, (v_37eab7, v_ebec57) => v_ebec57 + 1);
  }, [v_0eaaff, v_033a94]);

  const v_585b02 = async () => {
    if (v_0eaaff == null || v_033a94 == null || v_087ffc == null) {
      v_889fad(
        v_8d41d7("common.notice"),
        v_8d41d7("auth.signup.birthDateRequired", { defaultValue: "생년월일을 입력해 주세요." }),
      );
      return;
    }
    if (v_087ffc > v_43142a(v_0eaaff, v_033a94)) {
      v_889fad(
        v_8d41d7("common.notice"),
        v_8d41d7("auth.signup.birthDateInvalid", { defaultValue: "생년월일이 올바르지 않습니다." }),
      );
      return;
    }
    if (v_b08de6(v_0eaaff, v_033a94, v_087ffc) < v_929bb7) {

      v_889fad(
        v_8d41d7("common.notice"),
        v_8d41d7("auth.signup.underAge", { defaultValue: "만 14세 미만은 가입할 수 없습니다." }),
      );
      return;
    }
    if (!v_2ca7e0) {

      await v_d7d5a2();
      return;
    }
    v_ee9ec1(true);
    try {
      await v_b27ae9(v_2ca7e0, v_315245(v_0eaaff, v_033a94, v_087ffc));
      v_7b5712();
    } catch (v_49263d) {
      if (v_49263d instanceof v_84a859 && v_49263d.code === "UNDER_AGE") {

        v_ee9ec1(false);
        v_889fad(
          v_8d41d7("auth.birthDateGate.underAgeTitle", { defaultValue: "가입이 제한되었습니다" }),
          v_8d41d7("auth.birthDateGate.underAgeDesc", {
            defaultValue:
              "만 14세 미만은 이용할 수 없어 계정이 7일간 잠겼습니다.\n7일 내 복구 요청이 없으면 계정이 삭제됩니다.",
          }),
          [
            {
              text: v_8d41d7("common.confirm", { defaultValue: "확인" }),
              onPress: () => {
                void v_d7d5a2();
              },
            },
          ],
        );
        return;
      }
      v_ee9ec1(false);
      v_889fad(
        v_8d41d7("common.error"),
        v_49263d instanceof v_84a859
          ? v_49263d.message
          : v_8d41d7("auth.birthDateGate.saveFailed", {
              defaultValue: "생년월일 저장에 실패했어요. 잠시 후 다시 시도해 주세요.",
            }),
      );
    }
  };

  return (
    <SafeView backgroundColor={v_cafb6f.pageBg}>
      {}
      <View style={v_d81136.container}>
        {}
        <View style={v_d81136.headerBlock}>
          <Text style={v_d81136.title}>
            {v_8d41d7("auth.birthDateGate.title", { defaultValue: "생년월일을 알려주세요" })}
          </Text>
          <Text style={v_d81136.desc}>
            {v_8d41d7("auth.birthDateGate.desc", {
              defaultValue:
                "서비스 이용을 위해 생년월일 입력이 필요합니다. 만 14세 이상만 이용할 수 있어요.",
            })}
          </Text>
        </View>

        {}
        <View style={v_d81136.formBlock}>
          <View style={v_d81136.row}>
            <TouchableOpacity
              style={v_d81136.picker}
              onPress={() => v_be8eb2("year")}
              activeOpacity={0.7}
              disabled={v_cb66b4}
            >
              <Text style={v_0eaaff != null ? v_d81136.pickerValue : v_d81136.pickerPlaceholder}>
                {v_0eaaff != null ? `${v_0eaaff}` : v_8d41d7("auth.signup.birthYear", { defaultValue: "년" })}
              </Text>
              <Feather name="chevron-down" size={16} color="#8e9bae" />
            </TouchableOpacity>
            <TouchableOpacity
              style={v_d81136.picker}
              onPress={() => v_be8eb2("month")}
              activeOpacity={0.7}
              disabled={v_cb66b4}
            >
              <Text style={v_033a94 != null ? v_d81136.pickerValue : v_d81136.pickerPlaceholder}>
                {v_033a94 != null ? `${v_033a94}` : v_8d41d7("auth.signup.birthMonth", { defaultValue: "월" })}
              </Text>
              <Feather name="chevron-down" size={16} color="#8e9bae" />
            </TouchableOpacity>
            <TouchableOpacity
              style={v_d81136.picker}
              onPress={() => v_be8eb2("day")}
              activeOpacity={0.7}
              disabled={v_cb66b4}
            >
              <Text style={v_087ffc != null ? v_d81136.pickerValue : v_d81136.pickerPlaceholder}>
                {v_087ffc != null ? `${v_087ffc}` : v_8d41d7("auth.signup.birthDay", { defaultValue: "일" })}
              </Text>
              <Feather name="chevron-down" size={16} color="#8e9bae" />
            </TouchableOpacity>
          </View>
        </View>

        {}
        <View style={v_d81136.footerBlock}>
          <TouchableOpacity
            style={[v_d81136.submit, v_cb66b4 && v_d81136.submitDisabled]}
            onPress={v_585b02}
            disabled={v_cb66b4}
            activeOpacity={0.85}
          >
            {v_cb66b4 ? (
              <ActivityIndicator size="small" color={v_1bfbd0.white} />
            ) : (
              <Text style={v_d81136.submitText}>
                {v_8d41d7("auth.birthDateGate.submit", { defaultValue: "확인" })}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {}
      <Modal
        animationType="slide"
        transparent
        visible={v_855c14 !== null}
        onRequestClose={() => v_be8eb2(null)}
      >
        <View style={v_d81136.modalOverlay}>
          <TouchableOpacity
            style={v_d81136.modalBackdrop}
            activeOpacity={1}
            onPress={() => v_be8eb2(null)}
          />
          <View style={v_d81136.modalContent}>
            <View style={v_d81136.modalHeader}>
              <Text style={v_d81136.modalTitle}>
                {v_855c14 === "year"
                  ? (v_8d41d7("auth.signup.birthYearTitle", { defaultValue: "출생 연도" }) as string)
                  : v_855c14 === "month"
                    ? (v_8d41d7("auth.signup.birthMonthTitle", { defaultValue: "출생 월" }) as string)
                    : (v_8d41d7("auth.signup.birthDayTitle", { defaultValue: "출생 일" }) as string)}
              </Text>
              <TouchableOpacity onPress={() => v_be8eb2(null)}>
                <Text style={v_d81136.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={
                v_855c14 === "year"
                  ? v_294ec5
                  : v_855c14 === "month"
                    ? v_b50d00
                    : v_780719
              }
              keyExtractor={(v_f4e98d) => String(v_f4e98d)}
              renderItem={({ item: v_8c0b26 }) => {
                const v_587413 =
                  (v_855c14 === "year" && v_0eaaff === v_8c0b26) ||
                  (v_855c14 === "month" && v_033a94 === v_8c0b26) ||
                  (v_855c14 === "day" && v_087ffc === v_8c0b26);
                return (
                  <TouchableOpacity
                    style={[v_d81136.modalListItem, v_587413 && v_d81136.modalListItemSelected]}
                    onPress={() => {
                      if (v_855c14 === "year") {
                        v_1bc832(v_8c0b26);
                        if (v_033a94 != null && v_087ffc != null && v_087ffc > v_43142a(v_8c0b26, v_033a94)) v_75e821(null);
                      } else if (v_855c14 === "month") {
                        v_b48742(v_8c0b26);
                        if (v_0eaaff != null && v_087ffc != null && v_087ffc > v_43142a(v_0eaaff, v_8c0b26)) v_75e821(null);
                      } else {
                        v_75e821(v_8c0b26);
                      }
                      v_be8eb2(null);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={v_d81136.modalListLabel}>{String(v_8c0b26)}</Text>
                    {v_587413 ? <Feather name="check" size={18} color={v_cafb6f.primary} /> : null}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </View>
      </Modal>
    </SafeView>
  );
}

const v_d81136 = v_472849.create({

  container: {
    flex: 1,
    paddingHorizontal: v_9b1a04.large,
    paddingTop: v_9b1a04.xlarge,
    paddingBottom: v_9b1a04.large,
  },

  headerBlock: {
    width: "100%",
    maxWidth: 780,
    alignSelf: "center",
    gap: 10,
  },

  formBlock: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },

  footerBlock: {
    width: "100%",
    maxWidth: 780,
    alignSelf: "center",
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    color: v_cafb6f.headingText,
    fontFamily: v_843035.bold,
  },
  desc: {
    fontSize: 14,
    lineHeight: 20,
    color: v_cafb6f.mutedText,
    fontFamily: v_843035.regular,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    maxWidth: 780,
  },
  picker: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: v_8f28b1.height,
    borderWidth: 1,
    borderColor: "#dedede",
    borderRadius: v_8f28b1.borderRadius,
    backgroundColor: "#fefefe",
    paddingHorizontal: v_8f28b1.paddingHorizontal,
  },
  pickerValue: {
    fontSize: v_8f28b1.fontSize,
    lineHeight: v_8f28b1.lineHeight,
    color: "#2a2727",
    fontFamily: v_843035.medium,
  },

  pickerPlaceholder: {
    fontSize: v_8f28b1.fontSize,
    lineHeight: v_8f28b1.lineHeight,
    color: "#8e9bae",
    fontFamily: v_843035.regular,
  },
  submit: {
    ...v_d43669.lg,
    backgroundColor: v_1bfbd0.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  submitDisabled: { opacity: 0.5 },
  submitText: {
    ...v_c10a43.lg,
    color: "#ffffff",
    fontFamily: v_843035.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBackdrop: { flex: 1 },
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
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: { fontSize: 18, fontFamily: v_843035.bold, color: v_cafb6f.headingText },
  modalCloseButton: { fontSize: 24, color: v_cafb6f.mutedText, lineHeight: 24 },
  modalListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#fff",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  modalListItemSelected: { borderColor: v_cafb6f.primary },
  modalListLabel: { fontSize: 15, color: v_cafb6f.headingText, fontFamily: v_843035.medium },
});
