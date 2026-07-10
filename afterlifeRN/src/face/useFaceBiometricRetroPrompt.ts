import { v_c4deb2, v_e662ae } from "bapkr";
import { v_889fad } from "../stores/dialogStore";
import { v_0f8436, v_421733 } from "../api/consent";
import { v_3c7924 } from "./faceBiometricRetroPrompt";

export const v_57e59a = "v1";

export function v_68a7fe(v_2ca7e0): void {
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
          "얼굴 인식(생체정보) 활용에 동의하시겠어요?",
          "동의하시면 통화 중 처음 보는 얼굴을 별도 확인 없이 조용히 기억해 다음 통화부터 더 자연스럽게 알아봐요. 설정에서 언제든 변경할 수 있어요.",
          [
            {
              text: "거부",
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
              text: "동의",
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
