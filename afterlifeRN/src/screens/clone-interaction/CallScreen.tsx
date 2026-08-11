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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import {
  startCallForegroundService,
  stopCallForegroundService,
} from "../../lib/callForegroundService";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";

import SvgaOverlay from "../../components/gift/SvgaOverlay";

import CallEntryQuestionsScreen from "../call-entry/CallEntryQuestionsScreen";

import SvgaThumb from "../../components/gift/SvgaThumb";
import { RTCView } from "react-native-webrtc";
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
import { shouldRunEmbedding } from "../../face/embeddingThrottle";
import { normalizeFrameTimestampMs } from "../../face/frameTimestamp";
import { detectNewFaces } from "../../face/newFaceDetector";
import { useFaceIdentify } from "../../face/useFaceIdentify";
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
  type Person,
} from "../../api/persons";
import { AuthApiError } from "../../api/auth";
import { getFaceBiometricConsent } from "../../api/consent";
import { decideEnrollSuggestAction, decideOrphanCleanupBeforeSilent } from "../../face/autoEnrollGuard";
import { FACE_DIAG_ENABLED, formatFaceHud, type FaceDiag } from "../../config/faceDiag";
import TermsModal from "../../components/common/TermsModal";
import { useAvatarCall } from "../../realtime/useAvatarCall";
import { submitDevText } from "../../realtime/devCallText";
import { CALL_ROUTE } from "../../config/callRoute";
import { GREETING_ENABLED, GREETING_FALLBACK_TEXT, GREET_TIMEOUT_MS } from "../../config/greeting";
import { useHandsFreeController } from "../../realtime/useHandsFreeController";
import { shouldSkipUnknownFaceEntry, computeFaceKey } from "../../realtime/faceInterruptRouting";
import { useVideoStatsDiag } from "../../realtime/useVideoStatsDiag";
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
import { sendGiftOffchain } from "../../api/giftInventory";
import { showAlert } from "../../stores/dialogStore";
import { CommonActions } from "@react-navigation/native";
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

interface FloatingGift {
  id: number;
  emoji: string;

  imageUrl?: string;
  animY: Animated.Value;
  animOpacity: Animated.Value;
  x: number;
}

export default function CallScreen(props: Props) {
  const [heavyReady, setHeavyReady] = React.useState(false);
  React.useEffect(() => {

    const raf = requestAnimationFrame(() => setHeavyReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  const { name: paramName, image: paramImage } = props.route.params;
  const placeholderImage = typeof paramImage === "string" ? paramImage : "";
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.zinc950 }}>
      {!heavyReady ? (
        <DialingScreen
          liveState="idle"
          personaName={paramName ?? ""}
          personaImage={placeholderImage}
          onConnected={() => {}}
          onCancel={() => props.navigation.goBack()}
          onRetry={() => {}}
        />
      ) : (
        <CallScreenInner {...props} />
      )}
    </View>
  );
}

function CallScreenInner({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { cloneId, name: paramName, image: paramImage } = route.params;
  const clone = useCloneStore((s) => s.getCloneById(cloneId));
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentUserId = useAuthStore((s) => s.apiUser?.id ?? null);

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

  const [callEntryOpen, setCallEntryOpen] = useState(true);
  useEffect(() => {
    if (!clone) return;
    const attrs = clone.l1Profile?.attrs ?? {};
    const complete =
      (attrs.relation_category ?? "").trim().length > 0 &&
      (attrs.relation_subtype ?? "").trim().length > 0 &&
      (attrs.speech_form ?? "").trim().length > 0 &&
      (attrs.job_category ?? "").trim().length > 0 &&
      (attrs.job_detail ?? "").trim().length > 0;
    setCallEntryOpen(!complete);

    console.log("[CallEntry] gate check", { cloneId, complete, attrs });
  }, [clone, cloneId]);

  const [faceProcOff, setFaceProcOff] = useState(false);

  const [dialingDone, setDialingDone] = useState(false);

  const [faceIdentifyEnabled, setFaceIdentifyEnabled] = useState(true);
  const [selfConfirmed, setSelfConfirmed] = useState(true); 
  const selfSamplesRef = useRef<number[][]>([]);
  const selfConfirmingRef = useRef(false);

  const vcDevice = useCameraDevice(cameraFacing === "front" ? "front" : "back");

  const { faceState, onFaces } = useFaceDetection();
  const { detectFaces, stopListeners } = useFaceDetector({
    performanceMode: "fast",
    trackingEnabled: true,
  });

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

    setConsentGranted(true);
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
        setFaceBiometricConsent(r.state === "granted");
        console.log(`[Call][face] getFaceBiometricConsent ← granted=${r.state === "granted"}`);
      })
      .catch((err) => {
        if (cancelled) return;
        setFaceBiometricConsent(false); 
        console.warn("[Call][face] getFaceBiometricConsent failed, fallback to card flow:", err);
      });
    return () => {
      cancelled = true;
    };

  }, [accessToken]);

  const autoEnrolledNoNameRef = useRef<Set<number>>(new Set());

  const silentEnrollRef = useRef(false);

  const submittedEnrollNameRef = useRef("");

  const enrollSuggestImplRef = useRef<(name: string, personId?: number) => void>(() => {});
  const handleEnrollSuggest = useCallback((name: string, personId?: number) => {
    enrollSuggestImplRef.current(name, personId);
  }, []);

  const [livePipeline, setLivePipeline] = useState<string | null>(null);

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
  } = useAvatarCall({
    cloneId,
    accessToken: accessToken ?? "",
    onEnrollSuggest: handleEnrollSuggest,

    pipeline: livePipeline ?? (clone as { pipeline?: string | null })?.pipeline ?? null,
  });

  useEffect(() => {
    if (!cloneId || !accessToken) return;
    let alive = true;
    (async () => {
      try {
        const { getCloneDetail } = await import("../../api/clones");
        const detail = await getCloneDetail(cloneId, accessToken);
        if (alive) {
          const p = (detail as { clone?: { pipeline?: string | null } })?.clone?.pipeline ?? null;
          setLivePipeline(p);
          if (__DEV__) console.log(`[T-467] livePipeline for clone ${cloneId} = ${p}`);
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

  useVideoStatsDiag({ getStatsReport, enabled: __DEV__ && liveState === "live" });

  const faceEmbedModelPlugin = useTensorflowModel(
    require("../../../assets/models/w600k_mbf.tflite"),
  );
  const faceEmbedModel =
    faceEmbedModelPlugin.state === "loaded" ? faceEmbedModelPlugin.model : undefined;
  const { resize } = useResizePlugin();

  const isAndroidFrame = Platform.OS === "android";

  const lastEmbedTs = useSharedValue(0);

  const seenFaceIdsRef = useRef<Set<number>>(new Set());

  const handleSpeakerEventRef = useRef<(evt: SpeakerEvent) => void>(() => {});
  const handleSpeakerEventTrampoline = useCallback((evt: SpeakerEvent) => {
    handleSpeakerEventRef.current(evt);
  }, []);

  const shStateRef = useRef(initSpeakerHandoffState());
  const dispatchShRef = useRef<(event: SpeakerHandoffEvent) => void>(() => {});
  const dispatchSh = useCallback((event: SpeakerHandoffEvent) => {
    dispatchShRef.current(event);
  }, []);

  const notifyFaceInterruptRef = useRef<(text: string, faceKey: string) => void>(() => {});

  const micOnRef = useRef(false);

  const namingSessionIdRef = useRef(0);

  const unknownFaceSnapshotRef = useRef<number[][] | null>(null);

  const calibrateOpt = useMemo(
    () => (FACE_DIAG_ENABLED ? { accessToken: accessToken ?? "", groundTruthPersonId: gtPersonId } : null),
    [accessToken, gtPersonId],
  );

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
        sendFaceEvent?.({
          event: "speaker_confirmed",
          personId: evt.personId,
          displayName: evt.displayName,
        });
      } else if (evt.type === "unknown_face") {
        dispatchSh({ type: "UNKNOWN_FACE" });

        unknownFaceSnapshotRef.current = getFaceEmbeddingBuffer().latest(FACE_ENROLL_VECTOR_COUNT);
        sendFaceEvent?.({ event: "unknown_face" });
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

        const pendingId = faceEnroll.getPendingPersonId();
        const enrolledId = faceEnroll.getEnrolledPersonId();
        const cleanup = decideOrphanCleanupBeforeSilent({
          enrolling: false,
          pendingPersonId: pendingId,
          enrolledPersonId: enrolledId,
          incomingName: name,
          lastName: submittedEnrollNameRef.current,
        });
        if (cleanup === "delete") {
          if (accessToken && pendingId != null) {
            void deletePerson(accessToken, pendingId).catch((err) => {
              console.warn("[Call][face] orphan person cleanup(deletePerson) failed:", err);
            });
          }
          faceEnroll.reset();
        } else if (cleanup === "detach") {

          faceEnroll.reset();
        }
        submittedEnrollNameRef.current = name;

        silentEnrollRef.current = true;
        void faceEnroll.enrollSilent();
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

  const handleEmbeddingOnJS = React.useMemo(
    () =>
      Worklets.createRunOnJS(
        (vector: number[], faceCount: number, trackingIds: number[]) => {
          if (faceCount > 1) {
            const { newIds, seen } = detectNewFaces(seenFaceIdsRef.current, trackingIds);
            seenFaceIdsRef.current = seen;
            if (newIds.length > 0) {
              sendFaceEvent?.({ event: "multi_face" });
            }
          }
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

      if (faceEmbedModel != null && shouldRunEmbedding(lastEmbedTs.value, nowMs)) {
        lastEmbedTs.value = nowMs;
        const primary = largestFace(faces);
        if (primary != null) {
          const resized = resize(frame, {
            crop: {
              x: primary.bounds.x,
              y: primary.bounds.y,
              width: primary.bounds.width,
              height: primary.bounds.height,
            },
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
          handleEmbeddingOnJS(Array.from(out), faces.length, trackingIds);
        }
      }
    },
    [
      detectFaces,
      handleFacesOnJS,
      faceEmbedModel,
      resize,
      lastEmbedTs,
      isAndroidFrame,
      handleEmbeddingOnJS,
    ],
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
  } = useHandsFreeController({
    enabled: liveState === "live",
    say,
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
  });

  useEffect(() => {
    notifyFaceInterruptRef.current = notifyFaceInterrupt;
  }, [notifyFaceInterrupt]);

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
    }
  }, [transcript]);
  const chatReplyStartAt = useRef<number | null>(null);
  useEffect(() => {
    if (!lastSignal) return;
    if (lastSignal.type === 'speech_start') {
      const wait = chatUserSentAt.current ? Date.now() - chatUserSentAt.current : null;
      console.log(`[Call][chat] clone reply start${wait !== null ? ` (waited ${wait}ms after user)` : ''}`);
      chatReplyStartAt.current = Date.now();
      chatUserSentAt.current = null;
    } else if (lastSignal.type === 'speech_text' && lastSignal.text) {
      console.log(`[Call][chat] clone: "${lastSignal.text}"`);
    } else if (lastSignal.type === 'speech_end') {
      const dur = chatReplyStartAt.current ? Date.now() - chatReplyStartAt.current : null;
      console.log(`[Call][chat] clone reply end${dur !== null ? ` (took ${dur}ms)` : ''}`);
      chatReplyStartAt.current = null;
    }
  }, [lastSignal]);

  const canSpeak = (phase === 'listening' || phase === 'confirming') && sttActive;

  useEffect(() => {
    const audio = (remoteStream as unknown as { getAudioTracks?: () => Array<{ enabled: boolean }> })
      ?.getAudioTracks?.() ?? [];
    const shouldEnable = dialingDone && !isMuted;
    audio.forEach((t) => {
      t.enabled = shouldEnable;
    });
  }, [remoteStream, dialingDone, isMuted]);

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
  const myAvatarUrl = useAuthStore((s) => s.apiUser?.avatarUrl ?? null);

  const [gifts, setGifts] = useState<GiftCatalogItem[]>([]);
  useEffect(() => {
    let cancelled = false;
    void fetchGiftCatalog().then((items) => {
      if (!cancelled) setGifts(items);
    });
    return () => {
      cancelled = true;
    };
  }, []);
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

  const [callSeconds, setCallSeconds] = useState(0);
  useEffect(() => {
    if (liveState !== "live") return;
    const id = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [liveState]);

  const adShownMinutesRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    if (liveState !== "live" || callSeconds <= 0) return;
    if (callSeconds % 600 !== 0) return; 
    const minute = Math.floor(callSeconds / 60);
    if (adShownMinutesRef.current.has(minute)) return;
    adShownMinutesRef.current.add(minute);
    console.log(`[Call][pangle] ${minute} min — rewarded ad trigger`);
    (async () => {
      try {
        const { loadAndShowRewardedAd } = await import("../../lib/pangle");
        await loadAndShowRewardedAd();
        console.log(`[Call][pangle] ${minute} min — ad closed, call resumes`);
      } catch (err) {
        console.warn(`[Call][pangle] ${minute} min — ad failed:`, (err as Error)?.message ?? err);
      }
    })();
  }, [callSeconds, liveState]);

  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const warnedRef = useRef(false);
  const exhaustedRef = useRef(false);
  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getCreditBalance(accessToken)
      .then((b) => {
        if (cancelled) return;
        setRemainingSec(Math.max(0, Math.floor(b.totalSec ?? 0)));
      })
      .catch((err) => {
        console.warn("[Call] balance fetch failed:", (err as Error)?.message ?? err);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);
  useEffect(() => {
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
  }, [liveState, t]);

  const confirmProgress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (phase !== 'confirming') { confirmProgress.setValue(0); return; }
    confirmProgress.setValue(1);
    const anim = Animated.timing(confirmProgress, { toValue: 0, duration: 2000, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [phase, pendingText, confirmProgress]);

  useEffect(() => {
    const backSub = BackHandler.addEventListener("hardwareBackPress", () => {
      console.log("[Call][back] hardware back → stopLive + goBack");
      void stopLive();
      navigation.goBack();
      return true;
    });
    return () => backSub.remove();
  }, [stopLive, navigation]);

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
        `[gift] send skipped — ownerId still null after fetch. cloneId=${cloneId} cloneName=${clone?.name ?? "?"}`,
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

  return (
    <View style={s.container}>
      {}
      {

}
      {remoteStream ? (
        <View style={s.videoFixedContainer}>
          <RTCView
            streamURL={(remoteStream as unknown as { toURL: () => string }).toURL()}
            objectFit="cover"
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

      {hudDevBox ? (
        <View style={{ position: "absolute", top: 8, right: 8, zIndex: 10,
          backgroundColor: "rgba(0,0,0,0.5)", padding: 4 }}>
          <Text style={{ color: "#0f0", fontSize: 10 }}>route:{CALL_ROUTE}</Text>
          {FACE_DIAG_ENABLED ? (
            <>
              <Text style={{ color: "#0f0", fontSize: 10 }}>
                {faceDiag ? formatFaceHud(faceDiag) : "face -"}
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
            console.log(`[Call][flow] +${Date.now()} DialingScreen.onCancel → stopLive + goBack`);
            await stopLive();
            navigation.goBack();
          }}
          onRetry={() => {
            console.log(`[Call][flow] +${Date.now()} DialingScreen.onRetry → startLive`);
            setGreetingStarted(false);
            void startLive();
          }}
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
      <TouchableOpacity
        style={[s.pip, { top: insets.top + 8 }]}
        activeOpacity={0.9}
        onPress={() => setCameraFacing((f) => (f === "front" ? "back" : "front"))}
      >
        {isVideoOff ? (
          <View style={s.pipOff}>
            <Feather name="video-off" size={20} color={COLORS.zinc600} />
          </View>
        ) : vcDevice && dialingDone ? (

          <VisionCamera
            ref={pipCameraRef}
            style={s.pipCamera}
            device={vcDevice}
            isActive={!isVideoOff}

            androidPreviewViewType="texture-view"

            frameProcessor={consentGranted && !faceProcOff ? faceFrameProcessor : undefined}
            onError={(e) =>
              console.log("[Call][face] camera error:", e.code, e.message)
            }
          />
        ) : (
          <View style={s.pipOff}>
            <Feather name="camera-off" size={20} color={COLORS.zinc600} />
          </View>
        )}

        {}
        {consentGranted && !isVideoOff && vcDevice ? (
          <View
            style={[
              s.faceIndicator,
              faceState.status === "detected" ? s.faceIndicatorOn : s.faceIndicatorOff,
            ]}
          />
        ) : null}
      </TouchableOpacity>

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
      {(phase === 'speaking' || phase === 'greeting') && !!cloneSubtitle ? (
        <View style={[s.subtitleContainer, { bottom: subtitleBottom }]} pointerEvents="none">
          <CloneSubtitleTicker text={cloneSubtitle} style={s.subtitleText} />
        </View>
      ) : null}

      {

}
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
            navigation.goBack();
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
                  onPress={() => handleGiftSend(item)}
                  activeOpacity={0.7}
                >
                  <View style={s.giftEmojiWrap}>
                    {

}
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={s.giftImage} />
                    ) : (
                      <Text style={s.giftEmoji}>{item.emoji || "🎁"}</Text>
                    )}
                  </View>
                  <Text style={s.giftName} numberOfLines={1}>{item.name}</Text>
                  {typeof item.xrunPrice === "number" ? (
                    <Text style={s.giftPrice}>{item.xrunPrice} XRUN</Text>
                  ) : (
                    <View style={{ minWidth: 60 }} />
                  )}
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

      {}
      <CallEntryQuestionsScreen
        visible={callEntryOpen}
        cloneId={cloneId}
        name={clone?.displayName ?? paramName ?? ""}
        existingL1={
          clone?.l1Profile
            ? { attrs: clone.l1Profile.attrs, notes: clone.l1Profile.notes }
            : null
        }
        onCancel={() => {
          setCallEntryOpen(false);
          navigation.goBack();
        }}
        onCall={() => setCallEntryOpen(false)}
        onLearn={() => {
          setCallEntryOpen(false);

          navigation.goBack();
        }}
      />
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

});
