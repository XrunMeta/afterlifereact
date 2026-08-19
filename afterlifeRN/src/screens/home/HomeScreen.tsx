import { v_889fad } from "../../stores/dialogStore";
import v_5778ce from "../../components/common/HashtagText";
import v_a3453e, { v_5ab095, v_e662ae, v_de06a3, v_c4deb2 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_9cabcb,
  v_700696,
  v_4623af,
  v_472849,
  v_bd73dc,
  v_326be8,
  v_aa7413,
  v_09d0e5,
  v_122070,
  v_cf9c33,
  v_79c4f2,
  v_0e1f26,
  v_39a996,
} from "rcmrninabrnb";
import { v_03e392, v_5f4661 } from "rcmrninabrnb";
import { v_b5df25 } from "ernurodqvmtspux";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_c18c22 } from "svuoaeceudfxfjvvpmmmchnwljywbphjgb";
import { v_dec439, v_25515d } from "zvyjokvuouwvifyzks";
import { v_cf763b, v_ada615, v_650cfa } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";

import { v_68a7fe } from "../../face/useFaceBiometricRetroPrompt";
import v_9706a6 from "../../components/ui/FeedCard";
import v_06b8c0 from "../../components/clone/IntimacyEventsSheet";

import v_03e207 from "../../components/clone/GiftReceiptsSheet";
import v_8e7ad4 from "../../components/ui/SwipeDownSheet";
import v_4d58d7 from "../../components/common/ReportReasonModal";

import v_92380d from "../clones/components/VisibilityPickerModal";
import v_4c2648 from "../clones/components/FriendPickerModal";
import type { v_b0b271 } from "../../types/clone";

import { v_37977a, v_10e36e } from "../../stores/feedStore";
import { v_b4902e } from "../../stores/followStore";

import { v_98d20a } from "../../stores/userFollowStore";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_f386b1 } from "../../mocks/feedAdapter";
import {
  v_4208e7,
  v_3f8bc7,
  v_6f689a,
  v_0df337,
  v_97c75d,
  v_f5a9ea,
  v_f1ff2a,
  v_99e260,
  v_003cf2,
  type v_52af9d,
} from "../../api/clones";
import { v_bfd883 } from "../../lib/relativeTime";
import { v_84d546 } from "../../lib/callGuard";
import { v_ab98d4 } from "../../hooks/useReportAcceptedGate";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import type { v_19b433 } from "../../types/feed";
import type { v_8ad91b } from "../../navigation/types";

const { height: v_28d8d8 } = v_700696.get("window");

const v_e4d4c8 = 56;

export default function v_c316d8() {
  const { t: v_8d41d7 } = v_772971();

  v_ab98d4();
  const v_f4c991 = v_ada615<v_390fcc<v_8ad91b>>();
  const v_033e14 = v_e0068c();
  const v_f9771e = v_c18c22(0);
  const v_ebdf9a = v_e662ae<v_9cabcb>(null);

  const [v_01ea76, v_ae56e9] = v_5ab095(false);

  const v_d50147 = v_e662ae<ReturnType<typeof setTimeout> | null>(null);

  const v_53dd92 = v_326be8.OS === "ios"
    ? v_033e14.bottom
    : Math.max(v_f9771e, v_033e14.bottom);
  const v_1be4da = v_28d8d8 - v_e4d4c8 - v_53dd92;

  const v_632420 = v_37977a((v_fd5f43) => v_fd5f43.likedIds);
  const v_976e06 = v_37977a((v_fd5f43) => v_fd5f43.selectedInterests);
  const v_a96ced = v_37977a((v_fd5f43) => v_fd5f43.toggleLike);
  const v_770327 = v_37977a((v_fd5f43) => v_fd5f43.setSelectedInterests);
  const v_1c7dea = v_37977a((v_fd5f43) => v_fd5f43.getFilteredFeeds);
  const v_c600ef = v_37977a((v_fd5f43) => v_fd5f43.loadDiscover);
  const v_71b114 = v_37977a((v_fd5f43) => v_fd5f43.apiFeeds);
  const v_dec728 = v_37977a((v_fd5f43) => v_fd5f43.apiLoading);
  const v_1e752a = v_b4902e((v_fd5f43) => v_fd5f43.follows);
  const v_b30b81 = v_b4902e((v_fd5f43) => v_fd5f43.isFollowing);
  const v_3094d4 = v_b4902e((v_fd5f43) => v_fd5f43.toggleFollow);

  const v_8916d3 = v_98d20a((v_fd5f43) => v_fd5f43.isFollowing);
  const v_1d9833 = v_98d20a((v_fd5f43) => v_fd5f43.toggleFollow);

  const [v_708913, v_f0e470] = v_5ab095(false);

  v_c4deb2(() => {
    if (v_71b114 == null) {
      void v_c600ef().finally(() => v_f0e470(true));
    } else {
      v_f0e470(true);
    }
  }, [v_71b114, v_c600ef]);

  v_cf763b(
    v_de06a3(() => {
      void v_c600ef().finally(() => v_f0e470(true));
    }, [v_c600ef]),
  );

  const [v_2bcb8f, v_ddecc4] = v_5ab095(0);

  const [v_ed660d, v_b07dd3] = v_5ab095<number | null>(null);

  const [v_16a078, v_905ec3] = v_5ab095(false);

  const [v_415d29, v_d2b23a] = v_5ab095<{ followers: number; createdAt: string } | null>(null);
  v_c4deb2(() => {
    if (!v_16a078 || v_ed660d == null) { v_d2b23a(null); return; }
    const v_8c0b26 = v_37977a.getState().apiFeeds?.find((v_8b5cd8) => v_8b5cd8.id === v_ed660d);
    const v_6e0fd3 = v_8c0b26?.cloneId;
    if (!v_6e0fd3) return;
    let v_2008a4 = false;
    v_003cf2(v_6e0fd3, v_1ed7d9.getState().accessToken ?? undefined)
      .then((v_8f00b9) => {
        if (v_2008a4) return;
        v_d2b23a({ followers: v_8f00b9.clone.stats?.followers ?? 0, createdAt: v_8f00b9.clone.createdAt });
      })
      .catch(() => {});
    return () => { v_2008a4 = true; };
  }, [v_16a078, v_ed660d]);
  const [v_48e7fe, v_856f84] = v_5ab095("");

  const [v_d3a183, v_598141] = v_5ab095<{ cloneId: number; cloneName: string } | null>(null);

  const [v_5e9fb7, v_cc306d] = v_5ab095<{ cloneId: number; cloneName: string } | null>(null);

  const [v_12fa22, v_949e66] = v_5ab095<{
    cloneId: number;
    ownerId?: number;
    author: string;
    isOwn: boolean;
    visibility?: string;
  } | null>(null);

  const [v_2a0bbc, v_ddfad5] = v_5ab095<{
    cloneId: number;
    currentVisibility: v_b0b271;
  } | null>(null);

  const [v_480a32, v_4ccd21] = v_5ab095<number | null>(null);

  const [v_f18195, v_fdd7c1] = v_5ab095<{
    cloneId: number;
    author: string;
  } | null>(null);

  const [v_b38909, v_c03d7d] = v_5ab095<{
    commentId: number;
    author: string;
  } | null>(null);
  const [v_8282fa, v_15c939] = v_5ab095<string | null>(null);
  v_c4deb2(() => {
    if (v_8282fa) {
      const v_389afb = setTimeout(() => v_15c939(null), 2000);
      return () => clearTimeout(v_389afb);
    }
  }, [v_8282fa]);

  const [v_7e4acc, v_de86c2] = v_5ab095(0);
  v_c4deb2(() => {
    const v_53f5d7 = v_0e1f26.addListener(
      v_326be8.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (v_9e86fd) => v_de86c2(v_9e86fd.endCoordinates.height),
    );
    const v_52528b = v_0e1f26.addListener(
      v_326be8.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => v_de86c2(0),
    );
    return () => {
      v_53f5d7.remove();
      v_52528b.remove();
    };
  }, []);
  const v_507993 = v_7e4acc > 0;

  const filteredFeeds: v_19b433[] = v_1c7dea().map(v_f386b1);

  const v_829e3a = v_de06a3((v_c09aa8, v_f4e98d) => {
    v_10e36e.set(v_c09aa8, { commentsCount: v_f4e98d });
    const v_c3bc75 = v_37977a.getState().apiFeeds;
    if (v_c3bc75) {
      v_37977a.setState({
        apiFeeds: v_c3bc75.map((v_8b5cd8) => (v_8b5cd8.id === v_c09aa8 ? { ...v_8b5cd8, commentsCount: v_f4e98d } : v_8b5cd8)),
      });
    }
  }, []);

  const v_43bc1b = v_de06a3(
    ({ viewableItems: v_e5cc27 }: { viewableItems: v_bd73dc[] }) => {
      if (v_e5cc27.length > 0 && v_e5cc27[0].index != null) {
        v_ddecc4(v_e5cc27[0].index);
      }
    },
    []
  );

  const v_10f7ba = {
    itemVisiblePercentThreshold: 50,
  };

  void v_770327;

  const [v_ecfc0f, v_04f2fc] = v_5ab095<v_52af9d[]>([]);
  const [v_465030, v_856daf] = v_5ab095(false);
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);

  v_68a7fe(v_2ca7e0);
  const v_f5f393 = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser?.id ?? v_fd5f43.user?.id ?? null);

  const [v_90b93a, v_f1ad38] = v_5ab095<{ commentId: number; userName: string } | null>(null);
  const [v_2ced3d, v_74a05a] = v_5ab095<Record<number, v_52af9d[]>>({});

  v_c4deb2(() => {
    if (v_ed660d == null) {
      v_04f2fc([]);

      v_74a05a({});
      v_f1ad38(null);
      return;
    }
    if (v_ed660d < 0) {

      v_04f2fc([]);
      v_74a05a({});
      return;
    }
    let v_2008a4 = false;
    v_856daf(true);
    v_04f2fc([]);
    v_74a05a({});
    v_4208e7(v_ed660d, { limit: 100, accessToken: v_2ca7e0 })
      .then((v_8f00b9) => {
        if (v_2008a4) return;
        v_04f2fc(v_8f00b9.items);
      })
      .catch((v_49263d) => {
        console.warn("[Home] listFeedComments failed:", v_49263d);
        if (!v_2008a4) v_04f2fc([]);
      })
      .finally(() => {
        if (!v_2008a4) v_856daf(false);
      });
    return () => {
      v_2008a4 = true;
    };
  }, [v_ed660d]);

  const v_4c2809 = v_e662ae(false);
  const [v_b0af20, v_52390e] = v_5ab095(false);
  const v_8e4668 = async () => {
    if (v_ed660d == null) return;
    if (v_4c2809.current) return; 
    const v_b43b74 = v_48e7fe.trim();
    if (!v_b43b74 || !v_2ca7e0) return;

    v_0e1f26.dismiss();
    v_4c2809.current = true;
    v_52390e(true);
    try {
      let v_6bbace;
      const v_e05de7 = v_ed660d;
      if (v_ed660d < 0) {

        const v_6e0fd3 = -v_ed660d;
        const v_8f00b9 = await v_6f689a(v_2ca7e0, v_6e0fd3, v_b43b74);
        v_6bbace = v_8f00b9.comment.feedId;
        v_b07dd3(v_6bbace);

        const v_c3bc75 = v_37977a.getState().apiFeeds;
        if (v_c3bc75) {
          v_37977a.setState({
            apiFeeds: v_c3bc75.map((v_8b5cd8) => (v_8b5cd8.id === v_e05de7 ? { ...v_8b5cd8, id: v_6bbace } : v_8b5cd8)),
          });
        }
        v_10e36e.delete(v_e05de7);
      } else {
        await v_3f8bc7(v_2ca7e0, v_ed660d, v_b43b74, {
          parentCommentId: v_90b93a?.commentId,
        });
        v_6bbace = v_ed660d;
      }
      v_856f84("");

      if (v_90b93a) {
        try {
          const v_f10744 = await v_f5a9ea(v_6bbace, v_90b93a.commentId, { limit: 100, accessToken: v_2ca7e0 });
          v_74a05a((v_ba2215) => ({ ...v_ba2215, [v_90b93a.commentId]: v_f10744.items }));
          v_04f2fc((v_ba2215) =>
            v_ba2215.map((v_3f4e2e) =>
              v_3f4e2e.id === v_90b93a.commentId
                ? { ...v_3f4e2e, repliesCount: v_f10744.items.length }
                : v_3f4e2e,
            ),
          );
        } catch (v_49263d) {
          console.warn("[Home] refresh replies failed:", v_49263d);
        }
        v_f1ad38(null);

        const v_c3bc75 = v_37977a.getState().apiFeeds;
        const v_5f5d6d = v_c3bc75?.find((v_8b5cd8) => v_8b5cd8.id === v_6bbace);
        v_829e3a(v_6bbace, (v_5f5d6d?.commentsCount ?? 0) + 1);
      } else {
        const v_cb35cb = await v_4208e7(v_6bbace, { limit: 100, accessToken: v_2ca7e0 });
        v_04f2fc(v_cb35cb.items);
        v_829e3a(v_6bbace, v_cb35cb.items.length);
      }
    } catch (v_49263d) {
      console.warn("[Home] postFeedComment failed:", v_49263d);
    } finally {
      v_4c2809.current = false;
      v_52390e(false);
    }
  };

  const v_b72645 = (v_d91518) => {
    if (v_ed660d == null || v_ed660d < 0 || !v_2ca7e0) return;
    v_889fad(
      v_8d41d7("home.commentDeleteTitle", { defaultValue: "댓글 삭제" }),
      v_8d41d7("home.commentDeleteDesc", { defaultValue: "이 댓글을 삭제하시겠습니까?" }),
      [
        { text: v_8d41d7("common.cancel", { defaultValue: "취소" }), style: "cancel" },
        {
          text: v_8d41d7("common.delete", { defaultValue: "삭제" }),
          style: "destructive",
          onPress: async () => {
            try {
              await v_0df337(v_2ca7e0, v_ed660d, v_d91518);
              v_04f2fc((v_ba2215) => {
                const v_a448ad = v_ba2215.filter((v_3f4e2e) => v_3f4e2e.id !== v_d91518);
                v_829e3a(v_ed660d, v_a448ad.length);
                return v_a448ad;
              });
            } catch (v_49263d) {
              console.warn("[Home] deleteFeedComment failed:", v_49263d);
            }
          },
        },
      ],
    );
  };

  const v_71affe = (comment: v_52af9d, v_fdf350) => {
    if (!v_2ca7e0) return;
    const v_8e2335 = v_61b01a.feedId ?? (v_ed660d != null && v_ed660d > 0 ? v_ed660d : 0);
    if (!v_8e2335) return;
    const v_d50832 = !!v_61b01a.likedByMe;
    const v_43f08c = v_61b01a.likesCount ?? 0;
    const v_86472f = !v_d50832;
    const v_c97dd8 = Math.max(0, v_43f08c + (v_86472f ? 1 : -1));
    const v_00b8d8 = (c: v_52af9d): v_52af9d =>
      v_3f4e2e.id === v_61b01a.id ? { ...v_3f4e2e, likedByMe: v_86472f, likesCount: v_c97dd8 } : v_3f4e2e;
    if (v_fdf350) {
      v_74a05a((v_e2a85c) => {
        const v_ef8ab1 = v_e2a85c[v_fdf350];
        if (!v_ef8ab1) return v_e2a85c;
        return { ...v_e2a85c, [v_fdf350]: v_ef8ab1.map(v_00b8d8) };
      });
    } else {
      v_04f2fc((v_ba2215) => v_ba2215.map(v_00b8d8));
    }
    void (async () => {
      try {
        if (v_86472f) await v_f1ff2a(v_2ca7e0, v_8e2335, v_61b01a.id);
        else await v_99e260(v_2ca7e0, v_8e2335, v_61b01a.id);
      } catch (v_49263d) {
        console.warn("[Home] toggleCommentLike failed:", v_49263d);
        const v_86fa3e = (c: v_52af9d): v_52af9d =>
          v_3f4e2e.id === v_61b01a.id ? { ...v_3f4e2e, likedByMe: v_d50832, likesCount: v_43f08c } : v_3f4e2e;
        if (v_fdf350) {
          v_74a05a((v_e2a85c) => {
            const v_ef8ab1 = v_e2a85c[v_fdf350];
            if (!v_ef8ab1) return v_e2a85c;
            return { ...v_e2a85c, [v_fdf350]: v_ef8ab1.map(v_86fa3e) };
          });
        } else {
          v_04f2fc((v_ba2215) => v_ba2215.map(v_86fa3e));
        }
      }
    })();
  };

  const v_fcf6ec = v_de06a3(
    ({ item: v_8c0b26, index: v_a56041 }: { item: v_19b433; index: number }) => {

      const v_799eb5 = v_f5f393 != null && v_8c0b26.cloneOwnerId === v_f5f393;
      return (
        <FeedCard
          item={v_8c0b26}
          isActive={v_a56041 === v_2bcb8f}
          isLiked={v_632420.includes(v_8c0b26.id)}
          isFollowed={v_b30b81(v_8c0b26.cloneId)}
          isOwn={v_799eb5}
          cardHeight={v_1be4da}
          onToggleLike={() => v_a96ced(v_8c0b26.id)}
          onToggleFollow={() => void v_3094d4(v_8c0b26.cloneId)}
          onCallPress={() => {

            const v_b66f2c = Date.now();
            console.log(`[Call][flow] +${v_b66f2c} onCallPress cloneId=${v_8c0b26.cloneId} name=${v_8c0b26.author} (optimistic)`);
            if (typeof v_8c0b26.image === "string" && v_8c0b26.image) {
              const v_630907 = Date.now();
              console.log(`[Call][flow] +${v_630907} Image.prefetch start url=${v_8c0b26.image}`);
              v_cf9c33.prefetch(v_8c0b26.image)
                .then(() => console.log(`[Call][flow] +${Date.now()} Image.prefetch done (Δ${Date.now() - v_630907}ms)`))
                .catch((v_49263d) => console.warn(`[Call][flow] Image.prefetch failed:`, v_49263d));
            }
            console.log(`[Call][flow] +${Date.now()} navigation.navigate("Call") (Δ${Date.now() - v_b66f2c}ms since click)`);
            v_f4c991.navigate("Call", { cloneId: v_8c0b26.cloneId, name: v_8c0b26.author, image: v_8c0b26.image });

            void v_84d546(v_2ca7e0, () => {
              v_f4c991.dispatch(
                v_650cfa.navigate({ name: "MyTab", params: { screen: "Purchase" } }),
              );
            }).then((v_3ed4c3) => {
              console.log(`[Call][flow] +${Date.now()} assertCanCall(bg) → ok=${v_3ed4c3} (Δ${Date.now() - v_b66f2c}ms)`);
              if (!v_3ed4c3) {

                if (v_f4c991.canGoBack()) v_f4c991.goBack();
              }
            });
          }}
          onCommentPress={() => { v_905ec3(false); v_b07dd3(v_8c0b26.id); }}

          onIntimacyPress={() => v_598141({ cloneId: v_8c0b26.cloneId, cloneName: v_8c0b26.author })}
          onMorePress={() =>
            v_949e66({
              cloneId: v_8c0b26.cloneId,
              ownerId: v_8c0b26.cloneOwnerId,
              author: v_8c0b26.author,
              isOwn: v_799eb5,
              visibility: v_8c0b26.cloneVisibility,
            })
          }
          onSharePress={async () => {
            try {

              const v_8f7097 = encodeURIComponent(v_8c0b26.author);
              const v_f71b56 = `https://www.xrun.run/clone?id=${v_8c0b26.cloneId}&name=${v_8f7097}`;
              await v_5f4661.share({
                message: v_8d41d7("home.shareMessage", {
                  name: v_8c0b26.author,
                  url: v_f71b56,
                  defaultValue: `${v_8c0b26.author} 클론과 만나보세요!\n${v_f71b56}`,
                }),
                title: v_8c0b26.author,
              });
            } catch (v_49263d) {
              console.warn("[Home] share failed:", v_49263d);
            }
          }}

          onOwnerPress={() => {
            if (v_8c0b26.cloneOwnerId != null) {
              v_f4c991.navigate("UserProfile", { userId: v_8c0b26.cloneOwnerId });
            }
          }}
          onOwnerFollowPress={() => {
            if (v_8c0b26.cloneOwnerId != null) void v_1d9833(v_8c0b26.cloneOwnerId);
          }}
          isOwnerFollowed={v_8c0b26.cloneOwnerId != null ? v_8916d3(v_8c0b26.cloneOwnerId) : false}

          onGiftPress={() => v_cc306d({ cloneId: v_8c0b26.cloneId, cloneName: v_8c0b26.author })}

          onDescriptionPress={() => { v_905ec3(true); v_b07dd3(v_8c0b26.id); }}
        />
      );
    },
    [
      v_2bcb8f,
      v_632420,
      v_1e752a,
      v_1be4da,
      v_a96ced,
      v_3094d4,
      v_b30b81,
      v_f5f393,
      v_8916d3,
      v_1d9833,
    ]
  );

  const v_587901 = !v_708913 || (v_ff422a.length === 0 && v_dec728);
  const v_60483c = !v_587901 && v_ff422a.length === 0;

  return (
    <View style={v_d81136.root}>
      <StatusBar style="light" />
      {

}
      {v_587901 ? (
        <View style={[v_d81136.emptyWrap, { height: v_1be4da }]}>
          <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
        </View>
      ) : v_60483c ? (
        <View style={[v_d81136.emptyWrap, { height: v_1be4da }]}>
          <View style={v_d81136.emptyIconWrap}>
            <Feather name="users" size={36} color="rgba(255,255,255,0.7)" />
          </View>
          <Text style={v_d81136.emptyTitle}>
            {v_8d41d7("home.emptyTitle", { defaultValue: "아직 만나볼 클론이 없어요" })}
          </Text>
          <Text style={v_d81136.emptyDesc}>
            {v_8d41d7("home.emptyDesc", {
              defaultValue:
                "첫 클론의 주인공이 되어보시는 건 어때요?\n나만의 클론을 만들어 시작해 보세요",
            })}
          </Text>
          <TouchableOpacity
            style={v_d81136.emptyBtn}
            activeOpacity={0.85}
            onPress={() =>

              v_f4c991.dispatch(
                v_650cfa.navigate({
                  name: "CreateTab",
                  params: { screen: "Step3" },
                }),
              )
            }
          >
            <Feather name="plus" size={18} color={v_1bfbd0.zinc950} />
            <Text style={v_d81136.emptyBtnText}>
              {v_8d41d7("home.createClone", { defaultValue: "클론 만들기" })}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={v_ebdf9a}
          data={v_ff422a}
          renderItem={v_fcf6ec}
          keyExtractor={(v_8c0b26) => String(v_8c0b26.id)}
          pagingEnabled

          scrollEnabled={!v_01ea76}
          showsVerticalScrollIndicator={false}
          snapToInterval={v_1be4da}
          decelerationRate="fast"
          onViewableItemsChanged={v_43bc1b}
          viewabilityConfig={v_10f7ba}
          getItemLayout={(v_37eab7, v_a56041) => ({
            length: v_1be4da,
            offset: v_1be4da * v_a56041,
            index: v_a56041,
          })}
        />
      )}

      {}

      {
}
      <Modal visible={!!v_ed660d} transparent animationType="slide">
        {
}
        <Pressable style={v_d81136.commentOverlay} onPress={(v_9e86fd) => {
          if (v_9e86fd.target !== v_9e86fd.currentTarget) return;
          if (v_16a078 && v_507993) {
            v_0e1f26.dismiss();
          } else {
            v_0e1f26.dismiss(); v_b07dd3(null); v_905ec3(false);
          }
        }}>
          <SwipeDownSheet
            onClose={() => { v_0e1f26.dismiss(); v_b07dd3(null); v_905ec3(false); }}
            keyboardOffset={v_7e4acc}
            style={[
              v_d81136.commentSheet,

              {
                paddingBottom: 24 + Math.max(v_033e14.bottom, 0),
                height: Math.max(v_28d8d8 * 0.7 - v_7e4acc, 200),
              },
            ]}
          >
            <View style={v_d81136.sheetHandle} />
            {

}
            {(() => {
              if (!v_16a078) return null;
              if (v_507993) return null;
              const v_61f930 = v_ff422a.find((v_8b5cd8) => v_8b5cd8.id === v_ed660d);
              if (!v_61f930) return null;
              return (
                <View style={v_d81136.detailHeader}>
                  <View style={v_d81136.detailProfileRow}>
                    {v_61f930.authorAvatar ? (
                      <Image
                        source={
                          typeof v_61f930.authorAvatar === "number"
                            ? v_61f930.authorAvatar
                            : { uri: v_61f930.authorAvatar as string }
                        }
                        style={v_d81136.detailAvatar}
                      />
                    ) : (
                      <View style={[v_d81136.detailAvatar, { backgroundColor: v_1bfbd0.zinc100 }]} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={v_d81136.detailAuthor} numberOfLines={1}>{v_61f930.author}</Text>
                      {}
                      <Text style={v_d81136.detailUsername} numberOfLines={1}>@{(v_61f930.username ?? "").replace(/^@+/, "")}</Text>
                    </View>
                    {}
                    <TouchableOpacity
                      onPress={() => { v_0e1f26.dismiss(); v_b07dd3(null); v_905ec3(false); }}
                      hitSlop={8}
                    >
                      <Feather name="x" size={22} color={v_1bfbd0.zinc600} />
                    </TouchableOpacity>
                  </View>
                  {v_61f930.description ? (

                    <HashtagText
                      style={v_d81136.detailDescription}
                      tagStyle={{ color: v_1bfbd0.violet600, fontWeight: "600" }}
                    >
                      {v_61f930.description}
                    </HashtagText>
                  ) : null}
                  {
}
                  <View style={v_d81136.detailStatsRow}>
                    <View style={v_d81136.detailStatCard}>
                      {}
                      <Text style={v_d81136.detailStatValue}>{v_415d29?.followers ?? 0}</Text>
                      <Text style={v_d81136.detailStatLabel}>{v_8d41d7("feed.followers", { defaultValue: "구독자" })}</Text>
                    </View>
                    <View style={v_d81136.detailStatCard}>
                      <Text style={v_d81136.detailStatValue}>{v_61f930.likes || "0"}</Text>
                      <Text style={v_d81136.detailStatLabel}>{v_8d41d7("feed.likes", { defaultValue: "좋아요" })}</Text>
                    </View>
                    <View style={v_d81136.detailStatCard}>
                      {}
                      <Text style={v_d81136.detailStatValue}>{(() => {
                        const v_38d084 = v_415d29?.createdAt ?? v_61f930.createdAt;
                        if (!v_38d084) return "-";
                        const v_d5dda0 = new Date(v_38d084);
                        if (isNaN(v_d5dda0.getTime())) return "-";
                        const v_64877a = v_d5dda0.getFullYear();
                        const v_35f85c = String(v_d5dda0.getMonth() + 1).padStart(2, "0");
                        const v_087ffc = String(v_d5dda0.getDate()).padStart(2, "0");
                        return `${v_64877a}.${v_35f85c}.${v_087ffc}`;
                      })()}</Text>
                      <Text style={v_d81136.detailStatLabel}>{v_8d41d7("feed.createdAt", { defaultValue: "생성일" })}</Text>
                    </View>
                  </View>
                </View>
              );
            })()}
            {
}
            {!v_16a078 ? (
              <View style={v_d81136.commentHeaderRow}>
                <Text style={v_d81136.commentTitle}>{v_8d41d7("feed.commentCount", { n: v_ecfc0f.length })}</Text>
              </View>
            ) : null}
            {
}
            <ScrollView
              style={[v_d81136.commentScroll, { minHeight: 0 }]}
              contentContainerStyle={v_ecfc0f.length === 0 ? { flexGrow: 1, justifyContent: "center", minHeight: 180 } : { flexGrow: 1 }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="always"
              scrollEventThrottle={16}
              alwaysBounceVertical={true}
              overScrollMode="always"
            >
              {v_465030 ? (
                <View style={v_d81136.emptyComment}>
                  <Feather name="loader" size={28} color={v_1bfbd0.zinc400} />
                </View>
              ) : v_ecfc0f.length > 0 ? (
                v_ecfc0f.map((v_3f4e2e) => {
                  const v_271e2a = v_2ced3d[v_3f4e2e.id];
                  const v_f72477 = v_271e2a !== undefined;
                  return (

                  <View key={v_3f4e2e.id} style={v_d81136.commentBlock}>
                  <View style={v_d81136.commentRow}>
                    {v_3f4e2e.user.avatarUrl ? (
                      <Image source={{ uri: v_3f4e2e.user.avatarUrl }} style={v_d81136.commentAvatar} />
                    ) : (
                      <View style={[v_d81136.commentAvatar, { backgroundColor: v_1bfbd0.zinc100 }]} />
                    )}
                    <View style={v_d81136.commentInfo}>
                      <View style={v_d81136.commentMeta}>
                        <Text style={v_d81136.commentAuthor}>{v_3f4e2e.user.name ?? v_3f4e2e.user.email}</Text>
                        <Text style={v_d81136.commentTime}>{v_bfd883(v_3f4e2e.createdAt)}</Text>
                        {v_3f4e2e.userId === v_f5f393 ? (
                          <TouchableOpacity onPress={() => v_b72645(v_3f4e2e.id)} style={{ marginLeft: 8 }}>
                            <Feather name="trash-2" size={14} color={v_1bfbd0.zinc400} />
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            onPress={() =>
                              v_c03d7d({
                                commentId: v_3f4e2e.id,
                                author: v_3f4e2e.user.name ?? v_3f4e2e.user.email ?? "",
                              })
                            }
                            style={{ marginLeft: 8 }}
                          >
                            <Feather name="flag" size={14} color={v_1bfbd0.zinc400} />
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={v_d81136.commentContent}>{v_3f4e2e.content}</Text>
                      {}
                      <View style={v_d81136.replyActions}>
                        <TouchableOpacity
                          onPress={() =>
                            v_f1ad38({
                              commentId: v_3f4e2e.id,
                              userName: v_3f4e2e.user.name ?? v_3f4e2e.user.email ?? "",
                            })
                          }
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          activeOpacity={0.6}
                        >
                          <Text style={v_d81136.replyActionText}>
                            {v_8d41d7("home.replyAction", { defaultValue: "답글 달기" })}
                          </Text>
                        </TouchableOpacity>
                        {(v_3f4e2e.repliesCount ?? 0) > 0 && (
                          <TouchableOpacity
                            onPress={async () => {
                              if (v_ed660d == null || v_ed660d < 0) return;
                              if (v_f72477) {

                                v_74a05a((v_e2a85c) => {
                                  const v_f4e98d = { ...v_e2a85c };
                                  delete v_f4e98d[v_3f4e2e.id];
                                  return v_f4e98d;
                                });
                              } else {
                                try {
                                  const v_cb35cb = await v_f5a9ea(v_ed660d, v_3f4e2e.id, { limit: 100, accessToken: v_2ca7e0 });
                                  v_74a05a((v_e2a85c) => ({ ...v_e2a85c, [v_3f4e2e.id]: v_cb35cb.items }));
                                } catch (v_49263d) {
                                  console.warn("[Home] listReplies failed:", v_49263d);
                                }
                              }
                            }}
                          >
                            <Text style={v_d81136.replyToggleText}>
                              {v_f72477
                                ? v_8d41d7("home.repliesHide", { defaultValue: "── 답글 숨기기" })
                                : v_8d41d7("home.repliesMore", {
                                    n: v_3f4e2e.repliesCount,
                                    defaultValue: `── 답글 ${v_3f4e2e.repliesCount}개 더 보기`,
                                  })}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    {

}
                    <TouchableOpacity
                      style={v_d81136.commentHeart}
                      onPress={() => v_71affe(v_3f4e2e)}
                      hitSlop={8}
                      delayPressIn={150}
                    >
                      <Ionicons
                        name="heart"
                        size={18}
                        color={v_3f4e2e.likedByMe ? "#ef4444" : v_1bfbd0.zinc400}
                      />
                      <Text
                        style={[
                          v_d81136.commentHeartCount,
                          v_3f4e2e.likedByMe ? { color: "#ef4444" } : null,
                        ]}
                      >
                        {v_3f4e2e.likesCount ?? 0}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {

}
                  {v_f72477 && v_271e2a && v_271e2a.map((v_5cfb2c) => (
                    <View key={v_5cfb2c.id} style={v_d81136.replyRow}>
                      <View style={v_d81136.replyIndent} />
                      {v_5cfb2c.user.avatarUrl ? (
                        <Image source={{ uri: v_5cfb2c.user.avatarUrl }} style={v_d81136.replyAvatar} />
                      ) : (
                        <View style={[v_d81136.replyAvatar, { backgroundColor: v_1bfbd0.zinc100 }]} />
                      )}
                      <View style={{ flex: 1 }}>
                        <View style={v_d81136.commentMeta}>
                          <Text style={v_d81136.commentAuthor}>{v_5cfb2c.user.name ?? v_5cfb2c.user.email}</Text>
                          <Text style={v_d81136.commentTime}>{v_bfd883(v_5cfb2c.createdAt)}</Text>
                        </View>
                        <Text style={v_d81136.commentContent}>{v_5cfb2c.content}</Text>
                      </View>
                      {
}
                      <TouchableOpacity
                        style={v_d81136.commentHeart}
                        onPress={() => v_71affe(v_5cfb2c, v_3f4e2e.id)}
                        hitSlop={8}
                        delayPressIn={150}
                      >
                        <Ionicons
                          name="heart"
                          size={16}
                          color={v_5cfb2c.likedByMe ? "#ef4444" : v_1bfbd0.zinc400}
                        />
                        <Text
                          style={[
                            v_d81136.commentHeartCount,
                            v_5cfb2c.likedByMe ? { color: "#ef4444" } : null,
                          ]}
                        >
                          {v_5cfb2c.likesCount ?? 0}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  </View>
                );
                })
              ) : (

                <View style={v_d81136.emptyComment}>
                  <Feather name="message-circle" size={40} color={v_1bfbd0.zinc300} />
                  <Text style={v_d81136.emptyText}>{v_8d41d7("feed.commentsEmpty")}</Text>
                </View>
              )}
            </ScrollView>
            {}
            {}
            {v_90b93a && (
              <View style={v_d81136.replyingBanner}>
                <Text style={v_d81136.replyingText}>
                  {v_8d41d7("home.replyTo", {
                    user: v_90b93a.userName,
                    defaultValue: `@${v_90b93a.userName} 에게 답글`,
                  })}
                </Text>
                <TouchableOpacity onPress={() => v_f1ad38(null)}>
                  <Feather name="x" size={14} color={v_1bfbd0.zinc500} />
                </TouchableOpacity>
              </View>
            )}
            <View style={v_d81136.commentInputRow}>
              <TextInput
                style={[v_d81136.commentInput, v_b0af20 && { opacity: 0.6 }]}
                value={v_48e7fe}
                onChangeText={v_856f84}
                editable={!v_b0af20}
                placeholder={
                  v_b0af20
                    ? v_8d41d7("home.commentSending", { defaultValue: "전송 중..." })
                    : v_90b93a
                    ? v_8d41d7("home.replyPlaceholder", { defaultValue: "답글 입력..." })
                    : v_8d41d7("feed.commentPlaceholder")
                }
                placeholderTextColor={v_1bfbd0.zinc400}
              />
              <TouchableOpacity
                disabled={!v_48e7fe.trim() || !v_2ca7e0 || v_b0af20}
                onPress={v_8e4668}
              >
                {}
                {v_b0af20 ? (
                  <ActivityIndicator size="small" color={v_1bfbd0.violet600} />
                ) : (
                  <Feather
                    name="send"
                    size={18}
                    color={
                      v_48e7fe.trim() && v_2ca7e0
                        ? v_1bfbd0.violet600
                        : v_1bfbd0.zinc400
                    }
                  />
                )}
              </TouchableOpacity>
            </View>
          </SwipeDownSheet>
        </Pressable>
      </Modal>

      {}

      {
}
      <Modal visible={!!v_12fa22} transparent animationType="fade">
        <Pressable style={v_d81136.moreOverlay} onPress={() => v_949e66(null)}>
          <SwipeDownSheet
            onClose={() => v_949e66(null)}
            style={[v_d81136.moreSheet, { paddingBottom: 24 + Math.max(v_033e14.bottom, 0) }]}
          >
            <View style={v_d81136.moreSheetHandle} />
            <Text style={v_d81136.moreTitle}>{v_12fa22?.author}</Text>

            {v_12fa22?.isOwn ? (

              <>
                <TouchableOpacity
                  style={v_d81136.moreItem}
                  onPress={() => {
                    const v_5f5d6d = v_12fa22;
                    v_949e66(null);
                    if (!v_5f5d6d) return;

                    v_f4c991.dispatch(
                      v_650cfa.navigate({
                        name: "Main",
                        params: {
                          screen: "ClonesTab",
                          params: {
                            screen: "CloneEdit",
                            params: { cloneId: v_5f5d6d.cloneId },
                          },
                        },
                      }),
                    );
                  }}
                >
                  <Feather name="edit-3" size={20} color={v_1bfbd0.zinc900} />
                  <Text style={v_d81136.moreItemText}>
                    {v_8d41d7("home.more.edit", { defaultValue: "수정하기" })}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={v_d81136.moreItem}
                  onPress={() => {
                    const v_5f5d6d = v_12fa22;
                    v_949e66(null);
                    if (!v_5f5d6d) return;

                    const v_275ccd = (v_5f5d6d.visibility as v_b0b271 | undefined) ?? "public";
                    v_ddfad5({ cloneId: v_5f5d6d.cloneId, currentVisibility: v_275ccd });
                  }}
                >
                  <Feather name="eye" size={20} color={v_1bfbd0.zinc900} />
                  <Text style={v_d81136.moreItemText}>
                    {v_8d41d7("home.more.editVisibility", { defaultValue: "공개 범위 수정" })}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[v_d81136.moreItem, { borderBottomWidth: 0 }]}
                  onPress={async () => {
                    const v_5f5d6d = v_12fa22;
                    v_949e66(null);
                    if (!v_5f5d6d || !v_2ca7e0) return;

                    v_889fad(
                      v_8d41d7("home.deleteTitle", { defaultValue: "클론 삭제" }),
                      v_8d41d7("home.deleteDesc", {
                        name: v_5f5d6d.author,
                        defaultValue: `'${v_5f5d6d.author}' 클론을 삭제할까요?\n복구 불가합니다.`,
                      }),
                      [
                        { text: v_8d41d7("common.cancel", { defaultValue: "취소" }), style: "cancel" },
                        {
                          text: v_8d41d7("common.delete", { defaultValue: "삭제" }),
                          style: "destructive",
                          onPress: async () => {
                            try {
                              const { deleteClone: v_f373d8 } = await import("../../api/clones");
                              await v_f373d8(v_2ca7e0, v_5f5d6d.cloneId);
                              v_15c939(
                                v_8d41d7("home.toasts.cloneDeleted", {
                                  defaultValue: "클론이 삭제됐어요",
                                }),
                              );
                              const v_c3bc75 = v_37977a.getState().apiFeeds;
                              if (v_c3bc75) {
                                v_37977a.setState({
                                  apiFeeds: v_c3bc75.filter((v_23805a) => v_23805a.cloneId !== v_5f5d6d.cloneId),
                                });
                              }
                              void v_c600ef();
                            } catch (v_49263d) {
                              console.warn("[Delete clone] failed:", v_49263d);
                              v_15c939(
                                v_8d41d7("home.toasts.deleteFailed", {
                                  defaultValue: "삭제에 실패했어요",
                                }),
                              );
                            }
                          },
                        },
                      ],
                    );
                  }}
                >
                  <Feather name="trash-2" size={20} color="#ef4444" />
                  <Text style={[v_d81136.moreItemText, { color: "#ef4444" }]}>
                    {v_8d41d7("home.more.delete", { defaultValue: "삭제" })}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (

              <>
                <TouchableOpacity
                  style={v_d81136.moreItem}
                  onPress={() => {
                    const v_5f5d6d = v_12fa22;
                    v_949e66(null);
                    if (!v_5f5d6d) return;

                    v_fdd7c1({ cloneId: v_5f5d6d.cloneId, author: v_5f5d6d.author });
                  }}
                >
                  <Feather name="flag" size={20} color="#ef4444" />
                  <Text style={[v_d81136.moreItemText, { color: "#ef4444" }]}>
                    {v_8d41d7("home.more.report", { defaultValue: "신고하기" })}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[v_d81136.moreItem, { borderBottomWidth: 0 }]}
                  onPress={async () => {
                    const v_5f5d6d = v_12fa22;
                    v_949e66(null);
                    if (!v_5f5d6d || !v_2ca7e0) return;
                    try {
                      await v_97c75d(v_2ca7e0, v_5f5d6d.cloneId);
                      v_15c939(
                        v_8d41d7("home.toasts.cloneBlocked", {
                          defaultValue: "이 클론이 차단됐어요",
                        }),
                      );
                      const v_c3bc75 = v_37977a.getState().apiFeeds;
                      if (v_c3bc75) {
                        v_37977a.setState({
                          apiFeeds: v_c3bc75.filter((v_23805a) => v_23805a.cloneId !== v_5f5d6d.cloneId),
                        });
                      }
                      await v_b4902e.getState().unfollowLocalForBlock(v_5f5d6d.cloneId);
                      void v_c600ef();
                    } catch (v_49263d) {
                      console.warn(`[BLOCK] FAILED cloneId=${v_5f5d6d.cloneId}`, v_49263d);
                      v_15c939(
                        v_8d41d7("home.toasts.blockFailed", {
                          defaultValue: "차단에 실패했어요",
                        }),
                      );
                    }
                  }}
                >
                  <Feather name="slash" size={20} color={v_1bfbd0.zinc900} />
                  <Text style={v_d81136.moreItemText}>
                    {v_8d41d7("home.more.block", { defaultValue: "차단하기" })}
                  </Text>
                </TouchableOpacity>
              </>
            )}
            {}
          </SwipeDownSheet>
        </Pressable>
      </Modal>

      {}
      <ReportReasonModal
        visible={!!v_b38909}
        targetName={v_b38909?.author}
        onCancel={() => v_c03d7d(null)}
        onConfirm={async (v_58ca36) => {
          const v_5f5d6d = v_b38909;
          v_c03d7d(null);
          if (!v_5f5d6d || !v_2ca7e0 || v_ed660d == null) return;
          try {
            const { reportFeedComment: v_fca2f4 } = await import("../../api/clones");
            await v_fca2f4(
              v_2ca7e0,
              v_ed660d,
              v_5f5d6d.commentId,
              v_58ca36 || undefined,
            );
            v_15c939(
              v_8d41d7("home.toasts.commentReported", {
                defaultValue: "댓글이 신고됐어요",
              }),
            );
          } catch (v_49263d) {
            console.warn(`[REPORT-COMMENT] FAILED commentId=${v_5f5d6d.commentId}`, v_49263d);
            v_15c939(
              v_8d41d7("home.toasts.reportFailed", {
                defaultValue: "신고에 실패했어요",
              }),
            );
          }
        }}
      />

      {}
      <ReportReasonModal
        visible={!!v_f18195}
        targetName={v_f18195?.author}
        onCancel={() => v_fdd7c1(null)}
        onConfirm={async (v_58ca36) => {
          const v_5f5d6d = v_f18195;
          v_fdd7c1(null);
          if (!v_5f5d6d || !v_2ca7e0) return;

          try {
            const { reportClone: v_9deb40 } = await import("../../api/clones");
            await v_9deb40(v_2ca7e0, v_5f5d6d.cloneId, v_58ca36 || undefined);
            v_15c939(
              v_8d41d7("home.toasts.reportSuccessBlocked", {
                defaultValue: "신고가 접수됐어요. 이 클론은 차단됐어요",
              }),
            );
            const v_c3bc75 = v_37977a.getState().apiFeeds;
            if (v_c3bc75) {
              v_37977a.setState({
                apiFeeds: v_c3bc75.filter((v_23805a) => v_23805a.cloneId !== v_5f5d6d.cloneId),
              });
            }
            await v_b4902e.getState().unfollowLocalForBlock(v_5f5d6d.cloneId);
            void v_c600ef();
          } catch (v_49263d) {
            console.warn(`[REPORT] FAILED cloneId=${v_5f5d6d.cloneId}`, v_49263d);
            v_15c939(
              v_8d41d7("home.toasts.reportFailed", {
                defaultValue: "신고에 실패했어요",
              }),
            );
          }
        }}
      />

      {v_8282fa && (
        <View style={v_d81136.toast}>
          <Text style={v_d81136.toastText}>{v_8282fa}</Text>
        </View>
      )}

      {}
      <VisibilityPickerModal
        visible={!!v_2a0bbc}
        currentVisibility={v_2a0bbc?.currentVisibility ?? null}
        onClose={() => v_ddfad5(null)}
        onSelect={async (v_81e2ef) => {
          const v_5f5d6d = v_2a0bbc;
          v_ddfad5(null);
          if (!v_5f5d6d) return;
          if (v_81e2ef === "selected") {
            v_4ccd21(v_5f5d6d.cloneId);
            return;
          }

          const v_a73fa2 = v_37977a.getState();
          if (v_a73fa2.apiFeeds) {
            v_37977a.setState({
              apiFeeds: v_a73fa2.apiFeeds.map((v_8b5cd8) =>
                v_8b5cd8.clone.id === v_5f5d6d.cloneId
                  ? { ...v_8b5cd8, clone: { ...v_8b5cd8.clone, visibility: v_81e2ef } }
                  : v_8b5cd8,
              ),
            });
          }
          if (!v_2ca7e0) return;
          try {
            const { patchClone: v_bb226e } = await import("../../api/clones");
            await v_bb226e(v_2ca7e0, v_5f5d6d.cloneId, {
              visibility: v_81e2ef,
              allowed_viewers: [],
            });
            v_15c939(
              v_8d41d7("home.toasts.visibilityUpdated", { defaultValue: "공개 범위가 변경됐어요" }),
            );
          } catch (v_49263d) {
            console.warn("[Home] update visibility failed:", v_49263d);
            v_15c939(
              v_8d41d7("home.toasts.visibilityFailed", { defaultValue: "공개 범위 변경에 실패했어요" }),
            );
          }
        }}
      />

      {}
      <FriendPickerModal
        visible={v_480a32 != null}
        onClose={() => v_4ccd21(null)}
        onConfirm={async (v_9b3001) => {
          const v_6e0fd3 = v_480a32;
          v_4ccd21(null);
          if (!v_6e0fd3) return;
          const v_a73fa2 = v_37977a.getState();
          if (v_a73fa2.apiFeeds) {
            v_37977a.setState({
              apiFeeds: v_a73fa2.apiFeeds.map((v_8b5cd8) =>
                v_8b5cd8.clone.id === v_6e0fd3
                  ? { ...v_8b5cd8, clone: { ...v_8b5cd8.clone, visibility: "selected" } }
                  : v_8b5cd8,
              ),
            });
          }
          if (!v_2ca7e0) return;
          try {
            const { patchClone: v_bb226e } = await import("../../api/clones");
            await v_bb226e(v_2ca7e0, v_6e0fd3, {
              visibility: "selected",
              allowed_viewers: v_9b3001,
            });
            v_15c939(
              v_8d41d7("home.toasts.visibilityUpdated", { defaultValue: "공개 범위가 변경됐어요" }),
            );
          } catch (v_49263d) {
            console.warn("[Home] selected visibility PATCH failed:", v_49263d);
          }
        }}
      />

      {}
      <IntimacyEventsSheet
        visible={!!v_d3a183}
        cloneId={v_d3a183?.cloneId ?? null}
        cloneName={v_d3a183?.cloneName ?? ""}
        onClose={() => v_598141(null)}
      />
      {}
      <GiftReceiptsSheet
        visible={!!v_5e9fb7}
        cloneId={v_5e9fb7?.cloneId ?? null}
        cloneName={v_5e9fb7?.cloneName ?? ""}
        onClose={() => v_cc306d(null)}
      />
    </View>
  );
}

const v_d81136 = v_472849.create({
  root: {
    flex: 1,
    backgroundColor: v_1bfbd0.zinc950,
  },
  topOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    zIndex: 40,
  },
  tagsRow: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  topTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: v_8b0c90.full,
  },
  topTagText: {
    fontSize: 12,
    fontWeight: "500",
    color: v_1bfbd0.white,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },

  commentOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  commentSheet: { backgroundColor: v_1bfbd0.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 24, height: "70%" },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: v_1bfbd0.zinc300, alignSelf: "center", marginTop: 12, marginBottom: 12 },
  commentHeaderRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 12 },

  commentHeaderRowBottom: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingTop: 8, paddingBottom: 4 },

  detailHeader: { paddingBottom: 16, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: v_1bfbd0.zinc100 },

  detailProfileRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 12, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: v_1bfbd0.zinc100 },
  detailAvatar: { width: 40, height: 40, borderRadius: 20 },
  detailAuthor: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.zinc900 },
  detailUsername: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  detailDescription: { fontSize: 14, color: v_1bfbd0.zinc700, lineHeight: 20, marginBottom: 14 },
  detailStatsRow: { flexDirection: "row", gap: 8 },
  detailStatCard: { flex: 1, backgroundColor: v_1bfbd0.zinc50, borderRadius: 12, paddingVertical: 10, alignItems: "center" },
  detailStatValue: { fontSize: 16, fontWeight: "700", color: v_1bfbd0.zinc900 },
  detailStatLabel: { fontSize: 11, color: v_1bfbd0.zinc500, marginTop: 2 },
  commentTitle: { fontSize: 16, fontWeight: "700", color: v_1bfbd0.zinc900 },
  commentScroll: { flex: 1 },

  commentBlock: { marginBottom: 16 },

  commentRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },

  replyIndent: { width: 42 },
  commentHeart: { alignItems: "center", paddingHorizontal: 4, paddingTop: 2, minWidth: 28 },
  commentHeartCount: { fontSize: 11, color: v_1bfbd0.zinc500, marginTop: 2 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: v_1bfbd0.zinc100 },
  commentInfo: { flex: 1 },
  commentMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  commentAuthor: { fontSize: 13, fontWeight: "600", color: v_1bfbd0.zinc900 },
  commentTime: { fontSize: 12, color: v_1bfbd0.zinc500 },
  commentContent: { fontSize: 14, color: v_1bfbd0.zinc800, lineHeight: 20 },
  emptyComment: { alignItems: "center", paddingVertical: 40 },
  emptyCommentGray: { fontSize: 14, color: v_1bfbd0.zinc400 },
  emptyText: { fontSize: 14, color: v_1bfbd0.zinc400, marginTop: 8 },
  commentInputRow: { flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderTopColor: v_1bfbd0.zinc100, paddingTop: 12 },
  commentInput: { flex: 1, height: 40, backgroundColor: v_1bfbd0.zinc50 ?? v_1bfbd0.zinc100, borderRadius: 20, paddingHorizontal: 16, fontSize: 14, color: v_1bfbd0.zinc900 },

  replyActions: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 6 },
  replyActionText: { fontSize: 12, fontWeight: "600", color: v_1bfbd0.zinc500 },
  replyToggleText: { fontSize: 12, fontWeight: "600", color: v_1bfbd0.zinc500 },
  replyRow: { flexDirection: "row", gap: 8, marginTop: 10, alignItems: "flex-start" },
  replyAvatar: { width: 24, height: 24, borderRadius: 12 },
  replyingBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6, paddingHorizontal: 4, backgroundColor: v_1bfbd0.zinc50 ?? v_1bfbd0.zinc100, borderRadius: 8, marginTop: 6 },
  replyingText: { fontSize: 12, color: v_1bfbd0.zinc600 },

  moreOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  moreSheet: { backgroundColor: v_1bfbd0.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 0, paddingHorizontal: 16 },
  moreSheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: v_1bfbd0.zinc300, alignSelf: "center", marginVertical: 12 },
  moreTitle: { fontSize: 13, color: v_1bfbd0.zinc500, textAlign: "center", paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: v_1bfbd0.zinc100 },
  moreItem: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: v_1bfbd0.zinc100 },
  moreItemText: { fontSize: 15, fontWeight: "500", color: v_1bfbd0.zinc900 },
  toast: { position: "absolute", bottom: 80, alignSelf: "center", paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "rgba(0,0,0,0.85)", borderRadius: v_8b0c90.full },
  toastText: { color: v_1bfbd0.white, fontSize: 14 },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: v_1bfbd0.white,
    marginBottom: 10,
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: v_1bfbd0.white,
    borderRadius: v_8b0c90.full,
  },
  emptyBtnText: { fontSize: 14, fontWeight: "700", color: v_1bfbd0.zinc950 },
});
