

jest.mock("bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv", () =>
  require("../helpers/mockAsyncStorage").asyncStorageMock(),
);

import v_e84827 from "bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv";
import {
  v_828022,
  v_a1183f,
  v_0cef44,
  v_5c17ef,
  v_434962,
  type v_3fe185,
} from "../../src/stores/devOverlayStore";

const v_34a048 = "dev.callOverlays.visible";
const ALL_KEYS: v_3fe185[] = ["devBox", "state", "timing", "faceTrack"];

function v_acab11() {
  v_434962.setState({
    callDevUiVisible: false,
    hudVisible: { ...v_828022 },
    hydrated: false,
  });
}

beforeEach(async () => {
  await v_e84827.clear();
  v_acab11();
});

describe("HUD 목록·기본값", () => {
  it("대상 HUD 4종을 모두 다룬다", () => {
    expect(v_a1183f.map((v_ebec57) => v_ebec57.key).sort()).toEqual(
      ["devBox", "faceTrack", "state", "timing"].sort(),
    );
  });

  it("기본값 — faceTrack/devBox 는 on, timing/state 는 off", () => {

    expect(v_828022.faceTrack).toBe(true);
    expect(v_828022.devBox).toBe(true);
    expect(v_828022.timing).toBe(false);
    expect(v_828022.state).toBe(false);
  });

  it("초기 스토어 상태가 기본값과 같다", () => {
    expect(v_434962.getState().hudVisible).toEqual(v_828022);
  });
});

describe("개별 토글", () => {
  it("setHudVisible 이 해당 키만 바꾼다", () => {
    v_434962.getState().setHudVisible("timing", true);
    const v_fd5f43 = v_434962.getState().hudVisible;
    expect(v_fd5f43.timing).toBe(true);
    expect(v_fd5f43.faceTrack).toBe(v_828022.faceTrack);
    expect(v_fd5f43.state).toBe(v_828022.state);
    expect(v_fd5f43.devBox).toBe(v_828022.devBox);
  });

  it("toggleHudVisible 이 값을 뒤집는다", () => {
    v_434962.getState().toggleHudVisible("faceTrack");
    expect(v_434962.getState().hudVisible.faceTrack).toBe(false);
    v_434962.getState().toggleHudVisible("faceTrack");
    expect(v_434962.getState().hudVisible.faceTrack).toBe(true);
  });

  it("마스터 토글은 개별 HUD 값을 건드리지 않는다", () => {
    v_434962.getState().setHudVisible("timing", true);
    v_434962.getState().setCallDevUiVisible(true);
    v_434962.getState().setCallDevUiVisible(false);
    expect(v_434962.getState().hudVisible.timing).toBe(true);
  });
});

describe("isCallHudVisible — 마스터 AND 개별", () => {
  it("마스터 off 면 개별이 on 이어도 false (기존 동작 유지)", () => {
    v_434962.getState().setCallDevUiVisible(false);
    v_434962.getState().setHudVisible("faceTrack", true);
    for (const v_0eb677 of v_29aafd) expect(v_5c17ef(v_0eb677)).toBe(false);
  });

  it("마스터 on + 개별 on 이어야 true", () => {
    v_434962.getState().setCallDevUiVisible(true);
    v_434962.getState().setHudVisible("faceTrack", true);
    v_434962.getState().setHudVisible("timing", false);
    expect(v_5c17ef("faceTrack")).toBe(true);
    expect(v_5c17ef("timing")).toBe(false);
  });
});

describe("영속(AsyncStorage)", () => {
  it("setHudVisible 이 HUD 별 키에 기록한다", async () => {
    v_434962.getState().setHudVisible("timing", true);
    v_434962.getState().setHudVisible("faceTrack", false);
    await Promise.resolve();
    expect(await v_e84827.getItem(v_0cef44("timing"))).toBe("1");
    expect(await v_e84827.getItem(v_0cef44("faceTrack"))).toBe("0");
  });

  it("hydrate 가 저장값을 복원한다(앱 재시작 시나리오)", async () => {
    await v_e84827.setItem(v_34a048, "1");
    await v_e84827.setItem(v_0cef44("timing"), "1");
    await v_e84827.setItem(v_0cef44("faceTrack"), "0");
    v_acab11();

    await v_434962.getState().hydrate();

    const v_fd5f43 = v_434962.getState();
    expect(v_fd5f43.callDevUiVisible).toBe(true);
    expect(v_fd5f43.hudVisible.timing).toBe(true);
    expect(v_fd5f43.hudVisible.faceTrack).toBe(false);

    expect(v_fd5f43.hudVisible.state).toBe(v_828022.state);
    expect(v_fd5f43.hudVisible.devBox).toBe(v_828022.devBox);
    expect(v_fd5f43.hydrated).toBe(true);
  });

  it("토글 → hydrate 왕복이 값을 유지한다", async () => {
    v_434962.getState().toggleHudVisible("state"); 
    v_434962.getState().toggleHudVisible("devBox"); 
    await Promise.resolve();
    v_acab11();

    await v_434962.getState().hydrate();

    expect(v_434962.getState().hudVisible.state).toBe(true);
    expect(v_434962.getState().hudVisible.devBox).toBe(false);
  });

  it("손상된 저장값은 기본값으로 떨어진다", async () => {
    await v_e84827.setItem(v_0cef44("faceTrack"), "yes");
    v_acab11();
    await v_434962.getState().hydrate();
    expect(v_434962.getState().hudVisible.faceTrack).toBe(
      v_828022.faceTrack,
    );
  });
});

describe("__DEV__ 가드 — 프로덕션 유출 방지", () => {
  const v_f7fd54 = (global as any).__DEV__;
  afterEach(() => {
    (global as any).__DEV__ = v_f7fd54;
  });

  it("__DEV__=false 면 hydrate 가 저장값을 무시하고 전부 false 로 강제한다", async () => {
    await v_e84827.setItem(v_34a048, "1");
    for (const v_0eb677 of v_29aafd) await v_e84827.setItem(v_0cef44(v_0eb677), "1");
    v_acab11();

    (global as any).__DEV__ = false;
    await v_434962.getState().hydrate();

    const v_fd5f43 = v_434962.getState();
    expect(v_fd5f43.callDevUiVisible).toBe(false);
    for (const v_0eb677 of v_29aafd) expect(v_fd5f43.hudVisible[v_0eb677]).toBe(false);
    expect(v_fd5f43.hydrated).toBe(true);
  });

  it("__DEV__=false 면 setHudVisible·toggleHudVisible 이 no-op", async () => {
    (global as any).__DEV__ = false;
    v_434962.getState().setHudVisible("timing", true);
    v_434962.getState().toggleHudVisible("faceTrack");
    expect(v_434962.getState().hudVisible.timing).toBe(
      v_828022.timing,
    );
    expect(v_434962.getState().hudVisible.faceTrack).toBe(
      v_828022.faceTrack,
    );
    expect(await v_e84827.getItem(v_0cef44("timing"))).toBeNull();
  });

  it("__DEV__=false 면 상태가 on 이어도 isCallHudVisible 은 false", () => {
    v_434962.setState({
      callDevUiVisible: true,
      hudVisible: { devBox: true, state: true, timing: true, faceTrack: true },
    });
    (global as any).__DEV__ = false;
    for (const v_0eb677 of v_29aafd) expect(v_5c17ef(v_0eb677)).toBe(false);
  });
});
