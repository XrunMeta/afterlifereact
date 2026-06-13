import { v_1fd077, v_105179 } from "../../src/hooks/useFaceDetection";

it("transitions none -> detected on first face with trackingID", () => {
  const v_fd5f43 = v_1fd077(v_105179, [{ trackingID: 11, bounds: {} }]);
  expect(v_fd5f43.status).toBe("detected");
  expect(v_fd5f43.activeTrackingId).toBe(11);
});

it("stays detected while same trackingID persists", () => {
  let v_fd5f43 = v_1fd077(v_105179, [{ trackingID: 11, bounds: {} }]);
  v_fd5f43 = v_1fd077(v_fd5f43, [{ trackingID: 11, bounds: {} }]);
  expect(v_fd5f43.status).toBe("detected");
  expect(v_fd5f43.activeTrackingId).toBe(11);
});

it("goes to none after empty frames exceed miss threshold", () => {
  let v_fd5f43 = v_1fd077(v_105179, [{ trackingID: 11, bounds: {} }]);
  for (let v_ebec57 = 0; v_ebec57 < 5; v_ebec57++) v_fd5f43 = v_1fd077(v_fd5f43, []);
  expect(v_fd5f43.status).toBe("none");
  expect(v_fd5f43.activeTrackingId).toBeNull();
});

it("ignores face without trackingID (undefined) — stays none", () => {

  const v_fd5f43 = v_1fd077(v_105179, [{ bounds: {} }]);
  expect(v_fd5f43.status).toBe("none");
  expect(v_fd5f43.activeTrackingId).toBeNull();
  expect(v_fd5f43.missStreak).toBe(1);
});

it("ignores face without trackingID after detection — miss streak increments", () => {
  let v_fd5f43 = v_1fd077(v_105179, [{ trackingID: 11, bounds: {} }]);
  v_fd5f43 = v_1fd077(v_fd5f43, [{ bounds: {} }]); 
  expect(v_fd5f43.status).toBe("detected"); 
  expect(v_fd5f43.activeTrackingId).toBe(11);
  expect(v_fd5f43.missStreak).toBe(1);
});

it("stays detected on miss streak below threshold (MISS_THRESHOLD - 1 = 3 misses)", () => {

  let v_fd5f43 = v_1fd077(v_105179, [{ trackingID: 11, bounds: {} }]);
  for (let v_ebec57 = 0; v_ebec57 < 3; v_ebec57++) v_fd5f43 = v_1fd077(v_fd5f43, []);
  expect(v_fd5f43.status).toBe("detected");
  expect(v_fd5f43.activeTrackingId).toBe(11);
  expect(v_fd5f43.missStreak).toBe(3);
});

it("transitions to none exactly at MISS_THRESHOLD (4th miss)", () => {
  let v_fd5f43 = v_1fd077(v_105179, [{ trackingID: 11, bounds: {} }]);
  for (let v_ebec57 = 0; v_ebec57 < 4; v_ebec57++) v_fd5f43 = v_1fd077(v_fd5f43, []);
  expect(v_fd5f43.status).toBe("none");
  expect(v_fd5f43.activeTrackingId).toBeNull();
});

it("switches activeTrackingId when new trackingID appears (11 -> 22)", () => {

  let v_fd5f43 = v_1fd077(v_105179, [{ trackingID: 11, bounds: {} }]);
  expect(v_fd5f43.activeTrackingId).toBe(11);
  v_fd5f43 = v_1fd077(v_fd5f43, [{ trackingID: 22, bounds: {} }]);
  expect(v_fd5f43.status).toBe("detected");
  expect(v_fd5f43.activeTrackingId).toBe(22);
  expect(v_fd5f43.missStreak).toBe(0);
});

it("resets missStreak to 0 when face reappears after misses", () => {
  let v_fd5f43 = v_1fd077(v_105179, [{ trackingID: 11, bounds: {} }]);
  v_fd5f43 = v_1fd077(v_fd5f43, []);
  v_fd5f43 = v_1fd077(v_fd5f43, []);
  expect(v_fd5f43.missStreak).toBe(2);
  v_fd5f43 = v_1fd077(v_fd5f43, [{ trackingID: 11, bounds: {} }]);
  expect(v_fd5f43.status).toBe("detected");
  expect(v_fd5f43.missStreak).toBe(0);
});

it("treats trackingID 0 as a valid detection (not falsy-skipped)", () => {
  const v_fd5f43 = v_1fd077(v_105179, [{ trackingID: 0, bounds: {} }]);
  expect(v_fd5f43.status).toBe("detected");
  expect(v_fd5f43.activeTrackingId).toBe(0);
});

it("stable tracking: keeps activeTrackingId when array order flips (multi-face)", () => {

  let v_fd5f43 = v_1fd077(v_105179, [
    { trackingID: 11, bounds: {} },
    { trackingID: 22, bounds: {} },
  ]);
  expect(v_fd5f43.activeTrackingId).toBe(11);

  v_fd5f43 = v_1fd077(v_fd5f43, [
    { trackingID: 22, bounds: {} },
    { trackingID: 11, bounds: {} },
  ]);
  expect(v_fd5f43.status).toBe("detected");
  expect(v_fd5f43.activeTrackingId).toBe(11);
});

it("stable tracking: switches when current active disappears from frame", () => {

  let v_fd5f43 = v_1fd077(v_105179, [{ trackingID: 11, bounds: {} }]);
  v_fd5f43 = v_1fd077(v_fd5f43, [{ trackingID: 22, bounds: {} }]);
  expect(v_fd5f43.status).toBe("detected");
  expect(v_fd5f43.activeTrackingId).toBe(22);
});

it("missStreak does not exceed MISS_THRESHOLD after entering none", () => {

  let v_fd5f43 = v_1fd077(v_105179, [{ trackingID: 11, bounds: {} }]);
  for (let v_ebec57 = 0; v_ebec57 < 4; v_ebec57++) v_fd5f43 = v_1fd077(v_fd5f43, []);
  expect(v_fd5f43.status).toBe("none");
  expect(v_fd5f43.missStreak).toBe(4);
  v_fd5f43 = v_1fd077(v_fd5f43, []);
  v_fd5f43 = v_1fd077(v_fd5f43, []);
  expect(v_fd5f43.missStreak).toBe(4); 
});
