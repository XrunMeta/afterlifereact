
import { renderHook, act } from "@testing-library/react-native";
import { useFaceEnroll } from "../../src/face/useFaceEnroll";
import { EmbeddingBuffer } from "../../src/face/embeddingBuffer";
import { shouldCleanupOrphanOnSuggest } from "../../src/face/faceEnrollGuard";

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

  expect(saveFaceConsentFn).toHaveBeenCalledWith("tok", 42, "granted", { channel: "in_call_proxy" });
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

test("연타(동일 tick 내 두 번 호출) 시 createPerson 1회만 호출 — 두 번째는 조용히 무시", async () => {
  const person = { id: 99, consentState: "none" as const };
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
    const p1 = result.current.enroll("민지");
    const p2 = result.current.enroll("민지"); 
    await Promise.all([p1, p2]);
  });

  expect(createPersonFn).toHaveBeenCalledTimes(1);
  expect(result.current.status).toBe("success");
});

test("getPendingPersonId: idle 상태에선 null", () => {
  const buffer = makeBuffer([[1, 1]]);
  const { result } = renderHook(() =>
    useFaceEnroll({
      accessToken: "tok",
      getBuffer: () => buffer,
      deps: {
        createPersonFn: jest.fn(),
        saveFaceConsentFn: jest.fn(),
        enrollFacesFn: jest.fn(),
      },
    }),
  );
  expect(result.current.getPendingPersonId()).toBeNull();
});

test("getPendingPersonId: 부분 실패(person 생성됨·미완료) 상태에서 personId 반환", async () => {
  const person = { id: 11, consentState: "none" as const };
  const createPersonFn = jest.fn().mockResolvedValue(person);
  const saveFaceConsentFn = jest.fn().mockRejectedValue(new Error("net"));
  const enrollFacesFn = jest.fn();
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

  expect(result.current.status).toBe("error");
  expect(result.current.getPendingPersonId()).toBe(11);
});

test("getPendingPersonId: success 상태에선 null(완료됨)", async () => {
  const person = { id: 12, consentState: "none" as const };
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

  expect(result.current.status).toBe("success");
  expect(result.current.getPendingPersonId()).toBeNull();
});

test("A 부분실패 → B suggest 가드(true) → cleanup+reset → B 신규 생성(A id 재사용 아님)", async () => {
  const personA = { id: 101, consentState: "none" as const };
  const personB = { id: 202, consentState: "none" as const };
  const createPersonFn = jest
    .fn()
    .mockResolvedValueOnce(personA)
    .mockResolvedValueOnce(personB);

  const saveFaceConsentFn = jest
    .fn()
    .mockRejectedValueOnce(new Error("net"))
    .mockResolvedValueOnce("granted");
  const enrollFacesFn = jest.fn().mockResolvedValue({ enrolled: 1 });
  const deletePersonFn = jest.fn().mockResolvedValue({ deleted: true });
  const buffer = makeBuffer([[1, 1]]);

  const { result } = renderHook(() =>
    useFaceEnroll({
      accessToken: "tok",
      getBuffer: () => buffer,
      deps: { createPersonFn, saveFaceConsentFn, enrollFacesFn },
    }),
  );

  await act(async () => {
    await result.current.enroll("A");
  });
  expect(result.current.status).toBe("error");
  expect(result.current.getPendingPersonId()).toBe(101);

  const cleanup = shouldCleanupOrphanOnSuggest({
    enrolling: result.current.status === "enrolling",
    pendingPersonId: result.current.getPendingPersonId(),
    incomingName: "B",
    lastName: "A",
  });
  expect(cleanup).toBe(true);

  if (cleanup) {
    await deletePersonFn("tok", result.current.getPendingPersonId());
    act(() => {
      result.current.reset();
    });
  }
  expect(deletePersonFn).toHaveBeenCalledWith("tok", 101);
  expect(result.current.status).toBe("idle");
  expect(result.current.getPendingPersonId()).toBeNull();

  await act(async () => {
    await result.current.enroll("B");
  });
  expect(createPersonFn).toHaveBeenCalledTimes(2);
  expect(createPersonFn).toHaveBeenNthCalledWith(2, "tok", { displayName: "B" });
  expect(result.current.status).toBe("success");
  expect(result.current.getPendingPersonId()).toBeNull();
});
