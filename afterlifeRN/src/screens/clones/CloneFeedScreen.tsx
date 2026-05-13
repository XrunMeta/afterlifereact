

import v_a3453e, { v_5ab095 } from "bapkr";
import { v_3094a2, v_472849, v_4623af, v_700696, v_5f4661 } from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_c18c22 } from "svuoaeceudfxfjvvpmmmchnwljywbphjgb";
import type { v_432191 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_8ad91b } from "../../navigation/types";
import v_9706a6 from "../../components/ui/FeedCard";
import type { v_19b433 } from "../../types/feed";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_b4902e } from "../../stores/followStore";
import { v_37977a } from "../../stores/feedStore";
import { v_b14fce, v_0ff331 } from "../../api/clones";
import { v_1bfbd0 } from "../../components/constants";

type Props = v_432191<v_8ad91b, "CloneFeed">;

const v_e4d4c8 = 56;

export default function v_9887a2({ route: v_c7daf6, navigation: v_c65f5d }: Props) {
  const { feed: v_2db2a5 } = v_c7daf6.params;
  const v_033e14 = v_e0068c();
  const v_f9771e = v_c18c22(0);

  const { height: v_28d8d8 } = v_700696.get("window");
  const v_53dd92 = v_f9771e > 0 ? v_f9771e : v_033e14.bottom;
  const v_3d6201 = v_28d8d8 - v_53dd92;

  const v_f5f393 = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser?.id ?? v_fd5f43.user?.id ?? null);
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_b30b81 = v_b4902e((v_fd5f43) => v_fd5f43.isFollowing);
  const v_3094d4 = v_b4902e((v_fd5f43) => v_fd5f43.toggleFollow);
  const v_632420 = v_37977a((v_fd5f43) => v_fd5f43.likedIds);
  const v_a96ced = v_37977a((v_fd5f43) => v_fd5f43.toggleLike);

  let v_6856a9 = v_2db2a5.content ?? "";
  const v_167615 = /#[\p{L}\p{N}_]+/u.test(v_6856a9);
  if (v_2db2a5.interests.length > 0 && !v_167615) {
    const v_cf5673 = v_2db2a5.interests.map((v_ebec57) => `#${v_ebec57}`).join(" ");
    v_6856a9 = v_6856a9.trim().length > 0 ? `${v_6856a9} ${v_cf5673}` : v_cf5673;
  }
  const item: v_19b433 = {
    id: v_2db2a5.id,
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
    likes: String(v_2db2a5.likesCount),
    comments: v_2db2a5.commentsCount ?? 0,
  };

  const [v_b84498, v_e24028] = v_5ab095<boolean>(v_2db2a5.likedByMe ?? v_632420.includes(v_8c0b26.id));
  const v_799eb5 = v_f5f393 != null && v_8c0b26.cloneOwnerId === v_f5f393;

  const v_d3af9c = async () => {
    const v_a448ad = !v_b84498;
    v_e24028(v_a448ad);
    v_a96ced(v_8c0b26.id);
    if (!v_2ca7e0) return;
    try {
      if (v_a448ad) await v_b14fce(v_2ca7e0, v_8c0b26.cloneId);
      else await v_0ff331(v_2ca7e0, v_8c0b26.cloneId);
    } catch (v_49263d) {
      console.warn("[CloneFeed] like toggle failed:", v_49263d);
      v_e24028(!v_a448ad);
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
});

void v_e4d4c8;
