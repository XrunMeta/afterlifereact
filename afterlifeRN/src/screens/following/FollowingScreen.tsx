import { v_889fad } from "../../stores/dialogStore";
import v_f708aa from "rfupdmudaavopiotgcbpnfafsziimlsulwhgcz";
import v_a3453e, { v_5ab095, v_df9f57, v_c4deb2, v_e662ae, v_de06a3 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_cf9c33,
  v_9cabcb,
  v_6c4f62,
  v_122070,
  v_aa7413,
  v_326be8,
  v_09d0e5,
  v_79c4f2,
  v_700696,
  v_a2349e,
  v_03e392,
  v_39a996,
  type v_bd64bf,
  type v_da479e,
} from "rcmrninabrnb";
import { v_dec439, v_25515d } from "zvyjokvuouwvifyzks";
import { v_ada615, v_2d8264, v_650cfa, type v_ee3714 } from "ixigazcpvfldbecwtbvavtbi";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_c18c22 } from "svuoaeceudfxfjvvpmmmchnwljywbphjgb";
import v_556baf from "../../components/ui/SafeView";
import v_1a40c4 from "../../components/ui/Button";
import v_258c1c from "../../components/common/PageHeader";
import v_0e981f from "../../components/common/NotificationBell";
import v_f9a626, { v_ae4cf5 } from "../../components/common/PartnerAppBanners";
import { v_772971 } from "jmpfvteuuztnp";
import { v_c64cf7 } from "../../lib/chatSystemText";
import { v_1bfbd0, v_9b1a04, v_8b0c90, v_8f28b1, v_7c5e29 } from "../../components/constants";
import type { v_8ad91b, v_97a9a8 } from "../../navigation/types";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_84d546 } from "../../lib/callGuard";
import { v_38f9da } from "../../lib/callActivity";
import { v_b4902e } from "../../stores/followStore";
import { v_694b7f } from "../../api/source";
import {
  v_4208e7,
  v_3f8bc7,
  v_6f689a,
  v_0df337,
  v_7281a5,
  v_de2a30,
  v_11c954,
  v_b14fce,
  v_0ff331,
  v_8ce643,
  v_003cf2,
  type v_52af9d,
  type v_c33ae3,
  type v_6349d0,
} from "../../api/clones";
import { v_bfd883 } from "../../lib/relativeTime";
import { v_cf763b } from "ixigazcpvfldbecwtbvavtbi";
import { v_08bca5 } from "../../lib/useChatLiveRefresh";
import type { v_4b85a1, v_bc3df4 } from "../../types/domain";
import v_5778ce from "../../components/common/HashtagText";
import v_8e7ad4 from "../../components/ui/SwipeDownSheet";
import v_fb73af from "../../components/ads/PangleBannerAd";
import { v_60086b } from "../../lib/pangle";
import {
  v_8a85e2,
  v_e36429,
  v_8be472,
  v_9d1db1,
  type v_17d27f,
} from "../../api/chat";

type RootNav = v_390fcc<v_8ad91b>;
const { width: v_437248 } = v_700696.get("window");
const v_b9d568 = 1;

const v_658217 = 88;

type FollowedPersona = {
  id: number;
  name: string;
  avatar: string;
  interests: string[];
  creatorAccount: string;
  intimacy: number; 
  interactions: number; 

  isOwn?: boolean;
};

const v_c8b54a = (v_62676b): number => {
  const v_35f85c = v_62676b?.messages ?? 0;
  const v_206b88 = v_62676b?.gifts ?? 0;
  const v_1614db = v_62676b?.likes ?? 0;
  const v_3f4e2e = v_62676b?.comments ?? 0;
  return v_35f85c + v_206b88 + v_1614db + v_3f4e2e;
};

type MockComment = { id: string; author: string; avatar: string; content: string; time: string };
const v_888327 = [
  { author: "@investor_kim", avatar: "https://i.pravatar.cc/100?img=1", content: "정말 유익한 분석입니다! 감사합니다.", time: "5분 전" },
  { author: "@market_lover", avatar: "https://i.pravatar.cc/100?img=5", content: "장기 투자 관점으로 접근하겠습니다.", time: "12분 전" },
  { author: "@finance_pro", avatar: "https://i.pravatar.cc/100?img=3", content: "좋은 인사이트네요", time: "20분 전" },
  { author: "@healing_soul", avatar: "https://i.pravatar.cc/100?img=9", content: "위로가 됩니다. 감사해요", time: "3분 전" },
  { author: "@mindful_life", avatar: "https://i.pravatar.cc/100?img=10", content: "오늘도 힘내세요!", time: "15분 전" },
];
const v_937a56 = (v_c09aa8): MockComment[] => {
  const v_9e8c70 = (v_c09aa8 * 7) % 4; 
  return v_888327.slice(0, v_9e8c70).map((v_3f4e2e, v_ebec57) => ({ id: `c-${v_c09aa8}-${v_ebec57}`, ...v_3f4e2e }));
};

const v_986943 = (clone: v_4b85a1, v_edb3e7): FollowedPersona => ({
  id: v_eb25ce.id,
  name: v_eb25ce.displayName,
  avatar: v_eb25ce.imageUrl ?? "",
  interests: v_eb25ce.interests,
  creatorAccount: v_edb3e7 ? `@${v_edb3e7}` : "",
  intimacy: 0,
  interactions: 0,
});

const v_cae9dc = (v_f4e98d) => (v_f4e98d >= 1000 ? `${(v_f4e98d / 1000).toFixed(1)}k` : String(v_f4e98d));

export default function v_14b43e() {
  const { t: v_8d41d7, i18n: v_9c213b } = v_772971();
  const v_033e14 = v_e0068c();

  const v_f9771e = v_c18c22(0);
  const v_ad9bbd = v_326be8.OS === "android" ? 56 : 0;
  const v_2b650d = Math.max(v_033e14.bottom, v_f9771e, v_ad9bbd);
  const v_f4c991 = v_ada615<RootNav>();
  const v_f38ee5 = v_1ed7d9((v_fd5f43) => v_fd5f43.user);
  const v_b113dd = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser);
  const v_1e752a = v_b4902e((v_fd5f43) => v_fd5f43.follows);
  const v_3094d4 = v_b4902e((v_fd5f43) => v_fd5f43.toggleFollow);
  const v_b30b81 = v_b4902e((v_fd5f43) => v_fd5f43.isFollowing);

  const v_0c8987 = v_f38ee5?.id ?? v_b9d568;
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_f4fb5e = v_b113dd?.email ?? null;

  const v_7aa778 = v_8a85e2(v_f4fb5e);
  const [v_002f27, v_ff797f] = v_5ab095<v_17d27f[] | null>(null);

  const [v_612e9f, v_575aad] = v_5ab095(false);
  const [v_648441, v_d39e16] = v_5ab095(0);

  const v_936ba7 =
    v_ae4cf5 + (v_648441 > 0 ? Math.max(0, v_700696.get("window").height - v_648441) : 0);
  const v_0cde43 = async () => {
    if (!v_2ca7e0) return;
    v_575aad(true);
    try {
      if (v_7aa778) {
        const v_8f00b9 = await v_e36429(v_2ca7e0);
        v_ff797f(v_8f00b9?.items ?? []);
      }

    } finally {
      v_575aad(false);
    }
  };

  v_08bca5(() => {
    if (!v_7aa778 || !v_2ca7e0) return;
    void v_e36429(v_2ca7e0).then((v_8f00b9) => {
      if (v_8f00b9) v_ff797f(v_8f00b9.items);
    });
  });

  v_c4deb2(() => {
    if (!v_7aa778 || !v_2ca7e0) {
      v_ff797f(null);
      return;
    }
    let v_2008a4 = false;
    (async () => {
      const v_8f00b9 = await v_e36429(v_2ca7e0);
      if (!v_2008a4) v_ff797f(v_8f00b9?.items ?? []);
    })();
    return () => {
      v_2008a4 = true;
    };
  }, [v_7aa778, v_2ca7e0]);

  v_cf763b(
    v_de06a3(() => {
      if (!v_7aa778 || !v_2ca7e0) return;
      let v_2008a4 = false;
      const v_f6f5de = async () => {
        const v_8f00b9 = await v_e36429(v_2ca7e0);
        if (!v_2008a4) v_ff797f(v_8f00b9?.items ?? []);
      };
      void v_f6f5de();

      const v_826279 = setTimeout(() => void v_f6f5de(), 1200);
      return () => {
        v_2008a4 = true;
        clearTimeout(v_826279);
      };
    }, [v_7aa778, v_2ca7e0]),
  );

  const v_7cf37a = async (v_6e0fd3, v_c09aa8) => {
    try {
      const v_7d5f12 = await v_003cf2(v_6e0fd3, v_2ca7e0 ?? undefined);
      const v_3f4e2e = v_7d5f12.clone;
      v_f4c991.navigate("CloneFeed", {
        openComments: true,
        feed: {
          id: v_c09aa8 && v_c09aa8 > 0 ? v_c09aa8 : -v_3f4e2e.id,
          cloneId: v_3f4e2e.id,
          content: v_3f4e2e.description ?? "",
          mediaUrl: v_3f4e2e.avatarUrl,
          mediaType: null,
          likesCount: v_3f4e2e.stats?.likes ?? 0,
          commentsCount: v_3f4e2e.stats?.comments ?? 0,
          likedByMe: v_3f4e2e.likedByMe ?? false,
          createdAt: v_3f4e2e.createdAt,
          clone: {
            id: v_3f4e2e.id,
            ownerId: v_3f4e2e.ownerId,
            name: v_3f4e2e.name,
            username: v_3f4e2e.username,
            avatarUrl: v_3f4e2e.avatarUrl,
            cloneType: v_3f4e2e.cloneType as never,
            visibility: v_3f4e2e.visibility as never,
          },
          interests: [],
        },
      });
    } catch (v_49263d) {
      console.warn("[Following] openCloneFeed failed:", v_49263d);
    }
  };

  const [v_d92a4c, v_44191e] = v_5ab095<v_c33ae3[] | null>(null);
  v_cf763b(
    v_de06a3(() => {
      let v_2008a4 = false;
      const v_43e90c = v_b113dd?.id;
      if (!v_2ca7e0 || !v_43e90c) {
        v_44191e(null);
        return;
      }
      console.log(`[Following] fetch start userId=${v_43e90c}`);
      v_7281a5(v_2ca7e0, v_43e90c)
        .then((v_cb35cb) => {
          if (!v_2008a4) {
            console.log(
              `[Following] followedClones ← ${v_cb35cb.items.length} items`,
              v_cb35cb.items.map((v_23805a) => ({
                id: v_23805a.id,
                name: v_23805a.name,
                isOwn: v_23805a.isOwn, 
                "stats.likes": v_23805a.stats?.likes,
                "stats.comments": v_23805a.stats?.comments,
                "latestFeed.feedId": v_23805a.latestFeed?.feedId,
                "latestFeed.likedByMe": v_23805a.latestFeed?.likedByMe,

                "my.chat": v_23805a.myInteractions?.chat,
                "my.call": v_23805a.myInteractions?.call,
                "my.learn": v_23805a.myInteractions?.learn,
                "my.feed": v_23805a.myInteractions?.feed,
                "my.total": v_23805a.myInteractions?.total,
                "my.intimacy": v_23805a.myInteractions?.intimacy,
              })),
            );
            v_44191e(v_cb35cb.items);
          }
        })
        .catch((v_49263d) => {
          console.warn("[Following] listMyFollowedClones failed:", v_49263d);
        });
      return () => {
        v_2008a4 = true;
      };
    }, [v_2ca7e0, v_b113dd?.id]),
  );

  const v_a48e44 = v_df9f57<FollowedPersona[]>(() => {
    if (v_d92a4c != null) {
      return v_d92a4c.map((v_3f4e2e) => {

        const v_8fc8f0 = v_3f4e2e.myInteractions;
        const v_db07f5 = v_8fc8f0 ? v_8fc8f0.total : v_c8b54a(v_3f4e2e.stats);
        const v_b74b9c = v_8fc8f0 ? v_8fc8f0.intimacy : Math.min(100, Math.floor(v_db07f5 / 50));
        return {
          id: v_3f4e2e.id,
          name: v_3f4e2e.name,
          avatar: v_3f4e2e.avatarUrl ?? "",
          interests: v_3f4e2e.interests ?? [],
          creatorAccount: `@${v_3f4e2e.username}`,
          intimacy: v_b74b9c,
          interactions: v_db07f5,
          isOwn: v_3f4e2e.isOwn,
        };
      });
    }

    if (v_2ca7e0) return [];
    const v_52c0ef = v_1e752a
      .filter((v_8b5cd8) => v_8b5cd8.followerUserId === v_0c8987)
      .map((v_8b5cd8) => v_8b5cd8.followingCloneId);
    return v_52c0ef
      .map((v_062ae9) => v_694b7f.clones().find((v_3f4e2e) => v_3f4e2e.id === v_062ae9))
      .filter((v_3f4e2e): v_3f4e2e is v_4b85a1 => Boolean(v_3f4e2e))
      .map((v_eb25ce) => {
        const v_257b90 = v_694b7f.users().find((v_ceb55a) => v_ceb55a.id === v_eb25ce.ownerId);
        return v_986943(v_eb25ce, v_257b90?.handle);
      });
  }, [v_d92a4c, v_2ca7e0, v_1e752a, v_0c8987]);

  const v_632473 = v_df9f57<v_bc3df4[]>(() => {
    if (v_d92a4c != null) {
      return v_d92a4c.map((v_3f4e2e) => {
        const v_6bbace = v_3f4e2e.latestFeed?.feedId ?? null;

        let v_41b99d = v_3f4e2e.description ?? "";

        const v_167615 = /#[a-zA-Z0-9_가-힣ᄀ-ᇿㄱ-ㆎ]+/.test(v_41b99d);
        const v_ac0b78 = v_3f4e2e.interests ?? [];
        if (!v_167615 && v_ac0b78.length > 0) {
          const v_cf5673 = v_ac0b78.map((v_ebec57) => `#${v_ebec57}`).join(" ");
          v_41b99d = v_41b99d.trim().length > 0 ? `${v_41b99d} ${v_cf5673}` : v_cf5673;
        }
        return {
          id: v_6bbace ?? -v_3f4e2e.id, 
          cloneId: v_3f4e2e.id,
          content: v_41b99d,
          mediaUrl: v_3f4e2e.avatarUrl ?? undefined,
          mediaType: null,

          likesCount: v_3f4e2e.stats.likes ?? 0,
          createdAt: v_3f4e2e.createdAt,
        };
      });
    }
    const v_da0fb9 = new Set(v_a48e44.map((v_e2a85c) => v_e2a85c.id));
    return v_694b7f.feeds()
      .filter((v_8b5cd8) => v_da0fb9.has(v_8b5cd8.cloneId))
      .slice()
      .sort((v_779914, v_148ff6) => v_148ff6.createdAt.localeCompare(v_779914.createdAt));
  }, [v_d92a4c, v_a48e44]);

  const v_27a256 = v_df9f57(() => {
    const v_8dcb51 = new Map<number, { likesCount: number; commentsCount: number; likedByMe: boolean }>();
    if (v_d92a4c) {
      for (const v_3f4e2e of v_d92a4c) {
        v_8dcb51.set(v_3f4e2e.id, {
          likesCount: v_3f4e2e.stats.likes ?? 0,
          commentsCount: v_3f4e2e.stats.comments ?? 0,
          likedByMe: v_3f4e2e.latestFeed?.likedByMe ?? false,
        });
      }
    }
    return v_8dcb51;
  }, [v_d92a4c]);

  const [v_69ddfb, v_09b78b] = v_5ab095(v_8d41d7("feed.categoryAll"));

  const [v_9e799c, v_d69724] = v_5ab095("");

  type SortMode = "recent" | "intimacy" | "intimacyAsc" | "name";
  const [v_5e8330, v_1db134] = v_5ab095<SortMode>("recent");
  const [v_557d00, v_538ca9] = v_5ab095(false);
  const v_904373 = {
    recent: v_8d41d7("chat.sortRecent", { defaultValue: "최근 대화순" }),
    intimacy: v_8d41d7("chat.sortIntimacy", { defaultValue: "친밀도 높은 순" }),
    intimacyAsc: v_8d41d7("chat.sortIntimacyAsc", { defaultValue: "친밀도 낮은 순" }),
    name: v_8d41d7("chat.sortName", { defaultValue: "이름순" }),
  };

  const [v_c591dc, v_6f4b5a] = v_5ab095<Set<number>>(new Set());

  const [v_211631, v_40f767] = v_5ab095<Map<number, { likes: number; comments: number }>>(
    new Map(),
  );

  v_c4deb2(() => {
    if (!v_d92a4c) return;
    const v_a448ad = new Set<number>();
    for (const v_3f4e2e of v_d92a4c) {
      if (v_3f4e2e.latestFeed?.likedByMe) v_a448ad.add(v_3f4e2e.id);
    }
    v_6f4b5a(v_a448ad);
  }, [v_d92a4c]);

  const [v_ff35ff, v_1cbbfc] = v_5ab095<Set<number>>(new Set());
  v_c4deb2(() => {
    if (!v_d92a4c) return;
    v_1cbbfc(new Set(v_d92a4c.map((v_3f4e2e) => v_3f4e2e.id)));
  }, [v_d92a4c]);
  const v_57f5a9 = (v_6e0fd3) => v_ff35ff.has(v_6e0fd3);
  const v_a87aaa = async (v_6e0fd3) => {

    v_1cbbfc((v_ba2215) => {
      const v_a448ad = new Set(v_ba2215);
      v_a448ad.has(v_6e0fd3) ? v_a448ad.delete(v_6e0fd3) : v_a448ad.add(v_6e0fd3);
      return v_a448ad;
    });
    await v_3094d4(v_6e0fd3); 
  };

  const [v_5c83d5, v_880166] = v_5ab095<number | null>(null);
  const [v_48e7fe, v_856f84] = v_5ab095("");
  const [v_7babe8, v_cdeef7] = v_5ab095<number | null>(null);

  const [v_821fc1, v_5da0f8] = v_5ab095<{
    cloneId: number;
    cloneName: string;
  } | null>(null);

  const v_c7daf6 = v_2d8264<v_ee3714<v_97a9a8, "ShortsTab">>();
  const v_3bde32 = v_e662ae<number | null>(null);
  v_c4deb2(() => {
    const v_062ae9 = v_c7daf6.params?.openIntimacyCloneId;
    if (!v_062ae9 || v_3bde32.current === v_062ae9) return;
    const v_5ed063 = v_a48e44.find((v_e2a85c) => v_e2a85c.id === v_062ae9);
    v_3bde32.current = v_062ae9;
    v_5da0f8({ cloneId: v_062ae9, cloneName: v_5ed063?.name ?? "" });
  }, [v_c7daf6.params?.openIntimacyCloneId, v_a48e44]);
  const [v_077f23, v_e7ff11] =
    v_5ab095<v_6349d0 | null>(null);
  const [v_34e317, v_6ade47] = v_5ab095(false);

  const [v_cde897, v_8d30d7] = v_5ab095(false);
  const [v_af84de, v_22a5cb] = v_5ab095(false);
  const [v_2116d2, v_83f9d3] = v_5ab095("");
  const [v_8282fa, v_15c939] = v_5ab095<string | null>(null);

  v_c4deb2(() => {
    if (!v_821fc1) {
      v_e7ff11(null);
      return;
    }
    if (!v_2ca7e0) return;
    let v_2008a4 = false;
    v_6ade47(true);
    v_e7ff11(null);
    v_8ce643(v_2ca7e0, v_821fc1.cloneId, { limit: 100 })
      .then((v_8f00b9) => {
        if (v_2008a4) return;
        v_e7ff11(v_8f00b9);
      })
      .catch((v_49263d) => {
        console.warn("[Following] listCloneIntimacyEvents failed:", v_49263d);
        if (!v_2008a4) v_e7ff11(null);
      })
      .finally(() => {
        if (!v_2008a4) v_6ade47(false);
      });
    return () => {
      v_2008a4 = true;
    };
  }, [v_821fc1, v_2ca7e0]);

  const v_0bbee6 = v_e662ae(0);
  const v_b96ea6 = v_e662ae(new v_a2349e.Value(0)).current; 

  const v_023642 = v_de06a3((e: v_bd64bf<v_da479e>) => {
    const v_c1c8c6 = v_9e86fd.nativeEvent.contentOffset.y;
    const v_a41a1b = v_c1c8c6 - v_0bbee6.current;
    if (v_a41a1b > 8 && v_c1c8c6 > 50) {

      v_a2349e.timing(v_b96ea6, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    } else if (v_a41a1b < -8) {

      v_a2349e.timing(v_b96ea6, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    }
    v_0bbee6.current = v_c1c8c6;
  }, [v_b96ea6]);

  const v_e541d8 = v_b96ea6.interpolate({ inputRange: [0, 1], outputRange: [0, 120] });

  v_c4deb2(() => {
    if (v_8282fa) {
      const v_8d41d7 = setTimeout(() => v_15c939(null), 2000);
      return () => clearTimeout(v_8d41d7);
    }
  }, [v_8282fa]);

  const v_8bc599 = v_df9f57(() => {
    const v_cf5673 = new Set<string>();
    v_a48e44.forEach((v_e2a85c) => v_e2a85c.interests.forEach((v_ebec57) => v_cf5673.add(v_ebec57)));
    return [v_8d41d7("feed.categoryAll"), ...Array.from(v_cf5673)];
  }, [v_a48e44]);

  const v_b94d82 = v_df9f57(() => {
    let v_e4cf17 = v_632473;
    if (v_69ddfb !== v_8d41d7("feed.categoryAll")) {
      const v_52e08b = v_a48e44
        .filter((v_e2a85c) => v_e2a85c.interests.includes(v_69ddfb))
        .map((v_e2a85c) => v_e2a85c.id);
      v_e4cf17 = v_e4cf17.filter((v_8b5cd8) => v_52e08b.includes(v_8b5cd8.cloneId));
    }
    return v_e4cf17
      .map((v_2db2a5) => {
        const v_5ed063 = v_a48e44.find((v_e2a85c) => v_e2a85c.id === v_2db2a5.cloneId);
        return v_5ed063 ? { feed: v_2db2a5, persona: v_5ed063 } : null;
      })
      .filter((v_62c214): v_62c214 is { feed: v_bc3df4; persona: FollowedPersona } =>
        Boolean(v_62c214),
      );
  }, [v_632473, v_69ddfb, v_a48e44]);

  const v_066fa2 = v_df9f57(() => {
    const v_ab6401 = v_9e799c.trim().toLowerCase();

    const v_055208 = new Map(v_a48e44.map((v_e2a85c) => [v_e2a85c.id, v_e2a85c.intimacy]));

    if (v_7aa778 && v_002f27 !== null) {
      const v_ef8ab1 = v_002f27
        .map((v_23805a) => {
          const v_38db88 = typeof v_23805a.intimacy === "number" ? v_23805a.intimacy : undefined;
          const v_747a24 = v_055208.get(v_23805a.clone.id);
          const v_b74b9c = Math.min(
            100,
            Math.max(0, v_38db88 ?? v_747a24 ?? 0),
          );
          const v_5ed063 = {
            id: v_23805a.clone.id,
            name: v_23805a.clone.name,
            avatar: v_23805a.clone.avatarUrl ?? "",
            interests: [],
            creatorAccount: "",
            intimacy: v_b74b9c,
            interactions: 0,
            isOwn: v_23805a.isMine,
          };
          const v_65e8ff =
            v_23805a.last?.type === "system" && v_23805a.last.kind
              ? v_c64cf7(
                  v_23805a.last.kind,
                  v_23805a.last.data,
                  v_23805a.clone.name,
                  v_8d41d7,
                  v_9c213b.language,
                )
              : null;
          const feed: v_bc3df4 | null = v_23805a.last
            ? ({
                id: -v_23805a.clone.id,
                cloneId: v_23805a.clone.id,
                content:
                  v_65e8ff ??
                  v_23805a.last.text ??
                  (v_23805a.last.type === "call"
                    ? v_8d41d7("chat.lastCallPreview", { defaultValue: "음성 통화" })
                    : ""),
                mediaUrl: v_23805a.clone.avatarUrl ?? undefined,
                mediaType: null,
                likesCount: 0,
                createdAt: new Date(v_23805a.last.at).toISOString(),
              } as v_bc3df4)
            : null;
          return { persona: v_5ed063, feed: v_2db2a5, unread: v_23805a.unreadCount };
        })
        .filter((v_3ac7e7) =>
          !v_ab6401
            ? true
            : v_3ac7e7.persona.name.toLowerCase().includes(v_ab6401) ||
              (v_3ac7e7.feed?.content ?? "").toLowerCase().includes(v_ab6401),
        );

      v_ef8ab1.sort((v_779914, v_148ff6) => {
        if (v_5e8330 === "intimacy") {
          return (v_148ff6.persona.intimacy || 0) - (v_779914.persona.intimacy || 0);
        }
        if (v_5e8330 === "intimacyAsc") {
          return (v_779914.persona.intimacy || 0) - (v_148ff6.persona.intimacy || 0);
        }
        if (v_5e8330 === "name") {
          return (v_779914.persona.name || "").localeCompare(v_148ff6.persona.name || "", "ko");
        }
        const v_d202ca = v_779914.feed?.createdAt ? new Date(v_779914.feed.createdAt).getTime() : 0;
        const v_afbf1c = v_148ff6.feed?.createdAt ? new Date(v_148ff6.feed.createdAt).getTime() : 0;
        if (v_afbf1c !== v_d202ca) return v_afbf1c - v_d202ca;
        return 0;
      });
      return v_ef8ab1;
    }

    const v_ef8ab1 = v_a48e44
      .filter((v_e2a85c) =>
        !v_ab6401
          ? true
          : v_e2a85c.name.toLowerCase().includes(v_ab6401) ||
            v_e2a85c.creatorAccount.toLowerCase().includes(v_ab6401),
      )
      .map((v_5ed063) => {
        const v_2db2a5 = v_632473.find((v_8b5cd8) => v_8b5cd8.cloneId === v_5ed063.id);
        return { persona: v_5ed063, feed: v_2db2a5 ?? null, unread: 0 };
      });
    v_ef8ab1.sort((v_779914, v_148ff6) => {
      if (v_5e8330 === "intimacy") {
        return (v_148ff6.persona.intimacy || 0) - (v_779914.persona.intimacy || 0);
      }
      if (v_5e8330 === "intimacyAsc") {
        return (v_779914.persona.intimacy || 0) - (v_148ff6.persona.intimacy || 0);
      }
      if (v_5e8330 === "name") {
        return (v_779914.persona.name || "").localeCompare(v_148ff6.persona.name || "", "ko");
      }
      const v_d202ca = v_779914.feed?.createdAt ? new Date(v_779914.feed.createdAt).getTime() : 0;
      const v_afbf1c = v_148ff6.feed?.createdAt ? new Date(v_148ff6.feed.createdAt).getTime() : 0;
      return v_afbf1c - v_d202ca;
    });
    return v_ef8ab1;
  }, [
    v_7aa778,
    v_002f27,
    v_a48e44,
    v_632473,
    v_9e799c,
    v_5e8330,
    v_8d41d7,
    v_9c213b.language,
  ]);

  const v_94f30e = v_df9f57(() => {
    if (!v_2116d2.trim()) return v_a48e44;
    const v_ab6401 = v_2116d2.toLowerCase();
    return v_a48e44.filter(
      (v_e2a85c) =>
        v_e2a85c.name.toLowerCase().includes(v_ab6401) ||
        v_e2a85c.creatorAccount.toLowerCase().includes(v_ab6401),
    );
  }, [v_2116d2, v_a48e44]);

  const v_936545 = async (v_6e0fd3, v_c09aa8) => {
    const v_d50832 = v_c591dc.has(v_6e0fd3);
    const v_d60f4b = !v_d50832;

    v_6f4b5a((v_ba2215) => {
      const v_fd5f43 = new Set(v_ba2215);
      v_d60f4b ? v_fd5f43.add(v_6e0fd3) : v_fd5f43.delete(v_6e0fd3);
      return v_fd5f43;
    });
    v_40f767((v_ba2215) => {
      const v_a448ad = new Map(v_ba2215);
      const v_c3bc75 = v_a448ad.get(v_6e0fd3) ?? { likes: 0, comments: 0 };
      v_a448ad.set(v_6e0fd3, { ...v_c3bc75, likes: v_c3bc75.likes + (v_d60f4b ? 1 : -1) });
      return v_a448ad;
    });
    if (!v_2ca7e0) return;
    try {
      if (v_c09aa8 > 0) {
        if (v_d60f4b) await v_de2a30(v_2ca7e0, v_c09aa8);
        else await v_11c954(v_2ca7e0, v_c09aa8);
      } else {
        if (v_d60f4b) await v_b14fce(v_2ca7e0, v_6e0fd3);
        else await v_0ff331(v_2ca7e0, v_6e0fd3);
      }
    } catch (v_49263d) {
      console.warn("[Following] toggleLike failed:", v_49263d);

      v_6f4b5a((v_ba2215) => {
        const v_fd5f43 = new Set(v_ba2215);
        v_d50832 ? v_fd5f43.add(v_6e0fd3) : v_fd5f43.delete(v_6e0fd3);
        return v_fd5f43;
      });
      v_40f767((v_ba2215) => {
        const v_a448ad = new Map(v_ba2215);
        const v_c3bc75 = v_a448ad.get(v_6e0fd3) ?? { likes: 0, comments: 0 };
        v_a448ad.set(v_6e0fd3, { ...v_c3bc75, likes: v_c3bc75.likes - (v_d60f4b ? 1 : -1) });
        return v_a448ad;
      });
    }
  };

  const v_2d8ccb = async () => {
    if (v_7babe8) {
      await v_3094d4(v_7babe8);
      v_cdeef7(null);
    }
  };

  const v_f5f393 = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser?.id ?? v_fd5f43.user?.id ?? null);
  const [v_cc8bc2, v_502f4e] = v_5ab095<v_52af9d[]>([]);
  const [v_465030, v_856daf] = v_5ab095(false);
  v_c4deb2(() => {
    if (v_5c83d5 == null) {
      v_502f4e([]);
      return;
    }
    if (v_5c83d5 < 0) {
      v_502f4e([]);
      return;
    }
    let v_2008a4 = false;
    v_856daf(true);
    v_502f4e([]);
    v_4208e7(v_5c83d5, { limit: 100 })
      .then((v_8f00b9) => {
        if (v_2008a4) return;
        v_502f4e(v_8f00b9.items);
      })
      .catch((v_49263d) => {
        console.warn("[Following] listFeedComments failed:", v_49263d);
        if (!v_2008a4) v_502f4e([]);
      })
      .finally(() => {
        if (!v_2008a4) v_856daf(false);
      });
    return () => {
      v_2008a4 = true;
    };
  }, [v_5c83d5]);

  const v_4c2809 = v_e662ae(false);
  const [v_b0af20, v_52390e] = v_5ab095(false);
  const v_8e4668 = async () => {
    if (v_5c83d5 == null) return;
    if (v_4c2809.current) return; 
    const v_b43b74 = v_48e7fe.trim();
    if (!v_b43b74 || !v_2ca7e0) return;
    v_4c2809.current = true;
    v_52390e(true);
    try {
      let v_6bbace;
      let v_ab5234;
      if (v_5c83d5 < 0) {
        const v_6e0fd3 = -v_5c83d5;
        v_ab5234 = v_6e0fd3;
        const v_8f00b9 = await v_6f689a(v_2ca7e0, v_6e0fd3, v_b43b74);
        v_6bbace = v_8f00b9.comment.feedId;
        v_880166(v_6bbace);
      } else {
        await v_3f8bc7(v_2ca7e0, v_5c83d5, v_b43b74);
        v_6bbace = v_5c83d5;

        const v_5d7203 = v_d92a4c?.find((v_3f4e2e) => v_3f4e2e.latestFeed?.feedId === v_5c83d5);
        v_ab5234 = v_5d7203?.id ?? -1;
      }
      v_856f84("");
      const v_cb35cb = await v_4208e7(v_6bbace, { limit: 100 });
      v_502f4e(v_cb35cb.items);

      if (v_ab5234 > 0) {
        v_40f767((v_ba2215) => {
          const v_a448ad = new Map(v_ba2215);
          const v_c3bc75 = v_a448ad.get(v_ab5234) ?? { likes: 0, comments: 0 };
          v_a448ad.set(v_ab5234, { ...v_c3bc75, comments: v_c3bc75.comments + 1 });
          return v_a448ad;
        });
      }
    } catch (v_49263d) {
      console.warn("[Following] postFeedComment failed:", v_49263d);
    } finally {
      v_4c2809.current = false;
      v_52390e(false);
    }
  };

  const v_b72645 = (v_d91518) => {
    if (v_5c83d5 == null || v_5c83d5 < 0 || !v_2ca7e0) return;
    v_889fad(
      v_8d41d7("home.commentDeleteTitle"),
      v_8d41d7("home.commentDeleteDesc"),
      [
        { text: v_8d41d7("common.cancel"), style: "cancel" },
        {
          text: v_8d41d7("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await v_0df337(v_2ca7e0, v_5c83d5, v_d91518);
              v_502f4e((v_ba2215) => v_ba2215.filter((v_3f4e2e) => v_3f4e2e.id !== v_d91518));

              const v_5d7203 = v_d92a4c?.find(
                (v_3f4e2e) => v_3f4e2e.latestFeed?.feedId === v_5c83d5,
              );
              if (v_5d7203) {
                v_40f767((v_ba2215) => {
                  const v_a448ad = new Map(v_ba2215);
                  const v_c3bc75 = v_a448ad.get(v_5d7203.id) ?? { likes: 0, comments: 0 };
                  v_a448ad.set(v_5d7203.id, { ...v_c3bc75, comments: v_c3bc75.comments - 1 });
                  return v_a448ad;
                });
              }
            } catch (v_49263d) {
              console.warn("[Following] deleteFeedComment failed:", v_49263d);
            }
          },
        },
      ],
    );
  };

  const v_003a57 = v_e662ae<v_f708aa | null>(null);
  const v_19e10d = (v_6e0fd3, v_893b61) => {
    v_889fad(
      v_8d41d7("chat.leaveTitle", { defaultValue: "대화방 나가기" }),
      v_9d1db1(v_8d41d7, v_893b61),
      [
        { text: v_8d41d7("common.cancel", { defaultValue: "취소" }), style: "cancel" },
        {
          text: v_8d41d7("chat.leaveAction", { defaultValue: "나가기" }),
          style: "destructive",
          onPress: () => {
            void (async () => {
              if (!v_2ca7e0) return;
              try {
                const v_cb35cb = await v_8be472(v_6e0fd3, v_2ca7e0);
                if (v_cb35cb.unsubscribed) await v_b4902e.getState().unfollowLocalForBlock(v_6e0fd3);
                v_ff797f((v_ba2215) => (v_ba2215 ? v_ba2215.filter((v_3f4e2e) => v_3f4e2e.clone.id !== v_6e0fd3) : v_ba2215));
              } catch (v_49263d) {
                console.warn("[Following] leave failed:", (v_49263d as Error)?.message ?? v_49263d);
                v_889fad(
                  v_8d41d7("chat.leaveFailTitle", { defaultValue: "나가지 못했어요" }),
                  v_8d41d7("common.retryLater", { defaultValue: "잠시 후 다시 시도해 주세요." }),
                );
              }
            })();
          },
        },
      ],
    );
  };

  const v_4a5736 = ({ item: v_8c0b26 }: { item: (typeof v_066fa2)[0]; index: number }) => {
    const v_1833e7 = v_8c0b26.persona.name;
    const v_4d4e6b = v_1833e7.charAt(0) || "?";

    const v_cf0109 = (v_8c0b26.feed?.content ?? "").trim();
    const v_375a17 = v_8c0b26.feed?.createdAt ? v_bfd883(v_8c0b26.feed.createdAt) : "";
    const v_a78249 = v_8c0b26.unread ?? 0;

    const v_6629cb = () => {

      v_ff797f((v_ba2215) =>
        v_ba2215 ? v_ba2215.map((v_3f4e2e) => (v_3f4e2e.clone.id === v_8c0b26.persona.id ? { ...v_3f4e2e, unreadCount: 0 } : v_3f4e2e)) : v_ba2215,
      );
      v_f4c991.navigate("Chat", {
        cloneId: v_8c0b26.persona.id,
        name: v_8c0b26.persona.name,
        image: v_8c0b26.persona.avatar,
      });
    };
    const v_c1d70c = async () => {

      const v_3ed4c3 = await v_84d546(v_2ca7e0, () => {});
      if (!v_3ed4c3) return;
      v_38f9da({ cloneId: v_8c0b26.persona.id, name: v_8c0b26.persona.name, source: "following" });
      v_f4c991.navigate("Call", {
        cloneId: v_8c0b26.persona.id,
        name: v_8c0b26.persona.name,
        image: v_8c0b26.persona.avatar,
      });
    };

    const v_893b61 = !v_8c0b26.persona.isOwn && v_b30b81(v_8c0b26.persona.id);
    let rowSwipe: v_f708aa | null = null;
    const v_e513d1 = () => {
      v_11a32e?.close();
      v_19e10d(v_8c0b26.persona.id, v_893b61);
    };
    return (
      <Swipeable
        ref={(v_cb35cb) => { v_11a32e = v_cb35cb; }}
        friction={1.6}
        rightThreshold={36}
        overshootRight={false}

        onSwipeableWillOpen={() => {
          if (v_003a57.current && v_003a57.current !== v_11a32e) v_003a57.current.close();
          v_003a57.current = v_11a32e;
        }}
        renderRightActions={(v_4bbc2f, v_29031c) => {

          const v_a37637 = v_29031c.interpolate({ inputRange: [-v_658217, -24, 0], outputRange: [1, 0.7, 0.5], extrapolate: "clamp" });
          const v_df9f11 = v_29031c.interpolate({ inputRange: [-v_658217, -24, 0], outputRange: [1, 0.5, 0], extrapolate: "clamp" });
          return (
            <View style={v_fd5f43.msgLeaveWrap}>
              <Animated.View style={{ transform: [{ scale: v_a37637 }], opacity: v_df9f11 }}>
                <TouchableOpacity
                  style={v_fd5f43.msgLeaveBtn}
                  onPress={v_e513d1}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={v_8d41d7("chat.leaveAction", { defaultValue: "나가기" })}
                >
                  <Feather name="log-out" size={20} color="#FFFFFF" />
                  <Text style={v_fd5f43.msgLeaveBtnText}>{v_8d41d7("chat.leaveAction", { defaultValue: "나가기" })}</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          );
        }}
      >
      <TouchableOpacity style={v_fd5f43.msgRow} activeOpacity={0.7} onPress={v_6629cb} onLongPress={v_e513d1}>
        {

}
        <View style={v_fd5f43.msgAvatarWrap}>
          <View style={[v_fd5f43.msgAvatar, v_fd5f43.msgAvatarFallback]}>
            <Text style={v_fd5f43.msgAvatarInitial}>{v_4d4e6b}</Text>
          </View>
          {v_8c0b26.persona.avatar ? (
            <Image
              source={{ uri: v_8c0b26.persona.avatar }}
              style={[v_fd5f43.msgAvatar, { position: "absolute", top: 0, left: 0 }]}
            />
          ) : null}
        </View>

        {}
        <View style={v_fd5f43.msgBody}>
          <Text style={v_fd5f43.msgName} numberOfLines={1}>{v_1833e7}</Text>
          <Text style={v_fd5f43.msgSub} numberOfLines={2}>{v_cf0109}</Text>
        </View>

        {}
        <View style={v_fd5f43.msgRight}>
          <Text style={v_fd5f43.msgTime} numberOfLines={1}>{v_375a17}</Text>
          <View style={v_fd5f43.msgRightBottomRow}>
            {v_a78249 > 0 ? (
              <View style={v_fd5f43.msgUnreadBadge}>
                <Text style={v_fd5f43.msgUnreadText}>{v_a78249 > 99 ? "99+" : v_a78249}</Text>
              </View>
            ) : null}
            <TouchableOpacity
              style={v_fd5f43.msgCallBtn}
              onPress={v_c1d70c}
              hitSlop={8}
              accessibilityLabel="video-call"
            >
              <Feather name="video" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
      </Swipeable>
    );
  };

  const v_bdaeb6 = ({ item: v_8c0b26 }: { item: (typeof v_b94d82)[0] }) => {
    const v_afeceb = v_8c0b26.feed.mediaUrl ?? v_8c0b26.persona.avatar;
    return (
      <View style={v_fd5f43.postWrap}>
        {}
        <View style={v_fd5f43.imageWrap}>
          <Image source={{ uri: v_afeceb }} style={v_fd5f43.postImage} resizeMode="cover" />

          {}
          <View style={v_fd5f43.statsBadge}>
            <TouchableOpacity
              style={v_fd5f43.badgeBtn}
              onPress={() =>
                v_5da0f8({
                  cloneId: v_8c0b26.persona.id,
                  cloneName: v_8c0b26.persona.name,
                })
              }
            >
              <Feather name="thermometer" size={12} color="#fb923c" />
              <Text style={v_fd5f43.badgeText}>{v_8c0b26.persona.intimacy}</Text>
            </TouchableOpacity>
            {
}
            <View style={v_fd5f43.badgeDivider} />
            <TouchableOpacity
              style={v_fd5f43.badgeBtn}
              onPress={() => v_880166(v_8c0b26.feed.id)}
            >
              <Feather name="message-circle" size={12} color="#34d399" />
              <Text style={v_fd5f43.badgeText}>
                {(v_27a256.get(v_8c0b26.persona.id)?.commentsCount ?? 0) +
                  (v_211631.get(v_8c0b26.persona.id)?.comments ?? 0)}
              </Text>
            </TouchableOpacity>
          </View>

          {}
          <View style={v_fd5f43.overlayContent}>
            <Text style={v_fd5f43.personaName}>{v_8c0b26.persona.name}</Text>
            {v_8c0b26.persona.creatorAccount ? (
              <Text style={v_fd5f43.creatorAccount}>{v_8c0b26.persona.creatorAccount}</Text>
            ) : null}
            {

}
            <HashtagText style={v_fd5f43.postContent}>
              {v_8c0b26.feed.content}
            </HashtagText>
            <View style={v_fd5f43.overlayBtns}>
              <Button
                title={v_8d41d7("feed.actionCall")}
                variant="secondary"
                size="md"
                leftIcon={<Feather name="video" size={14} color={v_1bfbd0.zinc900} />}
                onPress={async () => {

                  const v_3ed4c3 = await v_84d546(v_2ca7e0, () => {});
                  if (!v_3ed4c3) return;
                  v_38f9da({ cloneId: v_8c0b26.persona.id, name: v_8c0b26.persona.name, source: "following-card" });
                  v_f4c991.navigate("Call", {
                    cloneId: v_8c0b26.persona.id,
                    name: v_8c0b26.persona.name,
                    image: v_8c0b26.persona.avatar,
                  });
                }}
                style={v_fd5f43.overlayBtn}
                textColor={v_1bfbd0.zinc900}
                backgroundColor={v_1bfbd0.white}
              />
              {(() => {

                if (v_8c0b26.persona.isOwn) return null;
                const v_10387a = v_57f5a9(v_8c0b26.persona.id);
                return (
                  <Button
                    title={v_10387a ? v_8d41d7("feed.following") : v_8d41d7("feed.follow")}
                    variant="ghost"
                    size="md"
                    leftIcon={
                      <Feather
                        name={v_10387a ? "user-check" : "user-plus"}
                        size={14}
                        color={v_1bfbd0.white}
                      />
                    }
                    onPress={() => void v_a87aaa(v_8c0b26.persona.id)}
                    style={{ ...v_fd5f43.overlayBtn, ...v_fd5f43.overlayBtnGhost }}
                    textColor={v_1bfbd0.white}
                    backgroundColor={v_10387a ? "rgba(255,255,255,0.2)" : v_1bfbd0.primary}
                  />
                );
              })()}
            </View>
          </View>
        </View>

      </View>
    );
  };

  return (

    <View style={v_fd5f43.screen} onLayout={(v_9e86fd) => v_d39e16(v_9e86fd.nativeEvent.layout.height)}>
    <SafeView backgroundColor={v_1bfbd0.white} showBottomBackground={false}>
      <PageHeader
        title={v_8d41d7("chat.listTitle", { defaultValue: "대화목록" })}
        hideBorder
        titleStyle={{ fontSize: 28, fontWeight: "800", color: "#1A253D" }}
        rightAction={<NotificationBell />}
      />

      {}
      <FlatList
        data={v_066fa2}
        keyExtractor={(v_8c0b26) => String(v_8c0b26.persona.id)}
        renderItem={v_4a5736}
        contentContainerStyle={[v_fd5f43.msgListContent, { paddingBottom: v_936ba7 }]}

        removeClippedSubviews={false}
        showsVerticalScrollIndicator={false}
        onScroll={v_023642}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={v_612e9f}
            onRefresh={v_0cde43}
            tintColor={v_1bfbd0.secondary}
            colors={[v_1bfbd0.secondary]}
          />
        }
        ListHeaderComponent={
          <View>
            {}
            <View style={v_fd5f43.subSearchBar}>
              <Feather name="search" size={18} color={v_1bfbd0.zinc500} />
              <TextInput
                style={v_fd5f43.subSearchInput}
                value={v_9e799c}
                onChangeText={v_d69724}
                placeholder={v_8d41d7("common.search")}
                placeholderTextColor={v_1bfbd0.zinc400}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {v_9e799c.length > 0 && (
                <TouchableOpacity onPress={() => v_d69724("")} hitSlop={8}>
                  <Feather name="x-circle" size={18} color={v_1bfbd0.zinc400} />
                </TouchableOpacity>
              )}
            </View>
            {
}
            <PangleBannerAd adUnitId={v_60086b("messages")} style={v_fd5f43.subAdBanner} />
            {}
            <View style={v_fd5f43.subSectionHeader}>
              <Text style={v_fd5f43.subSectionCount}>
                {v_8d41d7("chat.listCount", {
                  defaultValue: "대화목록 {{count}}",
                  count: v_066fa2.length,
                })}
              </Text>
              <TouchableOpacity hitSlop={8} onPress={() => v_538ca9(true)}>
                <Text style={v_fd5f43.subSectionSort}>
                  {v_904373[v_5e8330]} <Feather name="chevron-down" size={12} color={v_1bfbd0.zinc600} />
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={v_fd5f43.emptyWrap}>
            <Feather name="message-circle" size={48} color={v_1bfbd0.zinc300} />
            <Text style={v_fd5f43.emptyTitle}>{v_8d41d7("feed.followingEmpty")}</Text>
            <Text style={v_fd5f43.emptyDesc}>{v_8d41d7("feed.followingEmptyHint")}</Text>
          </View>
        }
      />

      {

}

      {}
      <Modal
        visible={!!v_821fc1}
        transparent
        animationType="slide"
        onRequestClose={() => v_5da0f8(null)}
      >
        {}
        <View style={v_fd5f43.bottomOverlay}>
          <Pressable style={v_472849.absoluteFill} onPress={() => v_5da0f8(null)} />
          <SwipeDownSheet
            onClose={() => v_5da0f8(null)}
            style={[v_fd5f43.eventsSheet, { paddingBottom: 32 + v_2b650d }]}
          >
            <View style={v_fd5f43.eventsSheetHandle} />
            <View style={v_fd5f43.eventsSheetTitleRow}>
              <View style={{ width: 28 }} />
              <Text style={v_fd5f43.eventsSheetTitle}>{v_8d41d7("feed.eventsTitle")}</Text>
              {}
              <TouchableOpacity
                onPress={() => v_8d30d7(true)}
                hitSlop={8}
                style={{ width: 28, alignItems: "flex-end" }}
              >
                <Feather name="help-circle" size={20} color={v_1bfbd0.zinc400} />
              </TouchableOpacity>
            </View>
            {}

            {v_077f23?.summary && (
              <View style={v_fd5f43.eventsSummary}>
                <View style={v_fd5f43.eventsSummaryRow}>
                  <Feather name="thermometer" size={20} color="#fb923c" />
                  <Text style={v_fd5f43.eventsSummaryScore}>
                    {Math.min(100, v_077f23.summary.totalScore)}°C
                  </Text>
                  <Text style={v_fd5f43.eventsSummaryCount}>
                    · {v_8d41d7("feed.summaryCount", { n: v_077f23.summary.eventCount })}
                  </Text>
                </View>
                <View style={v_fd5f43.eventsBreakdownRow}>
                  <Text style={v_fd5f43.eventsBreakdownItem}>{v_8d41d7("feed.summaryLabelChat")} <Text style={v_fd5f43.eventsBreakdownVal}>{v_077f23.summary.chat}°C</Text></Text>
                  <Text style={v_fd5f43.eventsBreakdownItem}>{v_8d41d7("feed.summaryLabelCall")} <Text style={v_fd5f43.eventsBreakdownVal}>{v_077f23.summary.call}°C</Text></Text>
                  <Text style={v_fd5f43.eventsBreakdownItem}>{v_8d41d7("feed.summaryLabelLearn")} <Text style={v_fd5f43.eventsBreakdownVal}>{v_077f23.summary.learn}°C</Text></Text>
                  <Text style={v_fd5f43.eventsBreakdownItem}>{v_8d41d7("feed.summaryLabelFeed")} <Text style={v_fd5f43.eventsBreakdownVal}>{v_077f23.summary.feed}°C</Text></Text>
                </View>
              </View>
            )}

            <ScrollView
              style={v_fd5f43.eventsScrollArea}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {v_34e317 ? (
                <ActivityIndicator color={v_1bfbd0.zinc500} style={{ paddingVertical: 24 }} />
              ) : !v_077f23 || v_077f23.items.length === 0 ? (
                <View style={{ paddingVertical: 24, alignItems: "center" }}>
                  <Text style={{ color: v_1bfbd0.zinc500, fontSize: 13 }}>{v_8d41d7("feed.emptyEvents")}</Text>
                </View>
              ) : (
                v_077f23.items.map((v_1d299c) => {
                  const META: Record<
                    "chat" | "call" | "learn" | "feed",
                    { label: string; icon: keyof typeof v_dec439.glyphMap; color: string }
                  > = {
                    chat: { label: v_8d41d7("feed.actionLabelChat"), icon: "message-circle", color: "#60a5fa" },
                    call: { label: v_8d41d7("feed.actionLabelCall"), icon: "phone", color: "#34d399" },
                    learn: { label: v_8d41d7("feed.actionLabelLearn"), icon: "search", color: "#a78bfa" },
                    feed: { label: v_8d41d7("feed.actionLabelFeed"), icon: "heart", color: "#ef4444" },
                  };
                  const v_ab4c96 = v_afc1e0[v_1d299c.action];
                  return (
                    <View key={v_1d299c.id} style={v_fd5f43.eventRow}>
                      <View style={[v_fd5f43.eventIcon, { backgroundColor: v_ab4c96.color + "22" }]}>
                        <Feather name={v_ab4c96.icon} size={14} color={v_ab4c96.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={v_fd5f43.eventLabel}>{v_ab4c96.label}</Text>
                        <Text style={v_fd5f43.eventTime}>{v_bfd883(v_1d299c.createdAt)}</Text>
                      </View>
                      <Text style={v_fd5f43.eventScore}>+{v_1d299c.score}°C</Text>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </SwipeDownSheet>
        </View>
      </Modal>

      {}
      <Modal
        visible={v_cde897}
        transparent
        animationType="fade"
        onRequestClose={() => v_8d30d7(false)}
      >
        <Pressable
          style={v_fd5f43.centerOverlay}
          onPress={() => v_8d30d7(false)}
        >
          <Pressable style={v_fd5f43.infoBox} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <View style={v_fd5f43.infoHeader}>
              <View style={v_fd5f43.infoHeaderLeft}>
                <Feather name="thermometer" size={18} color="#fb923c" />
                <Text style={v_fd5f43.infoTitle}>{v_8d41d7("feed.intimacyInfoTitle")}</Text>
              </View>
              <TouchableOpacity onPress={() => v_8d30d7(false)}>
                <Feather name="x" size={20} color={v_1bfbd0.zinc400} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              <Text style={v_fd5f43.infoSectionTitleInline}>{v_8d41d7("feed.intimacyTempSectionLabel")}</Text>
              <Text style={v_fd5f43.infoDescInline}>{v_8d41d7("feed.intimacyTempShortDesc")}</Text>
              {[
                ["0-30°C", v_8d41d7("feed.intimacyL1")],
                ["31-60°C", v_8d41d7("feed.intimacyL2")],
                ["61-90°C", v_8d41d7("feed.intimacyL3")],
                ["91-100°C", v_8d41d7("feed.intimacyL4")],
              ].map(([v_4f2c9c, v_41b99d], v_ebec57) => (
                <View key={v_ebec57} style={v_fd5f43.levelRow}>
                  <Text style={[v_fd5f43.levelRange, v_ebec57 === 3 && { color: "#f97316" }]}>{v_4f2c9c}</Text>
                  <Text style={[v_fd5f43.levelDesc, v_ebec57 === 3 && { color: "#f97316" }]}>{v_41b99d}</Text>
                </View>
              ))}
              <Text style={v_fd5f43.infoSectionTitleInline}>{v_8d41d7("feed.intimacyHowToTitle")}</Text>
              <View style={v_fd5f43.activityBox}>
                <Text style={v_fd5f43.activityItem}>• {v_8d41d7("feed.intimacyHowChat")}</Text>
                <Text style={v_fd5f43.activityItem}>• {v_8d41d7("feed.intimacyHowCall")}</Text>
                <Text style={v_fd5f43.activityItem}>• {v_8d41d7("feed.intimacyHowLearn")}</Text>
                <Text style={v_fd5f43.activityItem}>• {v_8d41d7("feed.intimacyHowFeed")}</Text>
              </View>
              <Text style={v_fd5f43.infoFootnote}>{v_8d41d7("feed.intimacyFootnote")}</Text>
            </ScrollView>
            <Button
              title={v_8d41d7("common.ok")}
              variant="primary"
              onPress={() => v_8d30d7(false)}
              style={{ marginTop: 16, width: "100%", borderRadius: v_8b0c90.full }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal
        visible={!!v_5c83d5}
        transparent
        animationType="slide"
        onRequestClose={() => v_880166(null)}
      >
        <View style={v_fd5f43.bottomOverlay}>
          <Pressable
            style={v_472849.absoluteFillObject}
            onPress={() => v_880166(null)}
          />
          <View

            style={[v_fd5f43.commentSheet, { paddingBottom: 8 + v_2b650d }]}
          >
            <View style={v_fd5f43.sheetHandle} />
            <View style={v_fd5f43.commentHeaderRow}>
              <Text style={v_fd5f43.commentTitle}>{v_8d41d7("feed.commentCount", { n: v_cc8bc2.length })}</Text>
              <TouchableOpacity onPress={() => v_880166(null)}>
                <Feather name="x" size={20} color={v_1bfbd0.zinc600} />
              </TouchableOpacity>
            </View>
            <ScrollView style={v_fd5f43.commentScroll} showsVerticalScrollIndicator={false}>
              {v_465030 ? (
                <View style={v_fd5f43.emptyComment}>
                  <Feather name="loader" size={28} color={v_1bfbd0.zinc300} />
                </View>
              ) : v_cc8bc2.length > 0 ? (
                v_cc8bc2.map((v_3f4e2e) => (
                  <View key={v_3f4e2e.id} style={v_fd5f43.commentRow}>
                    {v_3f4e2e.user.avatarUrl ? (
                      <Image source={{ uri: v_3f4e2e.user.avatarUrl }} style={v_fd5f43.commentAvatar} />
                    ) : (
                      <View style={[v_fd5f43.commentAvatar, { backgroundColor: v_1bfbd0.zinc200 }]} />
                    )}
                    <View style={v_fd5f43.commentInfo}>
                      <View style={v_fd5f43.commentMeta}>
                        <Text style={v_fd5f43.commentAuthor}>{v_3f4e2e.user.name ?? v_3f4e2e.user.email}</Text>
                        <Text style={v_fd5f43.commentTime}>{v_bfd883(v_3f4e2e.createdAt)}</Text>
                        {v_3f4e2e.userId === v_f5f393 && (
                          <TouchableOpacity onPress={() => v_b72645(v_3f4e2e.id)} style={{ marginLeft: 8 }}>
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
                  <Text style={v_fd5f43.emptySubText}>{v_8d41d7("feed.commentsEmptyHint")}</Text>
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
          </View>
        </View>
      </Modal>

      {}
      <Modal
        visible={!!v_7babe8}
        transparent
        animationType="fade"
        onRequestClose={() => v_cdeef7(null)}
      >
        <Pressable style={v_fd5f43.centerOverlay} onPress={() => v_cdeef7(null)}>
          <Pressable style={v_fd5f43.confirmBox} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <Text style={v_fd5f43.confirmTitle}>{v_8d41d7("feed.unfollowTitle")}</Text>
            <Text style={v_fd5f43.confirmDesc}>
              {v_8d41d7("feed.unfollowDesc")}
            </Text>
            <View style={v_fd5f43.confirmBtns}>
              <Button title={v_8d41d7("common.cancel")} variant="ghost" onPress={() => v_cdeef7(null)} style={{ flex: 1 }} />
              <Button title={v_8d41d7("feed.unfollowTitle")} variant="danger" onPress={v_2d8ccb} style={{ flex: 1 }} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal
        visible={v_af84de}
        transparent
        animationType="slide"
        onRequestClose={() => v_22a5cb(false)}
      >
        <Pressable style={v_fd5f43.bottomOverlay} onPress={() => v_22a5cb(false)}>
          <View
            style={[v_fd5f43.callSheet, { paddingBottom: 24 + v_2b650d }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={v_fd5f43.sheetHandle} />
            <View style={v_fd5f43.callSheetHeader}>
              <Text style={v_fd5f43.callSheetTitle}>{v_8d41d7("feed.callSheetTitle")}</Text>
              <TouchableOpacity onPress={() => v_22a5cb(false)}>
                <Feather name="x" size={20} color={v_1bfbd0.zinc600} />
              </TouchableOpacity>
            </View>

            {}
            <View style={v_fd5f43.callSearchWrap}>
              <Feather name="search" size={18} color={v_1bfbd0.zinc400} />
              <TextInput
                style={v_fd5f43.callSearchInput}
                value={v_2116d2}
                onChangeText={v_83f9d3}
                placeholder={v_8d41d7("feed.callSearchPlaceholder")}
                placeholderTextColor={v_1bfbd0.placeholder}
              />
              {v_2116d2.length > 0 && (
                <TouchableOpacity onPress={() => v_83f9d3("")}>
                  <Feather name="x-circle" size={16} color={v_1bfbd0.zinc400} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={v_fd5f43.callScroll} showsVerticalScrollIndicator={false}>
              {
}

              {}
              <View style={v_fd5f43.callSection}>
                <Text style={v_fd5f43.callSectionTitle}>{v_2116d2 ? v_8d41d7("feed.searchResults") : v_8d41d7("feed.followingList")}</Text>
                {v_94f30e.length > 0 ? v_94f30e.map((v_e2a85c) => (
                  <View key={v_e2a85c.id} style={v_fd5f43.callRow}>
                    <Image source={{ uri: v_e2a85c.avatar }} style={v_fd5f43.callAvatar} />
                    <View style={v_fd5f43.callInfo}>
                      <Text style={v_fd5f43.callName}>{v_e2a85c.name}</Text>
                      <Text style={v_fd5f43.callSub}>{v_e2a85c.creatorAccount}</Text>
                    </View>
                    <TouchableOpacity
                      style={v_fd5f43.callBtn}
                      onPress={async () => {

                        const v_3ed4c3 = await v_84d546(v_2ca7e0, () => {});
                        if (!v_3ed4c3) return;
                        v_22a5cb(false);
                        v_38f9da({ cloneId: v_e2a85c.id, name: v_e2a85c.name, source: "following-call-modal" });
                        v_f4c991.navigate("Call", { cloneId: v_e2a85c.id, name: v_e2a85c.name, image: v_e2a85c.avatar });
                      }}
                    >
                      <Feather name="video" size={14} color={v_1bfbd0.white} />
                      <Text style={v_fd5f43.callBtnText}>{v_8d41d7("feed.callRowAction")}</Text>
                    </TouchableOpacity>
                  </View>
                )) : null}
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {}
      {v_8282fa && (
        <View style={v_fd5f43.toast}><Text style={v_fd5f43.toastText}>{v_8282fa}</Text></View>
      )}

      {
}
      <Modal
        visible={v_557d00}
        transparent
        animationType="slide"
        onRequestClose={() => v_538ca9(false)}
      >
        <Pressable style={v_fd5f43.bottomOverlay} onPress={() => v_538ca9(false)}>
          <Pressable
            style={[v_fd5f43.sortSheet, { paddingBottom: 24 + v_2b650d }]}
            onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}
          >
            <View style={v_fd5f43.sortSheetHandle} />
            <Text style={v_fd5f43.sortSheetTitle}>{v_8d41d7("chat.sort")}</Text>
            {(["recent", "intimacy", "intimacyAsc", "name"] as const).map((v_34e5bb) => (
              <TouchableOpacity
                key={v_34e5bb}
                style={v_fd5f43.sortOptionRow}
                activeOpacity={0.7}
                onPress={() => {
                  v_1db134(v_34e5bb);
                  v_538ca9(false);
                }}
              >
                <Text style={[v_fd5f43.sortOptionText, v_5e8330 === v_34e5bb && v_fd5f43.sortOptionActive]}>
                  {v_904373[v_34e5bb]}
                </Text>
                {v_5e8330 === v_34e5bb && (
                  <Feather name="check" size={18} color={v_1bfbd0.accent} />
                )}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeView>

    {}
    <PartnerAppBanners variant="docked" style={v_fd5f43.dockedBanner} />
    </View>
  );
}

const v_fd5f43 = v_472849.create({

  tabWrap: { borderBottomWidth: 1, borderBottomColor: v_1bfbd0.zinc200 },
  tabRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: v_8b0c90.full, backgroundColor: v_1bfbd0.zinc100 },
  tabActive: { backgroundColor: v_1bfbd0.zinc900 },
  tabText: { fontSize: 13, fontWeight: "500", color: v_1bfbd0.zinc600 },
  tabTextActive: { color: v_1bfbd0.white },

  feed: { padding: 16, gap: 16 },
  postWrap: { marginBottom: 8 },

  screen: {
    flex: 1,
  },
  dockedBanner: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  msgListContent: {
    paddingHorizontal: 20,
    paddingBottom: 0,
    backgroundColor: v_1bfbd0.white,
  },
  subSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: v_8f28b1.height,
    paddingHorizontal: v_8f28b1.paddingHorizontal,
    backgroundColor: v_1bfbd0.zinc100,
    borderRadius: v_8f28b1.borderRadius,
    marginTop: 4,
    marginBottom: 12,
  },
  subSearchInput: {
    flex: 1,
    fontSize: v_8f28b1.fontSize,
    lineHeight: v_8f28b1.lineHeight,
    paddingVertical: 0,
    textAlignVertical: v_8f28b1.textAlignVertical,
    color: v_1bfbd0.zinc900,
  },
  subAdBanner: {
    height: 60,

    backgroundColor: "transparent",
    paddingHorizontal: 20,
    justifyContent: "center",
    marginBottom: 8,
  },
  subAdBannerText: { color: v_1bfbd0.zinc700, fontSize: 15, fontWeight: "600" },
  subSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    marginTop: 4,
    marginBottom: 4,
  },
  subSectionCount: { fontSize: 13, color: v_1bfbd0.zinc500, fontWeight: "500" },
  subSectionSort: { fontSize: 13, color: v_1bfbd0.zinc500 },

  sortSheet: {
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sortSheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: v_1bfbd0.zinc300, alignSelf: "center", marginBottom: 12,
  },
  sortSheetTitle: {
    fontSize: 15, fontWeight: "700", color: v_1bfbd0.zinc900,
    textAlign: "center", marginBottom: 12,
  },
  sortOptionRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 14, borderTopWidth: 1, borderTopColor: v_1bfbd0.zinc100,
  },
  sortOptionText: { fontSize: 15, color: v_1bfbd0.zinc700 },
  sortOptionActive: { color: v_1bfbd0.accent, fontWeight: "700" },

  msgRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: v_1bfbd0.white,
    paddingHorizontal: 2,
    paddingVertical: 14,
  },

  msgLeaveWrap: {
    width: v_658217,
    alignItems: "center",
    justifyContent: "center",
  },
  msgLeaveBtn: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#F04452",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    shadowColor: "#F04452",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  msgLeaveBtnText: { color: v_1bfbd0.white, fontSize: 12, fontWeight: "700" },
  msgAvatarWrap: { width: 56, height: 56, position: "relative" },
  msgAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: v_1bfbd0.zinc200 },
  msgAvatarFallback: {
    backgroundColor: v_1bfbd0.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  msgAvatarInitial: { fontSize: 22, fontWeight: "700", color: v_1bfbd0.secondary },

  msgOnlineDot: {
    position: "absolute",
    right: 1, bottom: 1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: "#22c55e",
    borderWidth: 2, borderColor: v_1bfbd0.white,
  },
  msgBody: { flex: 1, minWidth: 0, paddingRight: 4 },
  msgName: { fontSize: 16, fontWeight: "700", color: "#1A253D", marginBottom: 4 },
  msgSub: { fontSize: 13, color: "#9BA3AF", lineHeight: 18 },
  msgRight: { alignItems: "flex-end", gap: 8, minWidth: 48 },
  msgTime: { fontSize: 12, color: "#B0B7C3", fontWeight: "500" },
  msgRightBottomRow: { flexDirection: "row", alignItems: "center", gap: 10 },

  msgUnreadBadge: {
    minWidth: 22, height: 22, borderRadius: 11,
    backgroundColor: v_1bfbd0.secondary,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 6,
  },
  msgUnreadText: { fontSize: 11, fontWeight: "700", color: v_1bfbd0.white },
  msgCallBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: v_1bfbd0.primary,
    alignItems: "center", justifyContent: "center",
  },

  imageWrap: { borderRadius: 24, overflow: "hidden", backgroundColor: v_1bfbd0.zinc100 },
  postImage: { width: "100%", aspectRatio: 3 / 4 },
  overlayContent: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: 24, paddingTop: 30, backgroundColor: "rgba(0,0,0,0.45)",
  },
  personaName: { fontSize: 16, fontWeight: "700", color: v_1bfbd0.white },
  creatorAccount: { fontSize: 12, color: v_1bfbd0.white, marginBottom: 8, opacity: 0.8 },
  tagRow: { flexDirection: "row", gap: 6, marginBottom: 10 },
  overlayTag: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: v_8b0c90.full },
  overlayTagText: { fontSize: 11, color: v_1bfbd0.white },
  postContent: { fontSize: 14, color: "rgba(255,255,255,0.9)", lineHeight: 20, marginBottom: 16 },
  overlayBtns: { flexDirection: "row", gap: 10 },
  overlayBtn: { flex: 1, borderRadius: v_8b0c90.full },
  overlayBtnGhost: { borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },

  statsBadge: {
    position: "absolute", top: 16, right: 16, flexDirection: "row", alignItems: "center",
    gap: 4, paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: "rgba(0,0,0,0.6)", borderRadius: v_8b0c90.full, zIndex: 10,
  },
  badgeBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  badgeText: { fontSize: 11, fontWeight: "600", color: v_1bfbd0.white },
  badgeDivider: { width: 1, height: 12, backgroundColor: "rgba(255,255,255,0.3)" },

  actionsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4, paddingVertical: 12 },
  actionsLeft: { flexDirection: "row", gap: 16 },
  actionsRight: { alignItems: "flex-end" },
  countText: { fontSize: 12, fontWeight: "600", color: v_1bfbd0.zinc900 },
  countTextSub: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },

  floatingCallBtn: {
    position: "absolute", right: 24, bottom: 24,
    zIndex: 50,
  },
  floatingCallBtnInner: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: v_1bfbd0.zinc900, alignItems: "center", justifyContent: "center",
    elevation: 8, shadowColor: v_1bfbd0.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12,
  },

  bottomOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  infoDesc: { fontSize: 14, color: v_1bfbd0.zinc600, lineHeight: 20, marginBottom: 16 },
  activityBoxTitle: { fontSize: 12, fontWeight: "500", color: "#2563eb", marginBottom: 8 },

  confirmBox: { backgroundColor: v_1bfbd0.white, borderRadius: 20, padding: 24, maxWidth: 360, width: "100%", alignItems: "center" },
  confirmTitle: { fontSize: 18, fontWeight: "600", color: v_1bfbd0.zinc900, marginBottom: 8 },
  confirmDesc: { fontSize: 14, color: v_1bfbd0.zinc600, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  confirmBtns: { flexDirection: "row", gap: 12, width: "100%" },

  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: v_1bfbd0.zinc300, alignSelf: "center", marginTop: 12, marginBottom: 12 },
  commentSheet: { backgroundColor: v_1bfbd0.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 24, height: "70%" },
  commentHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  commentTitle: { fontSize: 16, fontWeight: "700", color: v_1bfbd0.zinc900 },
  commentScroll: { flex: 1 },
  commentRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: v_1bfbd0.zinc200 },
  commentInfo: { flex: 1 },
  commentMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  commentAuthor: { fontSize: 13, fontWeight: "600", color: v_1bfbd0.zinc900 },
  commentTime: { fontSize: 12, color: v_1bfbd0.zinc400 },
  commentContent: { fontSize: 14, color: v_1bfbd0.zinc700, lineHeight: 20 },
  emptyComment: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14, color: v_1bfbd0.zinc400, marginTop: 8 },
  emptySubText: { fontSize: 12, color: v_1bfbd0.zinc400, marginTop: 2 },
  commentInputRow: { flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderTopColor: v_1bfbd0.zinc200, paddingTop: 12 },
  commentInput: {
    flex: 1,
    backgroundColor: v_1bfbd0.zinc100,
    color: v_1bfbd0.zinc900,
    ...v_7c5e29,
  },

  callSheet: { backgroundColor: v_1bfbd0.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 24, height: "70%" },
  callSheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  callSheetTitle: { fontSize: 18, fontWeight: "700", color: v_1bfbd0.zinc900 },
  callSearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: v_1bfbd0.zinc100,
    borderRadius: v_8f28b1.borderRadius,
    paddingHorizontal: v_8f28b1.paddingHorizontal,
    height: v_8f28b1.height,
    marginBottom: 16,
  },
  callSearchInput: {
    flex: 1,
    fontSize: v_8f28b1.fontSize,
    lineHeight: v_8f28b1.lineHeight,
    paddingVertical: 0,
    textAlignVertical: v_8f28b1.textAlignVertical,
    color: v_1bfbd0.zinc900,
  },
  callScroll: { flex: 1 },
  callSectionBordered: { marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: v_1bfbd0.zinc200 },
  callSection: { marginBottom: 20 },
  callSectionTitle: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900, marginBottom: 12 },
  callRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  callAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: v_1bfbd0.zinc200 },
  callInfo: { flex: 1 },
  callName: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc900 },
  callSub: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 1 },
  callMeta: { fontSize: 11, color: v_1bfbd0.zinc400, marginTop: 2 },
  callBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: v_1bfbd0.zinc900, borderRadius: v_8b0c90.full },
  callBtnText: { fontSize: 13, fontWeight: "600", color: v_1bfbd0.white },

  toast: { position: "absolute", bottom: 100, alignSelf: "center", paddingHorizontal: 24, paddingVertical: 12, backgroundColor: "rgba(0,0,0,0.8)", borderRadius: v_8b0c90.full },
  toastText: { fontSize: 14, color: v_1bfbd0.white },

  emptyWrap: { alignItems: "center", justifyContent: "center", paddingVertical: 80, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: v_1bfbd0.zinc700 },
  emptyDesc: { fontSize: 13, color: v_1bfbd0.zinc500, textAlign: "center" },

  eventsSheet: {
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,

    height: "70%",
    maxHeight: "80%",
  },
  eventsSheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: v_1bfbd0.zinc300, alignSelf: "center", marginBottom: 12,
  },
  eventsSheetTitle: { fontSize: 17, fontWeight: "700", color: v_1bfbd0.zinc900, textAlign: "center" },
  eventsSummary: { paddingHorizontal: 4, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: v_1bfbd0.zinc100, marginBottom: 8 },
  eventsSummaryRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  eventsSummaryScore: { fontSize: 24, fontWeight: "700", color: "#fb923c" },
  eventsSummaryCount: { fontSize: 13, color: v_1bfbd0.zinc500 },
  eventsBreakdownRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  eventsBreakdownItem: { fontSize: 12, color: v_1bfbd0.zinc500 },
  eventsBreakdownVal: { color: v_1bfbd0.zinc900, fontWeight: "600" },

  eventsScrollArea: { flex: 1, minHeight: 0 },
  eventRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: v_1bfbd0.zinc100 },
  eventIcon: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  eventLabel: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
  eventTime: { fontSize: 11, color: v_1bfbd0.zinc500, marginTop: 2 },
  eventScore: { fontSize: 14, fontWeight: "700", color: "#fb923c" },
  eventsSheetTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4, marginBottom: 12 },

  centerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 24 },
  infoBox: { width: "100%", maxWidth: 360, backgroundColor: v_1bfbd0.white, borderRadius: v_8b0c90.lg, padding: 20 },
  infoHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  infoHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoTitle: { fontSize: 17, fontWeight: "700", color: v_1bfbd0.zinc900 },
  infoDescInline: { fontSize: 13, color: v_1bfbd0.zinc600, lineHeight: 20, marginBottom: 10 },
  infoSectionTitleInline: { fontSize: 14, fontWeight: "700", color: v_1bfbd0.zinc900, marginTop: 12, marginBottom: 8 },
  infoFootnote: { fontSize: 11, color: v_1bfbd0.zinc500, lineHeight: 16, marginTop: 12 },
  levelRow: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  levelRange: { width: 90, fontSize: 13, fontWeight: "600", color: v_1bfbd0.zinc700 },
  levelDesc: { fontSize: 13, color: v_1bfbd0.zinc500 },
  activityBox: { backgroundColor: v_1bfbd0.zinc50, borderRadius: 8, padding: 12, gap: 6 },
  activityItem: { fontSize: 13, color: v_1bfbd0.zinc700, lineHeight: 20 },
});
