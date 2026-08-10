

import { v_0da18b, v_be73a0 } from "dtbzepbezvovgqcnbkbssjenbxhgn";
import { v_fee12d, type v_be7277 } from "../useSpeechInput";

function v_7b2a3a(over: Partial<v_be7277> = {}) {
  const v_9fde29 = {};
  return {
    getPermissionsAsync: jest.fn(async () => ({ granted: true })),
    requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
    start: jest.fn(),
    stop: jest.fn(),
    addListener: jest.fn((v_1d299c, v_16dbdb) => {
      v_9fde29[v_1d299c] = v_16dbdb;
      return { remove: () => delete v_9fde29[v_1d299c] };
    }),
    ...v_b71f86,
  } as unknown as v_be7277 & {
    getPermissionsAsync: jest.Mock;
    requestPermissionsAsync: jest.Mock;
    start: jest.Mock;
  };
}

describe("useSpeechInput — 권한 요청 억제 (T-455)", () => {
  it("이미 허용된 상태면 requestPermissionsAsync 를 호출하지 않는다", async () => {
    const v_1e3df0 = v_7b2a3a();
    const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0 }));

    await v_be73a0(async () => {
      await v_43c42e.current.startListening();
    });

    expect(v_1e3df0.getPermissionsAsync).toHaveBeenCalled();
    expect(v_1e3df0.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(v_1e3df0.start).toHaveBeenCalled();
  });

  it("미허용 상태면 requestPermissionsAsync 로 승격한다", async () => {
    const v_1e3df0 = v_7b2a3a({
      getPermissionsAsync: jest.fn(async () => ({ granted: false })),
    } as any);
    const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0 }));

    await v_be73a0(async () => {
      await v_43c42e.current.startListening();
    });

    expect(v_1e3df0.requestPermissionsAsync).toHaveBeenCalled();
    expect(v_1e3df0.start).toHaveBeenCalled();
  });

  it("getPermissionsAsync 미구현 엔진은 기존 동작(요청)으로 폴백한다", async () => {
    const v_1e3df0 = v_7b2a3a({ getPermissionsAsync: undefined } as any);
    const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0 }));

    await v_be73a0(async () => {
      await v_43c42e.current.startListening();
    });

    expect(v_1e3df0.requestPermissionsAsync).toHaveBeenCalled();
  });
});
