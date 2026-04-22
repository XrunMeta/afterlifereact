import React, { useState, useEffect, useRef } from "react";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { useCloneStore } from "../../stores/cloneStore";
import { useAuthStore } from "../../stores/authStore";
import { COLORS, RADIUS } from "../../components/constants";
import type { Gift } from "../../types/gift";
import giftsData from "../../mocks/gifts.json";

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
  const { cloneId, name: paramName, image: paramImage } = route.params;
  const clone = useCloneStore((s) => s.getCloneById(cloneId));
  const user = useAuthStore((s) => s.user);
  const insets = useSafeAreaInsets();

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
  const [credits, setCredits] = useState(5000);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [floatingGifts, setFloatingGifts] = useState<FloatingGift[]>([]);
  const giftCounterRef = useRef(0);

  const personaName = paramName || clone?.displayName || "페르소나";
  const personaImage = paramImage || clone?.imageUrl || "";

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleGiftSend = (gift: Gift) => {
    if (credits < gift.price) {
      setToastMessage("크레딧이 부족합니다");
      return;
    }

    setCredits((prev) => prev - gift.price);
    setToastMessage(`${gift.name}을 선물했습니다`);

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
          <Text style={s.callStatusText}>통화 중 03:24</Text>
        </View>
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
          onPress={() => setIsLiked(!isLiked)}
        >
          <Feather
            name="heart"
            size={22}
            color={isLiked ? "#ef4444" : COLORS.white}
          />
        </TouchableOpacity>
        <TouchableOpacity style={s.sideBtn}>
          <Feather name="message-circle" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity style={s.sideBtn}>
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
      <View style={[s.controls, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}>
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
      <Modal visible={showGifts} transparent animationType="slide">
        <Pressable style={s.giftOverlay} onPress={() => setShowGifts(false)}>
          <Pressable style={s.giftSheet} onPress={(e) => e.stopPropagation()}>
            {}
            <View style={s.giftHeader}>
              <View style={s.giftHeaderLeft}>
                <Text style={s.giftTitle}>선물 보내기</Text>
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
});
