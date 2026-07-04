
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { FaceEnrollCard } from "../../src/components/call/FaceEnrollCard";

test("visible=false 면 아무것도 렌더하지 않음", () => {
  const { queryByTestId } = render(
    <FaceEnrollCard
      visible={false}
      name="민지"
      onChangeName={jest.fn()}
      onConfirm={jest.fn()}
      onDismiss={jest.fn()}
    />,
  );
  expect(queryByTestId("face-enroll-card")).toBeNull();
});

test("visible=true 면 제목·프리필된 이름·동의문·버튼을 렌더", () => {
  const { getByTestId, getByText } = render(
    <FaceEnrollCard
      visible={true}
      name="민지"
      onChangeName={jest.fn()}
      onConfirm={jest.fn()}
      onDismiss={jest.fn()}
    />,
  );
  expect(getByText("이 분을 기억할까요?")).toBeTruthy();
  expect(getByTestId("face-enroll-name-input").props.value).toBe("민지");
  expect(
    getByText(/등록하면 얼굴 특징 정보\(생체정보\)가 저장되어 다음 통화에서 알아볼 수 있어요/),
  ).toBeTruthy();
  expect(getByText("동의하고 등록")).toBeTruthy();
  expect(getByText("나중에")).toBeTruthy();
});

test("이름 수정 시 onChangeName 호출", () => {
  const onChangeName = jest.fn();
  const { getByTestId } = render(
    <FaceEnrollCard
      visible={true}
      name="민지"
      onChangeName={onChangeName}
      onConfirm={jest.fn()}
      onDismiss={jest.fn()}
    />,
  );
  fireEvent.changeText(getByTestId("face-enroll-name-input"), "김민지");
  expect(onChangeName).toHaveBeenCalledWith("김민지");
});

test("동의하고 등록 탭 → 수정된 이름(trim)으로 onConfirm 호출", () => {
  const onConfirm = jest.fn();
  const { getByTestId, rerender } = render(
    <FaceEnrollCard
      visible={true}
      name="민지"
      onChangeName={jest.fn()}
      onConfirm={onConfirm}
      onDismiss={jest.fn()}
    />,
  );

  rerender(
    <FaceEnrollCard
      visible={true}
      name="  김민지  "
      onChangeName={jest.fn()}
      onConfirm={onConfirm}
      onDismiss={jest.fn()}
    />,
  );
  fireEvent.press(getByTestId("face-enroll-confirm-btn"));
  expect(onConfirm).toHaveBeenCalledWith("김민지");
});

test("이름이 빈 값(trim 후)이면 등록 버튼이 비활성 — onConfirm 미호출", () => {
  const onConfirm = jest.fn();
  const { getByTestId } = render(
    <FaceEnrollCard
      visible={true}
      name="   "
      onChangeName={jest.fn()}
      onConfirm={onConfirm}
      onDismiss={jest.fn()}
    />,
  );
  fireEvent.press(getByTestId("face-enroll-confirm-btn"));
  expect(onConfirm).not.toHaveBeenCalled();
});

test("나중에 탭 → onDismiss 호출, onConfirm 미호출", () => {
  const onDismiss = jest.fn();
  const onConfirm = jest.fn();
  const { getByTestId } = render(
    <FaceEnrollCard
      visible={true}
      name="민지"
      onChangeName={jest.fn()}
      onConfirm={onConfirm}
      onDismiss={onDismiss}
    />,
  );
  fireEvent.press(getByTestId("face-enroll-dismiss-btn"));
  expect(onDismiss).toHaveBeenCalledTimes(1);
  expect(onConfirm).not.toHaveBeenCalled();
});
