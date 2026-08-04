import v_a3453e, { v_5ab095, v_c4deb2, v_e662ae, v_de06a3, v_df9f57 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_cf9c33,
  v_700696,
  v_9cabcb,
  v_aa7413,
  v_09d0e5,
  v_a2349e,
  v_326be8,
  v_0e1f26,
  v_79c4f2,
} from "rcmrninabrnb";
import { v_5ade23 } from "xbfwaaanosqvazmrqoah";
import { v_dec439, v_25515d } from "zvyjokvuouwvifyzks";
import { v_bab832 } from "rthlnescfffbyxfmhgq";
import {
  v_862296 as v_628d75,
  v_db5a6b,
  v_b08ef3,
} from "mkqptszwrsxiemcjrtdlshyxlm";
import { v_d73d29 } from "fkysyevuehkssftyrtweoolhfw";
import { v_ac8611 } from "gegbzaufjmeglxlxrodgpkwzmpoxabawfpabkiqb";
import type { v_ab3a39 as v_1faf6a } from "gegbzaufjmeglxlxrodgpkwzmpoxabawfpabkiqb";
import { v_b24f74 } from "hpkstesipoootxeqkajlxyxt";
import { v_cb507d } from "hbzwhsuegbhzscystubugxnkiwe";
import { v_fc0657 } from "fkysyevuehkssftyrtweoolhfw";
import { v_b83839 } from "../../hooks/useFaceDetection";
import { v_e74bab } from "../../face/largestFace";
import { v_f7b672 } from "../../face/embeddingThrottle";
import { v_a40fe8 } from "../../face/frameTimestamp";
import { v_6e58ce } from "../../face/newFaceDetector";
import { v_e9685b } from "../../face/useFaceIdentify";
import { v_3fc8fd, v_9e3bb7 } from "../../face/useFaceEnroll";
import { v_19be88 } from "../../face/faceEnrollGuard";
import type { v_b26216 } from "../../face/speakerIdReducer";
import {
  v_5ecb22,
  v_047711,
  type v_cdfa61,
  type v_05f3fa,
} from "../../realtime/speakerHandoff";
import { v_565c6d } from "../../config/faceConsent";
import {
  v_4e7b87,
  v_31967f,
  v_865d38,
  v_a94a1b,
  v_137542,
  type v_5c12dc,
} from "../../api/persons";
import { v_0f8436 } from "../../api/consent";
import { v_0362e7, v_de73d9 } from "../../face/autoEnrollGuard";
import { v_55dbc4, v_8682a9, type v_8a6b56 } from "../../config/faceDiag";
import v_c0caa9 from "../../components/common/TermsModal";
import { v_2ab825 } from "../../realtime/useAvatarCall";
import { v_f22ce9 } from "../../realtime/devCallText";
import { v_c6d1f4 } from "../../config/callRoute";
import { v_a6928f, v_0e2cb4, v_71f13f } from "../../config/greeting";
import { v_7df8a4 } from "../../realtime/useHandsFreeController";
import { v_eba6cc } from "../../realtime/useVideoStatsDiag";
import { v_1980fb } from "../../components/call/DialingScreen";
import { v_9204e2 } from "../../components/call/CallVoiceBall";
import { v_cdcb08 } from "../../components/call/CallTimingHUD";
import { v_e68007 } from "../../components/call/CallTimingPanel";
import { v_fb3568 } from "../../components/call/CloneSubtitleTicker";
import { v_434962 } from "../../stores/devOverlayStore";
import { v_7347b3 } from "../../realtime/timingConfig";
import { v_1b1534 } from "../../realtime/timingLog";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_c18c22 } from "svuoaeceudfxfjvvpmmmchnwljywbphjgb";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_432191 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_8ad91b } from "../../navigation/types";
import { v_194498 } from "../../stores/cloneStore";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";

import { v_599b97, type v_83f27d } from "../../api/gifts";
import {
  v_6d41b9,
  v_b14fce,
  v_0ff331,
  v_c0681d,
} from "../../api/clones";
import v_8fba67 from "../../components/ui/ExpertBadge";

type Props = v_432191<v_8ad91b, "Call">;

const { width: v_437248 } = v_700696.get("window");

const v_5ac7d6 = 1;

const v_42cf68 = __DEV__; 

const v_a29eeb = false;

const v_514359 = "#2fbf6b";

interface FloatingGift {
  id: number;
  emoji: string;
  animY: v_a2349e.Value;
  animOpacity: v_a2349e.Value;
  x: number;
}

export default function v_bfc6c1({ route: v_c7daf6, navigation: v_c65f5d }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const { cloneId: v_6e0fd3, name: v_a4744c, image: v_c1e151 } = v_c7daf6.params;
  const v_eb25ce = v_194498((v_fd5f43) => v_fd5f43.getCloneById(v_6e0fd3));
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_493eec = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser?.id ?? null);

  const v_336a6a =
    !!v_eb25ce && v_eb25ce.ownerId != null && v_493eec != null && v_eb25ce.ownerId === v_493eec;
  const v_033e14 = v_e0068c();
  const v_f9771e = v_c18c22(0);
  const v_53dd92 =
    v_326be8.OS === "ios" ? v_033e14.bottom : Math.max(v_f9771e, v_033e14.bottom);
  const v_5c2f05 = v_434962((v_fd5f43) => v_fd5f43.callDevUiVisible);
  const v_c3a0ed = __DEV__ && v_5c2f05;

  const [v_5bb98b, v_fce7f9] = v_5ab095<"front" | "back">("front");
  const [v_4e2aec, v_326ca4] = v_5ab095(false);
  const [v_9e64e1, v_e064ce] = v_5ab095(false);

  const [v_67b98a, v_9739b5] = v_5ab095(false);

  const [v_b2ccaa, v_82a4b3] = v_5ab095(false);

  const v_49a70b = v_db5a6b(v_5bb98b === "front" ? "front" : "back");

  const { faceState: v_bbb3d3, onFaces: v_dfbd9a } = v_b83839();
  const { detectFaces: v_de4d76, stopListeners: v_62fe07 } = v_ac8611({
    performanceMode: "fast",
    trackingEnabled: true,
  });

  const v_f15637 = v_e662ae<v_628d75>(null);

  v_c4deb2(() => {
    return () => {
      v_62fe07();
    };
  }, [v_62fe07]);

  const v_8090fb = v_a3453e.useMemo(
    () =>
      v_d73d29.createRunOnJS((faces: v_1faf6a[]) => {
        const v_29a122 = v_a51d09.map((v_8b5cd8) => ({
          trackingID: v_8b5cd8.trackingId,
          bounds: v_8b5cd8.bounds,
        }));
        v_dfbd9a(v_29a122);
      }),

    [],
  );

  const [v_58656e, v_071915] = v_5ab095(false);
  const [v_550809, v_566132] = v_5ab095(false);

  const [v_a6086d, v_603e38] = v_5ab095(false);

  const [v_488209, v_5b715f] = v_5ab095<v_8a6b56 | null>(null);
  const [v_e7824f, v_0981e9] = v_5ab095<number | null>(null);
  const [v_fded81, v_1b22c3] = v_5ab095<v_5c12dc[]>([]);

  v_c4deb2(() => {

    void v_628d75.requestCameraPermission();

    if (!v_2ca7e0) return;
    let v_2008a4 = false;
    v_865d38(v_2ca7e0)
      .then(({ items: v_4622b9 }) => {
        if (v_2008a4) return;
        const v_5f7d15 = v_4622b9.some((v_e2a85c) => v_e2a85c.consentState === "granted");
        v_071915(v_5f7d15);
        v_1b22c3(v_4622b9); 
        console.log(`[Call][face] listPersons ← granted=${v_5f7d15} (total=${v_4622b9.length})`);
      })
      .catch((v_49263d) => {
        console.warn("[Call][face] listPersons failed:", v_49263d);
      });
    return () => {
      v_2008a4 = true;
    };

  }, [v_2ca7e0]);

  const [v_f0ea4e, v_abf57b] = v_5ab095<boolean | null>(null);
  v_c4deb2(() => {
    if (!v_2ca7e0) return;
    let v_2008a4 = false;
    v_0f8436(v_2ca7e0)
      .then((v_cb35cb) => {
        if (v_2008a4) return;
        v_abf57b(v_cb35cb.state === "granted");
        console.log(`[Call][face] getFaceBiometricConsent ← granted=${v_cb35cb.state === "granted"}`);
      })
      .catch((v_49263d) => {
        if (v_2008a4) return;
        v_abf57b(false); 
        console.warn("[Call][face] getFaceBiometricConsent failed, fallback to card flow:", v_49263d);
      });
    return () => {
      v_2008a4 = true;
    };

  }, [v_2ca7e0]);

  const v_888b49 = v_e662ae<Set<number>>(new Set());

  const v_25cb51 = v_e662ae(false);

  const v_821084 = v_e662ae("");

  const v_243c4f = v_e662ae<(name: string, personId?: number) => void>(() => {});
  const v_b12d63 = v_de06a3((v_1833e7, v_ca1ec5) => {
    v_243c4f.current(v_1833e7, v_ca1ec5);
  }, []);

  const {
    state: v_6cc918,
    remoteStream: v_b4d824,
    start: v_223067,
    stop: v_cd8b64,
    say: v_3e2c87,
    getStatsReport: v_791152,
    notifySpeechEnd: v_811f30,
    greet: v_009e58,
    speak: v_a1d9db,
    lastSignal: v_88c591,
    sendFaceEvent: v_11f4a1,
  } = v_2ab825({ cloneId: v_6e0fd3, accessToken: v_2ca7e0 ?? "", onEnrollSuggest: v_b12d63 });

  const [v_69c045, v_58e7a2] = v_5ab095("");

  const [v_e35303, v_71afec] = v_5ab095(0);
  v_c4deb2(() => {
    if (!__DEV__) return;
    const v_53f5d7 = v_0e1f26.addListener("keyboardDidShow", (v_9e86fd) =>
      v_71afec(v_9e86fd.endCoordinates.height),
    );
    const v_52528b = v_0e1f26.addListener("keyboardDidHide", () => v_71afec(0));
    return () => {
      v_53f5d7.remove();
      v_52528b.remove();
    };
  }, []);

  const v_d7cf17 = v_a6928f && typeof v_009e58 === 'function';

  v_eba6cc({ getStatsReport: v_791152, enabled: __DEV__ && v_6cc918 === "live" });

  const v_d35913 = v_b24f74(
    require("../../../assets/models/w600k_mbf.tflite"),
  );
  const v_23f1a4 =
    v_d35913.state === "loaded" ? v_d35913.model : undefined;
  const { resize: v_2e11e8 } = v_cb507d();

  const v_44c2eb = v_326be8.OS === "android";

  const v_5111a7 = v_fc0657(0);

  const v_a0880b = v_e662ae<Set<number>>(new Set());

  const v_acaf61 = v_e662ae<(evt: v_b26216) => void>(() => {});
  const v_e881de = v_de06a3((evt: v_b26216) => {
    v_acaf61.current(v_9e6ec9);
  }, []);

  const v_a82708 = v_e662ae(v_047711());
  const v_de3311 = v_e662ae<(event: v_cdfa61) => void>(() => {});
  const v_ea326d = v_de06a3((event: v_cdfa61) => {
    v_de3311.current(v_d48baf);
  }, []);

  const v_b1a2e8 = v_e662ae<number[][] | null>(null);

  const v_bea660 = v_df9f57(
    () => (v_55dbc4 ? { accessToken: v_2ca7e0 ?? "", groundTruthPersonId: v_e7824f } : null),
    [v_2ca7e0, v_e7824f],
  );

  const {
    onEmbedding: v_88bed2,
    getBuffer: v_c4d644,
    resetRecognition: v_82c47a,
  } = v_e9685b({
    enabled: v_58656e && v_6cc918 === "live",
    accessToken: v_2ca7e0 ?? "",
    onEvent: v_e881de,
    onDiag: v_5b715f,
    calibrate: v_bea660,
  });

  const v_3033e0 = v_de06a3(
    (evt: v_b26216) => {
      if (!v_9e6ec9) return;
      if (v_9e6ec9.type === "speaker_confirmed") {

        const v_1833e7 = v_9e6ec9.displayName ?? v_fded81.find((v_e2a85c) => v_e2a85c.id === v_9e6ec9.personId)?.displayName ?? null;
        if (v_1833e7) {
          v_ea326d({ type: "SPEAKER_CONFIRMED", personId: v_9e6ec9.personId, name: v_1833e7 });
        }
        v_11f4a1?.({
          event: "speaker_confirmed",
          personId: v_9e6ec9.personId,
          displayName: v_9e6ec9.displayName,
        });
      } else if (v_9e6ec9.type === "unknown_face") {
        v_ea326d({ type: "UNKNOWN_FACE" });

        v_b1a2e8.current = v_c4d644().latest(v_9e3bb7);
        v_11f4a1?.({ event: "unknown_face" });
      }
    },

    [v_11f4a1, v_c4d644, v_ea326d, v_fded81],
  );
  v_c4deb2(() => {
    v_acaf61.current = v_3033e0;
  }, [v_3033e0]);

  const v_20ef58 = v_3fc8fd({
    accessToken: v_2ca7e0 ?? "",
    getBuffer: v_c4d644,
    getSnapshot: () => v_b1a2e8.current,
  });

  const v_87cd9e = 20000;
  const v_b78a25 = v_e662ae<ReturnType<typeof setTimeout> | null>(null);
  const v_400cd9 = v_de06a3(
    (actions: v_05f3fa[]) => {
      for (const v_779914 of v_dd943a) {
        if (v_779914.type === "SAY") {
          void v_3e2c87(v_779914.text);
        } else if (v_779914.type === "BEGIN_NAMING") {
          if (v_b78a25.current) clearTimeout(v_b78a25.current);
          v_b78a25.current = setTimeout(() => {
            v_de3311.current({ type: "NAMING_TIMEOUT" });
          }, v_87cd9e);
        } else if (v_779914.type === "END_NAMING") {
          if (v_b78a25.current) {
            clearTimeout(v_b78a25.current);
            v_b78a25.current = null;
          }
        } else if (v_779914.type === "DISCARD_RECOGNITION") {

          v_20ef58.reset();
          v_82c47a();
        }
      }
    },
    [v_3e2c87, v_20ef58, v_82c47a],
  );
  v_c4deb2(() => {
    v_de3311.current = (event: v_cdfa61) => {
      const { state: v_b6e533, actions: v_dd943a } = v_5ecb22(v_a82708.current, v_d48baf);
      v_a82708.current = v_b6e533;
      v_400cd9(v_dd943a);
    };
  }, [v_400cd9]);

  v_c4deb2(() => {
    return () => {
      if (v_b78a25.current) clearTimeout(v_b78a25.current);
    };
  }, []);

  const v_f8e6ef = v_de06a3(
    (v_1833e7, v_ca1ec5) => {

      const v_9b064f = v_0362e7({
        personId: v_ca1ec5,
        faceBiometricConsent: v_565c6d() ? v_f0ea4e : true,
        autoEnrolledNoName: v_ca1ec5 !== undefined && v_888b49.current.has(v_ca1ec5),
        enrolling: v_20ef58.status === "enrolling",
      });

      if (v_9b064f.kind === "ignore") return;

      if (v_9b064f.kind === "reflect_name") {

        if (v_2ca7e0 && v_ca1ec5 !== undefined) {
          void v_137542(v_2ca7e0, v_ca1ec5, v_1833e7)
            .then(() => {
              v_888b49.current.delete(v_ca1ec5);
            })
            .catch((v_49263d) => {
              console.warn("[Call][face] updatePersonName failed:", v_49263d);
            });
        }
        return;
      }

      const v_03b239 = v_1833e7.trim().length > 0;

      if (v_9b064f.kind === "silent" && !v_03b239) {

        const v_fde8d3 = v_20ef58.getPendingPersonId();
        const v_0e4853 = v_20ef58.getEnrolledPersonId();
        const v_a983d4 = v_de73d9({
          enrolling: false,
          pendingPersonId: v_fde8d3,
          enrolledPersonId: v_0e4853,
          incomingName: v_1833e7,
          lastName: v_821084.current,
        });
        if (v_a983d4 === "delete") {
          if (v_2ca7e0 && v_fde8d3 != null) {
            void v_a94a1b(v_2ca7e0, v_fde8d3).catch((v_49263d) => {
              console.warn("[Call][face] orphan person cleanup(deletePerson) failed:", v_49263d);
            });
          }
          v_20ef58.reset();
        } else if (v_a983d4 === "detach") {

          v_20ef58.reset();
        }
        v_821084.current = v_1833e7;

        v_25cb51.current = true;
        void v_20ef58.enrollSilent();
        return;
      }

      const v_fde8d3 = v_20ef58.getPendingPersonId();
      const v_3da205 = v_19be88({
        enrolling: false,
        pendingPersonId: v_fde8d3,
        incomingName: v_1833e7,
        lastName: v_821084.current,
      });
      if (v_3da205) {
        if (v_2ca7e0 && v_fde8d3 != null) {
          void v_a94a1b(v_2ca7e0, v_fde8d3).catch((v_49263d) => {
            console.warn("[Call][face] orphan person cleanup(deletePerson) failed:", v_49263d);
          });
        }
        v_20ef58.reset();
      }
      v_821084.current = v_1833e7;
      void v_20ef58.enroll(v_1833e7);
      return;
    },
    [v_20ef58, v_2ca7e0, v_f0ea4e],
  );
  v_c4deb2(() => {
    v_243c4f.current = v_f8e6ef;
  }, [v_f8e6ef]);

  const v_998534 = v_a3453e.useMemo(
    () =>
      v_d73d29.createRunOnJS(
        (v_f9a45c, v_0b2889, v_3e0537) => {
          if (v_0b2889 > 1) {
            const { newIds: v_f1e765, seen: v_110a8b } = v_6e58ce(v_a0880b.current, v_3e0537);
            v_a0880b.current = v_110a8b;
            if (v_f1e765.length > 0) {
              v_11f4a1?.({ event: "multi_face" });
            }
          }
          v_88bed2(v_f9a45c);
        },
      ),

    [v_88bed2, v_11f4a1],
  );

  const v_a61ebf = v_b08ef3(
    (v_143cb5) => {
      "worklet";
      const v_a51d09 = v_de4d76(v_143cb5);
      v_8090fb(v_a51d09); 

      const v_67e77e = v_a40fe8(v_143cb5.timestamp, v_44c2eb);

      if (v_23f1a4 != null && v_f7b672(v_5111a7.value, v_67e77e)) {
        v_5111a7.value = v_67e77e;
        const v_127e92 = v_e74bab(v_a51d09);
        if (v_127e92 != null) {
          const v_2d3c27 = v_2e11e8(v_143cb5, {
            crop: {
              x: v_127e92.bounds.x,
              y: v_127e92.bounds.y,
              width: v_127e92.bounds.width,
              height: v_127e92.bounds.height,
            },
            scale: { width: 112, height: 112 },
            pixelFormat: "rgb",
            dataType: "float32",
          });

          const v_75195c = new Float32Array(v_2d3c27.length);
          for (let v_ebec57 = 0; v_ebec57 < v_2d3c27.length; v_ebec57++) {
            v_75195c[v_ebec57] = v_2d3c27[v_ebec57] * 2 - 1;
          }
          const v_8d4337 = v_23f1a4.runSync([v_75195c])[0] as Float32Array;
          const v_3e0537 = v_a51d09
            .map((v_8b5cd8) => v_8b5cd8.trackingId)
            .filter((v_389afb): v_389afb is number => typeof v_389afb === "number");
          v_998534(Array.from(v_8d4337), v_a51d09.length, v_3e0537);
        }
      }
    },
    [
      v_de4d76,
      v_8090fb,
      v_23f1a4,
      v_2e11e8,
      v_5111a7,
      v_44c2eb,
      v_998534,
    ],
  );

  const v_280eae = v_7347b3((v_fd5f43) => v_fd5f43.sttEndpointMs);

  const v_0300cd = v_7347b3((v_fd5f43) => v_fd5f43.confirmGateEnabled);
  const {
    phase: v_ab4803,
    micOn: v_1065f7,
    toggleMic: v_6e1295,
    pendingText: v_def12c,
    cancelConfirm: v_5b4fb2,
    transcript: v_0885ca,
    interimTranscript: v_a2d9d1,
    devForceListen: v_a8e03f,
    micLevel: v_9afd2d,
    cloneAudioLevel: v_09b641,
    sttActive: v_b3ae82,
  } = v_7df8a4({
    enabled: v_6cc918 === "live",
    say: v_3e2c87,
    getStatsReport: v_791152,
    notifySpeechEnd: v_811f30,
    greeting: v_d7cf17,
    greet: v_009e58,
    speak: v_a1d9db,
    lastSignal: v_88c591,
    greetTimeoutMs: v_71f13f,
    fallbackText: v_0e2cb4,
    silenceMs: v_280eae,
    confirmGate: __DEV__ && v_0300cd,

    signalGating: typeof v_009e58 === 'function',
  });

  const [v_7a419e, v_717e64] = v_5ab095(false);
  v_c4deb2(() => {
    if (v_88c591?.type === 'speech_start') v_717e64(true);
  }, [v_88c591]);

  const v_324ec4 = (v_ab4803 === 'listening' || v_ab4803 === 'confirming') && v_b3ae82;

  v_c4deb2(() => {
    const v_ff0300 = (v_b4d824 as unknown as { getAudioTracks?: () => Array<{ enabled: boolean }> })
      ?.getAudioTracks?.() ?? [];
    const v_da66c7 = v_b2ccaa && !v_4e2aec;
    v_ff0300.forEach((v_8d41d7) => {
      v_8d41d7.enabled = v_da66c7;
    });
  }, [v_b4d824, v_b2ccaa, v_4e2aec]);

  const [v_0c5416, v_2e6b8a] = v_5ab095('');
  v_c4deb2(() => {
    if (!v_88c591) return;
    if (v_88c591.type === 'speech_text' && v_88c591.text) {
      const v_8d41d7 = v_88c591.text;
      v_2e6b8a((v_ba2215) => (v_ba2215 ? `${v_ba2215} ${v_8d41d7}` : v_8d41d7));
    } else if (v_88c591.type === 'speech_end') {
      v_2e6b8a('');
    }
  }, [v_88c591]);

  v_c4deb2(() => {
    if (!v_2ca7e0) return;
    void v_223067();

  }, []);

  v_c4deb2(() => {
    if (!__DEV__) return;
    return v_1b1534();
  }, []);

  const [v_d416b8, v_2a4980] = v_5ab095(false);

  const [v_68bb66, v_3bae81] = v_5ab095<v_83f27d[]>([]);
  v_c4deb2(() => {
    let v_2008a4 = false;
    void v_599b97().then((v_4622b9) => {
      if (!v_2008a4) v_3bae81(v_4622b9);
    });
    return () => {
      v_2008a4 = true;
    };
  }, []);
  const [v_8282fa, v_15c939] = v_5ab095<string | null>(null);

  v_c4deb2(() => {
    if (v_20ef58.status === "success") {
      const v_0e4853 = v_20ef58.getEnrolledPersonId();
      if (v_25cb51.current) {

        if (v_0e4853 != null) v_888b49.current.add(v_0e4853);
        v_25cb51.current = false;
      } else {
        v_15c939(
          v_8d41d7("call.enrollSuccessToast", {
            name: v_821084.current,
            defaultValue: "{{name}}님, 이제 기억할게요",
          }),
        );
      }

      v_ea326d({
        type: "NAME_ENROLLED",
        personId: v_0e4853 ?? undefined,
        name: v_821084.current,
      });
      v_20ef58.reset();
      v_b1a2e8.current = null; 
    } else if (v_20ef58.status === "error") {
      if (v_25cb51.current) {

        v_25cb51.current = false;
        v_20ef58.reset();
      } else {
        v_15c939(
          v_8d41d7("call.enrollFailToast", { defaultValue: "등록에 실패했어요. 다시 시도해 주세요" }),
        );
      }
    }

  }, [v_20ef58.status]);

  const [v_85c07b, v_ff0eb0] = v_5ab095(false);
  const [v_605664, v_0f07a9] = v_5ab095<FloatingGift[]>([]);
  const v_63eb29 = v_e662ae(0);

  const [v_5a751a, v_6d75b1] = v_5ab095(0);
  v_c4deb2(() => {
    if (v_6cc918 !== "live") return;
    const v_389afb = setInterval(() => v_6d75b1((v_fd5f43) => v_fd5f43 + 1), 1000);
    return () => clearInterval(v_389afb);
  }, [v_6cc918]);

  const v_796faa = v_e662ae(new v_a2349e.Value(0)).current;
  v_c4deb2(() => {
    if (v_ab4803 !== 'confirming') { v_796faa.setValue(0); return; }
    v_796faa.setValue(1);
    const v_f582ff = v_a2349e.timing(v_796faa, { toValue: 0, duration: 2000, useNativeDriver: true });
    v_f582ff.start();
    return () => v_f582ff.stop();
  }, [v_ab4803, v_def12c, v_796faa]);

  const v_1406a6 = v_e662ae<number>(Date.now());
  const v_4d96d4 = v_e662ae(v_2ca7e0);
  const v_32c215 = v_e662ae(v_6e0fd3);
  v_c4deb2(() => {
    v_4d96d4.current = v_2ca7e0;
    v_32c215.current = v_6e0fd3;
  }, [v_2ca7e0, v_6e0fd3]);
  v_c4deb2(() => {
    return () => {
      const v_21cc31 = v_4d96d4.current;
      const v_062ae9 = v_32c215.current;
      console.log(`[Call] 화면 종료 — call-event 전송 시도 token=${!!v_21cc31} cloneId=${v_062ae9}`);
      if (!v_21cc31 || !v_062ae9) {
        console.warn(`[Call] call-event 전송 SKIP (token=${!!v_21cc31} cid=${v_062ae9})`);
        return;
      }
      const v_40c855 = Math.floor((Date.now() - v_1406a6.current) / 1000);
      console.log(`[Call] POST /oth-path${v_062ae9}/call-event { durationSeconds: ${v_40c855} }`);

      v_c0681d(v_21cc31, v_062ae9, { durationSeconds: v_40c855 })
        .then((v_8f00b9) =>
          console.log(`[Call] call-event ← ok scoreApplied=${(v_8f00b9 as { scoreApplied?: number }).scoreApplied ?? 0}°C (duration=${v_40c855}s, >=1200 이면 +15°C)`),
        )
        .catch((v_49263d) => console.warn("[Call] postCloneCallEvent failed:", v_49263d));
    };
  }, []);

  v_c4deb2(() => {
    console.log(`[Call] 진입 cloneId=${v_6e0fd3} name=${v_a4744c ?? "?"} (likedByMe fetch 중...)`);
    if (!v_2ca7e0) return;
    let v_2008a4 = false;
    v_6d41b9(v_2ca7e0, v_6e0fd3)
      .then((v_cb35cb) => {
        if (v_2008a4) return;
        console.log(`[Call] likedByMe fetch ← ${v_cb35cb.liked}`);
        v_ff0eb0(v_cb35cb.liked);
      })
      .catch((v_49263d) => {
        console.warn("[Call] likedByMe fetch failed:", v_49263d);
      });
    return () => {
      v_2008a4 = true;
    };

  }, [v_2ca7e0, v_6e0fd3]);
  const v_813acc = `${String(Math.floor(v_5a751a / 60)).padStart(2, "0")}:${String(v_5a751a % 60).padStart(2, "0")}`;

  const v_dfb220 = v_a4744c || v_eb25ce?.displayName || v_8d41d7("chat.personaFallback");
  const v_0e38ad = v_c1e151 || v_eb25ce?.imageUrl || "";

  v_c4deb2(() => {
    if (v_8282fa) {
      const v_cb36b1 = setTimeout(() => v_15c939(null), 2000);
      return () => clearTimeout(v_cb36b1);
    }
  }, [v_8282fa]);

  const v_25b14f = (gift: v_83f27d) => {
    console.log(`[Call][gift-tap] giftId=${v_bbee9c.id} name=${v_bbee9c.name} (결제 준비 중)`);
    v_2a4980(false);
    v_15c939(v_8d41d7("call.paymentPreparingToast", { defaultValue: "결제 준비 중이에요" }));
    v_161a89(v_bbee9c);
  };

  const v_161a89 = (gift: v_83f27d) => {

    const v_389afb = v_63eb29.current++;
    const v_15f379 = new v_a2349e.Value(0);
    const v_3929b3 = new v_a2349e.Value(0);
    const v_62c214 = v_437248 / 2 + (Math.random() * 120 - 60);

    const v_90ca83 = { id: v_389afb, emoji: v_bbee9c.emoji, animY: v_15f379, animOpacity: v_3929b3, x: v_62c214 };
    v_0f07a9((v_ba2215) => [...v_ba2215, v_90ca83]);

    v_a2349e.parallel([
      v_a2349e.timing(v_15f379, {
        toValue: -400,
        duration: 2500,
        useNativeDriver: true,
      }),
      v_a2349e.sequence([
        v_a2349e.timing(v_3929b3, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        v_a2349e.delay(1500),
        v_a2349e.timing(v_3929b3, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      v_0f07a9((v_ba2215) => v_ba2215.filter((v_206b88) => v_206b88.id !== v_389afb));
    });

    v_2a4980(false);
  };

  const v_47b41c = v_53dd92 + 96 + 112 + 12;

  return (
    <View style={v_fd5f43.container}>
      {}
      {}
      {}
      {v_b4d824 ? (

        <View style={[v_472849.absoluteFill, v_fd5f43.videoEdgeMask]}>
          <RTCView
            streamURL={(v_b4d824 as unknown as { toURL: () => string }).toURL()}
            objectFit="contain"
            style={[v_472849.absoluteFill, v_fd5f43.videoEdgeTrim]}
          />
        </View>
      ) : v_0e38ad ? (
        <Image
          source={typeof v_0e38ad === "number" ? v_0e38ad : { uri: v_0e38ad }}
          style={[v_472849.absoluteFill, { width: "100%", height: "100%" }]}
          resizeMode="contain"
        />
      ) : (
        <View style={[v_472849.absoluteFill, { backgroundColor: v_1bfbd0.zinc900 }]} />
      )}

      {v_c3a0ed ? (
        <View style={{ position: "absolute", top: 8, right: 8, zIndex: 10,
          backgroundColor: "rgba(0,0,0,0.5)", padding: 4 }}>
          <Text style={{ color: "#0f0", fontSize: 10 }}>route:{v_c6d1f4}</Text>
          {v_55dbc4 ? (
            <>
              <Text style={{ color: "#0f0", fontSize: 10 }}>
                {v_488209 ? v_8682a9(v_488209) : "face -"}
              </Text>
              {}
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                <Text
                  onPress={() => v_0981e9(null)}
                  style={{ color: v_e7824f == null ? "#ff0" : "#0f0", fontSize: 10, marginRight: 6 }}
                >
                  unknown
                </Text>
                {v_fded81.map((v_e2a85c) => (
                  <Text
                    key={v_e2a85c.id}
                    onPress={() => v_0981e9(v_e2a85c.id)}
                    style={{ color: v_e7824f === v_e2a85c.id ? "#ff0" : "#0f0", fontSize: 10, marginRight: 6 }}
                  >
                    #{v_e2a85c.id}
                  </Text>
                ))}
              </View>
            </>
          ) : null}
        </View>
      ) : null}

      {v_c3a0ed && v_6cc918 === "live" ? (
        <View
          style={{
            position: "absolute",
            left: 8,
            right: 8,

            bottom: v_e35303 > 0 ? v_e35303 + 58 : v_53dd92 + 96,
            zIndex: 20,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.6)",
            borderRadius: 6,
            padding: 4,
          }}
        >
          <TextInput
            style={{ flex: 1, color: "#0f0", fontSize: 13, paddingHorizontal: 8, paddingVertical: 6 }}
            value={v_69c045}
            onChangeText={v_58e7a2}
            placeholder="[DEV] 텍스트로 발화"
            placeholderTextColor="#6b7280"
            autoCapitalize="none"
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={() => v_f22ce9(v_69c045, v_3e2c87, v_58e7a2)}
          />
          <TouchableOpacity
            onPress={() => v_f22ce9(v_69c045, v_3e2c87, v_58e7a2)}
            style={{ paddingHorizontal: 12, paddingVertical: 6 }}
          >
            <Text style={{ color: "#0f0", fontSize: 13, fontWeight: "600" }}>전송</Text>
          </TouchableOpacity>
          {
}
          <TouchableOpacity
            onPress={() => v_9739b5((v_81e2ef) => !v_81e2ef)}
            style={{ paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <Text style={{ color: v_67b98a ? "#f87171" : "#0f0", fontSize: 13, fontWeight: "600" }}>
              얼굴{v_67b98a ? "OFF" : "ON"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {}
      {!v_b2ccaa && (
        <DialingScreen
          liveState={v_6cc918}
          personaName={v_dfb220}
          personaImage={typeof v_0e38ad === "string" ? v_0e38ad : ""}

          greetingStarted={v_d7cf17 ? v_ab4803 !== "greeting" && v_ab4803 !== "idle" : undefined}
          onConnected={() => v_82a4b3(true)}
          onCancel={async () => { await v_cd8b64(); v_c65f5d.goBack(); }}
          onRetry={() => { v_717e64(false); void v_223067(); }}
        />
      )}

      <LinearGradient
        colors={["rgba(0,0,0,0.2)", "transparent", "rgba(9,9,11,0.5)"]}
        locations={[0, 0.4, 1]}
        style={v_472849.absoluteFill}
      />

      {v_c3a0ed && v_6cc918 === "live" ? <CallTimingHUD /> : null}
      {v_c3a0ed && v_6cc918 === "live" ? (

        <View
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: v_53dd92 }}
          pointerEvents="box-none"
        >
          <CallTimingPanel onForceListen={v_a8e03f} micOn={v_1065f7} onToggleMic={v_6e1295} />
        </View>
      ) : null}

      {

}
      <TouchableOpacity
        style={[v_fd5f43.pip, { top: v_033e14.top + 8 }]}
        activeOpacity={0.9}
        onPress={() => v_fce7f9((v_8b5cd8) => (v_8b5cd8 === "front" ? "back" : "front"))}
      >
        {v_9e64e1 ? (
          <View style={v_fd5f43.pipOff}>
            <Feather name="video-off" size={20} color={v_1bfbd0.zinc600} />
          </View>
        ) : v_49a70b ? (

          <VisionCamera
            ref={v_f15637}
            style={v_fd5f43.pipCamera}
            device={v_49a70b}
            isActive={!v_9e64e1}

            androidPreviewViewType="texture-view"

            frameProcessor={v_58656e && !v_67b98a ? v_a61ebf : undefined}
            onError={(v_9e86fd) =>
              console.log("[Call][face] camera error:", v_9e86fd.code, v_9e86fd.message)
            }
          />
        ) : (
          <View style={v_fd5f43.pipOff}>
            <Feather name="camera-off" size={20} color={v_1bfbd0.zinc600} />
          </View>
        )}

        {}
        {v_58656e && !v_9e64e1 && v_49a70b ? (
          <View
            style={[
              v_fd5f43.faceIndicator,
              v_bbb3d3.status === "detected" ? v_fd5f43.faceIndicatorOn : v_fd5f43.faceIndicatorOff,
            ]}
          />
        ) : null}
      </TouchableOpacity>

      {

}
      {!v_58656e && !v_9e64e1 && (
        <TouchableOpacity
          style={[v_fd5f43.faceConsentBtn, { top: v_033e14.top + 8 + 140 + 6 }]}
          disabled={v_a6086d}
          onPress={() => {
            if (!v_2ca7e0) return;

            v_566132(true);
          }}
        >
          <Text style={v_fd5f43.faceConsentText}>{v_8d41d7("call.faceConsentHint")}</Text>
        </TouchableOpacity>
      )}

      <TermsModal
        visible={v_550809}
        type={4}
        onClose={() => {

          v_566132(false);
        }}
        onAgree={async () => {

          if (!v_2ca7e0) { v_566132(false); return; }
          v_603e38(true);
          v_566132(false);
          try {
            const { id: v_389afb } = await v_4e7b87(v_2ca7e0, { cloneId: v_6e0fd3 });
            console.log(`[Call][face] createPerson ok personId=${v_389afb}`);
            await v_31967f(v_2ca7e0, v_389afb, "granted", { termsVersion: "biometric-v1" });
            v_071915(true);
            console.log(`[Call][face] consent granted personId=${v_389afb}`);
          } catch (v_49263d) {
            console.warn("[Call][face] createPerson/saveFaceConsent failed:", v_49263d);

            v_15c939(v_8d41d7("call.faceConsentError"));
          } finally {
            v_603e38(false);
          }
        }}
      />

      {}

      {}
      <View style={[v_fd5f43.callInfo, { top: v_033e14.top + 24 }]}>
        <Text style={v_fd5f43.callName}>{v_dfb220}</Text>
        <Text style={v_fd5f43.callTimeText}>
          {v_6cc918 === "live"
            ? v_813acc
            : v_8d41d7("call.connecting", { defaultValue: "연결 중…" })}
        </Text>
      </View>

      {

}
      {v_eb25ce?.cloneType === "expert" && (
        <View style={[v_fd5f43.expertBadge, { top: v_033e14.top + 24 }]}>
          <ExpertBadge size={44} />
        </View>
      )}

      {
}
      {!v_336a6a && (
      <View style={v_fd5f43.rightActions}>
        <TouchableOpacity
          style={[v_fd5f43.sideBtn, v_d416b8 && v_fd5f43.sideBtnActive]}
          onPress={() => v_2a4980(!v_d416b8)}
        >
          <Feather name="gift" size={22} color={v_1bfbd0.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={v_fd5f43.sideBtn}
          onPress={async () => {
            const v_a448ad = !v_85c07b;
            console.log(
              `[Call] 좋아요 클릭 cloneId=${v_6e0fd3} ${v_85c07b ? "true" : "false"} → ${v_a448ad ? "true" : "false"}`,
            );
            v_ff0eb0(v_a448ad); 
            if (!v_2ca7e0) return;
            try {
              if (v_a448ad) await v_b14fce(v_2ca7e0, v_6e0fd3);
              else await v_0ff331(v_2ca7e0, v_6e0fd3);
              console.log(`[Call] 좋아요 API ← ok next=${v_a448ad}`);
            } catch (v_49263d) {
              console.warn("[Call] 좋아요 API 실패:", v_49263d);
              v_ff0eb0(!v_a448ad); 
            }
          }}
        >
          {}
          <Ionicons
            name={v_85c07b ? "heart" : "heart-outline"}
            size={24}
            color={v_85c07b ? "#ef4444" : v_1bfbd0.white}
          />
        </TouchableOpacity>
        {}
      </View>
      )}

      {}
      {v_605664.map((v_206b88) => (
        <Animated.Text
          key={v_206b88.id}
          style={[
            v_fd5f43.floatingEmoji,
            {
              left: v_206b88.x,
              transform: [{ translateY: v_206b88.animY }],
              opacity: v_206b88.animOpacity,
            },
          ]}
        >
          {v_206b88.emoji}
        </Animated.Text>
      ))}

      {
}

      {}
      {v_c3a0ed && v_42cf68 && v_ab4803 === 'listening' && (!!v_a2d9d1 || !!v_0885ca) ? (
        <View style={[v_fd5f43.subtitleContainer, { bottom: v_47b41c }]} pointerEvents="none">
          <Text style={v_fd5f43.subtitleText} numberOfLines={1} ellipsizeMode="head">
            {v_a2d9d1 || v_0885ca}
          </Text>
        </View>
      ) : null}

      {

}
      {v_ab4803 === 'confirming' && !!v_def12c ? (
        <>
          <Pressable style={v_fd5f43.confirmTapArea} onPress={v_5b4fb2} />
          {
}
          {v_c3a0ed && v_42cf68 ? (
            <View style={[v_fd5f43.subtitleContainer, { bottom: v_47b41c }]} pointerEvents="none">
              <Text style={v_fd5f43.subtitleText} numberOfLines={1} ellipsizeMode="head">
                {v_def12c}
              </Text>
              <View style={v_fd5f43.confirmBarTrack}>
                <Animated.View style={[v_fd5f43.confirmBarFill, { transform: [{ scaleX: v_796faa }] }]} />
              </View>
              <Text style={v_fd5f43.confirmHint}>
                {v_8d41d7("call.confirmHint", { defaultValue: "탭하여 취소 · 잠시 후 전송" })}
              </Text>
            </View>
          ) : null}
        </>
      ) : null}

      {

}
      {v_c3a0ed && v_42cf68 && (v_ab4803 === 'sending' || v_ab4803 === 'speaking') && !!v_def12c && !v_0c5416 ? (
        <View style={[v_fd5f43.subtitleContainer, { bottom: v_47b41c }]} pointerEvents="none">
          <Text style={v_fd5f43.subtitleText} numberOfLines={1} ellipsizeMode="head">
            {v_def12c}
          </Text>
        </View>
      ) : null}

      {

}
      {(v_ab4803 === 'speaking' || v_ab4803 === 'greeting') && !!v_0c5416 ? (
        <View style={[v_fd5f43.subtitleContainer, { bottom: v_47b41c }]} pointerEvents="none">
          <CloneSubtitleTicker text={v_0c5416} style={v_fd5f43.subtitleText} />
        </View>
      ) : null}

      {

}
      <View
        style={[v_fd5f43.watermarkLayer, { bottom: v_53dd92 + 24 + 56 + 16 }]}
        pointerEvents="none"
      >
        <Image
          source={require("../../../assets/images/logo.png")}
          style={v_fd5f43.watermarkLogo}
          resizeMode="contain"
        />
      </View>

      {

}
      {v_a29eeb && v_b2ccaa ? (
        <View
          style={[v_fd5f43.voiceBallLayer, { bottom: v_53dd92 + 24 + 56 + 16 }]}
          pointerEvents="none"
        >
          <CallVoiceBall phase={v_ab4803} micLevel={v_9afd2d} cloneLevel={v_09b641} sttActive={v_b3ae82} />
        </View>
      ) : null}

      {}
      <View style={[v_fd5f43.controls, { paddingBottom: v_53dd92 + 24 }]}>
        <TouchableOpacity
          style={[v_fd5f43.controlBtn, v_4e2aec && v_fd5f43.controlBtnDanger]}
          onPress={() => {
            const v_a448ad = !v_4e2aec;
            v_326ca4(v_a448ad);

            const v_ff0300 = (v_b4d824 as unknown as { getAudioTracks?: () => Array<{ enabled: boolean }> })
              ?.getAudioTracks?.() ?? [];
            v_ff0300.forEach((v_8d41d7) => {
              v_8d41d7.enabled = !v_a448ad;
            });
          }}
        >
          <Feather name={v_4e2aec ? "mic-off" : "mic"} size={24} color={v_1bfbd0.white} />
        </TouchableOpacity>

        {
}
        <TouchableOpacity
          style={[
            v_fd5f43.endCallBtn,
            v_324ec4 && { backgroundColor: v_514359, shadowColor: v_514359 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={v_324ec4 ? "통화 종료 (지금 말할 수 있음)" : "통화 종료"}
          accessibilityHint={v_324ec4 ? "지금 말해도 됩니다. 이 버튼을 누르면 통화가 종료됩니다." : undefined}
          onPress={async () => {
            await v_cd8b64();
            v_c65f5d.goBack();
          }}
        >
          <Feather name="phone" size={28} color={v_1bfbd0.white} style={{ transform: [{ rotate: "135deg" }] }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[v_fd5f43.controlBtn, v_9e64e1 && v_fd5f43.controlBtnDanger]}
          onPress={() => v_e064ce(!v_9e64e1)}
        >
          <Feather name={v_9e64e1 ? "video-off" : "video"} size={24} color={v_1bfbd0.white} />
        </TouchableOpacity>
      </View>

      {}
      <Modal
        visible={v_d416b8}
        transparent
        animationType="slide"
      >
        <Pressable style={v_fd5f43.giftOverlay} onPress={() => v_2a4980(false)}>
          <Pressable
            style={[v_fd5f43.giftSheet, { paddingBottom: 24 + v_53dd92 }]}
            onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}
          >
            {}
            <View style={v_fd5f43.giftHeader}>
              <View style={v_fd5f43.giftHeaderLeft}>
                <Text style={v_fd5f43.giftTitle}>{v_8d41d7("call.giftTitle")}</Text>
              </View>
              <TouchableOpacity
                style={v_fd5f43.closeBtn}
                onPress={() => v_2a4980(false)}
              >
                <Feather name="x" size={18} color={v_1bfbd0.zinc600} />
              </TouchableOpacity>
            </View>

            {}
            <FlatList
              data={v_68bb66}
              keyExtractor={(v_8c0b26) => v_8c0b26.id}
              numColumns={3}
              columnWrapperStyle={v_fd5f43.giftRow}
              contentContainerStyle={v_fd5f43.giftGrid}
              scrollEnabled={false}
              renderItem={({ item: v_8c0b26 }) => (
                <TouchableOpacity
                  style={v_fd5f43.giftItem}
                  onPress={() => v_25b14f(v_8c0b26)}
                  activeOpacity={0.7}
                >
                  <View style={v_fd5f43.giftEmojiWrap}>
                    {v_8c0b26.imageUrl ? (
                      <Image source={{ uri: v_8c0b26.imageUrl }} style={v_fd5f43.giftImage} />
                    ) : (
                      <Text style={v_fd5f43.giftEmoji}>{v_8c0b26.emoji}</Text>
                    )}
                  </View>
                  <Text style={v_fd5f43.giftName}>{v_8c0b26.name}</Text>
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {}
      {}

      {}
      {v_8282fa && (
        <View style={v_fd5f43.toast}>
          <Text style={v_fd5f43.toastText}>{v_8282fa}</Text>
        </View>
      )}
    </View>
  );
}

const v_fd5f43 = v_472849.create({

  watermarkLayer: {
    position: "absolute",
    right: -34,
    alignItems: "flex-end",
  },

  voiceBallLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 14,
  },

  watermarkLogo: {
    width: 200,
    height: 40,
    resizeMode: "contain",
    tintColor: "rgba(255, 255, 255, 0.3)",
  },
  container: {
    flex: 1,
    backgroundColor: v_1bfbd0.zinc950,
  },

  videoEdgeMask: {
    overflow: "hidden",
  },
  videoEdgeTrim: {
    width: "100%",
    height: "100%",
    marginHorizontal: -v_5ac7d6,
  },

  pip: {
    position: "absolute",
    left: 16,
    width: 100,
    height: 140,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    zIndex: 10,
    elevation: 10,
  },
  pipImage: { width: "100%", height: "100%" },
  pipCamera: { width: "100%", height: "100%" },

  faceIndicator: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.4)",
  },
  faceIndicatorOn: {
    backgroundColor: "#22c55e", 
  },
  faceIndicatorOff: {
    backgroundColor: v_1bfbd0.zinc500, 
  },

  faceConsentBtn: {
    position: "absolute",
    left: 16,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 6,
    zIndex: 11,
  },
  faceConsentText: {
    fontSize: 10,
    color: v_1bfbd0.zinc200,
  },

  pipOff: {
    width: "100%",
    height: "100%",
    backgroundColor: v_1bfbd0.zinc900,
    alignItems: "center",
    justifyContent: "center",
  },

  callInfo: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },

  expertBadge: { position: "absolute", right: 16, zIndex: 41 },
  callName: {
    fontSize: 24,
    fontWeight: "700",
    color: v_1bfbd0.white,
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  callTimeText: {
    fontSize: 16,
    fontWeight: "600",
    color: v_1bfbd0.white,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  rightActions: {
    position: "absolute",
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    gap: 20,
    zIndex: 20,
  },
  sideBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  sideBtnActive: {
    backgroundColor: v_1bfbd0.violet500,
  },

  floatingEmoji: {
    position: "absolute",
    bottom: 200,
    fontSize: 48,
    zIndex: 30,
  },

  subtitleContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 15,
  },
  subtitleText: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: v_1bfbd0.white,
    fontSize: 15,
    fontWeight: '500',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    textAlign: 'center',
    alignSelf: 'center',
    maxWidth: '100%',
  },

  confirmTapArea: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: '33%',
    zIndex: 16,
  },
  confirmHint: {
    marginTop: 6,
    fontSize: 11,
    color: v_1bfbd0.zinc300,
    textAlign: 'center',
  },
  confirmBarTrack: {
    marginTop: 8,
    width: 160,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  confirmBarFill: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
    backgroundColor: v_1bfbd0.white,
  },

  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    zIndex: 18,
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(24,24,27,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  controlBtnDanger: {
    backgroundColor: v_1bfbd0.error,
  },
  endCallBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: v_1bfbd0.error,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: v_1bfbd0.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },

  giftOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  giftSheet: {
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,

    height: "80%",
  },
  giftHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc200,
  },
  giftHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  giftTitle: { fontSize: 18, fontWeight: "700", color: v_1bfbd0.zinc900 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  giftGrid: { paddingHorizontal: 24, paddingTop: 20 },
  giftRow: { gap: 12, marginBottom: 12 },
  giftItem: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    backgroundColor: v_1bfbd0.zinc50,
    borderRadius: v_8b0c90.lg,
  },
  giftEmojiWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: v_1bfbd0.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    elevation: 2,
    shadowColor: v_1bfbd0.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  giftEmoji: { fontSize: 24 },
  giftImage: { width: 40, height: 40, borderRadius: 8 },
  giftName: { fontSize: 13, fontWeight: "600", color: v_1bfbd0.zinc900, marginBottom: 2 },

  toast: {
    position: "absolute",
    bottom: 140,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: v_8b0c90.full,
    zIndex: 50,
  },
  toastText: { fontSize: 14, color: v_1bfbd0.white },

});
