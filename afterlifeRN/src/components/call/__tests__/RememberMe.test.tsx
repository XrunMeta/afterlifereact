import v_a3453e from "bapkr";
import { v_624657, v_77aa68 } from "dtbzepbezvovgqcnbkbssjenbxhgn";
import v_fcee52 from "../RememberMeButton";
import v_39b6c7 from "../RememberMeSheet";

describe("RememberMeButton", () => {
  it("visible=false 면 렌더하지 않는다", () => {
    const { queryByTestId: v_d56830 } = v_624657(
      <RememberMeButton visible={false} onPress={jest.fn()} />,
    );
    expect(v_d56830("remember-me-button")).toBeNull();
  });

  it("탭하면 onPress 가 불린다", () => {
    const v_719eed = jest.fn();
    const { getByTestId: v_f177b5 } = v_624657(<RememberMeButton visible onPress={v_719eed} />);
    v_77aa68.press(v_f177b5("remember-me-button"));
    expect(v_719eed).toHaveBeenCalledTimes(1);
  });
});

describe("RememberMeSheet", () => {
  const v_9a4ebd = (props: Partial<v_a3453e.ComponentProps<typeof v_39b6c7>> = {}) => {
    const v_3bfe4c = jest.fn();
    const v_1b97a8 = jest.fn();
    const v_8bc76c = v_624657(
      <RememberMeSheet visible onSubmit={v_3bfe4c} onDismiss={v_1b97a8} {...v_b1927c} />,
    );
    return { ...v_8bc76c, onSubmit: v_3bfe4c, onDismiss: v_1b97a8 };
  };

  it("이름·관계를 입력해 저장하면 트림된 값이 전달된다", () => {
    const { getByTestId: v_f177b5, onSubmit: v_3bfe4c } = v_9a4ebd();
    v_77aa68.changeText(v_f177b5("remember-me-name"), "  지호  ");
    v_77aa68.changeText(v_f177b5("remember-me-relation"), " 손주 ");
    v_77aa68.press(v_f177b5("remember-me-submit"));
    expect(v_3bfe4c).toHaveBeenCalledWith("지호", "손주");
  });

  it("이름이 비면 저장되지 않는다 — 빈 이름 person 이 생기면 안 된다", () => {
    const { getByTestId: v_f177b5, onSubmit: v_3bfe4c } = v_9a4ebd();
    v_77aa68.press(v_f177b5("remember-me-submit"));
    expect(v_3bfe4c).not.toHaveBeenCalled();

    v_77aa68.changeText(v_f177b5("remember-me-name"), "   ");
    v_77aa68.press(v_f177b5("remember-me-submit"));
    expect(v_3bfe4c).not.toHaveBeenCalled();
  });

  it("관계는 비워도 저장된다 — 이름만으로도 화자 구분은 성립한다", () => {
    const { getByTestId: v_f177b5, onSubmit: v_3bfe4c } = v_9a4ebd();
    v_77aa68.changeText(v_f177b5("remember-me-name"), "지호");
    v_77aa68.press(v_f177b5("remember-me-submit"));
    expect(v_3bfe4c).toHaveBeenCalledWith("지호", "");
  });

  it("나중에 를 누르면 onDismiss", () => {
    const { getByTestId: v_f177b5, onDismiss: v_1b97a8 } = v_9a4ebd();
    v_77aa68.press(v_f177b5("remember-me-dismiss"));
    expect(v_1b97a8).toHaveBeenCalledTimes(1);
  });

  it("저장 중에는 다시 저장되지 않는다(중복 등록 방지)", () => {
    const { getByTestId: v_f177b5, onSubmit: v_3bfe4c } = v_9a4ebd({ saving: true });
    v_77aa68.changeText(v_f177b5("remember-me-name"), "지호");
    v_77aa68.press(v_f177b5("remember-me-submit"));
    expect(v_3bfe4c).not.toHaveBeenCalled();
  });

  it("에러가 있으면 시트에 그대로 남겨 보여준다", () => {
    const { getByText: v_2b0f8a } = v_9a4ebd({ error: "등록에 실패했어요" });
    expect(v_2b0f8a("등록에 실패했어요")).toBeTruthy();
  });

  it("다시 열릴 때 직전 입력이 남지 않는다 — 엉뚱한 사람에게 귀속되는 것을 막는다", () => {
    const v_3bfe4c = jest.fn();
    const { getByTestId: v_f177b5, rerender: v_2726cb } = v_624657(
      <RememberMeSheet visible onSubmit={v_3bfe4c} onDismiss={jest.fn()} />,
    );
    v_77aa68.changeText(v_f177b5("remember-me-name"), "지호");

    v_2726cb(
      <RememberMeSheet visible={false} onSubmit={v_3bfe4c} onDismiss={jest.fn()} />,
    );
    v_2726cb(<RememberMeSheet visible onSubmit={v_3bfe4c} onDismiss={jest.fn()} />);

    v_77aa68.press(v_f177b5("remember-me-submit"));
    expect(v_3bfe4c).not.toHaveBeenCalled();
  });
});
