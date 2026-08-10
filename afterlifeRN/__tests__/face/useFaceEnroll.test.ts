

jest.mock("@react-native-async-storage/async-storage", () =>
  require("../helpers/mockAsyncStorage").asyncStorageMock(),
);

import { renderHook, act } from "@testing-library/react-native";
import { useFaceEnroll, FACE_ENROLL_VECTOR_COUNT } from "../../src/face/useFaceEnroll";
import { EmbeddingBuffer } from "../../src/face/embeddingBuffer";
import { shouldCleanupOrphanOnSuggest } from "../../src/face/faceEnrollGuard";
import { decideOrphanCleanupBeforeSilent } from "../../src/face/autoEnrollGuard";

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
      cloneId: 999,
      getBuffer: () => buffer,
      deps: { createPersonFn, saveFaceConsentFn, enrollFacesFn },
    }),
  );

  await act(async () => {
    await result.current.enroll("민지");
  });

  expect(createPersonFn).toHaveBeenCalledWith("tok", { cloneId: 999, displayName: "민지" });

  expect(saveFaceConsentFn).toHaveBeenCalledWith("tok", 42, "granted", { channel: "in_call_proxy" });
  expect(enrollFacesFn).toHaveBeenCalledWith("tok", 42, [[1, 2], [3, 4]], 999);

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
      cloneId: 999,
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
      cloneId: 999,
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
      cloneId: 999,
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
  expect(createPersonFn).toHaveBeenNthCalledWith(2, "tok", { cloneId: 999, displayName: "철수" });
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
      cloneId: 999,
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
      cloneId: 999,
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
      cloneId: 999,
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
      cloneId: 999,
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
      cloneId: 999,
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
  expect(createPersonFn).toHaveBeenNthCalledWith(2, "tok", { cloneId: 999, displayName: "B" });
  expect(result.current.status).toBe("success");
  expect(result.current.getPendingPersonId()).toBeNull();
});

test("getSnapshot 제공 시: 캡처 이후 buffer.push 가 추가돼도 enrollFacesFn 에 전달되는 vectors 는 스냅샷 시점 벡터와 동일", async () => {
  const person = { id: 55, consentState: "none" as const };
  const createPersonFn = jest.fn().mockResolvedValue(person);
  const saveFaceConsentFn = jest.fn().mockResolvedValue("granted");
  const enrollFacesFn = jest.fn().mockResolvedValue({ enrolled: 1 });
  const buffer = makeBuffer([[1, 1]]); 

  const snapshot = buffer.latest(FACE_ENROLL_VECTOR_COUNT);

  const { result } = renderHook(() =>
    useFaceEnroll({
      accessToken: "tok",
      cloneId: 999,
      getBuffer: () => buffer,
      getSnapshot: () => snapshot,
      deps: { createPersonFn, saveFaceConsentFn, enrollFacesFn },
    }),
  );

  buffer.push([9, 9]);
  buffer.push([9, 9]);

  await act(async () => {
    await result.current.enroll("민지");
  });

  expect(enrollFacesFn).toHaveBeenCalledWith("tok", 55, [[1, 1]], 999);
});

test("getSnapshot 미제공 시: 기존 폴백대로 getBuffer().latest() 사용", async () => {
  const person = { id: 56, consentState: "none" as const };
  const createPersonFn = jest.fn().mockResolvedValue(person);
  const saveFaceConsentFn = jest.fn().mockResolvedValue("granted");
  const enrollFacesFn = jest.fn().mockResolvedValue({ enrolled: 1 });
  const buffer = makeBuffer([[2, 2]]);

  const { result } = renderHook(() =>
    useFaceEnroll({
      accessToken: "tok",
      cloneId: 999,
      getBuffer: () => buffer,
      deps: { createPersonFn, saveFaceConsentFn, enrollFacesFn },
    }),
  );

  await act(async () => {
    await result.current.enroll("철수");
  });

  expect(enrollFacesFn).toHaveBeenCalledWith("tok", 56, [[2, 2]], 999);
});

test("enrollSilent 성공: createPerson(enrolledVia='auto_biometric')만 호출, saveFaceConsent는 skip, enrollFaces 호출, status=success", async () => {
  const person = { id: 77, consentState: "granted" as const };
  const createPersonFn = jest.fn().mockResolvedValue(person);
  const saveFaceConsentFn = jest.fn();
  const enrollFacesFn = jest.fn().mockResolvedValue({ enrolled: 1 });
  const buffer = makeBuffer([[5, 5]]);

  const { result } = renderHook(() =>
    useFaceEnroll({
      accessToken: "tok",
      cloneId: 999,
      getBuffer: () => buffer,
      deps: { createPersonFn, saveFaceConsentFn, enrollFacesFn },
    }),
  );

  await act(async () => {
    await result.current.enrollSilent();
  });

  expect(createPersonFn).toHaveBeenCalledWith("tok", { cloneId: 999, enrolledVia: "auto_biometric" });
  expect(saveFaceConsentFn).not.toHaveBeenCalled();
  expect(enrollFacesFn).toHaveBeenCalledWith("tok", 77, [[5, 5]], 999);
  expect(result.current.status).toBe("success");
  expect(result.current.getEnrolledPersonId()).toBe(77);
});

test("enrollSilent: createPerson 실패 → status=error, enrollFaces 미호출, getEnrolledPersonId는 null(person 미생성)", async () => {
  const createPersonFn = jest.fn().mockRejectedValue(new Error("net"));
  const saveFaceConsentFn = jest.fn();
  const enrollFacesFn = jest.fn();
  const buffer = makeBuffer([[1, 1]]);

  const { result } = renderHook(() =>
    useFaceEnroll({
      accessToken: "tok",
      cloneId: 999,
      getBuffer: () => buffer,
      deps: { createPersonFn, saveFaceConsentFn, enrollFacesFn },
    }),
  );

  await act(async () => {
    await result.current.enrollSilent();
  });

  expect(enrollFacesFn).not.toHaveBeenCalled();
  expect(result.current.status).toBe("error");
  expect(result.current.getEnrolledPersonId()).toBeNull();
});

test("enrollSilent: enrollFaces 실패 후 재호출 시 createPerson 재실행 없이 enrollFaces만 재시도", async () => {
  const person = { id: 88, consentState: "granted" as const };
  const createPersonFn = jest.fn().mockResolvedValue(person);
  const saveFaceConsentFn = jest.fn();
  const enrollFacesFn = jest
    .fn()
    .mockRejectedValueOnce(new Error("net"))
    .mockResolvedValueOnce({ enrolled: 1 });
  const buffer = makeBuffer([[2, 2]]);

  const { result } = renderHook(() =>
    useFaceEnroll({
      accessToken: "tok",
      cloneId: 999,
      getBuffer: () => buffer,
      deps: { createPersonFn, saveFaceConsentFn, enrollFacesFn },
    }),
  );

  await act(async () => {
    await result.current.enrollSilent();
  });
  expect(result.current.status).toBe("error");
  expect(result.current.getEnrolledPersonId()).toBe(88); 

  await act(async () => {
    await result.current.enrollSilent();
  });
  expect(createPersonFn).toHaveBeenCalledTimes(1);
  expect(enrollFacesFn).toHaveBeenCalledTimes(2);
  expect(result.current.status).toBe("success");
});

test("getEnrolledPersonId: reset() 후 null(카드 enroll()과 동일 상태 공유 확인)", async () => {
  const person = { id: 99, consentState: "granted" as const };
  const createPersonFn = jest.fn().mockResolvedValue(person);
  const saveFaceConsentFn = jest.fn();
  const enrollFacesFn = jest.fn().mockResolvedValue({ enrolled: 1 });
  const buffer = makeBuffer([[3, 3]]);

  const { result } = renderHook(() =>
    useFaceEnroll({
      accessToken: "tok",
      cloneId: 999,
      getBuffer: () => buffer,
      deps: { createPersonFn, saveFaceConsentFn, enrollFacesFn },
    }),
  );

  await act(async () => {
    await result.current.enrollSilent();
  });
  expect(result.current.getEnrolledPersonId()).toBe(99);

  act(() => {
    result.current.reset();
  });
  expect(result.current.getEnrolledPersonId()).toBeNull();
});

test("reset() 없이 두 번째 silent 후보를 등록하면 이전 person id 로 오귀속(reset 누락의 위험성 증명)", async () => {
  const personA = { id: 201, consentState: "granted" as const };
  const createPersonFn = jest.fn().mockResolvedValueOnce(personA); 
  const saveFaceConsentFn = jest.fn();
  const enrollFacesFn = jest.fn().mockResolvedValue({ enrolled: 1 });
  const bufferA = makeBuffer([[1, 1]]);

  const { result } = renderHook(() =>
    useFaceEnroll({
      accessToken: "tok",
      cloneId: 999,
      getBuffer: () => bufferA,
      deps: { createPersonFn, saveFaceConsentFn, enrollFacesFn },
    }),
  );

  await act(async () => {
    await result.current.enrollSilent();
  });
  expect(result.current.getEnrolledPersonId()).toBe(201);

  await act(async () => {
    await result.current.enrollSilent();
  });
  expect(createPersonFn).toHaveBeenCalledTimes(1); 
  expect(result.current.getEnrolledPersonId()).toBe(201); 
});

test("reset() 이 두 번째 silent 후보 등록 전에 선행되면 각 후보가 독립된 person 으로 생성됨(CallScreen 배선 전제)", async () => {
  const personA = { id: 301, consentState: "granted" as const };
  const personB = { id: 302, consentState: "granted" as const };
  const createPersonFn = jest.fn().mockResolvedValueOnce(personA).mockResolvedValueOnce(personB);
  const saveFaceConsentFn = jest.fn();
  const enrollFacesFn = jest.fn().mockResolvedValue({ enrolled: 1 });
  const buffer = makeBuffer([[1, 1]]);

  const { result } = renderHook(() =>
    useFaceEnroll({
      accessToken: "tok",
      cloneId: 999,
      getBuffer: () => buffer,
      deps: { createPersonFn, saveFaceConsentFn, enrollFacesFn },
    }),
  );

  await act(async () => {
    await result.current.enrollSilent();
  });
  expect(result.current.getEnrolledPersonId()).toBe(301);
  act(() => {
    result.current.reset();
  });
  expect(result.current.getEnrolledPersonId()).toBeNull();

  await act(async () => {
    await result.current.enrollSilent();
  });
  expect(createPersonFn).toHaveBeenCalledTimes(2);
  expect(result.current.getEnrolledPersonId()).toBe(302);
});

test("[wiring] 카드 경로 error 잔여(personRef=A) 상태에서 다른 후보 B의 silent 제안 → 가드가 cleanup 후 B를 신규 person 으로 생성(A id 오귀속 없음)", async () => {
  const personA = { id: 401, consentState: "none" as const };
  const personB = { id: 402, consentState: "none" as const };
  const createPersonFn = jest.fn().mockResolvedValueOnce(personA).mockResolvedValueOnce(personB);

  const saveFaceConsentFn = jest.fn().mockRejectedValueOnce(new Error("net")).mockResolvedValue("granted");
  const enrollFacesFn = jest.fn().mockResolvedValue({ enrolled: 1 });
  const deletePersonFn = jest.fn().mockResolvedValue({ deleted: true });
  const buffer = makeBuffer([[1, 1]]);

  const { result } = renderHook(() =>
    useFaceEnroll({
      accessToken: "tok",
      cloneId: 999,
      getBuffer: () => buffer,
      deps: { createPersonFn, saveFaceConsentFn, enrollFacesFn },
    }),
  );

  await act(async () => {
    await result.current.enroll("A");
  });
  expect(result.current.status).toBe("error");
  expect(result.current.getPendingPersonId()).toBe(401); 

  const cleanup = decideOrphanCleanupBeforeSilent({
    enrolling: result.current.status === "enrolling",
    pendingPersonId: result.current.getPendingPersonId(),
    enrolledPersonId: result.current.getEnrolledPersonId(),
    incomingName: "B",
    lastName: "A",
  });
  expect(cleanup).toBe("delete"); 

  if (cleanup === "delete") {
    await deletePersonFn("tok", result.current.getPendingPersonId());
    act(() => {
      result.current.reset();
    });
  }
  expect(deletePersonFn).toHaveBeenCalledWith("tok", 401);
  expect(result.current.getEnrolledPersonId()).toBeNull(); 

  await act(async () => {
    await result.current.enrollSilent();
  });
  expect(createPersonFn).toHaveBeenCalledTimes(2);
  expect(result.current.getEnrolledPersonId()).toBe(402); 
  expect(enrollFacesFn).toHaveBeenLastCalledWith("tok", 402, [[1, 1]], 999); 
});

test("[wiring] cleanup 을 생략하면(버그 재현) B의 얼굴벡터가 실제로 A(401)의 person id 에 오귀속됨 — 가드의 필요성 증명", async () => {
  const personA = { id: 401, consentState: "none" as const };
  const createPersonFn = jest.fn().mockResolvedValueOnce(personA);
  const saveFaceConsentFn = jest.fn().mockRejectedValueOnce(new Error("net"));
  const enrollFacesFn = jest.fn().mockResolvedValue({ enrolled: 1 });
  const buffer = makeBuffer([[9, 9]]); 

  const { result } = renderHook(() =>
    useFaceEnroll({
      accessToken: "tok",
      cloneId: 999,
      getBuffer: () => buffer,
      deps: { createPersonFn, saveFaceConsentFn, enrollFacesFn },
    }),
  );

  await act(async () => {
    await result.current.enroll("A");
  });
  expect(result.current.status).toBe("error");

  await act(async () => {
    await result.current.enrollSilent();
  });
  expect(createPersonFn).toHaveBeenCalledTimes(1); 
  expect(enrollFacesFn).toHaveBeenLastCalledWith("tok", 401, [[9, 9]], 999); 
});

test("[wiring] success~reset() 사이 레이스(personRef=A, status=success, reset 미실행) 상태에서 다른 후보 B의 silent 제안 → detach(삭제 없이 ref만 분리) 후 B가 신규 person 으로 생성됨", async () => {
  const personA = { id: 501, consentState: "granted" as const };
  const personB = { id: 502, consentState: "granted" as const };
  const createPersonFn = jest.fn().mockResolvedValueOnce(personA).mockResolvedValueOnce(personB);
  const saveFaceConsentFn = jest.fn();
  const enrollFacesFn = jest.fn().mockResolvedValue({ enrolled: 1 });
  const deletePersonFn = jest.fn();
  const buffer = makeBuffer([[2, 2]]);

  const { result } = renderHook(() =>
    useFaceEnroll({
      accessToken: "tok",
      cloneId: 999,
      getBuffer: () => buffer,
      deps: { createPersonFn, saveFaceConsentFn, enrollFacesFn },
    }),
  );

  await act(async () => {
    await result.current.enrollSilent();
  });
  expect(result.current.status).toBe("success");
  expect(result.current.getPendingPersonId()).toBeNull(); 
  expect(result.current.getEnrolledPersonId()).toBe(501); 

  const cleanup = decideOrphanCleanupBeforeSilent({
    enrolling: false,
    pendingPersonId: result.current.getPendingPersonId(),
    enrolledPersonId: result.current.getEnrolledPersonId(),
    incomingName: "B",
    lastName: "A",
  });
  expect(cleanup).toBe("detach"); 

  if (cleanup === "detach") {
    act(() => {
      result.current.reset();
    });
  }
  expect(deletePersonFn).not.toHaveBeenCalled(); 

  await act(async () => {
    await result.current.enrollSilent();
  });
  expect(createPersonFn).toHaveBeenCalledTimes(2);
  expect(result.current.getEnrolledPersonId()).toBe(502); 
});
