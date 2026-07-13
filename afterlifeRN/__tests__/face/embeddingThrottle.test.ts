import { v_f7b672, v_4043e6 as v_fe37f7 } from "../../src/face/embeddingThrottle";

it("스로틀 간격 미만이면 false, 이상이면 true", () => {
  expect(v_f7b672(v_fe37f7, v_fe37f7 + v_fe37f7 - 1)).toBe(false);
  expect(v_f7b672(v_fe37f7, v_fe37f7 + v_fe37f7)).toBe(true);
});

it("경계 초과도 true", () => {
  expect(v_f7b672(v_fe37f7, v_fe37f7 + v_fe37f7 + 500)).toBe(true);
});

it("lastRunMs가 0이고 nowMs가 스로틀 간격 이상이면 true", () => {
  expect(v_f7b672(0, v_fe37f7)).toBe(true);
});
