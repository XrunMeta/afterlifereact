import { v_561bb6 } from "../../api/gifts";
import { v_889fad } from "../../stores/dialogStore";
import v_a3453e, { v_c4deb2, v_df9f57, v_5ab095, v_de06a3, v_e662ae } from "bapkr";
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
  v_6c4f62,
  v_5f4661,
  v_326be8,
  v_f2c756,
  v_03e392,
} from "rcmrninabrnb";
import * as v_d05ab5 from "khtmgrssvfqqjmzoc";
import { v_04686a } from "../../lib/imagePicker";
import { v_dec439, v_25515d } from "zvyjokvuouwvifyzks";
import { v_cf763b, v_ada615, v_2d8264, type v_ee3714, v_650cfa } from "ixigazcpvfldbecwtbvavtbi";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_c18c22 } from "svuoaeceudfxfjvvpmmmchnwljywbphjgb";
import { v_772971 } from "jmpfvteuuztnp";
import * as v_fba5a0 from "hfxxehldoiokdq";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import v_556baf from "../../components/ui/SafeView";
import v_1a40c4 from "../../components/ui/Button";
import v_258c1c from "../../components/common/PageHeader";
import v_f9a626, { v_db1b12, v_ba6725 } from "../../components/common/PartnerAppBanners";
import v_5778ce from "../../components/common/HashtagText";
import v_4c2648 from "./components/FriendPickerModal";
import v_92380d from "./components/VisibilityPickerModal";
import { v_194498 } from "../../stores/cloneStore";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_84d546 } from "../../lib/callGuard";
import { v_38f9da } from "../../lib/callActivity";
import { v_b4902e } from "../../stores/followStore";
import { v_694b7f } from "../../api/source";
import { v_d60cdf, v_81d12f, v_f373d8, v_20d793, v_776874, v_914311, v_8ce643, v_d24912, type v_a9d96d, type v_d83ffc, type v_52af9d, type v_ceccc3, type v_6349d0, type v_1d741a } from "../../api/clones";
import { v_83b207, v_bf9881, type v_ccbfb2, type v_407a6d, type v_69ac34 } from "../../api/giftInventory";
import v_feb82c from "../../mocks/gifts.json";
import type { v_84fd28 } from "../../types/gift";

const v_bed6ed = v_feb82c as v_84fd28[];

const v_ebad5a = 10;
import { v_a8d790 } from "../../lib/adaptMyClone";
import { v_bfd883 } from "../../lib/relativeTime";
import v_8e7ad4 from "../../components/ui/SwipeDownSheet";
import { v_84a859, v_976b89 } from "../../api/auth";
import { v_48981e, type v_2b70d7 } from "../../api/credits";

import { v_7d2692 } from "../../api/files";
import { v_1bfbd0, v_9b1a04, v_8b0c90, v_a9d3e9, v_d43669, v_c10a43, v_119e65 } from "../../components/constants";
import type { v_affcc0, v_b0b271 } from "../../types/clone";
import v_177da7 from "../../components/gift/GiftExchangeSheet";
import type { v_2d88fc } from "../../navigation/types";
import type { v_8ad91b } from "../../navigation/types";

type ClonesNav = v_390fcc<v_2d88fc>;

const v_b9d568 = 1;

function v_5c66fc(v_f4e98d): string {
  if (typeof v_f4e98d !== "number" || !Number.isFinite(v_f4e98d)) return "0";
  if (v_f4e98d >= 1000) return `${(v_f4e98d / 1000).toFixed(1)}k`;
  return String(v_f4e98d);
}

export default function v_def15b() {
  const v_c65f5d = v_ada615<ClonesNav>();
  const v_f4c991 = v_ada615<v_390fcc<v_8ad91b>>();
  const { t: v_8d41d7 } = v_772971();

  const v_033e14 = v_e0068c();

  const v_f9771e = v_c18c22(0);
  const v_ad9bbd = v_326be8.OS === "android" ? 56 : 0;
  const v_2b650d = Math.max(v_033e14.bottom, v_f9771e, v_ad9bbd);

  const v_9fd982 = v_e662ae<v_9cabcb<v_affcc0>>(null);
  const v_f38ee5 = v_1ed7d9((v_fd5f43) => v_fd5f43.user);
  const v_b113dd = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser);
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_21f395 = v_1ed7d9((v_fd5f43) => v_fd5f43.patchApiUser);
  const v_06f32b = v_194498((v_fd5f43) => v_fd5f43.localClones);
  const v_7a98d1 = v_194498((v_fd5f43) => v_fd5f43.upsertClones);
  const v_1e752a = v_b4902e((v_fd5f43) => v_fd5f43.follows);

  const [v_8a7926, v_d42991] = v_5ab095<v_affcc0[] | null>(null);

  const [v_612e9f, v_575aad] = v_5ab095(false);
  const { onLayout: v_e8db2a, listBottomPad: v_936ba7 } = v_ba6725();

  const [v_959d04, v_fd8761] = v_5ab095<v_a9d96d[]>([]);

  const [v_c88e9b, v_de20d8] = v_5ab095<v_2b70d7 | null>(null);
  const [v_747a87, v_3e37d1] = v_5ab095(false);

  const [v_0bc486, v_f3ce9d] = v_5ab095<v_ccbfb2[]>([]);

  const [v_c9ba75, v_4b3c02] = v_5ab095<v_407a6d[]>([]);
  const [v_9834f8, v_15fd53] = v_5ab095(false);
  const [v_b1118a, v_6edbbc] = v_5ab095(v_ebad5a);
  const [v_489044, v_9500c7] = v_5ab095(0);
  const [v_cfa43b, v_ed9bd4] = v_5ab095(0);

  const [v_0215b6, v_b30c04] = v_5ab095(false);
  const v_fa991f = v_de06a3(() => {
    if (!v_2ca7e0) return;
    v_bf9881(v_2ca7e0, { limit: 50 })
      .then((v_cb35cb) => {
        v_4b3c02(v_cb35cb.items);
        v_9500c7(v_cb35cb.totalReceived);
        v_ed9bd4(v_cb35cb.currentOwned);
      })
      .catch((v_49263d) => console.warn("[MyClonesDashboard] giftActivity fail:", v_49263d));
  }, [v_2ca7e0]);

  const [v_deb5c7, v_9093a8] = v_5ab095(0);

  const v_8e46f5 = v_de06a3(async (v_cc88f5 = false) => {
    if (!v_2ca7e0) {
      v_d42991(null);
      return;
    }
    if (v_cc88f5) v_575aad(true);
    try {
      const v_8f00b9 = await v_d60cdf(v_2ca7e0);
      const v_a15a8b = v_8f00b9.items.map(v_a8d790);
      v_d42991(v_a15a8b);

      v_7a98d1(v_a15a8b);

      const v_1badb6 = v_1ed7d9.getState().apiUser?.id;
      if (v_1badb6 != null) {
        v_194498.getState().pruneOwnedLocalClones(v_1badb6, new Set(v_a15a8b.map((v_3f4e2e) => v_3f4e2e.id)));
      }
    } catch (v_49263d) {
      console.warn("[Dashboard] listMyClones failed:", v_49263d);

      if (!v_cc88f5) {

      }
    } finally {
      if (v_cc88f5) v_575aad(false);
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
    v_de06a3(() => {
      console.log("[MyClonesDashboard] useFocusEffect fire");
      v_8e46f5(false);

      if (v_2ca7e0) {
        v_3e37d1(true);
        v_48981e(v_2ca7e0)
          .then((v_148ff6) => v_de20d8(v_148ff6))
          .catch((v_49263d) => console.warn("[MyClonesDashboard] balance fail:", v_49263d))
          .finally(() => v_3e37d1(false));

        v_83b207(v_2ca7e0)
          .then((v_cb35cb) => v_f3ce9d(v_cb35cb.items.filter((v_23805a) => (v_23805a.count ?? 0) > 0)))
          .catch((v_49263d) => console.warn("[MyClonesDashboard] giftInventory fail:", v_49263d));

        v_bf9881(v_2ca7e0, { limit: 50 })
          .then((v_cb35cb) => {
            v_4b3c02(v_cb35cb.items);
            v_9500c7(v_cb35cb.totalReceived);

            v_9093a8(
              v_cb35cb.totalSent ??
                v_cb35cb.items.filter((v_206b88) => v_206b88.kind === "sent").reduce((v_f4e98d, v_206b88) => v_f4e98d + (v_206b88.count || 1), 0),
            );
            v_ed9bd4(v_cb35cb.currentOwned);
          })
          .catch((v_49263d) => console.warn("[MyClonesDashboard] giftActivity fail:", v_49263d));
      }
    }, [v_8e46f5, v_2ca7e0]),
  );

  const v_4cd149 = v_df9f57<v_affcc0[]>(() => {
    const v_0c8987 = v_b113dd?.id ?? v_f38ee5?.id ?? v_b9d568;
    if (v_8a7926 != null) {

      const v_15e521 = new Set(v_8a7926.map((v_3f4e2e) => v_3f4e2e.id));

      const v_ca52ce = v_194498.getState().addedAt;
      const v_88106c = v_06f32b.filter(
        (v_3f4e2e) => v_3f4e2e.ownerId === v_0c8987 && !v_15e521.has(v_3f4e2e.id) && Date.now() - (v_ca52ce[v_3f4e2e.id] ?? 0) < 2 * 60 * 1000,
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

  const v_48d264 = (v_b113dd as { followingCount?: number } | null)?.followingCount ?? 0;
  const v_a7e127 = (v_b113dd as { followersCount?: number } | null)?.followersCount ?? 0;

  const [v_026c2d, v_5eda29] = v_5ab095(false);

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

  const v_c7daf6 = v_2d8264<v_ee3714<v_2d88fc, "Dashboard">>();
  const v_3bde32 = v_e662ae<number | null>(null);

  const [v_e3b01d, v_34611c] = v_5ab095<v_6349d0 | null>(null);
  const [v_5be645, v_b3ab13] = v_5ab095(false);

  const [v_eaf85e, v_aff30f] = v_5ab095(false);

  const [v_51c9ac, v_cc5a83] = v_5ab095<v_1d741a[] | null>(null);
  const [v_5101de, v_167f31] = v_5ab095(false);

  v_c4deb2(() => {
    if (!v_d3a183) {
      v_cc5a83(null);

      v_34611c(null);
      return;
    }
    if (!v_2ca7e0) return;
    let v_2008a4 = false;
    v_167f31(true);
    v_cc5a83(null);
    v_d24912(v_2ca7e0, v_d3a183.cloneId)
      .then((v_8f00b9) => {
        if (v_2008a4) return;
        v_cc5a83(v_8f00b9.items);
      })
      .catch((v_49263d) => {
        console.warn("[MyClones] listCloneGiftReceipts failed:", v_49263d);
        if (!v_2008a4) v_cc5a83([]);
      })
      .finally(() => {
        if (!v_2008a4) v_167f31(false);
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

  v_c4deb2(() => {
    const v_062ae9 = v_c7daf6.params?.openIntimacyCloneId;
    if (!v_062ae9 || v_3bde32.current === v_062ae9) return;
    const v_eb25ce = v_4cd149.find((v_3f4e2e) => v_3f4e2e.id === v_062ae9);
    if (!v_eb25ce) return; 
    v_3bde32.current = v_062ae9;
    v_598141({ cloneId: v_062ae9, cloneName: v_eb25ce.displayName });
  }, [v_c7daf6.params?.openIntimacyCloneId, v_4cd149]);

  const v_9b5044 = v_e662ae<string | null>(null);
  v_c4deb2(() => {
    const v_062ae9 = v_c7daf6.params?.openStatsCloneId;
    const v_11083e = v_c7daf6.params?.openStatsTab;
    if (!v_062ae9 || !v_11083e) return;
    const v_b24339 = `${v_062ae9}:${v_11083e}`;
    if (v_9b5044.current === v_b24339) return;
    const v_eb25ce = v_4cd149.find((v_3f4e2e) => v_3f4e2e.id === v_062ae9);
    if (!v_eb25ce) return; 
    v_9b5044.current = v_b24339;
    if (v_11083e === "gifts") {
      v_598141({ cloneId: v_062ae9, cloneName: v_eb25ce.displayName });
    } else {
      v_d5cd7b({ type: v_11083e, cloneId: v_062ae9, cloneName: v_eb25ce.displayName });
    }
  }, [v_c7daf6.params?.openStatsCloneId, v_c7daf6.params?.openStatsTab, v_4cd149]);

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

    const v_2d567b = v_699459[v_6e0fd3]?.visibility;
    const v_b43a3d = v_4cd149.find((v_3f4e2e) => v_3f4e2e.id === v_6e0fd3)?.visibility;
    const v_275ccd = v_2d567b ?? v_b43a3d ?? "public";
    v_2dbd8f({ cloneId: v_6e0fd3, currentVisibility: v_275ccd });
    v_8d2d61(null);
  };

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
      const v_badeaf = v_49263d instanceof Error ? v_49263d.message : v_8d41d7("dashboard.uploadAvatarFailed", { defaultValue: "이미지 업로드에 실패했어요" });
      v_889fad(v_8d41d7("common.error", { defaultValue: "오류" }), v_badeaf);
    } finally {
      v_5eda29(false);
    }
  };

  const [v_480a32, v_4ccd21] = v_5ab095<number | null>(null);
  const [v_e8d94c, v_c837fe] = v_5ab095<number[]>([]);

  const v_c9f992 = async (v: v_b0b271) => {
    if (!v_7462ec) return;
    const v_6e0fd3 = v_7462ec.cloneId;
    v_2dbd8f(null);

    if (v_81e2ef === "selected") {

      v_c837fe([]);
      if (v_2ca7e0) {
        const { getAllowedViewerIds: v_69a8d3 } = await import("../../api/clones");
        v_c837fe(await v_69a8d3(v_6e0fd3, v_2ca7e0));
      }
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
      case "public": return v_8d41d7("dashboard.visibilityPublic", { defaultValue: "전체 공개" });
      case "followers": return v_8d41d7("dashboard.visibilityFollowers", { defaultValue: "팔로워만" });
      case "selected": return v_8d41d7("dashboard.visibilitySelected", { defaultValue: "특정 친구" });
      case "private": return v_8d41d7("dashboard.visibilityPrivate", { defaultValue: "나만 보기" });
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

        {

}
        <HashtagText style={v_fd5f43.description}>
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
                {v_8d41d7("dashboard.followerCount", { n: v_e17daa, defaultValue: "{{n}} 구독자" })}
              </Text>
            </TouchableOpacity>
            {
}
            <TouchableOpacity
              style={v_fd5f43.stat}
              onPress={() => v_598141({ cloneId: v_eb25ce.id, cloneName: v_eb25ce.displayName })}
            >
              <Ionicons name="chatbubbles-outline" size={14} color={v_1bfbd0.zinc500} />
              <Text style={v_fd5f43.statText}>{v_8d41d7("dashboard.statInteraction", { defaultValue: "받은 선물" })}</Text>
            </TouchableOpacity>
            {}
          </View>
        )}

        {}
        {v_eb25ce.status === 'pending_assets' && (
          <View style={v_fd5f43.pendingBadge}>
            <Feather name="clock" size={12} color={v_1bfbd0.zinc600} />
            <Text style={v_fd5f43.pendingText}>{v_8d41d7("dashboard.pendingAssetsBadge", { defaultValue: "생성대기중" })}</Text>
            <TouchableOpacity onPress={() => v_c65f5d.navigate('CloneEdit', { cloneId: v_eb25ce.id })}>
              <Text style={v_fd5f43.pendingCta}>{v_8d41d7("dashboard.pendingAssetsCta", { defaultValue: "사진/음성 추가하기" })}</Text>
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
            onPress={async () => {

              const v_3ed4c3 = await v_84d546(v_2ca7e0, () => {
                v_f4c991.dispatch(
                  v_650cfa.navigate({ name: "MyTab", params: { screen: "Purchase" } }),
                );
              });
              if (!v_3ed4c3) return;
              v_38f9da({ cloneId: v_eb25ce.id, source: "my-clones" });
              v_f4c991.navigate("Call", { cloneId: v_eb25ce.id });
            }}
          >
            <Feather name="video" size={16} color={v_1bfbd0.zinc700} />
            <Text style={v_fd5f43.actionText}>{v_8d41d7("dashboard.actionCall")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={v_fd5f43.actionBtn}
            onPress={async () => {

              const v_8f7097 = encodeURIComponent(v_eb25ce.displayName ?? "");
              const v_f71b56 = `https://www.xrun.run/clone?id=${v_eb25ce.id}&name=${v_8f7097}`;
              const v_a8cd21 = v_8d41d7("dashboard.shareMessage", {
                name: v_eb25ce.displayName ?? "",
                url: v_f71b56,
                defaultValue: "{{name}} 클론과 대화해보세요!\n{{url}}",
              });
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

    <View style={v_fd5f43.screen} onLayout={v_e8db2a}>
    <SafeView backgroundColor={v_1bfbd0.white} showBottomBackground={false}>
      <PageHeader
        title={v_8d41d7("dashboard.title")}
        rightAction={

          <TouchableOpacity
            onPress={() =>
              v_f4c991.dispatch(
                v_650cfa.navigate({
                  name: "Main",
                  params: {
                    screen: "MyTab",
                    params: { screen: "MyHome" },
                  },
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
          <Text style={v_fd5f43.dashLoadingText}>{v_8d41d7("common.loading")}</Text>
        </View>
      ) : (
      <FlatList
        ref={v_9fd982}
        data={v_fc7f92}
        keyExtractor={(v_8c0b26) => String(v_8c0b26.id)}
        renderItem={v_b80d74}
        contentContainerStyle={[v_fd5f43.listContent, { paddingBottom: 24 + v_936ba7 }]}
        showsVerticalScrollIndicator={false}
        extraData={v_fc7f92}
        refreshControl={
          <RefreshControl
            refreshing={v_612e9f}
            onRefresh={() => v_8e46f5(true)}
            tintColor={v_1bfbd0.violet600}
            colors={[v_1bfbd0.violet600]}
          />
        }
        ListEmptyComponent={
          <View style={v_fd5f43.dashEmpty}>
            <View style={v_fd5f43.dashEmptyIconWrap}>
              <Feather name="user-plus" size={32} color={v_1bfbd0.zinc400} />
            </View>
            <Text style={v_fd5f43.dashEmptyTitle}>{v_8d41d7("dashboard.emptyTitle", { defaultValue: "나만의 클론을 만들어보세요" })}</Text>
            <Text style={v_fd5f43.dashEmptyDesc}>
              {v_8d41d7("dashboard.emptyDesc", { defaultValue: "아래 버튼을 눌러 첫 클론을 만들 수 있어요" })}
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
              <Text style={v_fd5f43.dashEmptyBtnText}>{v_8d41d7("home.createClone")}</Text>
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
                    {v_b113dd?.name ?? v_f38ee5?.displayName ?? v_8d41d7("my.userFallback")}
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
                      <Text style={v_fd5f43.profileStatLabel}>{v_8d41d7("dashboard.profileStatFollowers", { defaultValue: "팔로워" })}</Text>
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
                      <Text style={v_fd5f43.profileStatLabel}>{v_8d41d7("dashboard.profileStatFollowing", { defaultValue: "팔로잉" })}</Text>
                    </TouchableOpacity>
                    <View style={v_fd5f43.profileStatDivider} />
                    <TouchableOpacity
                      style={v_fd5f43.profileStatItem}
                      onPress={() => {

                        const v_44e218 = v_b113dd?.id;
                        if (!v_44e218) return;
                        v_f4c991.navigate("UserCloneList", {
                          userId: v_44e218,
                          userName: v_b113dd?.name ?? undefined,
                        });
                      }}
                    >
                      <Text style={v_fd5f43.profileStatValue}>{v_fc7f92.length}</Text>
                      <Text style={v_fd5f43.profileStatLabel}>{v_8d41d7("dashboard.profileStatClones", { defaultValue: "클론" })}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {}

            {}

            {
}

            {

}
            <View style={v_fd5f43.giftDashSection}>
              {}
              <View style={v_fd5f43.giftDashCard}>
                <View style={v_fd5f43.giftDashHeader}>
                  <View style={v_fd5f43.giftDashTitleRow}>
                    <Feather name="gift" size={18} color={v_1bfbd0.primary} />
                    <Text style={v_fd5f43.giftDashTitle}>
                      {v_8d41d7("giftBox.title", { defaultValue: "선물함" })}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={v_fd5f43.giftDashViewAllBtn}
                    onPress={() =>
                      v_c65f5d.navigate("GiftBox", { view: "activity", initialTab: "received" })
                    }
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}
                  >
                    <Text style={v_fd5f43.giftDashViewAll}>
                      {v_8d41d7("giftBox.viewAll", { defaultValue: "전체 보기" })}
                    </Text>
                    <Feather name="chevron-right" size={16} color={v_1bfbd0.zinc400} />
                  </TouchableOpacity>
                </View>
                <View style={v_fd5f43.giftDashMetrics}>
                  <TouchableOpacity
                    style={v_fd5f43.giftDashMetric}
                    activeOpacity={0.8}
                    onPress={() =>
                      v_c65f5d.navigate("GiftBox", { view: "activity", initialTab: "received" })
                    }
                  >
                    <Text style={v_fd5f43.giftDashMetricLabel} numberOfLines={1}>
                      {v_8d41d7("giftBox.tabReceived", { defaultValue: "받은 선물" })}
                    </Text>
                    <Text style={v_fd5f43.giftDashMetricValue}>{v_489044}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={v_fd5f43.giftDashMetric}
                    activeOpacity={0.8}
                    onPress={() =>
                      v_c65f5d.navigate("GiftBox", { view: "activity", initialTab: "sent" })
                    }
                  >
                    <Text style={v_fd5f43.giftDashMetricLabel} numberOfLines={1}>
                      {v_8d41d7("giftBox.tabSent", { defaultValue: "보낸 선물" })}
                    </Text>
                    <Text style={v_fd5f43.giftDashMetricValue}>{v_deb5c7}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {}
              <View style={[v_fd5f43.giftDashCard, v_fd5f43.giftDashCardOwned]}>
                <View style={v_fd5f43.giftDashHeader}>
                  <View style={v_fd5f43.giftDashTitleRow}>
                    <Feather name="package" size={18} color={v_1bfbd0.primary} />
                    <Text style={v_fd5f43.giftDashTitle}>
                      {v_8d41d7("giftBox.ownedCountTitle", { defaultValue: "보유 수량" })}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={v_fd5f43.giftDashViewAllBtn}
                    onPress={() => v_c65f5d.navigate("GiftBox", { view: "exchange" })}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}
                  >
                    <Text style={v_fd5f43.giftDashViewAll}>
                      {v_8d41d7("giftBox.historyView", { defaultValue: "내역 보기" })}
                    </Text>
                    <Feather name="chevron-right" size={16} color={v_1bfbd0.zinc400} />
                  </TouchableOpacity>
                </View>
                <View style={v_fd5f43.giftDashMetrics}>
                  <TouchableOpacity
                    style={v_fd5f43.giftDashMetric}
                    activeOpacity={0.8}
                    onPress={() => v_c65f5d.navigate("GiftBox", { view: "exchange" })}
                  >
                    <Text style={[v_fd5f43.giftDashMetricLabel, v_fd5f43.giftDashMetricLabelAccent]} numberOfLines={1}>
                      {v_8d41d7("giftBox.ownedCountLabel", { defaultValue: "보유 수량" })}
                    </Text>
                    <Text style={[v_fd5f43.giftDashMetricValue, v_fd5f43.giftDashMetricValueAccent]}>
                      {v_cfa43b}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={v_fd5f43.giftDashExchangeBtn}
                  activeOpacity={0.85}
                  onPress={() => v_b30c04(true)}
                >
                  <Text style={v_fd5f43.giftDashExchangeBtnText}>
                    {v_8d41d7("giftBox.exchangeAction", { defaultValue: "교환하기" })}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        }
        ListFooterComponent={
          <View>
            {v_959d04.length > 0 ? (
              <View style={v_fd5f43.systemClonesSection}>
                <Text style={v_fd5f43.systemClonesSectionTitle}>{v_8d41d7("dashboard.systemClonesTitle", { defaultValue: "통화 가능" })}</Text>
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
                        onPress={async () => {

                          const v_3ed4c3 = await v_84d546(v_2ca7e0, () => {
                            v_f4c991.dispatch(
                              v_650cfa.navigate({ name: "MyTab", params: { screen: "Purchase" } }),
                            );
                          });
                          if (!v_3ed4c3) return;
                          v_38f9da({ cloneId: v_69bba6.id, name: v_69bba6.name, source: "my-clones-shared" });
                          v_f4c991.navigate("Call", { cloneId: v_69bba6.id, name: v_69bba6.name });
                        }}
                      >
                        <Feather name="video" size={16} color={v_1bfbd0.zinc700} />
                        <Text style={v_fd5f43.actionText}>{v_8d41d7("dashboard.actionCall")}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        }
      />
      )}

      {}
      <Modal
        visible={!!v_ce3af0}
        transparent
        animationType="fade"
        onRequestClose={() => v_8d2d61(null)}
      >
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
      <Modal
        visible={!!v_16ef58}
        transparent
        animationType="fade"
        onRequestClose={() => v_3e0da5(null)}
      >
        <Pressable style={v_fd5f43.modalOverlay} onPress={() => v_3e0da5(null)}>
          <Pressable style={v_fd5f43.modalBox} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <Text style={v_fd5f43.modalTitle}>
              {v_16ef58?.currentState
                ? v_8d41d7("dashboard.toggleDeactivateTitle", { defaultValue: "클론 비활성화" })
                : v_8d41d7("dashboard.toggleActivateTitle", { defaultValue: "클론 활성화" })}
            </Text>
            <Text style={v_fd5f43.modalDesc}>
              {v_16ef58?.currentState
                ? v_8d41d7("dashboard.toggleDeactivateDesc", { defaultValue: "클론을 비활성화하시겠습니까? 비활성화 시 다른 사용자에게 노출되지 않습니다." })
                : v_8d41d7("dashboard.toggleActivateDesc", { defaultValue: "클론을 활성화하시겠습니까? 활성화 시 다른 사용자에게 노출됩니다." })}
            </Text>
            <View style={v_fd5f43.modalBtns}>
              <Button
                title={v_8d41d7("common.cancel")}
                variant="ghost"
                onPress={() => v_3e0da5(null)}
                style={v_fd5f43.modalBtnHalf}
              />
              <Button
                title={v_8d41d7("common.confirm")}
                variant="primary"
                onPress={v_a5c1a8}
                style={v_fd5f43.modalBtnHalf}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <VisibilityPickerModal
        visible={!!v_7462ec}
        currentVisibility={v_7462ec?.currentVisibility ?? null}
        onSelect={v_c9f992}
        onClose={() => v_2dbd8f(null)}
      />

      {}
      <FriendPickerModal
        visible={v_480a32 != null}
        initialSelected={v_e8d94c}
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
      <Modal
        visible={!!v_c9d3fa}
        transparent
        animationType="fade"
        onRequestClose={() => v_f32c49(null)}
      >
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
                title={v_8d41d7("common.cancel")}
                variant="ghost"
                onPress={() => v_f32c49(null)}
                style={v_fd5f43.modalBtnHalf}
              />
              <Button
                title={v_8d41d7("common.delete")}
                variant="danger"
                onPress={v_6ff8af}
                style={v_fd5f43.modalBtnHalf}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal
        visible={!!v_b10b7b}
        transparent
        animationType="fade"
        onRequestClose={() => v_b816d4(null)}
      >
        <Pressable style={v_fd5f43.modalOverlay} onPress={() => v_b816d4(null)}>
          <Pressable style={v_fd5f43.modalBox} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <Text style={v_fd5f43.modalTitle}>{v_8d41d7("common.notice")}</Text>
            <Text style={v_fd5f43.modalDesc}>{v_b10b7b}</Text>
            <Button
              title={v_8d41d7("common.confirm")}
              variant="primary"
              onPress={() => v_b816d4(null)}
              style={{ width: "100%" }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {

}

      {}

      {}
      <GiftExchangeSheet
        visible={v_0215b6}
        onClose={() => v_b30c04(false)}
        onChanged={v_fa991f}
        onGoHome={() => v_c65f5d.getParent()?.navigate("HomeTab" as never)}
      />

      {
}
      <Modal
        visible={v_9834f8}
        transparent
        animationType="none"
        onRequestClose={() => v_15fd53(false)}
      >
        <View style={v_fd5f43.giftLogModalOverlay}>
          <Pressable
            style={v_472849.absoluteFillObject}
            onPress={() => v_15fd53(false)}
          />
          <SwipeDownSheet
            onClose={() => v_15fd53(false)}
            handleZoneHeight={36}
            style={[v_fd5f43.giftLogSheet, { paddingBottom: 32 + v_2b650d }]}
          >
            <View style={v_fd5f43.sheetHandle} />
            <Text style={v_fd5f43.statsSheetTitle}>
              {v_8d41d7("dashboard.giftInventoryTitle", { defaultValue: "내선물" })}
            </Text>
            <Text style={v_fd5f43.giftLogSheetSub}>
              {v_8d41d7("dashboard.giftTotalReceivedBefore", {
                defaultValue: "총 받은 선물 ",
              })}
              <Text style={v_fd5f43.giftLogCardCountNum}>{v_489044}</Text>
              {v_8d41d7("dashboard.giftTotalReceivedAfter", { defaultValue: "개" })}
            </Text>
            <ScrollView
              style={v_fd5f43.giftLogSheetScroll}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {v_c9ba75.length === 0 ? (
                <View style={{ paddingVertical: 28, alignItems: "center" }}>
                  <Text style={v_fd5f43.giftLogEmptyText}>
                    {v_8d41d7("dashboard.emptyGift", { defaultValue: "아직 받은 선물이 없어요" })}
                  </Text>
                </View>
              ) : (
                <>
                  {v_c9ba75.slice(0, v_b1118a).map((v_206b88) => (
                    <GiftLogRow key={v_206b88.id} item={v_206b88} />
                  ))}
                  {v_b1118a < v_c9ba75.length && (
                    <TouchableOpacity
                      style={v_fd5f43.giftLogMoreBtn}
                      onPress={() =>
                        v_6edbbc((v_f4e98d) =>
                          Math.min(v_f4e98d + v_ebad5a, v_c9ba75.length),
                        )
                      }
                      activeOpacity={0.7}
                    >
                      <Text style={v_fd5f43.giftLogMoreText}>
                        {v_8d41d7("giftBox.loadMore", {
                          defaultValue: "더보기 ({{n}})",
                          n: v_c9ba75.length - v_b1118a,
                        })}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </ScrollView>
          </SwipeDownSheet>
        </View>
      </Modal>

      {}
      <Modal
        visible={!!v_8bb912}
        transparent
        animationType="none"
        onRequestClose={() => v_d5cd7b(null)}
      >
        <View style={v_fd5f43.modalOverlay}>
          <Pressable
            style={v_472849.absoluteFillObject}
            onPress={() => v_d5cd7b(null)}
          />
          <SwipeDownSheet
            onClose={() => v_d5cd7b(null)}
            style={[v_fd5f43.statsSheet, { paddingBottom: 32 + v_2b650d }]}
          >
            <View style={v_fd5f43.sheetHandle} />
            <Text style={v_fd5f43.statsSheetTitle}>
              {v_8bb912?.type === "likes" && v_8d41d7("dashboard.statsLikes", { defaultValue: "좋아요" })}
              {v_8bb912?.type === "interactions" && v_8d41d7("dashboard.statsInteractions", { defaultValue: "받은 선물" })}
              {v_8bb912?.type === "comments" && v_8d41d7("dashboard.statsComments", { defaultValue: "댓글" })}
              {v_8bb912?.type === "followers" && v_8d41d7("dashboard.statsFollowers", { defaultValue: "구독자" })}
            </Text>
            <Text style={v_fd5f43.statsSheetSub}>
              {v_8bb912?.cloneName}
            </Text>

            <ScrollView
              style={v_fd5f43.statsScrollArea}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {}
              {v_8bb912?.type === "comments" && (
                <>
                  {v_465030 ? (
                    <ActivityIndicator color={v_1bfbd0.zinc500} style={{ paddingVertical: 24 }} />
                  ) : !v_a9fce9 || v_a9fce9.length === 0 ? (
                    <View style={{ paddingVertical: 24, alignItems: "center" }}>
                      <Text style={{ color: v_1bfbd0.zinc500, fontSize: 13 }}>{v_8d41d7("feed.commentsEmpty")}</Text>
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
                          <Text style={v_fd5f43.commentTime}>{v_bfd883(v_c9a376.createdAt)}</Text>
                          <TouchableOpacity
                            onPress={() => {
                              v_d5cd7b(null);
                              v_b816d4(v_8d41d7("dashboard.reportReceived", { defaultValue: "신고가 접수됐어요" }));
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
                      <Text style={{ color: v_1bfbd0.zinc500, fontSize: 13 }}>{v_8d41d7("dashboard.emptyLikes", { defaultValue: "아직 좋아요가 없어요" })}</Text>
                    </View>
                  ) : (
                    v_067c32.map((v_ceb55a) => (
                      <View key={v_ceb55a.likeId} style={v_fd5f43.accountRow}>
                        {v_ceb55a.avatarUrl ? (
                          <Image source={{ uri: v_ceb55a.avatarUrl }} style={v_fd5f43.accountAvatar} />
                        ) : (
                          <View style={[v_fd5f43.accountAvatar, { backgroundColor: v_1bfbd0.zinc200, alignItems: "center", justifyContent: "center" }]}>
                            <Feather name="user" size={18} color={v_1bfbd0.zinc400} />
                          </View>
                        )}
                        <View style={v_fd5f43.accountInfo}>
                          <Text style={v_fd5f43.accountName}>{v_ceb55a.name ?? v_ceb55a.email}</Text>
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
                      <Text style={{ color: v_1bfbd0.zinc500, fontSize: 13 }}>{v_8d41d7("dashboard.emptyFollowers", { defaultValue: "아직 구독자가 없어요" })}</Text>
                    </View>
                  ) : (
                    v_e6e97a.map((v_ceb55a) => (
                      <View key={v_ceb55a.followId} style={v_fd5f43.accountRow}>
                        {v_ceb55a.avatarUrl ? (
                          <Image source={{ uri: v_ceb55a.avatarUrl }} style={v_fd5f43.accountAvatar} />
                        ) : (
                          <View style={[v_fd5f43.accountAvatar, { backgroundColor: v_1bfbd0.zinc200, alignItems: "center", justifyContent: "center" }]}>
                            <Feather name="user" size={18} color={v_1bfbd0.zinc400} />
                          </View>
                        )}
                        <View style={v_fd5f43.accountInfo}>
                          <Text style={v_fd5f43.accountName}>{v_ceb55a.name ?? v_ceb55a.email}</Text>
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
                    {v_8d41d7("dashboard.emptyInteractions", { defaultValue: "상호작용 상세 목록은 준비 중이에요" })}
                  </Text>
                </View>
              )}
            </ScrollView>
          </SwipeDownSheet>
        </View>
      </Modal>

      {
}
      <Modal
        visible={!!v_d3a183}
        transparent
        animationType="none"
        onRequestClose={() => v_598141(null)}
      >
        <View style={v_fd5f43.modalOverlay}>
          <Pressable
            style={v_472849.absoluteFillObject}
            onPress={() => v_598141(null)}
          />
          <SwipeDownSheet
            onClose={() => v_598141(null)}
            style={[v_fd5f43.statsSheet, { paddingBottom: 32 + v_2b650d }]}
          >
            <View style={v_fd5f43.sheetHandle} />
            <View style={v_fd5f43.intimacyTitleRow}>
              <View style={{ width: 28 }} />
              <Text style={v_fd5f43.statsSheetTitle}>{v_8d41d7("dashboard.giftReceivedTitle", { defaultValue: "받은 선물" })}</Text>
              <View style={{ width: 28 }} />
            </View>
            <Text style={v_fd5f43.statsSheetSub}>{v_d3a183?.cloneName}</Text>

            {}
            <View style={v_fd5f43.giftTableHeader}>
              <Text style={[v_fd5f43.giftTableHeaderCell, { flex: 2 }]}>{v_8d41d7("dashboard.giftHeaderGift", { defaultValue: "선물" })}</Text>
              <Text style={[v_fd5f43.giftTableHeaderCell, { flex: 1, textAlign: "center" }]}>{v_8d41d7("dashboard.giftHeaderCount", { defaultValue: "갯수" })}</Text>
              <Text style={[v_fd5f43.giftTableHeaderCell, { flex: 2, textAlign: "right" }]}>{v_8d41d7("dashboard.giftHeaderSender", { defaultValue: "보낸사람" })}</Text>
            </View>

            <ScrollView
              style={v_fd5f43.statsScrollArea}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {v_5101de ? (
                <ActivityIndicator color={v_1bfbd0.zinc500} style={{ paddingVertical: 24 }} />
              ) : !v_51c9ac || v_51c9ac.length === 0 ? (
                <View style={{ paddingVertical: 24, alignItems: "center" }}>
                  <Text style={{ color: v_1bfbd0.zinc500, fontSize: 13 }}>
                    {v_8d41d7("dashboard.emptyGift", { defaultValue: "아직 받은 선물이 없어요" })}
                  </Text>
                </View>
              ) : (
                v_51c9ac.map((v_8c0b26, v_e86ad8) => {
                  const v_52a5a5 = v_bed6ed.find((v_206b88) => v_206b88.id === v_8c0b26.giftId);
                  const v_03a50c = v_52a5a5?.emoji ?? "🎁";
                  return (
                    <View key={`${v_8c0b26.giftId}-${v_8c0b26.sender}-${v_e86ad8}`} style={v_fd5f43.giftTableRow}>
                      <View style={[{ flex: 2, flexDirection: "row", alignItems: "center", gap: 6 }]}>
                        <Text style={{ fontSize: 18 }}>{v_03a50c}</Text>
                        <Text style={v_fd5f43.giftTableCell}>{v_561bb6(v_8c0b26.giftName, v_8c0b26.giftId)}</Text>
                      </View>
                      <Text style={[v_fd5f43.giftTableCell, { flex: 1, textAlign: "center" }]}>
                        {v_8c0b26.count}
                      </Text>
                      <Text style={[v_fd5f43.giftTableCell, { flex: 2, textAlign: "right" }]} numberOfLines={1}>
                        {v_8c0b26.sender}
                      </Text>
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
        visible={v_eaf85e}
        transparent
        animationType="fade"
        onRequestClose={() => v_aff30f(false)}
      >
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
    </SafeView>

    {}
    <PartnerAppBanners variant="docked" style={v_db1b12} />
    </View>
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
  { id: "c2", name: "이서연", avatar: "https://i.pravatar.cc/100?img=5", text: "이 클론 대화 퀄리티가 진짜 좋네요", time: "5시간 전" },
  { id: "c3", name: "박지훈", avatar: "https://i.pravatar.cc/100?img=3", text: "위로가 되는 말씀 감사해요 ㅠㅠ", time: "어제" },
  { id: "c4", name: "최유진", avatar: "https://i.pravatar.cc/100?img=9", text: "매일 대화하고 있어요 추천합니다!", time: "2일 전" },
  { id: "c5", name: "정하은", avatar: "https://i.pravatar.cc/100?img=10", text: "목소리도 자연스럽고 너무 좋아요", time: "3일 전" },
];

const v_fd5f43 = v_472849.create({

  giftInventorySection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  giftInventoryTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: v_1bfbd0.zinc500,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  giftInventoryRow: { gap: 12, paddingRight: 8 },
  giftInventoryItem: {
    width: 72,
    alignItems: "center",
    gap: 4,
  },
  giftInventoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: v_1bfbd0.zinc100,
  },
  giftInventoryName: {
    fontSize: 11,
    color: v_1bfbd0.zinc700,
    textAlign: "center",
    maxWidth: 72,
  },
  giftInventoryCount: {
    fontSize: 12,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
  },
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
  dashEmptyBtnText: { ...v_c10a43.md, color: v_1bfbd0.white },

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

  balanceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: v_1bfbd0.violet100,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  balanceLabel: { fontSize: 12, color: v_1bfbd0.zinc600, marginBottom: 4 },
  balanceTotal: { fontSize: 22, fontWeight: "700", color: v_1bfbd0.violet700 },
  balanceBreakdown: { fontSize: 12, color: v_1bfbd0.zinc600, marginTop: 4 },
  balanceEmpty: { fontSize: 13, color: v_1bfbd0.zinc500, marginTop: 6 },
  balanceCta: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: v_1bfbd0.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  balanceCtaText: { ...v_c10a43.sm, color: "#fff" },

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
  chargeCancelText: { ...v_119e65.md, color: v_1bfbd0.zinc700 },
  chargeGoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: v_8b0c90.md,
    backgroundColor: v_1bfbd0.primary,
  },
  chargeGoText: { ...v_c10a43.md, color: v_1bfbd0.white },

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
    ...v_d43669.sm,
    backgroundColor: v_1bfbd0.zinc100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionText: { ...v_119e65.sm, color: v_1bfbd0.zinc700 },

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
    ...v_d43669.md,
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
    ...v_119e65.md,
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
  inviteBtnText: { ...v_c10a43.sm, color: v_1bfbd0.white },
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

  giftTableHeader: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc200,
    marginBottom: 2,
  },
  giftTableHeaderCell: {
    fontSize: 12,
    fontWeight: "600",
    color: v_1bfbd0.zinc500,
  },
  giftTableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: v_472849.hairlineWidth,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  giftTableCell: {
    fontSize: 14,
    color: v_1bfbd0.zinc900,
  },

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
  intimacyInfoOkBtn: { marginTop: 16, paddingVertical: 12, borderRadius: v_8b0c90.full, backgroundColor: v_1bfbd0.primary, alignItems: "center" },
  intimacyInfoOkText: { fontSize: 14, fontWeight: "700", color: v_1bfbd0.white },

  screen: { flex: 1 },

  giftDashSection: { marginTop: 16, marginBottom: 16, paddingHorizontal: 4, gap: 12 },
  giftDashCard: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    padding: 16,
  },

  giftDashCardOwned: {},
  giftDashHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  giftDashTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  giftDashTitle: { fontSize: 16, fontWeight: "700", color: v_1bfbd0.zinc900 },
  giftDashViewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  giftDashViewAll: { fontSize: 13, color: v_1bfbd0.zinc500 },

  giftDashMetrics: { marginBottom: 14 },
  giftDashMetric: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  giftDashMetricLabel: { flex: 1, fontSize: 14, color: v_1bfbd0.zinc600 },
  giftDashMetricLabelAccent: { color: v_1bfbd0.primary },

  giftDashMetricValue: {
    fontSize: 15,
    color: v_1bfbd0.zinc900,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
    marginLeft: 12,
  },
  giftDashMetricValueAccent: { color: v_1bfbd0.primary },
  giftDashExchangeBtn: {
    ...v_d43669.md,
    backgroundColor: v_1bfbd0.zinc900,
    alignItems: "center",
    justifyContent: "center",
  },
  giftDashExchangeBtnText: { ...v_c10a43.md, color: v_1bfbd0.white },

  giftLogSection: { marginTop: 16, marginBottom: 16, paddingHorizontal: 4 },
  giftLogCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  giftLogCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: v_1bfbd0.zinc50 ?? v_1bfbd0.zinc100,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 56,
  },
  giftLogCardIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: v_1bfbd0.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  giftLogCardBody: { flex: 1, minWidth: 0 },
  giftLogCardLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: v_1bfbd0.zinc500,
    marginBottom: 2,
  },
  giftLogCardCount: {
    fontSize: 14,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
  },
  giftLogCardCountNum: {
    fontSize: 14,
    fontWeight: "700",
    color: v_a9d3e9,
  },
  giftLogSheetSub: {
    fontSize: 13,
    fontWeight: "600",
    color: v_1bfbd0.zinc900,
    marginBottom: 16,
  },
  giftLogEmptyText: {
    fontSize: 13,
    color: v_1bfbd0.zinc500,
    textAlign: "center",
  },

  giftLogExchangeBtn: {
    minWidth: 72,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: v_1bfbd0.primary,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  giftLogExchangeText: { ...v_c10a43.md, color: v_1bfbd0.white },
  giftLogModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  giftLogSheet: {
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    height: "80%",
    width: "100%",
  },
  giftLogSheetScroll: {
    flex: 1,
  },
  giftLogKindIcon: { fontSize: 16, fontWeight: "700" },
  giftLogKindLabel: { fontSize: 12, fontWeight: "700" },
  giftLogRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: v_1bfbd0.white,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc100,
    gap: 10,
  },
  giftLogLeftPanel: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  giftLogAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: v_1bfbd0.zinc100,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  giftLogAvatarImg: { width: 40, height: 40, borderRadius: 20 },
  giftLogAvatarInitial: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.zinc500 },
  giftLogBody: { flex: 1, minWidth: 0 },
  giftLogSenderLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  giftLogSenderName: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900, flexShrink: 1 },
  giftLogGiftIcon: { fontSize: 14 },
  giftLogMeta: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  giftLogSwapBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: v_1bfbd0.primary,
  },
  giftLogSwapText: { ...v_c10a43.sm, color: v_1bfbd0.white },
  giftLogMoreBtn: {
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 4,
  },
  giftLogMoreText: { ...v_119e65.sm, color: v_1bfbd0.zinc900 },
});

async function v_623a74(v_78547c, v_8d41d7) {
  const v_e0c7e8 = v_78547c ?? "";
  const v_6045c3 = `xrun://login?email=${encodeURIComponent(v_e0c7e8)}`;
  console.log(`[openXrunApp] myEmail=${JSON.stringify(v_78547c)} try deepLink=${v_6045c3}`);
  try {
    await v_f2c756.openURL(v_6045c3);
    console.log(`[openXrunApp] openURL done (xrun scheme)`);
    return;
  } catch (v_49263d) {
    console.log(`[openXrunApp] xrun:// failed (likely not installed): ${(v_49263d as Error).message}`);
  }
  const v_b71a74 =
    v_326be8.OS === "ios"
      ? "https://apps.apple.com/app/xrun/id6471024515"
      : `https://play.google.com/store/apps/details?id=run.xrun.xrunapp&referrer=${encodeURIComponent(
          `utm_source=afterlife_login&utm_content=${v_e0c7e8}`,
        )}`;
  console.log(`[openXrunApp] fallback storeUrl=${v_b71a74}`);
  try {
    await v_f2c756.openURL(v_b71a74);
  } catch (v_49263d) {
    v_03e392.alert(
      v_8d41d7("dashboard.giftLogOpenFailTitle", { defaultValue: "열 수 없어요" }),
      v_8d41d7("dashboard.giftLogOpenFailDesc", { defaultValue: "XRUN 앱을 설치해 주세요." }),
    );
  }
}

function v_550317(kind: v_69ac34, v_8d41d7): { icon: string; label: string; color: string } {
  switch (v_94302c) {
    case "received":
    case "ad_reward":
      return { icon: "↓", label: v_8d41d7("dashboard.giftKindReceived", { defaultValue: "받음" }), color: "#22c55e" };
    case "sent":
      return { icon: "↑", label: v_8d41d7("dashboard.giftKindSent", { defaultValue: "보냄" }), color: "#f59e0b" };
    case "exchanged":
      return { icon: "⇄", label: v_8d41d7("dashboard.giftKindExchanged", { defaultValue: "교환" }), color: "#3b82f6" };
    default:
      return { icon: "·", label: v_94302c, color: v_1bfbd0.zinc500 };
  }
}

function v_3582ab({ item: v_8c0b26 }: { item: v_407a6d }) {
  const { t: v_8d41d7 } = v_772971();
  const v_526c36 =
    v_8c0b26.counterpartName || v_8c0b26.counterpartEmail || (v_8c0b26.counterpartId ? `user_${v_8c0b26.counterpartId}` : "");
  const v_90e7ec = v_550317(v_8c0b26.kind, v_8d41d7);
  const v_8d37ae = v_bfd883(v_8c0b26.createdAt);
  const v_468545 = [];
  if (v_8c0b26.cloneName) v_468545.push(`${v_8c0b26.cloneName}`);
  if (v_526c36) v_468545.push(v_526c36);
  v_468545.push(v_8d37ae);
  const v_33a948 = v_468545.join(" · ");

  return (
    <View style={v_fd5f43.giftLogRow}>
      <View style={v_fd5f43.giftLogAvatar}>
        {v_8c0b26.counterpartAvatarUrl ? (
          <Image source={{ uri: v_8c0b26.counterpartAvatarUrl }} style={v_fd5f43.giftLogAvatarImg} />
        ) : (
          <Text style={v_fd5f43.giftLogAvatarInitial}>
            {(v_526c36.charAt(0) || "?").toUpperCase()}
          </Text>
        )}
      </View>
      <View style={v_fd5f43.giftLogBody}>
        <View style={v_fd5f43.giftLogSenderLine}>
          <Text style={[v_fd5f43.giftLogKindIcon, { color: v_90e7ec.color }]}>{v_90e7ec.icon}</Text>
          <Text style={[v_fd5f43.giftLogKindLabel, { color: v_90e7ec.color }]}>{v_90e7ec.label}</Text>
          <Text style={v_fd5f43.giftLogGiftIcon}>{v_8c0b26.giftEmoji}</Text>
          <Text style={v_fd5f43.giftLogSenderName} numberOfLines={1}>{v_561bb6(v_8c0b26.giftName)}</Text>
        </View>
        <Text style={v_fd5f43.giftLogMeta} numberOfLines={1}>{v_33a948}</Text>
      </View>
    </View>
  );
}
