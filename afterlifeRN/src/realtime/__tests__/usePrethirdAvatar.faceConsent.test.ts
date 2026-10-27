
import { v_0da18b, v_be73a0 } from "dtbzepbezvovgqcnbkbssjenbxhgn";

jest.mock("rthlnescfffbyxfmhgq", () => ({
  RTCPeerConnection: jest.fn(),
  RTCSessionDescription: jest.fn((v_62c214) => v_62c214),
  MediaStream: jest.fn(),
}));
jest.mock("../../i18n", () => ({ __esModule: true, default: { language: "ko" } }));
jest.mock("../../lib/authFetch", () => ({ ensureFreshAccessToken: jest.fn(async (v_8d41d7) => v_8d41d7) }));
jest.mock("../../services/userLocation", () => ({
  getUserLocationForCall: jest.fn(async () => ({ location: null, askIntro: false })),
}));
jest.mock("../useAudioSession", () => ({
  defaultAudioSessionControl: { activate: jest.fn(), deactivate: jest.fn() },
}));

import { v_3d8d48 } from "../usePrethirdAvatar";
import { v_b7658e } from "../../face/faceConsentGate";
import { v_55270a } from "../../face/whoIntent";

function v_a575ea() {
  const v_4f3aa7 = {};
  const v_f966e3 = [];
  const v_32dc97 = {
    readyState: "connecting",
    sent: v_f966e3,
    send: jest.fn((v_35f85c): void => { v_f966e3.push(JSON.parse(v_35f85c)); }),
    addEventListener: (v_8d41d7, v_f80480): void => { (v_4f3aa7[v_8d41d7] ??= []).push(v_f80480); },
    open(): void { v_32dc97.readyState = "open"; (v_4f3aa7.open ?? []).forEach((v_8b5cd8) => v_8b5cd8()); },
  };
  const v_12cd99 = {
    iceGatheringState: "complete",
    localDescription: { type: "offer", sdp: "x" },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addTransceiver: jest.fn(),
    createDataChannel: jest.fn(() => v_32dc97),
    createOffer: jest.fn(async () => ({ type: "offer", sdp: "x" })),
    setLocalDescription: jest.fn(async () => {}),
    setRemoteDescription: jest.fn(async () => {}),
    close: jest.fn(),
  };
  return { dc: v_32dc97, pc: v_12cd99 };
}

let v_f7210b;
beforeEach(() => {
  v_f7210b = [];
  (global as any).fetch = jest.fn(async (v_ade164, v_00cfc6) => {
    v_f7210b.push(JSON.parse(v_00cfc6.body));
    return { status: 200, ok: true, text: async () => JSON.stringify({ sdp: "a", session_id: "s1" }) };
  });
});

async function v_9a4ebd(v_65e52b) {
  const { dc: v_32dc97, pc: v_12cd99 } = v_a575ea();
  const v_84b93d = {
    createPeerConnection: () => v_12cd99,
    audioSession: { activate: jest.fn(), deactivate: jest.fn() },
  };
  const v_ae701f = v_0da18b(
    (v_e2a85c) =>
      v_3d8d48({ cloneId: 1, accessToken: "t", deps: v_84b93d, faceConsent: v_e2a85c.c }),
    { initialProps: { c: v_65e52b } },
  );
  await v_be73a0(async () => { await v_ae701f.result.current.start(); });
  return { dc: v_32dc97, hook: v_ae701f };
}

describe("offer.face_consent", () => {
  test.each([[true], [false]])("확정(%s)이면 offer 에 싣는다", async (v_3f4e2e) => {
    await v_9a4ebd(v_3f4e2e);
    expect(v_f7210b[0].face_consent).toBe(v_3f4e2e);
  });
  test("미확정(null)이면 필드 생략", async () => {
    await v_9a4ebd(null);
    expect("face_consent" in v_f7210b[0]).toBe(false);
  });
});

describe("dc face_consent push", () => {
  test("dc open 시 확정값을 한 번 보낸다", async () => {
    const { dc: v_32dc97 } = await v_9a4ebd(false);
    expect(v_32dc97.sent).toEqual([]); 
    v_be73a0(() => v_32dc97.open());
    expect(v_32dc97.sent).toEqual([{ type: "face_consent", granted: false }]);
  });
  test("null 이면 open 해도 보내지 않고, null->true 전이 때 보낸다", async () => {
    const { dc: v_32dc97, hook: v_ae701f } = await v_9a4ebd(null);
    v_be73a0(() => v_32dc97.open());
    expect(v_32dc97.sent).toEqual([]);
    v_ae701f.rerender({ c: true });
    expect(v_32dc97.sent).toEqual([{ type: "face_consent", granted: true }]);
  });
  test("null->false 전이도 보낸다", async () => {
    const { dc: v_32dc97, hook: v_ae701f } = await v_9a4ebd(null);
    v_be73a0(() => v_32dc97.open());
    v_ae701f.rerender({ c: false });
    expect(v_32dc97.sent).toEqual([{ type: "face_consent", granted: false }]);
  });
});

describe("no_consent turn_face 와 say 순서", () => {
  test("sendNoConsentTurnFace 는 turn_face(no_consent) 만 보내고, say 보다 먼저 나간다", async () => {
    const { dc: v_32dc97, hook: v_ae701f } = await v_9a4ebd(false);
    v_be73a0(() => v_32dc97.open());
    v_32dc97.sent.length = 0;
    const v_05a921 = v_ae701f.result.current;

    v_b7658e(false, "나 누구야?", v_55270a, v_05a921.sendNoConsentTurnFace);
    await v_be73a0(async () => { await v_05a921.say("나 누구야?"); });
    expect(v_32dc97.sent.map((v_35f85c) => v_35f85c.type)).toEqual(["turn_face", "say"]);
    expect(v_32dc97.sent[0]).toEqual({ type: "turn_face", verdict: "no_consent", who: "self" });
  });
  test("누구냐 질문이 아니면 turn_face 없음", async () => {
    const { dc: v_32dc97, hook: v_ae701f } = await v_9a4ebd(false);
    v_be73a0(() => v_32dc97.open());
    v_32dc97.sent.length = 0;
    v_b7658e(false, "배고파", v_55270a, v_ae701f.result.current.sendNoConsentTurnFace);
    expect(v_32dc97.sent).toEqual([]);
  });
});
