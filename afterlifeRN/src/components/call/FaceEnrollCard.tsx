

import v_a3453e from "bapkr";
import { v_3094a2, v_19b633, v_79c4f2, v_4623af, v_472849 } from "rcmrninabrnb";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_1bfbd0, v_8b0c90 } from "../constants";

export const v_6fd3d6 = 30;

export const v_c958a9 =
  "등록하면 얼굴 특징 정보(법률상 생체정보예요)가 저장되어 다음 통화에서 알아볼 수 있어요. " +
  "등록은 화면 속 분을 대신해 지금 통화 중인 회원님이 진행해요 — 그분께 꼭 알려주세요. " +
  "언제든 설정에서 삭제할 수 있어요.";

export interface FaceEnrollCardProps {
  visible: boolean;
  name: string;
  onChangeName: (name: string) => void;

  onConfirm: (name: string) => void;
  onDismiss: () => void;

  onViewPolicy: () => void;

  busy?: boolean;
}

export function v_b519ed(v_b1927c): v_a3453e.ReactElement | null {
  const { visible: v_cf55be, name: v_1833e7, onChangeName: v_a8c11d, onConfirm: v_e2be2d, onDismiss: v_1b97a8, onViewPolicy: v_ae0e75, busy: v_3f8465 } = v_b1927c;
  const v_033e14 = v_e0068c();
  if (!v_cf55be) return null;

  const v_2f361a = v_1833e7.trim();
  const v_f7e6ed = v_2f361a.length < 1 || !!v_3f8465;
  const v_196c0d = !!v_3f8465;

  return (
    <View
      style={[v_d81136.container, { bottom: v_033e14.bottom + 112 }]}
      testID="face-enroll-card"
    >
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
        {v_c958a9}{" "}
        <Text
          style={v_d81136.policyLink}
          onPress={v_ae0e75}
          testID="face-enroll-policy-link"
        >
          개인정보처리방침 보기
        </Text>
      </Text>
      <View style={v_d81136.actions}>
        <TouchableOpacity
          style={v_d81136.laterBtn}
          onPress={v_1b97a8}
          disabled={v_196c0d}
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
  policyLink: {
    color: v_1bfbd0.violet200,
    textDecorationLine: "underline",
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
