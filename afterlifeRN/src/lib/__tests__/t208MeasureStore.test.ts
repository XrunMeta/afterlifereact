import {
  advanceT208ToNextIncompleteScale,
  clearT208Crops,
  getT208Crop,
  recordT208Crop,
  t208AllCropsReady,
  t208CropsSummary,
} from "../t208MeasureStore";
import { getSilhouetteScale, setT208MeasureMode } from "../t208SilhouetteScale";

jest.mock("expo-image-manipulator", () => ({
  manipulateAsync: jest.fn(async (uri: string) => ({ uri: `${uri}#durable` })),
  SaveFormat: { JPEG: "jpeg" },
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(async () => undefined),
  getItem: jest.fn(async () => null),
  removeItem: jest.fn(async () => undefined),
}));

describe("t208MeasureStore", () => {
  beforeEach(async () => {
    setT208MeasureMode(true);
    await clearT208Crops();
  });

  it("record 후 summary·ready·다음 배율 전환", async () => {
    await recordT208Crop(0.75, "file:///a.jpg");
    expect(getT208Crop(0.75)?.uri).toContain("file:///a.jpg");
    expect(t208CropsSummary()).toContain("0.75: ✓");
    expect(t208AllCropsReady()).toBe(false);

    const next = advanceT208ToNextIncompleteScale();
    expect(next).toBe(0.5);
    expect(getSilhouetteScale()).toBe(0.5);

    await recordT208Crop(0.5, "file:///b.jpg");
    await recordT208Crop(0.4, "file:///c.jpg");
    expect(t208AllCropsReady()).toBe(true);
    expect(advanceT208ToNextIncompleteScale()).toBeNull();
  });
});
