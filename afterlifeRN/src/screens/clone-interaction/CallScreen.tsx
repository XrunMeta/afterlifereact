import { showAlert } from "../../stores/dialogStore";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
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
  KeyboardAvoidingView,
  TextInput,
  Alert,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { RTCView } from "react-native-webrtc";
import {
  Camera as VisionCamera,
  useCameraDevice,
  useFrameProcessor,
} from "react-native-vision-camera";
import { Worklets } from "react-native-worklets-core";
import { useFaceDetector } from "react-native-vision-camera-face-detector";
import type { Face as DetectorFace } from "react-native-vision-camera-face-detector";
import { useFaceDetection } from "../../hooks/useFaceDetection";
import { createPerson, saveFaceConsent, listPersons } from "../../api/persons";
import TermsModal from "../../components/common/TermsModal";
import { useAvatarCall } from "../../realtime/useAvatarCall";
import { CALL_ROUTE } from "../../config/callRoute";
import { useHandsFreeController } from "../../realtime/useHandsFreeController";
import { DialingScreen } from "../../components/call/DialingScreen";
import { CallStatusGlow } from "../../components/call/CallStatusGlow";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAndroidNavigationBarHeight } from "react-native-navigation-bar-height";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { useCloneStore } from "../../stores/cloneStore";
import { useAuthStore } from "../../stores/authStore";
import { COLORS, RADIUS } from "../../components/constants";
import { OtpCodeInput } from "../../components/auth/OtpVerifyView";
import type { Gift } from "../../types/gift";
import giftsData from "../../mocks/gifts.json";
import { getXrunBalance } from "../../api/payments";
import {
  getCloneLikeStatus,
  likeClone,
  unlikeClone,
  sendGiftToClone,
  postCloneCallEvent,
} from "../../api/clones";
import { AuthApiError } from "../../api/auth";

type Props = NativeStackScreenProps<RootStackParamList, "Call">;

const { width: SCREEN_W } = Dimensions.get("window");
const gifts = giftsData as Gift[];

interface FloatingGift {
  id: number;
  emoji: string;
  animY: Animated.Value;
  animOpacity: Animated.Value;
  x: number;
}

export default function CallScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { cloneId, name: paramName, image: paramImage } = route.params;
  const clone = useCloneStore((s) => s.getCloneById(cloneId));
  const accessToken = useAuthStore((s) => s.accessToken);
  const userEmail = useAuthStore((s) => s.apiUser?.email ?? null);
  const currentUserId = useAuthStore((s) => s.apiUser?.id ?? null);

  const isOwnClone =
    !!clone && clone.ownerId != null && currentUserId != null && clone.ownerId === currentUserId;
  const insets = useSafeAreaInsets();

  const TEST_PRICE_EMAILS = ["oth-user@example.invalid", "oth-test@example.invalid"];
  const giftPriceFor = (g: Gift) =>
    userEmail && TEST_PRICE_EMAILS.includes(userEmail) ? 0.05 : g.price;
  const navBarHeight = useAndroidNavigationBarHeight(0);
  const bottomInset =
    Platform.OS === "ios" ? insets.bottom : Math.max(navBarHeight, insets.bottom);

  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("front");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const [dialingDone, setDialingDone] = useState(false);

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

  const faceFrameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      const faces = detectFaces(frame);
      handleFacesOnJS(faces);
    },
    [detectFaces, handleFacesOnJS],
  );

  const [consentGranted, setConsentGranted] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);

  const [consentLoading, setConsentLoading] = useState(false);

  useEffect(() => {

    void VisionCamera.requestCameraPermission();

    if (!accessToken) return;
    let cancelled = false;
    listPersons(accessToken)
      .then(({ items }) => {
        if (cancelled) return;
        const hasConsent = items.some((p) => p.consentState === "granted");
        setConsentGranted(hasConsent);
        console.log(`[Call][face] listPersons ← granted=${hasConsent} (total=${items.length})`);
      })
      .catch((err) => {
        console.warn("[Call][face] listPersons failed:", err);
      });
    return () => {
      cancelled = true;
    };

  }, [accessToken]);

  const {
    state: liveState,
    remoteStream,
    start: startLive,
    stop: stopLive,
    say,
    getStatsReport,
    notifySpeechEnd,
  } = useAvatarCall({ cloneId, accessToken: accessToken ?? "" });

  const {
    phase,
    pendingText,
    cancelConfirm,
    transcript,
    interimTranscript,
    sttActive,
  } = useHandsFreeController({
    enabled: liveState === "live",
    say,
    getStatsReport,
    notifySpeechEnd,
  });

  useEffect(() => {
    if (!accessToken) return;
    void startLive();

  }, []);

  const [showGifts, setShowGifts] = useState(false);

  const [credits, setCredits] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [floatingGifts, setFloatingGifts] = useState<FloatingGift[]>([]);
  const giftCounterRef = useRef(0);

  const [callSeconds, setCallSeconds] = useState(0);
  useEffect(() => {
    if (liveState !== "live") return;
    const id = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [liveState]);

  const confirmProgress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (phase !== 'confirming') { confirmProgress.setValue(0); return; }
    confirmProgress.setValue(1);
    const anim = Animated.timing(confirmProgress, { toValue: 0, duration: 2000, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [phase, pendingText, confirmProgress]);

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
    console.log(`[Call] 진입 cloneId=${cloneId} name=${paramName ?? "?"} (likedByMe fetch 중...)`);
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

  const refreshBalance = useCallback(async () => {
    if (!accessToken) return;
    try {
      const r = await getXrunBalance(accessToken);
      if (r.linked && typeof r.xrun === "number") setCredits(r.xrun);
    } catch (err) {
      console.warn("[Call] getXrunBalance failed:", err);
    }
  }, [accessToken]);
  useEffect(() => {
    void refreshBalance();
  }, [refreshBalance]);

  const personaName = paramName || clone?.displayName || t("chat.personaFallback");
  const personaImage = paramImage || clone?.imageUrl || "";

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pendingGift, setPendingGift] = useState<Gift | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [paying, setPaying] = useState(false);

  const openXrunApp = async () => {
    const email = useAuthStore.getState().apiUser?.email ?? null;
    const deeplink = email
      ? `xrun://?email=${encodeURIComponent(email)}&from=afterlife`
      : "xrun://";
    try {
      await Linking.openURL(deeplink);
    } catch {
      const storeUrl =
        Platform.OS === "ios"
          ? "https://apps.apple.com/app/xrun/id1602489406"
          : "https://play.google.com/store/apps/details?id=run.xrun.xrunapp";
      try {
        await Linking.openURL(storeUrl);
      } catch {

      }
    }
  };

  const handleGiftSend = (gift: Gift) => {
    const price = giftPriceFor(gift);
    console.log(
      `[Call][gift-tap] giftId=${gift.id} name=${gift.name} price=${price} ` +
        `myCredits=${credits} (typeof=${typeof credits}) enough=${credits >= price}`,
    );
    if (credits < price) {
      const shortage = Math.max(0, price - credits);
      console.log(
        `[Call][gift-insufficient-precheck] ${credits} < ${gift.price} (shortage=${shortage}) → block PIN modal`,
      );
      showAlert(
        `${shortage} 잔액이 부족합니다`,
        `선물을 보내기 위해 ${shortage} XRUN이 더 필요해요.\nXRUN에서 암호화폐를 얻어보세요!`,
        [
          { text: "다음에 하기", style: "cancel" },
          { text: "XRUN 충전하기", onPress: () => void openXrunApp() },
        ],
      );
      return;
    }
    setPendingGift(gift);
    setPinInput("");
    setShowGifts(false);
    setPinModalVisible(true);
    console.log(`[Call][gift-pin-open] open PIN modal for gift=${gift.name}`);
  };

  const submitGift = async () => {
    if (!pendingGift || !accessToken) return;
    if (!/^\d{6}$/.test(pinInput)) {
      setToastMessage("PIN 6자리를 입력해 주세요");
      return;
    }
    const submitPrice = giftPriceFor(pendingGift);
    console.log(
      `[Call][gift-submit] giftId=${pendingGift.id} amount=${submitPrice} ` +
        `myCredits=${credits} cloneId=${cloneId} pin=*** (${pinInput.length} chars)`,
    );
    setPaying(true);
    try {
      const res = await sendGiftToClone(accessToken, cloneId, {
        giftId: pendingGift.id,
        giftName: pendingGift.name,
        amount: submitPrice,
        pin: pinInput,
      });
      console.log("[Call][gift-ok] gift sent:", res.gift);
      const gift = pendingGift;

      if (res.gift.newBalance != null && !Number.isNaN(Number(res.gift.newBalance))) {
        setCredits(Number(res.gift.newBalance));
        console.log(`[Call] credits = ${res.gift.newBalance} (from newBalance)`);
      }
      void refreshBalance().then(() => console.log("[Call] balance refetched after gift"));
      setPinModalVisible(false);
      setPendingGift(null);
      setPinInput("");

      playGiftAnimation(gift);
    } catch (err) {
      console.warn("[Call][gift-fail] raw err =", err);
      if (err instanceof AuthApiError) {
        console.warn(
          `[Call][gift-fail] code=${err.code} status=${err.status} msg="${err.message}" details=${JSON.stringify(err.details)}`,
        );
      } else if (err instanceof Error) {
        console.warn(`[Call][gift-fail] non-AuthApiError name=${err.name} msg=${err.message}`);
      }
      let title = "송금 실패";
      let msg = "송금에 실패했어요.";
      let isInsufficient = false;
      let pinRetry = false;   
      let pinSetup = false;   
      if (err instanceof AuthApiError) {
        if (err.code === "PAYMENT_PIN_INVALID" || err.code === "UNAUTHENTICATED") {
          title = "결제 비밀번호 오류";
          msg = "결제 비밀번호가 일치하지 않아요.\n다시 입력해 주세요.";
          pinRetry = true;
        } else if (err.code === "PAYMENT_PIN_REQUIRED") {
          title = "결제 비밀번호 미설정";
          msg = "아직 결제 비밀번호(6자리)가 설정되어 있지 않아요.\nXRUN에서 설정 후 다시 시도해 주세요.";
          pinSetup = true;
        } else if (err.code === "INSUFFICIENT_FUNDS") {
          isInsufficient = true;

          const shortage = pendingGift
            ? Math.max(0, pendingGift.price - credits)
            : 0;
          title = shortage > 0
            ? `${shortage} 잔액이 부족합니다`
            : "잔액이 부족합니다";
          msg = shortage > 0
            ? `선물을 보내기 위해 ${shortage} XRUN이 더 필요해요.\nXRUN에서 암호화폐를 얻어보세요!`
            : "선물을 보내기에 XRUN 이 부족해요.\nXRUN에서 암호화폐를 얻어보세요!";
        } else if (err.code === "CONFLICT") msg = err.message;
        else if (err.code === "UPSTREAM_NOT_IMPLEMENTED")
          msg = "xrun 게이트웨이 송금 기능이 아직 준비 중이에요.";
        else if (err.code === "UPSTREAM_FAILURE") {

          if (/insufficient|잔액|balance/i.test(err.message)) {
            isInsufficient = true;
            const shortage = pendingGift
              ? Math.max(0, pendingGift.price - credits)
              : 0;
            title = shortage > 0
              ? `${shortage} 잔액이 부족합니다`
              : "잔액이 부족합니다";
            msg = shortage > 0
              ? `선물을 보내기 위해 ${shortage} XRUN이 더 필요해요.\nXRUN에서 암호화폐를 얻어보세요!`
              : "선물을 보내기에 XRUN 이 부족해요.\nXRUN에서 암호화폐를 얻어보세요!";
          } else {
            msg = "xrun 송금 처리 중 오류가 발생했어요.";
          }
        } else msg = err.message;
      }

      setPinModalVisible(false);
      setPinInput("");
      let actions: Parameters<typeof showAlert>[2];
      if (isInsufficient) {
        actions = [
          { text: "다음에 하기", style: "cancel" },
          { text: "XRUN 충전하기", onPress: () => void openXrunApp() },
        ];
      } else if (pinRetry) {

        actions = [
          { text: "취소", style: "cancel" },
          { text: "다시 입력", onPress: () => { setPinInput(""); setPinModalVisible(true); } },
        ];
      } else if (pinSetup) {
        actions = [
          { text: "다음에 하기", style: "cancel" },
          { text: "xrun 비밀번호 재설정", onPress: () => void openXrunApp() },
        ];
      }
      showAlert(title, msg, actions);
    } finally {
      setPaying(false);
    }
  };

  const playGiftAnimation = (gift: Gift) => {
    setToastMessage(t("call.giftSent", { name: gift.name }));

    const id = giftCounterRef.current++;
    const animY = new Animated.Value(0);
    const animOpacity = new Animated.Value(0);
    const x = SCREEN_W / 2 + (Math.random() * 120 - 60);

    const newGift: FloatingGift = { id, emoji: gift.emoji, animY, animOpacity, x };
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

  return (
    <View style={s.container}>
      {}
      {}
      {remoteStream ? (
        <RTCView
          streamURL={(remoteStream as unknown as { toURL: () => string }).toURL()}
          objectFit="contain"
          style={[StyleSheet.absoluteFill, { width: "100%", height: "100%" }]}
        />
      ) : personaImage ? (
        <Image
          source={typeof personaImage === "number" ? personaImage : { uri: personaImage }}
          style={[StyleSheet.absoluteFill, { width: "100%", height: "100%" }]}
          resizeMode="contain"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.zinc900 }]} />
      )}

      {__DEV__ ? (
        <Text style={{ position: 'absolute', top: 8, right: 8, zIndex: 10,
          color: '#0f0', fontSize: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 2 }}>
          route:{CALL_ROUTE}
        </Text>
      ) : null}

      {}
      {!dialingDone && (
        <DialingScreen
          liveState={liveState}
          personaName={personaName}
          personaImage={typeof personaImage === "string" ? personaImage : ""}
          onConnected={() => setDialingDone(true)}
          onCancel={async () => { await stopLive(); navigation.goBack(); }}
          onRetry={() => { void startLive(); }}
        />
      )}

      <LinearGradient
        colors={["rgba(0,0,0,0.2)", "transparent", "rgba(9,9,11,0.5)"]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      {dialingDone ? <CallStatusGlow phase={phase} sttActive={sttActive} /> : null}

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
        ) : vcDevice ? (

          <VisionCamera
            ref={pipCameraRef}
            style={s.pipCamera}
            device={vcDevice}
            isActive={!isVideoOff}

            androidPreviewViewType="texture-view"
            frameProcessor={consentGranted ? faceFrameProcessor : undefined}
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

      {
}

      {}
      <View style={[s.callInfo, { top: insets.top + 24 }]}>
        <Text style={s.callName}>{personaName}</Text>
        <Text style={s.callTimeText}>
          {liveState === "live" ? callTimeStr : "연결 중…"}
        </Text>
      </View>

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
      {floatingGifts.map((g) => (
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
      ))}

      {}
      {phase === 'listening' && (!!interimTranscript || !!transcript) ? (
        <View style={s.subtitleContainer} pointerEvents="none">
          <Text style={s.subtitleText} numberOfLines={2} ellipsizeMode="tail">
            {interimTranscript || transcript}
          </Text>
        </View>
      ) : null}

      {}
      {phase === 'confirming' && !!pendingText ? (
        <Pressable style={s.confirmTapArea} onPress={cancelConfirm}>
          <View style={s.subtitleContainer} pointerEvents="none">
            <Text style={s.subtitleText} numberOfLines={2} ellipsizeMode="tail">
              {pendingText}
            </Text>
            <View style={s.confirmBarTrack}>
              <Animated.View style={[s.confirmBarFill, { transform: [{ scaleX: confirmProgress }] }]} />
            </View>
            <Text style={s.confirmHint}>탭하여 취소 · 잠시 후 전송</Text>
          </View>
        </Pressable>
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

        <TouchableOpacity
          style={s.endCallBtn}
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
        onShow={() => void refreshBalance()}
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
                <View style={s.creditsPill}>
                  <Text style={s.creditsPillText}>
                    {credits.toLocaleString()} XRUN
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={s.closeBtn}
                onPress={() => setShowGifts(false)}
              >
                <Feather name="x" size={18} color={COLORS.zinc600} />
              </TouchableOpacity>
            </View>

            {}
            <FlatList
              data={gifts}
              keyExtractor={(item) => item.id}
              numColumns={3}
              columnWrapperStyle={s.giftRow}
              contentContainerStyle={s.giftGrid}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={s.giftItem}
                  onPress={() => handleGiftSend(item)}
                  activeOpacity={0.7}
                >
                  <View style={s.giftEmojiWrap}>
                    <Text style={s.giftEmoji}>{item.emoji}</Text>
                  </View>
                  <Text style={s.giftName}>{item.name}</Text>
                  <Text style={s.giftPrice}>{giftPriceFor(item)} XRUN</Text>
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {}

      {
}
      <Modal visible={pinModalVisible} transparent statusBarTranslucent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <Pressable
            style={s.pinOverlay}
            onPress={() => !paying && setPinModalVisible(false)}
          >
            <Pressable style={s.pinBox} onPress={(e) => e.stopPropagation()}>
              <View style={s.pinIconWrap}>
                <Feather name="lock" size={26} color={COLORS.violet600} />
              </View>
              <Text style={s.pinTitle}>결제 비밀번호</Text>
              {pendingGift && (
                <Text style={s.pinDesc}>
                  {pendingGift.emoji} {pendingGift.name} · {pendingGift.price} XRUN
                  {"\n"}선물하시려면 6자리 PIN 을 입력해 주세요
                </Text>
              )}
              {}
              <View style={s.pinCodeWrap}>
                <OtpCodeInput
                  value={pinInput}
                  onChange={setPinInput}
                  masked
                  autoFocus
                  editable={!paying}
                  onComplete={submitGift}
                />
              </View>
              <View style={s.pinBtns}>
                <TouchableOpacity
                  style={s.pinCancelBtn}
                  onPress={() => setPinModalVisible(false)}
                  disabled={paying}
                >
                  <Text style={s.pinCancelText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.pinConfirmBtn, (pinInput.length !== 6 || paying) && s.pinBtnDisabled]}
                  onPress={submitGift}
                  disabled={pinInput.length !== 6 || paying}
                >
                  <Text style={s.pinConfirmText}>{paying ? "선물 중..." : "선물하기"}</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {}
      {toastMessage && (
        <View style={s.toast}>
          <Text style={s.toastText}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.zinc950,
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

  subtitleContainer: {
    position: 'absolute',
    bottom: 150,
    left: 48,
    right: 48,
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
    overflow: 'hidden',
  },
  confirmTapArea: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: '33%',
    justifyContent: 'center',
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
    borderBottomColor: COLORS.zinc200,
  },
  giftHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  giftTitle: { fontSize: 18, fontWeight: "700", color: COLORS.zinc900 },
  creditsPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: COLORS.violet100,
    borderRadius: RADIUS.full,
  },
  creditsPillText: { fontSize: 13, fontWeight: "700", color: COLORS.violet600 },
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
    backgroundColor: COLORS.zinc50,
    borderRadius: RADIUS.lg,
  },
  giftEmojiWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  giftEmoji: { fontSize: 24 },
  giftName: { fontSize: 13, fontWeight: "600", color: COLORS.zinc900, marginBottom: 2 },
  giftPrice: { fontSize: 12, fontWeight: "700", color: COLORS.violet600 },

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

  pinOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  pinBox: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 20,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  pinIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.violet100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  pinTitle: { fontSize: 17, fontWeight: "700", color: COLORS.zinc900, marginBottom: 10 },
  pinDesc: {
    fontSize: 13,
    color: COLORS.zinc600,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 18,
  },
  pinInput: {
    width: "100%",
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 20,
    textAlign: "center",
    letterSpacing: 4, 
    color: COLORS.zinc900,
    backgroundColor: COLORS.zinc50,
    marginBottom: 18,
  },
  pinCodeWrap: { width: "100%", marginBottom: 18 },
  pinBtns: { flexDirection: "row", gap: 8, width: "100%" },
  pinCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    alignItems: "center",
  },
  pinCancelText: { fontSize: 14, fontWeight: "600", color: COLORS.zinc600 },
  pinConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.violet600,
    alignItems: "center",
  },
  pinConfirmText: { fontSize: 14, fontWeight: "700", color: COLORS.white },
  pinBtnDisabled: { backgroundColor: COLORS.zinc300 },
});
