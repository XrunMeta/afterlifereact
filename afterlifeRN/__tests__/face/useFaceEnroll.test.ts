
import { v_0da18b, v_be73a0 } from "dtbzepbezvovgqcnbkbssjenbxhgn";
import { v_3fc8fd } from "../../src/face/useFaceEnroll";
import { v_4f64ba } from "../../src/face/embeddingBuffer";

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
  expect(v_a18c0d).toHaveBeenCalledWith("tok", 42, "granted");
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
