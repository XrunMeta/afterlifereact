import {
  v_be2f9f,
  v_22f27b,
  v_4fd509,
} from "../../src/face/speakerIdReducer";

it("같은 personId 3연속 → 3번째에 speaker_confirmed 1회, 4번째부터 null", () => {
  let s: v_4fd509 = v_22f27b;
  const v_bdad26 = { personId: 7, displayName: "철수", score: 0.9 };

  let v_cb35cb = v_be2f9f(v_fd5f43, v_bdad26);
  expect(v_cb35cb.event).toBeNull();
  v_fd5f43 = v_cb35cb.state;

  v_cb35cb = v_be2f9f(v_fd5f43, v_bdad26);
  expect(v_cb35cb.event).toBeNull();
  v_fd5f43 = v_cb35cb.state;

  v_cb35cb = v_be2f9f(v_fd5f43, v_bdad26);
  expect(v_cb35cb.event).toEqual({ type: "speaker_confirmed", personId: 7, displayName: "철수" });
  v_fd5f43 = v_cb35cb.state;

  v_cb35cb = v_be2f9f(v_fd5f43, v_bdad26);
  expect(v_cb35cb.event).toBeNull();
});

it("2연속 후 다른 person → streak 리셋, 이벤트 없음", () => {
  let s: v_4fd509 = v_22f27b;
  const v_779914 = { personId: 1, displayName: "A", score: 0.9 };
  const v_148ff6 = { personId: 2, displayName: "B", score: 0.9 };

  let v_cb35cb = v_be2f9f(v_fd5f43, v_779914);
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_779914);
  v_fd5f43 = v_cb35cb.state;
  expect(v_fd5f43.streak).toBe(2);

  v_cb35cb = v_be2f9f(v_fd5f43, v_148ff6);
  expect(v_cb35cb.event).toBeNull();
  expect(v_cb35cb.state.streak).toBe(1);
  expect(v_cb35cb.state.candidate).toBe(2);
});

it("null(unknown) 3연속 → unknown_face 1회", () => {
  let s: v_4fd509 = v_22f27b;
  const v_ceb55a = { personId: null, displayName: null, score: 0 };

  let v_cb35cb = v_be2f9f(v_fd5f43, v_ceb55a);
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_ceb55a);
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_ceb55a);
  expect(v_cb35cb.event).toEqual({ type: "unknown_face" });
});

it("confirmed A 상태에서 B 3연속 → B로 speaker_confirmed(화자 교대)", () => {
  let s: v_4fd509 = v_22f27b;
  const v_779914 = { personId: 1, displayName: "A", score: 0.9 };
  const v_148ff6 = { personId: 2, displayName: "B", score: 0.9 };

  let v_cb35cb = v_be2f9f(v_fd5f43, v_779914);
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_779914);
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_779914);
  v_fd5f43 = v_cb35cb.state;
  expect(v_fd5f43.confirmed).toBe(1);

  v_cb35cb = v_be2f9f(v_fd5f43, v_148ff6);
  expect(v_cb35cb.event).toBeNull();
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_148ff6);
  expect(v_cb35cb.event).toBeNull();
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_148ff6);
  expect(v_cb35cb.event).toEqual({ type: "speaker_confirmed", personId: 2, displayName: "B" });
});

it("이미 confirmed된 대상과 같은 후보가 다시 3연속 되어도 이벤트 재발행 금지", () => {
  let s: v_4fd509 = v_22f27b;
  const v_779914 = { personId: 1, displayName: "A", score: 0.9 };
  const v_148ff6 = { personId: 2, displayName: "B", score: 0.9 };

  for (let v_ebec57 = 0; v_ebec57 < 3; v_ebec57++) {
    const v_cb35cb = v_be2f9f(v_fd5f43, v_779914);
    v_fd5f43 = v_cb35cb.state;
  }
  expect(v_fd5f43.confirmed).toBe(1);

  let v_cb35cb = v_be2f9f(v_fd5f43, v_148ff6);
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_148ff6);
  v_fd5f43 = v_cb35cb.state;

  v_cb35cb = v_be2f9f(v_fd5f43, v_779914);
  expect(v_cb35cb.event).toBeNull(); 
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_779914);
  expect(v_cb35cb.event).toBeNull(); 
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_779914);
  expect(v_cb35cb.event).toBeNull(); 
  expect(v_cb35cb.state.confirmed).toBe(1);
});

it("confirmed unknown 상태에서 known으로 3연속 → known으로 speaker_confirmed", () => {
  let s: v_4fd509 = v_22f27b;
  const v_ceb55a = { personId: null, displayName: null, score: 0 };
  const v_779914 = { personId: 5, displayName: "철수", score: 0.9 };

  for (let v_ebec57 = 0; v_ebec57 < 3; v_ebec57++) {
    const v_cb35cb = v_be2f9f(v_fd5f43, v_ceb55a);
    v_fd5f43 = v_cb35cb.state;
  }
  expect(v_fd5f43.confirmed).toBe("unknown");

  let v_cb35cb = v_be2f9f(v_fd5f43, v_779914);
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_779914);
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_779914);
  expect(v_cb35cb.event).toEqual({ type: "speaker_confirmed", personId: 5, displayName: "철수" });
});

it("streak은 항상 정수이며 음수/NaN이 되지 않는다(경계)", () => {
  let s: v_4fd509 = v_22f27b;
  const v_779914 = { personId: 1, displayName: "A", score: 0.9 };
  const v_cb35cb = v_be2f9f(v_fd5f43, v_779914);
  expect(v_cb35cb.state.streak).toBe(1);
  expect(Number.isInteger(v_cb35cb.state.streak)).toBe(true);
});
