import {
  v_d993b0,
  v_2c25c5,
  v_a83290,
  v_87a25c,
  v_951fee,
  v_890a60,
} from "../t208MeasureStore";
import { v_069313, v_eab35e } from "../t208SilhouetteScale";

jest.mock("bxoplsnixpmvnirxbbkstg", () => ({
  manipulateAsync: jest.fn(async (v_cd1446) => ({ uri: `${v_cd1446}#durable` })),
  SaveFormat: { JPEG: "jpeg" },
}));

jest.mock("bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv", () => ({
  setItem: jest.fn(async () => undefined),
  getItem: jest.fn(async () => null),
  removeItem: jest.fn(async () => undefined),
}));

describe("t208MeasureStore", () => {
  beforeEach(async () => {
    v_eab35e(true);
    await v_2c25c5();
  });

  it("record 후 summary·ready·다음 배율 전환", async () => {
    await v_87a25c(0.95, "file:///a.jpg");
    expect(v_a83290(0.95)?.uri).toContain("file:///a.jpg");
    expect(v_890a60()).toContain("0.95: ✓");
    expect(v_951fee()).toBe(false);

    const v_a448ad = v_d993b0();
    expect(v_a448ad).toBe(0.64);
    expect(v_069313()).toBe(0.64);

    await v_87a25c(0.64, "file:///b.jpg");
    await v_87a25c(0.52, "file:///c.jpg");
    expect(v_951fee()).toBe(true);
    expect(v_d993b0()).toBeNull();
  });
});
