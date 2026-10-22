import { v_0da18b, v_be73a0 } from "dtbzepbezvovgqcnbkbssjenbxhgn";
import { v_33d47b } from "../../src/face/useFaceCheckScheduler";

function v_9a4ebd(v_f8b770 = true) {
  const v_576f5a = jest.fn();
  const v_ae701f = v_0da18b((v_e2a85c) => v_33d47b({ request: v_576f5a, userTurnActive: v_e2a85c.active }), {
    initialProps: { active: v_f8b770 },
  });
  return { request: v_576f5a, hook: v_ae701f };
}
const v_660ac0 = (v_d799e2) => v_be73a0(() => { jest.advanceTimersByTime(v_d799e2); });

describe("useFaceCheckScheduler", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test("speech start requests now and every 2s while turn active", () => {
    const { request: v_576f5a, hook: v_ae701f } = v_9a4ebd();
    v_be73a0(() => v_ae701f.result.current.onUserSpeechStart());
    expect(v_576f5a).toHaveBeenCalledTimes(1);
    v_660ac0(2000);
    expect(v_576f5a).toHaveBeenCalledTimes(2);
    v_660ac0(2000);
    expect(v_576f5a).toHaveBeenCalledTimes(3);
  });

  test("stops repeating when userTurnActive false, no restart until next speech start", () => {
    const { request: v_576f5a, hook: v_ae701f } = v_9a4ebd();
    v_be73a0(() => v_ae701f.result.current.onUserSpeechStart());
    v_ae701f.rerender({ active: false });
    v_660ac0(6000);
    expect(v_576f5a).toHaveBeenCalledTimes(1);
    v_ae701f.rerender({ active: true });
    v_660ac0(6000);
    expect(v_576f5a).toHaveBeenCalledTimes(1);
  });

  test("repeated onUserSpeechStart does not stack intervals", () => {
    const { request: v_576f5a, hook: v_ae701f } = v_9a4ebd();
    v_be73a0(() => {
      v_ae701f.result.current.onUserSpeechStart();
      v_ae701f.result.current.onUserSpeechStart();
    });
    expect(v_576f5a).toHaveBeenCalledTimes(1);
    v_660ac0(2000);
    expect(v_576f5a).toHaveBeenCalledTimes(2);
  });

  test("clone speech end schedules at remaining-2000", () => {
    const { request: v_576f5a, hook: v_ae701f } = v_9a4ebd();
    v_be73a0(() => v_ae701f.result.current.onCloneSpeechEnd(5000));
    v_660ac0(2999);
    expect(v_576f5a).not.toHaveBeenCalled();
    v_660ac0(1);
    expect(v_576f5a).toHaveBeenCalledTimes(1);
    v_660ac0(10000);
    expect(v_576f5a).toHaveBeenCalledTimes(1);
  });

  test("clone speech end with remaining<2000 or null/NaN requests immediately", () => {
    for (const v_81e2ef of [1000, 0, null, undefined, NaN]) {
      const { request: v_576f5a, hook: v_ae701f } = v_9a4ebd();
      v_be73a0(() => v_ae701f.result.current.onCloneSpeechEnd(v_81e2ef as any));
      v_660ac0(0);
      expect(v_576f5a).toHaveBeenCalledTimes(1);
      v_ae701f.unmount();
    }
  });

  test("newer clone speech end replaces pending one", () => {
    const { request: v_576f5a, hook: v_ae701f } = v_9a4ebd();
    v_be73a0(() => v_ae701f.result.current.onCloneSpeechEnd(5000));
    v_660ac0(1000);
    v_be73a0(() => v_ae701f.result.current.onCloneSpeechEnd(5000));
    v_660ac0(2000); 
    expect(v_576f5a).not.toHaveBeenCalled();
    v_660ac0(1000); 
    expect(v_576f5a).toHaveBeenCalledTimes(1);
  });

  test("who asked requests once after 2000ms; newer call replaces", () => {
    const { request: v_576f5a, hook: v_ae701f } = v_9a4ebd();
    v_be73a0(() => v_ae701f.result.current.onWhoAsked());
    v_660ac0(1000);
    v_be73a0(() => v_ae701f.result.current.onWhoAsked());
    v_660ac0(1999);
    expect(v_576f5a).not.toHaveBeenCalled();
    v_660ac0(1);
    expect(v_576f5a).toHaveBeenCalledTimes(1);
    v_660ac0(5000);
    expect(v_576f5a).toHaveBeenCalledTimes(1);
  });

  test("burst(2) requests at 0 and 300ms", () => {
    const { request: v_576f5a, hook: v_ae701f } = v_9a4ebd();
    v_be73a0(() => v_ae701f.result.current.burst(2));
    v_660ac0(0);
    expect(v_576f5a).toHaveBeenCalledTimes(1);
    v_660ac0(299);
    expect(v_576f5a).toHaveBeenCalledTimes(1);
    v_660ac0(1);
    expect(v_576f5a).toHaveBeenCalledTimes(2);
  });

  test("burst(0) does nothing; new burst cancels previous", () => {
    const { request: v_576f5a, hook: v_ae701f } = v_9a4ebd();
    v_be73a0(() => v_ae701f.result.current.burst(0));
    v_be73a0(() => v_ae701f.result.current.burst(-1));
    v_660ac0(1000);
    expect(v_576f5a).not.toHaveBeenCalled();
    v_be73a0(() => v_ae701f.result.current.burst(3));
    v_660ac0(0);
    v_be73a0(() => v_ae701f.result.current.burst(1));
    v_660ac0(2000);

    expect(v_576f5a).toHaveBeenCalledTimes(2);
  });

  test("cancelAll clears pending timers and interval", () => {
    const { request: v_576f5a, hook: v_ae701f } = v_9a4ebd();
    v_be73a0(() => {
      v_ae701f.result.current.onUserSpeechStart();
      v_ae701f.result.current.onCloneSpeechEnd(5000);
      v_ae701f.result.current.onWhoAsked();
      v_ae701f.result.current.burst(3);
    });
    v_660ac0(0);
    const v_e98932 = v_576f5a.mock.calls.length;
    v_be73a0(() => v_ae701f.result.current.cancelAll());
    v_660ac0(20000);
    expect(v_576f5a).toHaveBeenCalledTimes(v_e98932);
  });

  test("unmount clears all timers", () => {
    const { request: v_576f5a, hook: v_ae701f } = v_9a4ebd();
    v_be73a0(() => {
      v_ae701f.result.current.onUserSpeechStart();
      v_ae701f.result.current.onWhoAsked();
    });
    v_ae701f.unmount();
    v_660ac0(20000);
    expect(v_576f5a).toHaveBeenCalledTimes(1);
  });

  test("uses latest request without resubscribing", () => {
    const v_ea719c = jest.fn();
    const v_486a80 = jest.fn();
    const v_ae701f = v_0da18b((v_e2a85c) => v_33d47b({ request: v_e2a85c.r, userTurnActive: true }), {
      initialProps: { r: v_ea719c },
    });
    v_be73a0(() => v_ae701f.result.current.onUserSpeechStart());
    v_ae701f.rerender({ r: v_486a80 });
    v_660ac0(2000);
    expect(v_ea719c).toHaveBeenCalledTimes(1);
    expect(v_486a80).toHaveBeenCalledTimes(1);
  });
  test("burst with non-finite count does nothing (no infinite loop)", () => {
    const { request: v_576f5a, hook: v_ae701f } = v_9a4ebd();
    v_be73a0(() => v_ae701f.result.current.burst(Infinity));
    v_be73a0(() => v_ae701f.result.current.burst(NaN));
    v_660ac0(3000);
    expect(v_576f5a).not.toHaveBeenCalled();
  });

  test("request receives the trigger reason", () => {
    const { request: v_576f5a, hook: v_ae701f } = v_9a4ebd();
    v_be73a0(() => v_ae701f.result.current.onUserSpeechStart());
    expect(v_576f5a).toHaveBeenLastCalledWith("user_speech");
    v_be73a0(() => v_ae701f.result.current.onCloneSpeechEnd(0));
    v_660ac0(0);
    expect(v_576f5a).toHaveBeenLastCalledWith("clone_tail");
    v_be73a0(() => v_ae701f.result.current.burst(1));
    v_660ac0(0);
    expect(v_576f5a).toHaveBeenLastCalledWith("burst");
    v_be73a0(() => v_ae701f.result.current.onWhoAsked());
    v_660ac0(2000);
    expect(v_576f5a).toHaveBeenLastCalledWith("who_retry");
  });
});
