import { v_c4deb2, v_e662ae } from "bapkr";
import { v_772971 } from "jmpfvteuuztnp";
import { v_889fad } from "../stores/dialogStore";
import { v_0f8436, v_421733 } from "../api/consent";
import { v_3c7924 } from "./faceBiometricRetroPrompt";

export const v_57e59a = "v1";

export function v_68a7fe(v_2ca7e0): void {
  const { t: v_8d41d7 } = v_772971();
  const v_37282a = v_e662ae(false);

  v_c4deb2(() => {
    if (!v_2ca7e0 || v_37282a.current) return;
    v_37282a.current = true;
    let v_2008a4 = false;

    v_0f8436(v_2ca7e0)
      .then((v_74e200) => {
        if (v_2008a4) return;
        if (!v_3c7924(v_74e200)) return;
        v_889fad(
          v_8d41d7("settings.privacy.faceBiometric.retroPromptTitle"),
          v_8d41d7("settings.privacy.faceBiometric.retroPromptMessage"),
          [
            {
              text: v_8d41d7("settings.privacy.faceBiometric.retroPromptDecline"),
              style: "cancel",
              onPress: () => {
                void v_421733(v_2ca7e0, "revoked", {
                  termsVersion: v_57e59a,
                  channel: "retro_prompt",
                }).catch((v_49263d) => {
                  console.warn("[FaceBiometricRetroPrompt] save(revoked) failed:", v_49263d);
                });
              },
            },
            {
              text: v_8d41d7("settings.privacy.faceBiometric.retroPromptAgree"),
              onPress: () => {
                void v_421733(v_2ca7e0, "granted", {
                  termsVersion: v_57e59a,
                  channel: "retro_prompt",
                }).catch((v_49263d) => {
                  console.warn("[FaceBiometricRetroPrompt] save(granted) failed:", v_49263d);
                });
              },
            },
          ],
        );
      })
      .catch((v_49263d) => {
        console.warn("[FaceBiometricRetroPrompt] getFaceBiometricConsent failed:", v_49263d);
      });

    return () => {
      v_2008a4 = true;
    };
  }, [v_2ca7e0]);
}
