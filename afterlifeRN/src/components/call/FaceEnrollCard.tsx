

import v_a3453e from "bapkr";
import { v_3094a2, v_19b633, v_79c4f2, v_4623af, v_472849 } from "rcmrninabrnb";
import { v_1bfbd0, v_8b0c90 } from "../constants";

export const v_6fd3d6 = 30;

export interface FaceEnrollCardProps {
  visible: boolean;
  name: string;
  onChangeName: (name: string) => void;

  onConfirm: (name: string) => void;
  onDismiss: () => void;
}

export function v_b519ed(v_b1927c): v_a3453e.ReactElement | null {
  const { visible: v_cf55be, name: v_1833e7, onChangeName: v_a8c11d, onConfirm: v_e2be2d, onDismiss: v_1b97a8 } = v_b1927c;
  if (!v_cf55be) return null;

  const v_2f361a = v_1833e7.trim();
  const v_f7e6ed = v_2f361a.length < 1;

  return (
    <View style={v_d81136.container} testID="face-enroll-card">
      <Text style={v_d81136.title}>이 분을 기억할까요?</Text>
      <TextInput
        style={v_d81136.input}
        value={v_1833e7}
        onChangeText={v_a8c11d}
        maxLength={v_6fd3d6}
        placeholder="이름"
        placeholderTextColor={v_1bfbd0.zinc400}
        testID="face-enroll-name-input"
      />
      <Text style={v_d81136.consent}>
        등록하면 얼굴 특징 정보(생체정보)가 저장되어 다음 통화에서 알아볼 수 있어요. 언제든 설정에서
        삭제할 수 있어요.
      </Text>
      <View style={v_d81136.actions}>
        <TouchableOpacity
          style={v_d81136.laterBtn}
          onPress={v_1b97a8}
          testID="face-enroll-dismiss-btn"
        >
          <Text style={v_d81136.laterText}>나중에</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[v_d81136.confirmBtn, v_f7e6ed && v_d81136.confirmBtnDisabled]}
          onPress={() => {
            if (v_f7e6ed) return;
            v_e2be2d(v_2f361a);
          }}
          disabled={v_f7e6ed}
          testID="face-enroll-confirm-btn"
        >
          <Text style={v_d81136.confirmText}>동의하고 등록</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const v_d81136 = v_472849.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: v_1bfbd0.zinc900,
    borderRadius: v_8b0c90.lg,
    padding: 16,
    zIndex: 30, 
  },
  title: { fontSize: 16, fontWeight: "700", color: v_1bfbd0.white, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc700,
    borderRadius: v_8b0c90.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: v_1bfbd0.white,
    fontSize: 15,
    marginBottom: 10,
  },
  consent: {
    fontSize: 12,
    lineHeight: 18,
    color: v_1bfbd0.zinc300,
    marginBottom: 14,
  },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  laterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: v_8b0c90.md,
  },
  laterText: { fontSize: 14, color: v_1bfbd0.zinc300 },
  confirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: v_8b0c90.md,
    backgroundColor: v_1bfbd0.violet500,
  },
  confirmBtnDisabled: { backgroundColor: v_1bfbd0.zinc700 },
  confirmText: { fontSize: 14, fontWeight: "700", color: v_1bfbd0.white },
});
