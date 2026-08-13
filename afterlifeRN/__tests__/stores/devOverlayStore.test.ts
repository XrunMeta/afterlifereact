

jest.mock("@react-native-async-storage/async-storage", () =>
  require("../helpers/mockAsyncStorage").asyncStorageMock(),
);

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CALL_HUD_DEFAULTS,
  CALL_HUD_ITEMS,
  hudStorageKey,
  isCallHudVisible,
  useDevOverlayStore,
  type CallHudKey,
} from "../../src/stores/devOverlayStore";

const MASTER_KEY = "dev.callOverlays.visible";
const ALL_KEYS: CallHudKey[] = ["devBox", "state", "timing", "faceTrack"];

function resetStore() {
  useDevOverlayStore.setState({
    callDevUiVisible: false,
    hudVisible: { ...CALL_HUD_DEFAULTS },
    hydrated: false,
  });
}

beforeEach(async () => {
  await AsyncStorage.clear();
  resetStore();
});

describe("HUD 목록·기본값", () => {
  it("대상 HUD 4종을 모두 다룬다", () => {
    expect(CALL_HUD_ITEMS.map((i) => i.key).sort()).toEqual(
      ["devBox", "faceTrack", "state", "timing"].sort(),
    );
  });

  it("기본값 — faceTrack/devBox 는 on, timing/state 는 off", () => {

    expect(CALL_HUD_DEFAULTS.faceTrack).toBe(true);
    expect(CALL_HUD_DEFAULTS.devBox).toBe(true);
    expect(CALL_HUD_DEFAULTS.timing).toBe(false);
    expect(CALL_HUD_DEFAULTS.state).toBe(false);
  });

  it("초기 스토어 상태가 기본값과 같다", () => {
    expect(useDevOverlayStore.getState().hudVisible).toEqual(CALL_HUD_DEFAULTS);
  });
});

describe("개별 토글", () => {
  it("setHudVisible 이 해당 키만 바꾼다", () => {
    useDevOverlayStore.getState().setHudVisible("timing", true);
    const s = useDevOverlayStore.getState().hudVisible;
    expect(s.timing).toBe(true);
    expect(s.faceTrack).toBe(CALL_HUD_DEFAULTS.faceTrack);
    expect(s.state).toBe(CALL_HUD_DEFAULTS.state);
    expect(s.devBox).toBe(CALL_HUD_DEFAULTS.devBox);
  });

  it("toggleHudVisible 이 값을 뒤집는다", () => {
    useDevOverlayStore.getState().toggleHudVisible("faceTrack");
    expect(useDevOverlayStore.getState().hudVisible.faceTrack).toBe(false);
    useDevOverlayStore.getState().toggleHudVisible("faceTrack");
    expect(useDevOverlayStore.getState().hudVisible.faceTrack).toBe(true);
  });

  it("마스터 토글은 개별 HUD 값을 건드리지 않는다", () => {
    useDevOverlayStore.getState().setHudVisible("timing", true);
    useDevOverlayStore.getState().setCallDevUiVisible(true);
    useDevOverlayStore.getState().setCallDevUiVisible(false);
    expect(useDevOverlayStore.getState().hudVisible.timing).toBe(true);
  });
});

describe("isCallHudVisible — 마스터 AND 개별", () => {
  it("마스터 off 면 개별이 on 이어도 false (기존 동작 유지)", () => {
    useDevOverlayStore.getState().setCallDevUiVisible(false);
    useDevOverlayStore.getState().setHudVisible("faceTrack", true);
    for (const k of ALL_KEYS) expect(isCallHudVisible(k)).toBe(false);
  });

  it("마스터 on + 개별 on 이어야 true", () => {
    useDevOverlayStore.getState().setCallDevUiVisible(true);
    useDevOverlayStore.getState().setHudVisible("faceTrack", true);
    useDevOverlayStore.getState().setHudVisible("timing", false);
    expect(isCallHudVisible("faceTrack")).toBe(true);
    expect(isCallHudVisible("timing")).toBe(false);
  });
});

describe("영속(AsyncStorage)", () => {
  it("setHudVisible 이 HUD 별 키에 기록한다", async () => {
    useDevOverlayStore.getState().setHudVisible("timing", true);
    useDevOverlayStore.getState().setHudVisible("faceTrack", false);
    await Promise.resolve();
    expect(await AsyncStorage.getItem(hudStorageKey("timing"))).toBe("1");
    expect(await AsyncStorage.getItem(hudStorageKey("faceTrack"))).toBe("0");
  });

  it("hydrate 가 저장값을 복원한다(앱 재시작 시나리오)", async () => {
    await AsyncStorage.setItem(MASTER_KEY, "1");
    await AsyncStorage.setItem(hudStorageKey("timing"), "1");
    await AsyncStorage.setItem(hudStorageKey("faceTrack"), "0");
    resetStore();

    await useDevOverlayStore.getState().hydrate();

    const s = useDevOverlayStore.getState();
    expect(s.callDevUiVisible).toBe(true);
    expect(s.hudVisible.timing).toBe(true);
    expect(s.hudVisible.faceTrack).toBe(false);

    expect(s.hudVisible.state).toBe(CALL_HUD_DEFAULTS.state);
    expect(s.hudVisible.devBox).toBe(CALL_HUD_DEFAULTS.devBox);
    expect(s.hydrated).toBe(true);
  });

  it("저장값이 없으면 dev 에서 마스터가 켜진 채 시작한다", async () => {

    await AsyncStorage.clear();
    resetStore();

    await useDevOverlayStore.getState().hydrate();

    const s = useDevOverlayStore.getState();
    expect(s.callDevUiVisible).toBe(true);
    expect(s.hudVisible.faceTrack).toBe(true);
  });

  it("명시적으로 끈 선택은 그대로 유지된다 — 기본값이 덮지 않는다", async () => {
    await AsyncStorage.setItem(MASTER_KEY, "0");
    resetStore();

    await useDevOverlayStore.getState().hydrate();

    expect(useDevOverlayStore.getState().callDevUiVisible).toBe(false);
  });

  it("토글 → hydrate 왕복이 값을 유지한다", async () => {
    useDevOverlayStore.getState().toggleHudVisible("state"); 
    useDevOverlayStore.getState().toggleHudVisible("devBox"); 
    await Promise.resolve();
    resetStore();

    await useDevOverlayStore.getState().hydrate();

    expect(useDevOverlayStore.getState().hudVisible.state).toBe(true);
    expect(useDevOverlayStore.getState().hudVisible.devBox).toBe(false);
  });

  it("손상된 저장값은 기본값으로 떨어진다", async () => {
    await AsyncStorage.setItem(hudStorageKey("faceTrack"), "yes");
    resetStore();
    await useDevOverlayStore.getState().hydrate();
    expect(useDevOverlayStore.getState().hudVisible.faceTrack).toBe(
      CALL_HUD_DEFAULTS.faceTrack,
    );
  });
});

describe("__DEV__ 가드 — 프로덕션 유출 방지", () => {
  const original = (global as any).__DEV__;
  afterEach(() => {
    (global as any).__DEV__ = original;
  });

  it("__DEV__=false 면 hydrate 가 저장값을 무시하고 전부 false 로 강제한다", async () => {
    await AsyncStorage.setItem(MASTER_KEY, "1");
    for (const k of ALL_KEYS) await AsyncStorage.setItem(hudStorageKey(k), "1");
    resetStore();

    (global as any).__DEV__ = false;
    await useDevOverlayStore.getState().hydrate();

    const s = useDevOverlayStore.getState();
    expect(s.callDevUiVisible).toBe(false);
    for (const k of ALL_KEYS) expect(s.hudVisible[k]).toBe(false);
    expect(s.hydrated).toBe(true);
  });

  it("__DEV__=false 면 setHudVisible·toggleHudVisible 이 no-op", async () => {
    (global as any).__DEV__ = false;
    useDevOverlayStore.getState().setHudVisible("timing", true);
    useDevOverlayStore.getState().toggleHudVisible("faceTrack");
    expect(useDevOverlayStore.getState().hudVisible.timing).toBe(
      CALL_HUD_DEFAULTS.timing,
    );
    expect(useDevOverlayStore.getState().hudVisible.faceTrack).toBe(
      CALL_HUD_DEFAULTS.faceTrack,
    );
    expect(await AsyncStorage.getItem(hudStorageKey("timing"))).toBeNull();
  });

  it("__DEV__=false 면 상태가 on 이어도 isCallHudVisible 은 false", () => {
    useDevOverlayStore.setState({
      callDevUiVisible: true,
      hudVisible: { devBox: true, state: true, timing: true, faceTrack: true },
    });
    (global as any).__DEV__ = false;
    for (const k of ALL_KEYS) expect(isCallHudVisible(k)).toBe(false);
  });
});
