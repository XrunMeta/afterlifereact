
import { renderHook, act } from "@testing-library/react-native";
import { useFaceEnroll } from "../../src/face/useFaceEnroll";
import { EmbeddingBuffer } from "../../src/face/embeddingBuffer";

function makeBuffer(vectors: number[][]): EmbeddingBuffer {
  const buf = new EmbeddingBuffer();
  vectors.forEach((v) => buf.push(v));
  return buf;
}

test("성공 경로: createPerson → saveFaceConsent → enrollFaces 순서·인자대로 호출, status=success", async () => {
  const person = { id: 42, consentState: "none" as const };
  const createPersonFn = jest.fn().mockResolvedValue(person);
  const saveFaceConsentFn = jest.fn().mockResolvedValue("granted");
  const enrollFacesFn = jest.fn().mockResolvedValue({ enrolled: 1 });
  const buffer = makeBuffer([[1, 2], [3, 4]]);

  const { result } = renderHook(() =>
    useFaceEnroll({
      accessToken: "tok",
      getBuffer: () => buffer,
      deps: { createPersonFn, saveFaceConsentFn, enrollFacesFn },
    }),
  );

  await act(async () => {
    await result.current.enroll("민지");
  });

  expect(createPersonFn).toHaveBeenCalledWith("tok", { displayName: "민지" });
  expect(saveFaceConsentFn).toHaveBeenCalledWith("tok", 42, "granted");
  expect(enrollFacesFn).toHaveBeenCalledWith("tok", 42, [[1, 2], [3, 4]]);

  const createOrder = createPersonFn.mock.invocationCallOrder[0];
  const consentOrder = saveFaceConsentFn.mock.invocationCallOrder[0];
  const enrollOrder = enrollFacesFn.mock.invocationCallOrder[0];
  expect(createOrder).toBeLessThan(consentOrder);
  expect(consentOrder).toBeLessThan(enrollOrder);

  expect(result.current.status).toBe("success");
  expect(result.current.error).toBeNull();
});

test("createPerson 실패 → status=error, 이후 단계 미호출", async () => {
  const createPersonFn = jest.fn().mockRejectedValue(new Error("boom"));
  const saveFaceConsentFn = jest.fn();
  const enrollFacesFn = jest.fn();
  const buffer = makeBuffer([[1, 2]]);

  const { result } = renderHook(() =>
    useFaceEnroll({
      accessToken: "tok",
      getBuffer: () => buffer,
      deps: { createPersonFn, saveFaceConsentFn, enrollFacesFn },
    }),
  );

  await act(async () => {
    await result.current.enroll("민지");
  });

  expect(saveFaceConsentFn).not.toHaveBeenCalled();
  expect(enrollFacesFn).not.toHaveBeenCalled();
  expect(result.current.status).toBe("error");
  expect(result.current.error?.message).toBe("boom");
});

test("enrollFaces 실패 후 재호출 시 createPerson/saveFaceConsent 재실행 없이 enrollFaces 만 재시도", async () => {
  const person = { id: 7, consentState: "none" as const };
  const createPersonFn = jest.fn().mockResolvedValue(person);
  const saveFaceConsentFn = jest.fn().mockResolvedValue("granted");
  const enrollFacesFn = jest
    .fn()
    .mockRejectedValueOnce(new Error("net"))
    .mockResolvedValueOnce({ enrolled: 1 });
  const buffer = makeBuffer([[9, 9]]);

  const { result } = renderHook(() =>
    useFaceEnroll({
      accessToken: "tok",
      getBuffer: () => buffer,
      deps: { createPersonFn, saveFaceConsentFn, enrollFacesFn },
    }),
  );

  await act(async () => {
    await result.current.enroll("민지");
  });
  expect(result.current.status).toBe("error");

  await act(async () => {
    await result.current.enroll("민지");
  });

  expect(createPersonFn).toHaveBeenCalledTimes(1);
  expect(saveFaceConsentFn).toHaveBeenCalledTimes(1);
  expect(enrollFacesFn).toHaveBeenCalledTimes(2);
  expect(result.current.status).toBe("success");
});

test("reset() 후엔 처음부터 다시 createPerson 호출", async () => {
  const person = { id: 7, consentState: "none" as const };
  const createPersonFn = jest.fn().mockResolvedValue(person);
  const saveFaceConsentFn = jest.fn().mockResolvedValue("granted");
  const enrollFacesFn = jest.fn().mockResolvedValue({ enrolled: 1 });
  const buffer = makeBuffer([[1, 1]]);

  const { result } = renderHook(() =>
    useFaceEnroll({
      accessToken: "tok",
      getBuffer: () => buffer,
      deps: { createPersonFn, saveFaceConsentFn, enrollFacesFn },
    }),
  );

  await act(async () => {
    await result.current.enroll("민지");
  });
  act(() => {
    result.current.reset();
  });
  expect(result.current.status).toBe("idle");

  await act(async () => {
    await result.current.enroll("철수");
  });

  expect(createPersonFn).toHaveBeenCalledTimes(2);
  expect(createPersonFn).toHaveBeenNthCalledWith(2, "tok", { displayName: "철수" });
});
