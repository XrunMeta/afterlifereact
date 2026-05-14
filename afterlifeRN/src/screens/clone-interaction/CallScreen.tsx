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
import { CameraView, useCameraPermissions } from "expo-camera";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAndroidNavigationBarHeight } from "react-native-navigation-bar-height";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { useCloneStore } from "../../stores/cloneStore";
import { useAuthStore } from "../../stores/authStore";
import { COLORS, RADIUS } from "../../components/constants";
import type { Gift } from "../../types/gift";
import giftsData from "../../mocks/gifts.json";
import { getXrunBalance } from "../../api/payments";
import {
  getCloneLikeStatus,
  likeClone,
  unlikeClone,
  sendGiftToClone,
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
  const insets = useSafeAreaInsets();
  const navBarHeight = useAndroidNavigationBarHeight(0);
  const bottomInset =
    Platform.OS === "ios" ? insets.bottom : Math.max(navBarHeight, insets.bottom);

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("front");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);
  const [showGifts, setShowGifts] = useState(false);

  const [credits, setCredits] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [floatingGifts, setFloatingGifts] = useState<FloatingGift[]>([]);
  const giftCounterRef = useRef(0);

  const [callSeconds, setCallSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
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
    console.log(
      `[Call][gift-tap] giftId=${gift.id} name=${gift.name} price=${gift.price} ` +
        `myCredits=${credits} (typeof=${typeof credits}) enough=${credits >= gift.price}`,
    );
    if (credits < gift.price) {
      const shortage = Math.max(0, gift.price - credits);
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
    console.log(
      `[Call][gift-submit] giftId=${pendingGift.id} amount=${pendingGift.price} ` +
        `myCredits=${credits} cloneId=${cloneId} pin=*** (${pinInput.length} chars)`,
    );
    setPaying(true);
    try {
      const res = await sendGiftToClone(accessToken, cloneId, {
        giftId: pendingGift.id,
        giftName: pendingGift.name,
        amount: pendingGift.price,
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
      if (err instanceof AuthApiError) {
        if (err.code === "UNAUTHENTICATED") msg = "결제 비밀번호가 일치하지 않아요.";
        else if (err.code === "INSUFFICIENT_FUNDS") {
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
      showAlert(
        title,
        msg,
        isInsufficient
          ? [
              { text: "다음에 하기", style: "cancel" },
              { text: "XRUN 충전하기", onPress: () => void openXrunApp() },
            ]
          : undefined,
      );
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
      {personaImage ? (
        <Image
          source={typeof personaImage === "number" ? personaImage : { uri: personaImage }}
          style={[StyleSheet.absoluteFill, { width: "100%", height: "100%" }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.zinc900 }]} />
      )}

      <LinearGradient
        colors={["rgba(0,0,0,0.2)", "transparent", "rgba(9,9,11,0.5)"]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      {}
      <TouchableOpacity
        style={[s.pip, { top: insets.top + 8 }]}
        activeOpacity={0.9}
        onPress={() => setCameraFacing((f) => (f === "front" ? "back" : "front"))}
      >
        {isVideoOff ? (
          <View style={s.pipOff}>
            <Feather name="video-off" size={20} color={COLORS.zinc600} />
          </View>
        ) : permission?.granted ? (
          <CameraView style={s.pipCamera} facing={cameraFacing} />
        ) : (
          <View style={s.pipOff}>
            <Feather name="camera-off" size={20} color={COLORS.zinc600} />
          </View>
        )}
      </TouchableOpacity>

      {
}

      {}
      <View style={[s.callInfo, { top: insets.top + 24 }]}>
        <Text style={s.callName}>{personaName}</Text>
        <Text style={s.callTimeText}>{callTimeStr}</Text>
      </View>

      {}
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
      <View style={[s.controls, { paddingBottom: bottomInset + 24 }]}>
        <TouchableOpacity
          style={[s.controlBtn, isMuted && s.controlBtnDanger]}
          onPress={() => setIsMuted(!isMuted)}
        >
          <Feather name={isMuted ? "mic-off" : "mic"} size={24} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={s.endCallBtn}
          onPress={() => navigation.goBack()}
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
                  <Text style={s.giftPrice}>{item.price} XRUN</Text>
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {}

      {}
      <Modal visible={pinModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
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
              <TextInput
                style={s.pinInput}
                value={pinInput}
                onChangeText={(v) => setPinInput(v.replace(/\D/g, "").slice(0, 6))}
                placeholder="PIN 6자리"
                placeholderTextColor={COLORS.zinc400}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
                autoFocus
                editable={!paying}
              />
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

  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    zIndex: 10,
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
