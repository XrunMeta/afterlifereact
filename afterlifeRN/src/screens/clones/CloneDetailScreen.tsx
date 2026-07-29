import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ClonesStackParamList } from "../../navigation/types";
import { useCloneStore } from "../../stores/cloneStore";
import { useAuthStore } from "../../stores/authStore";
import { seedSource } from "../../api/source";
import { COLORS, RADIUS } from "../../components/constants";

import { fetchGiftCatalog, type GiftCatalogItem } from "../../api/gifts";

type Props = NativeStackScreenProps<ClonesStackParamList, "CloneDetail">;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function CloneDetailScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { cloneId } = route.params;
  const clone = useCloneStore((s) => s.getCloneById(cloneId));
  const user = useAuthStore((s) => s.user);
  const insets = useSafeAreaInsets();
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [gifts, setGifts] = useState<GiftCatalogItem[]>([]);
  useEffect(() => {
    let cancelled = false;
    void fetchGiftCatalog().then((items) => {
      if (!cancelled) setGifts(items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 2000);
    return () => clearTimeout(timer);
  }, [toastMessage]);
  const notifyPaymentPending = () => {
    setShowGiftModal(false);
    setToastMessage("결제 준비 중이에요");
  };

  const approvedCoowners =
    clone && clone.cloneType === "memlow"
      ? seedSource.coowners()
          .filter(
            (co) => co.cloneId === clone.id && co.status === "approved",
          )
          .map((co) => seedSource.users().find((u) => u.id === co.userId))
          .filter((u): u is NonNullable<typeof u> => Boolean(u))
      : [];

  if (!clone) {
    return (
      <View style={s.notFound}>
        <Text style={s.notFoundText}>{t("detail.notFound")}</Text>
      </View>
    );
  }

  const canEdit =
    user?.id != null &&
    (user.id === clone.ownerId || user.id === clone.primaryEditorUserId);

  const renderGift = ({ item }: { item: GiftCatalogItem }) => (
    <TouchableOpacity style={s.giftItem} activeOpacity={0.7} onPress={notifyPaymentPending}>
      <View style={s.giftEmojiWrap}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={s.giftImage} />
        ) : (
          <Text style={s.giftEmoji}>{item.emoji}</Text>
        )}
      </View>
      <Text style={s.giftName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      {}
      {clone.imageUrl ? (
        <Image
          source={{ uri: clone.imageUrl }}
          style={s.bgImage}
          resizeMode="cover"
        />
      ) : null}

      {}
      <LinearGradient
        colors={["rgba(9,9,11,0.7)", "transparent"]}
        style={[s.topGradient, { paddingTop: insets.top }]}
      >
        <View style={s.headerRow}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={22} color={COLORS.white} />
          </TouchableOpacity>

          {canEdit && (
            <TouchableOpacity
              accessibilityLabel="clone-edit-entry"
              style={s.backBtn}
              onPress={() => navigation.navigate('CloneEdit', { cloneId: clone.id })}
            >
              <Feather name="edit-2" size={20} color={COLORS.white} />
            </TouchableOpacity>
          )}

          {user?.avatarUrl && (
            <Image
              source={{ uri: user.avatarUrl }}
              style={s.userAvatar}
            />
          )}
        </View>
      </LinearGradient>

      {}
      <LinearGradient
        colors={["transparent", "rgba(9,9,11,0.7)"]}
        style={s.bottomGradient}
      >
        {approvedCoowners.length > 0 && (
          <TouchableOpacity
            style={s.coownerBlock}
            testID="coowner-section"
            onPress={() => navigation.navigate("CloneInvite", { cloneId: clone.id })}
            activeOpacity={0.85}
          >
            <Text style={s.coownerTitle}>
              {t("dashboard.coownerCount", { n: approvedCoowners.length })}
            </Text>
            <View style={s.coownerList}>
              {approvedCoowners.slice(0, 5).map((u) => (
                <View key={u.id} style={s.coownerChip}>
                  <Text style={s.coownerName}>{u.displayName}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        )}
        {}
        {approvedCoowners.length === 0 && canEdit && (
          <TouchableOpacity
            style={s.coownerInviteBtn}
            onPress={() => navigation.navigate("CloneInvite", { cloneId: clone.id })}
            activeOpacity={0.85}
          >
            <Feather name="user-plus" size={14} color={COLORS.white} />
            <Text style={s.coownerInviteText}>{t("detail.coownerInvite")}</Text>
          </TouchableOpacity>
        )}

        {}
        <TouchableOpacity
          style={s.giftBtn}
          onPress={() => setShowGiftModal(true)}
          activeOpacity={0.8}
        >
          <Feather name="gift" size={26} color={COLORS.white} />
        </TouchableOpacity>
      </LinearGradient>

      {}
      <Modal visible={showGiftModal} transparent animationType="slide">
        <Pressable style={s.giftOverlay} onPress={() => setShowGiftModal(false)}>
          <Pressable
            style={[s.giftSheet, { paddingBottom: 32 + Math.max(insets.bottom, 0) }]}
            onPress={(e) => e.stopPropagation()}
          >
            {}
            <View style={s.sheetHandle} />

            <Text style={s.giftSheetTitle}>{t("detail.giftTitle")}</Text>
            <Text style={s.giftSheetDesc}>
              {t("detail.giftDesc")}
            </Text>

            {}

            {}
            <FlatList
              data={gifts}
              keyExtractor={(item) => item.id}
              renderItem={renderGift}
              numColumns={2}
              columnWrapperStyle={s.giftRow}
              contentContainerStyle={s.giftGrid}
              scrollEnabled={false}
            />

            {}
            <TouchableOpacity style={s.sendGiftBtn} activeOpacity={0.8} onPress={notifyPaymentPending}>
              <Text style={s.sendGiftText}>{t("detail.send")}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {}
      {toastMessage && (
        <View style={s.toast}>
          <Text style={s.toastText}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.zinc950,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
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
    borderColor: COLORS.white,
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
    color: COLORS.white,
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
    borderRadius: RADIUS.full,
  },
  coownerName: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: "500",
  },
  coownerInviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginBottom: 12,
  },
  coownerInviteText: { fontSize: 12, color: COLORS.white, fontWeight: "600" },
  giftBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.violet500,
    elevation: 8,
    shadowColor: COLORS.violet500,
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
    backgroundColor: COLORS.zinc900,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,

    height: SCREEN_HEIGHT * 0.8,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.zinc700,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  giftSheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 6,
  },
  giftSheetDesc: {
    fontSize: 13,
    color: COLORS.zinc400,
    marginBottom: 20,
  },
  giftGrid: { gap: 12 },
  giftRow: { gap: 12 },
  giftItem: {
    flex: 1,
    backgroundColor: COLORS.zinc800,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  giftEmojiWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.zinc900,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  giftEmoji: { fontSize: 28 },
  giftImage: { width: 44, height: 44, borderRadius: 8 },
  giftName: { fontSize: 14, fontWeight: "600", color: COLORS.white, marginBottom: 4 },
  sendGiftBtn: {
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.violet500,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  sendGiftText: { fontSize: 16, fontWeight: "700", color: COLORS.white },

  toast: {
    position: "absolute",
    bottom: 140,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: RADIUS.full,
    zIndex: 50,
  },
  toastText: { fontSize: 14, color: COLORS.white },

  notFound: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundText: { fontSize: 14, color: COLORS.zinc500 },
});
