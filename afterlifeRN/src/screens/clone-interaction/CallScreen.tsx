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
  Share,
  ScrollView,
  TextInput,
  Alert,
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
  listFeedComments,
  postFeedComment,
  postCloneComment,
  deleteFeedComment,
  getCloneLikeStatus,
  likeClone,
  unlikeClone,
  sendGiftToClone,
  type FeedComment,
} from "../../api/clones";
import { AuthApiError } from "../../api/auth";
import { formatRelativeKo } from "../../lib/relativeTime";

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
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const myUserId = useAuthStore((s) => s.apiUser?.id ?? s.user?.id ?? null);
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

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const submittingRef = useRef(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const [commentFeedId, setCommentFeedId] = useState<number | null>(null);

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    try {

      const res = await fetch(
        `https://edge-alt-preview.example.invalid/oth-path${cloneId}/comments?limit=100`,
      );
      if (res.ok) {
        const data = (await res.json()) as { items: FeedComment[] };
        setComments(data.items);

        if (data.items.length > 0) {

          const firstWithFeed = data.items.find((c: any) => c.feedId);
          if (firstWithFeed && (firstWithFeed as any).feedId) {
            setCommentFeedId((firstWithFeed as any).feedId);
          }
        }
      }
    } catch (err) {
      console.warn("[Call] loadComments failed:", err);
    } finally {
      setCommentsLoading(false);
    }
  }, [cloneId]);

  useEffect(() => {
    if (showComments) void loadComments();
  }, [showComments, loadComments]);

  const submitComment = async () => {
    if (submittingRef.current) return;
    const content = commentText.trim();
    if (!content || !accessToken) return;
    submittingRef.current = true;
    setSubmittingComment(true);
    try {
      let realFeedId: number;
      if (commentFeedId == null) {

        const r = await postCloneComment(accessToken, cloneId, content);
        realFeedId = r.comment.feedId;
        setCommentFeedId(realFeedId);
      } else {
        await postFeedComment(accessToken, commentFeedId, content);
        realFeedId = commentFeedId;
      }
      setCommentText("");
      void loadComments();
    } catch (err) {
      console.warn("[Call] submitComment failed:", err);
    } finally {
      submittingRef.current = false;
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = (commentId: number, feedId: number) => {
    if (!accessToken) return;
    Alert.alert("댓글 삭제", "이 댓글을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteFeedComment(accessToken, feedId, commentId);
            setComments((prev) => prev.filter((c) => c.id !== commentId));
          } catch (err) {
            console.warn("[Call] delete comment failed:", err);
          }
        },
      },
    ]);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${personaName} 와 통화해보세요!\nhttps://afterlife.run/oth-path${cloneId}`,
        title: personaName,
      });
    } catch (err) {
      console.warn("[Call] share failed:", err);
    }
  };

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

  const handleGiftSend = (gift: Gift) => {
    if (credits < gift.price) {
      setToastMessage(t("call.noCredits"));
      return;
    }
    setPendingGift(gift);
    setPinInput("");
    setShowGifts(false);
    setPinModalVisible(true);
  };

  const submitGift = async () => {
    if (!pendingGift || !accessToken) return;
    if (!/^\d{6}$/.test(pinInput)) {
      setToastMessage("PIN 6자리를 입력해 주세요");
      return;
    }
    setPaying(true);
    try {
      const res = await sendGiftToClone(accessToken, cloneId, {
        giftId: pendingGift.id,
        giftName: pendingGift.name,
        amount: pendingGift.price,
        pin: pinInput,
      });
      console.log("[Call] gift sent:", res.gift);
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
      console.warn("[Call] gift failed:", err);
      let msg = "송금에 실패했어요.";
      if (err instanceof AuthApiError) {
        if (err.code === "UNAUTHENTICATED") msg = "결제 비밀번호가 일치하지 않아요.";
        else if (err.code === "INSUFFICIENT_FUNDS") msg = "잔액이 부족해요.";
        else if (err.code === "CONFLICT") msg = err.message;
        else if (err.code === "UPSTREAM_NOT_IMPLEMENTED")
          msg = "xrun 게이트웨이 송금 기능이 아직 준비 중이에요.";
        else if (err.code === "UPSTREAM_FAILURE")
          msg = "xrun 송금 처리 중 오류가 발생했어요.";
        else msg = err.message;
      }
      Alert.alert("송금 실패", msg);
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

      {}
      <View style={[s.creditsBadge, { top: insets.top + 8 }]}>
        <Text style={s.creditsText}>{credits.toLocaleString()} XRUN</Text>
      </View>

      {}
      <View style={[s.callInfo, { top: insets.top + 24 }]}>
        <Text style={s.callName}>{personaName}</Text>
        <View style={s.callStatusBadge}>
          <View style={s.callDot} />
          <Text style={s.callStatusText}>{t("call.inCall", { time: callTimeStr })}</Text>
        </View>
      </View>

      {}
      <View style={[s.rightActions, { bottom: 180 + bottomInset }]}>
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
        <TouchableOpacity style={s.sideBtn} onPress={() => setShowComments(true)}>
          <Feather name="message-circle" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity style={s.sideBtn} onPress={handleShare}>
          <Feather name="share-2" size={22} color={COLORS.white} />
        </TouchableOpacity>
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
      <Modal visible={showComments} transparent animationType="slide">
        <Pressable style={s.commentOverlay} onPress={() => setShowComments(false)}>
          <Pressable
            style={[s.commentSheet, { paddingBottom: 12 + bottomInset }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={s.sheetHandle} />
            <View style={s.commentHeaderRow}>
              <Text style={s.commentTitle}>
                {t("feed.commentCount", { n: comments.length })}
              </Text>
              <TouchableOpacity onPress={() => setShowComments(false)}>
                <Feather name="x" size={20} color={COLORS.zinc600} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {commentsLoading ? (
                <View style={s.emptyComment}>
                  <Feather name="loader" size={28} color={COLORS.zinc300} />
                </View>
              ) : comments.length > 0 ? (
                comments.map((c: any) => (
                  <View key={c.id} style={s.commentRow}>
                    {c.user?.avatarUrl ? (
                      <Image source={{ uri: c.user.avatarUrl }} style={s.commentAvatar} />
                    ) : (
                      <View style={[s.commentAvatar, { backgroundColor: COLORS.zinc200 }]} />
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={s.commentMeta}>
                        <Text style={s.commentAuthor}>
                          {c.user?.name ?? c.user?.email}
                        </Text>
                        <Text style={s.commentTime}>{formatRelativeKo(c.createdAt)}</Text>
                        {c.userId === myUserId && c.feedId && (
                          <TouchableOpacity
                            onPress={() => handleDeleteComment(c.id, c.feedId)}
                            style={{ marginLeft: 8 }}
                          >
                            <Feather name="trash-2" size={14} color={COLORS.zinc400} />
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={s.commentContent}>{c.content}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={s.emptyComment}>
                  <Feather name="message-circle" size={40} color={COLORS.zinc300} />
                  <Text style={s.emptyText}>{t("feed.commentsEmpty")}</Text>
                </View>
              )}
            </ScrollView>
            <View style={s.commentInputRow}>
              <TextInput
                style={s.commentInput}
                value={commentText}
                onChangeText={setCommentText}
                placeholder={t("feed.commentPlaceholder")}
                placeholderTextColor={COLORS.placeholder}
              />
              <TouchableOpacity
                disabled={!commentText.trim() || !accessToken || submittingComment}
                onPress={submitComment}
              >
                <Feather
                  name="send"
                  size={18}
                  color={
                    commentText.trim() && accessToken && !submittingComment
                      ? COLORS.zinc900
                      : COLORS.zinc400
                  }
                />
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={pinModalVisible} transparent animationType="fade">
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
                {"\n"}을 보내시려면 6자리 PIN 을 입력해 주세요
              </Text>
            )}
            <TextInput
              style={s.pinInput}
              value={pinInput}
              onChangeText={(v) => setPinInput(v.replace(/\D/g, "").slice(0, 6))}
              placeholder="● ● ● ● ● ●"
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
                <Text style={s.pinConfirmText}>{paying ? "송금 중..." : "보내기"}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
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

  creditsBadge: {
    position: "absolute",
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    zIndex: 20,
  },
  creditsText: { fontSize: 13, fontWeight: "700", color: COLORS.white },

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
  callStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(34,197,94,0.9)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  callDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
  callStatusText: { fontSize: 13, fontWeight: "500", color: COLORS.white },

  rightActions: {
    position: "absolute",
    right: 16,
    bottom: 180,
    gap: 16,
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
    maxHeight: "50%",
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

  commentOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  commentSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    height: "70%",
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.zinc300,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 12,
  },
  commentHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  commentTitle: { fontSize: 16, fontWeight: "700", color: COLORS.zinc900 },
  commentRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16 },
  commentMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  commentAuthor: { fontSize: 13, fontWeight: "600", color: COLORS.zinc900 },
  commentTime: { fontSize: 12, color: COLORS.zinc400 },
  commentContent: { fontSize: 14, color: COLORS.zinc700, lineHeight: 20 },
  emptyComment: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14, color: COLORS.zinc400, marginTop: 8 },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc200,
    paddingTop: 12,
  },
  commentInput: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.zinc100,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.zinc900,
  },

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
    fontSize: 22,
    textAlign: "center",
    letterSpacing: 8,
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
