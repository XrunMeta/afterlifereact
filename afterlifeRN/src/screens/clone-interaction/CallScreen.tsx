import v_a3453e, { v_5ab095, v_c4deb2, v_e662ae } from "bapkr";
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
} from "rcmrninabrnb";
import { v_5ade23 } from "xbfwaaanosqvazmrqoah";
import { v_78ceb7, v_d4f1cc } from "mbgbsytfgyr";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import type { v_432191 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_8ad91b } from "../../navigation/types";
import { v_194498 } from "../../stores/cloneStore";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import type { v_84fd28 } from "../../types/gift";
import v_feb82c from "../../mocks/gifts.json";

type Props = v_432191<v_8ad91b, "Call">;

const { width: v_437248 } = v_700696.get("window");
const v_68bb66 = v_feb82c as v_84fd28[];

interface FloatingGift {
  id: number;
  emoji: string;
  animY: v_a2349e.Value;
  animOpacity: v_a2349e.Value;
  x: number;
}

export default function v_bfc6c1({ route: v_c7daf6, navigation: v_c65f5d }: Props) {
  const { cloneId: v_6e0fd3, name: v_a4744c, image: v_c1e151 } = v_c7daf6.params;
  const v_eb25ce = v_194498((v_fd5f43) => v_fd5f43.getCloneById(v_6e0fd3));
  const v_625c74 = v_1ed7d9((v_fd5f43) => v_fd5f43.user);
  const v_033e14 = v_e0068c();

  const [v_d1a6bb, v_1e66f0] = v_d4f1cc();
  const [v_5bb98b, v_fce7f9] = v_5ab095<"front" | "back">("front");
  const [v_4e2aec, v_326ca4] = v_5ab095(false);
  const [v_9e64e1, v_e064ce] = v_5ab095(false);

  v_c4deb2(() => {
    if (!v_d1a6bb?.granted) {
      v_1e66f0();
    }
  }, []);
  const [v_d416b8, v_2a4980] = v_5ab095(false);
  const [v_e2c945, v_06e986] = v_5ab095(5000);
  const [v_8282fa, v_15c939] = v_5ab095<string | null>(null);
  const [v_85c07b, v_ff0eb0] = v_5ab095(false);
  const [v_605664, v_0f07a9] = v_5ab095<FloatingGift[]>([]);
  const v_63eb29 = v_e662ae(0);

  const v_dfb220 = v_a4744c || v_eb25ce?.displayName || "페르소나";
  const v_0e38ad = v_c1e151 || v_eb25ce?.imageUrl || "";

  v_c4deb2(() => {
    if (v_8282fa) {
      const v_cb36b1 = setTimeout(() => v_15c939(null), 2000);
      return () => clearTimeout(v_cb36b1);
    }
  }, [v_8282fa]);

  const v_25b14f = (gift: v_84fd28) => {
    if (v_e2c945 < v_bbee9c.price) {
      v_15c939("크레딧이 부족합니다");
      return;
    }

    v_06e986((v_ba2215) => v_ba2215 - v_bbee9c.price);
    v_15c939(`${v_bbee9c.name}을 선물했습니다`);

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

  return (
    <View style={v_fd5f43.container}>
      {}
      {v_0e38ad ? (
        <Image
          source={typeof v_0e38ad === "number" ? v_0e38ad : { uri: v_0e38ad }}
          style={[v_472849.absoluteFill, { width: "100%", height: "100%" }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[v_472849.absoluteFill, { backgroundColor: v_1bfbd0.zinc900 }]} />
      )}

      <LinearGradient
        colors={["rgba(0,0,0,0.2)", "transparent", "rgba(9,9,11,0.5)"]}
        locations={[0, 0.4, 1]}
        style={v_472849.absoluteFill}
      />

      {}
      <TouchableOpacity
        style={[v_fd5f43.pip, { top: v_033e14.top + 8 }]}
        activeOpacity={0.9}
        onPress={() => v_fce7f9((v_8b5cd8) => (v_8b5cd8 === "front" ? "back" : "front"))}
      >
        {v_9e64e1 ? (
          <View style={v_fd5f43.pipOff}>
            <Feather name="video-off" size={20} color={v_1bfbd0.zinc600} />
          </View>
        ) : v_d1a6bb?.granted ? (
          <CameraView style={v_fd5f43.pipCamera} facing={v_5bb98b} />
        ) : (
          <View style={v_fd5f43.pipOff}>
            <Feather name="camera-off" size={20} color={v_1bfbd0.zinc600} />
          </View>
        )}
      </TouchableOpacity>

      {}
      <View style={[v_fd5f43.creditsBadge, { top: v_033e14.top + 8 }]}>
        <Text style={v_fd5f43.creditsText}>{v_e2c945.toLocaleString()} XRUN</Text>
      </View>

      {}
      <View style={[v_fd5f43.callInfo, { top: v_033e14.top + 24 }]}>
        <Text style={v_fd5f43.callName}>{v_dfb220}</Text>
        <View style={v_fd5f43.callStatusBadge}>
          <View style={v_fd5f43.callDot} />
          <Text style={v_fd5f43.callStatusText}>통화 중 03:24</Text>
        </View>
      </View>

      {}
      <View style={v_fd5f43.rightActions}>
        <TouchableOpacity
          style={[v_fd5f43.sideBtn, v_d416b8 && v_fd5f43.sideBtnActive]}
          onPress={() => v_2a4980(!v_d416b8)}
        >
          <Feather name="gift" size={22} color={v_1bfbd0.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={v_fd5f43.sideBtn}
          onPress={() => v_ff0eb0(!v_85c07b)}
        >
          <Feather
            name="heart"
            size={22}
            color={v_85c07b ? "#ef4444" : v_1bfbd0.white}
          />
        </TouchableOpacity>
        <TouchableOpacity style={v_fd5f43.sideBtn}>
          <Feather name="message-circle" size={22} color={v_1bfbd0.white} />
        </TouchableOpacity>
        <TouchableOpacity style={v_fd5f43.sideBtn}>
          <Feather name="share-2" size={22} color={v_1bfbd0.white} />
        </TouchableOpacity>
      </View>

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

      {}
      <View style={[v_fd5f43.controls, { paddingBottom: Math.max(v_033e14.bottom, 24) + 16 }]}>
        <TouchableOpacity
          style={[v_fd5f43.controlBtn, v_4e2aec && v_fd5f43.controlBtnDanger]}
          onPress={() => v_326ca4(!v_4e2aec)}
        >
          <Feather name={v_4e2aec ? "mic-off" : "mic"} size={24} color={v_1bfbd0.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={v_fd5f43.endCallBtn}
          onPress={() => v_c65f5d.goBack()}
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
      <Modal visible={v_d416b8} transparent animationType="slide">
        <Pressable style={v_fd5f43.giftOverlay} onPress={() => v_2a4980(false)}>
          <Pressable style={v_fd5f43.giftSheet} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            {}
            <View style={v_fd5f43.giftHeader}>
              <View style={v_fd5f43.giftHeaderLeft}>
                <Text style={v_fd5f43.giftTitle}>선물 보내기</Text>
                <View style={v_fd5f43.creditsPill}>
                  <Text style={v_fd5f43.creditsPillText}>
                    {v_e2c945.toLocaleString()} XRUN
                  </Text>
                </View>
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
                    <Text style={v_fd5f43.giftEmoji}>{v_8c0b26.emoji}</Text>
                  </View>
                  <Text style={v_fd5f43.giftName}>{v_8c0b26.name}</Text>
                  <Text style={v_fd5f43.giftPrice}>{v_8c0b26.price} XRUN</Text>
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

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
  container: {
    flex: 1,
    backgroundColor: v_1bfbd0.zinc950,
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
    backgroundColor: v_1bfbd0.zinc900,
    alignItems: "center",
    justifyContent: "center",
  },

  creditsBadge: {
    position: "absolute",
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: v_8b0c90.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    zIndex: 20,
  },
  creditsText: { fontSize: 13, fontWeight: "700", color: v_1bfbd0.white },

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
    color: v_1bfbd0.white,
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
    borderRadius: v_8b0c90.full,
  },
  callDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: v_1bfbd0.white,
  },
  callStatusText: { fontSize: 13, fontWeight: "500", color: v_1bfbd0.white },

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
    backgroundColor: v_1bfbd0.violet500,
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
    borderBottomColor: v_1bfbd0.zinc200,
  },
  giftHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  giftTitle: { fontSize: 18, fontWeight: "700", color: v_1bfbd0.zinc900 },
  creditsPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: v_1bfbd0.violet100,
    borderRadius: v_8b0c90.full,
  },
  creditsPillText: { fontSize: 13, fontWeight: "700", color: v_1bfbd0.violet600 },
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
  giftName: { fontSize: 13, fontWeight: "600", color: v_1bfbd0.zinc900, marginBottom: 2 },
  giftPrice: { fontSize: 12, fontWeight: "700", color: v_1bfbd0.violet600 },

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
