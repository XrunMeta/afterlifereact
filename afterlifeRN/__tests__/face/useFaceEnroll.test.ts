
import { v_0da18b, v_be73a0 } from "dtbzepbezvovgqcnbkbssjenbxhgn";
import { v_3fc8fd, v_9e3bb7 } from "../../src/face/useFaceEnroll";
import { v_4f64ba } from "../../src/face/embeddingBuffer";
import { v_19be88 } from "../../src/face/faceEnrollGuard";

function v_a11615(v_f94e64): v_4f64ba {
  const v_83ee53 = new v_4f64ba();
  v_f94e64.forEach((v_81e2ef) => v_83ee53.push(v_81e2ef));
  return v_83ee53;
}

test("성공 경로: createPerson → saveFaceConsent → enrollFaces 순서·인자대로 호출, status=success", async () => {
  const v_306a28 = { id: 42, consentState: "none" as const };
  const v_f290ff = jest.fn().mockResolvedValue(v_306a28);
  const v_a18c0d = jest.fn().mockResolvedValue("granted");
  const v_c48ab5 = jest.fn().mockResolvedValue({ enrolled: 1 });
  const v_062bb0 = v_a11615([[1, 2], [3, 4]]);

  const { result: v_43c42e } = v_0da18b(() =>
    v_3fc8fd({
      accessToken: "tok",
      getBuffer: () => v_062bb0,
      deps: { createPersonFn: v_f290ff, saveFaceConsentFn: v_a18c0d, enrollFacesFn: v_c48ab5 },
    }),
  );

  await v_be73a0(async () => {
    await v_43c42e.current.enroll("민지");
  });

  expect(v_f290ff).toHaveBeenCalledWith("tok", { displayName: "민지" });

  expect(v_a18c0d).toHaveBeenCalledWith("tok", 42, "granted", { channel: "in_call_proxy" });
  expect(v_c48ab5).toHaveBeenCalledWith("tok", 42, [[1, 2], [3, 4]]);

  const v_b892c9 = v_f290ff.mock.invocationCallOrder[0];
  const v_607010 = v_a18c0d.mock.invocationCallOrder[0];
  const v_77f83e = v_c48ab5.mock.invocationCallOrder[0];
  expect(v_b892c9).toBeLessThan(v_607010);
  expect(v_607010).toBeLessThan(v_77f83e);

  expect(v_43c42e.current.status).toBe("success");
  expect(v_43c42e.current.error).toBeNull();
});

test("createPerson 실패 → status=error, 이후 단계 미호출", async () => {
  const v_f290ff = jest.fn().mockRejectedValue(new Error("boom"));
  const v_a18c0d = jest.fn();
  const v_c48ab5 = jest.fn();
  const v_062bb0 = v_a11615([[1, 2]]);

  const { result: v_43c42e } = v_0da18b(() =>
    v_3fc8fd({
      accessToken: "tok",
      getBuffer: () => v_062bb0,
      deps: { createPersonFn: v_f290ff, saveFaceConsentFn: v_a18c0d, enrollFacesFn: v_c48ab5 },
    }),
  );

  await v_be73a0(async () => {
    await v_43c42e.current.enroll("민지");
  });

  expect(v_a18c0d).not.toHaveBeenCalled();
  expect(v_c48ab5).not.toHaveBeenCalled();
  expect(v_43c42e.current.status).toBe("error");
  expect(v_43c42e.current.error?.message).toBe("boom");
});

test("enrollFaces 실패 후 재호출 시 createPerson/saveFaceConsent 재실행 없이 enrollFaces 만 재시도", async () => {
  const v_306a28 = { id: 7, consentState: "none" as const };
  const v_f290ff = jest.fn().mockResolvedValue(v_306a28);
  const v_a18c0d = jest.fn().mockResolvedValue("granted");
  const v_c48ab5 = jest
    .fn()
    .mockRejectedValueOnce(new Error("net"))
    .mockResolvedValueOnce({ enrolled: 1 });
  const v_062bb0 = v_a11615([[9, 9]]);

  const { result: v_43c42e } = v_0da18b(() =>
    v_3fc8fd({
      accessToken: "tok",
      getBuffer: () => v_062bb0,
      deps: { createPersonFn: v_f290ff, saveFaceConsentFn: v_a18c0d, enrollFacesFn: v_c48ab5 },
    }),
  );

  await v_be73a0(async () => {
    await v_43c42e.current.enroll("민지");
  });
  expect(v_43c42e.current.status).toBe("error");

  await v_be73a0(async () => {
    await v_43c42e.current.enroll("민지");
  });

  expect(v_f290ff).toHaveBeenCalledTimes(1);
  expect(v_a18c0d).toHaveBeenCalledTimes(1);
  expect(v_c48ab5).toHaveBeenCalledTimes(2);
  expect(v_43c42e.current.status).toBe("success");
});

test("reset() 후엔 처음부터 다시 createPerson 호출", async () => {
  const v_306a28 = { id: 7, consentState: "none" as const };
  const v_f290ff = jest.fn().mockResolvedValue(v_306a28);
  const v_a18c0d = jest.fn().mockResolvedValue("granted");
  const v_c48ab5 = jest.fn().mockResolvedValue({ enrolled: 1 });
  const v_062bb0 = v_a11615([[1, 1]]);

  const { result: v_43c42e } = v_0da18b(() =>
    v_3fc8fd({
      accessToken: "tok",
      getBuffer: () => v_062bb0,
      deps: { createPersonFn: v_f290ff, saveFaceConsentFn: v_a18c0d, enrollFacesFn: v_c48ab5 },
    }),
  );

  await v_be73a0(async () => {
    await v_43c42e.current.enroll("민지");
  });
  v_be73a0(() => {
    v_43c42e.current.reset();
  });
  expect(v_43c42e.current.status).toBe("idle");

  await v_be73a0(async () => {
    await v_43c42e.current.enroll("철수");
  });

  expect(v_f290ff).toHaveBeenCalledTimes(2);
  expect(v_f290ff).toHaveBeenNthCalledWith(2, "tok", { displayName: "철수" });
});

test("연타(동일 tick 내 두 번 호출) 시 createPerson 1회만 호출 — 두 번째는 조용히 무시", async () => {
  const v_306a28 = { id: 99, consentState: "none" as const };
  const v_f290ff = jest.fn().mockResolvedValue(v_306a28);
  const v_a18c0d = jest.fn().mockResolvedValue("granted");
  const v_c48ab5 = jest.fn().mockResolvedValue({ enrolled: 1 });
  const v_062bb0 = v_a11615([[1, 1]]);

  const { result: v_43c42e } = v_0da18b(() =>
    v_3fc8fd({
      accessToken: "tok",
      getBuffer: () => v_062bb0,
      deps: { createPersonFn: v_f290ff, saveFaceConsentFn: v_a18c0d, enrollFacesFn: v_c48ab5 },
    }),
  );

  await v_be73a0(async () => {
    const v_5b6e4b = v_43c42e.current.enroll("민지");
    const v_d6c160 = v_43c42e.current.enroll("민지"); 
    await Promise.all([v_5b6e4b, v_d6c160]);
  });

  expect(v_f290ff).toHaveBeenCalledTimes(1);
  expect(v_43c42e.current.status).toBe("success");
});

test("getPendingPersonId: idle 상태에선 null", () => {
  const v_062bb0 = v_a11615([[1, 1]]);
  const { result: v_43c42e } = v_0da18b(() =>
    v_3fc8fd({
      accessToken: "tok",
      getBuffer: () => v_062bb0,
      deps: {
        createPersonFn: jest.fn(),
        saveFaceConsentFn: jest.fn(),
        enrollFacesFn: jest.fn(),
      },
    }),
  );
  expect(v_43c42e.current.getPendingPersonId()).toBeNull();
});

test("getPendingPersonId: 부분 실패(person 생성됨·미완료) 상태에서 personId 반환", async () => {
  const v_306a28 = { id: 11, consentState: "none" as const };
  const v_f290ff = jest.fn().mockResolvedValue(v_306a28);
  const v_a18c0d = jest.fn().mockRejectedValue(new Error("net"));
  const v_c48ab5 = jest.fn();
  const v_062bb0 = v_a11615([[1, 1]]);

  const { result: v_43c42e } = v_0da18b(() =>
    v_3fc8fd({
      accessToken: "tok",
      getBuffer: () => v_062bb0,
      deps: { createPersonFn: v_f290ff, saveFaceConsentFn: v_a18c0d, enrollFacesFn: v_c48ab5 },
    }),
  );

  await v_be73a0(async () => {
    await v_43c42e.current.enroll("민지");
  });

  expect(v_43c42e.current.status).toBe("error");
  expect(v_43c42e.current.getPendingPersonId()).toBe(11);
});

test("getPendingPersonId: success 상태에선 null(완료됨)", async () => {
  const v_306a28 = { id: 12, consentState: "none" as const };
  const v_f290ff = jest.fn().mockResolvedValue(v_306a28);
  const v_a18c0d = jest.fn().mockResolvedValue("granted");
  const v_c48ab5 = jest.fn().mockResolvedValue({ enrolled: 1 });
  const v_062bb0 = v_a11615([[1, 1]]);

  const { result: v_43c42e } = v_0da18b(() =>
    v_3fc8fd({
      accessToken: "tok",
      getBuffer: () => v_062bb0,
      deps: { createPersonFn: v_f290ff, saveFaceConsentFn: v_a18c0d, enrollFacesFn: v_c48ab5 },
    }),
  );

  await v_be73a0(async () => {
    await v_43c42e.current.enroll("민지");
  });

  expect(v_43c42e.current.status).toBe("success");
  expect(v_43c42e.current.getPendingPersonId()).toBeNull();
});

test("A 부분실패 → B suggest 가드(true) → cleanup+reset → B 신규 생성(A id 재사용 아님)", async () => {
  const v_34af88 = { id: 101, consentState: "none" as const };
  const v_b57ac3 = { id: 202, consentState: "none" as const };
  const v_f290ff = jest
    .fn()
    .mockResolvedValueOnce(v_34af88)
    .mockResolvedValueOnce(v_b57ac3);

  const v_a18c0d = jest
    .fn()
    .mockRejectedValueOnce(new Error("net"))
    .mockResolvedValueOnce("granted");
  const v_c48ab5 = jest.fn().mockResolvedValue({ enrolled: 1 });
  const v_521ad6 = jest.fn().mockResolvedValue({ deleted: true });
  const v_062bb0 = v_a11615([[1, 1]]);

  const { result: v_43c42e } = v_0da18b(() =>
    v_3fc8fd({
      accessToken: "tok",
      getBuffer: () => v_062bb0,
      deps: { createPersonFn: v_f290ff, saveFaceConsentFn: v_a18c0d, enrollFacesFn: v_c48ab5 },
    }),
  );

  await v_be73a0(async () => {
    await v_43c42e.current.enroll("A");
  });
  expect(v_43c42e.current.status).toBe("error");
  expect(v_43c42e.current.getPendingPersonId()).toBe(101);

  const v_a983d4 = v_19be88({
    enrolling: v_43c42e.current.status === "enrolling",
    pendingPersonId: v_43c42e.current.getPendingPersonId(),
    incomingName: "B",
    lastName: "A",
  });
  expect(v_a983d4).toBe(true);

  if (v_a983d4) {
    await v_521ad6("tok", v_43c42e.current.getPendingPersonId());
    v_be73a0(() => {
      v_43c42e.current.reset();
    });
  }
  expect(v_521ad6).toHaveBeenCalledWith("tok", 101);
  expect(v_43c42e.current.status).toBe("idle");
  expect(v_43c42e.current.getPendingPersonId()).toBeNull();

  await v_be73a0(async () => {
    await v_43c42e.current.enroll("B");
  });
  expect(v_f290ff).toHaveBeenCalledTimes(2);
  expect(v_f290ff).toHaveBeenNthCalledWith(2, "tok", { displayName: "B" });
  expect(v_43c42e.current.status).toBe("success");
  expect(v_43c42e.current.getPendingPersonId()).toBeNull();
});

test("getSnapshot 제공 시: 캡처 이후 buffer.push 가 추가돼도 enrollFacesFn 에 전달되는 vectors 는 스냅샷 시점 벡터와 동일", async () => {
  const v_306a28 = { id: 55, consentState: "none" as const };
  const v_f290ff = jest.fn().mockResolvedValue(v_306a28);
  const v_a18c0d = jest.fn().mockResolvedValue("granted");
  const v_c48ab5 = jest.fn().mockResolvedValue({ enrolled: 1 });
  const v_062bb0 = v_a11615([[1, 1]]); 

  const v_5392c4 = v_062bb0.latest(v_9e3bb7);

  const { result: v_43c42e } = v_0da18b(() =>
    v_3fc8fd({
      accessToken: "tok",
      getBuffer: () => v_062bb0,
      getSnapshot: () => v_5392c4,
      deps: { createPersonFn: v_f290ff, saveFaceConsentFn: v_a18c0d, enrollFacesFn: v_c48ab5 },
    }),
  );

  v_062bb0.push([9, 9]);
  v_062bb0.push([9, 9]);

  await v_be73a0(async () => {
    await v_43c42e.current.enroll("민지");
  });

  expect(v_c48ab5).toHaveBeenCalledWith("tok", 55, [[1, 1]]);
});

test("getSnapshot 미제공 시: 기존 폴백대로 getBuffer().latest() 사용", async () => {
  const v_306a28 = { id: 56, consentState: "none" as const };
  const v_f290ff = jest.fn().mockResolvedValue(v_306a28);
  const v_a18c0d = jest.fn().mockResolvedValue("granted");
  const v_c48ab5 = jest.fn().mockResolvedValue({ enrolled: 1 });
  const v_062bb0 = v_a11615([[2, 2]]);

  const { result: v_43c42e } = v_0da18b(() =>
    v_3fc8fd({
      accessToken: "tok",
      getBuffer: () => v_062bb0,
      deps: { createPersonFn: v_f290ff, saveFaceConsentFn: v_a18c0d, enrollFacesFn: v_c48ab5 },
    }),
  );

  await v_be73a0(async () => {
    await v_43c42e.current.enroll("철수");
  });

  expect(v_c48ab5).toHaveBeenCalledWith("tok", 56, [[2, 2]]);
});

test("enrollSilent 성공: createPerson(enrolledVia='auto_biometric')만 호출, saveFaceConsent는 skip, enrollFaces 호출, status=success", async () => {
  const v_306a28 = { id: 77, consentState: "granted" as const };
  const v_f290ff = jest.fn().mockResolvedValue(v_306a28);
  const v_a18c0d = jest.fn();
  const v_c48ab5 = jest.fn().mockResolvedValue({ enrolled: 1 });
  const v_062bb0 = v_a11615([[5, 5]]);

  const { result: v_43c42e } = v_0da18b(() =>
    v_3fc8fd({
      accessToken: "tok",
      getBuffer: () => v_062bb0,
      deps: { createPersonFn: v_f290ff, saveFaceConsentFn: v_a18c0d, enrollFacesFn: v_c48ab5 },
    }),
  );

  await v_be73a0(async () => {
    await v_43c42e.current.enrollSilent();
  });

  expect(v_f290ff).toHaveBeenCalledWith("tok", { enrolledVia: "auto_biometric" });
  expect(v_a18c0d).not.toHaveBeenCalled();
  expect(v_c48ab5).toHaveBeenCalledWith("tok", 77, [[5, 5]]);
  expect(v_43c42e.current.status).toBe("success");
  expect(v_43c42e.current.getEnrolledPersonId()).toBe(77);
});

test("enrollSilent: createPerson 실패 → status=error, enrollFaces 미호출, getEnrolledPersonId는 null(person 미생성)", async () => {
  const v_f290ff = jest.fn().mockRejectedValue(new Error("net"));
  const v_a18c0d = jest.fn();
  const v_c48ab5 = jest.fn();
  const v_062bb0 = v_a11615([[1, 1]]);

  const { result: v_43c42e } = v_0da18b(() =>
    v_3fc8fd({
      accessToken: "tok",
      getBuffer: () => v_062bb0,
      deps: { createPersonFn: v_f290ff, saveFaceConsentFn: v_a18c0d, enrollFacesFn: v_c48ab5 },
    }),
  );

  await v_be73a0(async () => {
    await v_43c42e.current.enrollSilent();
  });

  expect(v_c48ab5).not.toHaveBeenCalled();
  expect(v_43c42e.current.status).toBe("error");
  expect(v_43c42e.current.getEnrolledPersonId()).toBeNull();
});

test("enrollSilent: enrollFaces 실패 후 재호출 시 createPerson 재실행 없이 enrollFaces만 재시도", async () => {
  const v_306a28 = { id: 88, consentState: "granted" as const };
  const v_f290ff = jest.fn().mockResolvedValue(v_306a28);
  const v_a18c0d = jest.fn();
  const v_c48ab5 = jest
    .fn()
    .mockRejectedValueOnce(new Error("net"))
    .mockResolvedValueOnce({ enrolled: 1 });
  const v_062bb0 = v_a11615([[2, 2]]);

  const { result: v_43c42e } = v_0da18b(() =>
    v_3fc8fd({
      accessToken: "tok",
      getBuffer: () => v_062bb0,
      deps: { createPersonFn: v_f290ff, saveFaceConsentFn: v_a18c0d, enrollFacesFn: v_c48ab5 },
    }),
  );

  await v_be73a0(async () => {
    await v_43c42e.current.enrollSilent();
  });
  expect(v_43c42e.current.status).toBe("error");
  expect(v_43c42e.current.getEnrolledPersonId()).toBe(88); 

  await v_be73a0(async () => {
    await v_43c42e.current.enrollSilent();
  });
  expect(v_f290ff).toHaveBeenCalledTimes(1);
  expect(v_c48ab5).toHaveBeenCalledTimes(2);
  expect(v_43c42e.current.status).toBe("success");
});

test("getEnrolledPersonId: reset() 후 null(카드 enroll()과 동일 상태 공유 확인)", async () => {
  const v_306a28 = { id: 99, consentState: "granted" as const };
  const v_f290ff = jest.fn().mockResolvedValue(v_306a28);
  const v_a18c0d = jest.fn();
  const v_c48ab5 = jest.fn().mockResolvedValue({ enrolled: 1 });
  const v_062bb0 = v_a11615([[3, 3]]);

  const { result: v_43c42e } = v_0da18b(() =>
    v_3fc8fd({
      accessToken: "tok",
      getBuffer: () => v_062bb0,
      deps: { createPersonFn: v_f290ff, saveFaceConsentFn: v_a18c0d, enrollFacesFn: v_c48ab5 },
    }),
  );

  await v_be73a0(async () => {
    await v_43c42e.current.enrollSilent();
  });
  expect(v_43c42e.current.getEnrolledPersonId()).toBe(99);

  v_be73a0(() => {
    v_43c42e.current.reset();
  });
  expect(v_43c42e.current.getEnrolledPersonId()).toBeNull();
});

test("reset() 없이 두 번째 silent 후보를 등록하면 이전 person id 로 오귀속(reset 누락의 위험성 증명)", async () => {
  const v_34af88 = { id: 201, consentState: "granted" as const };
  const v_f290ff = jest.fn().mockResolvedValueOnce(v_34af88); 
  const v_a18c0d = jest.fn();
  const v_c48ab5 = jest.fn().mockResolvedValue({ enrolled: 1 });
  const v_99dce9 = v_a11615([[1, 1]]);

  const { result: v_43c42e } = v_0da18b(() =>
    v_3fc8fd({
      accessToken: "tok",
      getBuffer: () => v_99dce9,
      deps: { createPersonFn: v_f290ff, saveFaceConsentFn: v_a18c0d, enrollFacesFn: v_c48ab5 },
    }),
  );

  await v_be73a0(async () => {
    await v_43c42e.current.enrollSilent();
  });
  expect(v_43c42e.current.getEnrolledPersonId()).toBe(201);

  await v_be73a0(async () => {
    await v_43c42e.current.enrollSilent();
  });
  expect(v_f290ff).toHaveBeenCalledTimes(1); 
  expect(v_43c42e.current.getEnrolledPersonId()).toBe(201); 
});

test("reset() 이 두 번째 silent 후보 등록 전에 선행되면 각 후보가 독립된 person 으로 생성됨(CallScreen 배선 전제)", async () => {
  const v_34af88 = { id: 301, consentState: "granted" as const };
  const v_b57ac3 = { id: 302, consentState: "granted" as const };
  const v_f290ff = jest.fn().mockResolvedValueOnce(v_34af88).mockResolvedValueOnce(v_b57ac3);
  const v_a18c0d = jest.fn();
  const v_c48ab5 = jest.fn().mockResolvedValue({ enrolled: 1 });
  const v_062bb0 = v_a11615([[1, 1]]);

  const { result: v_43c42e } = v_0da18b(() =>
    v_3fc8fd({
      accessToken: "tok",
      getBuffer: () => v_062bb0,
      deps: { createPersonFn: v_f290ff, saveFaceConsentFn: v_a18c0d, enrollFacesFn: v_c48ab5 },
    }),
  );

  await v_be73a0(async () => {
    await v_43c42e.current.enrollSilent();
  });
  expect(v_43c42e.current.getEnrolledPersonId()).toBe(301);
  v_be73a0(() => {
    v_43c42e.current.reset();
  });
  expect(v_43c42e.current.getEnrolledPersonId()).toBeNull();

  await v_be73a0(async () => {
    await v_43c42e.current.enrollSilent();
  });
  expect(v_f290ff).toHaveBeenCalledTimes(2);
  expect(v_43c42e.current.getEnrolledPersonId()).toBe(302);
});
