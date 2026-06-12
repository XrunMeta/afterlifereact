import { v_dbb337, v_de06a3 } from "bapkr";

export type DetectedFace = { trackingID?: number; bounds: unknown };
export type FaceStatus = "none" | "detected";
export type FaceState = {
  status: FaceStatus;
  activeTrackingId: number | null;
  missStreak: number;
};

export const v_105179 = {
  status: "none",
  activeTrackingId: null,
  missStreak: 0,
};

const v_e31228 = 4;

export function v_1fd077(
  v_b6e533,
  v_a51d09,
): FaceState {
  const v_52e08b = v_a51d09
    .map((v_8b5cd8) => v_8b5cd8.trackingID)
    .filter((v_389afb): v_389afb is number => typeof v_389afb === "number");

  if (v_52e08b.length > 0) {

    const v_a448ad =
      v_b6e533.activeTrackingId !== null && v_52e08b.includes(v_b6e533.activeTrackingId)
        ? v_b6e533.activeTrackingId
        : v_52e08b[0];
    return { status: "detected", activeTrackingId: v_a448ad, missStreak: 0 };
  }

  const v_90d74f = v_b6e533.missStreak + 1;
  if (v_90d74f >= v_e31228) {

    return { status: "none", activeTrackingId: null, missStreak: v_e31228 };
  }
  return { ...v_b6e533, missStreak: v_90d74f };
}

export function v_b83839() {
  const [v_b6e533, v_6be210] = v_dbb337(
    (v_fd5f43, v_a51d09) => v_1fd077(v_fd5f43, v_a51d09),
    v_105179,
  );

  const v_dfbd9a = v_de06a3(
    (v_a51d09) => v_6be210(v_a51d09),
    [],
  );

  return { faceState: v_b6e533, onFaces: v_dfbd9a };
}
