const mockManipulateAsync = jest.fn().mockResolvedValue({ uri: "file:///out.jpg" });
jest.mock("expo-image-manipulator", () => ({
  manipulateAsync: (...a: unknown[]) => mockManipulateAsync(...a),
  SaveFormat: { JPEG: "jpeg" },
}));

import { cropToAvatar, AVATAR_OUT } from "../cropImage";

describe("cropToAvatar", () => {
  beforeEach(() => mockManipulateAsync.mockClear());

  it("crop rect와 512x1024 resize 액션으로 manipulateAsync 호출", async () => {
    const uri = await cropToAvatar(
      "file:///in.jpg",
      { width: 1000, height: 1000 },
      { width: 100, height: 200 },
      { translateX: 0, translateY: 0, scale: 1 },
    );
    expect(uri).toBe("file:///out.jpg");
    const [inUri, actions] = mockManipulateAsync.mock.calls[0];
    expect(inUri).toBe("file:///in.jpg");
    expect(actions[0]).toEqual({ crop: { originX: 250, originY: 0, width: 500, height: 1000 } });
    expect(actions[1]).toEqual({ resize: { width: 512, height: 1024 } });
    expect(AVATAR_OUT).toEqual({ width: 512, height: 1024 });
  });
});
