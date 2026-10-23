import {
  v_0a1524,
  v_21ae3d,
  v_e4eb8a,
  v_d9d053,
} from "../../src/face/faceGallery";
import type { v_ac8014 } from "../../src/api/persons";

const v_40e36e = 9194;
const v_736293 = [1, 0, 0, 0];
const v_1d813f = [0.95, 0.31, 0, 0];
const v_c03ab0 = [0, 1, 0, 0];
const v_99faa6 = [0, 0, 1, 0];
const empty: v_ac8014 = { matches: [], best: null, threshold: 0.6 };

function v_9a4ebd(v_fded81 = [{ personId: 175, displayName: "카직스", vectors: [v_736293] }]) {
  let v_8d41d7 = 0;
  const v_0b3759 = jest.fn(async () => ({ cloneId: v_40e36e, threshold: 0.6, persons: v_fded81 }));
  const v_c33c0e = jest.fn(async (): Promise<v_ac8014> => v_d6db99);
  const v_35f85c = v_0a1524({ fetchGallery: v_0b3759, serverMatch: v_c33c0e, now: () => v_8d41d7 });
  return { m: v_35f85c, fetchGallery: v_0b3759, serverMatch: v_c33c0e, tick: (v_d799e2) => (v_8d41d7 += v_d799e2) };
}

describe("createFaceMatcher", () => {
  it("갤러리를 한 번 받아 로컬로 알아본다(서버 대조 없음)", async () => {
    const { m: v_35f85c, fetchGallery: v_0b3759, serverMatch: v_c33c0e } = v_9a4ebd();
    for (let v_ebec57 = 0; v_ebec57 < 5; v_ebec57++) {
      const v_cb35cb = await v_35f85c.match("tok", v_1d813f, v_40e36e);
      expect(v_cb35cb.best?.personId).toBe(175);
      expect(v_cb35cb.best?.displayName).toBe("카직스");
    }
    expect(v_0b3759).toHaveBeenCalledTimes(1);
    expect(v_c33c0e).not.toHaveBeenCalled();
  });

  it("로컬에서 못 찾으면 서버를 한 번 부르고, 간격 안에서는 다시 부르지 않는다", async () => {
    const { m: v_35f85c, serverMatch: v_c33c0e, tick: v_9a5f22 } = v_9a4ebd();
    expect((await v_35f85c.match("tok", v_c03ab0, v_40e36e)).best).toBeNull();
    expect((await v_35f85c.match("tok", v_c03ab0, v_40e36e)).best).toBeNull();
    expect(v_c33c0e).toHaveBeenCalledTimes(1);
    v_9a5f22(v_d9d053);
    await v_35f85c.match("tok", v_c03ab0, v_40e36e);
    expect(v_c33c0e).toHaveBeenCalledTimes(2);
  });

  it("서버가 갤러리에 없는 사람을 찾으면 서버 결과를 쓰고 갤러리를 다시 받는다", async () => {
    const { m: v_35f85c, fetchGallery: v_0b3759, serverMatch: v_c33c0e } = v_9a4ebd();
    const v_715950 = { personId: 200, displayName: "새사람", score: 0.8 };
    v_c33c0e.mockResolvedValueOnce({ matches: [v_715950], best: v_715950, threshold: 0.6 });
    expect((await v_35f85c.match("tok", v_99faa6, v_40e36e)).best?.personId).toBe(200);
    await Promise.resolve();
    expect(v_0b3759).toHaveBeenCalledTimes(2);
  });

  it("서버가 selfMatch 만 알려 주면 로컬 결과에 플래그를 붙인다", async () => {
    const { m: v_35f85c, serverMatch: v_c33c0e } = v_9a4ebd();
    v_c33c0e.mockResolvedValueOnce({ ...v_d6db99, selfMatch: true });
    const v_cb35cb = await v_35f85c.match("tok", v_c03ab0, v_40e36e);
    expect(v_cb35cb.best).toBeNull();
    expect(v_cb35cb.selfMatch).toBe(true);
    expect(v_cb35cb.matches[0].personId).toBe(175);
  });

  it("서버 폴백이 실패(429 등)해도 로컬 결과로 끝난다", async () => {
    const { m: v_35f85c, serverMatch: v_c33c0e } = v_9a4ebd();
    v_c33c0e.mockRejectedValueOnce(new Error("429"));
    await expect(v_35f85c.match("tok", v_c03ab0, v_40e36e)).resolves.toMatchObject({ best: null });
  });

  it("갤러리를 못 받으면 서버 대조로 가고, 1분 동안은 다시 받지 않는다", async () => {
    const { m: v_35f85c, fetchGallery: v_0b3759, serverMatch: v_c33c0e, tick: v_9a5f22 } = v_9a4ebd();
    v_0b3759.mockRejectedValueOnce(new Error("404"));
    await v_35f85c.match("tok", v_736293, v_40e36e);
    await v_35f85c.match("tok", v_736293, v_40e36e);
    expect(v_c33c0e).toHaveBeenCalledTimes(2);
    expect(v_0b3759).toHaveBeenCalledTimes(1);
    v_9a5f22(v_21ae3d);
    expect((await v_35f85c.match("tok", v_736293, v_40e36e)).best?.personId).toBe(175);
    expect(v_0b3759).toHaveBeenCalledTimes(2);
  });

  it("등록한 벡터·이름을 바로 더하고, 삭제를 따른다", async () => {
    const { m: v_35f85c, serverMatch: v_c33c0e, tick: v_9a5f22 } = v_9a4ebd();
    await v_35f85c.match("tok", v_736293, v_40e36e);
    v_35f85c.rename(300, "친구");
    v_35f85c.addVectors(v_40e36e, 300, [v_99faa6]);
    const v_cb35cb = await v_35f85c.match("tok", v_99faa6, v_40e36e);
    expect(v_cb35cb.best).toMatchObject({ personId: 300, displayName: "친구" });
    v_35f85c.forget(300);
    v_9a5f22(v_d9d053);
    expect((await v_35f85c.match("tok", v_99faa6, v_40e36e)).best).toBeNull();
    expect(v_c33c0e).toHaveBeenCalledTimes(1);
  });

  it("유효 시간·invalidate·다른 클론이면 다시 받는다", async () => {
    const { m: v_35f85c, fetchGallery: v_0b3759, tick: v_9a5f22 } = v_9a4ebd();
    await v_35f85c.match("tok", v_736293, v_40e36e);
    v_9a5f22(v_e4eb8a);
    await v_35f85c.match("tok", v_736293, v_40e36e);
    expect(v_0b3759).toHaveBeenCalledTimes(2);
    v_35f85c.invalidate();
    await v_35f85c.match("tok", v_736293, v_40e36e);
    expect(v_0b3759).toHaveBeenCalledTimes(3);
    await v_35f85c.match("tok", v_736293, 1);
    expect(v_0b3759).toHaveBeenCalledTimes(4);
  });

  it("동시에 여러 대조가 와도 갤러리는 한 번만 받는다", async () => {
    const { m: v_35f85c, fetchGallery: v_0b3759 } = v_9a4ebd();
    await Promise.all([v_35f85c.match("tok", v_736293, v_40e36e), v_35f85c.match("tok", v_736293, v_40e36e), v_35f85c.match("tok", v_736293, v_40e36e)]);
    expect(v_0b3759).toHaveBeenCalledTimes(1);
  });
});
