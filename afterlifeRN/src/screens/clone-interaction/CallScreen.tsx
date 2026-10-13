import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  AppState,
  type AppStateStatus,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  Animated,
  Platform,
  Keyboard,
  Linking,
  TextInput,
  BackHandler,
  ActivityIndicator,
  ToastAndroid,
} from "react-native";

import { afl971ShouldShowAd, isAfl971AdTestAccount, afl971CanFireAd, afl971CallInteractive } from "./afl971Ad";
import * as ScreenCapture from "expo-screen-capture";
import ViewShot, { captureRef } from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import {
  startCallForegroundService,
  stopCallForegroundService,
} from "../../lib/callForegroundService";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";

import SvgaOverlay from "../../components/gift/SvgaOverlay";

import { useVideoPlayer, VideoView } from "expo-video";

import CallEntryQuestionsScreen from "../call-entry/CallEntryQuestionsScreen";

import SvgaThumb from "../../components/gift/SvgaThumb";
import { RTCView } from "react-native-webrtc";

import VisemePlayer from "../../components/viseme/VisemePlayer";

import {
  YoonjeongAvatarPlayer,
  type YoonjeongAvatarPlayerHandle,
} from "../../components/avatar/YoonjeongAvatarPlayer";
import {
  Camera as VisionCamera,
  useCameraDevice,
  useFrameProcessor,
} from "react-native-vision-camera";
import { Worklets } from "react-native-worklets-core";
import { useFaceDetector } from "react-native-vision-camera-face-detector";
import type { Face as DetectorFace } from "react-native-vision-camera-face-detector";
import { useTensorflowModel } from "react-native-fast-tflite";
import { useResizePlugin } from "vision-camera-resize-plugin";
import { useSharedValue } from "react-native-worklets-core";
import { useFaceDetection } from "../../hooks/useFaceDetection";
import { largestFace } from "../../face/largestFace";
import { computeAlignedCrop } from "../../face/faceAlignCrop";
import { computeLandmarkRatios, type LandmarkRatios } from "../../face/faceLandmarkRatios";
import { shouldRunEmbedding } from "../../face/embeddingThrottle";
import { normalizeFrameTimestampMs } from "../../face/frameTimestamp";
import { detectNewFaces } from "../../face/newFaceDetector";
import { useFaceIdentify } from "../../face/useFaceIdentify";
import { useAngleCollector } from "../../face/useAngleCollector";
import { useFaceEnroll, FACE_ENROLL_VECTOR_COUNT } from "../../face/useFaceEnroll";
import {
  decideSelfConfirm,
  classifySelfConfirmError,
  SELF_CONFIRM_INTERVAL_MS,
  SELF_CONFIRM_SAMPLE_COUNT,
} from "../../face/selfConfirm";
import { shouldCleanupOrphanOnSuggest } from "../../face/faceEnrollGuard";
import type { SpeakerEvent } from "../../face/speakerIdReducer";
import {
  speakerHandoffReducer,
  initSpeakerHandoffState,
  type SpeakerHandoffEvent,
  type SpeakerHandoffAction,
} from "../../realtime/speakerHandoff";
import { isFaceConsentEnforced } from "../../config/faceConsent";
import {
  createPerson,
  saveFaceConsent,
  listPersons,
  deletePerson,
  updatePersonName,
  selfConfirm,
  fetchFacePolicy,
  enrollFaces,
  type Person,
} from "../../api/persons";
import { AuthApiError } from "../../api/auth";
import {
  getCallLearningConsent,
  getFaceBiometricConsent,
  type CallLearningState,
  type FaceBiometricState,
} from "../../api/consent";
import ConsentPromptModal from "../../components/consent/ConsentPromptModal";
import { decideEnrollSuggestAction, decideOrphanCleanupBeforeSilent } from "../../face/autoEnrollGuard";
import { FACE_DIAG_ENABLED, formatFaceHud, type FaceDiag } from "../../config/faceDiag";
import TermsModal from "../../components/common/TermsModal";
import { useAvatarCall } from "../../realtime/useAvatarCall";
import { submitDevText } from "../../realtime/devCallText";
import { CALL_ROUTE } from "../../config/callRoute";
import { GREETING_ENABLED, GREETING_FALLBACK_TEXT, GREET_TIMEOUT_MS } from "../../config/greeting";
import { useHandsFreeController } from "../../realtime/useHandsFreeController";
import { IDLE_GREET_DELAYS_MS } from "../../realtime/handsFree";
import { shouldSkipUnknownFaceEntry, computeFaceKey } from "../../realtime/faceInterruptRouting";
import { useVideoStatsDiag } from "../../realtime/useVideoStatsDiag";
import { useJsFpsDiag } from "../../realtime/useJsFpsDiag";
import { DialingScreen } from "../../components/call/DialingScreen";
import { CallVoiceBall } from "../../components/call/CallVoiceBall";
import { CallTimingHUD } from "../../components/call/CallTimingHUD";
import { CallStateHUD } from "../../components/call/CallStateHUD";

import { FaceTrackHUD } from "../../components/call/FaceTrackHUD";
import {
  publishFaceTracks,
  publishFaceDiag,
  resetFaceRoster,
} from "../../face/faceTrackRosterStore";
import { CallTimingPanel } from "../../components/call/CallTimingPanel";
import { CloneSubtitleTicker } from "../../components/call/CloneSubtitleTicker";
import { useDevOverlayStore, useCallHudVisible } from "../../stores/devOverlayStore";
import { useTimingConfigStore } from "../../realtime/timingConfig";
import { startTimingLog } from "../../realtime/timingLog";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAndroidNavigationBarHeight } from "react-native-navigation-bar-height";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { useCloneStore } from "../../stores/cloneStore";
import { useAuthStore } from "../../stores/authStore";
import { getCloneL2 } from "../../api/clones";
import { COLORS, RADIUS } from "../../components/constants";

import { fetchGiftCatalog, type GiftCatalogItem } from "../../api/gifts";
import {
  getCloneLikeStatus,
  likeClone,
  unlikeClone,
  postCloneCallEvent,
  getCloneDetail,
} from "../../api/clones";
import { getCreditBalance } from "../../api/credits";
import { sendGiftOffchain, getGiftInventory, type GiftInventoryItem } from "../../api/giftInventory";
import { showAlert } from "../../stores/dialogStore";
import { CommonActions } from "@react-navigation/native";

import { updatePersonRelation } from "../../api/persons";
import { shouldAutoEnrollOwner, ownerEnrollName } from "../../face/ownerAutoEnroll";
import {
  initRememberMeState,
  rememberMeReducer,
  shouldHoldMic,
  GRACE_HOLD_MS,
  type RememberMeAction,
  type RememberMeEvent,
} from "../../realtime/rememberMeReducer";
import ExpertBadge from "../../components/ui/ExpertBadge";

type Props = NativeStackScreenProps<RootStackParamList, "Call">;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const VIDEO_FRAME_ASPECT = 512 / 1024; 
const VIDEO_W = SCREEN_W;
const VIDEO_H = Math.round(SCREEN_W / VIDEO_FRAME_ASPECT);
const VIDEO_TOP = Math.round((SCREEN_H - VIDEO_H) / 2);
const VIDEO_LEFT = Math.round((SCREEN_W - VIDEO_W) / 2);

const VIDEO_EDGE_TRIM_PX = 1;

const SHOW_USER_TRANSCRIPT = __DEV__; 

const SHOW_VOICE_BALL = false;

const SPEAK_OK_COLOR = "#2fbf6b";

const FACE_DETECTOR_OPTIONS = {
  performanceMode: "fast",
  trackingEnabled: true,
  landmarkMode: "all",
} as const;

interface FloatingGift {
  id: number;
  emoji: string;

  imageUrl?: string;
  animY: Animated.Value;
  animOpacity: Animated.Value;
  x: number;
}

type EmoteKey = "smile" | "wink" | "cry" | "angry" | "yawn";
const EMOTE_BASE_URL = "https://rtc.example.invalid/emote";
const EMOTE_SERVER_ACTIONS: ReadonlySet<EmoteKey> = new Set(["smile"]);

export { afl971ShouldShowAd };

function afl971WaitForForeground(timeoutMs: number): Promise<boolean> {
  if (AppState.currentState === "active") return Promise.resolve(true);
  return new Promise((resolve) => {
    let done = false;
    const finish = (v: boolean) => {
      if (done) return;
      done = true;
      sub.remove();
      clearTimeout(timer);
      resolve(v);
    };
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") finish(true);
    });
    const timer = setTimeout(() => finish(false), timeoutMs);
  });
}

function emoteVideoUri(cloneId: number, key: EmoteKey): string | null {
  if (!EMOTE_SERVER_ACTIONS.has(key) || !Number.isFinite(cloneId) || cloneId <= 0) return null;
  return `${EMOTE_BASE_URL}/${cloneId}/${key}.mp4`;
}

export default function CallScreen(props: Props) {
  const [heavyReady, setHeavyReady] = React.useState(false);
  React.useEffect(() => {

    const raf = requestAnimationFrame(() => setHeavyReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  const { cloneId, name: paramName, image: paramImage } = props.route.params;
  const placeholderImage = typeof paramImage === "string" ? paramImage : "";

  const clone = useCloneStore((s) => s.getCloneById(cloneId));
  const wrapperAccessToken = useAuthStore((s) => s.accessToken);

  const [callEntryOpen, setCallEntryOpen] = React.useState<boolean | null>(false);

  const [preCallGate, setPreCallGate] = React.useState<"checking" | "skip">("checking");

  const [consentGate, setConsentGate] = React.useState<"checking" | "need" | "ok">("checking");
  const [faceConsentState, setFaceConsentState] = React.useState<FaceBiometricState | null>(null);
  const [callConsentState, setCallConsentState] = React.useState<CallLearningState | null>(null);

  const [prefetchedPipeline, setPrefetchedPipeline] = React.useState<string | null | undefined>(undefined);
  React.useEffect(() => {
    if (!wrapperAccessToken) {
      setPrefetchedPipeline(null);
      return;
    }

    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        console.warn("[Call][prefetch] pipeline timeout → null (15s)");
        setPrefetchedPipeline(null);
      }
    }, 15000);
    (async () => {
      try {
        const { getCloneDetail } = await import("../../api/clones");
        const detail = await getCloneDetail(cloneId, wrapperAccessToken);
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        const p = (detail as { clone?: { pipeline?: string | null } })?.clone?.pipeline ?? null;
        if (__DEV__) console.log(`[Call][prefetch] pipeline for clone ${cloneId} = ${p ?? 'null'}`);
        setPrefetchedPipeline(p);
      } catch (err) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        console.warn("[Call][prefetch] error, null:", err);
        setPrefetchedPipeline(null);
      }
    })();
    return () => {
      settled = true;
      clearTimeout(timer);
    };

  }, [wrapperAccessToken, cloneId]);
  React.useEffect(() => {
    if (!wrapperAccessToken) {
      setPreCallGate("skip");
      return;
    }

    if (consentGate !== "ok") {
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {

      if (!cancelled) {
        console.warn("[Call][preCallGate] timeout → skip");
        setPreCallGate("skip");
      }
    }, 2000);
    (async () => {
      try {

        const [consentR, personsR] = await Promise.all([
          getFaceBiometricConsent(wrapperAccessToken).catch(() => null),
          listPersons(wrapperAccessToken).catch(() => null),
        ]);
        if (cancelled) return;
        clearTimeout(timer);
        const granted = consentR?.state === "granted";
        const personCount = personsR?.items?.length ?? -1;
        const shouldRedirect = granted && personCount === 0;
        console.log(
          `[Call][preCallGate] granted=${granted} · personCount=${personCount} (user-wide) · redirect=${shouldRedirect}`,
        );
        if (shouldRedirect) {

          props.navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: "PreCallFaceEnroll",
                  params: { cloneId, name: paramName, image: paramImage },
                },
              ],
            }),
          );
          return;
        }
        setPreCallGate("skip");
      } catch (err) {
        if (cancelled) return;
        clearTimeout(timer);
        console.warn("[Call][preCallGate] error, skip:", err);
        setPreCallGate("skip");
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };

  }, [wrapperAccessToken, cloneId, consentGate]);

  React.useEffect(() => {
    if (!wrapperAccessToken) {
      setConsentGate("ok");
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) {
        console.warn("[Call][consentGate] timeout → ok");
        setConsentGate("ok");
      }
    }, 2000);
    (async () => {
      try {
        const [face, call] = await Promise.all([
          getFaceBiometricConsent(wrapperAccessToken).catch(() => null),
          getCallLearningConsent(wrapperAccessToken).catch(() => null),
        ]);
        if (cancelled) return;
        clearTimeout(timer);
        const faceOk = face == null || face.state === "granted";
        const callOk = call == null || call === "granted";
        setFaceConsentState(face?.state ?? null);
        setCallConsentState(call);
        const needed = !faceOk || !callOk;
        console.log(
          `[Call][consentGate] face=${face?.state ?? "none"} · call=${call ?? "none"} · need=${needed}`,
        );
        setConsentGate(needed ? "need" : "ok");
      } catch (err) {
        if (cancelled) return;
        clearTimeout(timer);
        console.warn("[Call][consentGate] error, ok:", err);
        setConsentGate("ok");
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };

  }, [wrapperAccessToken]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.zinc950 }}>
      {

}
      {consentGate === "need" ? null : callEntryOpen !== false || !heavyReady || preCallGate === "checking" || prefetchedPipeline === undefined || consentGate !== "ok" ? (
        <DialingScreen
          liveState="idle"
          personaName={paramName ?? ""}
          personaImage={placeholderImage}

          silent={callEntryOpen !== false || preCallGate === "checking" || prefetchedPipeline === undefined || consentGate !== "ok"}
          onConnected={() => {}}
          onCancel={() => props.navigation.goBack()}
          onRetry={() => {}}
        />
      ) : (

        <CallScreenInner {...props} initialPipeline={prefetchedPipeline} />
      )}

      {
}
      <CallEntryQuestionsScreen
        visible={callEntryOpen === true}
        cloneId={cloneId}
        name={clone?.displayName ?? paramName ?? ""}
        onCancel={() => {
          setCallEntryOpen(false);
          props.navigation.goBack();
        }}
        onCall={() => setCallEntryOpen(false)}
        onLearn={() => {
          setCallEntryOpen(false);

          props.navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: "Main",
                  state: {
                    index: 0,
                    routes: [
                      {
                        name: "ClonesTab",
                        state: {
                          index: 1,
                          routes: [
                            { name: "Dashboard" },
                            { name: "CloneLearn", params: { cloneId } },
                          ],
                        },
                      },
                    ],
                  },
                } as never,
              ],
            }),
          );
        }}
      />

      {
}
      <ConsentPromptModal
        visible={consentGate === "need"}
        accessToken={wrapperAccessToken}
        faceState={faceConsentState}
        callState={callConsentState}
        onComplete={(next) => {
          setFaceConsentState(next.face);
          setCallConsentState(next.call);
          setConsentGate("ok");
        }}
        onCancel={() => {
          setConsentGate("ok"); 
          props.navigation.goBack();
        }}
      />
    </View>
  );
}

interface InnerProps extends Props {
  initialPipeline: string | null;
}

function CallScreenInner({ route, navigation, initialPipeline }: InnerProps) {
  const { t } = useTranslation();
  const { cloneId, name: paramName, image: paramImage } = route.params;
  const clone = useCloneStore((s) => s.getCloneById(cloneId));
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentUserId = useAuthStore((s) => s.apiUser?.id ?? null);

  const debugEmail = useAuthStore((s) => s.apiUser?.email ?? null);
  const emoteDebugEnabled =
    debugEmail === "oth-staff@example.invalid" || debugEmail === "oth-user@example.invalid";

  const isOwnClone =
    !!clone && clone.ownerId != null && currentUserId != null && clone.ownerId === currentUserId;
  const insets = useSafeAreaInsets();
  const navBarHeight = useAndroidNavigationBarHeight(0);
  const bottomInset =
    Platform.OS === "ios" ? insets.bottom : Math.max(navBarHeight, insets.bottom);
  const callDevUi = useDevOverlayStore((s) => s.callDevUiVisible);
  const showCallDev = __DEV__ && callDevUi;

  const hudDevBox = useCallHudVisible("devBox");
  const hudTiming = useCallHudVisible("timing");
  const hudState = useCallHudVisible("state");
  const hudFaceTrack = useCallHudVisible("faceTrack");

  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("front");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const [faceProcOff, setFaceProcOff] = useState(false);

  const [dialingDone, setDialingDone] = useState(false);

  const [poorConnection, setPoorConnection] = useState(false);

  const [faceIdentifyEnabled, setFaceIdentifyEnabled] = useState(true);
  const [selfConfirmed, setSelfConfirmed] = useState(true); 
  const selfSamplesRef = useRef<number[][]>([]);
  const selfConfirmingRef = useRef(false);

  const vcDevice = useCameraDevice(cameraFacing === "front" ? "front" : "back");

  const { faceState, onFaces } = useFaceDetection();

  const { detectFaces, stopListeners } = useFaceDetector(FACE_DETECTOR_OPTIONS);

  const pipCameraRef = useRef<VisionCamera>(null);

  useEffect(() => {
    return () => {
      stopListeners();
    };
  }, [stopListeners]);

  const handleFacesOnJS = React.useMemo(
    () =>
      Worklets.createRunOnJS((faces: DetectorFace[]) => {
        const bridged = faces.map((f) => ({
          trackingID: f.trackingId,
          bounds: f.bounds,
        }));
        onFaces(bridged);
      }),

    [],
  );

  const [consentGranted, setConsentGranted] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);

  const [consentLoading, setConsentLoading] = useState(false);

  const [faceDiag, setFaceDiag] = useState<FaceDiag | null>(null);
  const [gtPersonId, setGtPersonId] = useState<number | null>(null);
  const [persons, setPersons] = useState<Person[]>([]);

  useEffect(() => {

    void VisionCamera.requestCameraPermission();

    if (!accessToken) return;
    let cancelled = false;

    listPersons(accessToken, cloneId)
      .then(({ items }) => {
        if (cancelled) return;
        const hasPersonConsent = items.some((p) => p.consentState === "granted");
        setPersons(items); 
        console.log(
          `[Call][face] listPersons ← personConsent=${hasPersonConsent} (total=${items.length}) · gate=약관동의`,
        );
      })
      .catch((err) => {
        console.warn("[Call][face] listPersons failed:", err);
      });
    return () => {
      cancelled = true;
    };

  }, [accessToken]);

  const [faceBiometricConsent, setFaceBiometricConsent] = useState<boolean | null>(null);
  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getFaceBiometricConsent(accessToken)
      .then((r) => {
        if (cancelled) return;

        const allowed = r.state !== "revoked";
        setFaceBiometricConsent(allowed);
        setConsentGranted(allowed);
        console.log(`[Call][face] getFaceBiometricConsent ← state=${r.state} · faceId=${allowed ? "on" : "off(설정에서 끔)"}`);
      })
      .catch((err) => {
        if (cancelled) return;

        setFaceBiometricConsent(false);
        setConsentGranted(false);
        console.warn("[Call][face] getFaceBiometricConsent failed → faceId off for this call:", err);
      });
    return () => {
      cancelled = true;
    };

  }, [accessToken]);

  const autoEnrolledNoNameRef = useRef<Set<number>>(new Set());

  const silentEnrollRef = useRef(false);

  const submittedEnrollNameRef = useRef("");

  const enrollSuggestImplRef = useRef<(name: string, personId?: number) => void>(() => {});

  const rememberMeAskedImplRef = useRef<() => void>(() => {});
  const handleRememberMeAsked = useCallback(() => {
    rememberMeAskedImplRef.current();
  }, []);
  const handleEnrollSuggest = useCallback((name: string, personId?: number) => {
    enrollSuggestImplRef.current(name, personId);
  }, []);

  const [livePipeline, setLivePipeline] = useState<string | null>(initialPipeline);

  const [liveVisemePrefix, setLiveVisemePrefix] = useState<string | null>(null);

  const [liveTtsOutput, setLiveTtsOutput] = useState<string | null>(null);

  const [liveVoiceModelManifestUrl, setLiveVoiceModelManifestUrl] = useState<string | null>(null);

  const [liveIdleVideoUrl, setLiveIdleVideoUrl] = useState<string | null>(null);

  const {
    state: liveState,
    remoteStream,
    start: startLive,
    stop: stopLive,
    say,
    getStatsReport,
    notifySpeechEnd,
    greet,
    speak,
    lastSignal,
    sendFaceEvent,
    sendAudioReady,
    sendAdPrepareReturn,
    sendAdReturned,
    getCallId,

    visemeResponse,
  } = useAvatarCall({
    cloneId,
    accessToken: accessToken ?? "",
    onEnrollSuggest: handleEnrollSuggest,

    onRememberMe: handleRememberMeAsked,

    pipeline: livePipeline ?? (clone as { pipeline?: string | null })?.pipeline ?? null,

    usesBridge:
      (livePipeline ?? (clone as { pipeline?: string | null })?.pipeline ?? null) === 'avatar_v2' ||
      String(paramName || (clone as { displayName?: string } | null | undefined)?.displayName || '')
        .toLowerCase().includes('[v2]'),

    ttsOutput: liveTtsOutput ?? (clone as { ttsOutput?: string | null })?.ttsOutput ?? null,

    voiceModelManifestUrl: liveVoiceModelManifestUrl,
  });

  useEffect(() => {
    if (!cloneId || !accessToken) return;
    let alive = true;
    (async () => {
      try {
        const { getCloneDetail } = await import("../../api/clones");
        const detail = await getCloneDetail(cloneId, accessToken);
        if (alive) {
          const cloneData = (detail as { clone?: { pipeline?: string | null; visemePrefix?: string | null; ttsOutput?: string | null; voiceModelManifestUrl?: string | null; idleVideoUrl?: string | null } })?.clone;
          const p = cloneData?.pipeline ?? null;
          const vp = cloneData?.visemePrefix ?? null;
          const to = cloneData?.ttsOutput ?? null;
          const vmu = cloneData?.voiceModelManifestUrl ?? null;
          const iv = cloneData?.idleVideoUrl ?? null;
          setLivePipeline(p);
          setLiveVisemePrefix(vp);
          setLiveTtsOutput(to);
          setLiveVoiceModelManifestUrl(vmu);
          setLiveIdleVideoUrl(iv);
          if (__DEV__) console.log(`[T-467] livePipeline for clone ${cloneId} = ${p} · visemePrefix = ${vp ? "set" : "null"} · ttsOutput = ${to ?? "null"} · voiceManifest = ${vmu ? "set" : "null"} · idleVideo = ${iv ? "set" : "null"}`);

          const needsIdleAsset = p === 'musetalk' || p === 'echomimic_v3';
          if (needsIdleAsset && !iv) {
            showAlert(
              t('call.assetBuildingTitle', { defaultValue: '통화 준비 중이에요' }),
              t('call.assetBuildingBody', { defaultValue: '얼굴·목소리 준비에 5~15분이 걸려요. 조금 뒤에 다시 걸어주세요.' }),
            );
            if (navigation.canGoBack()) navigation.goBack();
            return;
          }
        }
      } catch (err) {
        if (__DEV__) console.warn("[T-467] getCloneDetail pipeline fetch failed:", err);
      }
    })();
    return () => { alive = false; };
  }, [cloneId, accessToken]);

  const [devText, setDevText] = useState("");

  const [devKbHeight, setDevKbHeight] = useState(0);
  useEffect(() => {
    if (!__DEV__) return;
    const showSub = Keyboard.addListener("keyboardDidShow", (e) =>
      setDevKbHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setDevKbHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const greetingOn = GREETING_ENABLED && typeof greet === 'function';

  useVideoStatsDiag({ getStatsReport, enabled: liveState === "live" });
  useJsFpsDiag({ enabled: liveState === "live" });

  const faceEmbedModelPlugin = useTensorflowModel(
    require("../../../assets/models/w600k_mbf.tflite"),
  );
  const faceEmbedModel =
    faceEmbedModelPlugin.state === "loaded" ? faceEmbedModelPlugin.model : undefined;
  const { resize } = useResizePlugin();

  const isAndroidFrame = Platform.OS === "android";

  const lastEmbedTs = useSharedValue(0);

  const lastFaceCount = useSharedValue(-1);

  const embedAllowed = useSharedValue(true);

  const seenFaceIdsRef = useRef<Set<number>>(new Set());

  const currentLandmarkRef = useRef<LandmarkRatios | null>(null);

  const handleSpeakerEventRef = useRef<(evt: SpeakerEvent) => void>(() => {});

  const myNameRef = useRef<string | null>(null);

  const ownerAutoEnrollTriedRef = useRef(false);

  const surveyAddressRef = useRef<string | null>(null);

  const namelessPersonIdRef = useRef<number | null>(null);
  const handleSpeakerEventTrampoline = useCallback((evt: SpeakerEvent) => {
    handleSpeakerEventRef.current(evt);
  }, []);

  const shStateRef = useRef(initSpeakerHandoffState());
  const dispatchShRef = useRef<(event: SpeakerHandoffEvent) => void>(() => {});
  const dispatchSh = useCallback((event: SpeakerHandoffEvent) => {
    dispatchShRef.current(event);
  }, []);

  const [rmState, setRmState] = useState(initRememberMeState());
  const rmStateRef = useRef(rmState);

  const rmActionRef = useRef<(a: RememberMeAction) => void>(() => {});

  const phaseRef = useRef<string>("idle");

  const liveStateRef = useRef<string>("idle");

  const afl971MicRestorePendingRef = useRef<boolean>(false);

  const chatReplyStartAt = useRef<number | null>(null);
  const dispatchRm = useCallback((event: RememberMeEvent) => {
    const { state, actions } = rememberMeReducer(rmStateRef.current, event, Date.now());
    rmStateRef.current = state;
    setRmState(state);
    for (const a of actions) {
      console.log(`[Call][rm] ${a.type}`);
      rmActionRef.current(a);
    }
  }, []);

  useEffect(() => {
    rememberMeAskedImplRef.current = () => {
      console.log("[Call][rm] server asked → open sheet");
      dispatchRm({ type: "OPEN_SHEET" });
    };
  }, [dispatchRm]);

  const notifyFaceInterruptRef = useRef<(text: string, faceKey: string) => void>(() => {});

  const micOnRef = useRef(false);

  const namingSessionIdRef = useRef(0);

  const unknownFaceSnapshotRef = useRef<number[][] | null>(null);

  const calibrateOpt = useMemo(
    () => (FACE_DIAG_ENABLED ? { accessToken: accessToken ?? "", groundTruthPersonId: gtPersonId } : null),
    [accessToken, gtPersonId],
  );

  const angleCollector = useAngleCollector({
    accessToken,
    cloneId,
    enabled: consentGranted && liveState === "live" && faceIdentifyEnabled,
  });

  const {
    onEmbedding: onFaceEmbedding,
    getBuffer: getFaceEmbeddingBuffer,
    resetRecognition: resetSpeakerRecognition,
  } = useFaceIdentify({

    enabled: consentGranted && liveState === "live" && faceIdentifyEnabled,
    accessToken: accessToken ?? "",
    cloneId,
    onEvent: handleSpeakerEventTrampoline,
    onDiag: setFaceDiag,
    calibrate: calibrateOpt,
    onCollected: angleCollector.observe,

    getCurrentLandmark: useCallback(() => currentLandmarkRef.current, []),
  });

  useEffect(() => {
    publishFaceDiag(faceDiag, Date.now());
  }, [faceDiag]);

  useEffect(() => {
    resetFaceRoster();
    return () => resetFaceRoster();
  }, []);

  const handleSpeakerEvent = useCallback(
    (evt: SpeakerEvent) => {
      if (!evt) return;
      if (evt.type === "speaker_confirmed") {

        const name = evt.displayName ?? persons.find((p) => p.id === evt.personId)?.displayName ?? null;
        if (name) {
          dispatchSh({ type: "SPEAKER_CONFIRMED", personId: evt.personId, name });
        }

        namelessPersonIdRef.current = name ? null : evt.personId;

        dispatchRm({
          type: "MATCH_KNOWN",
          personId: evt.personId,
          displayName: name,
          named: !!name,

          cloneSpeaking: chatReplyStartAt.current !== null,
        });
      } else if (evt.type === "unknown_face") {

        if (
          shouldAutoEnrollOwner({
            personCount: persons?.length ?? 0,
            ownerName: surveyAddressRef.current ?? myNameRef.current,
            alreadyTried: ownerAutoEnrollTriedRef.current,
          })
        ) {
          ownerAutoEnrollTriedRef.current = true;
          const _n = ownerEnrollName(surveyAddressRef.current ?? myNameRef.current);
          console.log(`[Call][face] owner auto-enroll → "${_n}"`);

          unknownFaceSnapshotRef.current = getFaceEmbeddingBuffer().latest(FACE_ENROLL_VECTOR_COUNT);
          void faceEnroll
            .enroll(_n)
            .then(() => {
              dispatchRm({ type: "ENROLLED" });

              const pid = faceEnroll.getEnrolledPersonId();
              if (pid != null) {
                console.log(`[Call][face] auto-enroll 완료 → silent speaker_confirmed(${pid})`);
                sendFaceEvent?.({
                  event: "speaker_confirmed",
                  personId: pid,
                  displayName: _n,
                  silent: true,
                });
              }
            })
            .catch((err) => {

              console.warn("[Call][face] owner auto-enroll 실패 → Remember Me:", err);

              dispatchRm({ type: "MATCH_UNKNOWN", score: evt.score, topPersonId: evt.topPersonId ?? null, landmarkVsRef: evt.landmarkVsRef ?? null, hasFace: evt.hasFace ?? false });
            });

          dispatchSh({ type: "UNKNOWN_FACE" });
          return;
        }

        dispatchRm({ type: "MATCH_UNKNOWN", score: evt.score, topPersonId: evt.topPersonId ?? null, landmarkVsRef: evt.landmarkVsRef ?? null, hasFace: evt.hasFace ?? false });
        dispatchSh({ type: "UNKNOWN_FACE" });

        unknownFaceSnapshotRef.current = getFaceEmbeddingBuffer().latest(FACE_ENROLL_VECTOR_COUNT);
      }
    },

    [sendFaceEvent, getFaceEmbeddingBuffer, dispatchSh, persons],
  );
  useEffect(() => {
    handleSpeakerEventRef.current = handleSpeakerEvent;
  }, [handleSpeakerEvent]);

  const faceEnroll = useFaceEnroll({
    accessToken: accessToken ?? "",
    cloneId,
    getBuffer: getFaceEmbeddingBuffer,
    getSnapshot: () => unknownFaceSnapshotRef.current,
  });

  useEffect(() => {
    if (!accessToken || !cloneId) return;
    let cancelled = false;
    void (async () => {
      try {
        const policy = await fetchFacePolicy(accessToken, cloneId);
        if (cancelled) return;
        setFaceIdentifyEnabled(policy.faceIdentifyEnabled);
        setSelfConfirmed(clone?.selfPersonId != null);
      } catch (err) {
        if (cancelled) return;
        console.warn(
          "[Call][self] face-policy 조회 실패 — 정책 불명, self 미확정으로 폴백(루프는 계속 진행):",
          err,
        );
        setSelfConfirmed(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, cloneId, clone?.selfPersonId]);

  useEffect(() => {
    if (selfConfirmed || !faceIdentifyEnabled) return;
    if (!accessToken || !cloneId) return;

    let cancelled = false;

    const timer = setInterval(() => {
      if (selfConfirmingRef.current) return;
      const latest = getFaceEmbeddingBuffer().latest(1);
      if (latest.length === 0) return;
      selfSamplesRef.current = [...selfSamplesRef.current, latest[0]!].slice(
        -SELF_CONFIRM_SAMPLE_COUNT,
      );

      const action = decideSelfConfirm({
        alreadyConfirmed: selfConfirmed,
        faceIdentifyEnabled,
        samples: selfSamplesRef.current,
        threshold: 0.45, 
      });

      if (action.kind === "reset") {
        selfSamplesRef.current = [];
        return;
      }
      if (action.kind !== "confirm") return;

      selfConfirmingRef.current = true;
      void selfConfirm(accessToken, cloneId, action.vectors)
        .then((res) => {
          if (cancelled) return;
          console.log(`[Call][self] self 확정 personId=${res.selfPersonId}`);
          setSelfConfirmed(true);
        })
        .catch((err) => {
          if (cancelled) return;

          const status = err instanceof AuthApiError ? err.status : undefined;
          const cls = classifySelfConfirmError(status);
          if (cls === "confirmed") {
            console.log("[Call][self] self 확정 실패 → 409(이미 확정) — 확정으로 간주, 재시도 중단");
            setSelfConfirmed(true);
          } else {
            console.warn(
              `[Call][self] self 확정 실패(재시도 예정) status=${status ?? "network"}:`,
              err,
            );

          }
        })
        .finally(() => {
          selfConfirmingRef.current = false;
          selfSamplesRef.current = [];
        });
    }, SELF_CONFIRM_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [selfConfirmed, faceIdentifyEnabled, accessToken, cloneId, getFaceEmbeddingBuffer]);

  const NAMING_TIMEOUT_MS = 20000;
  const namingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runShActions = useCallback(

    (actions: SpeakerHandoffAction[], faceKey: string) => {
      for (const a of actions) {
        if (a.type === "SAY") {
          notifyFaceInterruptRef.current(a.text, faceKey);
        } else if (a.type === "BEGIN_NAMING") {
          if (namingTimerRef.current) clearTimeout(namingTimerRef.current);
          namingTimerRef.current = setTimeout(() => {
            dispatchShRef.current({ type: "NAMING_TIMEOUT" });
          }, NAMING_TIMEOUT_MS);
        } else if (a.type === "END_NAMING") {
          if (namingTimerRef.current) {
            clearTimeout(namingTimerRef.current);
            namingTimerRef.current = null;
          }
        } else if (a.type === "DISCARD_RECOGNITION") {

          faceEnroll.reset();
          resetSpeakerRecognition();
        }
      }
    },
    [faceEnroll, resetSpeakerRecognition],
  );
  useEffect(() => {
    dispatchShRef.current = (event: SpeakerHandoffEvent) => {
      const prevNaming = shStateRef.current.naming;

      if (shouldSkipUnknownFaceEntry(event, prevNaming, micOnRef.current)) return;
      const { state, actions } = speakerHandoffReducer(shStateRef.current, event);

      const { faceKey, nextSessionId } = computeFaceKey(
        event, prevNaming, state.naming, namingSessionIdRef.current,
      );
      namingSessionIdRef.current = nextSessionId;
      shStateRef.current = state;
      runShActions(actions, faceKey);
    };
  }, [runShActions]);

  useEffect(() => {
    return () => {
      if (namingTimerRef.current) clearTimeout(namingTimerRef.current);
    };
  }, []);

  const handleEnrollSuggestImpl = useCallback(
    (name: string, personId?: number) => {

      const action = decideEnrollSuggestAction({
        personId,
        faceBiometricConsent: isFaceConsentEnforced() ? faceBiometricConsent : true,
        autoEnrolledNoName: personId !== undefined && autoEnrolledNoNameRef.current.has(personId),
        enrolling: faceEnroll.status === "enrolling",
      });

      if (action.kind === "ignore") return;

      if (action.kind === "reflect_name") {

        if (accessToken && personId !== undefined) {
          void updatePersonName(accessToken, personId, name)
            .then(() => {
              autoEnrolledNoNameRef.current.delete(personId);
            })
            .catch((err) => {
              console.warn("[Call][face] updatePersonName failed:", err);
            });
        }
        return;
      }

      const hasSpokenName = name.trim().length > 0;

      if (action.kind === "silent" && !hasSpokenName) {
        console.log("[Call][face] enroll_suggest(무명) 무시 — 이름은 Remember Me 로만 받는다");
        return;
      }

      const pendingId = faceEnroll.getPendingPersonId();
      const shouldCleanup = shouldCleanupOrphanOnSuggest({
        enrolling: false,
        pendingPersonId: pendingId,
        incomingName: name,
        lastName: submittedEnrollNameRef.current,
      });
      if (shouldCleanup) {
        if (accessToken && pendingId != null) {
          void deletePerson(accessToken, pendingId).catch((err) => {
            console.warn("[Call][face] orphan person cleanup(deletePerson) failed:", err);
          });
        }
        faceEnroll.reset();
      }
      submittedEnrollNameRef.current = name;
      void faceEnroll.enroll(name);
      return;
    },
    [faceEnroll, accessToken, faceBiometricConsent],
  );
  useEffect(() => {
    enrollSuggestImplRef.current = handleEnrollSuggestImpl;
  }, [handleEnrollSuggestImpl]);

  const [rmSaving, setRmSaving] = useState(false);
  const [rmError, setRmError] = useState<string | null>(null);
  const handleRememberMeSubmit = useCallback(
    async (name: string, relation: string) => {
      if (!name.trim()) return;
      setRmSaving(true);
      setRmError(null);
      try {

        const nameless = namelessPersonIdRef.current;
        if (nameless != null) {
          await updatePersonName(accessToken ?? "", nameless, name.trim());
          namelessPersonIdRef.current = null;
        } else {
          await faceEnroll.enroll(name.trim());
        }
        const rel = relation.trim();
        if (rel) {

          try {
            const pid = nameless ?? faceEnroll.getEnrolledPersonId();
            if (pid != null) {
              await updatePersonRelation(accessToken ?? "", pid, rel);
            }
          } catch (err) {
            console.warn("[Call][rm] relation 저장 실패(등록은 유지):", err);
          }
        }
        dispatchRm({ type: "ENROLLED" });
      } catch (err) {
        console.warn("[Call][rm] enroll 실패:", err);
        setRmError("등록에 실패했어요. 다시 시도해 주세요.");
      } finally {
        setRmSaving(false);
      }
    },
    [faceEnroll, dispatchRm, accessToken, cloneId],
  );

  const handleEmbeddingOnJS = React.useMemo(
    () =>
      Worklets.createRunOnJS(
        (vector: number[], faceCount: number, trackingIds: number[], landmarkRatiosJson: string | null) => {
          if (faceCount > 1) {
            const { newIds, seen } = detectNewFaces(seenFaceIdsRef.current, trackingIds);
            seenFaceIdsRef.current = seen;
            if (newIds.length > 0) {
              sendFaceEvent?.({ event: "multi_face" });
            }
          }

          currentLandmarkRef.current = landmarkRatiosJson
            ? (JSON.parse(landmarkRatiosJson) as LandmarkRatios)
            : null;
          onFaceEmbedding(vector);

          publishFaceTracks(trackingIds, Date.now());
        },
      ),

    [onFaceEmbedding, sendFaceEvent],
  );

  const faceFrameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      const faces = detectFaces(frame);
      handleFacesOnJS(faces); 

      const nowMs = normalizeFrameTimestampMs(frame.timestamp, isAndroidFrame);

      const curFaceCount = faces.length;
      if (lastFaceCount.value !== -1 && curFaceCount !== lastFaceCount.value) {
        lastEmbedTs.value = 0;
      }
      lastFaceCount.value = curFaceCount;

      if (faceEmbedModel != null && embedAllowed.value && shouldRunEmbedding(lastEmbedTs.value, nowMs)) {
        lastEmbedTs.value = nowMs;
        const primary = largestFace(faces);
        if (primary != null) {

          const aligned = computeAlignedCrop(primary);
          let cropX: number;
          let cropY: number;
          let cropW: number;
          let cropH: number;
          if (aligned != null) {
            cropX = aligned.x;
            cropY = aligned.y;
            cropW = aligned.width;
            cropH = aligned.height;
          } else {
            const _bx = primary.bounds.x;
            const _by = primary.bounds.y;
            const _bw = primary.bounds.width;
            const _bh = primary.bounds.height;
            const _mx = _bw * 0.15;
            const _my = _bh * 0.15;
            cropX = Math.max(0, _bx - _mx);
            cropY = Math.max(0, _by - _my);
            cropW = _bw + _mx * 2;
            cropH = _bh + _my * 2;
          }
          const resized = resize(frame, {
            crop: { x: cropX, y: cropY, width: cropW, height: cropH },
            scale: { width: 112, height: 112 },
            pixelFormat: "rgb",
            dataType: "float32",
          });

          const normalized = new Float32Array(resized.length);
          for (let i = 0; i < resized.length; i++) {
            normalized[i] = resized[i] * 2 - 1;
          }
          const out = faceEmbedModel.runSync([normalized])[0] as Float32Array;
          const trackingIds = faces
            .map((f) => f.trackingId)
            .filter((id): id is number => typeof id === "number");

          const rtRatios = computeLandmarkRatios(primary as unknown as { bounds: { x: number; y: number; width: number; height: number }; landmarks?: Record<string, { x: number; y: number }> | null });
          const rtRatiosJson: string | null = rtRatios ? JSON.stringify(rtRatios) : null;
          handleEmbeddingOnJS(Array.from(out), faces.length, trackingIds, rtRatiosJson);
        }
      }
    },
    [
      detectFaces,
      handleFacesOnJS,
      faceEmbedModel,
      resize,
      lastEmbedTs,
      lastFaceCount,
      embedAllowed,
      isAndroidFrame,
      handleEmbeddingOnJS,
    ],
  );

  const sttGiveUpRef = useRef(false);
  const handleSttUnrecoverable = useCallback((reason: 'network') => {
    if (sttGiveUpRef.current) return;
    sttGiveUpRef.current = true;
    console.log(`[Call][flow] +${Date.now()} STT unrecoverable(${reason}) → stopLive + DialingScreen(poorConnection)`);
    setPoorConnection(true);
    setDialingDone(false);
    void stopLive();
  }, [stopLive]);

  const sayForHandsFree = useCallback(
    (text: string) => {
      const willBeRound = afl971RoundCountRef.current + 1;

      const faceBusy = rmStateRef.current.promptRegister;
      const adNext =
        afl971IsFirstCallRef.current === false &&
        !faceBusy &&
        afl971ShouldShowAd(willBeRound, isAfl971AdTestAccount(debugEmail));

      console.log(
        `[Call][afl971] 예고판정 willBeRound=${willBeRound} adNext=${adNext} ` +
        `isFirstCall=${afl971IsFirstCallRef.current} faceBusy=${faceBusy} ` +
        `promptRegister=${rmStateRef.current.promptRegister} naming=${shStateRef.current.naming} ` +
        `testAcct=${isAfl971AdTestAccount(debugEmail)}`,
      );

      afl971AdCommittedRoundRef.current = adNext ? willBeRound : null;
      return adNext ? say(text, { adNotice: "pre" }) : say(text);
    },
    [say, debugEmail],
  );

  const sttEndpointMs = useTimingConfigStore((s) => s.sttEndpointMs);

  const confirmGateEnabled = useTimingConfigStore((s) => s.confirmGateEnabled);
  const {
    phase,
    micOn,
    toggleMic,
    pendingText,
    cancelConfirm,
    transcript,
    interimTranscript,
    devForceListen,
    micLevel,
    cloneAudioLevel,
    sttActive,
    notifyFaceInterrupt,
    idleGreetCount,
  } = useHandsFreeController({
    onSttUnrecoverable: handleSttUnrecoverable,

    enabled: liveState === "live",

    say: sayForHandsFree,
    getStatsReport,
    notifySpeechEnd,
    greeting: greetingOn,
    greet,
    speak,
    lastSignal,
    greetTimeoutMs: GREET_TIMEOUT_MS,
    fallbackText: GREETING_FALLBACK_TEXT,
    silenceMs: sttEndpointMs,
    confirmGate: __DEV__ && confirmGateEnabled,

    signalGating: typeof greet === 'function',

    contextualStrings: (paramName || clone?.displayName)
      ? [(paramName || clone?.displayName) as string]
      : undefined,
  });

  useEffect(() => {
    notifyFaceInterruptRef.current = notifyFaceInterrupt;
  }, [notifyFaceInterrupt]);

  const micHeld = shouldHoldMic(rmState) || bridgeActive || afl971AdInProgress;

  const micHeldRef = useRef(micHeld);
  micHeldRef.current = micHeld;
  const micWasOnRef = useRef(false);
  useEffect(() => {
    if (liveState !== "live") return;
    if (micHeld) {
      micWasOnRef.current = micOn;
      if (micOn) toggleMic();
      return;
    }
    if (micWasOnRef.current && !micOn) toggleMic();
    micWasOnRef.current = false;

  }, [micHeld, liveState]);

  useEffect(() => {
    liveStateRef.current = liveState; 
  }, [liveState]);
  useEffect(() => {
    phaseRef.current = phase;

    embedAllowed.value = phase !== "sending";
  }, [phase]);

  const hangupInFlightRef = useRef(false);
  const idleHangupTriggerRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (liveState !== "live") return;
    if (hangupInFlightRef.current) return;
    if (idleGreetCount < IDLE_GREET_DELAYS_MS.length) return;
    hangupInFlightRef.current = true;
    console.log(
      `[Call][idle] 무발화 워치독 종점 (${IDLE_GREET_DELAYS_MS.length}회) · goodbye 발화 후 종료 예약`,
    );

    const id = setTimeout(() => {
      console.log("[Call][idle] goodbye 재생 완료 예상 · stopLive + exitToMain");
      idleHangupTriggerRef.current();
    }, 8000);
    return () => clearTimeout(id);
  }, [idleGreetCount, liveState]);

  const nameForCheck = String(paramName || (clone as { displayName?: string } | null | undefined)?.displayName || '');
  const nameOverrideAvatarV2 = nameForCheck.toLowerCase().includes('[v2]');

  const isAvatarV2 = livePipeline === 'avatar_v2' || nameOverrideAvatarV2;
  useEffect(() => {
    console.log(`[T-806/gate] cloneId=${cloneId} livePipeline=${livePipeline ?? "null"} paramName=${paramName ?? "?"} cloneName=${(clone as {displayName?:string}|null|undefined)?.displayName ?? "?"} nameOverride=${nameOverrideAvatarV2} isAvatarV2=${isAvatarV2}`);
  }, [cloneId, livePipeline, paramName, nameForCheck, nameOverrideAvatarV2, isAvatarV2, clone]);
  const yoonjeongRef = useRef<YoonjeongAvatarPlayerHandle>(null);
  const lastBridgeTextRef = useRef<string>("");
  const [bridgeActive, setBridgeActive] = useState(false);

  const BRIDGE_GRACE_MS = 3000;
  const bridgeGraceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bridgePendingTextRef = useRef<string | null>(null);
  const clearBridgeGrace = useCallback(() => {
    if (bridgeGraceTimerRef.current) { clearTimeout(bridgeGraceTimerRef.current); bridgeGraceTimerRef.current = null; }
    bridgePendingTextRef.current = null;
  }, []);
  useEffect(() => {
    if (!isAvatarV2) return;

    if (phase !== 'sending') return;
    const text = (pendingText ?? '').trim();
    if (!text) return;
    if (text === lastBridgeTextRef.current) return;
    lastBridgeTextRef.current = text;

    clearBridgeGrace();
    bridgePendingTextRef.current = text;
    console.log(`[T-806/bridge] grace start · text="${text.slice(0, 40)}"`);
    bridgeGraceTimerRef.current = setTimeout(() => {
      const pending = bridgePendingTextRef.current;
      if (!pending) return; 
      console.log(`[T-806/bridge] grace elapsed · playBridge`);
      try { yoonjeongRef.current?.playBridge(pending); } catch (e) {
        console.warn(`[T-806/bridge] playBridge failed:`, e);
      }
      bridgeGraceTimerRef.current = null;
      bridgePendingTextRef.current = null;
    }, BRIDGE_GRACE_MS);
  }, [isAvatarV2, phase, pendingText, clearBridgeGrace]);

  useEffect(() => {
    if (!isAvatarV2) return;
    if (lastSignal?.type !== 'speech_start') return;
    if (bridgeGraceTimerRef.current) {
      console.log(`[T-806/bridge] speech_start within grace · skip Bridge`);
      clearBridgeGrace();
    }
  }, [isAvatarV2, lastSignal, clearBridgeGrace]);

  const onBridgeStart = useCallback(() => setBridgeActive(true), []);

  const [speakActive, setSpeakActive] = useState(false);
  const speakActiveRef = useRef(false);
  useEffect(() => {
    if (!isAvatarV2) return;
    if (!lastSignal) return;
    if (lastSignal.type === 'speech_start') { setSpeakActive(true); speakActiveRef.current = true; }
    else if (lastSignal.type === 'speech_end') { setSpeakActive(false); speakActiveRef.current = false; }
  }, [isAvatarV2, lastSignal]);

  const onBridgeEnd = useCallback(() => {
    setBridgeActive(false);
  }, []);

  useEffect(() => {
    if (liveState !== "live" || rmState.mode !== "grace") return;
    const id = setInterval(() => {

      if (chatReplyStartAt.current !== null) dispatchRm({ type: "ACTIVITY" });
      dispatchRm({ type: "TICK" });
    }, 5_000);
    return () => clearInterval(id);
  }, [liveState, rmState.mode, dispatchRm]);

  const afl971PromptAlertShownRef = useRef(false);
  useEffect(() => {
    if (!rmState.promptRegister) { afl971PromptAlertShownRef.current = false; return; }
    if (afl971PromptAlertShownRef.current) return;      

    if (phase === "speaking" || afl971AdInProgressRef.current) return;
    afl971PromptAlertShownRef.current = true;

    showAlert(
      "새 얼굴이 보여요",
      "얼굴을 등록할까요?",
      [
        {
          text: "나중에",
          style: "cancel",
          onPress: () => dispatchRm({ type: "DISMISS_LATER" }),
        },
        {
          text: "본인",
          onPress: () => {

            const snapshot = unknownFaceSnapshotRef.current;
            const restore = rmState.lastConfirmedPerson;
            if (snapshot && snapshot.length > 0 && restore != null && accessToken) {
              enrollFaces(accessToken, restore.personId, snapshot, cloneId)
                .then((res) => {
                  console.log(`[Call][face] 나야 → enrollFaces personId=${restore.personId} vectors=${snapshot.length} enrolled=${res.enrolled}`);
                })
                .catch((err) => {
                  console.warn(`[Call][face] 나야 → enrollFaces 실패 personId=${restore.personId}:`, err);
                });
              unknownFaceSnapshotRef.current = null;
            }
            dispatchRm({ type: "CONFIRM_SAME_PERSON" });
          },
        },
        {
          text: "등록",
          onPress: () => {
            dispatchRm({ type: "CONFIRM_PROMPT" });
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{
                  name: "PreCallFaceEnroll",
                  params: {
                    cloneId,
                    name: paramName,
                    image: paramImage,
                    midCall: true,
                  },
                }],
              }),
            );
          },
        },
      ],
    );

  }, [rmState.promptRegister, phase]);

  useEffect(() => {
    micOnRef.current = micOn;
  }, [micOn]);

  const [greetingStarted, setGreetingStarted] = useState(false);
  useEffect(() => {
    if (lastSignal?.type === 'speech_start') setGreetingStarted(true);
  }, [lastSignal]);

  const chatPrevTranscript = useRef('');
  const chatUserSentAt = useRef<number | null>(null);
  useEffect(() => {
    if (transcript && transcript !== chatPrevTranscript.current) {
      console.log(`[Call][chat] user: "${transcript}"`);
      chatPrevTranscript.current = transcript;
      chatUserSentAt.current = Date.now();

      if (
        /사랑해|좋아해|보고\s*싶|자기야|뽀뽀|안아|설레|심쿵|❤|💕|💗|😘|😍/.test(transcript)
      ) {
        pendingEmoteRef.current = { key: 'wink', emoji: '😉', label: '윙크' };
        console.log('[Call][emote] pending wink queued (fire on clone speech_end)');
      }

      dispatchRm({ type: "ACTIVITY" });

    }
  }, [transcript]);
  useEffect(() => {
    if (!lastSignal) return;
    if (lastSignal.type === 'speech_start') {
      const wait = chatUserSentAt.current ? Date.now() - chatUserSentAt.current : null;
      console.log(`[Call][chat] clone reply start${wait !== null ? ` (waited ${wait}ms after user)` : ''}`);
      chatReplyStartAt.current = Date.now();
      chatUserSentAt.current = null;

      if (pendingEmoteFireTimer.current) {
        clearTimeout(pendingEmoteFireTimer.current);
        pendingEmoteFireTimer.current = null;
      }
    } else if (lastSignal.type === 'speech_text' && lastSignal.text) {
      console.log(`[Call][chat] clone: "${lastSignal.text}"`);
    } else if (lastSignal.type === 'speech_end') {
      const dur = chatReplyStartAt.current ? Date.now() - chatReplyStartAt.current : null;
      console.log(`[Call][chat] clone reply end${dur !== null ? ` (took ${dur}ms)` : ''}`);
      chatReplyStartAt.current = null;

      afl971LastSpeechEndRef.current = { at: Date.now(), remainingMs: lastSignal.remainingMs ?? 0 };

      dispatchRm({ type: "CLONE_SPEECH_END" });
      dispatchRm({ type: "ACTIVITY" });
    }
  }, [lastSignal, dispatchRm, triggerEmote]);

  const canSpeak = (phase === 'listening' || phase === 'confirming') && sttActive;

  useEffect(() => {
    const audio = (remoteStream as unknown as { getAudioTracks?: () => Array<{ enabled: boolean }> })
      ?.getAudioTracks?.() ?? [];
    const shouldEnable = dialingDone && !isMuted;
    audio.forEach((t) => {
      t.enabled = shouldEnable;
    });
  }, [remoteStream, dialingDone, isMuted]);

  useEffect(() => {
    if (!dialingDone || !sendAudioReady) return;
    const t = setTimeout(() => { sendAudioReady(); }, 700);
    return () => clearTimeout(t);
  }, [dialingDone, sendAudioReady]);

  const [cloneSubtitle, setCloneSubtitle] = useState('');
  useEffect(() => {
    if (!lastSignal) return;
    if (lastSignal.type === 'speech_text' && lastSignal.text) {
      const t = lastSignal.text;
      setCloneSubtitle((prev) => (prev ? `${prev} ${t}` : t));
    } else if (lastSignal.type === 'speech_end') {
      setCloneSubtitle('');
    }
  }, [lastSignal]);

  const emoteFiredThisTurn = useRef(false);

  const pendingEmoteRef = useRef<{ key: EmoteKey; emoji: string; label: string } | null>(null);

  const pendingEmoteFireTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prevPhaseRef = useRef<typeof phase>(phase);
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    if (prev === 'listening' && phase === 'sending') {
      if (pendingEmoteFireTimer.current) {
        clearTimeout(pendingEmoteFireTimer.current);
        pendingEmoteFireTimer.current = null;
      }
      const pending = pendingEmoteRef.current;
      if (pending) {
        pendingEmoteRef.current = null;
        console.log(`[Call][emote] fire on phase→sending (before speech): ${pending.key}`);
        triggerEmote(pending.key, pending.emoji, pending.label);
      }
    }
  }, [phase, triggerEmote]);
  useEffect(() => {
    if (!lastSignal) return;
    if (lastSignal.type === 'speech_start') {
      emoteFiredThisTurn.current = false;
      return;
    }
    if (
      lastSignal.type === 'speech_text' &&
      lastSignal.text &&
      !emoteFiredThisTurn.current
    ) {
      const t = lastSignal.text;

      if (
        /안녕|반가워|반갑|오랜만|고마워|고맙|감사|맞아|맞네|그렇지|그러네|좋아(?!해)|좋네|오케이|okay|okey|잘생|예쁘|이쁘|예뻐|이뻐|귀여|귀엽|멋져|멋지|멋있|대박|최고|잘\s*했|잘한|ㅋ{2,}|ㅎ{2,}|하하|헤헤|히히|웃긴|웃겨|재밌|재밋|사랑스|짱|훌륭|완벽|굿|나이스/.test(t)
      ) {
        emoteFiredThisTurn.current = true;
        triggerEmote('smile', '🙂', '미소');
      }

      else if (
        /사랑해|보고\s*싶|좋아해|좋아함|자기야|우리\s*(?:둘|사이)|안아|뽀뽀|설레|심쿵|❤|💕|💗|😘|😍/.test(t)
      ) {
        emoteFiredThisTurn.current = true;
        triggerEmote('wink', '😉', '윙크');
      }
    }
  }, [lastSignal, cloneId, triggerEmote]);

  const startedRef = useRef(false);
  useEffect(() => {
    if (!accessToken) return;
    if (startedRef.current) return;
    const kick = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      requestAnimationFrame(() => {
        console.log(`[Call][flow] +${Date.now()} startLive() begin (pipeline=${livePipeline ?? 'timeout'})`);
        void startLive();
      });
    };
    if (livePipeline !== null) {
      kick();
      return;
    }
    const t = setTimeout(kick, 2500);
    return () => clearTimeout(t);

  }, [livePipeline]);

  useEffect(() => {
    if (!__DEV__) return;
    return startTimingLog();
  }, []);

  const [showGifts, setShowGifts] = useState(false);

  const [svgaOverlayUrl, setSvgaOverlayUrl] = useState<string | null>(null);

  const [svgaSender, setSvgaSender] = useState<{
    name: string | null;
    avatarUrl: string | null;
    giftName: string | null;
  } | null>(null);
  const myName = useAuthStore((s) => s.apiUser?.name ?? null);

  useEffect(() => { myNameRef.current = myName; }, [myName]);

  useEffect(() => {
    if (!accessToken || !cloneId) return;
    let cancelled = false;
    getCloneL2(accessToken, cloneId)
      .then(({ l2_profile }) => {
        if (cancelled) return;
        const addr = ((l2_profile as { address_form?: string } | null)?.address_form ?? "").trim();
        surveyAddressRef.current = addr || null;
        console.log(`[Call][face] 설문 호칭=${addr || "(없음)"}`);
      })
      .catch(() => {  });
    return () => { cancelled = true; };
  }, [accessToken, cloneId]);
  const myAvatarUrl = useAuthStore((s) => s.apiUser?.avatarUrl ?? null);

  const [gifts, setGifts] = useState<GiftCatalogItem[]>([]);

  const [giftInventory, setGiftInventory] = useState<GiftInventoryItem[]>([]);
  const giftOwnedCount = React.useMemo(
    () => giftInventory.reduce((sum, g) => sum + g.count, 0),
    [giftInventory],
  );
  useEffect(() => {
    let cancelled = false;
    void fetchGiftCatalog().then((items) => {
      if (!cancelled) setGifts(items);
    });
    if (accessToken) {
      void getGiftInventory(accessToken).then((res) => {
        if (!cancelled) setGiftInventory(res.items);
      }).catch(() => {  });
    }
    return () => {
      cancelled = true;
    };
  }, [accessToken]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (faceEnroll.status === "success") {
      const enrolledId = faceEnroll.getEnrolledPersonId();
      if (silentEnrollRef.current) {

        if (enrolledId != null) autoEnrolledNoNameRef.current.add(enrolledId);
        silentEnrollRef.current = false;
      } else {
        setToastMessage(
          t("call.enrollSuccessToast", {
            name: submittedEnrollNameRef.current,
            defaultValue: "{{name}}님, 이제 기억할게요",
          }),
        );
      }

      dispatchSh({
        type: "NAME_ENROLLED",
        personId: enrolledId ?? undefined,
        name: submittedEnrollNameRef.current,
      });
      faceEnroll.reset();
      unknownFaceSnapshotRef.current = null; 
    } else if (faceEnroll.status === "error") {
      if (silentEnrollRef.current) {

        silentEnrollRef.current = false;
        faceEnroll.reset();
      } else {
        setToastMessage(
          t("call.enrollFailToast", { defaultValue: "등록에 실패했어요. 다시 시도해 주세요" }),
        );
      }
    }

  }, [faceEnroll.status]);

  const [isLiked, setIsLiked] = useState(false);
  const [floatingGifts, setFloatingGifts] = useState<FloatingGift[]>([]);
  const giftCounterRef = useRef(0);

  const [emoteReaction, setEmoteReaction] = useState<
    { key: EmoteKey; emoji: string; label: string } | null
  >(null);
  const emoteAnim = useRef(new Animated.Value(0)).current;
  const emoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emoteVideoSource = emoteReaction ? emoteVideoUri(cloneId, emoteReaction.key) : null;

  const emoteVideoInitial = React.useMemo<string | null>(
    () => emoteVideoUri(cloneId, "smile"),
    [cloneId],
  );
  const emotePlayer = useVideoPlayer(emoteVideoInitial, (p) => {
    p.loop = false;
    p.muted = true;
  });

  const idlePlayer = useVideoPlayer(liveIdleVideoUrl, (p) => {
    p.loop = true;
    p.muted = true;
    if (liveIdleVideoUrl) {
      try { p.play(); } catch {  }
    }
  });
  const triggerEmote = useCallback(
    (key: EmoteKey, emoji: string, label: string) => {
      if (emoteTimerRef.current) clearTimeout(emoteTimerRef.current);
      const videoSrc = emoteVideoUri(cloneId, key);
      console.log(`[Call][emote] trigger key=${key} cloneId=${cloneId} video=${videoSrc ?? "none"}`);

      if (!videoSrc) {
        return;
      }
      if (emotePlayer) {
        try {
          const p: any = emotePlayer;
          const doPlay = () => {
            try {
              p.currentTime = 0;
              p.play();
              console.log(`[Call][emote] play() called status=${p.status ?? "?"} duration=${p.duration ?? "?"}`);
            } catch (err) {
              console.warn("[Call][emote] play() throw:", err);
            }
          };

          if (typeof p.replaceAsync === "function") {
            p.replaceAsync(videoSrc)
              .then(() => {
                console.log(`[Call][emote] replaceAsync resolved status=${p.status ?? "?"}`);
                doPlay();
              })
              .catch((err: unknown) => {
                console.warn("[Call][emote] replaceAsync failed:", err);
                doPlay(); 
              });
          } else if (typeof p.replace === "function") {
            p.replace(videoSrc);
            doPlay();
          } else {
            doPlay();
          }
        } catch (err) {
          console.warn("[Call][emote] player play failed:", err);
        }
      } else {
        console.warn("[Call][emote] emotePlayer null");
      }
      setEmoteReaction({ key, emoji, label });
      emoteAnim.setValue(0);
      Animated.timing(emoteAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();

      const hold = 1500;
      emoteTimerRef.current = setTimeout(() => {
        Animated.timing(emoteAnim, { toValue: 0, duration: 280, useNativeDriver: true }).start(
          () => setEmoteReaction(null),
        );
      }, hold);
    },
    [emoteAnim, cloneId, emotePlayer],
  );
  useEffect(() => () => {
    if (emoteTimerRef.current) clearTimeout(emoteTimerRef.current);
  }, []);

  const [callSeconds, setCallSeconds] = useState(0);
  useEffect(() => {
    if (liveState !== "live") return;
    const id = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [liveState]);

  const afl971MuteCallAudio = useCallback(() => {
    try {
      const audio = (remoteStream as unknown as { getAudioTracks?: () => Array<{ enabled: boolean }> })
        .getAudioTracks?.() ?? [];
      audio.forEach((t) => { t.enabled = false; });
      console.log(`[Call][afl971] remote audio muted (${audio.length} tracks)`);
    } catch (err) {
      console.warn("[Call][afl971] mute 실패:", (err as Error)?.message ?? err);
    }
  }, [remoteStream]);
  const afl971UnmuteCallAudio = useCallback(() => {
    try {
      const audio = (remoteStream as unknown as { getAudioTracks?: () => Array<{ enabled: boolean }> })
        .getAudioTracks?.() ?? [];

      audio.forEach((t) => { t.enabled = !isMuted; });
      console.log(`[Call][afl971] remote audio unmuted (isMuted=${isMuted})`);
    } catch (err) {
      console.warn("[Call][afl971] unmute 실패:", (err as Error)?.message ?? err);
    }
  }, [remoteStream, isMuted]);

  const AFL971_COUNT_KEY = "afl971:lifetimeCallCount";
  const afl971IsFirstCallRef = useRef<boolean | null>(null); 
  const afl971RoundCountRef = useRef<number>(0);
  const afl971AdShownRoundsRef = useRef<Set<number>>(new Set());
  const afl971ConnectingAdFiredRef = useRef<boolean>(false);
  const afl971LastSpeakingRef = useRef<boolean>(false);

  const afl971AdCommittedRoundRef = useRef<number | null>(null);
  const afl971PendingAdRoundRef = useRef<number | null>(null);

  const AFL971_PRE_MESSAGE_DEFAULT = "{userName}줄 꽃 좀 따올게! 영상 보고 있으면 금방 다녀올게";
  const AFL971_POST_MESSAGE_DEFAULT = "기다려줘서 고마워! 꽃 선물 짠";
  const AFL971_FLOWER_TOAST_DEFAULT = "{cloneName}에게 꽃을 받았습니다";
  const [afl971ToastTemplate, setAfl971ToastTemplate] = useState<string>(AFL971_FLOWER_TOAST_DEFAULT);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { API_BASE } = await import("../../config/apiBase");
        const res = await fetch(`${API_BASE}/oth-path`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { messages?: { toast?: string } };
        const t = data?.messages?.toast;
        if (typeof t === "string" && t.trim().length > 0) setAfl971ToastTemplate(t);
      } catch (err) {
        if (__DEV__) console.warn("[afl971] ad-messages fetch 실패:", (err as Error)?.message ?? err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggleMicRef = useRef(toggleMic);
  useEffect(() => { toggleMicRef.current = toggleMic; }, [toggleMic]);

  const sayRef = useRef(say);
  useEffect(() => { sayRef.current = say; }, [say]);
  const notifySpeechEndRef = useRef(notifySpeechEnd);
  useEffect(() => { notifySpeechEndRef.current = notifySpeechEnd; }, [notifySpeechEnd]);

  const [afl971AdInProgress, setAfl971AdInProgress] = useState(false);
  const afl971AdInProgressRef = useRef<boolean>(false);

  const [afl971AdShowingUI, setAfl971AdShowingUI] = useState(false);
  useEffect(() => {
    afl971AdInProgressRef.current = afl971AdInProgress;
  }, [afl971AdInProgress]);

  const afl971LastSpeechEndRef = useRef<{ at: number; remainingMs: number } | null>(null);

  const renderAfl971Message = useCallback((template: string): string => {
    const userName = myName ?? "";
    const cloneName = String(paramName || (clone as { displayName?: string } | null | undefined)?.displayName || "");
    return template.replace(/\{userName\}/g, userName).replace(/\{cloneName\}/g, cloneName);
  }, [myName, paramName, clone]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(AFL971_COUNT_KEY);
        const prev = raw ? Number(raw) || 0 : 0;
        afl971IsFirstCallRef.current = prev === 0;
        await AsyncStorage.setItem(AFL971_COUNT_KEY, String(prev + 1));
        console.log(`[Call][afl971] lifetime count ${prev} → ${prev + 1}, isFirstCall=${afl971IsFirstCallRef.current}`);
      } catch (err) {
        console.warn("[Call][afl971] lifetime count load failed:", err);
        afl971IsFirstCallRef.current = false;
      }

      if (afl971ConnectingAdFiredRef.current) return;
      afl971ConnectingAdFiredRef.current = true;
      setAfl971AdInProgress(true);

      if (micOnRef.current) {
        console.log("[Call][afl971] 광고 직전 즉시 mic off (연결중)");
        toggleMicRef.current();
      }
      try {
        console.log("[Call][afl971] 연결중 전면광고 trigger");
        const { loadAndShowRewardedAd } = await import("../../lib/pangle");
        afl971MuteCallAudio();
        setAfl971AdShowingUI(true);
        try {
          await loadAndShowRewardedAd();
        } finally {
          setAfl971AdShowingUI(false);
          afl971UnmuteCallAudio();
        }

        console.log("[Call][afl971] 연결중 광고 닫힘");
      } catch (err) {
        console.warn("[Call][afl971] 연결중 광고 실패:", (err as Error)?.message ?? err);
      } finally {
        setAfl971AdInProgress(false);

        if (!micOnRef.current && !isMuted) {
          console.log("[Call][afl971] 연결중 광고 종료 — mic 복원");
          toggleMicRef.current();
        }
      }
    })();

  }, []);

  const runAfl971AdCycle = useCallback((round: number) => {
    afl971AdShownRoundsRef.current.add(round);
    setAfl971AdInProgress(true);
    afl971AdInProgressRef.current = true; 
    let micWasOnBeforeAd = false;
    (async () => {
      try {
        console.log(`[Call][afl971] round ${round} — mic off + 광고`);
        micWasOnBeforeAd = !!micOnRef.current;
        if (micOnRef.current) toggleMicRef.current();
        await new Promise((r) => setTimeout(r, 150));

        const { loadAndShowRewardedAd } = await import("../../lib/pangle");
        afl971MuteCallAudio();
        setAfl971AdShowingUI(true);

        if (sendAdPrepareReturn) {
          sendAdPrepareReturn();
          console.log(`[Call][afl971] round ${round} 광고 시작 — 복귀 미리 준비 신호(ad_prepare_return)`);
        }
        try {
          await loadAndShowRewardedAd();
        } catch (adErr) {
          setAfl971AdShowingUI(false);
          afl971UnmuteCallAudio();
          throw adErr;
        }

        setAfl971AdShowingUI(false);
        afl971UnmuteCallAudio();

        const fg = await afl971WaitForForeground(2500);
        const interactive = afl971CallInteractive({ appActive: fg, live: liveStateRef.current === "live" });
        if (sendAdReturned && interactive) {
          const sentAt = Date.now();
          sendAdReturned();
          console.log(`[Call][afl971] round ${round} 광고 종료 — 복귀 재생 신호(ad_returned)`);

          const RETURN_MAX_MS = 25000;
          const TAIL_GRACE_MS = 700;
          const hardDeadline = sentAt + RETURN_MAX_MS;
          for (;;) {
            if (liveStateRef.current !== "live") break; 
            const se = afl971LastSpeechEndRef.current;
            const now = Date.now();
            if (se && se.at > sentAt && now >= se.at + se.remainingMs + TAIL_GRACE_MS) break;
            if (now >= hardDeadline) {
              console.warn(`[Call][afl971] round ${round} 복귀 종료 대기 ${RETURN_MAX_MS}ms 상한 — 강제 종료`);
              break;
            }
            await new Promise((r) => setTimeout(r, 300));
          }
          console.log(`[Call][afl971] round ${round} 복귀 발화 종료 — mic 복원 예정`);
        } else if (sendAdReturned) {
          console.log(`[Call][afl971] round ${round} 백그라운드/비라이브 — 복귀 신호 생략`);
        }

        const callIdNow = getCallId?.() ?? null;
        setToastMessage(renderAfl971Message(afl971ToastTemplate));
        if (callIdNow && accessToken) {
          void (async () => {
            try {
              const { API_BASE } = await import("../../config/apiBase");
              const res = await fetch(`${API_BASE}/oth-path`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ callId: callIdNow, round, giftId: "gift-bouquet" }),
              });
              if (res.ok) {
                const data = (await res.json()) as { giftId?: string; alreadyGranted?: boolean };
                console.log(`[Call][afl971] 꽃 지급 ✅ giftId=${data.giftId} already=${data.alreadyGranted}`);
              } else {
                console.warn(`[Call][afl971] 꽃 지급 실패 status=${res.status}`);
              }
            } catch (err) {
              console.warn(`[Call][afl971] 꽃 지급 호출 실패:`, (err as Error)?.message ?? err);
            }
          })();
        } else {
          console.warn(`[Call][afl971] callIdNow=${callIdNow} accessToken=${!!accessToken} — 지급 skip, 토스트만`);
        }
      } catch (err) {
        console.warn(`[Call][afl971] round ${round} 광고 cycle 실패:`, (err as Error)?.message ?? err);
      } finally {
        setAfl971AdInProgress(false);
        afl971AdInProgressRef.current = false;

        setAfl971AdShowingUI(false);
        afl971UnmuteCallAudio();

        const restoreNow = afl971CallInteractive({
          appActive: AppState.currentState === "active",
          live: liveStateRef.current === "live",
        });
        if (micWasOnBeforeAd && !micOnRef.current && !isMuted) {
          if (restoreNow) {
            console.log(`[Call][afl971] round ${round} 종료 — mic 복원`);
            micOnRef.current = true;
            toggleMicRef.current();
          } else {
            afl971MicRestorePendingRef.current = true;
            console.log(`[Call][afl971] round ${round} 종료 — 백그라운드라 mic 복원 보류(포그라운드 때 복원)`);
          }
        }
      }
    })();
  }, [renderAfl971Message, afl971MuteCallAudio, afl971UnmuteCallAudio, isMuted, getCallId, accessToken, afl971ToastTemplate, sendAdPrepareReturn, sendAdReturned]);

  const afl971TryFireAd = useCallback(() => {

    if (liveStateRef.current !== "live") return;
    if (phaseRef.current === "speaking") return;
    const pending = afl971PendingAdRoundRef.current;

    const faceBusy = rmStateRef.current.promptRegister;
    if (!afl971CanFireAd({ pendingRound: pending, faceBusy, adInProgress: afl971AdInProgressRef.current })) {
      if (pending !== null && faceBusy) {
        console.log("[Call][afl971] 얼굴 등록 팝업 중 — 예고된 광고 보류(유지·얼굴 우선)");
      }
      return;
    }
    afl971PendingAdRoundRef.current = null; 
    runAfl971AdCycle(pending as number);
  }, [runAfl971AdCycle]);

  useEffect(() => {
    afl971TryFireAd();

  }, [rmState.promptRegister, phase, afl971AdInProgress, afl971TryFireAd]);

  useEffect(() => {
    const wasSpeaking = afl971LastSpeakingRef.current;
    const isSpeaking = phase === "speaking";
    afl971LastSpeakingRef.current = isSpeaking;
    if (!wasSpeaking || isSpeaking) return;

    if (afl971AdInProgressRef.current) {
      console.log("[Call][afl971] 광고 사이클 중 — 라운드 count skip");
      return;
    }

    const round = afl971RoundCountRef.current + 1;
    afl971RoundCountRef.current = round;
    console.log(`[Call][afl971] round ${round} complete`);

    if (afl971IsFirstCallRef.current === true) {
      console.log("[Call][afl971] 첫 통화 — 라운드 광고 skip");
      return;
    }
    if (afl971IsFirstCallRef.current === null) {
      console.log("[Call][afl971] lifetime count 로딩 중 — 광고 skip");
      return;
    }

    if (afl971AdCommittedRoundRef.current !== round) return;
    afl971AdCommittedRoundRef.current = null;
    if (afl971AdShownRoundsRef.current.has(round)) return;

    afl971PendingAdRoundRef.current = round;
    afl971TryFireAd();
  }, [phase, afl971TryFireAd]);

  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const warnedRef = useRef(false);
  const exhaustedRef = useRef(false);

  useEffect(() => {
    return; 
  }, [accessToken]);
  useEffect(() => {
    return; 

    if (liveState !== "live" || remainingSec === null) return;
    const id = setInterval(() => {
      setRemainingSec((prev) => {
        if (prev === null) return prev;
        const next = Math.max(0, prev - 1);
        if (next === 30 && !warnedRef.current) {
          warnedRef.current = true;
          setToastMessage(
            t("call.remainingWarnToast", {
              defaultValue: "남은 통화 시간 30초입니다. 곧 종료됩니다.",
            }),
          );
        }
        if (next === 0 && !exhaustedRef.current) {
          exhaustedRef.current = true;
          showAlert(
            t("call.exhaustedTitle", { defaultValue: "통화 시간 종료" }),
            t("call.exhaustedBody", {
              defaultValue: "충전하면 계속 통화할 수 있어요.",
            }),
            [
              {
                text: t("common.confirm", { defaultValue: "확인" }),
                style: "cancel",
                onPress: () => navigation.goBack(),
              },
              {
                text: t("call.exhaustedCharge", { defaultValue: "충전하기" }),
                style: "default",
                onPress: () => {
                  navigation.dispatch(
                    CommonActions.navigate({
                      name: "Main",
                      params: {
                        screen: "MyTab",
                        params: { screen: "Purchase" },
                      },
                    }),
                  );
                },
              },
            ],
          );
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [liveState, remainingSec !== null, navigation, t]);

  useEffect(() => {
    const displayName = paramName || t("call.fgTitle", { defaultValue: "통화 중" });
    startCallForegroundService({
      title: t("call.fgTitle", { defaultValue: "통화 중" }),
      body: t("call.fgBody", {
        name: displayName,
        defaultValue: `${displayName} 와(과) 통화 중입니다`,
      }),
    }).catch(() => {});
    return () => {
      stopCallForegroundService().catch(() => {});
    };

  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const KEY = "@afterlifeRN/call/batteryWhitelistNoticeDismissed";
    (async () => {
      try {
        const dismissed = await AsyncStorage.getItem(KEY);
        if (dismissed === "1") return;
        showAlert(
          t("call.batteryWhitelistTitle", { defaultValue: "통화 안정성 안내" }),
          t("call.batteryWhitelistBody", {
            defaultValue:
              "휴대폰 배터리 절전 기능이 통화를 끊을 수 있어요. 설정에서 이 앱을 배터리 최적화 예외에 등록하면 통화가 안정적으로 유지됩니다.",
          }),
          [
            {
              text: t("call.batteryWhitelistDismiss", { defaultValue: "다시 보지 않기" }),
              style: "cancel",
              onPress: () => AsyncStorage.setItem(KEY, "1").catch(() => {}),
            },
            {
              text: t("call.batteryWhitelistOpen", { defaultValue: "설정 열기" }),
              onPress: async () => {
                AsyncStorage.setItem(KEY, "1").catch(() => {});

                try {
                  await Linking.sendIntent("android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS");
                } catch {
                  Linking.openSettings().catch(() => {});
                }
              },
            },
          ],
        );
      } catch {

      }
    })();

  }, []);

  const lastBgWarnRef = useRef<number>(0);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {

      if (next === "active" && liveState === "live") {
        afl971UnmuteCallAudio();
        setAfl971AdShowingUI(false);
        if (
          afl971MicRestorePendingRef.current &&
          !afl971AdInProgressRef.current &&
          !micHeldRef.current &&
          !micOnRef.current &&
          !isMuted
        ) {
          afl971MicRestorePendingRef.current = false;
          micOnRef.current = true;
          console.log("[Call][afl971] 포그라운드 복귀 — 광고로 꺼둔 mic 복원(사용자 턴/listening)");
          toggleMicRef.current();
        }
      }

      if (next !== "background") return;
      if (liveState !== "live") return;

      const now = Date.now();
      if (now - lastBgWarnRef.current < 30_000) return;
      lastBgWarnRef.current = now;
      Notifications.scheduleNotificationAsync({
        content: {
          title: t("call.bgWarnTitle", { defaultValue: "📞 통화가 유지되지 않을 수 있어요" }),
          body: t("call.bgWarnBody", {
            defaultValue: "앱을 계속 열어두어야 통화가 이어집니다. 앱으로 돌아와 주세요.",
          }),
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: null,
      }).catch((err) => console.warn("[Call] bg warn schedule failed:", err?.message));
    });
    return () => sub.remove();
  }, [liveState, t, isMuted, afl971UnmuteCallAudio]);

  const confirmProgress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (phase !== 'confirming') { confirmProgress.setValue(0); return; }
    confirmProgress.setValue(1);
    const anim = Animated.timing(confirmProgress, { toValue: 0, duration: 2000, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [phase, pendingText, confirmProgress]);

  const [isTerminating, setIsTerminating] = useState(false);

  const exitInFlightRef = useRef(false);

  const cancelInFlightRef = useRef(false);

  const retryLockUntilRef = useRef(0);
  const exitToMain = useCallback(() => {
    if (exitInFlightRef.current) {
      console.log("[Call][exit] 이미 진행 중 — 재요청 무시");
      return;
    }
    exitInFlightRef.current = true;
    console.log("[Call][exit] setIsTerminating=true (200ms 후 navigation)");
    setIsTerminating(true);
    setTimeout(() => {
      console.log("[Call][exit] navigation 실행");
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.dispatch(
          CommonActions.reset({ index: 0, routes: [{ name: "Main" }] }),
        );
      }
    }, 200);
  }, [navigation]);

  useEffect(() => {
    idleHangupTriggerRef.current = () => {
      void stopLive();
      exitToMain();
    };
  }, [stopLive, exitToMain]);

  useEffect(() => {
    rmActionRef.current = (a: RememberMeAction) => {
      switch (a.type) {
        case "NOTIFY_CONFIRMED":
          sendFaceEvent?.({
            event: "speaker_confirmed",
            personId: a.personId,
            displayName: a.displayName,

            rejoin: a.rejoin,

            mentionName: a.mentionName,
          });
          break;
        case "NOTIFY_UNKNOWN":
          sendFaceEvent?.({ event: "unknown_face" });
          break;
        case "END_CALL":
          console.log(
            `[Call][rm] grace ${GRACE_HOLD_MS / 1000}초 동안 얼굴·대화 모두 없음 → 통화 종료`,
          );
          void stopLive();
          exitToMain();
          break;
        case "INTERRUPT_TTS":

          console.log("[Call][rm] INTERRUPT_TTS — 다른 사람 인식, 진행 중 발화 컷인");
          notifyFaceInterruptRef.current("", "face-switch");
          break;
        default:
          break; 
      }
    };
  }, [sendFaceEvent, stopLive, exitToMain]);

  useEffect(() => {
    const backSub = BackHandler.addEventListener("hardwareBackPress", () => {
      console.log("[Call][back] hardware back → stopLive + exitToMain");
      void stopLive();
      exitToMain();
      return true;
    });
    return () => backSub.remove();
  }, [stopLive, exitToMain]);

  const callStartRef = useRef<number>(Date.now());
  const tokenRef = useRef(accessToken);
  const cloneIdRef = useRef(cloneId);
  useEffect(() => {
    tokenRef.current = accessToken;
    cloneIdRef.current = cloneId;
  }, [accessToken, cloneId]);
  useEffect(() => {
    return () => {
      const token = tokenRef.current;
      const cid = cloneIdRef.current;
      console.log(`[Call] 화면 종료 — call-event 전송 시도 token=${!!token} cloneId=${cid}`);
      if (!token || !cid) {
        console.warn(`[Call] call-event 전송 SKIP (token=${!!token} cid=${cid})`);
        return;
      }
      const durationSeconds = Math.floor((Date.now() - callStartRef.current) / 1000);
      console.log(`[Call] POST /oth-path${cid}/call-event { durationSeconds: ${durationSeconds} }`);

      postCloneCallEvent(token, cid, { durationSeconds })
        .then((res) =>
          console.log(`[Call] call-event ← ok scoreApplied=${(res as { scoreApplied?: number }).scoreApplied ?? 0}°C (duration=${durationSeconds}s, >=1200 이면 +15°C)`),
        )
        .catch((err) => console.warn("[Call] postCloneCallEvent failed:", err));
    };
  }, []);

  useEffect(() => {
    console.log(`[Call][flow] +${Date.now()} CallScreen mount cloneId=${cloneId} name=${paramName ?? "?"} hasImage=${!!paramImage}`);
    if (!accessToken) return;
    let cancelled = false;
    getCloneLikeStatus(accessToken, cloneId)
      .then((r) => {
        if (cancelled) return;
        console.log(`[Call] likedByMe fetch ← ${r.liked}`);
        setIsLiked(r.liked);
      })
      .catch((err) => {
        console.warn("[Call] likedByMe fetch failed:", err);
      });
    return () => {
      cancelled = true;
    };

  }, [accessToken, cloneId]);
  const callTimeStr = `${String(Math.floor(callSeconds / 60)).padStart(2, "0")}:${String(callSeconds % 60).padStart(2, "0")}`;

  const personaName = paramName || clone?.displayName || t("chat.personaFallback");
  const personaImage = paramImage || clone?.imageUrl || "";

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleGiftSend = async (gift: GiftCatalogItem) => {
    console.log(`[Call][gift-tap] giftId=${gift.id} name=${gift.name} svga=${!!gift.svgaUrl}`);
    setShowGifts(false);

    if (!accessToken) {
      console.warn("[gift] send skipped — no accessToken (guest)");
      return;
    }
    let ownerIdResolved = clone?.ownerId;
    if (!ownerIdResolved) {
      console.log(`[gift] clone.ownerId missing — fetching detail cloneId=${cloneId}`);
      try {
        const detail = await getCloneDetail(cloneId, accessToken);
        ownerIdResolved = detail.clone?.ownerId;
        console.log(`[gift] fetched ownerId=${ownerIdResolved}`);
      } catch (err) {
        console.warn(`[gift] getCloneDetail failed:`, (err as Error).message);
      }
    }
    if (!ownerIdResolved) {
      console.warn(
        `[gift] send skipped — ownerId still null after fetch. cloneId=${cloneId} cloneName=${clone?.displayName ?? paramName ?? "?"}`,
      );
      return;
    }
    if (currentUserId != null && ownerIdResolved === currentUserId) {
      console.warn("[gift] send skipped — own clone (self)");
      return;
    }
    try {
      const idem = `gift-${gift.id}-${cloneId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const res = await sendGiftOffchain(
        accessToken,

        { giftId: gift.id, toUserId: ownerIdResolved, cloneId: cloneId },
        idem,
      );
      console.log(`[gift] sent OK ${gift.id} ${res.xrunAmount} XRUN → ${res.receiverId}`);

      setGiftInventory((prev) =>
        prev
          .map((g) => (g.giftId === gift.id ? { ...g, count: g.count - 1 } : g))
          .filter((g) => g.count > 0),
      );

      if (gift.svgaUrl) {
        setSvgaSender({ name: myName, avatarUrl: myAvatarUrl, giftName: gift.name });
        setSvgaOverlayUrl(gift.svgaUrl);
      } else {
        playGiftAnimation(gift);
      }
    } catch (err) {
      const msg = (err as Error).message ?? "선물 전송 실패";
      const isInsufficient = /INSUFFICIENT_CREDITS|잔액이 부족/.test(msg);

      showAlert(
        isInsufficient ? t("call.giftInsufficientTitle", { defaultValue: "XRUN 부족" }) : t("call.giftFailTitle", { defaultValue: "선물 실패" }),
        isInsufficient
          ? t("call.giftInsufficientDesc", { defaultValue: "XRUN 이 부족해요. 크레딧 충전 후 다시 시도해주세요." })
          : msg,
      );
    }
  };

  const playGiftAnimation = (gift: GiftCatalogItem) => {

    const id = giftCounterRef.current++;
    const animY = new Animated.Value(0);
    const animOpacity = new Animated.Value(0);
    const x = SCREEN_W / 2 + (Math.random() * 120 - 60);

    const newGift: FloatingGift = {
      id,
      emoji: gift.emoji,
      imageUrl: gift.imageUrl,
      animY,
      animOpacity,
      x,
    };
    setFloatingGifts((prev) => [...prev, newGift]);

    Animated.parallel([
      Animated.timing(animY, {
        toValue: -400,
        duration: 2500,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(animOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(animOpacity, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setFloatingGifts((prev) => prev.filter((g) => g.id !== id));
    });

    setShowGifts(false);
  };

  const subtitleBottom = bottomInset + 96 + 112 + 12;

  const [capturingWithLogo, setCapturingWithLogo] = useState(false);
  const rootCaptureRef = useRef<View>(null);

  return (
    <View style={s.container} ref={rootCaptureRef} collapsable={false}>
      {}
      {

}
      {isAvatarV2 ? (

        <View style={s.videoFixedContainer}>
          <YoonjeongAvatarPlayer
            ref={yoonjeongRef}
            style={s.videoFixedRtc}
            onBridgeStart={onBridgeStart}
            onBridgeEnd={onBridgeEnd}
          />
          {

}
          {remoteStream ? (
            <View
              style={[
                s.videoFixedRtc,
                StyleSheet.absoluteFillObject,
                { opacity: !bridgeActive && speakActive ? 1 : 0 },
              ]}
              pointerEvents="none"
            >
              <RTCView
                streamURL={(remoteStream as unknown as { toURL: () => string }).toURL()}
                objectFit="contain"
                style={s.videoFixedRtc}
              />
            </View>
          ) : null}
          {}
        </View>
      ) : remoteStream ? (

        <View style={s.videoFixedContainer}>
          {

}
          <RTCView
            streamURL={(remoteStream as unknown as { toURL: () => string }).toURL()}
            objectFit="cover"
            style={s.videoFixedRtc}
          />
        </View>
      ) : visemeResponse !== undefined && livePipeline === 'viseme_playback' ? (

        <View style={s.videoFixedContainer}>
          <VisemePlayer
            response={visemeResponse}
            visemePrefix={liveVisemePrefix}
            style={s.videoFixedRtc}
          />
        </View>
      ) : personaImage ? (
        <Image
          source={typeof personaImage === "number" ? personaImage : { uri: personaImage }}
          style={[StyleSheet.absoluteFill, { width: "100%", height: "100%" }]}
          resizeMode="contain"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.zinc900 }]} />
      )}

      {

}
      {capturingWithLogo && personaImage ? (
        <View style={s.videoFixedContainer} pointerEvents="none">
          <Image
            source={typeof personaImage === "number" ? personaImage : { uri: personaImage }}
            style={s.videoFixedRtc}
            resizeMode="cover"
          />
        </View>
      ) : null}

      {}
      {__DEV__ && hudDevBox ? (
        <View style={{ position: "absolute", top: 8, right: 8, zIndex: 10,
          backgroundColor: "rgba(0,0,0,0.5)", padding: 4 }}>
          <Text style={{ color: "#0f0", fontSize: 10 }}>route:{CALL_ROUTE}</Text>
          {FACE_DIAG_ENABLED ? (
            <>
              <Text style={{ color: "#0f0", fontSize: 10 }}>
                {faceDiag ? formatFaceHud(faceDiag) : "face -"}
              </Text>
              {

}
              <Text
                style={{
                  color:
                    rmState.mode === "identified"
                      ? "#0f0"
                      : rmState.mode === "grace"
                        ? "#ff0"
                        : "#f80",
                  fontSize: 10,
                }}
              >
                {rmState.mode === "grace"
                  ? `rm grace ${rmState.personId ?? "-"} 유지중${rmState.graceHadActivity ? "" : " · 무대화"}`
                  : rmState.mode === "pending"
                    ? `rm 대기(입력 필요)${rmState.sheetOpen ? " · 시트" : ""}`
                    : `rm ok ${rmState.personId ?? "-"}`}
              </Text>
              {}
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                <Text
                  onPress={() => setGtPersonId(null)}
                  style={{ color: gtPersonId == null ? "#ff0" : "#0f0", fontSize: 10, marginRight: 6 }}
                >
                  unknown
                </Text>
                {persons.map((p) => (
                  <Text
                    key={p.id}
                    onPress={() => setGtPersonId(p.id)}
                    style={{ color: gtPersonId === p.id ? "#ff0" : "#0f0", fontSize: 10, marginRight: 6 }}
                  >
                    #{p.id}
                  </Text>
                ))}
              </View>
            </>
          ) : null}
        </View>
      ) : null}

      {showCallDev && liveState === "live" ? (
        <View
          style={{
            position: "absolute",
            left: 8,
            right: 8,

            bottom: devKbHeight > 0 ? devKbHeight + 58 : bottomInset + 96,
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
            value={devText}
            onChangeText={setDevText}
            placeholder="[DEV] 텍스트로 발화"
            placeholderTextColor="#6b7280"
            autoCapitalize="none"
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={() => submitDevText(devText, say, setDevText)}
          />
          <TouchableOpacity
            onPress={() => submitDevText(devText, say, setDevText)}
            style={{ paddingHorizontal: 12, paddingVertical: 6 }}
          >
            <Text style={{ color: "#0f0", fontSize: 13, fontWeight: "600" }}>전송</Text>
          </TouchableOpacity>
          {
}
          <TouchableOpacity
            onPress={() => setFaceProcOff((v) => !v)}
            style={{ paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <Text style={{ color: faceProcOff ? "#f87171" : "#0f0", fontSize: 13, fontWeight: "600" }}>
              얼굴{faceProcOff ? "OFF" : "ON"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {}
      {!dialingDone && (
        <DialingScreen
          liveState={liveState}
          personaName={personaName}
          personaImage={typeof personaImage === "string" ? personaImage : ""}

          greetingStarted={greetingOn ? phase !== "greeting" && phase !== "idle" : undefined}
          onConnected={() => {
            console.log(`[Call][flow] +${Date.now()} DialingScreen.onConnected → setDialingDone(true)`);
            setDialingDone(true);
          }}
          onCancel={async () => {

            if (cancelInFlightRef.current) {
              return;
            }
            cancelInFlightRef.current = true;
            console.log(`[Call][flow] +${Date.now()} DialingScreen.onCancel → stopLive + exitToMain`);
            try {
              await stopLive();
            } catch (err) {
              console.warn("[Call] onCancel stopLive failed:", err);
            }
            exitToMain();
          }}
          onRetry={() => {

            const now = Date.now();
            if (now < retryLockUntilRef.current) {
              return;
            }
            retryLockUntilRef.current = now + 1000;
            console.log(`[Call][flow] +${now} DialingScreen.onRetry → startLive`);
            setGreetingStarted(false);

            setPoorConnection(false);
            sttGiveUpRef.current = false;
            void startLive();
          }}
          poorConnection={poorConnection}
        />
      )}

      <LinearGradient
        colors={["rgba(0,0,0,0.2)", "transparent", "rgba(9,9,11,0.5)"]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      {hudTiming && liveState === "live" ? <CallTimingHUD /> : null}
      {}
      {hudState && liveState === "live" ? <CallStateHUD /> : null}
      {
}
      {hudFaceTrack && FACE_DIAG_ENABLED ? <FaceTrackHUD /> : null}
      {showCallDev && liveState === "live" ? (

        <View
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: bottomInset }}
          pointerEvents="box-none"
        >
          <CallTimingPanel onForceListen={devForceListen} micOn={micOn} onToggleMic={toggleMic} />
        </View>
      ) : null}

      {

}
      {!isVideoOff && vcDevice && dialingDone && (
      <TouchableOpacity
        style={[s.pip, { top: insets.top + 8 }]}
        activeOpacity={0.9}
        onPress={() => setCameraFacing((f) => (f === "front" ? "back" : "front"))}
      >
        {

}
        <VisionCamera
          ref={pipCameraRef}
          style={s.pipCamera}
          device={vcDevice}
          isActive={!isVideoOff}
          androidPreviewViewType="texture-view"
          frameProcessor={consentGranted && !faceProcOff && !isTerminating ? faceFrameProcessor : undefined}
          onError={(e) =>
            console.log("[Call][face] camera error:", e.code, e.message)
          }
        />

        {}
        {consentGranted && vcDevice ? (
          <View
            style={[
              s.faceIndicator,
              faceState.status === "detected" ? s.faceIndicatorOn : s.faceIndicatorOff,
            ]}
          />
        ) : null}
      </TouchableOpacity>
      )}

      {

}
      {!consentGranted && !isVideoOff && (
        <TouchableOpacity
          style={[s.faceConsentBtn, { top: insets.top + 8 + 140 + 6 }]}
          disabled={consentLoading}
          onPress={() => {
            if (!accessToken) return;

            setTermsModalVisible(true);
          }}
        >
          <Text style={s.faceConsentText}>{t("call.faceConsentHint")}</Text>
        </TouchableOpacity>
      )}

      <TermsModal
        visible={termsModalVisible}
        type={4}
        onClose={() => {

          setTermsModalVisible(false);
        }}
        onAgree={async () => {

          if (!accessToken) { setTermsModalVisible(false); return; }
          setConsentLoading(true);
          setTermsModalVisible(false);
          try {
            const { id } = await createPerson(accessToken, { cloneId });
            console.log(`[Call][face] createPerson ok personId=${id}`);
            await saveFaceConsent(accessToken, id, "granted", { termsVersion: "biometric-v1" });
            setConsentGranted(true);
            console.log(`[Call][face] consent granted personId=${id}`);
          } catch (err) {
            console.warn("[Call][face] createPerson/saveFaceConsent failed:", err);

            setToastMessage(t("call.faceConsentError"));
          } finally {
            setConsentLoading(false);
          }
        }}
      />

      {}

      {}
      <View style={[s.callInfo, { top: insets.top + 24 }]}>
        <Text style={s.callName}>{personaName}</Text>
        <Text style={s.callTimeText}>
          {liveState === "live"
            ? callTimeStr
            : t("call.connecting", { defaultValue: "연결 중…" })}
        </Text>
      </View>

      {

}

      {

}
      {clone?.cloneType === "expert" && (
        <View style={[s.expertBadge, { top: insets.top + 24 }]}>
          <ExpertBadge size={44} />
        </View>
      )}

      {
}
      {!isOwnClone && (
      <View style={s.rightActions}>
        <TouchableOpacity
          style={[s.sideBtn, showGifts && s.sideBtnActive]}
          onPress={() => setShowGifts(!showGifts)}
        >
          <Feather name="gift" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={s.sideBtn}
          onPress={async () => {
            const next = !isLiked;
            console.log(
              `[Call] 좋아요 클릭 cloneId=${cloneId} ${isLiked ? "true" : "false"} → ${next ? "true" : "false"}`,
            );
            setIsLiked(next); 
            if (!accessToken) return;
            try {
              if (next) await likeClone(accessToken, cloneId);
              else await unlikeClone(accessToken, cloneId);
              console.log(`[Call] 좋아요 API ← ok next=${next}`);
            } catch (err) {
              console.warn("[Call] 좋아요 API 실패:", err);
              setIsLiked(!next); 
            }
          }}
        >
          {}
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={24}
            color={isLiked ? "#ef4444" : COLORS.white}
          />
        </TouchableOpacity>
        {}
      </View>
      )}

      {}
      {floatingGifts.map((g) =>
        g.imageUrl ? (
          <Animated.View
            key={g.id}
            style={[
              s.floatingImage,
              {
                left: g.x,
                transform: [{ translateY: g.animY }],
                opacity: g.animOpacity,
              },
            ]}
          >
            <Image source={{ uri: g.imageUrl }} style={s.floatingImageInner} />
          </Animated.View>
        ) : (
          <Animated.Text
            key={g.id}
            style={[
              s.floatingEmoji,
              {
                left: g.x,
                transform: [{ translateY: g.animY }],
                opacity: g.animOpacity,
              },
            ]}
          >
            {g.emoji}
          </Animated.Text>
        ),
      )}

      {
}

      {}
      {showCallDev && SHOW_USER_TRANSCRIPT && phase === 'listening' && (!!interimTranscript || !!transcript) ? (
        <View style={[s.subtitleContainer, { bottom: subtitleBottom }]} pointerEvents="none">
          <Text style={s.subtitleText} numberOfLines={1} ellipsizeMode="head">
            {interimTranscript || transcript}
          </Text>
        </View>
      ) : null}

      {

}
      {phase === 'confirming' && !!pendingText ? (
        <>
          <Pressable style={s.confirmTapArea} onPress={cancelConfirm} />
          {
}
          {showCallDev && SHOW_USER_TRANSCRIPT ? (
            <View style={[s.subtitleContainer, { bottom: subtitleBottom }]} pointerEvents="none">
              <Text style={s.subtitleText} numberOfLines={1} ellipsizeMode="head">
                {pendingText}
              </Text>
              <View style={s.confirmBarTrack}>
                <Animated.View style={[s.confirmBarFill, { transform: [{ scaleX: confirmProgress }] }]} />
              </View>
              <Text style={s.confirmHint}>
                {t("call.confirmHint", { defaultValue: "탭하여 취소 · 잠시 후 전송" })}
              </Text>
            </View>
          ) : null}
        </>
      ) : null}

      {

}
      {showCallDev && SHOW_USER_TRANSCRIPT && (phase === 'sending' || phase === 'speaking') && !!pendingText && !cloneSubtitle ? (
        <View style={[s.subtitleContainer, { bottom: subtitleBottom }]} pointerEvents="none">
          <Text style={s.subtitleText} numberOfLines={1} ellipsizeMode="head">
            {pendingText}
          </Text>
        </View>
      ) : null}

      {

}
      {phase === 'sending' && livePipeline === 'echomimic_v3' && !cloneSubtitle ? (
        <View style={[s.subtitleContainer, { bottom: subtitleBottom }]} pointerEvents="none">
          <View style={s.thinkingBadge}>
            <ActivityIndicator size="small" color={COLORS.white} />
            <Text style={s.thinkingText}>생성 중…</Text>
          </View>
        </View>
      ) : null}

      {

}
      {}
      {showCallDev && (phase === 'speaking' || phase === 'greeting') && !!cloneSubtitle ? (
        <View style={[s.subtitleContainer, { bottom: subtitleBottom }]} pointerEvents="none">
          <CloneSubtitleTicker text={cloneSubtitle} style={s.subtitleText} />
        </View>
      ) : null}

      {

}
      {capturingWithLogo ? (
        <View
          style={[s.watermarkLayer, { bottom: bottomInset + 24 + 56 + 16 }]}
          pointerEvents="none"
        >
          <Image
            source={require("../../../assets/images/logo.png")}
            style={s.watermarkLogo}
            resizeMode="contain"
          />
        </View>
      ) : null}

      {

}
      {SHOW_VOICE_BALL && dialingDone ? (
        <View
          style={[s.voiceBallLayer, { bottom: bottomInset + 24 + 56 + 16 }]}
          pointerEvents="none"
        >
          <CallVoiceBall phase={phase} micLevel={micLevel} cloneLevel={cloneAudioLevel} sttActive={sttActive} />
        </View>
      ) : null}

      {}
      <View style={[s.controls, { paddingBottom: bottomInset + 24 }]}>
        <TouchableOpacity
          style={[s.controlBtn, isMuted && s.controlBtnDanger]}
          onPress={() => {
            const next = !isMuted;
            setIsMuted(next);

            const audio = (remoteStream as unknown as { getAudioTracks?: () => Array<{ enabled: boolean }> })
              ?.getAudioTracks?.() ?? [];
            audio.forEach((t) => {
              t.enabled = !next;
            });
          }}
        >
          <Feather name={isMuted ? "mic-off" : "mic"} size={24} color={COLORS.white} />
        </TouchableOpacity>

        {
}
        <TouchableOpacity
          style={[
            s.endCallBtn,
            canSpeak && { backgroundColor: SPEAK_OK_COLOR, shadowColor: SPEAK_OK_COLOR },
          ]}
          accessibilityRole="button"
          accessibilityLabel={canSpeak ? "통화 종료 (지금 말할 수 있음)" : "통화 종료"}
          accessibilityHint={canSpeak ? "지금 말해도 됩니다. 이 버튼을 누르면 통화가 종료됩니다." : undefined}
          onPress={async () => {
            await stopLive();
            exitToMain();
          }}
        >
          <Feather name="phone" size={28} color={COLORS.white} style={{ transform: [{ rotate: "135deg" }] }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.controlBtn, isVideoOff && s.controlBtnDanger]}
          onPress={() => setIsVideoOff(!isVideoOff)}
        >
          <Feather name={isVideoOff ? "video-off" : "video"} size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {}
      <Modal
        visible={showGifts}
        transparent
        animationType="slide"
      >
        <Pressable style={s.giftOverlay} onPress={() => setShowGifts(false)}>
          <Pressable
            style={[s.giftSheet, { paddingBottom: 24 + bottomInset }]}
            onPress={(e) => e.stopPropagation()}
          >
            {}
            <View style={s.giftHeader}>
              <View style={s.giftHeaderLeft}>
                <Text style={s.giftTitle}>{t("call.giftTitle")}</Text>
              </View>
              <TouchableOpacity
                style={s.closeBtn}
                onPress={() => setShowGifts(false)}
              >
                <Feather name="x" size={18} color={COLORS.zinc600} />
              </TouchableOpacity>
            </View>

            {
}
            <FlatList
              data={gifts}
              keyExtractor={(item) => item.id}
              contentContainerStyle={s.giftGrid}
              scrollEnabled={true}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={s.giftItem}
                  onPress={() => {

                    if (giftOwnedCount <= 0) {
                      showAlert(
                        "보유 꽃이 없어요",
                        "꽃을 구매하러 이동할까요?",
                        [
                          { text: "취소", style: "cancel" },
                          {
                            text: "구매하기",
                            onPress: () => {
                              setShowGifts(false);

                              navigation.getParent()?.dispatch(
                                CommonActions.navigate({ name: "MyTab", params: { screen: "Purchase" } }),
                              );
                            },
                          },
                        ],
                      );
                      return;
                    }
                    handleGiftSend(item);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={s.giftEmojiWrap}>
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={s.giftImage} />
                    ) : (
                      <Text style={s.giftEmoji}>{item.emoji || "🎁"}</Text>
                    )}
                  </View>
                  <Text style={s.giftName} numberOfLines={1}>{item.name}</Text>
                  {}
                  <Text style={[s.giftPrice, giftOwnedCount === 0 && { color: COLORS.zinc400 }]}>
                    {giftOwnedCount}개 보유
                  </Text>
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {}
      {}

      {}
      {toastMessage && (
        <View style={s.toast}>
          <Text style={s.toastText}>{toastMessage}</Text>
        </View>
      )}
      {
}
      <SvgaOverlay
        visible={!!svgaOverlayUrl}
        svgaUrl={svgaOverlayUrl}
        onClose={() => {
          setSvgaOverlayUrl(null);
          setSvgaSender(null);
        }}
        senderName={svgaSender?.name}
        senderAvatarUrl={svgaSender?.avatarUrl}
        giftName={svgaSender?.giftName}
      />

      {

}

      {}

      {

}
      {emoteReaction && (
        <Animated.View pointerEvents="none" style={[s.emoteOverlay, { opacity: emoteAnim }]}>
          {emoteVideoSource ? (
            <VideoView
              player={emotePlayer}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              nativeControls={false}
            />
          ) : null}
        </Animated.View>
      )}

      {

}
      {isTerminating && (
        <View style={s.exitOverlay} pointerEvents="auto">
          <ActivityIndicator size="large" color={COLORS.white} />
          <Text style={s.exitOverlayText}>종료 중...</Text>
        </View>
      )}

      {}
      {__DEV__ && afl971AdShowingUI && (
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(0,0,0,0.82)",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          pointerEvents="auto"
        >
          <ActivityIndicator size="large" color={COLORS.white} />
          <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: "700", marginTop: 16 }}>
            광고 재생 중…
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 6 }}>
            (개발 스텁 · 실광고 대체)
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({

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
    backgroundColor: COLORS.zinc950,
  },

  videoEdgeMask: {
    overflow: "hidden",
  },
  videoEdgeTrim: {
    width: "100%",
    height: "100%",
    marginHorizontal: -VIDEO_EDGE_TRIM_PX,
  },

  videoFixedContainer: {
    position: "absolute",
    top: VIDEO_TOP,
    left: VIDEO_LEFT,
    width: VIDEO_W,
    height: VIDEO_H,
    overflow: "hidden",
    backgroundColor: COLORS.zinc950,
  },
  videoFixedRtc: {
    width: VIDEO_W,
    height: VIDEO_H,
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
    backgroundColor: COLORS.zinc500, 
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
    color: COLORS.zinc200,
  },

  pipOff: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.zinc900,
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
    color: COLORS.white,
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  callTimeText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
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
    backgroundColor: COLORS.violet500,
  },

  floatingEmoji: {
    position: "absolute",
    bottom: 200,
    fontSize: 48,
    zIndex: 30,
  },

  floatingImage: {
    position: "absolute",
    bottom: 200,
    width: 64,
    height: 64,
    zIndex: 30,
  },
  floatingImageInner: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
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
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '500',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    textAlign: 'center',
    alignSelf: 'center',
    maxWidth: '100%',
  },

  thinkingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    alignSelf: 'center',
  },
  thinkingText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '500',
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
    color: COLORS.zinc300,
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
    backgroundColor: COLORS.white,
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
    backgroundColor: COLORS.error,
  },
  endCallBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.error,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: COLORS.error,
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
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,

    maxHeight: "80%",
  },
  giftHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc200,
  },
  giftHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  giftTitle: { fontSize: 18, fontWeight: "700", color: COLORS.zinc900 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  giftGrid: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },

  giftItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    backgroundColor: COLORS.zinc50,
    borderRadius: RADIUS.lg,
    gap: 12,
  },
  giftEmojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  giftEmoji: { fontSize: 22 },
  giftImage: { width: 36, height: 36, borderRadius: 8 },
  giftName: { flex: 1, fontSize: 15, fontWeight: "600", color: COLORS.zinc900 },

  giftPrice: { fontSize: 13, fontWeight: "700", color: "#a78bfa", minWidth: 60, textAlign: "right" },

  toast: {
    position: "absolute",
    bottom: 140,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: RADIUS.full,
    zIndex: 50,
  },
  toastText: { fontSize: 14, color: COLORS.white },

  exitOverlay: {
    position: "absolute",
    inset: 0 as unknown as number, 
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    gap: 12,
  },
  exitOverlayText: {
    fontSize: 15,
    color: COLORS.white,
    fontWeight: "600",
  },

  emoteRow: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    zIndex: 20,
  },
  emoteBtn: {
    minWidth: 56,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  emoteBtnEmoji: { fontSize: 22, lineHeight: 26 },
  emoteBtnLabel: { fontSize: 11, color: COLORS.white, marginTop: 2, fontWeight: "600" },
  emoteOverlay: {

    position: "absolute",
    top: VIDEO_TOP,
    left: VIDEO_LEFT,
    width: VIDEO_W,
    height: VIDEO_H,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  emoteOverlayEmoji: {
    fontSize: 160,
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  emoteOverlayLabel: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.white,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    letterSpacing: 2,
  },
});
