import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import RememberMeButton from "../RememberMeButton";
import RememberMeSheet from "../RememberMeSheet";

describe("RememberMeButton", () => {
  it("visible=false 면 렌더하지 않는다", () => {
    const { queryByTestId } = render(
      <RememberMeButton visible={false} onPress={jest.fn()} />,
    );
    expect(queryByTestId("remember-me-button")).toBeNull();
  });

  it("탭하면 onPress 가 불린다", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<RememberMeButton visible onPress={onPress} />);
    fireEvent.press(getByTestId("remember-me-button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe("RememberMeSheet", () => {
  const setup = (props: Partial<React.ComponentProps<typeof RememberMeSheet>> = {}) => {
    const onSubmit = jest.fn();
    const onDismiss = jest.fn();
    const utils = render(
      <RememberMeSheet visible onSubmit={onSubmit} onDismiss={onDismiss} {...props} />,
    );
    return { ...utils, onSubmit, onDismiss };
  };

  it("이름·관계를 입력해 저장하면 트림된 값이 전달된다", () => {
    const { getByTestId, onSubmit } = setup();
    fireEvent.changeText(getByTestId("remember-me-name"), "  지호  ");
    fireEvent.changeText(getByTestId("remember-me-relation"), " 손주 ");
    fireEvent.press(getByTestId("remember-me-submit"));
    expect(onSubmit).toHaveBeenCalledWith("지호", "손주");
  });

  it("이름이 비면 저장되지 않는다 — 빈 이름 person 이 생기면 안 된다", () => {
    const { getByTestId, onSubmit } = setup();
    fireEvent.press(getByTestId("remember-me-submit"));
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.changeText(getByTestId("remember-me-name"), "   ");
    fireEvent.press(getByTestId("remember-me-submit"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("관계는 비워도 저장된다 — 이름만으로도 화자 구분은 성립한다", () => {
    const { getByTestId, onSubmit } = setup();
    fireEvent.changeText(getByTestId("remember-me-name"), "지호");
    fireEvent.press(getByTestId("remember-me-submit"));
    expect(onSubmit).toHaveBeenCalledWith("지호", "");
  });

  it("나중에 를 누르면 onDismiss", () => {
    const { getByTestId, onDismiss } = setup();
    fireEvent.press(getByTestId("remember-me-dismiss"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("팝업 바깥을 눌러도 닫힌다 — 나중에 와 같은 동작", () => {
    const { getByTestId, onDismiss } = setup();
    fireEvent.press(getByTestId("remember-me-backdrop"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("카드 안을 눌러도 닫히지 않는다", () => {

    const { getByTestId, onDismiss } = setup();
    fireEvent.press(getByTestId("remember-me-sheet"));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("저장 중에는 다시 저장되지 않는다(중복 등록 방지)", () => {
    const { getByTestId, onSubmit } = setup({ saving: true });
    fireEvent.changeText(getByTestId("remember-me-name"), "지호");
    fireEvent.press(getByTestId("remember-me-submit"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("에러가 있으면 시트에 그대로 남겨 보여준다", () => {
    const { getByText } = setup({ error: "등록에 실패했어요" });
    expect(getByText("등록에 실패했어요")).toBeTruthy();
  });

  it("다시 열릴 때 직전 입력이 남지 않는다 — 엉뚱한 사람에게 귀속되는 것을 막는다", () => {
    const onSubmit = jest.fn();
    const { getByTestId, rerender } = render(
      <RememberMeSheet visible onSubmit={onSubmit} onDismiss={jest.fn()} />,
    );
    fireEvent.changeText(getByTestId("remember-me-name"), "지호");

    rerender(
      <RememberMeSheet visible={false} onSubmit={onSubmit} onDismiss={jest.fn()} />,
    );
    rerender(<RememberMeSheet visible onSubmit={onSubmit} onDismiss={jest.fn()} />);

    fireEvent.press(getByTestId("remember-me-submit"));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
