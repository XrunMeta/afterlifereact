

import v_a3453e, { v_c4deb2, v_e662ae, v_5ab095 } from "bapkr";
import {
  v_39a996,
  v_cf9c33,
  v_0e1f26,
  v_aa7413,
  v_326be8,
  v_09d0e5,
  v_122070,
  v_472849,
  v_19b633,
  v_79c4f2,
  v_4623af,
  v_3094a2,
  v_e45a99,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_c18c22 } from "svuoaeceudfxfjvvpmmmchnwljywbphjgb";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_75de9d } from "zqqvxke";
import { v_1bfbd0, v_8b0c90 } from "../constants";
import { v_889fad } from "../../stores/dialogStore";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_61fb8c } from "../../hooks/useGiftExchange";
import {
  v_6f0728,
  v_c55c0b,
  type v_02ed3c,
  type v_867a79,
} from "../../api/giftInventory";
import { v_77a9ad } from "../../utils/openXrunApp";

const v_1dee60 = require("../../../assets/images/rose-icon.png");
const v_dae506 = require("../../../assets/images/xrun-round.png");

interface Props {
  visible: boolean;
  onClose: () => void;

  onChanged?: () => void;

  onGoHome?: () => void;
}

type Phase = "form" | "success";

export default function v_177da7({ visible: v_cf55be, onClose: v_0890f8, onChanged: v_37c9f5, onGoHome: v_227c69 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const v_033e14 = v_e0068c();
  const v_f9771e = v_c18c22(0);
  const { height: v_98130e } = v_e45a99();

  const [v_7e4acc, v_de86c2] = v_5ab095(0);
  const [v_ab4803, v_ae4844] = v_5ab095<Phase>("form");
  const [v_593e63, v_55e005] = v_5ab095<{
    res: v_867a79;
    elig: v_02ed3c;
  } | null>(null);

  const {
    elig: v_ae840d,
    exchangeQty: v_eddb49,
    exchangeMax: v_ea7b1e,
    submitting: v_cb66b4,
    toast: v_da74fa,
    loadExchange: v_308dd7,
    commitTypedQty: v_3f5aa8,
    setExchangeQty: v_839e4f,
    onExchangeSubmit: v_d037c4,
  } = v_61fb8c({
    onChanged: v_37c9f5,
    skipConfirm: true,
    onSuccess: (v_8f00b9, v_c3bc75) => {
      v_55e005({ res: v_8f00b9, elig: v_c3bc75 });
      v_ae4844("success");
    },
  });

  const [v_683210, v_34a50a] = v_5ab095(false);
  const [v_9b6134, v_43d2ef] = v_5ab095("");
  v_c4deb2(() => v_43d2ef(v_eddb49 ? String(v_eddb49) : ""), [v_eddb49]);

  const v_3d268b = v_e662ae(v_0890f8);
  v_3d268b.current = v_0890f8;
  const v_6dc421 = v_e662ae(v_227c69);
  v_6dc421.current = v_227c69;

  v_c4deb2(() => {
    if (!v_cf55be) {
      v_34a50a(false);
      v_ae4844("form");
      v_55e005(null);
      return;
    }
    let v_759436 = true;
    v_34a50a(true);
    v_ae4844("form");
    v_55e005(null);
    void v_308dd7()
      .then((v_9e86fd) => {
        if (!v_759436) return;
        const v_c78a36 = () => v_3d268b.current();
        const v_3ed4c3 = [{ text: v_8d41d7("common.confirm", { defaultValue: "확인" }) }];
        const v_d5bb0f = (v_9f1622, v_4d33b2, buttons?: Parameters<typeof v_889fad>[2]) => {
          v_c78a36();
          v_889fad(v_9f1622, v_4d33b2, v_3d694a ?? v_3ed4c3);
        };
        if (!v_9e86fd) {
          v_d5bb0f(
            v_8d41d7("giftBox.p6Title", { defaultValue: "교환하지 못했어요" }),
            v_8d41d7("giftBox.p8BodySoon", { defaultValue: "잠시 후 다시 시도해주세요." }),
          );
        } else if (!v_9e86fd.xrunLinked) {
          v_d5bb0f(
            v_8d41d7("giftBox.p10Title", { defaultValue: "교환할 수 없는 계정이에요" }),
            v_8d41d7("giftBox.p10Body", {
              defaultValue: "XRUN 계정 상태를 확인해주세요. 궁금한 점은 고객센터로 문의해주세요.",
            }),
          );
        } else if (v_9e86fd.maintenance || !v_9e86fd.enabled) {
          v_d5bb0f(
            v_8d41d7("giftBox.p8Title", { defaultValue: "교환 서비스 점검 중이에요" }),
            v_9e86fd.maintenance?.message ??
              v_8d41d7("giftBox.p8BodySoon", { defaultValue: "잠시 후 다시 시도해주세요." }),
          );
        } else if (!v_9e86fd.giftId || v_9e86fd.ownedQty <= 0) {
          v_d5bb0f(
            v_8d41d7("giftBox.noGiftTitle", { defaultValue: "교환할 선물이 없어요" }),
            v_8d41d7("giftBox.noGiftBody", {
              defaultValue: "페르소나와 통화하면 선물을 받을 수 있어요.\n지금 통화하러 가볼까요?",
            }),
            [
              { text: v_8d41d7("common.cancel", { defaultValue: "취소" }), style: "cancel" },
              {
                text: v_8d41d7("giftBox.goHome", { defaultValue: "바로가기" }),
                onPress: () => v_6dc421.current?.(),
              },
            ],
          );
        } else if (v_9e86fd.exchangeableQty < v_9e86fd.minQty) {
          const v_565b1e = v_9e86fd.minQty + v_6f0728(v_9e86fd, v_9e86fd.minQty);
          v_d5bb0f(
            v_8d41d7("giftBox.notEnoughTitle", {
              defaultValue: "교환하려면 {{need}} ROSE 이상 필요해요",
              need: v_565b1e,
            }),
            v_8d41d7("giftBox.notEnoughBody", {
              defaultValue: "지금 {{owned}} ROSE를 갖고 있어요.\n통화로 선물을 더 모아보세요.",
              owned: v_9e86fd.ownedQty,
            }),
            [
              { text: v_8d41d7("common.cancel", { defaultValue: "취소" }), style: "cancel" },
              {
                text: v_8d41d7("giftBox.goHome", { defaultValue: "바로가기" }),
                onPress: () => v_6dc421.current?.(),
              },
            ],
          );
        }
      })
      .finally(() => v_759436 && v_34a50a(false));
    return () => {
      v_759436 = false;
    };

  }, [v_cf55be]);

  const v_fbb22a = () => {
    if (Number(v_9b6134) !== v_eddb49) {
      v_3f5aa8(v_9b6134);
      return;
    }
    void v_d037c4();
  };

  const v_b1717e = !!v_ae840d && !!v_ae840d.giftId && v_ae840d.exchangeableQty >= v_ae840d.minQty && !v_683210;
  const v_2d815e = v_ae840d ? v_6f0728(v_ae840d, v_eddb49) : 0;
  const v_36c043 = v_ae840d ? v_c55c0b(v_ae840d.priceSegments, v_eddb49) : 0;
  const v_cd229f =
    v_ae840d?.priceSegments?.[0]?.price != null
      ? v_b96919(Number(v_ae840d.priceSegments[0].price))
      : "0.1";

  const v_7f2e65 = () => {
    v_0e1f26.dismiss();
    v_de86c2(0);
    v_ae4844("form");
    v_55e005(null);
    v_0890f8();
  };

  v_c4deb2(() => {
    if (!v_cf55be) {
      v_de86c2(0);
      return;
    }
    const v_399925 = v_326be8.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const v_206f77 = v_326be8.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const v_2fc242 = v_0e1f26.addListener(v_399925, (v_9e86fd) => {
      v_de86c2(v_9e86fd.endCoordinates?.height ?? 0);
    });
    const v_ee811a = v_0e1f26.addListener(v_206f77, () => v_de86c2(0));
    return () => {
      v_2fc242.remove();
      v_ee811a.remove();
    };
  }, [v_cf55be]);

  const v_5429f0 = () => {
    const v_717992 =
      v_593e63?.elig.xrunMemberId ?? v_1ed7d9.getState().apiUser?.xrunMemberId;
    const v_e0c7e8 = v_1ed7d9.getState().apiUser?.email;
    void v_77a9ad(v_717992, v_e0c7e8);
  };

  const v_16c81f = v_7e4acc > 0;

  const v_78054f = v_16c81f
    ? 12
    : Math.max(v_033e14.bottom, v_f9771e, v_326be8.OS === "android" ? 24 : 16);
  const v_e84272 = Math.max(280, v_98130e - (v_16c81f ? v_7e4acc : 0) - 24);

  return (
    <Modal
      visible={v_cf55be}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={v_7f2e65}
    >
      <View style={v_72c7a6.root}>
        {}
        <Pressable style={v_72c7a6.backdropFill} onPress={v_683210 ? undefined : v_7f2e65} />
        <View
          style={[v_72c7a6.sheetDock, { paddingBottom: v_7e4acc }]}
          pointerEvents="box-none"
        >
          <Pressable
            style={[
              v_72c7a6.sheet,
              {
                paddingBottom: v_78054f,
                maxHeight: v_e84272,
              },
            ]}
            onPress={(v_9e86fd) => v_9e86fd.stopPropagation?.()}
          >
            <View style={v_72c7a6.handle} />
            {v_683210 ? (
              <View style={v_72c7a6.loadingBox}>
                <ActivityIndicator size="large" color={v_1bfbd0.zinc900} />
                <Text style={v_72c7a6.loadingText}>
                  {v_8d41d7("giftBox.exchangeLoading", {
                    defaultValue: "교환 조건을 확인하고 있어요…",
                  })}
                </Text>
              </View>
            ) : v_ab4803 === "success" && v_593e63 ? (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                bounces={false}
                showsVerticalScrollIndicator={false}
              >
                <SuccessBody
                  res={v_593e63.res}
                  remaining={
                    Math.max(0, (v_593e63.elig.ownedQty ?? 0) - v_593e63.res.deductedQty)
                  }
                  t={v_8d41d7}
                  onReceive={() => {
                    v_5429f0();
                    v_7f2e65();
                  }}
                  onConfirm={v_7f2e65}
                />
              </ScrollView>
            ) : (
              <FormBody
                t={v_8d41d7}
                ready={v_b1717e}
                elig={v_ae840d}
                text={v_9b6134}
                setText={v_43d2ef}
                exchangeQty={v_eddb49}
                exchangeMax={v_ea7b1e}
                fee={v_2d815e}
                reward={v_36c043}
                unitRate={v_cd229f}
                submitting={v_cb66b4}
                onClose={v_7f2e65}
                onMax={() => v_ae840d && v_839e4f(v_ea7b1e)}
                onCommit={() => v_3f5aa8(v_9b6134)}
                onSubmit={v_fbb22a}
              />
            )}

            {v_da74fa ? (
              <View style={v_72c7a6.toast} pointerEvents="none">
                <Text style={v_72c7a6.toastText}>{v_da74fa}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function v_622370({
  t: v_8d41d7,
  ready: v_b1717e,
  elig: v_ae840d,
  text: v_9b6134,
  setText: v_43d2ef,
  exchangeQty: v_eddb49,
  exchangeMax: v_ea7b1e,
  fee: v_2d815e,
  reward: v_36c043,
  unitRate: v_cd229f,
  submitting: v_cb66b4,
  onClose: v_0890f8,
  onMax: v_94ac5f,
  onCommit: v_c6a2f2,
  onSubmit: v_3bfe4c,
}: {
  t: v_75de9d;
  ready: boolean;
  elig: v_02ed3c | null;
  text: string;
  setText: (v: string) => void;
  exchangeQty: number;
  exchangeMax: number;
  fee: number;
  reward: number;
  unitRate: string;
  submitting: boolean;
  onClose: () => void;
  onMax: () => void;
  onCommit: () => void;
  onSubmit: () => void;
}) {
  return (
    <View style={v_72c7a6.formRoot}>
      <View style={v_72c7a6.header}>
        <Text style={v_72c7a6.title}>
          {v_8d41d7("giftBox.exchangeSheetTitleShort", { defaultValue: "교환" })}
        </Text>
        <TouchableOpacity onPress={v_0890f8} hitSlop={10} accessibilityLabel="close">
          <Feather name="x" size={22} color={v_1bfbd0.zinc900} />
        </TouchableOpacity>
      </View>

      {!v_b1717e || !v_ae840d ? (
        <ActivityIndicator style={{ marginVertical: 40 }} color={v_1bfbd0.primary} />
      ) : (
        <>
          <ScrollView
            style={v_72c7a6.formScroll}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            showsVerticalScrollIndicator={false}
          >
            <Text style={v_72c7a6.fieldLabel}>
              {v_8d41d7("giftBox.exchangeQtyLabel", { defaultValue: "교환할 수량" })}
            </Text>
            <View style={v_72c7a6.box}>
              <View style={v_72c7a6.boxTop}>
                <View style={v_72c7a6.assetRow}>
                  <Image source={v_1dee60} style={v_72c7a6.assetIcon} />
                  <Text style={v_72c7a6.assetName}>
                    {v_8d41d7("giftBox.roseUnit", { defaultValue: "ROSE" })}
                  </Text>
                </View>
                <TextInput
                  style={v_72c7a6.qtyInput}
                  value={v_9b6134}
                  onChangeText={(v_81e2ef) => v_43d2ef(v_81e2ef.replace(/\D/g, "").slice(0, 6))}
                  onEndEditing={v_c6a2f2}
                  onSubmitEditing={v_c6a2f2}
                  keyboardType="number-pad"
                  selectTextOnFocus
                  returnKeyType="done"
                />
              </View>
              <View style={v_72c7a6.boxDivider} />
              <View style={v_72c7a6.boxBottom}>
                <Text style={v_72c7a6.ownedLabel}>
                  {v_8d41d7("giftBox.ownedShort", { defaultValue: "보유" })}
                </Text>
                <View style={v_72c7a6.ownedRight}>
                  <Image source={v_1dee60} style={v_72c7a6.ownedRose} />
                  <Text style={v_72c7a6.ownedQty}>{v_ae840d.ownedQty}</Text>
                  <TouchableOpacity onPress={v_94ac5f} hitSlop={8} disabled={v_ea7b1e <= 0}>
                    <Text style={v_72c7a6.maxBtn}>
                      {v_8d41d7("giftBox.max", { defaultValue: "최대" })}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={v_72c7a6.arrowBridge} pointerEvents="none">
              <View style={v_72c7a6.arrowCircle}>
                <Feather name="arrow-down" size={16} color={v_1bfbd0.zinc900} />
              </View>
            </View>

            <Text style={[v_72c7a6.fieldLabel, v_72c7a6.receiveFieldLabel]}>
              {v_8d41d7("giftBox.receiveQtyLabel", { defaultValue: "받을 수량" })}
            </Text>
            <View style={v_72c7a6.box}>
              <View style={v_72c7a6.boxTop}>
                <View style={v_72c7a6.assetRow}>
                  <Image source={v_dae506} style={v_72c7a6.xrunIcon} />
                  <Text style={v_72c7a6.assetName}>XRUN</Text>
                </View>
                <View style={v_72c7a6.receiveRight}>
                  <Text style={v_72c7a6.receiveAmount}>{v_b96919(v_36c043)}</Text>
                  <Text style={v_72c7a6.rateHint}>
                    {v_8d41d7("giftBox.exchangeRateHint", {
                      defaultValue: "1 ROSE = {{rate}} XRUN",
                      rate: v_cd229f,
                    })}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {}
          <View style={v_72c7a6.formFooter}>
            <Text style={v_72c7a6.feeNotice}>
              {v_8d41d7("giftBox.feeExchangeNotice", {
                defaultValue: "수수료 {{fee}} ROSE를 제외한 {{qty}} ROSE가 교환돼요",
                fee: v_2d815e,
                qty: v_eddb49,
              })}
            </Text>
            <TouchableOpacity
              style={[v_72c7a6.primaryBtn, v_cb66b4 && { opacity: 0.5 }]}
              onPress={v_3bfe4c}
              disabled={v_cb66b4}
              activeOpacity={0.85}
            >
              {v_cb66b4 ? (
                <ActivityIndicator color={v_1bfbd0.white} />
              ) : (
                <Text style={v_72c7a6.primaryBtnText}>
                  {v_8d41d7("giftBox.exchangeAction", { defaultValue: "교환하기" })}
                </Text>
              )}
            </TouchableOpacity>
            <Text style={v_72c7a6.disclaimer}>
              {v_8d41d7("giftBox.exchangeNoCancel", {
                defaultValue: "교환 후에는 취소할 수 없어요.",
              })}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

function v_e83058({
  res: v_8f00b9,
  remaining: v_916658,
  t: v_8d41d7,
  onReceive: v_3a2529,
  onConfirm: v_e2be2d,
}: {
  res: v_867a79;
  remaining: number;
  t: v_75de9d;
  onReceive: () => void;
  onConfirm: () => void;
}) {
  return (
    <View style={v_72c7a6.successWrap}>
      <View style={v_72c7a6.successIcon}>
        <Feather name="check" size={28} color="#2e7d32" />
      </View>
      <Text style={v_72c7a6.successTitle}>
        {v_8d41d7("giftBox.p4Title", { defaultValue: "교환이 완료되었어요" })}
      </Text>

      <View style={v_72c7a6.successAssets}>
        <View style={v_72c7a6.successAssetCol}>
          <Image source={v_1dee60} style={v_72c7a6.successAssetIcon} />
          <Text style={v_72c7a6.successAssetText}>
            {v_8f00b9.qty} {v_8d41d7("giftBox.roseUnit", { defaultValue: "ROSE" })}
          </Text>
        </View>
        <Feather name="arrow-right" size={18} color={v_1bfbd0.zinc400} />
        <View style={v_72c7a6.successAssetCol}>
          <Image source={v_dae506} style={v_72c7a6.successXrunIcon} />
          <Text style={v_72c7a6.successAssetText}>{v_8f00b9.reward} XRUN</Text>
        </View>
      </View>

      <Text style={v_72c7a6.successMeta}>
        {v_8d41d7("giftBox.successFeeLine", {
          defaultValue: "수수료 {{fee}} ROSE 차감 후 교환",
          fee: v_8f00b9.feeQty,
        })}
      </Text>
      <Text style={v_72c7a6.successMeta}>
        {v_8d41d7("giftBox.successRemaining", {
          defaultValue: "남은 로즈 {{n}} ROSE",
          n: v_916658,
        })}
      </Text>

      <View style={v_72c7a6.infoBox}>
        <Text style={v_72c7a6.infoBoxText}>
          {v_8d41d7("giftBox.successWalletHint", {
            defaultValue: "보상은 XRUN 지갑 > Afterlife에서 받을 수 있어요.",
          })}
        </Text>
      </View>

      <TouchableOpacity style={v_72c7a6.primaryBtn} onPress={v_3a2529} activeOpacity={0.85}>
        <Text style={v_72c7a6.primaryBtnText}>
          {v_8d41d7("giftBox.p4ReceiveReward", { defaultValue: "XRUN에서 보상 받기" })}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={v_72c7a6.confirmBtn} onPress={v_e2be2d} hitSlop={8}>
        <Text style={v_72c7a6.confirmBtnText}>
          {v_8d41d7("common.confirm", { defaultValue: "확인" })}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function v_b96919(v_f4e98d): string {
  if (!Number.isFinite(v_f4e98d)) return "0";
  return String(Math.round(v_f4e98d * 1e8) / 1e8);
}

const v_72c7a6 = v_472849.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdropFill: {
    ...v_472849.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheetDock: {
    width: "100%",
  },
  sheet: {
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    overflow: "hidden",
  },
  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 14,
  },
  loadingText: {
    fontSize: 14,
    color: v_1bfbd0.zinc500,
    textAlign: "center",
  },
  formRoot: { flexGrow: 0, flexShrink: 1 },
  formScroll: { flexGrow: 0, flexShrink: 1 },
  formFooter: { paddingTop: 4 },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: v_1bfbd0.zinc300,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  title: { fontSize: 18, fontWeight: "800", color: v_1bfbd0.zinc900 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: v_1bfbd0.zinc500,
    marginBottom: 8,
  },
  receiveFieldLabel: {
    marginTop: 2,
  },
  box: {
    backgroundColor: v_1bfbd0.zinc50,
    borderRadius: 16,
    padding: 14,
  },
  boxTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  assetRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  assetIcon: { width: 28, height: 28, borderRadius: 14 },
  xrunIcon: { width: 28, height: 28, borderRadius: 14 },
  assetName: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.zinc900 },
  qtyInput: {
    minWidth: 80,
    fontSize: 28,
    fontWeight: "800",
    color: v_1bfbd0.zinc900,
    textAlign: "right",
    padding: 0,
  },
  boxDivider: {
    height: v_472849.hairlineWidth,
    backgroundColor: v_1bfbd0.zinc200,
    marginVertical: 12,
  },
  boxBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ownedLabel: { fontSize: 13, color: v_1bfbd0.zinc500 },
  ownedRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  ownedRose: { width: 16, height: 16, borderRadius: 8 },
  ownedQty: {
    fontSize: 14,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
    fontVariant: ["tabular-nums"],
  },
  maxBtn: { fontSize: 13, fontWeight: "700", color: v_1bfbd0.secondary },

  arrowBridge: {
    zIndex: 2,
    height: 36,
    marginTop: -18,
    marginBottom: -18,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: v_1bfbd0.white,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    alignItems: "center",
    justifyContent: "center",
    ...v_326be8.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  receiveRight: { alignItems: "flex-end", gap: 4 },
  receiveAmount: {
    fontSize: 28,
    fontWeight: "800",
    color: v_1bfbd0.zinc900,
    fontVariant: ["tabular-nums"],
  },
  rateHint: {
    fontSize: 12,
    color: v_1bfbd0.zinc500,
    textAlign: "right",
  },
  feeNotice: {
    marginTop: 14,
    marginBottom: 16,
    fontSize: 13,
    color: v_1bfbd0.zinc500,
    textAlign: "center",
  },
  primaryBtn: {
    alignSelf: "stretch",
    height: 52,
    borderRadius: v_8b0c90.md,
    backgroundColor: v_1bfbd0.zinc900,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryBtnText: { fontSize: 16, fontWeight: "700", color: v_1bfbd0.white },
  disclaimer: {
    marginTop: 12,
    marginBottom: 4,
    fontSize: 12,
    color: v_1bfbd0.zinc400,
    textAlign: "center",
  },
  toast: {
    position: "absolute",
    left: 20,
    right: 20,
    top: 16,
    backgroundColor: "rgba(24,24,27,0.92)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  toastText: { color: v_1bfbd0.white, fontSize: 13, textAlign: "center" },
  successWrap: { alignItems: "center", paddingTop: 8, paddingBottom: 4 },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: v_1bfbd0.zinc900,
    marginBottom: 20,
  },
  successAssets: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 14,
  },
  successAssetCol: { alignItems: "center", gap: 8 },
  successAssetIcon: { width: 44, height: 44, borderRadius: 22 },
  successXrunIcon: { width: 44, height: 44, borderRadius: 22 },
  successAssetText: { fontSize: 14, fontWeight: "700", color: v_1bfbd0.zinc900 },
  successMeta: { fontSize: 13, color: v_1bfbd0.zinc500, marginBottom: 4 },
  infoBox: {
    alignSelf: "stretch",
    backgroundColor: v_1bfbd0.zinc50,
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    marginBottom: 16,
  },
  infoBoxText: {
    fontSize: 13,
    color: v_1bfbd0.zinc600,
    textAlign: "center",
    lineHeight: 18,
  },
  confirmBtn: { marginTop: 14, paddingVertical: 8 },
  confirmBtnText: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc600 },
});
