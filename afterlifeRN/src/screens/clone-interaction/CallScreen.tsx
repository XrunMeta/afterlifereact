import v_a3453e, { v_5ab095, v_c4deb2, v_e662ae, v_de06a3 } from "bapkr";
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
  v_5f4661,
  v_122070,
  v_79c4f2,
  v_03e392,
} from "rcmrninabrnb";
import { v_5ade23 } from "xbfwaaanosqvazmrqoah";
import { v_78ceb7, v_d4f1cc } from "mbgbsytfgyr";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_c18c22 } from "svuoaeceudfxfjvvpmmmchnwljywbphjgb";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_432191 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_8ad91b } from "../../navigation/types";
import { v_194498 } from "../../stores/cloneStore";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import type { v_84fd28 } from "../../types/gift";
import v_feb82c from "../../mocks/gifts.json";
import { v_5c99c1 } from "../../api/payments";
import {
  v_4208e7,
  v_3f8bc7,
  v_6f689a,
  v_0df337,
  type v_52af9d,
} from "../../api/clones";
import { v_bfd883 } from "../../lib/relativeTime";

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
  const { t: v_8d41d7 } = v_772971();
  const { cloneId: v_6e0fd3, name: v_a4744c, image: v_c1e151 } = v_c7daf6.params;
  const v_eb25ce = v_194498((v_fd5f43) => v_fd5f43.getCloneById(v_6e0fd3));
  const v_625c74 = v_1ed7d9((v_fd5f43) => v_fd5f43.user);
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_f5f393 = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser?.id ?? v_fd5f43.user?.id ?? null);
  const v_033e14 = v_e0068c();
  const v_f9771e = v_c18c22(0);
  const v_53dd92 =
    v_326be8.OS === "ios" ? v_033e14.bottom : Math.max(v_f9771e, v_033e14.bottom);

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

  const [v_e2c945, v_06e986] = v_5ab095<number>(0);
  const [v_8282fa, v_15c939] = v_5ab095<string | null>(null);
  const [v_85c07b, v_ff0eb0] = v_5ab095(false);
  const [v_605664, v_0f07a9] = v_5ab095<FloatingGift[]>([]);
  const v_63eb29 = v_e662ae(0);

  const [v_5a751a, v_6d75b1] = v_5ab095(0);
  v_c4deb2(() => {
    const v_389afb = setInterval(() => v_6d75b1((v_fd5f43) => v_fd5f43 + 1), 1000);
    return () => clearInterval(v_389afb);
  }, []);

  v_c4deb2(() => {
    console.log(
      `[Call] 진입 cloneId=${v_6e0fd3} name=${v_a4744c ?? "?"} 초기 isLiked=${v_85c07b}`,
    );

  }, []);
  const v_813acc = `${String(Math.floor(v_5a751a / 60)).padStart(2, "0")}:${String(v_5a751a % 60).padStart(2, "0")}`;

  const v_d3ded9 = v_de06a3(async () => {
    if (!v_2ca7e0) return;
    try {
      const v_cb35cb = await v_5c99c1(v_2ca7e0);
      if (v_cb35cb.linked && typeof v_cb35cb.xrun === "number") v_06e986(v_cb35cb.xrun);
    } catch (v_49263d) {
      console.warn("[Call] getXrunBalance failed:", v_49263d);
    }
  }, [v_2ca7e0]);
  v_c4deb2(() => {
    void v_d3ded9();
  }, [v_d3ded9]);

  const v_dfb220 = v_a4744c || v_eb25ce?.displayName || v_8d41d7("chat.personaFallback");
  const v_0e38ad = v_c1e151 || v_eb25ce?.imageUrl || "";

  const [v_62e1db, v_ca73f4] = v_5ab095(false);
  const [v_ecfc0f, v_04f2fc] = v_5ab095<v_52af9d[]>([]);
  const [v_465030, v_856daf] = v_5ab095(false);
  const [v_48e7fe, v_856f84] = v_5ab095("");
  const v_4c2809 = v_e662ae(false);
  const [v_b0af20, v_52390e] = v_5ab095(false);

  const [v_ed660d, v_b07dd3] = v_5ab095<number | null>(null);

  const v_cabe8e = v_de06a3(async () => {
    v_856daf(true);
    try {

      const v_8f00b9 = await fetch(
        `https://edge-alt-preview.example.invalid/oth-path${v_6e0fd3}/comments?limit=100`,
      );
      if (v_8f00b9.ok) {
        const v_9390e8 = (await v_8f00b9.json()) as { items: v_52af9d[] };
        v_04f2fc(v_9390e8.items);

        if (v_9390e8.items.length > 0) {

          const v_d4f03e = v_9390e8.items.find((v_3f4e2e) => v_3f4e2e.feedId);
          if (v_d4f03e && (v_d4f03e as any).feedId) {
            v_b07dd3((v_d4f03e as any).feedId);
          }
        }
      }
    } catch (v_49263d) {
      console.warn("[Call] loadComments failed:", v_49263d);
    } finally {
      v_856daf(false);
    }
  }, [v_6e0fd3]);

  v_c4deb2(() => {
    if (v_62e1db) void v_cabe8e();
  }, [v_62e1db, v_cabe8e]);

  const v_8e4668 = async () => {
    if (v_4c2809.current) return;
    const v_b43b74 = v_48e7fe.trim();
    if (!v_b43b74 || !v_2ca7e0) return;
    v_4c2809.current = true;
    v_52390e(true);
    try {
      let v_6bbace;
      if (v_ed660d == null) {

        const v_cb35cb = await v_6f689a(v_2ca7e0, v_6e0fd3, v_b43b74);
        v_6bbace = v_cb35cb.comment.feedId;
        v_b07dd3(v_6bbace);
      } else {
        await v_3f8bc7(v_2ca7e0, v_ed660d, v_b43b74);
        v_6bbace = v_ed660d;
      }
      v_856f84("");
      void v_cabe8e();
    } catch (v_49263d) {
      console.warn("[Call] submitComment failed:", v_49263d);
    } finally {
      v_4c2809.current = false;
      v_52390e(false);
    }
  };

  const v_2d4fef = (v_d91518, v_c09aa8) => {
    if (!v_2ca7e0) return;
    v_03e392.alert("댓글 삭제", "이 댓글을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await v_0df337(v_2ca7e0, v_c09aa8, v_d91518);
            v_04f2fc((v_ba2215) => v_ba2215.filter((v_3f4e2e) => v_3f4e2e.id !== v_d91518));
          } catch (v_49263d) {
            console.warn("[Call] delete comment failed:", v_49263d);
          }
        },
      },
    ]);
  };

  const v_22cd2d = async () => {
    try {
      await v_5f4661.share({
        message: `${v_dfb220} 와 통화해보세요!\nhttps://afterlife.run/oth-path${v_6e0fd3}`,
        title: v_dfb220,
      });
    } catch (v_49263d) {
      console.warn("[Call] share failed:", v_49263d);
    }
  };

  v_c4deb2(() => {
    if (v_8282fa) {
      const v_cb36b1 = setTimeout(() => v_15c939(null), 2000);
      return () => clearTimeout(v_cb36b1);
    }
  }, [v_8282fa]);

  const v_25b14f = (gift: v_84fd28) => {
    if (v_e2c945 < v_bbee9c.price) {
      v_15c939(v_8d41d7("call.noCredits"));
      return;
    }

    v_06e986((v_ba2215) => v_ba2215 - v_bbee9c.price);
    v_15c939(v_8d41d7("call.giftSent", { name: v_bbee9c.name }));

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
          <Text style={v_fd5f43.callStatusText}>{v_8d41d7("call.inCall", { time: v_813acc })}</Text>
        </View>
      </View>

      {}
      <View style={[v_fd5f43.rightActions, { bottom: 180 + v_53dd92 }]}>
        <TouchableOpacity
          style={[v_fd5f43.sideBtn, v_d416b8 && v_fd5f43.sideBtnActive]}
          onPress={() => v_2a4980(!v_d416b8)}
        >
          <Feather name="gift" size={22} color={v_1bfbd0.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[v_fd5f43.sideBtn, v_85c07b && v_fd5f43.sideBtnLiked]}
          onPress={() => {
            const v_a448ad = !v_85c07b;
            console.log(
              `[Call] 좋아요 클릭 cloneId=${v_6e0fd3} ${v_85c07b ? "true" : "false"} → ${v_a448ad ? "true" : "false"}`,
            );
            v_ff0eb0(v_a448ad);
          }}
        >
          <Feather
            name="heart"
            size={22}
            color={v_1bfbd0.white}
          />
        </TouchableOpacity>
        <TouchableOpacity style={v_fd5f43.sideBtn} onPress={() => v_ca73f4(true)}>
          <Feather name="message-circle" size={22} color={v_1bfbd0.white} />
        </TouchableOpacity>
        <TouchableOpacity style={v_fd5f43.sideBtn} onPress={v_22cd2d}>
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
      <View style={[v_fd5f43.controls, { paddingBottom: v_53dd92 + 24 }]}>
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
      <Modal
        visible={v_d416b8}
        transparent
        animationType="slide"
        onShow={() => void v_d3ded9()}
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
      <Modal visible={v_62e1db} transparent animationType="slide">
        <Pressable style={v_fd5f43.commentOverlay} onPress={() => v_ca73f4(false)}>
          <Pressable
            style={[v_fd5f43.commentSheet, { paddingBottom: 12 + v_53dd92 }]}
            onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}
          >
            <View style={v_fd5f43.sheetHandle} />
            <View style={v_fd5f43.commentHeaderRow}>
              <Text style={v_fd5f43.commentTitle}>
                {v_8d41d7("feed.commentCount", { n: v_ecfc0f.length })}
              </Text>
              <TouchableOpacity onPress={() => v_ca73f4(false)}>
                <Feather name="x" size={20} color={v_1bfbd0.zinc600} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {v_465030 ? (
                <View style={v_fd5f43.emptyComment}>
                  <Feather name="loader" size={28} color={v_1bfbd0.zinc300} />
                </View>
              ) : v_ecfc0f.length > 0 ? (
                v_ecfc0f.map((v_3f4e2e) => (
                  <View key={v_3f4e2e.id} style={v_fd5f43.commentRow}>
                    {v_3f4e2e.user?.avatarUrl ? (
                      <Image source={{ uri: v_3f4e2e.user.avatarUrl }} style={v_fd5f43.commentAvatar} />
                    ) : (
                      <View style={[v_fd5f43.commentAvatar, { backgroundColor: v_1bfbd0.zinc200 }]} />
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={v_fd5f43.commentMeta}>
                        <Text style={v_fd5f43.commentAuthor}>
                          {v_3f4e2e.user?.name ?? v_3f4e2e.user?.email}
                        </Text>
                        <Text style={v_fd5f43.commentTime}>{v_bfd883(v_3f4e2e.createdAt)}</Text>
                        {v_3f4e2e.userId === v_f5f393 && v_3f4e2e.feedId && (
                          <TouchableOpacity
                            onPress={() => v_2d4fef(v_3f4e2e.id, v_3f4e2e.feedId)}
                            style={{ marginLeft: 8 }}
                          >
                            <Feather name="trash-2" size={14} color={v_1bfbd0.zinc400} />
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={v_fd5f43.commentContent}>{v_3f4e2e.content}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={v_fd5f43.emptyComment}>
                  <Feather name="message-circle" size={40} color={v_1bfbd0.zinc300} />
                  <Text style={v_fd5f43.emptyText}>{v_8d41d7("feed.commentsEmpty")}</Text>
                </View>
              )}
            </ScrollView>
            <View style={v_fd5f43.commentInputRow}>
              <TextInput
                style={v_fd5f43.commentInput}
                value={v_48e7fe}
                onChangeText={v_856f84}
                placeholder={v_8d41d7("feed.commentPlaceholder")}
                placeholderTextColor={v_1bfbd0.placeholder}
              />
              <TouchableOpacity
                disabled={!v_48e7fe.trim() || !v_2ca7e0 || v_b0af20}
                onPress={v_8e4668}
              >
                <Feather
                  name="send"
                  size={18}
                  color={
                    v_48e7fe.trim() && v_2ca7e0 && !v_b0af20
                      ? v_1bfbd0.zinc900
                      : v_1bfbd0.zinc400
                  }
                />
              </TouchableOpacity>
            </View>
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
  sideBtnLiked: {
    backgroundColor: "#ef4444",
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

  commentOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  commentSheet: {
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    height: "70%",
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: v_1bfbd0.zinc300,
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
  commentTitle: { fontSize: 16, fontWeight: "700", color: v_1bfbd0.zinc900 },
  commentRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16 },
  commentMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  commentAuthor: { fontSize: 13, fontWeight: "600", color: v_1bfbd0.zinc900 },
  commentTime: { fontSize: 12, color: v_1bfbd0.zinc400 },
  commentContent: { fontSize: 14, color: v_1bfbd0.zinc700, lineHeight: 20 },
  emptyComment: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14, color: v_1bfbd0.zinc400, marginTop: 8 },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: v_1bfbd0.zinc200,
    paddingTop: 12,
  },
  commentInput: {
    flex: 1,
    height: 40,
    backgroundColor: v_1bfbd0.zinc100,
    borderRadius: v_8b0c90.full,
    paddingHorizontal: 16,
    fontSize: 14,
    color: v_1bfbd0.zinc900,
  },
});
