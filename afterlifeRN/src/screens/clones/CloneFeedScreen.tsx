

import v_a3453e, { v_c4deb2, v_e662ae, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_700696,
  v_5f4661,
  v_aa7413,
  v_09d0e5,
  v_122070,
  v_79c4f2,
  v_cf9c33,
  v_0e1f26,
  v_326be8,
} from "rcmrninabrnb";
import { v_dec439, v_25515d } from "zvyjokvuouwvifyzks";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_c18c22 } from "svuoaeceudfxfjvvpmmmchnwljywbphjgb";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_432191 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_8ad91b } from "../../navigation/types";
import v_9706a6 from "../../components/ui/FeedCard";
import v_8e7ad4 from "../../components/ui/SwipeDownSheet";
import type { v_19b433 } from "../../types/feed";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_b4902e } from "../../stores/followStore";
import { v_37977a } from "../../stores/feedStore";
import { v_03e392 } from "rcmrninabrnb";
import {
  v_b14fce,
  v_0ff331,
  v_4208e7,
  v_776874,
  v_3f8bc7,
  v_6f689a,
  v_0df337,
  v_003cf2,
  v_9deb40,
  v_97c75d,
  v_f5a9ea,
  v_f1ff2a,
  v_99e260,
  v_ba8b3a,
  type v_52af9d,
} from "../../api/clones";
import v_4d58d7 from "../../components/common/ReportReasonModal";
import { v_bfd883 } from "../../lib/relativeTime";
import { v_1bfbd0 } from "../../components/constants";

type Props = v_432191<v_8ad91b, "CloneFeed">;

export default function v_9887a2({ route: v_c7daf6, navigation: v_c65f5d }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const { feed: v_2db2a5 } = v_c7daf6.params;
  const v_033e14 = v_e0068c();
  const v_f9771e = v_c18c22(0);

  const { height: v_28d8d8 } = v_700696.get("window");
  const v_53dd92 = v_f9771e > 0 ? v_f9771e : v_033e14.bottom;
  const v_3d6201 = v_28d8d8 - v_53dd92;

  const v_f5f393 = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser?.id ?? v_fd5f43.user?.id ?? null);
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);

  const v_1e752a = v_b4902e((v_fd5f43) => v_fd5f43.follows);
  const v_b30b81 = v_b4902e((v_fd5f43) => v_fd5f43.isFollowing);
  const v_3094d4 = v_b4902e((v_fd5f43) => v_fd5f43.toggleFollow);
  const v_632420 = v_37977a((v_fd5f43) => v_fd5f43.likedIds);
  const v_a96ced = v_37977a((v_fd5f43) => v_fd5f43.toggleLike);
  void v_1e752a; 

  let v_6856a9 = v_2db2a5.content ?? "";

  const v_167615 = /#[a-zA-Z0-9_가-힣ᄀ-ᇿㄱ-ㆎ]+/.test(v_6856a9);
  if (v_2db2a5.interests.length > 0 && !v_167615) {
    const v_cf5673 = v_2db2a5.interests.map((v_ebec57) => `#${v_ebec57}`).join(" ");
    v_6856a9 = v_6856a9.trim().length > 0 ? `${v_6856a9} ${v_cf5673}` : v_cf5673;
  }

  const [v_58313d, v_abdcca] = v_5ab095<number>(v_2db2a5.likesCount);
  const [v_7c0a2d, v_d9b4b4] = v_5ab095<number>(v_2db2a5.commentsCount ?? 0);

  const [v_6bbace, v_a97d6f] = v_5ab095<number>(v_2db2a5.id);

  const item: v_19b433 = {
    id: v_6bbace,
    cloneId: v_2db2a5.cloneId,
    cloneOwnerId: v_2db2a5.clone.ownerId,
    cloneVisibility: v_2db2a5.clone.visibility,
    author: v_2db2a5.clone.name,
    username: `@${v_2db2a5.clone.username}`,
    authorAvatar: v_2db2a5.clone.avatarUrl ?? "",
    image: v_2db2a5.mediaUrl ?? v_2db2a5.clone.avatarUrl ?? "",
    title: v_2db2a5.clone.name,
    description: v_6856a9,
    type: v_2db2a5.clone.cloneType,
    mainCategory: "",
    interests: v_2db2a5.interests,
    likes: String(v_58313d),
    comments: v_7c0a2d,
  };

  const [v_b84498, v_e24028] = v_5ab095<boolean>(v_2db2a5.likedByMe ?? v_632420.includes(v_6bbace));
  const v_799eb5 = v_f5f393 != null && v_8c0b26.cloneOwnerId === v_f5f393;

  v_c4deb2(() => {
    if (!v_2ca7e0) {
      console.warn(`[CloneFeed] learn-event SKIP — no accessToken (cloneId=${v_2db2a5.cloneId})`);
      return;
    }
    console.log(`[CloneFeed] POST /oth-path${v_2db2a5.cloneId}/learn-event`);
    v_ba8b3a(v_2ca7e0, v_2db2a5.cloneId)
      .then((v_8f00b9) =>
        console.log(`[CloneFeed] learn-event ← ok bumped=${v_8f00b9.bumped} scoreApplied=${(v_8f00b9 as { scoreApplied?: number }).scoreApplied ?? 0}°C (10분 쿨다운 적용)`),
      )
      .catch((v_49263d) => console.warn("[CloneFeed] learn event failed:", v_49263d));

  }, [v_2db2a5.cloneId]);

  v_c4deb2(() => {
    let v_2008a4 = false;
    (async () => {
      try {
        const v_8f00b9 = await v_003cf2(v_2db2a5.cloneId, v_2ca7e0 ?? undefined);
        if (v_2008a4) return;
        v_abdcca(v_8f00b9.clone.stats.likes ?? 0);
        v_d9b4b4(v_8f00b9.clone.stats.comments ?? 0);
        v_e24028(v_8f00b9.clone.likedByMe);
      } catch (v_49263d) {
        console.warn("[CloneFeed] hydrate detail failed:", v_49263d);
      }
    })();
    return () => {
      v_2008a4 = true;
    };
  }, [v_2db2a5.cloneId, v_2ca7e0]);

  const [v_3e9618, v_eda097] = v_5ab095(false);
  const [v_f18195, v_fdd7c1] = v_5ab095<{
    cloneId: number;
    author: string;
  } | null>(null);
  const [v_8282fa, v_15c939] = v_5ab095<string | null>(null);
  v_c4deb2(() => {
    if (v_8282fa) {
      const v_389afb = setTimeout(() => v_15c939(null), 2000);
      return () => clearTimeout(v_389afb);
    }
  }, [v_8282fa]);

  const v_d3af9c = async () => {
    const v_a448ad = !v_b84498;
    v_e24028(v_a448ad);
    v_a96ced(v_8c0b26.id);

    v_abdcca((v_ba2215) => Math.max(0, v_ba2215 + (v_a448ad ? 1 : -1)));
    if (!v_2ca7e0) return;
    try {
      if (v_a448ad) await v_b14fce(v_2ca7e0, v_8c0b26.cloneId);
      else await v_0ff331(v_2ca7e0, v_8c0b26.cloneId);
    } catch (v_49263d) {
      console.warn("[CloneFeed] like toggle failed:", v_49263d);

      v_e24028(!v_a448ad);
      v_abdcca((v_ba2215) => Math.max(0, v_ba2215 + (v_a448ad ? -1 : 1)));
    }
  };

  const v_f8043e = () => {
    v_c65f5d.navigate("Call", {
      cloneId: v_8c0b26.cloneId,
      name: v_8c0b26.author,
      image: v_8c0b26.image,
    });
  };

  const v_22cd2d = async () => {
    try {
      await v_5f4661.share({
        message: `${v_8c0b26.author} 페르소나와 만나보세요!\nhttps://afterlife.app/clone/${v_8c0b26.cloneId}`,
        title: v_8c0b26.author,
      });
    } catch (v_49263d) {
      console.warn("[CloneFeed] share failed:", v_49263d);
    }
  };

  const [v_1126f9, v_0c9768] = v_5ab095(false);
  const [v_ecfc0f, v_04f2fc] = v_5ab095<v_52af9d[]>([]);
  const [v_465030, v_856daf] = v_5ab095(false);
  const [v_48e7fe, v_856f84] = v_5ab095("");
  const v_4c2809 = v_e662ae(false);
  const [v_b0af20, v_52390e] = v_5ab095(false);

  const [v_90b93a, v_f1ad38] = v_5ab095<{ commentId: number; userName: string } | null>(null);
  const [v_2ced3d, v_74a05a] = v_5ab095<Record<number, v_52af9d[]>>({});

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

  v_c4deb2(() => {
    if (!v_1126f9) {
      v_04f2fc([]);

      v_74a05a({});
      v_f1ad38(null);
      return;
    }
    let v_2008a4 = false;
    v_856daf(true);
    v_04f2fc([]);

    v_74a05a({});
    const v_19e91c = v_6bbace < 0
      ? v_776874(v_2db2a5.cloneId, { limit: 100, accessToken: v_2ca7e0 })
      : v_4208e7(v_6bbace, { limit: 100, accessToken: v_2ca7e0 });
    v_19e91c
      .then((v_8f00b9) => {
        if (v_2008a4) return;
        v_04f2fc(v_8f00b9.items);
      })
      .catch((v_49263d) => {
        console.warn("[CloneFeed] list comments failed:", v_49263d);
        if (!v_2008a4) v_04f2fc([]);
      })
      .finally(() => {
        if (!v_2008a4) v_856daf(false);
      });
    return () => {
      v_2008a4 = true;
    };
  }, [v_1126f9, v_6bbace, v_2db2a5.cloneId]);

  const v_8e4668 = async () => {
    if (v_4c2809.current) return;
    const v_b43b74 = v_48e7fe.trim();
    if (!v_b43b74 || !v_2ca7e0) return;

    v_0e1f26.dismiss();
    v_4c2809.current = true;
    v_52390e(true);
    try {
      let v_bb71b6;
      if (v_90b93a) {

        const v_4eab4b = v_ecfc0f.find((v_3f4e2e) => v_3f4e2e.id === v_90b93a.commentId);
        const v_8e2335 = v_4eab4b?.feedId ?? (v_6bbace > 0 ? v_6bbace : 0);
        if (!v_8e2335) {
          v_4c2809.current = false;
          v_52390e(false);
          return;
        }
        await v_3f8bc7(v_2ca7e0, v_8e2335, v_b43b74, {
          parentCommentId: v_90b93a.commentId,
        });
        v_bb71b6 = v_8e2335;
      } else if (v_6bbace < 0) {

        const v_8f00b9 = await v_6f689a(v_2ca7e0, v_2db2a5.cloneId, v_b43b74);
        v_bb71b6 = v_8f00b9.comment.feedId;
        v_a97d6f(v_bb71b6);
      } else {
        await v_3f8bc7(v_2ca7e0, v_6bbace, v_b43b74);
        v_bb71b6 = v_6bbace;
      }
      v_856f84("");
      if (v_90b93a) {
        try {
          const v_f10744 = await v_f5a9ea(v_bb71b6, v_90b93a.commentId, { limit: 100, accessToken: v_2ca7e0 });
          v_74a05a((v_e2a85c) => ({ ...v_e2a85c, [v_90b93a.commentId]: v_f10744.items }));
          v_04f2fc((v_ba2215) =>
            v_ba2215.map((v_3f4e2e) =>
              v_3f4e2e.id === v_90b93a.commentId ? { ...v_3f4e2e, repliesCount: v_f10744.items.length } : v_3f4e2e,
            ),
          );
          v_d9b4b4((v_f4e98d) => v_f4e98d + 1);
        } catch (v_49263d) {
          console.warn("[CloneFeed] refresh replies failed:", v_49263d);
        }
        v_f1ad38(null);
      } else {
        const v_cb35cb = await v_4208e7(v_bb71b6, { limit: 100, accessToken: v_2ca7e0 });
        v_04f2fc(v_cb35cb.items);
        v_d9b4b4(v_cb35cb.items.length);
      }
    } catch (v_49263d) {
      console.warn("[CloneFeed] postFeedComment failed:", v_49263d);
    } finally {
      v_4c2809.current = false;
      v_52390e(false);
    }
  };

  const v_b72645 = (v_d91518) => {
    if (v_6bbace < 0 || !v_2ca7e0) return;
    void (async () => {
      try {
        await v_0df337(v_2ca7e0, v_6bbace, v_d91518);
        v_04f2fc((v_ba2215) => {
          const v_a448ad = v_ba2215.filter((v_3f4e2e) => v_3f4e2e.id !== v_d91518);
          v_d9b4b4(v_a448ad.length);
          return v_a448ad;
        });
      } catch (v_49263d) {
        console.warn("[CloneFeed] deleteFeedComment failed:", v_49263d);
      }
    })();
  };

  const v_71affe = (
    comment: v_52af9d,
    v_fdf350,
  ) => {
    if (!v_2ca7e0) return;

    const v_8e2335 = v_61b01a.feedId ?? (v_6bbace > 0 ? v_6bbace : 0);
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
        console.warn("[CloneFeed] toggleCommentLike failed:", v_49263d);

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

  return (
    <View style={v_d81136.root}>
      <FeedCard
        item={v_8c0b26}
        isActive
        isLiked={v_b84498}
        isFollowed={v_b30b81(v_8c0b26.cloneId)}
        isOwn={v_799eb5}
        cardHeight={v_3d6201}
        onToggleLike={v_d3af9c}
        onToggleFollow={() => void v_3094d4(v_8c0b26.cloneId)}
        onCallPress={v_f8043e}
        onCommentPress={() => v_0c9768(true)}
        onMorePress={() => v_eda097(true)}
        onSharePress={v_22cd2d}
      />

      {}
      <TouchableOpacity
        onPress={() => v_c65f5d.goBack()}
        style={[v_d81136.backBtn, { top: v_033e14.top + 8 }]}
        hitSlop={12}
      >
        <Feather name="arrow-left" size={26} color={v_1bfbd0.white} />
      </TouchableOpacity>

      {}
      <Modal visible={v_1126f9} transparent animationType="slide">
        <Pressable
          style={v_d81136.commentOverlay}
          onPress={() => {
            v_0e1f26.dismiss();
            v_0c9768(false);
          }}
        >
          <SwipeDownSheet
            onClose={() => {
              v_0e1f26.dismiss();
              v_0c9768(false);
            }}
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
            {}
            <View style={v_d81136.commentHeaderRow}>
              <Text style={v_d81136.commentTitle}>
                {v_8d41d7("feed.commentCount", { n: v_ecfc0f.length })}
              </Text>
            </View>
            <ScrollView style={v_d81136.commentScroll} showsVerticalScrollIndicator={false}>
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
                      <View
                        style={[
                          v_d81136.commentAvatar,
                          { backgroundColor: v_1bfbd0.zinc100 },
                        ]}
                      />
                    )}
                    <View style={v_d81136.commentInfo}>
                      <View style={v_d81136.commentMeta}>
                        <Text style={v_d81136.commentAuthor}>
                          {v_3f4e2e.user.name ?? v_3f4e2e.user.email}
                        </Text>
                        <Text style={v_d81136.commentTime}>{v_bfd883(v_3f4e2e.createdAt)}</Text>
                        {v_3f4e2e.userId === v_f5f393 && (
                          <TouchableOpacity
                            onPress={() => v_b72645(v_3f4e2e.id)}
                            style={{ marginLeft: 8 }}
                          >
                            <Feather name="trash-2" size={14} color={v_1bfbd0.zinc400} />
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={v_d81136.commentContent}>{v_3f4e2e.content}</Text>
                      <View style={v_d81136.replyActions}>
                        <TouchableOpacity
                          onPress={() =>
                            v_f1ad38({
                              commentId: v_3f4e2e.id,
                              userName: v_3f4e2e.user.name ?? v_3f4e2e.user.email ?? "",
                            })
                          }
                        >
                          <Text style={v_d81136.replyActionText}>답글 달기</Text>
                        </TouchableOpacity>
                        {(v_3f4e2e.repliesCount ?? 0) > 0 && (
                          <TouchableOpacity
                            onPress={async () => {

                              const v_8e2335 = v_6bbace > 0 ? v_6bbace : (v_3f4e2e.feedId ?? 0);
                              if (!v_8e2335) return;
                              if (v_f72477) {
                                v_74a05a((v_e2a85c) => {
                                  const v_f4e98d = { ...v_e2a85c };
                                  delete v_f4e98d[v_3f4e2e.id];
                                  return v_f4e98d;
                                });
                              } else {
                                try {
                                  const v_cb35cb = await v_f5a9ea(v_8e2335, v_3f4e2e.id, { limit: 100, accessToken: v_2ca7e0 });
                                  v_74a05a((v_e2a85c) => ({ ...v_e2a85c, [v_3f4e2e.id]: v_cb35cb.items }));
                                } catch (v_49263d) {
                                  console.warn("[CloneFeed] listReplies failed:", v_49263d);
                                }
                              }
                            }}
                          >
                            <Text style={v_d81136.replyToggleText}>
                              {v_f72477
                                ? "── 답글 숨기기"
                                : `── 답글 ${v_3f4e2e.repliesCount}개 더 보기`}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    {}
                    <TouchableOpacity
                      style={v_d81136.commentHeart}
                      onPress={() => v_71affe(v_3f4e2e)}
                      hitSlop={8}
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
                      {}
                      <TouchableOpacity
                        style={v_d81136.commentHeart}
                        onPress={() => v_71affe(v_5cfb2c, v_3f4e2e.id)}
                        hitSlop={8}
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
            {v_90b93a && (
              <View style={v_d81136.replyingBanner}>
                <Text style={v_d81136.replyingText}>@{v_90b93a.userName} 에게 답글</Text>
                <TouchableOpacity onPress={() => v_f1ad38(null)}>
                  <Feather name="x" size={14} color={v_1bfbd0.zinc500} />
                </TouchableOpacity>
              </View>
            )}
            <View style={v_d81136.commentInputRow}>
              <TextInput
                style={v_d81136.commentInput}
                value={v_48e7fe}
                onChangeText={v_856f84}
                placeholder={v_90b93a ? "답글 입력..." : v_8d41d7("feed.commentPlaceholder")}
                placeholderTextColor={v_1bfbd0.zinc400}
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
                      ? v_1bfbd0.violet600
                      : v_1bfbd0.zinc400
                  }
                />
              </TouchableOpacity>
            </View>
          </SwipeDownSheet>
        </Pressable>
      </Modal>

      {}
      <Modal visible={v_3e9618} transparent animationType="fade">
        <Pressable style={v_d81136.moreOverlay} onPress={() => v_eda097(false)}>
          <SwipeDownSheet
            onClose={() => v_eda097(false)}
            style={[v_d81136.moreSheet, { paddingBottom: 24 + Math.max(v_033e14.bottom, 0) }]}
          >
            <View style={v_d81136.moreSheetHandle} />
            <Text style={v_d81136.moreTitle}>{v_8c0b26.author}</Text>
            {!v_799eb5 && (
              <>
                {v_8c0b26.cloneOwnerId != null && (
                <TouchableOpacity
                  style={v_d81136.moreItem}
                  onPress={() => {
                    v_eda097(false);
                    if (v_8c0b26.cloneOwnerId == null) return;
                    v_c65f5d.navigate("UserProfile", {
                      userId: v_8c0b26.cloneOwnerId,
                    });
                  }}
                >
                  <Feather name="user" size={20} color="#0f172a" />
                  <Text style={v_d81136.moreItemText}>유저 정보보기</Text>
                </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={v_d81136.moreItem}
                  onPress={() => {
                    v_eda097(false);
                    v_fdd7c1({ cloneId: v_8c0b26.cloneId, author: v_8c0b26.author });
                  }}
                >
                  <Feather name="flag" size={20} color="#ef4444" />
                  <Text style={[v_d81136.moreItemText, { color: "#ef4444" }]}>신고하기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[v_d81136.moreItem, { borderBottomWidth: 0 }]}
                  onPress={async () => {
                    v_eda097(false);
                    if (!v_2ca7e0) return;
                    try {
                      await v_97c75d(v_2ca7e0, v_8c0b26.cloneId);
                      v_15c939("이 페르소나가 차단됐어요");
                      v_c65f5d.goBack();
                    } catch (v_49263d) {
                      console.warn("[CloneFeed] block failed:", v_49263d);
                      v_15c939("차단에 실패했어요");
                    }
                  }}
                >
                  <Feather name="slash" size={20} color="#0f172a" />
                  <Text style={v_d81136.moreItemText}>차단하기</Text>
                </TouchableOpacity>
              </>
            )}
          </SwipeDownSheet>
        </Pressable>
      </Modal>

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
            await v_9deb40(v_2ca7e0, v_5f5d6d.cloneId, v_58ca36 || undefined);
            v_15c939("신고가 접수됐어요. 이 페르소나는 차단됐어요");
            v_c65f5d.goBack();
          } catch (v_49263d) {
            console.warn("[CloneFeed] report failed:", v_49263d);
            v_15c939("신고에 실패했어요");
          }
        }}
      />

      {v_8282fa && (
        <View style={v_d81136.toast}>
          <Text style={v_d81136.toastText}>{v_8282fa}</Text>
        </View>
      )}
    </View>
  );
}

const v_d81136 = v_472849.create({
  root: { flex: 1, backgroundColor: "#000" },
  backBtn: {
    position: "absolute",
    left: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    zIndex: 10,
  },

  commentOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  commentSheet: {
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
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
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  commentTitle: { fontSize: 16, fontWeight: "700", color: v_1bfbd0.zinc900 },
  commentScroll: { flex: 1, marginTop: 12 },

  commentBlock: { marginBottom: 16 },

  commentRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  commentHeart: { alignItems: "center", paddingHorizontal: 4, paddingTop: 2, minWidth: 28 },
  commentHeartCount: { fontSize: 11, color: v_1bfbd0.zinc500, marginTop: 2 },

  replyIndent: { width: 42 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: v_1bfbd0.zinc100 },
  commentInfo: { flex: 1 },
  commentMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  commentAuthor: { fontSize: 13, fontWeight: "600", color: v_1bfbd0.zinc900 },
  commentTime: { fontSize: 11, color: v_1bfbd0.zinc500 },
  commentContent: { fontSize: 14, color: v_1bfbd0.zinc800, lineHeight: 19 },
  emptyComment: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 13, color: v_1bfbd0.zinc400, marginTop: 8 },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: v_1bfbd0.zinc100,
    paddingTop: 12,
  },
  commentInput: {
    flex: 1,
    height: 40,
    backgroundColor: v_1bfbd0.zinc50 ?? v_1bfbd0.zinc100,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    color: v_1bfbd0.zinc900,
  },
  replyActions: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 6 },
  replyActionText: { fontSize: 12, fontWeight: "600", color: v_1bfbd0.zinc500 },
  replyToggleText: { fontSize: 12, fontWeight: "600", color: v_1bfbd0.zinc500 },
  replyRow: { flexDirection: "row", gap: 8, marginTop: 10, alignItems: "flex-start" },
  replyAvatar: { width: 24, height: 24, borderRadius: 12 },
  replyingBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6, paddingHorizontal: 4, backgroundColor: v_1bfbd0.zinc50 ?? v_1bfbd0.zinc100, borderRadius: 8, marginTop: 6 },
  replyingText: { fontSize: 12, color: v_1bfbd0.zinc600 },

  moreOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  moreSheet: {
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 0,
    paddingHorizontal: 16,
  },
  moreSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#cbd5e1",
    alignSelf: "center",
    marginVertical: 12,
  },
  moreTitle: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  moreItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  moreItemText: { fontSize: 15, color: "#0f172a" },
  toast: {
    position: "absolute",
    bottom: 80,
    left: 24,
    right: 24,
    backgroundColor: "rgba(0,0,0,0.85)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  toastText: { color: v_1bfbd0.white, fontSize: 13 },
});
