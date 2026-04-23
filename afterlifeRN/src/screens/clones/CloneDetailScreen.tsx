import v_a3453e, { v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_cf9c33,
  v_700696,
  v_9cabcb,
  v_aa7413,
  v_09d0e5,
} from "rcmrninabrnb";
import { v_5ade23 } from "xbfwaaanosqvazmrqoah";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import type { v_432191 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_2d88fc } from "../../navigation/types";
import { v_194498 } from "../../stores/cloneStore";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_694b7f } from "../../api/source";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import type { v_84fd28 } from "../../types/gift";
import v_feb82c from "../../mocks/gifts.json";

type Props = v_432191<v_2d88fc, "CloneDetail">;

const { width: v_0d9f50, height: v_28d8d8 } = v_700696.get("window");

const v_68bb66 = v_feb82c as v_84fd28[];

export default function v_51ae06({ route: v_c7daf6, navigation: v_c65f5d }: Props) {
  const { cloneId: v_6e0fd3 } = v_c7daf6.params;
  const v_eb25ce = v_194498((v_fd5f43) => v_fd5f43.getCloneById(v_6e0fd3));
  const v_625c74 = v_1ed7d9((v_fd5f43) => v_fd5f43.user);
  const v_033e14 = v_e0068c();
  const [v_a7e879, v_88d896] = v_5ab095(false);

  const v_c279e3 =
    v_eb25ce && v_eb25ce.cloneType === "memlow"
      ? v_694b7f.coowners()
          .filter(
            (v_c4a45b) => v_c4a45b.cloneId === v_eb25ce.id && v_c4a45b.status === "approved",
          )
          .map((v_c4a45b) => v_694b7f.users().find((v_ceb55a) => v_ceb55a.id === v_c4a45b.userId))
          .filter((v_ceb55a): v_ceb55a is NonNullable<typeof v_ceb55a> => Boolean(v_ceb55a))
      : [];

  if (!v_eb25ce) {
    return (
      <View style={v_fd5f43.notFound}>
        <Text style={v_fd5f43.notFoundText}>페르소나를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const v_87bb7d =
    v_625c74?.id != null &&
    (v_625c74.id === v_eb25ce.ownerId || v_625c74.id === v_eb25ce.primaryEditorUserId);

  const v_992a8f = ({ item: v_8c0b26 }: { item: v_84fd28 }) => (
    <TouchableOpacity style={v_fd5f43.giftItem}>
      <View style={v_fd5f43.giftEmojiWrap}>
        <Text style={v_fd5f43.giftEmoji}>{v_8c0b26.emoji}</Text>
      </View>
      <Text style={v_fd5f43.giftName}>{v_8c0b26.name}</Text>
      <Text style={v_fd5f43.giftPrice}>{v_8c0b26.price} XRUN</Text>
    </TouchableOpacity>
  );

  return (
    <View style={v_fd5f43.container}>
      {}
      <Image
        source={{ uri: v_eb25ce.imageUrl ?? "" }}
        style={v_fd5f43.bgImage}
        resizeMode="cover"
      />

      {}
      <LinearGradient
        colors={["rgba(9,9,11,0.7)", "transparent"]}
        style={[v_fd5f43.topGradient, { paddingTop: v_033e14.top }]}
      >
        <View style={v_fd5f43.headerRow}>
          <TouchableOpacity
            style={v_fd5f43.backBtn}
            onPress={() => v_c65f5d.goBack()}
          >
            <Feather name="arrow-left" size={22} color={v_1bfbd0.white} />
          </TouchableOpacity>

          {v_87bb7d && (
            <TouchableOpacity
              accessibilityLabel="clone-edit-entry"
              style={v_fd5f43.backBtn}
              onPress={() => v_c65f5d.navigate('CloneEdit', { cloneId: v_eb25ce.id })}
            >
              <Feather name="edit-2" size={20} color={v_1bfbd0.white} />
            </TouchableOpacity>
          )}

          {v_625c74?.avatarUrl && (
            <Image
              source={{ uri: v_625c74.avatarUrl }}
              style={v_fd5f43.userAvatar}
            />
          )}
        </View>
      </LinearGradient>

      {}
      <LinearGradient
        colors={["transparent", "rgba(9,9,11,0.7)"]}
        style={v_fd5f43.bottomGradient}
      >
        {v_c279e3.length > 0 && (
          <View style={v_fd5f43.coownerBlock} testID="coowner-section">
            <Text style={v_fd5f43.coownerTitle}>
              공동관리자 {v_c279e3.length}명
            </Text>
            <View style={v_fd5f43.coownerList}>
              {v_c279e3.slice(0, 5).map((v_ceb55a) => (
                <View key={v_ceb55a.id} style={v_fd5f43.coownerChip}>
                  <Text style={v_fd5f43.coownerName}>{v_ceb55a.displayName}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {}
        <TouchableOpacity
          style={v_fd5f43.giftBtn}
          onPress={() => v_88d896(true)}
          activeOpacity={0.8}
        >
          <Feather name="gift" size={26} color={v_1bfbd0.white} />
        </TouchableOpacity>
      </LinearGradient>

      {}
      <Modal visible={v_a7e879} transparent animationType="slide">
        <Pressable style={v_fd5f43.giftOverlay} onPress={() => v_88d896(false)}>
          <Pressable style={v_fd5f43.giftSheet} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            {}
            <View style={v_fd5f43.sheetHandle} />

            <Text style={v_fd5f43.giftSheetTitle}>선물 보내기</Text>
            <Text style={v_fd5f43.giftSheetDesc}>
              페르소나에게 특별한 선물을 보내보세요
            </Text>

            {}
            <View style={v_fd5f43.balanceRow}>
              <Text style={v_fd5f43.balanceLabel}>보유 XRUN</Text>
              <Text style={v_fd5f43.balanceValue}>1,250</Text>
            </View>

            {}
            <FlatList
              data={v_68bb66}
              keyExtractor={(v_8c0b26) => v_8c0b26.id}
              renderItem={v_992a8f}
              numColumns={2}
              columnWrapperStyle={v_fd5f43.giftRow}
              contentContainerStyle={v_fd5f43.giftGrid}
              scrollEnabled={false}
            />

            {}
            <TouchableOpacity style={v_fd5f43.sendGiftBtn} activeOpacity={0.8}>
              <Text style={v_fd5f43.sendGiftText}>선물 보내기</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const v_fd5f43 = v_472849.create({
  container: {
    flex: 1,
    backgroundColor: v_1bfbd0.zinc950,
  },
  bgImage: {
    ...v_472849.absoluteFillObject,
    width: v_0d9f50,
    height: v_28d8d8,
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 20,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(24,24,27,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: v_1bfbd0.white,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
    alignItems: "flex-end",
    zIndex: 10,
  },
  coownerBlock: {
    alignSelf: "stretch",
    marginBottom: 16,
  },
  coownerTitle: {
    fontSize: 12,
    color: v_1bfbd0.white,
    fontWeight: "600",
    marginBottom: 8,
    opacity: 0.85,
  },
  coownerList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  coownerChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: v_8b0c90.full,
  },
  coownerName: {
    fontSize: 12,
    color: v_1bfbd0.white,
    fontWeight: "500",
  },
  giftBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: v_1bfbd0.violet500,
    elevation: 8,
    shadowColor: v_1bfbd0.violet500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },

  giftOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  giftSheet: {
    backgroundColor: v_1bfbd0.zinc900,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 32,
    maxHeight: v_28d8d8 * 0.55,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: v_1bfbd0.zinc700,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  giftSheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: v_1bfbd0.white,
    marginBottom: 6,
  },
  giftSheetDesc: {
    fontSize: 13,
    color: v_1bfbd0.zinc400,
    marginBottom: 20,
  },
  balanceRow: {
    backgroundColor: v_1bfbd0.zinc800,
    borderRadius: v_8b0c90.lg,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  balanceLabel: { fontSize: 14, color: v_1bfbd0.zinc400 },
  balanceValue: { fontSize: 20, fontWeight: "700", color: v_1bfbd0.white },
  giftGrid: { gap: 12 },
  giftRow: { gap: 12 },
  giftItem: {
    flex: 1,
    backgroundColor: v_1bfbd0.zinc800,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  giftEmojiWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: v_1bfbd0.zinc900,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  giftEmoji: { fontSize: 28 },
  giftName: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.white, marginBottom: 4 },
  giftPrice: { fontSize: 12, fontWeight: "700", color: v_1bfbd0.violet500 },
  sendGiftBtn: {
    height: 48,
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.violet500,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  sendGiftText: { fontSize: 16, fontWeight: "700", color: v_1bfbd0.white },

  notFound: {
    flex: 1,
    backgroundColor: v_1bfbd0.white,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundText: { fontSize: 14, color: v_1bfbd0.zinc500 },
});
