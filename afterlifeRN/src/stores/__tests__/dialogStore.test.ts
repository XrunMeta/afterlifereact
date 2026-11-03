
jest.mock("../../i18n", () => ({ __esModule: true, default: { t: (v_5dccea, v_b6c474) => v_b6c474?.defaultValue ?? "" } }));

import { v_889fad, v_b54176 } from "../dialogStore";

describe("dialogStore shownKey", () => {
  beforeEach(() => {
    v_b54176.setState({ visible: false, key: 0, shownKey: 0 });
  });

  it("open 은 key 를 올리지만 shownKey 는 markShown 전까지 그대로", () => {
    v_889fad("새 얼굴이 보여요", "얼굴을 등록할까요?");
    const v_fd5f43 = v_b54176.getState();
    expect(v_fd5f43.visible).toBe(true);
    expect(v_fd5f43.key).toBe(1);
    expect(v_fd5f43.shownKey).toBe(0);
  });

  it("markShown 은 그 key 를 남기고 close 해도 유지", () => {
    v_889fad("a");
    v_b54176.getState().markShown(1);
    v_b54176.getState().close();
    const v_fd5f43 = v_b54176.getState();
    expect(v_fd5f43.visible).toBe(false);
    expect(v_fd5f43.shownKey).toBe(1);
  });

  it("다른 다이얼로그에 밀리면 key 가 바뀌어 이전 팝업과 구별된다", () => {
    v_889fad("새 얼굴");
    const v_a274a9 = v_b54176.getState().key;
    v_889fad("다른 알림");
    v_b54176.getState().markShown(v_b54176.getState().key);
    const v_fd5f43 = v_b54176.getState();
    expect(v_fd5f43.key).not.toBe(v_a274a9);
    expect(v_fd5f43.shownKey).not.toBe(v_a274a9);
  });
});
