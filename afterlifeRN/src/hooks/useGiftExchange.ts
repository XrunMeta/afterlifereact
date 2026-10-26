

import { v_de06a3, v_c4deb2, v_e662ae, v_5ab095 } from "bapkr";
import { v_772971 } from "jmpfvteuuztnp";
import { v_1ed7d9 } from "../stores/authStore";
import { v_889fad } from "../stores/dialogStore";
import { v_77a9ad } from "../utils/openXrunApp";
import {
  v_a56ba0,
  v_9c3304,
  v_541c70,
  v_c55c0b,
  v_6f0728,
  type v_02ed3c,
  type v_867a79,
} from "../api/giftInventory";

interface Options {

  onChanged?: () => void;

  beforeConfirm?: () => void;

  skipConfirm?: boolean;

  beforeResult?: () => void;
}

export function v_61fb8c({ onChanged: v_37c9f5, beforeConfirm: v_28a965, skipConfirm: v_f347b1, beforeResult: v_ee7fc8 }: Options = {}) {
  const { t: v_8d41d7 } = v_772971();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_f3b147 = v_e662ae(v_37c9f5);
  v_f3b147.current = v_37c9f5;
  const v_f5d26a = v_e662ae(v_28a965);
  v_f5d26a.current = v_28a965;
  const v_9e39c4 = v_e662ae(v_ee7fc8);
  v_9e39c4.current = v_ee7fc8;

  const [v_ae840d, v_95c431] = v_5ab095<v_02ed3c | null>(null);
  const [v_b085c3, v_6c4550] = v_5ab095<v_867a79[]>([]);
  const [v_eddb49, v_839e4f] = v_5ab095(0);
  const [v_cb66b4, v_ee9ec1] = v_5ab095(false);
  const [v_da74fa, v_e45a9a] = v_5ab095<string | null>(null);
  const v_134403 = v_e662ae<ReturnType<typeof setTimeout> | null>(null);
  const v_cba33f = v_de06a3((v_badeaf) => {
    v_e45a9a(v_badeaf);
    if (v_134403.current) clearTimeout(v_134403.current);
    v_134403.current = setTimeout(() => v_e45a9a(null), 2200);
  }, []);
  v_c4deb2(() => () => {
    if (v_134403.current) clearTimeout(v_134403.current);
  }, []);

  const v_308dd7 = v_de06a3(async () => {
    if (!v_2ca7e0) return null;
    const [v_9e86fd, v_65a2cd] = await Promise.allSettled([
      v_a56ba0(v_2ca7e0),
      v_9c3304(v_2ca7e0),
    ]);
    if (v_65a2cd.status === "fulfilled") v_6c4550(v_65a2cd.value.items);
    if (v_9e86fd.status === "fulfilled") {
      v_95c431(v_9e86fd.value);
      return v_9e86fd.value;
    }
    console.warn("[GiftBox] exchange eligibility fail:", v_9e86fd.reason);
    return null;
  }, [v_2ca7e0]);

  const v_2900f3 = Math.max(1, v_ae840d?.feeUnit ?? 10);
  const v_ea7b1e = v_ae840d
    ? Math.max(v_ae840d.minQty, Math.floor(v_ae840d.exchangeableQty / v_2900f3) * v_2900f3)
    : 0;

  v_c4deb2(() => {
    if (!v_ae840d) return;
    v_839e4f((v_ab6401) => {
      if (v_ae840d.exchangeableQty < v_ae840d.minQty || v_ab6401 < v_ae840d.minQty) return v_ae840d.minQty;
      return Math.max(v_ae840d.minQty, Math.min(Math.floor(v_ab6401 / v_2900f3) * v_2900f3, v_ea7b1e));
    });
  }, [v_ae840d, v_2900f3, v_ea7b1e]);

  const v_b54070 = () => {
    if (!v_ae840d) return;
    if (v_eddb49 - v_2900f3 < v_ae840d.minQty) {
      v_cba33f(
        v_8d41d7("giftBox.toastBelowMin", {
          defaultValue: "{{min}}송이부터 교환할 수 있어요 (수수료 {{unit}}송이당 {{fee}}송이 별도)",
          min: v_ae840d.minQty,
          unit: v_ae840d.feeUnit,
          fee: v_ae840d.feeQty,
        }),
      );
      return;
    }
    v_839e4f((v_ab6401) => v_ab6401 - v_2900f3);
  };
  const v_869bef = () => {
    if (!v_ae840d) return;
    if (v_eddb49 + v_2900f3 > v_ea7b1e) {
      v_cba33f(
        v_8d41d7("giftBox.toastOverMax", {
          defaultValue: "수수료({{unit}}송이당 {{fee}}송이)를 빼고 최대 {{max}}송이까지 교환할 수 있어요",
          unit: v_ae840d.feeUnit,
          fee: v_ae840d.feeQty,
          max: v_ea7b1e,
        }),
      );
      return;
    }
    v_839e4f((v_ab6401) => v_ab6401 + v_2900f3);
  };

  const v_b5de70 = (v_35f85c) => {
    const v_85cf93 = (v_d799e2) => {
      const v_d5dda0 = new Date(v_d799e2);
      return v_8d41d7("giftBox.monthDayTime", {
        defaultValue: "{{m}}월 {{d}}일 {{hh}}:{{mm}}",
        m: v_d5dda0.getMonth() + 1,
        d: v_d5dda0.getDate(),
        hh: String(v_d5dda0.getHours()).padStart(2, "0"),
        mm: String(v_d5dda0.getMinutes()).padStart(2, "0"),
      });
    };
    const v_4f2c9c = v_35f85c && v_35f85c.from > 0 && v_35f85c.to > v_35f85c.from ? `${v_85cf93(v_35f85c.from)}~${v_85cf93(v_35f85c.to).split(" ").pop()}` : "";
    v_889fad(
      v_8d41d7("giftBox.p8Title", { defaultValue: "교환 서비스 점검 중이에요" }),
      v_35f85c?.message
        ?? (v_4f2c9c
          ? v_8d41d7("giftBox.p8BodyRange", { defaultValue: "{{range}} 동안은 교환할 수 없어요.", range: v_4f2c9c })
          : v_8d41d7("giftBox.p8BodySoon", { defaultValue: "잠시 후 다시 시도해주세요." })),
      [{ text: v_8d41d7("common.confirm", { defaultValue: "확인" }) }],
    );
  };

  const v_9bfa1b = async (cur: v_02ed3c, v_d016c9) => {
    if (!v_2ca7e0 || !v_c3bc75.giftId) return;

    const v_b24339 = `ex-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    v_ee9ec1(true);
    try {
      const v_8f00b9 = await v_541c70(v_2ca7e0, { giftId: v_c3bc75.giftId, qty: v_d016c9, rateVersion: v_c3bc75.rateVersion }, v_b24339);
      v_9e39c4.current?.();
      v_f3b147.current?.();
      v_889fad(
        v_8d41d7("giftBox.p4Title", { defaultValue: "교환이 완료되었어요" }),
        v_8d41d7("giftBox.p4Body", {
          defaultValue: "{{name}} {{qty}}송이가 {{reward}} XRUN으로 교환되었어요. XRUN 지갑 > 에프터라이프에서 보상을 받아가세요.",
          name: v_8f00b9.giftName,
          qty: v_8f00b9.qty,
          reward: v_8f00b9.reward,
        }),
        [
          { text: v_8d41d7("common.close", { defaultValue: "닫기" }), style: "cancel" },
          { text: v_8d41d7("giftBox.p4Receive", { defaultValue: "XRUN에서 받기" }), onPress: () => void v_77a9ad(v_c3bc75.xrunMemberId ?? v_1ed7d9.getState().apiUser?.xrunMemberId, v_1ed7d9.getState().apiUser?.email) },
        ],
      );
    } catch (v_49263d) {
      v_9e39c4.current?.();
      const v_9e86fd = v_49263d as { code?: string; message?: string; details?: Record<string, unknown> };
      const v_d5dda0 = (v_9e86fd.details ?? {}) as Record<string, any>;
      if (v_9e86fd.code === "INSUFFICIENT_QTY") {
        v_889fad(
          v_8d41d7("giftBox.p7Title", { defaultValue: "보유 수량이 바뀌었어요" }),
          v_8d41d7("giftBox.p7Body", {
            defaultValue: "지금 보유한 {{name}}는 {{owned}}송이예요. 수량을 다시 입력해주세요.",
            name: v_c3bc75.giftName,
            owned: v_d5dda0.ownedQty ?? 0,
          }),
          [{ text: v_8d41d7("common.confirm", { defaultValue: "확인" }) }],
        );
        v_f3b147.current?.();
      } else if (v_9e86fd.code === "BELOW_MIN_QTY") {
        v_cba33f(v_9e86fd.message ?? "");
      } else if (v_9e86fd.code === "RATE_CHANGED") {
        const v_3871e2 = await v_308dd7();
        const v_ab6401 = Math.max(Number(v_d5dda0.minQty ?? v_3871e2?.minQty ?? v_d016c9), v_d016c9);
        const v_2d815e = v_6f0728(v_3871e2 ?? v_c3bc75, v_ab6401);
        const v_36c043 = v_3871e2 ? v_c55c0b(v_3871e2.priceSegments, v_ab6401) : 0;
        v_889fad(
          v_8d41d7("giftBox.p9Title", { defaultValue: "교환 조건이 바뀌었어요" }),
          v_8d41d7("giftBox.p9Body", {
            defaultValue: "바뀐 조건으로 다시 확인해주세요. {{qty}}송이 → {{reward}} XRUN, 수수료 {{fee}}송이",
            qty: v_ab6401,
            reward: v_36c043,
            fee: v_2d815e,
          }),
          [
            { text: v_8d41d7("common.cancel", { defaultValue: "취소" }), style: "cancel" },
            { text: v_8d41d7("giftBox.p9Retry", { defaultValue: "다시 확인" }), onPress: () => v_3871e2 && v_609f35(v_3871e2, v_ab6401) },
          ],
        );
      } else if (v_9e86fd.code === "MAINTENANCE") {
        v_b5de70(v_d5dda0.maintenance as any);
      } else if (v_9e86fd.code === "DUPLICATE_REQUEST") {
        v_cba33f(v_8d41d7("giftBox.toastDuplicate", { defaultValue: "이미 교환을 처리하고 있어요" }));
        v_f3b147.current?.();
      } else if (v_9e86fd.code === "ACCOUNT_RESTRICTED" || v_9e86fd.code === "XRUN_NOT_LINKED") {
        v_889fad(
          v_8d41d7("giftBox.p10Title", { defaultValue: "교환할 수 없는 계정이에요" }),
          v_8d41d7("giftBox.p10Body", { defaultValue: "XRUN 계정 상태를 확인해주세요. 궁금한 점은 고객센터로 문의해주세요." }),
          [{ text: v_8d41d7("common.confirm", { defaultValue: "확인" }) }],
        );
      } else if (v_9e86fd.code) {

        v_889fad(
          v_8d41d7("giftBox.p6Title", { defaultValue: "교환하지 못했어요" }),
          v_d5dda0.exchangeNo
            ? v_8d41d7("giftBox.p6BodyWithNo", {
                defaultValue: "잠시 후 다시 시도해주세요. 선물은 차감되지 않았어요. (교환번호 {{no}})",
                no: v_d5dda0.exchangeNo,
              })
            : v_8d41d7("giftBox.p6Body", {
                defaultValue: "잠시 후 다시 시도해주세요. 선물은 차감되지 않았어요.",
              }),
          [{ text: v_8d41d7("common.confirm", { defaultValue: "확인" }) }],
        );
        v_f3b147.current?.();
      } else {

        v_889fad(
          v_8d41d7("giftBox.p6NetTitle", { defaultValue: "교환 결과를 확인하고 있어요" }),
          v_8d41d7("giftBox.p6NetBody", { defaultValue: "네트워크가 불안정해요. 잠시 후 교환 내역에서 결과를 확인해주세요." }),
          [{ text: v_8d41d7("common.confirm", { defaultValue: "확인" }) }],
        );
        v_f3b147.current?.();
      }
    } finally {
      v_ee9ec1(false);
    }
  };

  const v_609f35 = (cur: v_02ed3c, v_d016c9) => {
    const v_2d815e = v_6f0728(v_c3bc75, v_d016c9);
    const v_36c043 = v_c55c0b(v_c3bc75.priceSegments, v_d016c9);
    v_889fad(
      v_8d41d7("giftBox.p1Title", {
        defaultValue: "{{name}} {{qty}}송이를 교환할까요?",
        name: v_c3bc75.giftName,
        qty: v_d016c9,
      }),
      v_8d41d7("giftBox.p1Body", {
        defaultValue: "수수료 {{fee}}송이를 포함해 {{total}}송이가 차감되고, {{reward}} XRUN을 받을 수 있어요. 교환 후에는 취소할 수 없어요.",
        fee: v_2d815e,
        total: v_d016c9 + v_2d815e,
        reward: v_36c043,
      }),
      [
        { text: v_8d41d7("common.cancel", { defaultValue: "취소" }), style: "cancel" },
        { text: v_8d41d7("giftBox.exchangeAction", { defaultValue: "교환하기" }), onPress: () => void v_9bfa1b(v_c3bc75, v_d016c9) },
      ],
    );
  };

  const v_d037c4 = async () => {
    if (v_cb66b4) {
      v_cba33f(v_8d41d7("giftBox.toastDuplicate", { defaultValue: "이미 교환을 처리하고 있어요" }));
      return;
    }
    if (!v_ae840d) return;
    if (!v_eddb49) {
      v_cba33f(v_8d41d7("giftBox.toastEmptyQty", { defaultValue: "교환할 수량을 입력해주세요" }));
      return;
    }

    v_ee9ec1(true);
    const v_3871e2 = await v_308dd7().finally(() => v_ee9ec1(false));
    const v_c3bc75 = v_3871e2 ?? v_ae840d;
    if (v_c3bc75.maintenance || !v_c3bc75.enabled) return v_b5de70(v_c3bc75.maintenance);
    if (v_eddb49 < v_c3bc75.minQty) {
      v_cba33f(v_8d41d7("giftBox.toastBelowMin", {
        defaultValue: "{{min}}송이부터 교환할 수 있어요 (수수료 {{unit}}송이당 {{fee}}송이 별도)",
        min: v_c3bc75.minQty,
        unit: v_c3bc75.feeUnit,
        fee: v_c3bc75.feeQty,
      }));
      return;
    }
    if (v_eddb49 > v_c3bc75.exchangeableQty) {
      v_889fad(
        v_8d41d7("giftBox.p7Title", { defaultValue: "보유 수량이 바뀌었어요" }),
        v_8d41d7("giftBox.p7Body", {
          defaultValue: "지금 보유한 {{name}}는 {{owned}}송이예요. 수량을 다시 입력해주세요.",
          name: v_c3bc75.giftName,
          owned: v_c3bc75.ownedQty,
        }),
        [{ text: v_8d41d7("common.confirm", { defaultValue: "확인" }) }],
      );
      return;
    }
    if (v_f347b1) {
      void v_9bfa1b(v_c3bc75, v_eddb49);
      return;
    }
    v_f5d26a.current?.();
    v_609f35(v_c3bc75, v_eddb49);
  };

  const v_3f5aa8 = (v_479f05) => {
    if (!v_ae840d) return;
    const v_f4e98d = Number(v_479f05.replace(/D/g, ""));
    if (!v_f4e98d) {
      v_cba33f(v_8d41d7("giftBox.toastEmptyQty", { defaultValue: "교환할 수량을 입력해주세요" }));
      v_839e4f(v_ae840d.minQty);
      return;
    }
    if (v_f4e98d < v_ae840d.minQty) {
      v_cba33f(v_8d41d7("giftBox.toastBelowMin", {
        defaultValue: "{{min}}송이부터 교환할 수 있어요 (수수료 {{unit}}송이당 {{fee}}송이 별도)",
        min: v_ae840d.minQty, unit: v_ae840d.feeUnit, fee: v_ae840d.feeQty,
      }));
      v_839e4f(v_ae840d.minQty);
      return;
    }
    if (v_f4e98d > v_ea7b1e) {
      v_cba33f(v_8d41d7("giftBox.toastOverMax", {
        defaultValue: "수수료({{unit}}송이당 {{fee}}송이)를 빼고 최대 {{max}}송이까지 교환할 수 있어요",
        unit: v_ae840d.feeUnit, fee: v_ae840d.feeQty, max: v_ea7b1e,
      }));
      v_839e4f(v_ea7b1e);
      return;
    }
    const v_0bc8a5 = Math.max(v_ae840d.minQty, Math.floor(v_f4e98d / v_2900f3) * v_2900f3);
    if (v_0bc8a5 !== v_f4e98d) {
      v_cba33f(v_8d41d7("giftBox.toastSnapped", {
        defaultValue: "{{step}}송이 단위로 교환할 수 있어요 ({{qty}}송이로 맞췄어요)",
        step: v_2900f3, qty: v_0bc8a5,
      }));
    }
    v_839e4f(v_0bc8a5);
  };

  return {
    elig: v_ae840d,
    exHistory: v_b085c3,
    exchangeQty: v_eddb49,
    setExchangeQty: v_839e4f,
    exchangeStep: v_2900f3,
    exchangeMax: v_ea7b1e,
    submitting: v_cb66b4,
    toast: v_da74fa,
    showToast: v_cba33f,
    loadExchange: v_308dd7,
    onExchangeDec: v_b54070,
    onExchangeInc: v_869bef,
    commitTypedQty: v_3f5aa8,
    onExchangeSubmit: v_d037c4,
  };
}
