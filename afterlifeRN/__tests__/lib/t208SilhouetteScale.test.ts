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

describe("T-208 measure helpers", () => {
  beforeEach(() => {
    setT208MeasureMode(false);
    clearT208Crops();
  });

  it("제품 기본 배율은 0.50 (실측 모드 OFF)", () => {
    expect(DEFAULT_SILHOUETTE_SCALE).toBe(0.5);
    expect(getSilhouetteScale()).toBe(0.5);
    expect(isT208MeasureMode()).toBe(false);
  });

  it("실측 모드 ON 시 0.75부터·순환 0.75→0.50→0.40", () => {
    setT208MeasureMode(true);
    expect(isT208MeasureMode()).toBe(true);
    expect(getSilhouetteScale()).toBe(0.75);
    expect(cycleSilhouetteScale()).toBe(0.5);
    expect(cycleSilhouetteScale()).toBe(0.4);
    expect(cycleSilhouetteScale()).toBe(0.75);
    expect(silhouetteScaleLabel(0.75)).toContain("0.75");
  });

  it("실측 모드 OFF 하면 다시 0.50", () => {
    setT208MeasureMode(true);
    setT208MeasureMode(false);
    expect(getSilhouetteScale()).toBe(0.5);
  });

  it("크롭 3종 기록·완료 판정", () => {
    recordT208Crop(0.75, "file://a");
    recordT208Crop(0.5, "file://b");
    expect(t208AllCropsReady()).toBe(false);
    recordT208Crop(0.4, "file://c");
    expect(t208AllCropsReady()).toBe(true);
    expect(getT208Crops()).toHaveLength(3);
    expect(t208CropsSummary()).toContain("✓");
  });
});
