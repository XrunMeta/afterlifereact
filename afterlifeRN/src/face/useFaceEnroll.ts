

import { useCallback, useRef, useState } from "react";
import { createPerson, saveFaceConsent, enrollFaces } from "../api/persons";
import type { EmbeddingBuffer } from "./embeddingBuffer";

export const FACE_ENROLL_VECTOR_COUNT = 3;

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

  deps?: FaceEnrollDeps;
}

export interface UseFaceEnrollResult {
  status: FaceEnrollStatus;
  error: Error | null;

  enroll: (name: string) => Promise<void>;

  reset: () => void;
}

export function useFaceEnroll(opts: UseFaceEnrollOptions): UseFaceEnrollResult {
  const { accessToken, getBuffer } = opts;
  const deps = opts.deps ?? defaultDeps;
  const [status, setStatus] = useState<FaceEnrollStatus>("idle");
  const [error, setError] = useState<Error | null>(null);

  const personRef = useRef<{ id: number } | null>(null);
  const consentDoneRef = useRef(false);

  const enroll = useCallback(
    async (name: string) => {
      setStatus("enrolling");
      setError(null);
      try {
        let person = personRef.current;
        if (!person) {
          person = await deps.createPersonFn(accessToken, { displayName: name });
          personRef.current = person;
        }
        if (!consentDoneRef.current) {
          await deps.saveFaceConsentFn(accessToken, person.id, "granted");
          consentDoneRef.current = true;
        }
        const vectors = getBuffer().latest(FACE_ENROLL_VECTOR_COUNT);
        await deps.enrollFacesFn(accessToken, person.id, vectors);
        setStatus("success");
      } catch (e) {
        setStatus("error");
        setError(e as Error);
      }
    },
    [accessToken, getBuffer, deps],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    personRef.current = null;
    consentDoneRef.current = false;
  }, []);

  return { status, error, enroll, reset };
}
