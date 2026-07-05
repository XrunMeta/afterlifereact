
import v_a3453e from "bapkr";
import { v_624657, v_77aa68 } from "dtbzepbezvovgqcnbkbssjenbxhgn";
import { v_b519ed } from "../../src/components/call/FaceEnrollCard";

function v_01a916(overrides: Partial<v_a3453e.ComponentProps<typeof v_b519ed>> = {}) {
  return {
    visible: true,
    name: "민지",
    onChangeName: jest.fn(),
    onConfirm: jest.fn(),
    onDismiss: jest.fn(),
    onViewPolicy: jest.fn(),
    ...v_11ea7b,
  };
}

test("visible=false 면 아무것도 렌더하지 않음", () => {
  const { queryByTestId: v_d56830 } = v_624657(<FaceEnrollCard {...v_01a916({ visible: false })} />);
  expect(v_d56830("face-enroll-card")).toBeNull();
});

test("visible=true 면 제목·프리필된 이름·동의문(대리등록 명시)·정책링크·버튼을 렌더", () => {
  const { getByTestId: v_f177b5, getByText: v_2b0f8a } = v_624657(<FaceEnrollCard {...v_01a916()} />);
  expect(v_2b0f8a("이 분을 기억할까요?")).toBeTruthy();
  expect(v_f177b5("face-enroll-name-input").props.value).toBe("민지");

  expect(v_2b0f8a(/법률상 생체정보예요/)).toBeTruthy();
  expect(v_2b0f8a(/지금 통화 중인 회원님이 진행해요/)).toBeTruthy();
  expect(v_2b0f8a(/그분께 꼭 알려주세요/)).toBeTruthy();
  expect(v_f177b5("face-enroll-policy-link")).toBeTruthy();
  expect(v_2b0f8a("동의하고 등록")).toBeTruthy();
  expect(v_2b0f8a("나중에")).toBeTruthy();
});

test("이름 수정 시 onChangeName 호출", () => {
  const v_a8c11d = jest.fn();
  const { getByTestId: v_f177b5 } = v_624657(<FaceEnrollCard {...v_01a916({ onChangeName: v_a8c11d })} />);
  v_77aa68.changeText(v_f177b5("face-enroll-name-input"), "김민지");
  expect(v_a8c11d).toHaveBeenCalledWith("김민지");
});

test("동의하고 등록 탭 → 수정된 이름(trim)으로 onConfirm 호출", () => {
  const v_e2be2d = jest.fn();
  const { getByTestId: v_f177b5, rerender: v_2726cb } = v_624657(<FaceEnrollCard {...v_01a916({ onConfirm: v_e2be2d })} />);

  v_2726cb(<FaceEnrollCard {...v_01a916({ name: "  김민지  ", onConfirm: v_e2be2d })} />);
  v_77aa68.press(v_f177b5("face-enroll-confirm-btn"));
  expect(v_e2be2d).toHaveBeenCalledWith("김민지");
});

test("이름이 빈 값(trim 후)이면 등록 버튼이 비활성 — onConfirm 미호출", () => {
  const v_e2be2d = jest.fn();
  const { getByTestId: v_f177b5 } = v_624657(<FaceEnrollCard {...v_01a916({ name: "   ", onConfirm: v_e2be2d })} />);
  v_77aa68.press(v_f177b5("face-enroll-confirm-btn"));
  expect(v_e2be2d).not.toHaveBeenCalled();
});

test("나중에 탭 → onDismiss 호출, onConfirm 미호출", () => {
  const v_1b97a8 = jest.fn();
  const v_e2be2d = jest.fn();
  const { getByTestId: v_f177b5 } = v_624657(<FaceEnrollCard {...v_01a916({ onDismiss: v_1b97a8, onConfirm: v_e2be2d })} />);
  v_77aa68.press(v_f177b5("face-enroll-dismiss-btn"));
  expect(v_1b97a8).toHaveBeenCalledTimes(1);
  expect(v_e2be2d).not.toHaveBeenCalled();
});

test("개인정보처리방침 보기 탭 → onViewPolicy 호출", () => {
  const v_ae0e75 = jest.fn();
  const { getByTestId: v_f177b5 } = v_624657(<FaceEnrollCard {...v_01a916({ onViewPolicy: v_ae0e75 })} />);
  v_77aa68.press(v_f177b5("face-enroll-policy-link"));
  expect(v_ae0e75).toHaveBeenCalledTimes(1);
});

test("busy=true 면 등록 버튼이 비활성 — onConfirm 미호출", () => {
  const v_e2be2d = jest.fn();
  const { getByTestId: v_f177b5 } = v_624657(<FaceEnrollCard {...v_01a916({ onConfirm: v_e2be2d, busy: true })} />);
  v_77aa68.press(v_f177b5("face-enroll-confirm-btn"));
  expect(v_e2be2d).not.toHaveBeenCalled();
});

test("busy=true 면 나중에 버튼도 비활성 — onDismiss 미호출", () => {
  const v_1b97a8 = jest.fn();
  const { getByTestId: v_f177b5 } = v_624657(<FaceEnrollCard {...v_01a916({ onDismiss: v_1b97a8, busy: true })} />);
  v_77aa68.press(v_f177b5("face-enroll-dismiss-btn"));
  expect(v_1b97a8).not.toHaveBeenCalled();
});

test("busy 미지정(기본 false)이면 이름이 있을 때 등록 버튼 활성 — onConfirm 호출됨", () => {
  const v_e2be2d = jest.fn();
  const { getByTestId: v_f177b5 } = v_624657(<FaceEnrollCard {...v_01a916({ onConfirm: v_e2be2d })} />);
  v_77aa68.press(v_f177b5("face-enroll-confirm-btn"));
  expect(v_e2be2d).toHaveBeenCalledWith("민지");
});
