

import v_a3453e, { v_c4deb2, v_e662ae, v_5ab095 } from "bapkr";
import {
  v_39a996,
  v_e767d1,
  v_aa7413,
  v_326be8,
  v_09d0e5,
  v_472849,
  v_19b633,
  v_79c4f2,
  v_4623af,
  v_3094a2,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import { v_1bfbd0 } from "../constants";
import { v_889fad } from "../../stores/dialogStore";
import { v_61fb8c } from "../../hooks/useGiftExchange";
import { v_6f0728, v_c55c0b } from "../../api/giftInventory";

interface Props {
  visible: boolean;
  onClose: () => void;

  onChanged?: () => void;

  onGoHome?: () => void;
}

export default function v_177da7({ visible: v_cf55be, onClose: v_0890f8, onChanged: v_37c9f5, onGoHome: v_227c69 }: Props) {
  const { t: v_8d41d7 } = v_772971();

  const {
    elig: v_ae840d,
    exchangeQty: v_eddb49,
    exchangeMax: v_ea7b1e,
    submitting: v_cb66b4,
    toast: v_da74fa,
    loadExchange: v_308dd7,
    onExchangeDec: v_b54070,
    onExchangeInc: v_869bef,
    commitTypedQty: v_3f5aa8,
    onExchangeSubmit: v_d037c4,
  } = v_61fb8c({ onChanged: v_37c9f5, beforeConfirm: v_0890f8 });

  const [v_683210, v_34a50a] = v_5ab095(false);

  const [v_d1b432, v_9998b9] = v_5ab095(false);
  const [v_9b6134, v_43d2ef] = v_5ab095("");
  v_c4deb2(() => v_43d2ef(v_eddb49 ? String(v_eddb49) : ""), [v_eddb49]);

  const v_3d268b = v_e662ae(v_0890f8);
  v_3d268b.current = v_0890f8;
  const v_6dc421 = v_e662ae(v_227c69);
  v_6dc421.current = v_227c69;
  v_c4deb2(() => {
    if (!v_cf55be) {
      v_9998b9(false);
      return;
    }
    let v_759436 = true;
    v_34a50a(true);
    void v_308dd7()
      .then((v_9e86fd) => {
        if (!v_759436) return;
        const v_c78a36 = () => v_3d268b.current();
        const v_3ed4c3 = [{ text: v_8d41d7("common.confirm", { defaultValue: "확인" }) }];
        if (!v_9e86fd) {
          v_c78a36();
          v_889fad(
            v_8d41d7("giftBox.p6Title", { defaultValue: "교환하지 못했어요" }),
            v_8d41d7("giftBox.p8BodySoon", { defaultValue: "잠시 후 다시 시도해주세요." }),
            v_3ed4c3,
          );
        } else if (!v_9e86fd.xrunLinked) {
          v_c78a36();
          v_889fad(
            v_8d41d7("giftBox.p10Title", { defaultValue: "교환할 수 없는 계정이에요" }),
            v_8d41d7("giftBox.p10Body", { defaultValue: "XRUN 계정 상태를 확인해주세요. 궁금한 점은 고객센터로 문의해주세요." }),
            v_3ed4c3,
          );
        } else if (v_9e86fd.maintenance || !v_9e86fd.enabled) {
          v_c78a36();
          v_889fad(
            v_8d41d7("giftBox.p8Title", { defaultValue: "교환 서비스 점검 중이에요" }),
            v_9e86fd.maintenance?.message ?? v_8d41d7("giftBox.p8BodySoon", { defaultValue: "잠시 후 다시 시도해주세요." }),
            v_3ed4c3,
          );
        } else if (!v_9e86fd.giftId || v_9e86fd.ownedQty <= 0) {

          v_c78a36();
          v_889fad(
            v_8d41d7("giftBox.noGiftTitle", { defaultValue: "교환할 선물이 없어요" }),
            v_8d41d7("giftBox.noGiftBody", { defaultValue: "페르소나와 통화하면 선물을 받을 수 있어요.\n지금 통화하러 가볼까요?" }),
            [
              { text: v_8d41d7("common.cancel", { defaultValue: "취소" }), style: "cancel" },
              { text: v_8d41d7("giftBox.goHome", { defaultValue: "바로가기" }), onPress: () => v_6dc421.current?.() },
            ],
          );
        } else if (v_9e86fd.exchangeableQty < v_9e86fd.minQty) {
          v_c78a36();
          const v_565b1e = v_9e86fd.minQty + v_6f0728(v_9e86fd, v_9e86fd.minQty);
          v_889fad(
            v_8d41d7("giftBox.notEnoughTitle", { defaultValue: "교환하려면 {{need}}송이 이상 필요해요", need: v_565b1e }),
            v_8d41d7("giftBox.notEnoughBody", {
              defaultValue: "지금 {{owned}}송이를 갖고 있어요.\n통화로 선물을 더 모아보세요.",
              owned: v_9e86fd.ownedQty,
            }),
            [
              { text: v_8d41d7("common.cancel", { defaultValue: "취소" }), style: "cancel" },
              { text: v_8d41d7("giftBox.goHome", { defaultValue: "바로가기" }), onPress: () => v_6dc421.current?.() },
            ],
          );
        } else {
          v_9998b9(true);
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
  const v_80cae9 = v_8d41d7("giftBox.flowerUnit", { defaultValue: "송이" });

  return (
    <Modal visible={v_cf55be && v_d1b432} transparent animationType="fade" onRequestClose={v_0890f8}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={v_326be8.OS === "ios" ? "padding" : undefined}>
        <Pressable style={v_72c7a6.backdrop} onPress={v_0890f8}>
          <Pressable
            style={v_72c7a6.sheet}
            onPress={(v_9e86fd) => v_9e86fd.stopPropagation?.()}
          >
            <Text style={v_72c7a6.title}>{v_8d41d7("giftBox.exchangeSheetTitle", { defaultValue: "XRUN으로 교환합니다" })}</Text>

            {!v_b1717e || !v_ae840d ? (
              <ActivityIndicator style={{ marginVertical: 40 }} color={v_1bfbd0.primary} />
            ) : (
              <>
                {}
                <View style={v_72c7a6.giftRow}>
                  <Text style={v_72c7a6.owned}>
                    {v_8d41d7("giftBox.ownedLabel", { defaultValue: "보유 중" })} {v_ae840d.ownedQty}
                    {v_80cae9}
                  </Text>
                </View>

                <View style={v_72c7a6.stepper}>
                  <TouchableOpacity style={v_72c7a6.stepBtn} onPress={v_b54070} hitSlop={6} accessibilityLabel="minus">
                    <Feather name="minus" size={20} color={v_eddb49 <= v_ae840d.minQty ? v_1bfbd0.zinc300 : v_1bfbd0.zinc900} />
                  </TouchableOpacity>
                  <TextInput
                    style={v_72c7a6.qtyInput}
                    value={v_9b6134}
                    onChangeText={(v_81e2ef) => v_43d2ef(v_81e2ef.replace(/\D/g, "").slice(0, 6))}
                    onEndEditing={() => v_3f5aa8(v_9b6134)}
                    keyboardType="number-pad"
                    textAlign="center"
                    selectTextOnFocus
                  />
                  <TouchableOpacity style={v_72c7a6.stepBtn} onPress={v_869bef} hitSlop={6} accessibilityLabel="plus">
                    <Feather name="plus" size={20} color={v_eddb49 >= v_ea7b1e ? v_1bfbd0.zinc300 : v_1bfbd0.zinc900} />
                  </TouchableOpacity>
                </View>

                <View style={v_72c7a6.calc}>
                  <Row
                    label={v_8d41d7("giftBox.fee", { defaultValue: "수수료" })}
                    value={v_8d41d7("giftBox.feeRule", {
                      defaultValue: "{{unit}}송이당 {{fee}}송이 · {{total}}송이",
                      unit: v_ae840d.feeUnit ?? v_ae840d.minQty,
                      fee: v_ae840d.feeQty,
                      total: v_2d815e,
                    })}
                  />
                  <Row
                    label={v_8d41d7("giftBox.totalDeduct", { defaultValue: "총 차감" })}
                    value={`${v_eddb49 + v_2d815e}${v_80cae9}`}
                  />
                  <Row
                    label={v_8d41d7("giftBox.reward", { defaultValue: "받게 될 보상" })}
                    value={`${v_36c043} XRUN`}
                    accent
                  />
                </View>

                <View style={v_72c7a6.btnRow}>
                  <TouchableOpacity style={[v_72c7a6.btn, v_72c7a6.cancelBtn]} onPress={v_0890f8}>
                    <Text style={v_72c7a6.cancelText}>{v_8d41d7("common.cancel", { defaultValue: "취소" })}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[v_72c7a6.btn, v_72c7a6.okBtn, v_cb66b4 && { opacity: 0.5 }]}
                    onPress={v_fbb22a}
                    disabled={v_cb66b4}
                  >
                    {v_cb66b4 ? (
                      <ActivityIndicator color={v_1bfbd0.white} />
                    ) : (
                      <Text style={v_72c7a6.okText}>{v_8d41d7("giftBox.exchangeAction", { defaultValue: "교환하기" })}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {v_da74fa ? (
              <View style={v_72c7a6.toast} pointerEvents="none">
                <Text style={v_72c7a6.toastText}>{v_da74fa}</Text>
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function v_c9fb73({ label: v_2869c1, value: v_3b402b, accent: v_09a432 }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={v_72c7a6.calcRow}>
      <Text style={v_72c7a6.calcLabel}>{v_2869c1}</Text>
      <Text style={[v_72c7a6.calcValue, v_09a432 && { color: v_1bfbd0.primary }]}>{v_3b402b}</Text>
    </View>
  );
}

const v_72c7a6 = v_472849.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 24 },
  sheet: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: v_1bfbd0.white,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
  },
  title: { fontSize: 18, fontWeight: "700", color: v_1bfbd0.zinc900, textAlign: "center", marginBottom: 16 },
  giftRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 },
  owned: { fontSize: 13, color: v_1bfbd0.zinc500 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    fontSize: 20,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
  },
  calc: { backgroundColor: v_1bfbd0.zinc50, borderRadius: 12, padding: 14, gap: 8, marginBottom: 20 },
  calcRow: { flexDirection: "row", justifyContent: "space-between" },
  calcLabel: { fontSize: 14, color: v_1bfbd0.zinc500 },
  calcValue: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
  btnRow: { flexDirection: "row", gap: 10 },
  btn: { flex: 1, height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cancelBtn: { backgroundColor: v_1bfbd0.zinc100 },
  cancelText: { fontSize: 16, fontWeight: "600", color: v_1bfbd0.zinc700 },
  okBtn: { backgroundColor: v_1bfbd0.primary },
  okText: { fontSize: 16, fontWeight: "700", color: v_1bfbd0.white },
  toast: {
    position: "absolute",
    left: 20,
    right: 20,
    top: -56,
    backgroundColor: "rgba(24,24,27,0.92)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  toastText: { color: v_1bfbd0.white, fontSize: 13, textAlign: "center" },
});
