import { faceTrackReducer, initialFaceState } from "../../src/hooks/useFaceDetection";

it("transitions none -> detected on first face with trackingID", () => {
  const s = faceTrackReducer(initialFaceState, [{ trackingID: 11, bounds: {} }]);
  expect(s.status).toBe("detected");
  expect(s.activeTrackingId).toBe(11);
});

it("stays detected while same trackingID persists", () => {
  let s = faceTrackReducer(initialFaceState, [{ trackingID: 11, bounds: {} }]);
  s = faceTrackReducer(s, [{ trackingID: 11, bounds: {} }]);
  expect(s.status).toBe("detected");
  expect(s.activeTrackingId).toBe(11);
});

it("goes to none after empty frames exceed miss threshold", () => {
  let s = faceTrackReducer(initialFaceState, [{ trackingID: 11, bounds: {} }]);
  for (let i = 0; i < 5; i++) s = faceTrackReducer(s, []);
  expect(s.status).toBe("none");
  expect(s.activeTrackingId).toBeNull();
});

it("ignores face without trackingID (undefined) — stays none", () => {

  const s = faceTrackReducer(initialFaceState, [{ bounds: {} }]);
  expect(s.status).toBe("none");
  expect(s.activeTrackingId).toBeNull();
  expect(s.missStreak).toBe(1);
});

it("ignores face without trackingID after detection — miss streak increments", () => {
  let s = faceTrackReducer(initialFaceState, [{ trackingID: 11, bounds: {} }]);
  s = faceTrackReducer(s, [{ bounds: {} }]); 
  expect(s.status).toBe("detected"); 
  expect(s.activeTrackingId).toBe(11);
  expect(s.missStreak).toBe(1);
});

it("stays detected on miss streak below threshold (MISS_THRESHOLD - 1 = 3 misses)", () => {

  let s = faceTrackReducer(initialFaceState, [{ trackingID: 11, bounds: {} }]);
  for (let i = 0; i < 3; i++) s = faceTrackReducer(s, []);
  expect(s.status).toBe("detected");
  expect(s.activeTrackingId).toBe(11);
  expect(s.missStreak).toBe(3);
});

it("transitions to none exactly at MISS_THRESHOLD (4th miss)", () => {
  let s = faceTrackReducer(initialFaceState, [{ trackingID: 11, bounds: {} }]);
  for (let i = 0; i < 4; i++) s = faceTrackReducer(s, []);
  expect(s.status).toBe("none");
  expect(s.activeTrackingId).toBeNull();
});

it("switches activeTrackingId when new trackingID appears (11 -> 22)", () => {

  let s = faceTrackReducer(initialFaceState, [{ trackingID: 11, bounds: {} }]);
  expect(s.activeTrackingId).toBe(11);
  s = faceTrackReducer(s, [{ trackingID: 22, bounds: {} }]);
  expect(s.status).toBe("detected");
  expect(s.activeTrackingId).toBe(22);
  expect(s.missStreak).toBe(0);
});

it("resets missStreak to 0 when face reappears after misses", () => {
  let s = faceTrackReducer(initialFaceState, [{ trackingID: 11, bounds: {} }]);
  s = faceTrackReducer(s, []);
  s = faceTrackReducer(s, []);
  expect(s.missStreak).toBe(2);
  s = faceTrackReducer(s, [{ trackingID: 11, bounds: {} }]);
  expect(s.status).toBe("detected");
  expect(s.missStreak).toBe(0);
});

it("treats trackingID 0 as a valid detection (not falsy-skipped)", () => {
  const s = faceTrackReducer(initialFaceState, [{ trackingID: 0, bounds: {} }]);
  expect(s.status).toBe("detected");
  expect(s.activeTrackingId).toBe(0);
});

it("stable tracking: keeps activeTrackingId when array order flips (multi-face)", () => {

  let s = faceTrackReducer(initialFaceState, [
    { trackingID: 11, bounds: {} },
    { trackingID: 22, bounds: {} },
  ]);
  expect(s.activeTrackingId).toBe(11);

  s = faceTrackReducer(s, [
    { trackingID: 22, bounds: {} },
    { trackingID: 11, bounds: {} },
  ]);
  expect(s.status).toBe("detected");
  expect(s.activeTrackingId).toBe(11);
});

it("stable tracking: switches when current active disappears from frame", () => {

  let s = faceTrackReducer(initialFaceState, [{ trackingID: 11, bounds: {} }]);
  s = faceTrackReducer(s, [{ trackingID: 22, bounds: {} }]);
  expect(s.status).toBe("detected");
  expect(s.activeTrackingId).toBe(22);
});

it("missStreak does not exceed MISS_THRESHOLD after entering none", () => {

  let s = faceTrackReducer(initialFaceState, [{ trackingID: 11, bounds: {} }]);
  for (let i = 0; i < 4; i++) s = faceTrackReducer(s, []);
  expect(s.status).toBe("none");
  expect(s.missStreak).toBe(4);
  s = faceTrackReducer(s, []);
  s = faceTrackReducer(s, []);
  expect(s.missStreak).toBe(4); 
});
