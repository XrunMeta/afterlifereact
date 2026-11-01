jest.mock("tqfwpajvwzisfnophfklndhmbxhydolxisx", () => ({ __esModule: true, default: { detect: jest.fn() } }));
jest.mock("../../api/files", () => ({ uploadFile: jest.fn() }));
jest.mock("../../api/clones", () => ({ checkPersonaFace: jest.fn() }));
jest.mock("../../stores/authStore", () => ({ useAuthStore: { getState: () => ({ accessToken: "tok" }) } }));

import { v_11fdee, v_5782dc, type v_c5eabc } from "../personaImageCheck";

function v_4f01f6(v_b71f86 = {}): Required<Omit<v_c5eabc, "onServerCheckStart">> & Record<string, jest.Mock> {
  return {
    validate: jest.fn().mockResolvedValue({ ok: false, reason: "no_face" }),
    upload: jest.fn().mockResolvedValue({ id: 7 }),
    check: jest.fn().mockResolvedValue({ ok: true }),
    getToken: jest.fn().mockReturnValue("tok"),
    ...v_b71f86,
  } as never;
}
const v_c3e33d = { ok: false, reason: "no_face" };

describe("validatePersonaImageWithServer", () => {
  it("server_not_called_when_ok", async () => {
    const v_d5dda0 = v_4f01f6({ validate: jest.fn().mockResolvedValue({ ok: true }) });
    expect(await v_11fdee("u", v_d5dda0 as never)).toEqual({ ok: true });
    expect(v_d5dda0.upload).not.toHaveBeenCalled();
    expect(v_d5dda0.check).not.toHaveBeenCalled();
  });
  it("server_not_called_for_other_reasons", async () => {
    const v_cb35cb = { ok: false, reason: "eyes_closed" };
    const v_d5dda0 = v_4f01f6({ validate: jest.fn().mockResolvedValue(v_cb35cb) });
    expect(await v_11fdee("u", v_d5dda0 as never)).toEqual(v_cb35cb);
    expect(v_d5dda0.upload).not.toHaveBeenCalled();
    expect(v_d5dda0.check).not.toHaveBeenCalled();
  });
  it("no_face_then_server_ok_passes", async () => {
    const v_d5dda0 = v_4f01f6();
    const v_2ab9a4 = jest.fn();
    expect(await v_11fdee("u", { ...v_d5dda0, onServerCheckStart: v_2ab9a4 } as never)).toEqual({ ok: true });
    expect(v_d5dda0.upload).toHaveBeenCalledWith("tok", "u", { purpose: "clone_avatar" });
    expect(v_d5dda0.check).toHaveBeenCalledWith("tok", { src_file_id: 7 });
    expect(v_2ab9a4).toHaveBeenCalledTimes(1);
  });
  it("no_face_then_server_no_face_rejects", async () => {
    const v_d5dda0 = v_4f01f6({ check: jest.fn().mockResolvedValue({ ok: false, reason: "NO_FACE" }) });
    expect(await v_11fdee("u", v_d5dda0 as never)).toEqual(v_c3e33d);
  });
  it("upload_throws_rejects_no_face", async () => {
    const v_d5dda0 = v_4f01f6({ upload: jest.fn().mockRejectedValue(new Error("x")) });
    expect(await v_11fdee("u", v_d5dda0 as never)).toEqual(v_c3e33d);
    expect(v_d5dda0.check).not.toHaveBeenCalled();
  });
  it("check_throws_rejects_no_face", async () => {
    const v_d5dda0 = v_4f01f6({ check: jest.fn().mockRejectedValue(new Error("x")) });
    expect(await v_11fdee("u", v_d5dda0 as never)).toEqual(v_c3e33d);
  });
  it("no_token_rejects_no_face", async () => {
    const v_d5dda0 = v_4f01f6({ getToken: jest.fn().mockReturnValue(null) });
    expect(await v_11fdee("u", v_d5dda0 as never)).toEqual(v_c3e33d);
    expect(v_d5dda0.upload).not.toHaveBeenCalled();
  });
  it("timeout_rejects_no_face", async () => {
    jest.useFakeTimers();
    try {
      const v_d5dda0 = v_4f01f6({ upload: jest.fn().mockReturnValue(new Promise(() => undefined)) });
      const v_e2a85c = v_11fdee("u", v_d5dda0 as never);
      await jest.advanceTimersByTimeAsync(v_5782dc + 1);
      expect(await v_e2a85c).toEqual(v_c3e33d);
      expect(v_d5dda0.check).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });
});
