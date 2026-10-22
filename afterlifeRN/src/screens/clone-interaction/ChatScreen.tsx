import { v_889fad } from "../../stores/dialogStore";

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
  v_e767d1,
  v_6b5698,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_75de9d } from "zqqvxke";
import { v_c64cf7 } from "../../lib/chatSystemText";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_c18c22 } from "svuoaeceudfxfjvvpmmmchnwljywbphjgb";
import type { v_432191 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_8ad91b } from "../../navigation/types";
import { v_194498 } from "../../stores/cloneStore";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_b4902e } from "../../stores/followStore";
import { v_84d546 } from "../../lib/callGuard";
import { v_38f9da } from "../../lib/callActivity";
import v_8e7ad4 from "../../components/ui/SwipeDownSheet";
import v_06b8c0 from "../../components/clone/IntimacyEventsSheet";
import v_fb73af from "../../components/ads/PangleBannerAd";
import { v_60086b } from "../../lib/pangle";
import { v_08bca5, v_12f485 } from "../../lib/useChatLiveRefresh";
import { v_1bfbd0 } from "../../components/constants";
import v_992d42 from "../../components/chat/ChatTypingDots";
import {
  v_8a85e2,
  v_22ca9b,
  v_40068b,
  v_dd96e7,
  v_15b915,
  v_3ce9ef,
  v_9adabd,
  v_1c758d,
  v_9cb700,
  v_8be472,
  v_9d1db1,
  type v_29686e,
  type v_f19942,
  type v_18a302,
  type v_109480,
} from "../../api/chat";
import { v_e0c5af } from "../clone-creation/content/pickImageSource";
import v_c7021f from "../clone-creation/content/ImageSourceSheet";
import {
  v_c905f8,
  v_49c1e3,
  v_73c438,
  v_daaf83,
} from "../../lib/chatLocalImages";
import * as v_3c288d from "bxoplsnixpmvnirxbbkstg";

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
  const { t: v_8d41d7, i18n: v_9c213b } = v_772971();
  const { cloneId: v_6e0fd3, name: v_a4744c, image: v_c1e151 } = v_c7daf6.params;
  const v_eb25ce = v_194498((v_fd5f43) => v_fd5f43.getCloneById(v_6e0fd3));
  const v_033e14 = v_e0068c();
  const v_5ca6b8 = v_e662ae<v_122070>(null);

  const v_dfb220 = v_a4744c ?? v_eb25ce?.displayName ?? v_8d41d7("chat.personaFallback", { defaultValue: "클론" });
  const v_e7274c =
    (typeof v_c1e151 === "string" && v_c1e151) || v_eb25ce?.imageUrl || null;

  const [v_bbda62, v_c31db7] = v_5ab095("");

  const [v_7e4acc, v_de86c2] = v_5ab095(0);
  v_c4deb2(() => {
    const v_399925 = v_326be8.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const v_206f77 = v_326be8.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const v_53f5d7 = v_0e1f26.addListener(v_399925, (v_9e86fd) => {
      v_de86c2(v_9e86fd?.endCoordinates?.height ?? 0);
      setTimeout(() => v_5ca6b8.current?.scrollToEnd({ animated: true }), 50);
    });
    const v_52528b = v_0e1f26.addListener(v_206f77, () => v_de86c2(0));
    return () => {
      v_53f5d7.remove();
      v_52528b.remove();
    };
  }, []);

  const [v_842b8b, v_0f6477] = v_5ab095(true);
  const [v_f61bef, v_ceec45] = v_5ab095(false);

  const [v_fd08c6, v_2c320e] = v_5ab095<{ title?: string; actions: ActionItem[] } | null>(null);
  const v_cafc04 = (v_9f1622, v_dd943a) =>
    v_2c320e({ title: v_9f1622, actions: v_dd943a });

  const [v_25cd2f, v_9e2d74] = v_5ab095(false);

  const [v_123da1, v_21f75d] = v_5ab095(0);
  const v_2ed4c7 = () => v_21f75d((v_f4e98d) => v_f4e98d + 1);
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_f4fb5e = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser?.email ?? null);

  const v_e721a8 = v_8a85e2(v_f4fb5e);
  const [v_2810d7, v_7f73ef] = v_5ab095<v_29686e[] | null>(null);
  const [v_a981b7, v_94405c] = v_5ab095<string | null>(null);
  const [v_dec728, v_a7c3b5] = v_5ab095(false);
  const [v_c5607b, v_1e756c] = v_5ab095<string | null>(null);
  const [v_5e23ec, v_10837f] = v_5ab095(false);
  const v_c157ce = v_e662ae(false);
  v_c157ce.current = v_5e23ec;

  const [v_b74b9c, v_b31b79] = v_5ab095<number | null>(null);
  const [v_9a58d3, v_74f358] = v_5ab095(false);

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
        if (typeof v_8f00b9.intimacy === "number") v_b31b79(v_8f00b9.intimacy);
      }
    })();
    return () => {
      v_2008a4 = true;
    };
  }, [v_e721a8, v_2ca7e0, v_6e0fd3]);

  const v_e6ff86 = async (v_02be30 = 10) => {
    if (!v_2ca7e0) return;
    const v_8f00b9 = await v_22ca9b(v_6e0fd3, v_2ca7e0, { limit: v_02be30 });
    if (!v_8f00b9) return;
    if (typeof v_8f00b9.intimacy === "number") v_b31b79(v_8f00b9.intimacy);
    v_7f73ef((v_ba2215) => {
      const v_694b25 = v_ba2215 ?? [];
      const v_d81543 = new Set(v_694b25.map(v_e51457));
      const v_90fa09 = v_8f00b9.items.filter((v_23805a) => !v_d81543.has(v_e51457(v_23805a)));
      if (v_90fa09.length === 0) return v_ba2215;
      return [...v_90fa09, ...v_694b25].sort((v_779914, v_148ff6) => v_65604f(v_148ff6) - v_65604f(v_779914));
    });
  };

  v_08bca5(() => {
    if (!v_e721a8 || v_c157ce.current) return;
    void v_e6ff86(30);
    if (v_2ca7e0 && v_6b5698.currentState === "active") void v_9cb700(v_6e0fd3, v_2ca7e0);
  }, v_6e0fd3);

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

  const v_d6f043 = v_e662ae(true);
  v_c4deb2(() => {
    v_d6f043.current = true;
    return () => {
      v_d6f043.current = false;
    };
  }, []);

  v_c4deb2(() => {
    if (!v_2ca7e0) return;
    void v_9cb700(v_6e0fd3, v_2ca7e0);
    const v_1ae212 = v_6b5698.addEventListener("change", (v_fd5f43) => {
      if (v_fd5f43 === "active") void v_9cb700(v_6e0fd3, v_2ca7e0);
    });
    return () => {
      v_1ae212.remove();

      void v_9cb700(v_6e0fd3, v_2ca7e0, Date.now() - 1000);
    };
  }, [v_2ca7e0, v_6e0fd3]);

  const v_00fc5a = (msg: v_f19942) => {
    v_cafc04(v_8d41d7("chat.deleteMessageTitle", { defaultValue: "메시지 삭제" }), [
      {
        label: v_8d41d7("common.delete", { defaultValue: "삭제" }),
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
        at: v_8f00b9.userMessage.at ?? v_5c2f9f,
        sessionId: v_8f00b9.sessionId,
      };
      const cloneItem: v_f19942 = {
        type: "chat",
        id: v_8f00b9.cloneReply.id,
        role: "clone",
        content: v_8f00b9.cloneReply.content,
        at: v_8f00b9.cloneReply.at ?? v_5c2f9f + 1,
        sessionId: v_8f00b9.sessionId,
      };

      v_7f73ef((v_ba2215) => {
        const v_694b25 = (v_ba2215 ?? []).filter((v_23805a) =>
          !(v_23805a.type === "chat" && v_23805a.id === v_2413d4),
        );
        return [v_e44122, v_8338f4, ...v_694b25];
      });

      v_12f485(v_6e0fd3);

      if (v_d6f043.current && v_6b5698.currentState === "active") {
        void v_9cb700(v_6e0fd3, v_2ca7e0);
      }
      void v_e6ff86();
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

  const v_f4f163 = async (v_cd1446) => {
    if (v_5e23ec) return;
    if (!v_e721a8 || !v_2ca7e0) {
      v_889fad(
        v_8d41d7("chat.imageUnavailableTitle", { defaultValue: "사진 보내기" }),
        v_8d41d7("chat.imageLoginRequired", { defaultValue: "로그인 후 사진을 보낼 수 있어요." }),
      );
      return;
    }
    v_0e1f26.dismiss();

    let v_4a0670 = v_cd1446;
    try {

      const v_2d3c27 = await v_3c288d.manipulateAsync(
        v_cd1446,
        [{ resize: { width: 1280 } }],
        { compress: 0.8, format: v_3c288d.SaveFormat.JPEG },
      );
      if (v_2d3c27?.uri) v_4a0670 = v_2d3c27.uri;
    } catch (v_49263d) {
      console.warn("[Chat] image resize failed — original uri 사용:", v_49263d);
    }

    const v_2413d4 = -Date.now();
    const v_5c2f9f = Date.now();
    const optimisticUser: v_f19942 = {
      type: "chat",
      id: v_2413d4,
      role: "user",
      content: v_8d41d7("chat.imagePlaceholder", { defaultValue: "[사진]" }),
      at: v_5c2f9f,
      sessionId: v_c5607b ?? "pending",
      kind: "image",
      caption: null,
    };
    v_c905f8(v_2413d4, v_4a0670);
    v_2ed4c7();
    v_7f73ef((v_ba2215) => [v_fa1cce, ...(v_ba2215 ?? [])]);
    v_10837f(true);

    try {
      const v_8f00b9 = await v_15b915(v_6e0fd3, v_4a0670, v_2ca7e0, {
        sessionId: v_c5607b ?? undefined,
      });
      if (!v_c5607b) v_1e756c(v_8f00b9.sessionId);

      const v_6044a8 =
        v_8f00b9.userMessage.caption ??
        (v_8f00b9.userMessage.kind === "image" ? v_8f00b9.userMessage.content : null);
      const realUser: v_f19942 = {
        type: "chat",
        id: v_8f00b9.userMessage.id,
        role: "user",
        content: v_8f00b9.userMessage.content || v_8d41d7("chat.imagePlaceholder", { defaultValue: "[사진]" }),
        at: v_8f00b9.userMessage.at ?? v_5c2f9f,
        sessionId: v_8f00b9.sessionId,
        kind: "image",
        caption: v_6044a8,
      };
      v_73c438(v_2413d4, v_8f00b9.userMessage.id);
      v_2ed4c7();

      v_7f73ef((v_ba2215) => {
        const v_694b25 = (v_ba2215 ?? []).filter((v_23805a) => !(v_23805a.type === "chat" && v_23805a.id === v_2413d4));
        return [v_8338f4, ...v_694b25];
      });

      try {
        const { loadAndShowRewardedAd: v_18f201 } = await import("../../lib/pangle");
        await v_18f201();
      } catch (v_663f77) {

        console.warn("[Chat] image rewarded ad failed — show reply anyway:", v_663f77);
      }

      if (!v_d6f043.current) return;

      const cloneItem: v_f19942 = {
        type: "chat",
        id: v_8f00b9.cloneReply.id,
        role: "clone",
        content: v_8f00b9.cloneReply.content,
        at: v_8f00b9.cloneReply.at ?? Date.now(),
        sessionId: v_8f00b9.sessionId,
      };
      v_7f73ef((v_ba2215) => {
        const v_694b25 = v_ba2215 ?? [];

        if (v_694b25.some((v_23805a) => v_23805a.type === "chat" && v_23805a.id === v_e44122.id)) return v_694b25;
        return [v_e44122, ...v_694b25];
      });

      v_12f485(v_6e0fd3);
      if (v_6b5698.currentState === "active") {
        void v_9cb700(v_6e0fd3, v_2ca7e0);
      }
      void v_e6ff86();
    } catch (v_49263d) {
      console.warn("[Chat] send image failed:", (v_49263d as Error)?.message ?? v_49263d);
      v_daaf83(v_2413d4);
      v_2ed4c7();
      v_7f73ef((v_ba2215) =>
        v_ba2215 ? v_ba2215.filter((v_23805a) => !(v_23805a.type === "chat" && v_23805a.id === v_2413d4)) : v_ba2215,
      );
      const v_d308b5 = (v_49263d as { status?: number })?.status;
      v_889fad(
        v_8d41d7("chat.imageSendFailTitle", { defaultValue: "사진을 보내지 못했어요" }),
        v_d308b5 === 404 || v_d308b5 === 501
          ? v_8d41d7("chat.imageApiUnavailable", {
              defaultValue: "사진 보내기 준비 중이에요. 잠시 후 다시 시도해 주세요.",
            })
          : v_8d41d7("chat.imageSendFailBody", {
              defaultValue: "네트워크 상태를 확인한 뒤 다시 시도해 주세요.",
            }),
      );
    } finally {
      v_10837f(false);
    }
  };

  const v_4b9c9b = () => {
    if (v_5e23ec) return;
    v_0e1f26.dismiss();
    v_9e2d74(true);
  };

  const v_1f5414 = async (v_520fa9) => {
    const v_07fb2e = await v_e0c5af(v_520fa9, v_8d41d7);
    if (!v_07fb2e?.uri) return;
    await v_f4f163(v_07fb2e.uri);
  };

  const v_21be1f = async () => {
    const v_3ed4c3 = await v_84d546(v_2ca7e0, () => {});
    if (!v_3ed4c3) return;
    v_38f9da({ cloneId: v_6e0fd3, name: v_dfb220, source: "chat" });
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

  const v_8888af = async () => {
    if (!v_2ca7e0) return;
    try {
      const v_cb35cb = await v_8be472(v_6e0fd3, v_2ca7e0);
      if (v_cb35cb.unsubscribed) await v_b4902e.getState().unfollowLocalForBlock(v_6e0fd3);
      v_c65f5d.goBack();
    } catch (v_49263d) {
      console.warn("[Chat] leave failed:", (v_49263d as Error)?.message ?? v_49263d);
      v_889fad(
        v_8d41d7("chat.leaveFailTitle", { defaultValue: "나가지 못했어요" }),
        v_8d41d7("common.retryLater", { defaultValue: "잠시 후 다시 시도해 주세요." }),
      );
    }
  };

  const v_98409d = () => {
    const v_f1620a = v_1ed7d9.getState().apiUser?.id ?? null;
    const v_e009da = v_eb25ce?.ownerId != null && v_f1620a != null && v_eb25ce.ownerId === v_f1620a;
    const v_dd943a = [
      {
        label: v_8d41d7("chat.callAction", { defaultValue: "통화" }),
        onPress: () => void v_21be1f(),
      },
      {
        label: v_842b8b
          ? v_8d41d7("chat.notifyOff", { defaultValue: "알림 끄기" })
          : v_8d41d7("chat.notifyOn", { defaultValue: "알림 켜기" }),
        disabled: v_f61bef,
        onPress: () => void v_4f52b6(),
      },
    ];

    v_dd943a.push({
      label: v_8d41d7("chat.leaveAction", { defaultValue: "나가기" }),
      destructive: true,
      onPress: () => {
        const v_893b61 = !v_e009da && v_b4902e.getState().isFollowing(v_6e0fd3);
        v_889fad(
          v_8d41d7("chat.leaveTitle", { defaultValue: "대화방 나가기" }),
          v_9d1db1(v_8d41d7, v_893b61),
          [
            { text: v_8d41d7("common.cancel", { defaultValue: "취소" }), style: "cancel" },
            {
              text: v_8d41d7("chat.leaveAction", { defaultValue: "나가기" }),
              style: "destructive",
              onPress: () => void v_8888af(),
            },
          ],
        );
      },
    });
    v_cafc04(v_dfb220, v_dd943a);
  };

  const v_c2e43c = () => {
    v_c65f5d.navigate("CloneFeed", { cloneId: v_6e0fd3 });
  };

  const v_f9771e = v_c18c22(0);
  const v_ad9bbd = v_326be8.OS === "android" ? 56 : 0;
  const v_2b650d = Math.max(v_033e14.bottom, v_f9771e, v_ad9bbd);

  const v_130b3e =
    v_7e4acc > 0 ? v_7e4acc : v_033e14.bottom;

  return (
    <View style={[v_d81136.shell, { paddingBottom: v_130b3e }]}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={v_326be8.OS === "android" ? "height" : undefined}
      enabled={v_326be8.OS === "android" && v_7e4acc > 0}
    >
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
          {}
          {v_b74b9c !== null && (
            <TouchableOpacity
              style={v_d81136.headerTemp}
              onPress={() => v_74f358(true)}
              hitSlop={8}
              accessibilityLabel="intimacy"
            >
              <Feather name="thermometer" size={13} color="#fb923c" />
              <Text style={v_d81136.headerTempText}>{v_b74b9c}°C</Text>
            </TouchableOpacity>
          )}
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
      <PangleBannerAd adUnitId={v_60086b("chat")} style={v_d81136.chatAdBanner} />

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
                  <Text style={v_d81136.dateDividerText}>{v_873982(v_db51a9, v_8d41d7)}</Text>
                </View>
              ) : null;
              if (v_c8c890(v_23805a)) {
                return (
                  <React.Fragment key={`missed-group-${v_23805a.firstId}`}>
                    {v_6583df}
                    <View style={v_d81136.callBlock}>
                      <View style={v_d81136.callHeader}>
                        <View style={[v_d81136.callIconWrap, v_d81136.callIconWrapMissed]}>
                          <Feather name="phone-missed" size={14} color={v_1bfbd0.white} />
                        </View>
                        <Text style={v_d81136.callDurationText}>
                          {v_8d41d7("chat.missedCallCount", {
                            defaultValue: "부재중 통화 {{count}}건 · {{date}}",
                            count: v_23805a.count,
                            date: v_c1c940(v_23805a.latestAt, v_8d41d7),
                          })}
                        </Text>
                      </View>
                    </View>
                  </React.Fragment>
                );
              }
              if (v_23805a.type === "system") {

                const v_c9d8de =
                  v_c64cf7(v_23805a.kind, v_23805a.data, v_dfb220, v_8d41d7, v_9c213b.language) ??
                  v_23805a.text;
                return (
                  <React.Fragment key={`api-sys-${v_23805a.id}`}>
                    {v_6583df}
                    <TouchableOpacity
                      style={v_d81136.systemChip}
                      activeOpacity={0.7}
                      disabled={v_23805a.kind !== "intimacy_milestone"}
                      onPress={() => v_74f358(true)}
                    >
                      <Text style={v_d81136.systemChipText}>🌡 {v_c9d8de}</Text>
                    </TouchableOpacity>
                  </React.Fragment>
                );
              }
              if (v_23805a.type === "chat") {

                const v_a448ad = v_e86ad8 + 1 < v_907715.length ? v_907715[v_e86ad8 + 1] : null;
                const v_d2b3ec = !(
                  v_a448ad && !v_c8c890(v_a448ad) && v_a448ad.type === "chat" &&
                  v_a448ad.role === v_23805a.role && v_691d4e(v_a448ad.at, v_23805a.at)
                );
                const v_ca7346 = v_23805a.role === "user";

                void v_123da1;
                const v_cbe4b7 = v_49c1e3(v_23805a.id);

                const v_27e1a6 = v_23805a.kind === "image" || !!v_cbe4b7;
                const v_a9330b =
                  (v_23805a.caption && v_23805a.caption.trim()) ||
                  (v_23805a.content && v_23805a.content !== "[사진]" ? v_23805a.content.trim() : "");
                const v_782a23 = v_27e1a6 ? (
                  v_cbe4b7 ? (
                    <Image
                      source={{ uri: v_cbe4b7 }}
                      style={v_d81136.chatImageThumb}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={v_d81136.chatImageFallback}>
                      <Feather
                        name="image"
                        size={22}
                        color={v_ca7346 ? v_1bfbd0.white : v_1bfbd0.zinc500}
                      />
                      <Text
                        style={
                          v_ca7346
                            ? v_d81136.userBubbleText
                            : v_d81136.personaOutsideBubbleText
                        }
                      >
                        {v_8d41d7("chat.imagePlaceholder", { defaultValue: "[사진]" })}
                      </Text>
                      {!!v_a9330b && (
                        <Text
                          style={[
                            v_ca7346
                              ? v_d81136.userBubbleText
                              : v_d81136.personaOutsideBubbleText,
                            v_d81136.chatImageCaption,
                          ]}
                          numberOfLines={3}
                        >
                          {v_a9330b}
                        </Text>
                      )}
                    </View>
                  )
                ) : (
                  <Text
                    style={
                      v_ca7346 ? v_d81136.userBubbleText : v_d81136.personaOutsideBubbleText
                    }
                  >
                    {v_23805a.content}
                  </Text>
                );
                return (
                  <React.Fragment key={`api-chat-${v_23805a.id}`}>
                    {v_6583df}
                    <View style={v_ca7346 ? v_d81136.userBubbleRow : v_d81136.personaBubbleRow}>
                      {v_ca7346 && v_d2b3ec && (
                        <Text style={v_d81136.bubbleTimeText}>{v_54a55d(v_23805a.at)}</Text>
                      )}
                      {v_ca7346 ? (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onLongPress={() => v_00fc5a(v_23805a)}
                          delayLongPress={350}
                          style={[
                            v_d81136.userBubble,
                            v_d81136.bubbleInRow,
                            v_27e1a6 && v_d81136.userImageBubble,
                          ]}
                        >
                          {v_782a23}
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onLongPress={() => v_00fc5a(v_23805a)}
                          delayLongPress={350}
                          style={[
                            v_d81136.personaOutsideBubble,
                            v_d81136.bubbleInRow,
                            v_27e1a6 && v_d81136.personaImageBubble,
                          ]}
                        >
                          {v_782a23}
                        </TouchableOpacity>
                      )}
                      {!v_ca7346 && v_d2b3ec && (
                        <Text style={v_d81136.bubbleTimeText}>{v_54a55d(v_23805a.at)}</Text>
                      )}
                    </View>
                  </React.Fragment>
                );
              }

              return (
                <React.Fragment key={`api-call-${v_23805a.callId}`}>
                  {v_6583df}
                  <View style={v_d81136.callBlock}>
                    <View style={v_d81136.callHeader}>
                      <View
                        style={[
                          v_d81136.callIconWrap,
                          v_23805a.turnCount > 0
                            ? v_d81136.callIconWrapVoice
                            : v_d81136.callIconWrapMissed,
                        ]}
                      >
                        <Feather
                          name={v_23805a.turnCount > 0 ? "phone" : "phone-missed"}
                          size={14}
                          color={v_1bfbd0.white}
                        />
                      </View>
                      <Text style={v_d81136.callDurationText}>
                        {v_f5aeb2(v_23805a, v_8d41d7)}
                      </Text>
                    </View>
                    {v_23805a.turnCount > 0 ? (
                      <TouchableOpacity
                        style={v_d81136.transcriptBtn}
                        hitSlop={6}
                        onPress={() => v_bbd0f3(v_23805a.callId)}
                        activeOpacity={0.85}
                      >
                        <Feather name="file-text" size={14} color={v_1bfbd0.primary} />
                        <Text style={v_d81136.transcriptBtnText}>{v_8d41d7("chat.callTranscriptBtn")}</Text>
                        <Feather name="chevron-right" size={16} color={v_1bfbd0.primary} />
                      </TouchableOpacity>
                    ) : (
                      <Text style={v_d81136.callEmptyText}>{v_8d41d7("chat.missedCall")}</Text>
                    )}
                  </View>
                </React.Fragment>
              );
            })}
            {v_5e23ec && (
              <View
                style={[v_d81136.personaOutsideBubble, v_d81136.typingBubble]}
                accessibilityRole="text"
                accessibilityLabel={v_8d41d7("chat.typingA11y", {
                  defaultValue: "상대가 입력 중",
                })}
              >
                <ChatTypingDots />
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

      {}
      <View style={v_d81136.inputBar}>
        <View style={v_d81136.inputPill}>
          <TouchableOpacity
            style={[v_d81136.imageBtn, v_5e23ec && v_d81136.imageBtnDisabled]}
            onPress={v_4b9c9b}
            disabled={v_5e23ec}
            hitSlop={6}
            accessibilityLabel={v_8d41d7("chat.imageButtonA11y", { defaultValue: "사진 보내기" })}
          >
            <Feather
              name="image"
              size={16}
              color={v_5e23ec ? v_1bfbd0.zinc400 : v_1bfbd0.zinc700}
            />
          </TouchableOpacity>
          <TextInput
            style={v_d81136.inputField}
            value={v_bbda62}
            onChangeText={v_c31db7}
            placeholder={v_8d41d7("chat.inputPlaceholder", {
              defaultValue: "{{name}}(으)로 채팅 중",
              name: v_dfb220,
            })}
            placeholderTextColor={v_1bfbd0.zinc400}
            multiline
            textAlignVertical="center"
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={v_465869}
            blurOnSubmit
            onFocus={() => {
              setTimeout(() => v_5ca6b8.current?.scrollToEnd({ animated: true }), 150);
            }}
          />
          <TouchableOpacity
            style={[v_d81136.sendBtn, (!v_bbda62.trim() || v_5e23ec) && v_d81136.sendBtnDisabled]}
            onPress={v_465869}
            disabled={!v_bbda62.trim() || v_5e23ec}
            accessibilityLabel={v_8d41d7("chat.sendA11y", { defaultValue: "보내기" })}
          >
            <Feather
              name="send"
              size={16}
              color={!v_bbda62.trim() || v_5e23ec ? v_1bfbd0.zinc500 : v_1bfbd0.white}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ImageSourceSheet
        visible={v_25cd2f}
        title={v_8d41d7("chat.imagePickTitle", { defaultValue: "사진 보내기" })}
        cameraLabel={v_8d41d7("chat.imagePickCamera", { defaultValue: "카메라" })}
        libraryLabel={v_8d41d7("chat.imagePickAlbum", { defaultValue: "앨범" })}
        cancelLabel={v_8d41d7("common.cancel", { defaultValue: "취소" })}
        onCamera={() => void v_1f5414(true)}
        onLibrary={() => void v_1f5414(false)}
        onClose={() => v_9e2d74(false)}
      />

      {}
      <IntimacyEventsSheet
        visible={v_9a58d3}
        cloneId={v_9a58d3 ? v_6e0fd3 : null}
        cloneName={v_dfb220}
        onClose={() => v_74f358(false)}
      />

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

      {

}
      <Modal
        visible={!!v_db205d}
        transparent
        animationType="slide"
        onRequestClose={() => v_fb20c7(null)}
      >
        {

}
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}>
          <Pressable style={v_472849.absoluteFill} onPress={() => v_fb20c7(null)} />
          <View style={[v_d81136.actionSheet, v_d81136.turnsSheet, { paddingBottom: v_2b650d }]}>
            <View style={v_d81136.sheetHandle} />
            <Text style={v_d81136.sheetTitle}>{v_8d41d7("chat.callTranscriptTitle")}</Text>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 20 + v_2b650d }}
              onScroll={({ nativeEvent: v_76b943 }) => {
                if (v_76b943.contentOffset.y <= 20) void v_6deb64();
              }}
              scrollEventThrottle={200}
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
              {v_db205d?.loading && v_db205d.turns.length === 0 && (
                <Text style={v_d81136.loadingText}>{v_8d41d7("chat.loadingGeneric")}</Text>
              )}
              {v_db205d?.turns.map((v_8d41d7) => (
                <View
                  key={`turn-${v_db205d.callId}-${v_8d41d7.seq}`}
                  style={v_8d41d7.role === "user" ? v_d81136.turnUserRow : v_d81136.turnPersonaRow}
                >
                  {v_8d41d7.role === "user" ? (
                    <View style={[v_d81136.userBubble, { maxWidth: "80%" }]}>
                      <Text style={v_d81136.userBubbleText}>{v_8d41d7.text}</Text>
                    </View>
                  ) : (
                    <View
                      style={[
                        v_d81136.personaOutsideBubble,
                        v_d81136.turnPersonaBubble,
                        { maxWidth: "80%" },
                      ]}
                    >
                      <Text
                        style={[v_d81136.personaOutsideBubbleText, v_d81136.turnPersonaText]}
                      >
                        {v_8d41d7.text}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
              {v_db205d?.loading && v_db205d.turns.length > 0 && (
                <Text style={v_d81136.loadingText}>{v_8d41d7("chat.loadingPrevUtterances")}</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
    </KeyboardAvoidingView>
    </View>
  );
}

function v_c1c940(v_d799e2, t: v_75de9d): string {
  const v_d5dda0 = new Date(v_d799e2);
  return v_8d41d7("chat.monthDay", {
    defaultValue: "{{m}}월 {{d}}일",
    m: v_d5dda0.getMonth() + 1,
    d: v_d5dda0.getDate(),
  });
}

function v_f5aeb2(it: v_18a302, t: v_75de9d): string {
  const v_df8a54 = v_54a55d(v_23805a.startedAt);
  if (v_23805a.durationSec && v_23805a.durationSec > 0) {
    const v_b3dc28 = Math.floor(v_23805a.durationSec);
    const v_35f85c = Math.floor(v_b3dc28 / 60);
    const v_fd5f43 = v_b3dc28 % 60;
    const v_7dc4bb =
      v_35f85c > 0
        ? v_8d41d7("common.durationMinSec", { defaultValue: "{{m}}분 {{s}}초", m: v_35f85c, s: v_fd5f43 })
        : v_8d41d7("common.durationSec", { defaultValue: "{{s}}초", s: v_fd5f43 });
    return v_8d41d7("chat.voiceCallWithDuration", {
      defaultValue: "음성 통화 · {{duration}} · {{time}}",
      duration: v_7dc4bb,
      time: v_df8a54,
    });
  }
  return v_8d41d7("chat.voiceCallSimple", {
    defaultValue: "음성 통화 · {{time}}",
    time: v_df8a54,
  });
}

const v_857bbc = [
  "chat.weekdaySun",
  "chat.weekdayMon",
  "chat.weekdayTue",
  "chat.weekdayWed",
  "chat.weekdayThu",
  "chat.weekdayFri",
  "chat.weekdaySat",
] as const;
const v_18e715 = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
function v_873982(v_d799e2, t: v_75de9d): string {
  const v_d5dda0 = new Date(v_d799e2);
  const v_087ffc = v_d5dda0.getDay();
  return v_8d41d7("chat.dateLabel", {
    defaultValue: "{{y}}년 {{m}}월 {{d}}일 {{weekday}}",
    y: v_d5dda0.getFullYear(),
    m: v_d5dda0.getMonth() + 1,
    d: v_d5dda0.getDate(),
    weekday: v_8d41d7(v_857bbc[v_087ffc], { defaultValue: v_18e715[v_087ffc] }),
  });
}

function v_e51457(it: v_29686e): string {
  if (v_23805a.type === "call") return `call-${v_23805a.callId}`;
  return `${v_23805a.type}-${v_23805a.id}`;
}

function v_65604f(v_23805a): number {
  if (v_c8c890(v_23805a)) return v_23805a.oldestAt;
  if (v_23805a.type === "chat" || v_23805a.type === "system") return v_23805a.at;
  return v_23805a.startedAt;
}

function v_54a55d(v_d799e2): string {
  const v_d5dda0 = new Date(v_d799e2);
  return `${v_d5dda0.getHours().toString().padStart(2, "0")}:${v_d5dda0.getMinutes().toString().padStart(2, "0")}`;
}

function v_691d4e(v_779914, v_148ff6): boolean {
  return Math.floor(v_779914 / 60000) === Math.floor(v_148ff6 / 60000);
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
  shell: { flex: 1, backgroundColor: v_1bfbd0.white },
  root: { flex: 1, backgroundColor: v_1bfbd0.white },

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
    backgroundColor: v_1bfbd0.zinc100, alignItems: "center", justifyContent: "center",
  },
  headerAvatarInitial: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.secondary },
  headerName: { flexShrink: 1, fontSize: 16, fontWeight: "700", color: v_1bfbd0.zinc900 },
  headerTemp: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    flexShrink: 0,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(251,146,60,0.12)",
  },
  headerTempText: { fontSize: 12, fontWeight: "700", color: "#ea580c" },
  systemChip: {
    alignSelf: "center",
    marginVertical: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: v_1bfbd0.zinc200,
    maxWidth: "85%",
  },
  systemChipText: { color: v_1bfbd0.zinc700, fontSize: 12, fontWeight: "500", textAlign: "center" },
  headerRight: { flexDirection: "row", gap: 6 },
  headerActionBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: v_1bfbd0.white,
    alignItems: "center", justifyContent: "center",
  },

  chatAdBanner: {
    height: 60,

    backgroundColor: "transparent",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  promoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: v_1bfbd0.zinc300,
    marginHorizontal: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  promoIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: v_1bfbd0.zinc200,
    alignItems: "center", justifyContent: "center",
  },
  promoTitle: { color: v_1bfbd0.zinc700, fontSize: 13, fontWeight: "600", marginBottom: 4 },
  promoCta: {
    color: v_1bfbd0.zinc700, fontSize: 13, fontWeight: "700",
    textDecorationLine: "underline",
  },

  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingBottom: 20 },

  personaIntroRow: { marginBottom: 8 },
  personaIntroName: { fontSize: 12, color: v_1bfbd0.zinc600, marginBottom: 6, marginLeft: 4 },
  personaIntroBubble: {
    backgroundColor: v_1bfbd0.white,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start",
    maxWidth: "70%",
  },
  personaIntroText: { fontSize: 14, color: v_1bfbd0.zinc900, lineHeight: 20 },

  callGroup: { marginBottom: 8 },

  callBlock: {
    backgroundColor: v_1bfbd0.primary,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    alignSelf: "flex-end",
    width: "78%",
    marginBottom: 8,
  },
  callHeader: {
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  callIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },

  callIconWrapVoice: {
    backgroundColor: v_1bfbd0.secondary,
  },

  callIconWrapMissed: {
    backgroundColor: v_1bfbd0.rose500,
  },
  callDurationText: { flex: 1, color: v_1bfbd0.white, fontSize: 13, fontWeight: "600" },

  dateDividerWrap: {
    alignSelf: "center",
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: v_1bfbd0.zinc200,
  },
  dateDividerText: {
    color: v_1bfbd0.zinc600,
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
    maxWidth: "100%",
    borderRadius: 18,
    borderTopRightRadius: 4,
    backgroundColor: v_1bfbd0.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubbleText: { color: v_1bfbd0.white, fontSize: 15, lineHeight: 21 },

  personaOutsideBubble: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    backgroundColor: v_1bfbd0.white,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  personaOutsideBubbleText: { color: v_1bfbd0.zinc900, fontSize: 15, lineHeight: 21 },

  userBubbleRow: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    maxWidth: "82%",
    marginBottom: 8,
  },
  personaBubbleRow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    maxWidth: "82%",
    marginBottom: 8,
  },
  bubbleInRow: { flexShrink: 1 },
  bubbleTimeText: { color: v_1bfbd0.zinc400, fontSize: 11, marginBottom: 2 },

  typingBubble: {
    width: undefined,
    minWidth: 56,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignSelf: "flex-start",
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
  },

  turnsSheet: {
    height: "80%",
    minHeight: 400,
  },
  turnUserRow: {
    alignItems: "flex-end",
    marginBottom: 8,
  },
  turnPersonaRow: {
    alignItems: "flex-start",
    marginBottom: 8,
  },

  turnPersonaBubble: {
    backgroundColor: v_1bfbd0.zinc200,
    borderTopLeftRadius: 4,
  },
  turnPersonaText: {
    color: v_1bfbd0.zinc900,
  },

  transcriptBtn: {
    alignSelf: "stretch",
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: v_1bfbd0.white,
    borderRadius: 12,
  },
  transcriptBtnText: {
    color: v_1bfbd0.primary,
    fontSize: 13,
    fontWeight: "700",
    flexShrink: 1,
  },

  inputBar: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: v_1bfbd0.zinc100,
    borderTopWidth: v_472849.hairlineWidth,
    borderTopColor: v_1bfbd0.zinc200,
  },
  inputPill: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    minHeight: 48,
    paddingLeft: 6,
    paddingRight: 6,
    paddingVertical: 4,
    backgroundColor: v_1bfbd0.white,
    borderRadius: 999,
    borderWidth: v_472849.hairlineWidth,
    borderColor: v_1bfbd0.zinc200,
  },
  inputField: {
    flex: 1,
    maxHeight: 120,
    minHeight: 40,
    paddingHorizontal: 6,
    paddingTop: v_326be8.OS === "ios" ? 10 : 8,
    paddingBottom: v_326be8.OS === "ios" ? 10 : 8,
    margin: 0,
    borderWidth: 0,
    color: v_1bfbd0.zinc900,
    backgroundColor: "transparent",
    fontSize: 15,
    lineHeight: 20,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 2,
    backgroundColor: v_1bfbd0.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { backgroundColor: v_1bfbd0.zinc200 },

  imageBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 2,
    backgroundColor: v_1bfbd0.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  imageBtnDisabled: { opacity: 0.45 },
  chatImageThumb: {
    width: 180,
    height: 180,
    borderRadius: 12,
    backgroundColor: v_1bfbd0.zinc800,
  },
  chatImageFallback: {
    minWidth: 120,
    maxWidth: 200,
    alignItems: "flex-start",
    gap: 6,
  },
  chatImageCaption: {
    opacity: 0.9,
    fontSize: 13,
    lineHeight: 18,
  },
  userImageBubble: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  personaImageBubble: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },

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
    backgroundColor: v_1bfbd0.zinc100,
    alignItems: "center",
  },
});
