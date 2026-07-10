

import { useCallback, useRef, useState } from "react";
import { createPerson, saveFaceConsent, enrollFaces } from "../api/persons";
import type { EmbeddingBuffer } from "./embeddingBuffer";

export const FACE_ENROLL_VECTOR_COUNT = 3;

export const FACE_ENROLL_CONSENT_CHANNEL = "in_call_proxy";

export type FaceEnrollStatus = "idle" | "enrolling" | "success" | "error";

export interface FaceEnrollDeps {
  createPersonFn: typeof createPerson;
  saveFaceConsentFn: typeof saveFaceConsent;
  enrollFacesFn: typeof enrollFaces;
}

const defaultDeps: FaceEnrollDeps = {
  createPersonFn: createPerson,
  saveFaceConsentFn: saveFaceConsent,
  enrollFacesFn: enrollFaces,
};

export interface UseFaceEnrollOptions {
  accessToken: string;

  getBuffer: () => EmbeddingBuffer;

  getSnapshot?: () => number[][] | null;

  deps?: FaceEnrollDeps;
}

export interface UseFaceEnrollResult {
  status: FaceEnrollStatus;
  error: Error | null;

  enroll: (name: string) => Promise<void>;

  enrollSilent: () => Promise<void>;

  reset: () => void;

  getPendingPersonId: () => number | null;

  getEnrolledPersonId: () => number | null;
}

export function useFaceEnroll(opts: UseFaceEnrollOptions): UseFaceEnrollResult {
  const { accessToken, getBuffer, getSnapshot } = opts;
  const deps = opts.deps ?? defaultDeps;
  const [status, setStatus] = useState<FaceEnrollStatus>("idle");
  const [error, setError] = useState<Error | null>(null);

  const personRef = useRef<{ id: number } | null>(null);
  const consentDoneRef = useRef(false);

  const enrollingRef = useRef(false);

  const enroll = useCallback(
    async (name: string) => {
      if (enrollingRef.current) return; 
      enrollingRef.current = true;
      setStatus("enrolling");
      setError(null);
      try {
        let person = personRef.current;
        if (!person) {
          person = await deps.createPersonFn(accessToken, { displayName: name });
          personRef.current = person;
        }
        if (!consentDoneRef.current) {
          await deps.saveFaceConsentFn(accessToken, person.id, "granted", {
            channel: FACE_ENROLL_CONSENT_CHANNEL,
          });
          consentDoneRef.current = true;
        }
        const snapshot = getSnapshot?.() ?? null;
        if (snapshot == null) {
          console.warn(
            "[useFaceEnroll] getSnapshot 미제공/null — getBuffer() 현재값으로 폴백(오염 가능성 있음)",
          );
        }
        const vectors = snapshot ?? getBuffer().latest(FACE_ENROLL_VECTOR_COUNT);
        await deps.enrollFacesFn(accessToken, person.id, vectors);
        setStatus("success");
      } catch (e) {
        setStatus("error");
        setError(e as Error);
      } finally {
        enrollingRef.current = false;
      }
    },
    [accessToken, getBuffer, getSnapshot, deps],
  );

  const enrollSilent = useCallback(async () => {
    if (enrollingRef.current) return; 
    enrollingRef.current = true;
    setStatus("enrolling");
    setError(null);
    try {
      let person = personRef.current;
      if (!person) {
        person = await deps.createPersonFn(accessToken, { enrolledVia: "auto_biometric" });
        personRef.current = person;
      }

      consentDoneRef.current = true;
      const snapshot = getSnapshot?.() ?? null;
      if (snapshot == null) {
        console.warn(
          "[useFaceEnroll] enrollSilent getSnapshot 미제공/null — getBuffer() 현재값으로 폴백(오염 가능성 있음)",
        );
      }
      const vectors = snapshot ?? getBuffer().latest(FACE_ENROLL_VECTOR_COUNT);
      await deps.enrollFacesFn(accessToken, person.id, vectors);
      setStatus("success");
    } catch (e) {
      setStatus("error");
      setError(e as Error);
    } finally {
      enrollingRef.current = false;
    }
  }, [accessToken, getBuffer, getSnapshot, deps]);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    personRef.current = null;
    consentDoneRef.current = false;
  }, []);

  const getPendingPersonId = useCallback((): number | null => {
    if (status === "success" || status === "idle") return null;
    return personRef.current?.id ?? null;
  }, [status]);

  const getEnrolledPersonId = useCallback((): number | null => {
    return personRef.current?.id ?? null;
  }, []);

  return { status, error, enroll, enrollSilent, reset, getPendingPersonId, getEnrolledPersonId };
}
