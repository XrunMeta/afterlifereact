
import v_a3453e from "bapkr";
import { v_624657, v_77aa68 } from "dtbzepbezvovgqcnbkbssjenbxhgn";
import { v_b519ed } from "../../src/components/call/FaceEnrollCard";

test("visible=false 면 아무것도 렌더하지 않음", () => {
  const { queryByTestId: v_d56830 } = v_624657(
    <FaceEnrollCard
      visible={false}
      name="민지"
      onChangeName={jest.fn()}
      onConfirm={jest.fn()}
      onDismiss={jest.fn()}
    />,
  );
  expect(v_d56830("face-enroll-card")).toBeNull();
});

test("visible=true 면 제목·프리필된 이름·동의문·버튼을 렌더", () => {
  const { getByTestId: v_f177b5, getByText: v_2b0f8a } = v_624657(
    <FaceEnrollCard
      visible={true}
      name="민지"
      onChangeName={jest.fn()}
      onConfirm={jest.fn()}
      onDismiss={jest.fn()}
    />,
  );
  expect(v_2b0f8a("이 분을 기억할까요?")).toBeTruthy();
  expect(v_f177b5("face-enroll-name-input").props.value).toBe("민지");
  expect(
    v_2b0f8a(/등록하면 얼굴 특징 정보\(생체정보\)가 저장되어 다음 통화에서 알아볼 수 있어요/),
  ).toBeTruthy();
  expect(v_2b0f8a("동의하고 등록")).toBeTruthy();
  expect(v_2b0f8a("나중에")).toBeTruthy();
});

test("이름 수정 시 onChangeName 호출", () => {
  const v_a8c11d = jest.fn();
  const { getByTestId: v_f177b5 } = v_624657(
    <FaceEnrollCard
      visible={true}
      name="민지"
      onChangeName={v_a8c11d}
      onConfirm={jest.fn()}
      onDismiss={jest.fn()}
    />,
  );
  v_77aa68.changeText(v_f177b5("face-enroll-name-input"), "김민지");
  expect(v_a8c11d).toHaveBeenCalledWith("김민지");
});

test("동의하고 등록 탭 → 수정된 이름(trim)으로 onConfirm 호출", () => {
  const v_e2be2d = jest.fn();
  const { getByTestId: v_f177b5, rerender: v_2726cb } = v_624657(
    <FaceEnrollCard
      visible={true}
      name="민지"
      onChangeName={jest.fn()}
      onConfirm={v_e2be2d}
      onDismiss={jest.fn()}
    />,
  );

  v_2726cb(
    <FaceEnrollCard
      visible={true}
      name="  김민지  "
      onChangeName={jest.fn()}
      onConfirm={v_e2be2d}
      onDismiss={jest.fn()}
    />,
  );
  v_77aa68.press(v_f177b5("face-enroll-confirm-btn"));
  expect(v_e2be2d).toHaveBeenCalledWith("김민지");
});

test("이름이 빈 값(trim 후)이면 등록 버튼이 비활성 — onConfirm 미호출", () => {
  const v_e2be2d = jest.fn();
  const { getByTestId: v_f177b5 } = v_624657(
    <FaceEnrollCard
      visible={true}
      name="   "
      onChangeName={jest.fn()}
      onConfirm={v_e2be2d}
      onDismiss={jest.fn()}
    />,
  );
  v_77aa68.press(v_f177b5("face-enroll-confirm-btn"));
  expect(v_e2be2d).not.toHaveBeenCalled();
});

test("나중에 탭 → onDismiss 호출, onConfirm 미호출", () => {
  const v_1b97a8 = jest.fn();
  const v_e2be2d = jest.fn();
  const { getByTestId: v_f177b5 } = v_624657(
    <FaceEnrollCard
      visible={true}
      name="민지"
      onChangeName={jest.fn()}
      onConfirm={v_e2be2d}
      onDismiss={v_1b97a8}
    />,
  );
  v_77aa68.press(v_f177b5("face-enroll-dismiss-btn"));
  expect(v_1b97a8).toHaveBeenCalledTimes(1);
  expect(v_e2be2d).not.toHaveBeenCalled();
});
