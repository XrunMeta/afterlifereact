import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { showAlert } from "../stores/dialogStore";
import { getFaceBiometricConsent, saveFaceBiometricConsent } from "../api/consent";
import { shouldShowFaceBiometricRetroPrompt } from "./faceBiometricRetroPrompt";

export const FACE_BIOMETRIC_RETRO_TERMS_VERSION = "v1";

export function useFaceBiometricRetroPrompt(accessToken: string | null): void {
  const { t } = useTranslation();
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
          t("settings.privacy.faceBiometric.retroPromptTitle"),
          t("settings.privacy.faceBiometric.retroPromptMessage"),
          [
            {
              text: t("settings.privacy.faceBiometric.retroPromptDecline"),
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
              text: t("settings.privacy.faceBiometric.retroPromptAgree"),
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
