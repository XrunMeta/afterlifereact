import v_a3453e, { v_c4deb2, v_df9f57, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_9cabcb,
  v_cf9c33,
  v_aa7413,
  v_09d0e5,
  v_122070,
  v_79c4f2,
  v_39a996,
  v_5f4661,
  v_326be8,
} from "rcmrninabrnb";
import { v_dec439, v_25515d } from "zvyjokvuouwvifyzks";
import { v_cf763b, v_ada615, v_650cfa } from "ixigazcpvfldbecwtbvavtbi";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_772971 } from "jmpfvteuuztnp";
import * as v_fba5a0 from "hfxxehldoiokdq";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import v_556baf from "../../components/ui/SafeView";
import v_1a40c4 from "../../components/ui/Button";
import v_258c1c from "../../components/common/PageHeader";
import { v_194498 } from "../../stores/cloneStore";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_b4902e } from "../../stores/followStore";
import { v_694b7f } from "../../api/source";
import { v_d60cdf, v_e4a407, v_f373d8, v_20d793, v_776874, v_914311, type v_fa0201, type v_d83ffc, type v_52af9d, type v_ceccc3 } from "../../api/clones";
import v_0e981f from "../../components/common/NotificationBell";
import { v_a41961, v_84a859, type v_3a673b } from "../../api/auth";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";
import type { v_affcc0, v_b0b271 } from "../../types/clone";
import type { v_2d88fc } from "../../navigation/types";
import type { v_8ad91b } from "../../navigation/types";

type ClonesNav = v_390fcc<v_2d88fc>;

const v_b9d568 = 1;

function v_44b316(v_6fc191): string {
  try {
    const v_d799e2 = new Date(v_6fc191.replace(" ", "T") + "Z").getTime();
    const v_a41a1b = Date.now() - v_d799e2;
    if (v_a41a1b < 60_000) return "방금";
    const v_43e24b = Math.floor(v_a41a1b / 60_000);
    if (v_43e24b < 60) return `${v_43e24b}분 전`;
    const v_1c3551 = Math.floor(v_43e24b / 60);
    if (v_1c3551 < 24) return `${v_1c3551}시간 전`;
    const v_d5dda0 = Math.floor(v_1c3551 / 24);
    if (v_d5dda0 < 30) return `${v_d5dda0}일 전`;
    return new Date(v_d799e2).toLocaleDateString();
  } catch {
    return "";
  }
}

function v_5c66fc(v_f4e98d): string {
  if (typeof v_f4e98d !== "number" || !Number.isFinite(v_f4e98d)) return "0";
  if (v_f4e98d >= 1000) return `${(v_f4e98d / 1000).toFixed(1)}k`;
  return String(v_f4e98d);
}

function v_a8d790(c: v_fa0201): v_affcc0 {
  return {
    id: v_3f4e2e.id,
    cloneType: v_3f4e2e.cloneType,
    ownerId: v_3f4e2e.ownerId,
    displayName: v_3f4e2e.name,
    description: v_3f4e2e.description ?? "",
    interests: v_3f4e2e.interests ?? [],
    imageUrl: v_3f4e2e.avatarUrl ?? undefined,
    visibility: v_3f4e2e.visibility,
    status: (v_3f4e2e.trainingStatus as v_affcc0["status"]) ?? "active",
    createdAt: v_3f4e2e.createdAt,
    myRole: v_3f4e2e.myRole,
    coownerCount: v_3f4e2e.coownerCount,
    likesCount: v_3f4e2e.likesCount,
    commentsCount: v_3f4e2e.commentsCount,
    followersCount: v_3f4e2e.followersCount,
    messagesCount: v_3f4e2e.messagesCount,
    ...(v_3f4e2e.l1Profile ? { l1Profile: v_3f4e2e.l1Profile } : {}),
  };
}

export default function v_def15b() {
  const v_c65f5d = v_ada615<ClonesNav>();
  const v_f4c991 = v_ada615<v_390fcc<v_8ad91b>>();
  const { t: v_8d41d7 } = v_772971();
  const v_033e14 = v_e0068c();
  const v_f38ee5 = v_1ed7d9((v_fd5f43) => v_fd5f43.user);
  const v_b113dd = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser);
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_06f32b = v_194498((v_fd5f43) => v_fd5f43.localClones);
  const v_7a98d1 = v_194498((v_fd5f43) => v_fd5f43.upsertClones);
  const v_1e752a = v_b4902e((v_fd5f43) => v_fd5f43.follows);

  const [v_8a7926, v_d42991] = v_5ab095<v_affcc0[] | null>(null);

  const v_8e46f5 = v_a3453e.useCallback(async () => {
    if (!v_2ca7e0) {
      v_d42991(null);
      return;
    }
    try {
      const v_8f00b9 = await v_d60cdf(v_2ca7e0);
      const v_a15a8b = v_8f00b9.items.map(v_a8d790);
      v_d42991(v_a15a8b);

      v_7a98d1(v_a15a8b);
    } catch (v_49263d) {
      console.warn("[Dashboard] listMyClones failed:", v_49263d);

    }
  }, [v_2ca7e0, v_7a98d1]);

  v_c4deb2(() => {
    v_8e46f5();
  }, [v_8e46f5]);

  v_cf763b(
    v_a3453e.useCallback(() => {
      v_8e46f5();
    }, [v_8e46f5]),
  );

  const v_4cd149 = v_df9f57<v_affcc0[]>(() => {
    const v_0c8987 = v_b113dd?.id ?? v_f38ee5?.id ?? v_b9d568;
    if (v_8a7926 != null) {

      const v_15e521 = new Set(v_8a7926.map((v_3f4e2e) => v_3f4e2e.id));
      const v_88106c = v_06f32b.filter(
        (v_3f4e2e) => v_3f4e2e.ownerId === v_0c8987 && !v_15e521.has(v_3f4e2e.id),
      );
      return [...v_8a7926, ...v_88106c];
    }

    return [
      ...v_694b7f.clones().filter((v_3f4e2e) => v_3f4e2e.ownerId === v_0c8987),
      ...v_06f32b.filter((v_3f4e2e) => v_3f4e2e.ownerId === v_0c8987),
    ];
  }, [v_8a7926, v_b113dd, v_f38ee5, v_06f32b]);

  const [v_699459, v_2bf327] = v_5ab095<
    Record<number, { isActive: boolean; visibility: v_b0b271 }>
  >(
    v_4cd149.reduce(
      (v_9f1d92, v_eb25ce, v_ebec57) => ({
        ...v_9f1d92,
        [v_eb25ce.id]: {
          isActive: v_ebec57 !== 1, 
          visibility: v_eb25ce.visibility,
        },
      }),
      {},
    ),
  );

  const [v_8769c2, v_fb07c9] = v_5ab095<Set<number>>(new Set());
  const [v_ce3af0, v_8d2d61] = v_5ab095<number | null>(null);
  const [v_36d186, v_2dac5f] = v_5ab095<{ cloneId: number } | null>(null);
  const [v_b93ea5, v_35dce3] = v_5ab095("");
  const [v_76148b, v_ff2199] = v_5ab095<v_3a673b[]>([]);
  const [v_4568f9, v_58158a] = v_5ab095(false);
  const [v_aa2223, v_b21d0d] = v_5ab095<Set<number>>(new Set());

  const [v_8bb912, v_d5cd7b] = v_5ab095<{
    type: "likes" | "interactions" | "comments" | "followers";
    cloneId: number;
    cloneName: string;
  } | null>(null);
  const [v_067c32, v_e2fcdd] = v_5ab095<v_d83ffc[] | null>(null);
  const [v_02f28c, v_f442a2] = v_5ab095(false);
  const [v_a9fce9, v_1d8f1c] = v_5ab095<v_52af9d[] | null>(null);
  const [v_465030, v_856daf] = v_5ab095(false);
  const [v_e6e97a, v_a8980f] = v_5ab095<v_ceccc3[] | null>(null);
  const [v_447616, v_3dd690] = v_5ab095(false);

  v_c4deb2(() => {
    if (v_8bb912?.type !== "likes" || v_8bb912.cloneId == null) {
      v_e2fcdd(null);
      return;
    }
    let v_2008a4 = false;
    v_f442a2(true);
    v_e2fcdd(null);
    v_20d793(v_8bb912.cloneId, { limit: 50 })
      .then((v_8f00b9) => {
        if (v_2008a4) return;
        v_e2fcdd(v_8f00b9.items);
      })
      .catch((v_49263d) => {
        console.warn("[Dashboard] listCloneLikes failed:", v_49263d);
        if (!v_2008a4) v_e2fcdd([]);
      })
      .finally(() => {
        if (!v_2008a4) v_f442a2(false);
      });
    return () => {
      v_2008a4 = true;
    };
  }, [v_8bb912?.type, v_8bb912?.cloneId]);

  v_c4deb2(() => {
    if (v_8bb912?.type !== "comments" || v_8bb912.cloneId == null) {
      v_1d8f1c(null);
      return;
    }
    let v_2008a4 = false;
    v_856daf(true);
    v_1d8f1c(null);
    v_776874(v_8bb912.cloneId, { limit: 50 })
      .then((v_8f00b9) => {
        if (v_2008a4) return;
        v_1d8f1c(v_8f00b9.items);
      })
      .catch((v_49263d) => {
        console.warn("[Dashboard] listCloneComments failed:", v_49263d);
        if (!v_2008a4) v_1d8f1c([]);
      })
      .finally(() => {
        if (!v_2008a4) v_856daf(false);
      });
    return () => {
      v_2008a4 = true;
    };
  }, [v_8bb912?.type, v_8bb912?.cloneId]);

  v_c4deb2(() => {
    if (v_8bb912?.type !== "followers" || v_8bb912.cloneId == null) {
      v_a8980f(null);
      return;
    }
    let v_2008a4 = false;
    v_3dd690(true);
    v_a8980f(null);
    v_914311(v_8bb912.cloneId, { limit: 100 })
      .then((v_8f00b9) => {
        if (v_2008a4) return;
        v_a8980f(v_8f00b9.items);
      })
      .catch((v_49263d) => {
        console.warn("[Dashboard] listCloneFollowers failed:", v_49263d);
        if (!v_2008a4) v_a8980f([]);
      })
      .finally(() => {
        if (!v_2008a4) v_3dd690(false);
      });
    return () => {
      v_2008a4 = true;
    };
  }, [v_8bb912?.type, v_8bb912?.cloneId]);
  const [v_16ef58, v_3e0da5] = v_5ab095<{
    cloneId: number;
    currentState: boolean;
  } | null>(null);
  const [v_7462ec, v_2dbd8f] = v_5ab095<{
    cloneId: number;
    currentVisibility: v_b0b271;
  } | null>(null);
  const [v_c9d3fa, v_f32c49] = v_5ab095<number | null>(null);

  const v_fc7f92 = v_4cd149.filter((v_3f4e2e) => !v_8769c2.has(v_3f4e2e.id));

  const v_2ba0d1 = v_fc7f92.filter(
    (v_3f4e2e) => v_699459[v_3f4e2e.id]?.isActive ?? true,
  ).length;

  const v_bf58a4 = (v_6e0fd3) => {
    const v_7d13fd = v_699459[v_6e0fd3]?.isActive ?? true;
    v_3e0da5({ cloneId: v_6e0fd3, currentState: v_7d13fd });
  };

  const v_a5c1a8 = () => {
    if (!v_16ef58) return;
    v_2bf327((v_ba2215) => ({
      ...v_ba2215,
      [v_16ef58.cloneId]: {
        ...v_ba2215[v_16ef58.cloneId],
        isActive: !v_16ef58.currentState,
      },
    }));
    v_3e0da5(null);
  };

  const v_11e385 = (v_6e0fd3) => {
    const v_275ccd = v_699459[v_6e0fd3]?.visibility ?? "public";
    v_2dbd8f({ cloneId: v_6e0fd3, currentVisibility: v_275ccd });
    v_8d2d61(null);
  };

  v_c4deb2(() => {
    if (!v_36d186 || !v_2ca7e0) return;
    const v_ab6401 = v_b93ea5.trim();
    if (v_ab6401.length < 2) {
      v_ff2199([]);
      v_58158a(false);
      return;
    }
    v_58158a(true);
    const v_8d41d7 = setTimeout(async () => {
      try {
        const v_8f00b9 = await v_a41961(v_2ca7e0, v_ab6401);
        v_ff2199(v_8f00b9.items);
      } catch (v_49263d) {
        console.warn("[Dashboard] searchUsers failed:", v_49263d);
        v_ff2199([]);
      } finally {
        v_58158a(false);
      }
    }, 300);
    return () => clearTimeout(v_8d41d7);
  }, [v_b93ea5, v_2ca7e0, v_36d186]);

  const v_69254d = async (user: v_3a673b) => {
    if (!v_2ca7e0 || !v_36d186) {
      console.warn("[Dashboard] handleSendInvite: missing accessToken or inviteModal");
      return;
    }
    console.log("[Dashboard] sendInvite start:", { cloneId: v_36d186.cloneId, email: v_625c74.email });
    try {
      const v_8f00b9 = await v_e4a407(v_2ca7e0, v_36d186.cloneId, {
        invite_email: v_625c74.email,
      });
      console.log("[Dashboard] sendInvite success:", v_8f00b9);
      v_b21d0d((v_ba2215) => new Set(v_ba2215).add(v_625c74.id));
      v_b816d4(v_8d41d7("invite.sentToast", { target: v_625c74.name ?? v_625c74.email }));
    } catch (v_49263d) {
      if (v_49263d instanceof v_84a859) {
        console.warn(
          "[Dashboard] createInvite failed:",
          v_49263d.code,
          v_49263d.status,
          v_49263d.message,
          "details=",
          JSON.stringify(v_49263d.details),
        );
        if (v_49263d.code === "UNAUTHENTICATED" || v_49263d.status === 401) {
          await v_1ed7d9.getState().apiLogout();
          v_b816d4(v_8d41d7("dashboard.sessionExpired"));
          return;
        }
        if (v_49263d.code === "ALREADY_INVITED") {

          v_b21d0d((v_ba2215) => new Set(v_ba2215).add(v_625c74.id));
          v_b816d4(v_8d41d7("invite.alreadyInvited"));
          return;
        }
        if (v_49263d.code === "ALREADY_MEMBER") {
          v_b21d0d((v_ba2215) => new Set(v_ba2215).add(v_625c74.id));
          v_b816d4(v_8d41d7("invite.alreadyMember"));
          return;
        }
        if (v_49263d.code === "QUOTA_EXCEEDED") {
          v_b816d4(v_8d41d7("invite.quotaExceeded"));
          return;
        }
      } else {
        console.warn("[Dashboard] createInvite failed:", v_49263d);
      }
      const v_badeaf = v_49263d instanceof v_84a859 ? v_49263d.message : v_8d41d7("invite.sendFailed");
      v_b816d4(v_badeaf);
    }
  };

  const v_c9f992 = (v: v_b0b271) => {
    if (!v_7462ec) return;
    v_2bf327((v_ba2215) => ({
      ...v_ba2215,
      [v_7462ec.cloneId]: {
        ...v_ba2215[v_7462ec.cloneId],
        visibility: v_81e2ef,
      },
    }));
    v_2dbd8f(null);
  };

  const v_57fac2 = (v_6e0fd3) => {
    v_f32c49(v_6e0fd3);
    v_8d2d61(null);
  };

  const [v_b10b7b, v_b816d4] = v_5ab095<string | null>(null);

  const v_6ff8af = async () => {
    if (!v_c9d3fa) return;
    const v_b1de41 = v_c9d3fa;
    v_f32c49(null);

    if (!v_2ca7e0) {

      v_fb07c9((v_ba2215) => new Set(v_ba2215).add(v_b1de41));
      return;
    }
    console.log("[Dashboard] deleteClone start:", v_b1de41);
    try {
      const v_8f00b9 = await v_f373d8(v_2ca7e0, v_b1de41);
      console.log("[Dashboard] deleteClone success:", v_8f00b9);
      if (v_8f00b9.state === "transferred" && v_8f00b9.transferred) {
        v_b816d4(v_8d41d7("dashboard.deleteSuccessTransferred"));
      } else {
        v_b816d4(v_8d41d7("dashboard.deleteSuccessSimple"));
      }

      v_fb07c9((v_ba2215) => new Set(v_ba2215).add(v_b1de41));
      await v_8e46f5();
    } catch (v_49263d) {
      if (v_49263d instanceof v_84a859) {
        console.warn(
          "[Dashboard] deleteClone failed:",
          v_49263d.code,
          v_49263d.status,
          v_49263d.message,
          "details=",
          JSON.stringify(v_49263d.details),
        );

        if (v_49263d.code === "CONFLICT" && /already deleted/i.test(v_49263d.message)) {
          v_fb07c9((v_ba2215) => new Set(v_ba2215).add(v_b1de41));
          v_b816d4(v_8d41d7("dashboard.deleteAlreadyDeleted"));
          await v_8e46f5();
          return;
        }

        if (v_49263d.code === "UNAUTHENTICATED" || v_49263d.status === 401) {
          await v_1ed7d9.getState().apiLogout();
          v_b816d4(v_8d41d7("dashboard.sessionExpired"));
          return;
        }
      } else {
        console.warn("[Dashboard] deleteClone failed:", v_49263d);
      }
      const v_badeaf = v_49263d instanceof v_84a859 ? v_49263d.message : v_8d41d7("dashboard.deleteFailed");
      v_b816d4(v_badeaf);
    }
  };

  const v_82830c = (v: v_b0b271) => {
    switch (v_81e2ef) {
      case "public": return "공개";
      case "private": return "비공개";
      case "followers": return "지인공개";
    }
  };

  const v_a6deb1 = (v: v_b0b271): keyof typeof v_dec439.glyphMap => {
    switch (v_81e2ef) {
      case "public": return "eye";
      case "private": return "eye-off";
      case "followers": return "user-check";
    }
  };

  const v_b80d74 = ({ item: v_eb25ce }: { item: v_affcc0 }) => {
    const v_b6e533 = v_699459[v_eb25ce.id];
    const v_26dce6 = v_b6e533?.isActive ?? true;
    const v_818579 = v_b6e533?.visibility ?? v_eb25ce.visibility;
    const v_e93e18 = v_eb25ce.cloneType === "memlow";

    const v_e17daa =
      typeof v_eb25ce.followersCount === "number"
        ? v_eb25ce.followersCount
        : v_1e752a.filter((v_8b5cd8) => v_8b5cd8.followingCloneId === v_eb25ce.id).length;

    const v_77df30 =
      typeof v_eb25ce.coownerCount === "number"
        ? v_eb25ce.coownerCount
        : v_694b7f.coowners().filter(
            (v_c4a45b) => v_c4a45b.cloneId === v_eb25ce.id && v_c4a45b.status === "approved",
          ).length;

    return (
      <View style={v_fd5f43.card}>
        {}
        <View style={v_fd5f43.cardTopRow}>
          <TouchableOpacity
            style={v_fd5f43.activeToggle}
            onPress={() => v_bf58a4(v_eb25ce.id)}
          >
            <Feather
              name={v_26dce6 ? "check-circle" : "circle"}
              size={18}
              color={v_26dce6 ? v_1bfbd0.success : v_1bfbd0.zinc400}
            />
            <Text style={v_fd5f43.activeText}>
              {v_26dce6 ? v_8d41d7("dashboard.active") : v_8d41d7("dashboard.inactive")}
            </Text>
          </TouchableOpacity>

          <View style={v_fd5f43.cardTopRight}>
            {}
            {!v_e93e18 && (
              <View style={v_fd5f43.visibilityBadge}>
                <Feather name={v_a6deb1(v_818579)} size={14} color={v_1bfbd0.zinc500} />
                <Text style={v_fd5f43.visibilityText}>{v_82830c(v_818579)}</Text>
              </View>
            )}
            <TouchableOpacity
              style={v_fd5f43.moreBtn}
              onPress={() => v_8d2d61(v_eb25ce.id)}
            >
              <Feather name="more-vertical" size={18} color={v_1bfbd0.zinc400} />
            </TouchableOpacity>
          </View>
        </View>

        {}
        <View style={v_fd5f43.cloneHeader}>
          <View style={v_fd5f43.avatarWrap}>
            {v_eb25ce.imageUrl ? (
              <Image source={{ uri: v_eb25ce.imageUrl }} style={v_fd5f43.avatar} />
            ) : (
              <View style={[v_fd5f43.avatar, { backgroundColor: v_1bfbd0.zinc100, alignItems: 'center', justifyContent: 'center' }]}>
                <Feather name="user" size={20} color={v_1bfbd0.zinc400} />
              </View>
            )}
            {v_26dce6 && <View style={v_fd5f43.activeDot} />}
          </View>
          <View style={v_fd5f43.cloneInfo}>
            <Text style={v_fd5f43.cloneName}>{v_eb25ce.displayName}</Text>
            <Text style={v_fd5f43.cloneCategory}>{v_eb25ce.interests?.[0] ?? ""}</Text>
          </View>
        </View>

        {}
        <Text style={v_fd5f43.description} numberOfLines={2}>
          {v_eb25ce.description}
        </Text>

        {}
        {v_e93e18 ? (
          <TouchableOpacity
            style={v_fd5f43.coownerBadge}
            onPress={() =>
              v_c65f5d.navigate("CloneInvite", { cloneId: v_eb25ce.id })
            }
            activeOpacity={0.7}
          >
            <Feather name="users" size={14} color={v_1bfbd0.zinc600} />
            <Text style={v_fd5f43.coownerText}>
              {v_8d41d7("dashboard.coownerCount", { n: v_77df30 })}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={v_fd5f43.statsRow}>
            <TouchableOpacity
              style={v_fd5f43.stat}
              onPress={() => v_d5cd7b({ type: "likes", cloneId: v_eb25ce.id, cloneName: v_eb25ce.displayName })}
            >
              <Feather name="heart" size={14} color={v_1bfbd0.zinc500} />
              <Text style={v_fd5f43.statText}>{v_5c66fc(v_eb25ce.likesCount)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={v_fd5f43.stat}
              onPress={() => v_d5cd7b({ type: "interactions", cloneId: v_eb25ce.id, cloneName: v_eb25ce.displayName })}
            >
              <Ionicons name="chatbubbles-outline" size={14} color={v_1bfbd0.zinc500} />
              <Text style={v_fd5f43.statText}>{v_5c66fc(v_eb25ce.messagesCount)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={v_fd5f43.stat}
              onPress={() => v_d5cd7b({ type: "comments", cloneId: v_eb25ce.id, cloneName: v_eb25ce.displayName })}
            >
              <Feather name="message-circle" size={14} color={v_1bfbd0.zinc500} />
              <Text style={v_fd5f43.statText}>{v_5c66fc(v_eb25ce.commentsCount)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={v_fd5f43.stat}
              onPress={() => v_d5cd7b({ type: "followers", cloneId: v_eb25ce.id, cloneName: v_eb25ce.displayName })}
            >
              <Feather name="user" size={14} color={v_1bfbd0.zinc500} />
              <Text style={v_fd5f43.statText} testID={`follower-count-${v_eb25ce.id}`}>
                {v_e17daa} 팔로워
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {}
        {v_eb25ce.status === 'pending_assets' && (
          <View style={v_fd5f43.pendingBadge}>
            <Feather name="clock" size={12} color={v_1bfbd0.zinc600} />
            <Text style={v_fd5f43.pendingText}>생성대기중</Text>
            <TouchableOpacity onPress={() => v_c65f5d.navigate('CloneEdit', { cloneId: v_eb25ce.id })}>
              <Text style={v_fd5f43.pendingCta}>사진/음성 추가하기</Text>
            </TouchableOpacity>
          </View>
        )}

        {}
        <View style={v_fd5f43.tagsRow}>
          {(v_eb25ce.interests ?? []).map((v_bd1444, v_ebec57) => (
            <View key={v_ebec57} style={v_fd5f43.tag}>
              <Text style={v_fd5f43.tagText}>#{v_bd1444}</Text>
            </View>
          ))}
        </View>

        {}
        <View style={v_fd5f43.actionsRow}>
          <TouchableOpacity
            style={v_fd5f43.actionBtn}
            onPress={() => v_f4c991.navigate("Chat", { cloneId: v_eb25ce.id })}
          >
            <Feather name="message-circle" size={16} color={v_1bfbd0.zinc700} />
            <Text style={v_fd5f43.actionText}>{v_8d41d7("dashboard.actionLearn")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={v_fd5f43.actionBtn}
            onPress={() => v_f4c991.navigate("Call", { cloneId: v_eb25ce.id })}
          >
            <Feather name="video" size={16} color={v_1bfbd0.zinc700} />
            <Text style={v_fd5f43.actionText}>{v_8d41d7("dashboard.actionCall")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={v_fd5f43.actionBtn}
            onPress={async () => {
              if (v_e93e18) {

                v_35dce3("");
                v_ff2199([]);
                v_b21d0d(new Set());
                v_2dac5f({ cloneId: v_eb25ce.id });
              } else {

                const v_f71b56 = `https://afterlife.app/clone/${v_eb25ce.id}`;
                const v_a8cd21 = `${v_eb25ce.displayName} 페르소나와 대화해보세요!\n${v_f71b56}`;
                try {
                  await v_5f4661.share(
                    v_326be8.OS === "ios"
                      ? { message: v_a8cd21, url: v_f71b56, title: v_eb25ce.displayName }
                      : { message: v_a8cd21 },
                    { dialogTitle: v_eb25ce.displayName },
                  );
                } catch (v_49263d) {
                  console.warn("[dashboard] share failed:", v_49263d);

                  try {
                    await v_fba5a0.setStringAsync(v_f71b56);
                    v_b816d4(v_8d41d7("dashboard.shareLinkCopied"));
                  } catch {
                    v_b816d4(v_8d41d7("dashboard.shareLinkFailed"));
                  }
                }
              }
            }}
          >
            <Feather name={v_e93e18 ? "user-plus" : "share-2"} size={16} color={v_1bfbd0.zinc700} />
            <Text style={v_fd5f43.actionText}>
              {v_e93e18 ? v_8d41d7("dashboard.actionInvite") : v_8d41d7("dashboard.actionShare")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.white} showBottomBackground={false}>
      <PageHeader
        title={v_8d41d7("dashboard.title")}
        rightAction={<NotificationBell />}
      />

      <FlatList
        data={v_fc7f92}
        keyExtractor={(v_8c0b26) => String(v_8c0b26.id)}
        renderItem={v_b80d74}
        contentContainerStyle={v_fd5f43.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={v_fd5f43.dashEmpty}>
            <View style={v_fd5f43.dashEmptyIconWrap}>
              <Feather name="user-plus" size={32} color={v_1bfbd0.zinc400} />
            </View>
            <Text style={v_fd5f43.dashEmptyTitle}>나만의 페르소나를 만들어보세요</Text>
            <Text style={v_fd5f43.dashEmptyDesc}>
              아래 버튼을 눌러 첫 페르소나를 만들 수 있어요
            </Text>
            <TouchableOpacity
              style={v_fd5f43.dashEmptyBtn}
              activeOpacity={0.85}
              onPress={() =>

                v_c65f5d.dispatch(
                  v_650cfa.navigate({
                    name: "CreateTab",
                    params: { screen: "Step1" },
                  }),
                )
              }
            >
              <Feather name="plus" size={18} color={v_1bfbd0.white} />
              <Text style={v_fd5f43.dashEmptyBtnText}>페르소나 만들기</Text>
            </TouchableOpacity>
          </View>
        }
        ListHeaderComponent={
          <>
            {}
            <View style={v_fd5f43.dashTitleRow}>
              <View style={{ flex: 1 }}>
                <Text style={v_fd5f43.dashTitleText}>{v_8d41d7("dashboard.headerTitle")}</Text>
                <Text style={v_fd5f43.dashSubText}>{v_8d41d7("dashboard.headerDesc")}</Text>
              </View>
              <TouchableOpacity
                style={v_fd5f43.inviteStatusBtn}
                onPress={() => v_c65f5d.navigate("InviteStatus")}
                activeOpacity={0.7}
              >
                <Feather name="send" size={14} color={v_1bfbd0.violet600} />
                <Text style={v_fd5f43.inviteStatusBtnText}>{v_8d41d7("inviteStatus.title")}</Text>
              </TouchableOpacity>
            </View>

            {}
            <View style={v_fd5f43.statsOverview}>
              <View style={v_fd5f43.statsCard}>
                <View style={v_fd5f43.statsCardHeader}>
                  <Ionicons name="chatbubbles-outline" size={14} color={v_1bfbd0.zinc500} />
                  <Text style={v_fd5f43.statsCardLabel}>{v_8d41d7("dashboard.statsTotalInteractions")}</Text>
                </View>
                <Text style={v_fd5f43.statsCardValue}>12.8k</Text>
                <Text style={v_fd5f43.statsCardDelta}>{v_8d41d7("dashboard.statsDelta")}</Text>
              </View>

              <View style={[v_fd5f43.statsCard, v_fd5f43.statsCardDark]}>
                <View style={v_fd5f43.statsCardHeader}>
                  <Feather name="user" size={14} color={v_1bfbd0.zinc400} />
                  <Text style={[v_fd5f43.statsCardLabel, { color: v_1bfbd0.zinc400 }]}>
                    {v_8d41d7("dashboard.statsActivity")}
                  </Text>
                </View>
                <View style={v_fd5f43.activityCount}>
                  <Text style={v_fd5f43.activityActive}>{v_2ba0d1}</Text>
                  <Text style={v_fd5f43.activityTotal}>/ {v_fc7f92.length}</Text>
                </View>
              </View>
            </View>
          </>
        }
        ListFooterComponent={
          <TouchableOpacity style={v_fd5f43.loadMore}>
            <Text style={v_fd5f43.loadMoreText}>{v_8d41d7("dashboard.loadMore")}</Text>
          </TouchableOpacity>
        }
      />

      {}
      <Modal visible={!!v_ce3af0} transparent animationType="fade">
        <Pressable style={v_fd5f43.modalOverlay} onPress={() => v_8d2d61(null)}>
          <Pressable style={v_fd5f43.menuBox} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <Text style={v_fd5f43.menuTitle}>{v_8d41d7("dashboard.manage")}</Text>
            <TouchableOpacity
              style={v_fd5f43.menuItem}
              onPress={() => {
                const v_389afb = v_ce3af0!;
                v_8d2d61(null);
                v_c65f5d.navigate("CloneEdit", { cloneId: v_389afb });
              }}
            >
              <Feather name="edit-2" size={18} color={v_1bfbd0.zinc700} />
              <Text style={v_fd5f43.menuItemText}>{v_8d41d7("dashboard.menuEdit")}</Text>
            </TouchableOpacity>

            {}
            {v_ce3af0 != null && (() => {
              const v_26dce6 = v_699459[v_ce3af0]?.isActive ?? true;
              return (
                <TouchableOpacity
                  style={v_fd5f43.menuItem}
                  onPress={() => {
                    const v_389afb = v_ce3af0!;
                    v_8d2d61(null);
                    v_bf58a4(v_389afb);
                  }}
                >
                  <Feather
                    name={v_26dce6 ? "pause-circle" : "play-circle"}
                    size={18}
                    color={v_26dce6 ? v_1bfbd0.zinc700 : v_1bfbd0.success}
                  />
                  <Text style={v_fd5f43.menuItemText}>
                    {v_26dce6 ? v_8d41d7("dashboard.menuDeactivate") : v_8d41d7("dashboard.menuActivate")}
                  </Text>
                </TouchableOpacity>
              );
            })()}

            {}
            {v_ce3af0 != null &&
              v_4cd149.find((v_3f4e2e) => v_3f4e2e.id === v_ce3af0)?.cloneType !== "memlow" && (
                <TouchableOpacity
                  style={v_fd5f43.menuItem}
                  onPress={() => {
                    const v_389afb = v_ce3af0!;
                    v_11e385(v_389afb);
                  }}
                >
                  <Feather
                    name={v_a6deb1(v_699459[v_ce3af0!]?.visibility ?? "public")}
                    size={18}
                    color={v_1bfbd0.zinc700}
                  />
                  <Text style={v_fd5f43.menuItemText}>{v_8d41d7("dashboard.menuVisibility")}</Text>
                </TouchableOpacity>
              )}
            <View style={v_fd5f43.menuDivider} />
            {}
            {v_ce3af0 != null &&
              v_4cd149.find((v_3f4e2e) => v_3f4e2e.id === v_ce3af0)?.myRole === "owner" ? (
              <TouchableOpacity
                style={v_fd5f43.menuItem}
                onPress={() => {
                  const v_389afb = v_ce3af0!;
                  v_57fac2(v_389afb);
                }}
              >
                <Feather name="trash-2" size={18} color={v_1bfbd0.error} />
                <Text style={[v_fd5f43.menuItemText, { color: v_1bfbd0.error }]}>{v_8d41d7("dashboard.menuDelete")}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={v_fd5f43.menuItem}
                onPress={() => {
                  const v_389afb = v_ce3af0!;
                  v_8d2d61(null);
                  v_c65f5d.navigate("CloneInvite", { cloneId: v_389afb });
                }}
              >
                <Feather name="log-out" size={18} color={v_1bfbd0.error} />
                <Text style={[v_fd5f43.menuItemText, { color: v_1bfbd0.error }]}>{v_8d41d7("dashboard.menuLeave")}</Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={!!v_16ef58} transparent animationType="fade">
        <Pressable style={v_fd5f43.modalOverlay} onPress={() => v_3e0da5(null)}>
          <Pressable style={v_fd5f43.modalBox} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <Text style={v_fd5f43.modalTitle}>
              {v_16ef58?.currentState ? "페르소나 비활성화" : "페르소나 활성화"}
            </Text>
            <Text style={v_fd5f43.modalDesc}>
              {v_16ef58?.currentState
                ? "페르소나를 비활성화하시겠습니까? 비활성화 시 다른 사용자에게 노출되지 않습니다."
                : "페르소나를 활성화하시겠습니까? 활성화 시 다른 사용자에게 노출됩니다."}
            </Text>
            <View style={v_fd5f43.modalBtns}>
              <Button
                title="취소"
                variant="ghost"
                onPress={() => v_3e0da5(null)}
                style={v_fd5f43.modalBtnHalf}
              />
              <Button
                title="확인"
                variant="primary"
                onPress={v_a5c1a8}
                style={v_fd5f43.modalBtnHalf}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={!!v_7462ec} transparent animationType="fade">
        <Pressable style={v_fd5f43.modalOverlay} onPress={() => v_2dbd8f(null)}>
          <Pressable style={v_fd5f43.modalBox} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <Text style={v_fd5f43.modalTitle}>공개 설정</Text>
            <Text style={v_fd5f43.modalDesc}>페르소나의 공개 범위를 선택하세요</Text>
            <View style={v_fd5f43.visibilityOptions}>
              {}
              {(["public", "private"] as v_b0b271[]).map((v_81e2ef) => {
                const v_587413 = v_7462ec?.currentVisibility === v_81e2ef;
                return (
                  <TouchableOpacity
                    key={v_81e2ef}
                    style={[v_fd5f43.visibilityOption, v_587413 && v_fd5f43.visibilityOptionSelected]}
                    onPress={() => v_c9f992(v_81e2ef)}
                  >
                    <Feather
                      name={v_a6deb1(v_81e2ef)}
                      size={16}
                      color={v_587413 ? v_1bfbd0.white : v_1bfbd0.zinc700}
                    />
                    <Text
                      style={[
                        v_fd5f43.visibilityOptionText,
                        v_587413 && { color: v_1bfbd0.white },
                      ]}
                    >
                      {v_82830c(v_81e2ef)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Button
              title="취소"
              variant="ghost"
              onPress={() => v_2dbd8f(null)}
              style={{ marginTop: 12, width: "100%" }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={!!v_c9d3fa} transparent animationType="fade">
        <Pressable style={v_fd5f43.modalOverlay} onPress={() => v_f32c49(null)}>
          <Pressable style={v_fd5f43.modalBox} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <Text style={v_fd5f43.modalTitle}>{v_8d41d7("dashboard.deleteTitle")}</Text>
            <Text style={v_fd5f43.modalDesc}>
              {v_c9d3fa &&
              v_4cd149.find((v_3f4e2e) => v_3f4e2e.id === v_c9d3fa)?.cloneType === "memlow"
                ? v_8d41d7("dashboard.deleteDescMemlow")
                : v_8d41d7("dashboard.deleteDescDefault")}
            </Text>
            <View style={v_fd5f43.modalBtns}>
              <Button
                title="취소"
                variant="ghost"
                onPress={() => v_f32c49(null)}
                style={v_fd5f43.modalBtnHalf}
              />
              <Button
                title="삭제"
                variant="danger"
                onPress={v_6ff8af}
                style={v_fd5f43.modalBtnHalf}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={!!v_b10b7b} transparent animationType="fade">
        <Pressable style={v_fd5f43.modalOverlay} onPress={() => v_b816d4(null)}>
          <Pressable style={v_fd5f43.modalBox} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <Text style={v_fd5f43.modalTitle}>알림</Text>
            <Text style={v_fd5f43.modalDesc}>{v_b10b7b}</Text>
            <Button
              title="확인"
              variant="primary"
              onPress={() => v_b816d4(null)}
              style={{ width: "100%" }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {
}
      <Modal
        visible={!!v_36d186}
        transparent
        animationType="slide"
        onRequestClose={() => v_2dac5f(null)}
      >
        <Pressable style={v_fd5f43.bottomSheetOverlay} onPress={() => v_2dac5f(null)}>
          <View
            style={v_fd5f43.inviteSheet}
            onStartShouldSetResponder={() => true}
          >
            <View style={v_fd5f43.sheetHandle} />
            <View style={v_fd5f43.inviteHeader}>
              <Text style={v_fd5f43.inviteTitle}>
                {(() => {
                  const v_3f4e2e = v_4cd149.find((v_62c214) => v_62c214.id === v_36d186?.cloneId);
                  return v_3f4e2e?.cloneType === "memlow"
                    ? v_8d41d7("invite.create")
                    : v_8d41d7("invite.shareTitle");
                })()}
              </Text>
              <TouchableOpacity onPress={() => v_2dac5f(null)}>
                <Feather name="x" size={20} color={v_1bfbd0.zinc500} />
              </TouchableOpacity>
            </View>

            {}
            <View style={v_fd5f43.inviteSearchWrap}>
              <Feather name="search" size={18} color={v_1bfbd0.zinc400} />
              <TextInput
                style={v_fd5f43.inviteSearchInput}
                value={v_b93ea5}
                onChangeText={v_35dce3}
                placeholder={v_8d41d7("dashboard.inviteSearchHint")}
                placeholderTextColor={v_1bfbd0.placeholder}
                autoFocus
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {v_b93ea5.length > 0 && (
                <TouchableOpacity onPress={() => v_35dce3("")}>
                  <Feather name="x-circle" size={16} color={v_1bfbd0.zinc400} />
                </TouchableOpacity>
              )}
            </View>

            {}
            <ScrollView style={v_fd5f43.inviteList} showsVerticalScrollIndicator={false}>
              {v_b93ea5.trim().length < 2 ? (
                <View style={{ padding: 32, alignItems: "center" }}>
                  <Feather name="search" size={32} color={v_1bfbd0.zinc300} />
                  <Text style={{ color: v_1bfbd0.zinc500, marginTop: 8, fontSize: 13 }}>
                    {v_8d41d7("dashboard.inviteSearchEmpty")}
                  </Text>
                  <Text style={{ color: v_1bfbd0.zinc400, marginTop: 4, fontSize: 11 }}>
                    {v_8d41d7("dashboard.inviteSearchEmptyHint")}
                  </Text>
                </View>
              ) : v_4568f9 ? (
                <View style={{ padding: 32, alignItems: "center" }}>
                  <ActivityIndicator color={v_1bfbd0.zinc500} />
                </View>
              ) : v_76148b.length === 0 ? (
                <View style={{ padding: 32, alignItems: "center" }}>
                  <Text style={{ color: v_1bfbd0.zinc500, fontSize: 13 }}>
                    {v_8d41d7("dashboard.inviteNoResults")}
                  </Text>
                  <Text style={{ color: v_1bfbd0.zinc400, marginTop: 4, fontSize: 11 }}>
                    {v_8d41d7("dashboard.inviteSearchEmptyHint")}
                  </Text>
                </View>
              ) : (
                v_76148b.map((v_625c74) => {
                  const v_f966e3 = v_aa2223.has(v_625c74.id);
                  return (
                    <View key={v_625c74.id} style={v_fd5f43.inviteRow}>
                      {v_625c74.avatarUrl ? (
                        <Image source={{ uri: v_625c74.avatarUrl }} style={v_fd5f43.inviteAvatar} />
                      ) : (
                        <View style={[v_fd5f43.inviteAvatar, { backgroundColor: v_1bfbd0.zinc100, alignItems: "center", justifyContent: "center" }]}>
                          <Feather name="user" size={20} color={v_1bfbd0.zinc400} />
                        </View>
                      )}
                      <View style={v_fd5f43.inviteInfo}>
                        <Text style={v_fd5f43.inviteName}>{v_625c74.name ?? v_625c74.email}</Text>
                        <Text style={v_fd5f43.inviteUsername}>{v_625c74.email}</Text>
                      </View>
                      <TouchableOpacity
                        style={[v_fd5f43.inviteBtn, v_f966e3 && v_fd5f43.inviteBtnSent]}
                        disabled={v_f966e3}
                        onPress={() => v_69254d(v_625c74)}
                      >
                        <Feather
                          name={v_f966e3 ? "check" : "send"}
                          size={14}
                          color={v_f966e3 ? v_1bfbd0.success : v_1bfbd0.white}
                        />
                        <Text style={[v_fd5f43.inviteBtnText, v_f966e3 && v_fd5f43.inviteBtnTextSent]}>
                          {v_f966e3 ? v_8d41d7("invite.sent") : v_8d41d7("invite.send")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {}
      <Modal visible={!!v_8bb912} transparent animationType="slide">
        <Pressable style={v_fd5f43.modalOverlay} onPress={() => v_d5cd7b(null)}>
          <View
            style={[v_fd5f43.statsSheet, { paddingBottom: 32 + Math.max(v_033e14.bottom, 0) }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={v_fd5f43.sheetHandle} />
            <Text style={v_fd5f43.statsSheetTitle}>
              {v_8bb912?.type === "likes" && "좋아요"}
              {v_8bb912?.type === "interactions" && "상호작용"}
              {v_8bb912?.type === "comments" && "댓글"}
              {v_8bb912?.type === "followers" && "팔로워"}
            </Text>
            <Text style={v_fd5f43.statsSheetSub}>
              {v_8bb912?.cloneName}
            </Text>

            <ScrollView style={v_fd5f43.statsScrollArea} showsVerticalScrollIndicator={false}>
              {}
              {v_8bb912?.type === "comments" && (
                <>
                  {v_465030 ? (
                    <ActivityIndicator color={v_1bfbd0.zinc500} style={{ paddingVertical: 24 }} />
                  ) : !v_a9fce9 || v_a9fce9.length === 0 ? (
                    <View style={{ paddingVertical: 24, alignItems: "center" }}>
                      <Text style={{ color: v_1bfbd0.zinc500, fontSize: 13 }}>아직 댓글이 없어요</Text>
                    </View>
                  ) : (
                    v_a9fce9.map((v_c9a376) => (
                      <View key={v_c9a376.id} style={v_fd5f43.commentRow}>
                        <View style={v_fd5f43.commentTop}>
                          {v_c9a376.user.avatarUrl ? (
                            <Image source={{ uri: v_c9a376.user.avatarUrl }} style={v_fd5f43.commentAvatar} />
                          ) : (
                            <View style={[v_fd5f43.commentAvatar, { backgroundColor: v_1bfbd0.zinc200 }]} />
                          )}
                          <Text style={v_fd5f43.commentName}>{v_c9a376.user.name ?? v_c9a376.user.email}</Text>
                          <Text style={v_fd5f43.commentTime}>{v_44b316(v_c9a376.createdAt)}</Text>
                          <TouchableOpacity
                            onPress={() => {
                              v_d5cd7b(null);
                              v_b816d4("신고가 접수됐어요");
                            }}
                            style={{ marginLeft: "auto", paddingHorizontal: 6, paddingVertical: 4 }}
                          >
                            <Feather name="flag" size={14} color={v_1bfbd0.error} />
                          </TouchableOpacity>
                        </View>
                        <Text style={v_fd5f43.commentText}>{v_c9a376.content}</Text>
                      </View>
                    ))
                  )}
                </>
              )}

              {}
              {v_8bb912?.type === "likes" && (
                <>
                  {v_02f28c ? (
                    <ActivityIndicator color={v_1bfbd0.zinc500} style={{ paddingVertical: 24 }} />
                  ) : !v_067c32 || v_067c32.length === 0 ? (
                    <View style={{ paddingVertical: 24, alignItems: "center" }}>
                      <Text style={{ color: v_1bfbd0.zinc500, fontSize: 13 }}>아직 좋아요가 없어요</Text>
                    </View>
                  ) : (
                    v_067c32.map((v_ceb55a) => (
                      <View key={v_ceb55a.likeId} style={v_fd5f43.accountRow}>
                        {v_ceb55a.avatarUrl ? (
                          <Image source={{ uri: v_ceb55a.avatarUrl }} style={v_fd5f43.accountAvatar} />
                        ) : (
                          <View style={[v_fd5f43.accountAvatar, { backgroundColor: v_1bfbd0.zinc200 }]} />
                        )}
                        <View style={v_fd5f43.accountInfo}>
                          <Text style={v_fd5f43.accountName}>{v_ceb55a.name ?? v_ceb55a.email}</Text>
                          <Text style={v_fd5f43.accountSub}>{v_ceb55a.email}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </>
              )}

              {}
              {v_8bb912?.type === "followers" && (
                <>
                  {v_447616 ? (
                    <ActivityIndicator color={v_1bfbd0.zinc500} style={{ paddingVertical: 24 }} />
                  ) : !v_e6e97a || v_e6e97a.length === 0 ? (
                    <View style={{ paddingVertical: 24, alignItems: "center" }}>
                      <Text style={{ color: v_1bfbd0.zinc500, fontSize: 13 }}>아직 팔로워가 없어요</Text>
                    </View>
                  ) : (
                    v_e6e97a.map((v_ceb55a) => (
                      <View key={v_ceb55a.followId} style={v_fd5f43.accountRow}>
                        {v_ceb55a.avatarUrl ? (
                          <Image source={{ uri: v_ceb55a.avatarUrl }} style={v_fd5f43.accountAvatar} />
                        ) : (
                          <View style={[v_fd5f43.accountAvatar, { backgroundColor: v_1bfbd0.zinc200 }]} />
                        )}
                        <View style={v_fd5f43.accountInfo}>
                          <Text style={v_fd5f43.accountName}>{v_ceb55a.name ?? v_ceb55a.email}</Text>
                          <Text style={v_fd5f43.accountSub}>{v_ceb55a.email}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </>
              )}

              {}
              {v_8bb912?.type === "interactions" && (
                <View style={{ paddingVertical: 24, alignItems: "center" }}>
                  <Feather name="message-circle" size={28} color={v_1bfbd0.zinc300} />
                  <Text style={{ color: v_1bfbd0.zinc500, fontSize: 13, marginTop: 8 }}>
                    상호작용 상세 목록은 준비 중이에요
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </SafeView>
  );
}

const v_b62688 = [
  { id: "u1", name: "김민수", avatar: "https://i.pravatar.cc/100?img=1", detail: "@minsu_k" },
  { id: "u2", name: "이서연", avatar: "https://i.pravatar.cc/100?img=5", detail: "@seoyeon_lee" },
  { id: "u3", name: "박지훈", avatar: "https://i.pravatar.cc/100?img=3", detail: "@jihun.park" },
  { id: "u4", name: "최유진", avatar: "https://i.pravatar.cc/100?img=9", detail: "@yujin_choi" },
  { id: "u5", name: "정하은", avatar: "https://i.pravatar.cc/100?img=10", detail: "@haeun_j" },
];

const v_2c1f99 = [
  { id: "i1", name: "김민수", avatar: "https://i.pravatar.cc/100?img=1", detail: "마지막 대화: 2시간 전" },
  { id: "i2", name: "이서연", avatar: "https://i.pravatar.cc/100?img=5", detail: "마지막 대화: 어제" },
  { id: "i3", name: "박지훈", avatar: "https://i.pravatar.cc/100?img=3", detail: "마지막 대화: 3일 전" },
  { id: "i4", name: "최유진", avatar: "https://i.pravatar.cc/100?img=9", detail: "마지막 대화: 1주 전" },
];

const v_2fb1c1 = [
  { id: "c1", name: "김민수", avatar: "https://i.pravatar.cc/100?img=1", text: "정말 도움이 많이 됐어요! 감사합니다.", time: "2시간 전" },
  { id: "c2", name: "이서연", avatar: "https://i.pravatar.cc/100?img=5", text: "이 페르소나 대화 퀄리티가 진짜 좋네요", time: "5시간 전" },
  { id: "c3", name: "박지훈", avatar: "https://i.pravatar.cc/100?img=3", text: "위로가 되는 말씀 감사해요 ㅠㅠ", time: "어제" },
  { id: "c4", name: "최유진", avatar: "https://i.pravatar.cc/100?img=9", text: "매일 대화하고 있어요 추천합니다!", time: "2일 전" },
  { id: "c5", name: "정하은", avatar: "https://i.pravatar.cc/100?img=10", text: "목소리도 자연스럽고 너무 좋아요", time: "3일 전" },
];

const v_fd5f43 = v_472849.create({
  dashEmpty: {
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: "center",
    gap: 8,
  },
  dashEmptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: v_1bfbd0.zinc100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  dashEmptyTitle: { fontSize: 16, fontWeight: "700", color: v_1bfbd0.zinc800 },
  dashEmptyDesc: { fontSize: 13, color: v_1bfbd0.zinc500, textAlign: "center", lineHeight: 18 },
  dashEmptyBtn: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.zinc900,
  },
  dashEmptyBtnText: { fontSize: 14, fontWeight: "700", color: v_1bfbd0.white },

  listContent: {
    paddingHorizontal: v_9b1a04.medium,
    paddingBottom: 24,
  },

  dashTitle: { marginTop: 16, marginBottom: 20 },
  dashTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  dashTitleText: { fontSize: 20, fontWeight: "700", color: v_1bfbd0.zinc900 },
  inviteStatusBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: v_1bfbd0.violet100,
    borderRadius: v_8b0c90.full,
  },
  inviteStatusBtnText: { fontSize: 12, fontWeight: "600", color: v_1bfbd0.violet600 },
  dashSubText: { fontSize: 13, color: v_1bfbd0.zinc500, marginTop: 4 },

  statsOverview: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statsCard: {
    flex: 1,
    backgroundColor: v_1bfbd0.zinc50,
    borderRadius: 24,
    padding: 20,
  },
  statsCardDark: {
    backgroundColor: v_1bfbd0.zinc900,
  },
  statsCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  statsCardLabel: { fontSize: 11, color: v_1bfbd0.zinc500 },
  statsCardValue: { fontSize: 28, fontWeight: "700", color: v_1bfbd0.zinc900 },
  statsCardDelta: { fontSize: 11, color: v_1bfbd0.success, fontWeight: "500", marginTop: 4 },
  activityCount: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  activityActive: { fontSize: 44, fontWeight: "700", color: v_1bfbd0.white },
  activityTotal: { fontSize: 28, color: v_1bfbd0.zinc400 },

  card: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: 24,
    padding: 20,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    marginBottom: 16,
  },

  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  activeToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activeText: { fontSize: 12, fontWeight: "500", color: v_1bfbd0.zinc600 },
  cardTopRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  visibilityBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  visibilityText: { fontSize: 13, color: v_1bfbd0.zinc500 },
  moreBtn: { padding: 4 },

  menuBox: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: 20,
    padding: 8,
    width: "100%",
    maxWidth: 320,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: v_1bfbd0.zinc900,
    textAlign: "center",
    paddingVertical: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: v_8b0c90.lg,
  },
  menuItemText: { fontSize: 15, color: v_1bfbd0.zinc700 },
  menuDivider: {
    height: 1,
    backgroundColor: v_1bfbd0.zinc200,
    marginHorizontal: 16,
    marginVertical: 4,
  },

  cloneHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  activeDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: v_1bfbd0.success,
    borderWidth: 2,
    borderColor: v_1bfbd0.white,
  },
  cloneInfo: { flex: 1 },
  cloneName: { fontSize: 16, fontWeight: "700", color: v_1bfbd0.zinc900 },
  cloneCategory: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },

  description: {
    fontSize: 14,
    color: v_1bfbd0.zinc600,
    lineHeight: 20,
    marginBottom: 14,
  },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 14,
  },
  stat: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 13, color: v_1bfbd0.zinc500 },

  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: v_1bfbd0.zinc100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  pendingText: { fontSize: 11, color: v_1bfbd0.zinc600 },
  pendingCta: { fontSize: 11, color: v_1bfbd0.violet600, marginLeft: 4, textDecorationLine: 'underline' },

  coownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: v_1bfbd0.violet100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  coownerText: { fontSize: 11, color: v_1bfbd0.violet600, fontWeight: '500' },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: v_1bfbd0.zinc100,
    borderRadius: v_8b0c90.full,
  },
  tagText: { fontSize: 12, color: v_1bfbd0.zinc600 },

  actionsRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.zinc100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionText: { fontSize: 12, fontWeight: "500", color: v_1bfbd0.zinc700 },

  loadMore: {
    height: 48,
    borderRadius: v_8b0c90.lg,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  loadMoreText: { fontSize: 14, fontWeight: "500", color: v_1bfbd0.zinc900 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: v_1bfbd0.zinc900,
    textAlign: "center",
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: v_1bfbd0.zinc600,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  modalBtns: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalBtnHalf: { flex: 1 },

  visibilityOptions: { gap: 8, width: "100%" },
  visibilityOption: {
    height: 48,
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.zinc100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  visibilityOptionSelected: {
    backgroundColor: v_1bfbd0.zinc900,
  },
  visibilityOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: v_1bfbd0.zinc700,
  },

  statsSheet: {
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,

    maxHeight: "70%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: v_1bfbd0.zinc300,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  statsSheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
    marginBottom: 4,
  },
  statsSheetSub: {
    fontSize: 13,
    color: v_1bfbd0.zinc500,
    marginBottom: 16,
  },
  statsScrollArea: {
    flex: 1,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  accountAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: v_1bfbd0.zinc200,
  },
  accountInfo: { flex: 1 },
  accountName: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc900 },
  accountSub: { fontSize: 13, color: v_1bfbd0.zinc500, marginTop: 2 },

  commentRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  commentTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: v_1bfbd0.zinc200,
  },
  commentName: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
  commentTime: { fontSize: 12, color: v_1bfbd0.zinc400 },
  commentText: {
    fontSize: 14,
    color: v_1bfbd0.zinc700,
    lineHeight: 20,
    paddingLeft: 36,
  },

  inviteSheet: {
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 8,
    width: "100%",
    height: "70%",
  },
  inviteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  inviteTitle: { fontSize: 18, fontWeight: "700", color: v_1bfbd0.zinc900 },
  inviteSearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: v_1bfbd0.zinc100,
    borderRadius: v_8b0c90.full,
    paddingHorizontal: 16,
    height: 44,
    marginBottom: 16,
  },
  inviteSearchInput: {
    flex: 1,
    fontSize: 14,
    color: v_1bfbd0.zinc900,
  },
  inviteList: { flex: 1 },
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  inviteAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: v_1bfbd0.zinc200,
  },
  inviteInfo: { flex: 1 },
  inviteName: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc900 },
  inviteUsername: { fontSize: 13, color: v_1bfbd0.zinc500, marginTop: 2 },
  inviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: v_8b0c90.full,
    backgroundColor: v_1bfbd0.zinc900,
  },
  inviteBtnSent: {
    backgroundColor: v_1bfbd0.zinc100,
  },
  inviteBtnText: { fontSize: 13, fontWeight: "600", color: v_1bfbd0.white },
  inviteBtnTextSent: { color: v_1bfbd0.success },
});
