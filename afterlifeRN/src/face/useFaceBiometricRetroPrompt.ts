import { useEffect, useRef } from "react";
import { showAlert } from "../stores/dialogStore";
import { getFaceBiometricConsent, saveFaceBiometricConsent } from "../api/consent";
import { shouldShowFaceBiometricRetroPrompt } from "./faceBiometricRetroPrompt";

export const FACE_BIOMETRIC_RETRO_TERMS_VERSION = "v1";

export function useFaceBiometricRetroPrompt(accessToken: string | null): void {
  const shownRef = useRef(false);

  useEffect(() => {
    if (!accessToken || shownRef.current) return;
    shownRef.current = true;
    let cancelled = false;

    getFaceBiometricConsent(accessToken)
      .then((consent) => {
        if (cancelled) return;
        if (!shouldShowFaceBiometricRetroPrompt(consent)) return;
        showAlert(
          "얼굴 인식(생체정보) 활용에 동의하시겠어요?",
          "동의하시면 통화 중 처음 보는 얼굴을 별도 확인 없이 조용히 기억해 다음 통화부터 더 자연스럽게 알아봐요. 설정에서 언제든 변경할 수 있어요.",
          [
            {
              text: "거부",
              style: "cancel",
              onPress: () => {
                void saveFaceBiometricConsent(accessToken, "revoked", {
                  termsVersion: FACE_BIOMETRIC_RETRO_TERMS_VERSION,
                  channel: "retro_prompt",
                }).catch((err) => {
                  console.warn("[FaceBiometricRetroPrompt] save(revoked) failed:", err);
                });
              },
            },
            {
              text: "동의",
              onPress: () => {
                void saveFaceBiometricConsent(accessToken, "granted", {
                  termsVersion: FACE_BIOMETRIC_RETRO_TERMS_VERSION,
                  channel: "retro_prompt",
                }).catch((err) => {
                  console.warn("[FaceBiometricRetroPrompt] save(granted) failed:", err);
                });
              },
            },
          ],
        );
      })
      .catch((err) => {
        console.warn("[FaceBiometricRetroPrompt] getFaceBiometricConsent failed:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);
}
