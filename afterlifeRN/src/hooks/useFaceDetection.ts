import { useReducer, useCallback } from "react";

export type DetectedFace = { trackingID?: number; bounds: unknown };
export type FaceStatus = "none" | "detected";
export type FaceState = {
  status: FaceStatus;
  activeTrackingId: number | null;
  missStreak: number;
};

export const initialFaceState: FaceState = {
  status: "none",
  activeTrackingId: null,
  missStreak: 0,
};

const MISS_THRESHOLD = 4;

export function faceTrackReducer(
  state: FaceState,
  faces: DetectedFace[],
): FaceState {
  const ids = faces
    .map((f) => f.trackingID)
    .filter((id): id is number => typeof id === "number");

  if (ids.length > 0) {

    const next =
      state.activeTrackingId !== null && ids.includes(state.activeTrackingId)
        ? state.activeTrackingId
        : ids[0];
    return { status: "detected", activeTrackingId: next, missStreak: 0 };
  }

  const miss = state.missStreak + 1;
  if (miss >= MISS_THRESHOLD) {

    return { status: "none", activeTrackingId: null, missStreak: MISS_THRESHOLD };
  }
  return { ...state, missStreak: miss };
}

export function useFaceDetection() {
  const [state, dispatch] = useReducer(
    (s: FaceState, faces: DetectedFace[]) => faceTrackReducer(s, faces),
    initialFaceState,
  );

  const onFaces = useCallback(
    (faces: DetectedFace[]) => dispatch(faces),
    [],
  );

  return { faceState: state, onFaces };
}
