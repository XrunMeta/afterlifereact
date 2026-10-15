

import v_a3453e, { v_5ab095, v_e662ae, v_c4deb2, v_df9f57 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_122070,
  v_79c4f2,
  v_cf9c33,
  v_aa7413,
  v_09d0e5,
  v_326be8,
  v_0e1f26,
  type v_5b67a3,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_c18c22 } from "svuoaeceudfxfjvvpmmmchnwljywbphjgb";
import type { v_432191 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_8ad91b } from "../../navigation/types";
import { v_194498 } from "../../stores/cloneStore";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_b4902e } from "../../stores/followStore";
import { v_84d546 } from "../../lib/callGuard";
import v_8e7ad4 from "../../components/ui/SwipeDownSheet";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import {
  v_8a85e2,
  v_22ca9b,
  v_40068b,
  v_dd96e7,
  v_3ce9ef,
  v_9adabd,
  v_1c758d,
  v_9cb700,
  type v_29686e,
  type v_f19942,
  type v_18a302,
  type v_109480,
} from "../../api/chat";

type ActionItem = {
  label: string;
  onPress?: () => void;
  destructive?: boolean;
  disabled?: boolean;
};

type MissedCallGroup = {
  kind: "missed-group";
  count: number;
  latestAt: number;
  oldestAt: number;
  firstId: string;
};
type DisplayItem = v_29686e | MissedCallGroup;

const v_c8c890 = (v_23805a): v_23805a is MissedCallGroup =>
  (v_23805a as MissedCallGroup).kind === "missed-group";

type Props = v_432191<v_8ad91b, "Chat">;

export default function v_02d653({ route: v_c7daf6, navigation: v_c65f5d }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const { cloneId: v_6e0fd3, name: v_a4744c, image: v_c1e151 } = v_c7daf6.params;
  const v_eb25ce = v_194498((v_fd5f43) => v_fd5f43.getCloneById(v_6e0fd3));
  const v_033e14 = v_e0068c();
  const v_5ca6b8 = v_e662ae<v_122070>(null);

  const v_dfb220 = v_a4744c ?? v_eb25ce?.displayName ?? "페르소나";
  const v_e7274c =
    (typeof v_c1e151 === "string" && v_c1e151) || v_eb25ce?.imageUrl || null;

  const [v_bbda62, v_c31db7] = v_5ab095("");
  const [v_7e4acc, v_de86c2] = v_5ab095(0);

  const [v_842b8b, v_0f6477] = v_5ab095(true);
  const [v_f61bef, v_ceec45] = v_5ab095(false);

  const [v_fd08c6, v_2c320e] = v_5ab095<{ title?: string; actions: ActionItem[] } | null>(null);
  const v_cafc04 = (v_9f1622, v_dd943a) =>
    v_2c320e({ title: v_9f1622, actions: v_dd943a });
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_f4fb5e = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser?.email ?? null);

  const v_e721a8 = v_8a85e2(v_f4fb5e);
  const [v_2810d7, v_7f73ef] = v_5ab095<v_29686e[] | null>(null);
  const [v_a981b7, v_94405c] = v_5ab095<string | null>(null);
  const [v_dec728, v_a7c3b5] = v_5ab095(false);
  const [v_c5607b, v_1e756c] = v_5ab095<string | null>(null);
  const [v_5e23ec, v_10837f] = v_5ab095(false);

  const [v_db205d, v_fb20c7] = v_5ab095<{
    callId: string;
    turns: v_109480[];
    cursor: string | null;
    loading: boolean;
  } | null>(null);

  const v_907715 = v_df9f57<DisplayItem[]>(() => {
    if (!v_2810d7) return [];
    const v_8d4337 = [];
    let buffer: v_18a302[] = [];
    const v_b6e358 = () => {
      if (v_062bb0.length === 0) return;
      if (v_062bb0.length === 1) {
        v_8d4337.push(v_062bb0[0]!);
      } else {

        const v_1300ee = v_062bb0[0]!;
        const v_5ddec1 = v_062bb0[v_062bb0.length - 1]!;
        v_8d4337.push({
          kind: "missed-group",
          count: v_062bb0.length,
          latestAt: v_1300ee.startedAt,
          oldestAt: v_5ddec1.startedAt,
          firstId: v_5ddec1.callId,
        });
      }
      v_062bb0 = [];
    };
    for (const v_23805a of v_2810d7) {
      if (v_23805a.type === "call" && v_23805a.turnCount === 0) {
        v_062bb0.push(v_23805a);
      } else {
        v_b6e358();
        v_8d4337.push(v_23805a);
      }
    }
    v_b6e358();
    return v_8d4337.reverse(); 
  }, [v_2810d7]);

  v_c4deb2(() => {
    if (!v_e721a8 || !v_2ca7e0) return;
    let v_2008a4 = false;
    v_a7c3b5(true);
    (async () => {
      const v_8f00b9 = await v_22ca9b(v_6e0fd3, v_2ca7e0, { limit: 30 });
      if (v_2008a4) return;
      v_a7c3b5(false);
      if (v_8f00b9) {
        v_7f73ef(v_8f00b9.items);
        v_94405c(v_8f00b9.nextCursor);
      }
    })();
    return () => {
      v_2008a4 = true;
    };
  }, [v_e721a8, v_2ca7e0, v_6e0fd3]);

  v_c4deb2(() => {
    if (!v_2ca7e0) return;
    let v_2008a4 = false;
    (async () => {
      const v_9c58a3 = await v_3ce9ef(v_6e0fd3, v_2ca7e0);
      if (!v_2008a4) v_0f6477(!v_9c58a3);
    })();
    return () => {
      v_2008a4 = true;
    };
  }, [v_2ca7e0, v_6e0fd3]);

  v_c4deb2(() => {
    if (!v_2ca7e0) return;
    void v_9cb700(v_6e0fd3, v_2ca7e0);
  }, [v_2ca7e0, v_6e0fd3]);

  const v_00fc5a = (msg: v_f19942) => {
    v_cafc04("메시지 삭제", [
      {
        label: "삭제",
        destructive: true,
        onPress: async () => {
          if (!v_2ca7e0) return;

          v_7f73ef((v_ba2215) =>
            v_ba2215 ? v_ba2215.filter((v_23805a) => !(v_23805a.type === "chat" && v_23805a.id === v_badeaf.id)) : v_ba2215,
          );
          try {
            await v_1c758d(v_badeaf.id, v_2ca7e0);
          } catch (v_49263d) {
            console.warn("[Chat] delete failed:", (v_49263d as Error)?.message ?? v_49263d);

            const v_8f00b9 = await v_22ca9b(v_6e0fd3, v_2ca7e0, { limit: 30 });
            if (v_8f00b9) {
              v_7f73ef(v_8f00b9.items);
              v_94405c(v_8f00b9.nextCursor);
            }
          }
        },
      },
    ]);
  };

  const v_747b23 = async () => {
    if (!v_e721a8 || !v_2ca7e0 || !v_a981b7 || v_dec728) return;
    v_a7c3b5(true);
    const v_8f00b9 = await v_22ca9b(v_6e0fd3, v_2ca7e0, {
      limit: 30,
      cursor: v_a981b7,
    });
    v_a7c3b5(false);
    if (!v_8f00b9) return;
    v_7f73ef((v_ba2215) => [...(v_ba2215 ?? []), ...v_8f00b9.items]);
    v_94405c(v_8f00b9.nextCursor);
  };

  const v_bbd0f3 = async (v_be62d3) => {
    if (!v_e721a8 || !v_2ca7e0) return;
    v_fb20c7({ callId: v_be62d3, turns: [], cursor: null, loading: true });
    const v_8f00b9 = await v_40068b(v_6e0fd3, v_be62d3, v_2ca7e0, { limit: 50 });
    v_fb20c7({
      callId: v_be62d3,
      turns: v_8f00b9?.turns ?? [],
      cursor: v_8f00b9?.nextCursor ?? null,
      loading: false,
    });
  };

  const v_6deb64 = async () => {
    if (!v_db205d || !v_2ca7e0 || !v_db205d.cursor || v_db205d.loading) return;
    v_fb20c7((v_ba2215) => (v_ba2215 ? { ...v_ba2215, loading: true } : v_ba2215));
    const v_8f00b9 = await v_40068b(v_6e0fd3, v_db205d.callId, v_2ca7e0, {
      limit: 50,
      cursor: v_db205d.cursor,
    });
    v_fb20c7((v_ba2215) =>
      v_ba2215
        ? {
            ...v_ba2215,

            turns: [...(v_8f00b9?.turns ?? []), ...v_ba2215.turns],
            cursor: v_8f00b9?.nextCursor ?? null,
            loading: false,
          }
        : v_ba2215,
    );
  };

  v_c4deb2(() => {
    const v_399925 = v_326be8.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const v_206f77 = v_326be8.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const v_53f5d7 = v_0e1f26.addListener(v_399925, (e: v_5b67a3) => {
      v_de86c2(v_9e86fd.endCoordinates?.height ?? 0);

      setTimeout(() => v_5ca6b8.current?.scrollToEnd({ animated: true }), 50);
    });
    const v_52528b = v_0e1f26.addListener(v_206f77, () => v_de86c2(0));
    return () => {
      v_53f5d7.remove();
      v_52528b.remove();
    };
  }, []);

  const v_465869 = async () => {
    const v_2f361a = v_bbda62.trim();
    if (!v_2f361a || v_5e23ec) return;

    if (!v_e721a8 || !v_2ca7e0) {
      console.log("[Chat] send (placeholder):", v_2f361a);
      v_c31db7("");
      v_0e1f26.dismiss();
      return;
    }

    const v_2413d4 = -Date.now(); 
    const v_5c2f9f = Date.now();
    const optimisticUser: v_f19942 = {
      type: "chat",
      id: v_2413d4,
      role: "user",
      content: v_2f361a,
      at: v_5c2f9f,
      sessionId: v_c5607b ?? "pending",
    };

    v_7f73ef((v_ba2215) => [v_fa1cce, ...(v_ba2215 ?? [])]);
    v_10837f(true);
    v_c31db7("");
    v_0e1f26.dismiss();
    try {
      const v_8f00b9 = await v_dd96e7(v_6e0fd3, v_2f361a, v_2ca7e0, {
        sessionId: v_c5607b ?? undefined,
      });
      if (!v_c5607b) v_1e756c(v_8f00b9.sessionId);
      const realUser: v_f19942 = {
        type: "chat",
        id: v_8f00b9.userMessage.id,
        role: "user",
        content: v_8f00b9.userMessage.content,
        at: v_5c2f9f,
        sessionId: v_8f00b9.sessionId,
      };
      const cloneItem: v_f19942 = {
        type: "chat",
        id: v_8f00b9.cloneReply.id,
        role: "clone",
        content: v_8f00b9.cloneReply.content,
        at: v_5c2f9f + 1,
        sessionId: v_8f00b9.sessionId,
      };

      v_7f73ef((v_ba2215) => {
        const v_694b25 = (v_ba2215 ?? []).filter((v_23805a) =>
          !(v_23805a.type === "chat" && v_23805a.id === v_2413d4),
        );
        return [v_e44122, v_8338f4, ...v_694b25];
      });
    } catch (v_49263d) {
      console.warn("[Chat] send failed:", (v_49263d as Error)?.message ?? v_49263d);

      v_7f73ef((v_ba2215) =>
        v_ba2215 ? v_ba2215.filter((v_23805a) => !(v_23805a.type === "chat" && v_23805a.id === v_2413d4)) : v_ba2215,
      );
      v_c31db7(v_2f361a);
    } finally {
      v_10837f(false);
    }
  };

  const v_21be1f = async () => {
    const v_3ed4c3 = await v_84d546(v_2ca7e0, () => {});
    if (!v_3ed4c3) return;
    v_c65f5d.navigate("Call", {
      cloneId: v_6e0fd3,
      name: v_dfb220,
      image: v_e7274c ?? undefined,
    });
  };

  const v_4f52b6 = async () => {
    if (!v_2ca7e0 || v_f61bef) return;
    const v_5a6226 = !v_842b8b;
    v_0f6477(v_5a6226);
    v_ceec45(true);
    try {

      await v_9adabd(v_6e0fd3, v_2ca7e0, !v_5a6226);
    } catch (v_49263d) {
      console.warn("[Chat] mute toggle failed:", (v_49263d as Error)?.message ?? v_49263d);
      v_0f6477(!v_5a6226); 
    } finally {
      v_ceec45(false);
    }
  };

  const v_98409d = () => {
    const v_f1620a = v_1ed7d9.getState().apiUser?.id ?? null;
    const v_e009da = v_eb25ce?.ownerId != null && v_f1620a != null && v_eb25ce.ownerId === v_f1620a;
    const v_dd943a = [
      {
        label: "통화",
        onPress: () => void v_21be1f(),
      },
      {
        label: v_842b8b ? "알림 끄기" : "알림 켜기",
        disabled: v_f61bef,
        onPress: () => void v_4f52b6(),
      },
    ];
    if (!v_e009da) {
      v_dd943a.push({
        label: "구독 취소",
        destructive: true,
        onPress: () => {

          const v_b30b81 = v_b4902e.getState().isFollowing(v_6e0fd3);
          if (v_b30b81) {
            void v_b4902e.getState().toggleFollow(v_6e0fd3);
          }
          v_c65f5d.goBack();
        },
      });
    }
    v_cafc04(v_dfb220, v_dd943a);
  };

  const v_c2e43c = () => {
    v_c65f5d.navigate("CloneFeed", { cloneId: v_6e0fd3 });
  };

  const v_53dd92 = v_7e4acc > 0 ? 10 : v_033e14.bottom;

  const v_f9771e = v_c18c22(0);
  const v_ad9bbd = v_326be8.OS === "android" ? 56 : 0;
  const v_2b650d = Math.max(v_033e14.bottom, v_f9771e, v_ad9bbd);

  return (

    <View style={[v_d81136.root, { paddingTop: v_033e14.top }]}>
      {}
      <View style={v_d81136.header}>
        <TouchableOpacity
          style={v_d81136.headerIcon}
          onPress={() => v_c65f5d.goBack()}
          hitSlop={8}
          accessibilityLabel="back"
        >
          <Feather name="chevron-left" size={26} color={v_1bfbd0.zinc900} />
        </TouchableOpacity>
        <TouchableOpacity
          style={v_d81136.headerProfileWrap}
          onPress={v_c2e43c}
          activeOpacity={0.7}
        >
          {v_e7274c ? (
            <Image source={{ uri: v_e7274c }} style={v_d81136.headerAvatar} />
          ) : (
            <View style={[v_d81136.headerAvatar, v_d81136.headerAvatarFallback]}>
              <Text style={v_d81136.headerAvatarInitial}>
                {v_dfb220.charAt(0) || "?"}
              </Text>
            </View>
          )}
          <Text style={v_d81136.headerName} numberOfLines={1}>
            {v_dfb220}
          </Text>
        </TouchableOpacity>
        <View style={v_d81136.headerRight}>
          {

}
          <TouchableOpacity
            style={v_d81136.headerActionBtn}
            hitSlop={8}
            onPress={v_98409d}
            accessibilityLabel="settings"
          >
            <Feather name="settings" size={18} color={v_1bfbd0.zinc700} />
          </TouchableOpacity>
        </View>
      </View>

      {}
      <View style={v_d81136.promoBanner}>
        <View style={v_d81136.promoIcon}>
          <Feather name="message-circle" size={16} color={v_1bfbd0.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={v_d81136.promoTitle} numberOfLines={1}>
            Pangle 배너 광고
          </Text>
        </View>
      </View>

      {
}
      <ScrollView
        ref={v_5ca6b8}
        style={v_d81136.scrollArea}
        contentContainerStyle={v_d81136.scrollContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {

          if (v_e721a8) v_5ca6b8.current?.scrollToEnd({ animated: false });
        }}
        onScroll={({ nativeEvent: v_76b943 }) => {
          if (!v_e721a8) return;
          const { contentOffset: v_e29918 } = v_76b943;
          if (v_e29918.y <= 80) void v_747b23();
        }}
        scrollEventThrottle={200}
      >
        {

}
        {v_e721a8 && v_2810d7 !== null && (
          <>
            {v_dec728 && (
              <Text style={v_d81136.loadingText}>{v_8d41d7("chat.loadingPrev")}</Text>
            )}
            {v_907715.map((v_23805a, v_e86ad8) => {

              const v_ba2215 = v_e86ad8 > 0 ? v_907715[v_e86ad8 - 1] : null;
              const v_db51a9 = v_65604f(v_23805a);
              const v_57e6ee = !v_ba2215 || !v_2f64a9(v_65604f(v_ba2215), v_db51a9);
              const v_6583df = v_57e6ee ? (
                <View key={`date-${v_db51a9}`} style={v_d81136.dateDividerWrap}>
                  <Text style={v_d81136.dateDividerText}>{v_873982(v_db51a9)}</Text>
                </View>
              ) : null;
              if (v_c8c890(v_23805a)) {
                return (
                  <React.Fragment key={`missed-group-${v_23805a.firstId}`}>
                    {v_6583df}
                    <View style={v_d81136.callBlock}>
                      <View style={v_d81136.callHeader}>
                        <View style={v_d81136.callIconWrap}>
                          <Feather name="phone-missed" size={14} color={v_1bfbd0.white} />
                        </View>
                        <Text style={v_d81136.callDurationText}>
                          부재중 통화 {v_23805a.count}건 · {v_c1c940(v_23805a.latestAt)}
                        </Text>
                      </View>
                    </View>
                  </React.Fragment>
                );
              }
              if (v_23805a.type === "chat") {
                return (
                  <React.Fragment key={`api-chat-${v_23805a.id}`}>
                    {v_6583df}
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onLongPress={() => v_00fc5a(v_23805a)}
                      delayLongPress={350}
                      style={v_23805a.role === "user" ? v_d81136.userBubble : v_d81136.personaOutsideBubble}
                    >
                      <Text
                        style={
                          v_23805a.role === "user"
                            ? v_d81136.userBubbleText
                            : v_d81136.personaOutsideBubbleText
                        }
                      >
                        {v_23805a.content}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                );
              }

              return (
                <React.Fragment key={`api-call-${v_23805a.callId}`}>
                  {v_6583df}
                  <View style={v_d81136.callBlock}>
                    <View style={v_d81136.callHeader}>
                      <View style={v_d81136.callIconWrap}>
                        <Feather
                          name={v_23805a.turnCount > 0 ? "phone" : "phone-missed"}
                          size={14}
                          color={v_1bfbd0.white}
                        />
                      </View>
                      <Text style={v_d81136.callDurationText}>
                        {v_f5aeb2(v_23805a)}
                      </Text>
                    </View>
                    {v_23805a.turnCount > 0 ? (
                      <TouchableOpacity
                        style={v_d81136.transcriptBtn}
                        hitSlop={6}
                        onPress={() => v_bbd0f3(v_23805a.callId)}
                      >
                        <Text style={v_d81136.transcriptBtnText}>{v_8d41d7("chat.callTranscriptBtn")}</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={v_d81136.callEmptyText}>{v_8d41d7("chat.missedCall")}</Text>
                    )}
                  </View>
                </React.Fragment>
              );
            })}
            {v_5e23ec && (
              <View style={[v_d81136.personaOutsideBubble, v_d81136.typingBubble]}>
                <Text style={v_d81136.typingText}>…</Text>
              </View>
            )}
          </>
        )}

        {

}
        {!v_e721a8 && (
          <View style={v_d81136.emptyWrap}>
            <Text style={v_d81136.emptyText}>{v_8d41d7("chat.emptyConversation")}</Text>
          </View>
        )}
        {v_e721a8 && v_2810d7 !== null && v_2810d7.length === 0 && !v_dec728 && (
          <View style={v_d81136.emptyWrap}>
            <Text style={v_d81136.emptyText}>{v_8d41d7("chat.emptyConversation")}</Text>
          </View>
        )}
      </ScrollView>

      {

}
      <View style={[v_d81136.inputBar, { paddingBottom: v_53dd92 || 10, transform: [{ translateY: -v_7e4acc }] }]}>
        <TextInput
          style={v_d81136.inputField}
          value={v_bbda62}
          onChangeText={v_c31db7}
          placeholder={`${v_dfb220}(으)로 채팅 중`}
          placeholderTextColor={v_1bfbd0.zinc400}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={v_465869}
          blurOnSubmit

          onFocus={() => {
            setTimeout(() => v_5ca6b8.current?.scrollToEnd({ animated: true }), 100);
          }}
        />
        <TouchableOpacity
          style={[v_d81136.sendBtn, !v_bbda62.trim() && v_d81136.sendBtnDisabled]}
          onPress={v_465869}
          disabled={!v_bbda62.trim()}
        >
          <Feather name="send" size={18} color={v_1bfbd0.white} />
        </TouchableOpacity>
      </View>

      {

}
      <Modal
        visible={!!v_fd08c6}
        transparent
        animationType="fade"
        onRequestClose={() => v_2c320e(null)}
      >
        <Pressable style={v_d81136.sheetOverlay} onPress={() => v_2c320e(null)}>
          <Pressable
            style={[v_d81136.actionSheet, { paddingBottom: 24 + v_2b650d }]}
            onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}
          >
            <View style={v_d81136.sheetHandle} />
            {v_fd08c6?.title ? <Text style={v_d81136.sheetTitle}>{v_fd08c6.title}</Text> : null}
            {v_fd08c6?.actions.map((v_779914, v_ebec57) => (
              <TouchableOpacity
                key={`${v_779914.label}-${v_ebec57}`}
                style={v_d81136.sheetAction}
                disabled={v_779914.disabled}
                activeOpacity={0.7}
                onPress={() => {
                  v_2c320e(null);
                  v_779914.onPress?.();
                }}
              >
                <Text
                  style={[
                    v_d81136.sheetActionText,
                    v_779914.destructive && v_d81136.sheetActionDestructive,
                    v_779914.disabled && { opacity: 0.4 },
                  ]}
                >
                  {v_779914.label}
                </Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal
        visible={!!v_db205d}
        transparent
        animationType="slide"
        onRequestClose={() => v_fb20c7(null)}
      >
        <Pressable style={v_d81136.sheetOverlay} onPress={() => v_fb20c7(null)}>
          <Pressable
            style={[v_d81136.actionSheet, v_d81136.turnsSheet, { paddingBottom: v_2b650d }]}
            onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}
          >
            <View style={v_d81136.sheetHandle} />
            <Text style={v_d81136.sheetTitle}>{v_8d41d7("chat.callTranscriptTitle")}</Text>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 20 }}
              onScroll={({ nativeEvent: v_76b943 }) => {
                if (v_76b943.contentOffset.y <= 20) void v_6deb64();
              }}
              scrollEventThrottle={200}
            >
              {v_db205d?.loading && v_db205d.turns.length === 0 && (
                <Text style={v_d81136.loadingText}>{v_8d41d7("chat.loadingGeneric")}</Text>
              )}
              {v_db205d?.turns.map((v_8d41d7) => (
                <View
                  key={`turn-${v_db205d.callId}-${v_8d41d7.seq}`}
                  style={v_8d41d7.role === "user" ? v_d81136.turnUserRow : v_d81136.turnPersonaRow}
                >
                  <View
                    style={
                      v_8d41d7.role === "user"
                        ? [v_d81136.userBubble, { width: "80%" }]
                        : [v_d81136.personaOutsideBubble, { width: "80%" }]
                    }
                  >
                    <Text
                      style={
                        v_8d41d7.role === "user"
                          ? v_d81136.userBubbleText
                          : v_d81136.personaOutsideBubbleText
                      }
                    >
                      {v_8d41d7.text}
                    </Text>
                  </View>
                </View>
              ))}
              {v_db205d?.loading && v_db205d.turns.length > 0 && (
                <Text style={v_d81136.loadingText}>{v_8d41d7("chat.loadingPrevUtterances")}</Text>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function v_c1c940(v_d799e2): string {
  const v_d5dda0 = new Date(v_d799e2);
  return `${v_d5dda0.getMonth() + 1}월 ${v_d5dda0.getDate()}일`;
}

function v_f5aeb2(it: v_18a302): string {
  const v_d5dda0 = new Date(v_23805a.startedAt);
  const v_df8a54 = `${v_d5dda0.getHours().toString().padStart(2, "0")}:${v_d5dda0
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
  if (v_23805a.durationSec && v_23805a.durationSec > 0) {
    const v_b3dc28 = Math.floor(v_23805a.durationSec);
    const v_35f85c = Math.floor(v_b3dc28 / 60);
    const v_fd5f43 = v_b3dc28 % 60;
    const v_7dc4bb = v_35f85c > 0 ? `${v_35f85c}분 ${v_fd5f43}초` : `${v_fd5f43}초`;
    return `음성 통화 · ${v_7dc4bb} · ${v_df8a54}`;
  }
  return `음성 통화 · ${v_df8a54}`;
}

const v_c3f248 = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
function v_873982(v_d799e2): string {
  const v_d5dda0 = new Date(v_d799e2);
  return `${v_d5dda0.getFullYear()}년 ${v_d5dda0.getMonth() + 1}월 ${v_d5dda0.getDate()}일 ${v_c3f248[v_d5dda0.getDay()]}`;
}

function v_65604f(v_23805a): number {
  if (v_c8c890(v_23805a)) return v_23805a.oldestAt;
  if (v_23805a.type === "chat") return v_23805a.at;
  return v_23805a.startedAt;
}

function v_2f64a9(v_779914, v_148ff6): boolean {
  const v_0a0f75 = new Date(v_779914);
  const v_a1651b = new Date(v_148ff6);
  return (
    v_0a0f75.getFullYear() === v_a1651b.getFullYear() &&
    v_0a0f75.getMonth() === v_a1651b.getMonth() &&
    v_0a0f75.getDate() === v_a1651b.getDate()
  );
}

const v_d81136 = v_472849.create({
  root: { flex: 1, backgroundColor: v_1bfbd0.violet100 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerIcon: { padding: 4 },

  headerProfileWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: v_1bfbd0.zinc200,
  },
  headerAvatarFallback: {
    backgroundColor: v_1bfbd0.violet200, alignItems: "center", justifyContent: "center",
  },
  headerAvatarInitial: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.violet700 },
  headerName: { flex: 1, fontSize: 16, fontWeight: "700", color: v_1bfbd0.zinc900 },
  headerRight: { flexDirection: "row", gap: 6 },
  headerActionBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: v_1bfbd0.white,
    alignItems: "center", justifyContent: "center",
  },

  promoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: v_1bfbd0.violet600,
    marginHorizontal: 14,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  promoIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  promoTitle: { color: v_1bfbd0.white, fontSize: 13, fontWeight: "600", marginBottom: 4 },
  promoCta: {
    color: v_1bfbd0.white, fontSize: 13, fontWeight: "700",
    textDecorationLine: "underline",
  },

  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingBottom: 20 },

  personaIntroRow: { marginBottom: 20 },
  personaIntroName: { fontSize: 12, color: v_1bfbd0.zinc600, marginBottom: 6, marginLeft: 4 },
  personaIntroBubble: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start",
    maxWidth: "70%",
  },
  personaIntroText: { fontSize: 14, color: v_1bfbd0.zinc800, lineHeight: 20 },

  callGroup: { marginBottom: 14 },

  callBlock: {
    backgroundColor: v_1bfbd0.violet600,
    borderRadius: 18,
    padding: 14,
    alignSelf: "flex-end",
    width: "70%",
    marginBottom: 8,
  },
  callHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 10,
  },
  callIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  callDurationText: { color: v_1bfbd0.white, fontSize: 13, fontWeight: "600" },

  dateDividerWrap: {
    alignSelf: "center",
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  dateDividerText: {
    color: v_1bfbd0.white,
    fontSize: 12,
    fontWeight: "500",
  },

  callBubbleInner: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  callBubbleText: { color: v_1bfbd0.white, fontSize: 13, lineHeight: 19 },

  userBubble: {
    alignSelf: "flex-end",
    width: "70%",
    backgroundColor: v_1bfbd0.violet600,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  userBubbleText: { color: v_1bfbd0.white, fontSize: 13, lineHeight: 19 },

  personaOutsideBubble: {
    alignSelf: "flex-start",
    width: "70%",
    backgroundColor: v_1bfbd0.white,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  personaOutsideBubbleText: { color: v_1bfbd0.zinc800, fontSize: 13, lineHeight: 19 },

  typingBubble: {
    width: undefined,
    minWidth: 60,
  },
  typingText: {
    fontSize: 18,
    color: v_1bfbd0.zinc500,
    letterSpacing: 2,
    lineHeight: 18,
  },

  loadingText: {
    textAlign: "center",
    color: v_1bfbd0.zinc500,
    fontSize: 12,
    paddingVertical: 8,
  },
  emptyWrap: {
    paddingTop: 60,
    paddingBottom: 60,
    alignItems: "center",
  },
  emptyText: {
    color: v_1bfbd0.zinc500,
    fontSize: 13,
  },
  callEmptyText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
  },

  turnsSheet: {
    height: "80%",
    minHeight: 400,
  },
  turnUserRow: {
    alignItems: "flex-end",
    marginBottom: 6,
  },
  turnPersonaRow: {
    alignItems: "flex-start",
    marginBottom: 6,
  },

  transcriptBtn: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 6,
  },
  transcriptBtnText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "600",
  },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: v_1bfbd0.white,
    borderTopWidth: 1,
    borderTopColor: v_1bfbd0.zinc100,
  },
  inputField: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: v_1bfbd0.violet100,
    borderRadius: v_8b0c90.lg,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    color: v_1bfbd0.zinc900,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: v_1bfbd0.violet600,
    alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: v_1bfbd0.zinc300 },

  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  actionSheet: {
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: 24,
    paddingHorizontal: 16,
    minHeight: 180,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: v_1bfbd0.zinc300,
    alignSelf: "center",
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 13, fontWeight: "600",
    color: v_1bfbd0.zinc600,
    textAlign: "center",
    paddingVertical: 8,
    marginBottom: 4,
  },
  sheetAction: {
    paddingVertical: 14,
    alignItems: "center",
    borderTopWidth: v_472849.hairlineWidth,
    borderTopColor: v_1bfbd0.zinc100,
  },
  sheetActionText: { fontSize: 15, color: v_1bfbd0.zinc900, fontWeight: "500" },
  sheetActionDestructive: { color: "#DC2626", fontWeight: "600" },
  sheetCancel: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: v_1bfbd0.violet100,
    alignItems: "center",
  },
});
