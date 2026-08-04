import {
  DEFAULT_SILHOUETTE_SCALE,
  cycleSilhouetteScale,
  getSilhouetteScale,
  isT208MeasureMode,
  setT208MeasureMode,
  silhouetteScaleLabel,
} from "../../src/lib/t208SilhouetteScale";
import {
  clearT208Crops,
  getT208Crops,
  recordT208Crop,
  t208AllCropsReady,
  t208CropsSummary,
} from "../../src/lib/t208MeasureStore";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

describe("T-208 measure helpers", () => {
  beforeEach(async () => {
    setT208MeasureMode(false);
    await clearT208Crops();
  });

  it("제품 기본 배율은 0.95 — 프레임폭 기준 (실측 모드 OFF)", () => {
    expect(DEFAULT_SILHOUETTE_SCALE).toBe(0.95);
    expect(getSilhouetteScale()).toBe(0.95);
    expect(isT208MeasureMode()).toBe(false);
  });

  it("실측 모드 ON 시 0.95부터·순환 0.95→0.64→0.52", () => {
    setT208MeasureMode(true);
    expect(isT208MeasureMode()).toBe(true);
    expect(getSilhouetteScale()).toBe(0.95);
    expect(cycleSilhouetteScale()).toBe(0.64);
    expect(cycleSilhouetteScale()).toBe(0.52);
    expect(cycleSilhouetteScale()).toBe(0.95);
    expect(silhouetteScaleLabel(0.95)).toContain("0.95");
  });

  it("실측 모드 OFF 하면 다시 0.95", () => {
    setT208MeasureMode(true);
    setT208MeasureMode(false);
    expect(getSilhouetteScale()).toBe(0.95);
  });

  it("크롭 3종 기록·완료 판정", async () => {

    await recordT208Crop(0.95, "file://a");
    await recordT208Crop(0.64, "file://b");
    expect(t208AllCropsReady()).toBe(false);
    await recordT208Crop(0.52, "file://c");
    expect(t208AllCropsReady()).toBe(true);
    expect(getT208Crops()).toHaveLength(3);
    expect(t208CropsSummary()).toContain("✓");
  });
});
