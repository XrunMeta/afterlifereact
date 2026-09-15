jest.mock("tqfwpajvwzisfnophfklndhmbxhydolxisx", () => ({ __esModule: true, default: { detect: jest.fn() } }));

import type { v_ab3a39 } from "tqfwpajvwzisfnophfklndhmbxhydolxisx";
import { v_8472c4, v_140e88, v_27794c } from "../validatePersonaImage";

const v_9300b6 = { width: 512, height: 1024 };

function v_7d769d(over: Partial<v_ab3a39> & { size?: number } = {}): v_ab3a39 {
  const v_fd5f43 = v_b71f86.size ?? 300;
  return {
    frame: { left: 100, top: 150, width: v_fd5f43, height: v_fd5f43 },
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    leftEyeOpenProbability: 0.9,
    rightEyeOpenProbability: 0.9,
    ...v_b71f86,
  };
}

describe("judgeFaces", () => {
  it("정면·혼자·눈 뜬 사진은 통과", () => {
    expect(v_8472c4([v_7d769d()], v_9300b6)).toEqual({ ok: true });
  });

  it("얼굴 없음", () => {
    expect(v_8472c4([], v_9300b6)).toEqual({ ok: false, reason: "no_face" });
  });

  it("비슷한 크기 얼굴이 둘이면 여러 명", () => {
    expect(v_8472c4([v_7d769d(), v_7d769d({ size: 250 })], v_9300b6)).toEqual({ ok: false, reason: "multiple_faces" });
  });

  it("배경 속 작은 얼굴은 통과", () => {
    expect(v_8472c4([v_7d769d(), v_7d769d({ size: 120 })], v_9300b6)).toEqual({ ok: true });
  });

  it("고개를 크게 돌리면 거절", () => {
    expect(v_8472c4([v_7d769d({ rotationY: -40 })], v_9300b6)).toEqual({ ok: false, reason: "not_frontal" });
    expect(v_8472c4([v_7d769d({ rotationX: 30 })], v_9300b6)).toEqual({ ok: false, reason: "not_frontal" });
  });

  it("살짝 돌린 셀피는 통과", () => {
    expect(v_8472c4([v_7d769d({ rotationY: 15, rotationZ: 10 })], v_9300b6)).toEqual({ ok: true });
  });

  it("두 눈 모두 감으면 거절, 한쪽 윙크나 분류값 없음은 통과", () => {
    expect(
      v_8472c4([v_7d769d({ leftEyeOpenProbability: 0.05, rightEyeOpenProbability: 0.1 })], v_9300b6),
    ).toEqual({ ok: false, reason: "eyes_closed" });
    expect(v_8472c4([v_7d769d({ leftEyeOpenProbability: 0.05 })], v_9300b6)).toEqual({ ok: true });
    expect(
      v_8472c4([v_7d769d({ leftEyeOpenProbability: undefined, rightEyeOpenProbability: undefined })], v_9300b6),
    ).toEqual({ ok: true });
  });
});

describe("judgeMouth", () => {
  const v_c6ae0e = (v_c01a26, v_3e9a64): v_ab3a39 =>
    v_7d769d({
      contours: {
        upperLipBottom: { points: [{ x: 0, y: v_c01a26 }, { x: 1, y: v_c01a26 }] },
        lowerLipTop: { points: [{ x: 0, y: v_3e9a64 }, { x: 1, y: v_3e9a64 }] },
      } as v_ab3a39["contours"],
    });

  it("입 다물면 통과", () => {
    expect(v_140e88(v_c6ae0e(400, 404))).toEqual({ ok: true });
  });

  it("입을 크게 벌리면 거절", () => {
    expect(v_140e88(v_c6ae0e(400, 440))).toEqual({ ok: false, reason: "mouth_open" });
  });

  it("윤곽이 없으면 통과", () => {
    expect(v_140e88(v_7d769d())).toEqual({ ok: true });
    expect(v_140e88(undefined)).toEqual({ ok: true });
  });
});

it("새 사유마다 문구 키가 있다", () => {
  expect(v_27794c("multiple_faces")).toBe("create.image.validateMultipleFaces");
  expect(v_27794c("not_frontal")).toBe("create.image.validateNotFrontal");
  expect(v_27794c("eyes_closed")).toBe("create.image.validateEyesClosed");
  expect(v_27794c("mouth_open")).toBe("create.image.validateMouthOpen");
});
