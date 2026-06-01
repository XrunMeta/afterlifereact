import { v_889fad } from "../../stores/dialogStore";
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
  v_f2c756,
  v_03e392,
} from "rcmrninabrnb";
import * as v_d05ab5 from "khtmgrssvfqqjmzoc";
import { v_04686a } from "../../lib/imagePicker";
import { v_dec439, v_25515d } from "zvyjokvuouwvifyzks";
import { v_cf763b, v_ada615, v_650cfa } from "ixigazcpvfldbecwtbvavtbi";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_772971 } from "jmpfvteuuztnp";
import * as v_fba5a0 from "hfxxehldoiokdq";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import v_556baf from "../../components/ui/SafeView";
import v_1a40c4 from "../../components/ui/Button";
import v_258c1c from "../../components/common/PageHeader";
import v_5778ce from "../../components/common/HashtagText";
import v_4c2648 from "./components/FriendPickerModal";
import { v_194498 } from "../../stores/cloneStore";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_b4902e } from "../../stores/followStore";
import { v_694b7f } from "../../api/source";
import { v_d60cdf, v_81d12f, v_f373d8, v_20d793, v_776874, v_914311, v_8ce643, type v_fa0201, type v_a9d96d, type v_d83ffc, type v_52af9d, type v_ceccc3, type v_6349d0 } from "../../api/clones";
import { v_bfd883 } from "../../lib/relativeTime";
import v_8e7ad4 from "../../components/ui/SwipeDownSheet";
import { v_84a859, v_976b89 } from "../../api/auth";
import { v_5c99c1, v_9b8cb3 } from "../../api/payments";
import v_3cb56d from "../../components/my/PaymentPinPromptModal";
import { v_7d2692 } from "../../api/files";
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
    username: v_3f4e2e.username,
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
  const v_21f395 = v_1ed7d9((v_fd5f43) => v_fd5f43.patchApiUser);
  const v_06f32b = v_194498((v_fd5f43) => v_fd5f43.localClones);
  const v_7a98d1 = v_194498((v_fd5f43) => v_fd5f43.upsertClones);
  const v_1e752a = v_b4902e((v_fd5f43) => v_fd5f43.follows);

  const [v_8a7926, v_d42991] = v_5ab095<v_affcc0[] | null>(null);

  const [v_959d04, v_fd8761] = v_5ab095<v_a9d96d[]>([]);

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

  v_c4deb2(() => {
    if (!v_2ca7e0) {
      v_fd8761([]);
      return;
    }
    v_81d12f(v_2ca7e0)
      .then((v_cb35cb) => v_fd8761(v_cb35cb.items))
      .catch(() => v_fd8761([]));
  }, [v_2ca7e0]);

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

  const [v_1d54f1, v_67ba02] = v_5ab095<number | null | undefined>(undefined);
  const [v_19340b, v_14129c] = v_5ab095(true);

  const [v_fda1fd, v_7ece2f] = v_5ab095(false);
  v_c4deb2(() => {
    if (!v_2ca7e0) return;
    let v_2008a4 = false;
    (async () => {
      try {
        const v_d308b5 = await v_9b8cb3(v_2ca7e0);
        if (v_2008a4) return;
        if (v_d308b5.linked && !v_d308b5.hasPin) v_7ece2f(true);
      } catch (v_49263d) {
        console.warn("[Dashboard] PIN status fetch failed:", v_49263d);
      }
    })();
    return () => {
      v_2008a4 = true;
    };
  }, [v_2ca7e0]);

  const v_48d264 = (v_b113dd as { followingCount?: number } | null)?.followingCount ?? 0;
  const v_a7e127 = (v_b113dd as { followersCount?: number } | null)?.followersCount ?? 0;

  const [v_026c2d, v_5eda29] = v_5ab095(false);

  const [v_04e734, v_d6a117] = v_5ab095(false);

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

  const [v_d3a183, v_598141] = v_5ab095<{
    cloneId: number;
    cloneName: string;
  } | null>(null);
  const [v_e3b01d, v_34611c] = v_5ab095<v_6349d0 | null>(null);
  const [v_5be645, v_b3ab13] = v_5ab095(false);

  const [v_eaf85e, v_aff30f] = v_5ab095(false);

  v_c4deb2(() => {
    if (!v_d3a183) {
      v_34611c(null);
      return;
    }
    if (!v_2ca7e0) return;
    let v_2008a4 = false;
    v_b3ab13(true);
    v_34611c(null);
    v_8ce643(v_2ca7e0, v_d3a183.cloneId, { limit: 100 })
      .then((v_8f00b9) => {
        if (v_2008a4) return;
        v_34611c(v_8f00b9);
      })
      .catch((v_49263d) => {
        console.warn("[MyClones] listCloneIntimacyEvents failed:", v_49263d);
        if (!v_2008a4) v_34611c(null);
      })
      .finally(() => {
        if (!v_2008a4) v_b3ab13(false);
      });
    return () => {
      v_2008a4 = true;
    };
  }, [v_d3a183, v_2ca7e0]);

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
    if (!v_2ca7e0) {
      v_14129c(false);
      v_67ba02(undefined);
      return;
    }
    let v_2008a4 = false;
    v_14129c(true);
    v_5c99c1(v_2ca7e0)
      .then((v_8f00b9) => {
        if (v_2008a4) return;
        console.log(
          "[Dashboard] xrun balance ←",
          "linked=", v_8f00b9.linked,
          "xrun=", v_8f00b9.xrun,
          "balances.length=", v_8f00b9.balances?.length ?? 0,
          "balances=", JSON.stringify(v_8f00b9.balances),
        );

        if (!v_8f00b9.linked) {
          v_67ba02(undefined);
        } else if (typeof v_8f00b9.xrun === "number" && Number.isFinite(v_8f00b9.xrun)) {
          v_67ba02(v_8f00b9.xrun);
        } else {
          v_67ba02(undefined);
        }
      })
      .catch((v_49263d) => {
        console.warn("[Dashboard] xrun balance fetch failed:", v_49263d);
        if (!v_2008a4) v_67ba02(undefined);
      })
      .finally(() => {
        if (!v_2008a4) v_14129c(false);
      });
    return () => {
      v_2008a4 = true;
    };
  }, [v_2ca7e0]);

  const v_d28ade = async () => {
    if (!v_2ca7e0) {
      v_889fad(v_8d41d7("common.notice", { defaultValue: "알림" }), v_8d41d7("my.loginRequired", { defaultValue: "로그인이 필요해요." }));
      return;
    }
    const v_d60769 = await v_d05ab5.requestMediaLibraryPermissionsAsync();
    if (!v_d60769.granted) {
      v_889fad(
        v_8d41d7("my.permTitle", { defaultValue: "권한 필요" }),
        v_8d41d7("my.permDesc", { defaultValue: "사진 라이브러리 접근 권한을 허용해주세요." }),
      );
      return;
    }

    const v_07fb2e = await v_04686a({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (v_07fb2e.canceled || !v_07fb2e.assets?.[0]) return;
    const v_b76cd8 = v_07fb2e.assets[0];

    v_5eda29(true);
    try {
      const v_57ac81 = await v_7d2692(v_2ca7e0, v_b76cd8.uri, {
        purpose: "avatar",
        fileName: v_b76cd8.fileName ?? "avatar.jpg",
        mimeType: v_b76cd8.mimeType ?? "image/jpeg",
      });
      await v_976b89(v_2ca7e0, { avatarUrl: v_57ac81.url });
      v_21f395({ avatarUrl: v_57ac81.url });
    } catch (v_49263d) {
      const v_badeaf = v_49263d instanceof Error ? v_49263d.message : "이미지 업로드에 실패했어요";
      v_889fad(v_8d41d7("common.error", { defaultValue: "오류" }), v_badeaf);
    } finally {
      v_5eda29(false);
    }
  };

  const v_63ceb4 = async () => {
    const v_be4a9f = "market://details?id=run.xrun.xrunapp";
    const v_5bca88 = "https://play.google.com/store/apps/details?id=run.xrun.xrunapp";
    const v_789b41 = "https://apps.apple.com/app/id1492389867";
    try {
      if (v_326be8.OS === "android") {
        const v_e4c8cf = await v_f2c756.canOpenURL(v_be4a9f);
        await v_f2c756.openURL(v_e4c8cf ? v_be4a9f : v_5bca88);
      } else {
        await v_f2c756.openURL(v_789b41);
      }
    } catch (v_49263d) {
      console.warn("[Dashboard] open xrun store failed:", v_49263d);
    }
  };

  const [v_480a32, v_4ccd21] = v_5ab095<number | null>(null);

  const v_c9f992 = async (v: v_b0b271) => {
    if (!v_7462ec) return;
    const v_6e0fd3 = v_7462ec.cloneId;
    v_2dbd8f(null);

    if (v_81e2ef === "selected") {
      v_4ccd21(v_6e0fd3);
      return;
    }

    v_2bf327((v_ba2215) => ({
      ...v_ba2215,
      [v_6e0fd3]: { ...v_ba2215[v_6e0fd3], visibility: v_81e2ef },
    }));

    if (v_2ca7e0) {
      try {
        const { patchClone: v_bb226e } = await import("../../api/clones");
        await v_bb226e(v_2ca7e0, v_6e0fd3, {
          visibility: v_81e2ef,

          allowed_viewers: [],
        });
      } catch (v_49263d) {
        console.warn("[Dashboard] update visibility failed:", v_49263d);
      }
    }
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
      case "public": return "전체 공개";
      case "followers": return "팔로워만";
      case "selected": return "특정 친구";
      case "private": return "나만 보기";
    }
  };

  const v_a6deb1 = (v: v_b0b271): keyof typeof v_dec439.glyphMap => {
    switch (v_81e2ef) {
      case "public": return "globe";
      case "followers": return "users";
      case "selected": return "user-check";
      case "private": return "lock";
    }
  };

  const v_b80d74 = ({ item: v_eb25ce }: { item: v_affcc0 }) => {
    const v_b6e533 = v_699459[v_eb25ce.id];
    const v_818579 = v_b6e533?.visibility ?? v_eb25ce.visibility;
    const v_e93e18 = v_eb25ce.cloneType === "memlow";

    const v_e17daa =
      typeof v_eb25ce.followersCount === "number"
        ? v_eb25ce.followersCount
        : v_1e752a.filter((v_8b5cd8) => v_8b5cd8.followingCloneId === v_eb25ce.id).length;

    return (
      <View style={v_fd5f43.card}>
        {}
        <View style={v_fd5f43.cardTopRow}>
          <View style={v_fd5f43.cardTopRight}>
            {

}
            {!v_e93e18 && (
              <TouchableOpacity
                style={v_fd5f43.visibilityBadge}
                onPress={() => v_11e385(v_eb25ce.id)}
                hitSlop={8}
              >
                <Feather name={v_a6deb1(v_818579)} size={14} color={v_1bfbd0.zinc500} />
                <Text style={v_fd5f43.visibilityText}>{v_82830c(v_818579)}</Text>
                <Feather name="chevron-down" size={12} color={v_1bfbd0.zinc400} />
              </TouchableOpacity>
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
            {}
          </View>
          <View style={v_fd5f43.cloneInfo}>
            <Text style={v_fd5f43.cloneName}>{v_eb25ce.displayName}</Text>
            {v_eb25ce.username ? (
              <Text style={v_fd5f43.cloneUsername}>@{v_eb25ce.username}</Text>
            ) : null}
            {
}
            {v_eb25ce.interests?.[0] ? (
              <Text style={v_fd5f43.cloneCategory}>{v_eb25ce.interests[0]}</Text>
            ) : null}
          </View>
        </View>

        {}
        <HashtagText style={v_fd5f43.description} numberOfLines={2}>
          {v_eb25ce.description}
        </HashtagText>

        {

}
        {v_e93e18 ? null : (
          <View style={v_fd5f43.statsRow}>
            <TouchableOpacity
              style={v_fd5f43.stat}
              onPress={() => v_d5cd7b({ type: "likes", cloneId: v_eb25ce.id, cloneName: v_eb25ce.displayName })}
            >
              <Feather name="heart" size={14} color={v_1bfbd0.zinc500} />
              <Text style={v_fd5f43.statText}>{v_5c66fc(v_eb25ce.likesCount)}</Text>
            </TouchableOpacity>
            {}
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
                {v_e17daa} 구독자
              </Text>
            </TouchableOpacity>
            {
}
            <TouchableOpacity
              style={v_fd5f43.stat}
              onPress={() => v_598141({ cloneId: v_eb25ce.id, cloneName: v_eb25ce.displayName })}
            >
              <Ionicons name="chatbubbles-outline" size={14} color={v_1bfbd0.zinc500} />
              <Text style={v_fd5f43.statText}>상호작용</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={v_fd5f43.stat}
              onPress={() => v_598141({ cloneId: v_eb25ce.id, cloneName: v_eb25ce.displayName })}
            >
              <Feather name="thermometer" size={14} color="#fb923c" />
              <Text style={v_fd5f43.statText}>온도</Text>
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
            }}
          >
            <Feather name="share-2" size={16} color={v_1bfbd0.zinc700} />
            <Text style={v_fd5f43.actionText}>{v_8d41d7("dashboard.actionShare")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.white} showBottomBackground={false}>
      <PageHeader
        title={v_8d41d7("dashboard.title")}
        rightAction={

          <TouchableOpacity
            onPress={() =>
              v_f4c991.dispatch(
                v_650cfa.navigate({
                  name: "MyTab",
                  params: { screen: "MyHome" },
                }),
              )
            }
            activeOpacity={0.7}
            hitSlop={8}
          >
            <Feather name="settings" size={22} color={v_1bfbd0.zinc700} />
          </TouchableOpacity>
        }
      />

      {}
      {v_2ca7e0 && v_8a7926 === null ? (
        <View style={v_fd5f43.dashLoading}>
          <ActivityIndicator color={v_1bfbd0.violet600} size="large" />
          <Text style={v_fd5f43.dashLoadingText}>불러오는 중...</Text>
        </View>
      ) : (
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
                    params: { screen: "Step3" },
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
            {

}
            <View style={v_fd5f43.profileSection}>
              <View style={v_fd5f43.profileLeft}>
                <View style={v_fd5f43.profileAvatarWrap}>
                  {(() => {

                    const v_cd1446 = v_b113dd
                      ? v_b113dd.avatarUrl
                      : v_f38ee5?.avatarUrl ?? null;
                    return v_cd1446 ? (
                      <Image source={{ uri: v_cd1446 }} style={v_fd5f43.profileAvatar} />
                    ) : (
                      <View style={[v_fd5f43.profileAvatar, v_fd5f43.profileAvatarPlaceholder]}>
                        <Feather name="user" size={28} color={v_1bfbd0.zinc400} />
                      </View>
                    );
                  })()}
                  <TouchableOpacity
                    style={v_fd5f43.profileAvatarEditBtn}
                    onPress={v_d28ade}
                    disabled={v_026c2d}
                    activeOpacity={0.8}
                    hitSlop={6}
                  >
                    {v_026c2d ? (
                      <ActivityIndicator size="small" color={v_1bfbd0.white} />
                    ) : (
                      <Feather name="edit-2" size={12} color={v_1bfbd0.white} />
                    )}
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1, marginLeft: 26 }}>
                  <Text style={v_fd5f43.profileName} numberOfLines={1}>
                    {v_b113dd?.name ?? v_f38ee5?.displayName ?? "사용자"}
                  </Text>
                  <View style={v_fd5f43.profileStatsRow}>
                    <TouchableOpacity
                      style={v_fd5f43.profileStatItem}
                      onPress={() => {
                        const v_44e218 = v_b113dd?.id;
                        if (!v_44e218) return;
                        v_f4c991.navigate("UserFollowList", {
                          userId: v_44e218,
                          mode: "followers",
                          userName: v_b113dd?.name ?? undefined,
                        });
                      }}
                    >
                      <Text style={v_fd5f43.profileStatValue}>{v_a7e127}</Text>
                      <Text style={v_fd5f43.profileStatLabel}>팔로워</Text>
                    </TouchableOpacity>
                    <View style={v_fd5f43.profileStatDivider} />
                    <TouchableOpacity
                      style={v_fd5f43.profileStatItem}
                      onPress={() => {
                        const v_44e218 = v_b113dd?.id;
                        if (!v_44e218) return;
                        v_f4c991.navigate("UserFollowList", {
                          userId: v_44e218,
                          mode: "following",
                          userName: v_b113dd?.name ?? undefined,
                        });
                      }}
                    >
                      <Text style={v_fd5f43.profileStatValue}>{v_48d264}</Text>
                      <Text style={v_fd5f43.profileStatLabel}>팔로잉</Text>
                    </TouchableOpacity>
                    <View style={v_fd5f43.profileStatDivider} />
                    <View style={v_fd5f43.profileStatItem}>
                      <Text style={v_fd5f43.profileStatValue}>{v_fc7f92.length}</Text>
                      <Text style={v_fd5f43.profileStatLabel}>페르소나</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {
}
            <View style={v_fd5f43.coinRow}>
              <Image
                source={require("../../../assets/images/xrun-round-logo.png")}
                style={v_fd5f43.coinIcon}
              />
              <View style={{ flex: 1 }} />
              <View style={v_fd5f43.coinAmountWrap}>
                {v_19340b ? (
                  <ActivityIndicator color={v_1bfbd0.zinc900} />
                ) : v_1d54f1 != null ? (
                  <Text style={v_fd5f43.coinAmountText}>
                    {v_1d54f1.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    <Text style={v_fd5f43.coinUnit}> XRUN</Text>
                  </Text>
                ) : (
                  <Text style={v_fd5f43.coinAmountText}>
                    —<Text style={v_fd5f43.coinUnit}> XRUN</Text>
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={v_fd5f43.coinChargeBtn}
                onPress={() => v_d6a117(true)}
                hitSlop={8}
              >
                <Feather name="plus-circle" size={24} color={v_1bfbd0.violet600} />
              </TouchableOpacity>
            </View>

            {
}
          </>
        }
        ListFooterComponent={
          v_959d04.length > 0 ? (
            <View style={v_fd5f43.systemClonesSection}>
              <Text style={v_fd5f43.systemClonesSectionTitle}>통화 가능</Text>
              {v_959d04.map((v_69bba6) => (
                <View key={v_69bba6.id} style={v_fd5f43.card}>
                  <View style={v_fd5f43.cloneHeader}>
                    <View style={v_fd5f43.avatarWrap}>
                      <View style={[v_fd5f43.avatar, { backgroundColor: v_1bfbd0.zinc100, alignItems: "center", justifyContent: "center" }]}>
                        <Feather name="user" size={20} color={v_1bfbd0.zinc400} />
                      </View>
                    </View>
                    <View style={v_fd5f43.cloneInfo}>
                      <Text style={v_fd5f43.cloneName}>{v_69bba6.name}</Text>
                      <Text style={v_fd5f43.cloneUsername}>@{v_69bba6.username}</Text>
                    </View>
                  </View>
                  <View style={v_fd5f43.actionsRow}>
                    <TouchableOpacity
                      style={v_fd5f43.actionBtn}
                      onPress={() => v_f4c991.navigate("Call", { cloneId: v_69bba6.id, name: v_69bba6.name })}
                    >
                      <Feather name="video" size={16} color={v_1bfbd0.zinc700} />
                      <Text style={v_fd5f43.actionText}>{v_8d41d7("dashboard.actionCall")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : null
        }
      />
      )}

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

            {
}
            <View style={v_fd5f43.menuDivider} />
            {}
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
            <Text style={v_fd5f43.modalTitle}>공개 범위</Text>
            <Text style={v_fd5f43.modalDesc}>이 페르소나를 누구에게 보일까요?</Text>
            <View style={v_fd5f43.visibilityOptions}>
              {(["public", "followers", "selected", "private"] as v_b0b271[]).map((v_81e2ef) => {
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
      <FriendPickerModal
        visible={v_480a32 != null}
        onClose={() => v_4ccd21(null)}
        onConfirm={async (v_9b3001) => {
          const v_6e0fd3 = v_480a32;
          v_4ccd21(null);
          if (!v_6e0fd3) return;
          v_2bf327((v_ba2215) => ({
            ...v_ba2215,
            [v_6e0fd3]: { ...v_ba2215[v_6e0fd3], visibility: "selected" },
          }));
          if (v_2ca7e0) {
            try {
              const { patchClone: v_bb226e } = await import("../../api/clones");
              await v_bb226e(v_2ca7e0, v_6e0fd3, {
                visibility: "selected",
                allowed_viewers: v_9b3001,
              });
            } catch (v_49263d) {
              console.warn("[Dashboard] selected visibility PATCH failed:", v_49263d);
            }
          }
        }}
      />

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

      {
}
      <Modal visible={v_04e734} transparent animationType="fade">
        <Pressable
          style={v_fd5f43.chargeOverlay}
          onPress={() => v_d6a117(false)}
        >
          <Pressable style={v_fd5f43.chargeBox} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <View style={v_fd5f43.chargeIconWrap}>
              <Feather name="zap" size={28} color={v_1bfbd0.violet600} />
            </View>
            <Text style={v_fd5f43.chargeTitle}>암호화폐 충전 안내</Text>
            <Text style={v_fd5f43.chargeDesc}>
              금액을 충전하고 싶다면{"\n"}xrun 앱에서 암호화폐를 얻어보세요
            </Text>
            <Text style={v_fd5f43.chargeHint}>※ 같은 아이디로 로그인 하셔야 합니다</Text>
            <View style={v_fd5f43.chargeBtns}>
              <TouchableOpacity
                style={v_fd5f43.chargeCancelBtn}
                onPress={() => v_d6a117(false)}
              >
                <Text style={v_fd5f43.chargeCancelText}>닫기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={v_fd5f43.chargeGoBtn}
                onPress={() => {
                  v_d6a117(false);
                  v_63ceb4();
                }}
              >
                <Feather name="external-link" size={14} color={v_1bfbd0.white} />
                <Text style={v_fd5f43.chargeGoText}>바로가기</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={!!v_8bb912} transparent animationType="slide">
        <Pressable style={v_fd5f43.modalOverlay} onPress={() => v_d5cd7b(null)}>
          <SwipeDownSheet
            onClose={() => v_d5cd7b(null)}
            style={[v_fd5f43.statsSheet, { paddingBottom: 32 + Math.max(v_033e14.bottom, 0) }]}
          >
            <View style={v_fd5f43.sheetHandle} />
            <Text style={v_fd5f43.statsSheetTitle}>
              {v_8bb912?.type === "likes" && "좋아요"}
              {v_8bb912?.type === "interactions" && "상호작용"}
              {v_8bb912?.type === "comments" && "댓글"}
              {v_8bb912?.type === "followers" && "구독자"}
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
                      <Text style={{ color: v_1bfbd0.zinc500, fontSize: 13 }}>아직 구독자가 없어요</Text>
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
          </SwipeDownSheet>
        </Pressable>
      </Modal>

      {
}
      <Modal visible={!!v_d3a183} transparent animationType="slide">
        <Pressable style={v_fd5f43.modalOverlay} onPress={() => v_598141(null)}>
          <SwipeDownSheet
            onClose={() => v_598141(null)}
            style={[v_fd5f43.statsSheet, { paddingBottom: 32 + Math.max(v_033e14.bottom, 0) }]}
          >
            <View style={v_fd5f43.sheetHandle} />
            <View style={v_fd5f43.intimacyTitleRow}>
              <View style={{ width: 28 }} />
              <Text style={v_fd5f43.statsSheetTitle}>{v_8d41d7("feed.eventsTitle")}</Text>
              <TouchableOpacity
                onPress={() => v_aff30f(true)}
                hitSlop={8}
                style={{ width: 28, alignItems: "flex-end" }}
              >
                <Feather name="help-circle" size={20} color={v_1bfbd0.zinc400} />
              </TouchableOpacity>
            </View>
            <Text style={v_fd5f43.statsSheetSub}>{v_d3a183?.cloneName}</Text>

            {}
            {v_e3b01d?.summary && (
              <View style={v_fd5f43.intimacySummary}>
                <View style={v_fd5f43.intimacySummaryRow}>
                  <Feather name="thermometer" size={20} color="#fb923c" />
                  <Text style={v_fd5f43.intimacySummaryScore}>
                    {Math.min(100, v_e3b01d.summary.totalScore)}°C
                  </Text>
                  <Text style={v_fd5f43.intimacySummaryCount}>
                    · {v_8d41d7("feed.summaryCount", { n: v_e3b01d.summary.eventCount })}
                  </Text>
                </View>
                <View style={v_fd5f43.intimacyBreakdownRow}>
                  <Text style={v_fd5f43.intimacyBreakdownItem}>
                    채팅 <Text style={v_fd5f43.intimacyBreakdownVal}>{v_e3b01d.summary.chat}°C</Text>
                  </Text>
                  <Text style={v_fd5f43.intimacyBreakdownItem}>
                    통화 <Text style={v_fd5f43.intimacyBreakdownVal}>{v_e3b01d.summary.call}°C</Text>
                  </Text>
                  <Text style={v_fd5f43.intimacyBreakdownItem}>
                    탐색 <Text style={v_fd5f43.intimacyBreakdownVal}>{v_e3b01d.summary.learn}°C</Text>
                  </Text>
                  <Text style={v_fd5f43.intimacyBreakdownItem}>
                    피드 <Text style={v_fd5f43.intimacyBreakdownVal}>{v_e3b01d.summary.feed}°C</Text>
                  </Text>
                </View>
              </View>
            )}

            <ScrollView style={v_fd5f43.statsScrollArea} showsVerticalScrollIndicator={false}>
              {v_5be645 ? (
                <ActivityIndicator color={v_1bfbd0.zinc500} style={{ paddingVertical: 24 }} />
              ) : !v_e3b01d || v_e3b01d.items.length === 0 ? (
                <View style={{ paddingVertical: 24, alignItems: "center" }}>
                  <Text style={{ color: v_1bfbd0.zinc500, fontSize: 13 }}>
                    {v_8d41d7("feed.emptyEventsMine")}
                  </Text>
                </View>
              ) : (
                v_e3b01d.items.map((v_1d299c) => {
                  const ACTION_META: Record<
                    "chat" | "call" | "learn" | "feed",
                    { label: string; icon: keyof typeof v_dec439.glyphMap; color: string }
                  > = {
                    chat: { label: v_8d41d7("feed.actionLabelChat"), icon: "message-circle", color: "#60a5fa" },
                    call: { label: v_8d41d7("feed.actionLabelCall"), icon: "phone", color: "#34d399" },
                    learn: { label: v_8d41d7("feed.actionLabelLearn"), icon: "search", color: "#a78bfa" },
                    feed: { label: v_8d41d7("feed.actionLabelFeed"), icon: "heart", color: "#ef4444" },
                  };
                  const v_ab4c96 = v_894daa[v_1d299c.action];
                  return (
                    <View key={v_1d299c.id} style={v_fd5f43.intimacyEventRow}>
                      <View style={[v_fd5f43.intimacyEventIcon, { backgroundColor: v_ab4c96.color + "22" }]}>
                        <Feather name={v_ab4c96.icon} size={14} color={v_ab4c96.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={v_fd5f43.intimacyEventLabel}>{v_ab4c96.label}</Text>
                        <Text style={v_fd5f43.intimacyEventTime}>{v_bfd883(v_1d299c.createdAt)}</Text>
                      </View>
                      <Text style={v_fd5f43.intimacyEventScore}>+{v_1d299c.score}°C</Text>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </SwipeDownSheet>
        </Pressable>
      </Modal>

      {}
      <Modal visible={v_eaf85e} transparent animationType="fade">
        <Pressable
          style={v_fd5f43.intimacyInfoOverlay}
          onPress={() => v_aff30f(false)}
        >
          <Pressable style={v_fd5f43.intimacyInfoBox} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <View style={v_fd5f43.intimacyInfoHeader}>
              <View style={v_fd5f43.intimacyInfoHeaderLeft}>
                <Feather name="thermometer" size={18} color="#fb923c" />
                <Text style={v_fd5f43.intimacyInfoTitle}>{v_8d41d7("feed.intimacyInfoTitle")}</Text>
              </View>
              <TouchableOpacity onPress={() => v_aff30f(false)}>
                <Feather name="x" size={20} color={v_1bfbd0.zinc400} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              <Text style={v_fd5f43.intimacyInfoSectionTitle}>{v_8d41d7("feed.intimacyTempSectionLabel")}</Text>
              <Text style={v_fd5f43.intimacyInfoDesc}>{v_8d41d7("feed.intimacyTempShortDesc")}</Text>
              {[
                ["0-30°C", v_8d41d7("feed.intimacyL1")],
                ["31-60°C", v_8d41d7("feed.intimacyL2")],
                ["61-90°C", v_8d41d7("feed.intimacyL3")],
                ["91-100°C", v_8d41d7("feed.intimacyL4")],
              ].map(([v_4f2c9c, v_41b99d], v_ebec57) => (
                <View key={v_ebec57} style={v_fd5f43.intimacyInfoLevelRow}>
                  <Text style={[v_fd5f43.intimacyInfoLevelRange, v_ebec57 === 3 && { color: "#f97316" }]}>{v_4f2c9c}</Text>
                  <Text style={[v_fd5f43.intimacyInfoLevelDesc, v_ebec57 === 3 && { color: "#f97316" }]}>{v_41b99d}</Text>
                </View>
              ))}
              <Text style={v_fd5f43.intimacyInfoSectionTitle}>{v_8d41d7("feed.intimacyHowToTitle")}</Text>
              <View style={v_fd5f43.intimacyInfoActivityBox}>
                <Text style={v_fd5f43.intimacyInfoActivityItem}>• {v_8d41d7("feed.intimacyHowChat")}</Text>
                <Text style={v_fd5f43.intimacyInfoActivityItem}>• {v_8d41d7("feed.intimacyHowCall")}</Text>
                <Text style={v_fd5f43.intimacyInfoActivityItem}>• {v_8d41d7("feed.intimacyHowLearn")}</Text>
                <Text style={v_fd5f43.intimacyInfoActivityItem}>• {v_8d41d7("feed.intimacyHowFeed")}</Text>
              </View>
              <Text style={v_fd5f43.intimacyInfoFootnote}>{v_8d41d7("feed.intimacyFootnote")}</Text>
            </ScrollView>
            <TouchableOpacity
              style={v_fd5f43.intimacyInfoOkBtn}
              onPress={() => v_aff30f(false)}
            >
              <Text style={v_fd5f43.intimacyInfoOkText}>{v_8d41d7("common.ok")}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <PaymentPinPromptModal
        visible={v_fda1fd}
        onClose={() => v_7ece2f(false)}
      />
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
  systemClonesSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  systemClonesSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: v_1bfbd0.zinc500,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dashLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  dashLoadingText: {
    fontSize: 13,
    color: v_1bfbd0.zinc500,
  },
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

  profileSection: {
    paddingTop: 28,
    paddingBottom: 14,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  profileLeft: { flexDirection: "row", alignItems: "center" },
  profileAvatarWrap: { position: "relative" },
  profileAvatar: { width: 64, height: 64, borderRadius: 32 },
  profileAvatarPlaceholder: {
    backgroundColor: v_1bfbd0.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarEditBtn: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: v_1bfbd0.zinc900,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: v_1bfbd0.white,
  },
  profileName: {
    fontSize: 17,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
    marginBottom: 8,
  },
  profileStatsRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  profileStatItem: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  profileStatValue: { fontSize: 14, fontWeight: "700", color: v_1bfbd0.zinc900 },
  profileStatLabel: { fontSize: 12, color: v_1bfbd0.zinc500 },
  profileStatDivider: { width: 1, height: 12, backgroundColor: v_1bfbd0.zinc200 },

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

  coinRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: v_1bfbd0.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc100,
  },
  coinIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  coinSymbol: { fontSize: 16, fontWeight: "600", color: v_1bfbd0.zinc900 },
  coinNetwork: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  coinAmountWrap: { alignItems: "flex-end", marginRight: 8 },
  coinAmountText: { fontSize: 16, fontWeight: "700", color: v_1bfbd0.zinc900 },
  coinUnit: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc700 },
  coinChargeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },

  chargeOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  chargeBox: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: v_1bfbd0.white,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  chargeIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: v_1bfbd0.violet100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  chargeTitle: { fontSize: 18, fontWeight: "700", color: v_1bfbd0.zinc900, marginBottom: 8 },
  chargeDesc: {
    fontSize: 14,
    color: v_1bfbd0.zinc600,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },
  chargeHint: { fontSize: 12, color: v_1bfbd0.zinc500, marginBottom: 20 },
  chargeBtns: { flexDirection: "row", gap: 8, width: "100%" },
  chargeCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: v_8b0c90.md,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc300,
    alignItems: "center",
  },
  chargeCancelText: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc700 },
  chargeGoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: v_8b0c90.md,
    backgroundColor: v_1bfbd0.violet600,
  },
  chargeGoText: { fontSize: 14, fontWeight: "700", color: v_1bfbd0.white },

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
    justifyContent: "flex-end",
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
  cloneUsername: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
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

    height: "80%",
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

  intimacySummary: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
    marginBottom: 8,
  },
  intimacySummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  intimacySummaryScore: { fontSize: 24, fontWeight: "700", color: "#fb923c" },
  intimacySummaryCount: { fontSize: 13, color: v_1bfbd0.zinc500 },
  intimacyBreakdownRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  intimacyBreakdownItem: { fontSize: 12, color: v_1bfbd0.zinc500 },
  intimacyBreakdownVal: { color: v_1bfbd0.zinc900, fontWeight: "600" },
  intimacyEventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  intimacyEventIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  intimacyEventLabel: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
  intimacyEventTime: { fontSize: 11, color: v_1bfbd0.zinc500, marginTop: 2 },
  intimacyEventScore: { fontSize: 14, fontWeight: "700", color: "#fb923c" },

  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  infoSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoSectionTitle: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.zinc900 },
  infoSectionDesc: { fontSize: 13, color: v_1bfbd0.zinc600, lineHeight: 20, marginBottom: 12 },
  infoSectionFootnote: { fontSize: 11, color: v_1bfbd0.zinc500, lineHeight: 16, marginTop: 10 },
  infoLevelRow: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  infoLevelRange: { width: 90, fontSize: 13, fontWeight: "600", color: v_1bfbd0.zinc700 },
  infoLevelDesc: { fontSize: 13, color: v_1bfbd0.zinc500 },
  infoActivityBox: {
    backgroundColor: v_1bfbd0.zinc50,
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  infoActivityItem: { fontSize: 13, color: v_1bfbd0.zinc700, lineHeight: 20 },
  infoActivityScore: { color: "#fb923c", fontWeight: "700" },

  intimacyTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },
  intimacyInfoOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 24 },
  intimacyInfoBox: { width: "100%", maxWidth: 360, backgroundColor: v_1bfbd0.white, borderRadius: v_8b0c90.lg, padding: 20 },
  intimacyInfoHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  intimacyInfoHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  intimacyInfoTitle: { fontSize: 17, fontWeight: "700", color: v_1bfbd0.zinc900 },
  intimacyInfoDesc: { fontSize: 13, color: v_1bfbd0.zinc600, lineHeight: 20, marginBottom: 10 },
  intimacyInfoSectionTitle: { fontSize: 14, fontWeight: "700", color: v_1bfbd0.zinc900, marginTop: 12, marginBottom: 8 },
  intimacyInfoFootnote: { fontSize: 11, color: v_1bfbd0.zinc500, lineHeight: 16, marginTop: 12 },
  intimacyInfoLevelRow: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  intimacyInfoLevelRange: { width: 90, fontSize: 13, fontWeight: "600", color: v_1bfbd0.zinc700 },
  intimacyInfoLevelDesc: { fontSize: 13, color: v_1bfbd0.zinc500 },
  intimacyInfoActivityBox: { backgroundColor: v_1bfbd0.zinc50, borderRadius: 8, padding: 12, gap: 6 },
  intimacyInfoActivityItem: { fontSize: 13, color: v_1bfbd0.zinc700, lineHeight: 20 },
  intimacyInfoOkBtn: { marginTop: 16, paddingVertical: 12, borderRadius: v_8b0c90.full, backgroundColor: v_1bfbd0.violet600, alignItems: "center" },
  intimacyInfoOkText: { fontSize: 14, fontWeight: "700", color: v_1bfbd0.white },
});
