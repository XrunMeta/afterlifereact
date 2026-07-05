
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { FaceEnrollCard } from "../../src/components/call/FaceEnrollCard";

function baseProps(overrides: Partial<React.ComponentProps<typeof FaceEnrollCard>> = {}) {
  return {
    visible: true,
    name: "민지",
    onChangeName: jest.fn(),
    onConfirm: jest.fn(),
    onDismiss: jest.fn(),
    onViewPolicy: jest.fn(),
    ...overrides,
  };
}

test("visible=false 면 아무것도 렌더하지 않음", () => {
  const { queryByTestId } = render(<FaceEnrollCard {...baseProps({ visible: false })} />);
  expect(queryByTestId("face-enroll-card")).toBeNull();
});

test("visible=true 면 제목·프리필된 이름·동의문(대리등록 명시)·정책링크·버튼을 렌더", () => {
  const { getByTestId, getByText } = render(<FaceEnrollCard {...baseProps()} />);
  expect(getByText("이 분을 기억할까요?")).toBeTruthy();
  expect(getByTestId("face-enroll-name-input").props.value).toBe("민지");

  expect(getByText(/법률상 생체정보예요/)).toBeTruthy();
  expect(getByText(/지금 통화 중인 회원님이 진행해요/)).toBeTruthy();
  expect(getByText(/그분께 꼭 알려주세요/)).toBeTruthy();
  expect(getByTestId("face-enroll-policy-link")).toBeTruthy();
  expect(getByText("동의하고 등록")).toBeTruthy();
  expect(getByText("나중에")).toBeTruthy();
});

test("이름 수정 시 onChangeName 호출", () => {
  const onChangeName = jest.fn();
  const { getByTestId } = render(<FaceEnrollCard {...baseProps({ onChangeName })} />);
  fireEvent.changeText(getByTestId("face-enroll-name-input"), "김민지");
  expect(onChangeName).toHaveBeenCalledWith("김민지");
});

test("동의하고 등록 탭 → 수정된 이름(trim)으로 onConfirm 호출", () => {
  const onConfirm = jest.fn();
  const { getByTestId, rerender } = render(<FaceEnrollCard {...baseProps({ onConfirm })} />);

  rerender(<FaceEnrollCard {...baseProps({ name: "  김민지  ", onConfirm })} />);
  fireEvent.press(getByTestId("face-enroll-confirm-btn"));
  expect(onConfirm).toHaveBeenCalledWith("김민지");
});

test("이름이 빈 값(trim 후)이면 등록 버튼이 비활성 — onConfirm 미호출", () => {
  const onConfirm = jest.fn();
  const { getByTestId } = render(<FaceEnrollCard {...baseProps({ name: "   ", onConfirm })} />);
  fireEvent.press(getByTestId("face-enroll-confirm-btn"));
  expect(onConfirm).not.toHaveBeenCalled();
});

test("나중에 탭 → onDismiss 호출, onConfirm 미호출", () => {
  const onDismiss = jest.fn();
  const onConfirm = jest.fn();
  const { getByTestId } = render(<FaceEnrollCard {...baseProps({ onDismiss, onConfirm })} />);
  fireEvent.press(getByTestId("face-enroll-dismiss-btn"));
  expect(onDismiss).toHaveBeenCalledTimes(1);
  expect(onConfirm).not.toHaveBeenCalled();
});

test("개인정보처리방침 보기 탭 → onViewPolicy 호출", () => {
  const onViewPolicy = jest.fn();
  const { getByTestId } = render(<FaceEnrollCard {...baseProps({ onViewPolicy })} />);
  fireEvent.press(getByTestId("face-enroll-policy-link"));
  expect(onViewPolicy).toHaveBeenCalledTimes(1);
});

test("busy=true 면 등록 버튼이 비활성 — onConfirm 미호출", () => {
  const onConfirm = jest.fn();
  const { getByTestId } = render(<FaceEnrollCard {...baseProps({ onConfirm, busy: true })} />);
  fireEvent.press(getByTestId("face-enroll-confirm-btn"));
  expect(onConfirm).not.toHaveBeenCalled();
});

test("busy=true 면 나중에 버튼도 비활성 — onDismiss 미호출", () => {
  const onDismiss = jest.fn();
  const { getByTestId } = render(<FaceEnrollCard {...baseProps({ onDismiss, busy: true })} />);
  fireEvent.press(getByTestId("face-enroll-dismiss-btn"));
  expect(onDismiss).not.toHaveBeenCalled();
});

test("busy 미지정(기본 false)이면 이름이 있을 때 등록 버튼 활성 — onConfirm 호출됨", () => {
  const onConfirm = jest.fn();
  const { getByTestId } = render(<FaceEnrollCard {...baseProps({ onConfirm })} />);
  fireEvent.press(getByTestId("face-enroll-confirm-btn"));
  expect(onConfirm).toHaveBeenCalledWith("민지");
});
