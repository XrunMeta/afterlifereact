

import { renderHook, act } from "@testing-library/react-native";
import { useSpeechInput, type SpeechEngine } from "../useSpeechInput";

function makeEngine(over: Partial<SpeechEngine> = {}) {
  const listeners: Record<string, (p: any) => void> = {};
  return {
    getPermissionsAsync: jest.fn(async () => ({ granted: true })),
    requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
    start: jest.fn(),
    stop: jest.fn(),
    addListener: jest.fn((ev: string, cb: (p: any) => void) => {
      listeners[ev] = cb;
      return { remove: () => delete listeners[ev] };
    }),
    ...over,
  } as unknown as SpeechEngine & {
    getPermissionsAsync: jest.Mock;
    requestPermissionsAsync: jest.Mock;
    start: jest.Mock;
  };
}

describe("useSpeechInput — 권한 요청 억제 (T-455)", () => {
  it("이미 허용된 상태면 requestPermissionsAsync 를 호출하지 않는다", async () => {
    const engine = makeEngine();
    const { result } = renderHook(() => useSpeechInput({ engine }));

    await act(async () => {
      await result.current.startListening();
    });

    expect(engine.getPermissionsAsync).toHaveBeenCalled();
    expect(engine.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(engine.start).toHaveBeenCalled();
  });

  it("미허용 상태면 requestPermissionsAsync 로 승격한다", async () => {
    const engine = makeEngine({
      getPermissionsAsync: jest.fn(async () => ({ granted: false })),
    } as any);
    const { result } = renderHook(() => useSpeechInput({ engine }));

    await act(async () => {
      await result.current.startListening();
    });

    expect(engine.requestPermissionsAsync).toHaveBeenCalled();
    expect(engine.start).toHaveBeenCalled();
  });

  it("getPermissionsAsync 미구현 엔진은 기존 동작(요청)으로 폴백한다", async () => {
    const engine = makeEngine({ getPermissionsAsync: undefined } as any);
    const { result } = renderHook(() => useSpeechInput({ engine }));

    await act(async () => {
      await result.current.startListening();
    });

    expect(engine.requestPermissionsAsync).toHaveBeenCalled();
  });
});
