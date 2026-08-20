

import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAndroidNavigationBarHeight } from "react-native-navigation-bar-height";
import SwipeDownSheet from "../ui/SwipeDownSheet";
import { COLORS } from "../constants";
import { useAuthStore } from "../../stores/authStore";
import {
  listCloneGiftReceipts,
  type GiftReceiptItem,
} from "../../api/clones";

interface Props {
  visible: boolean;
  cloneId: number | null;
  cloneName: string;
  onClose: () => void;
}

export default function GiftReceiptsSheet({ visible, cloneId, cloneName, onClose }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navBarHeight = useAndroidNavigationBarHeight(0);
  const androidMinNavBar = Platform.OS === "android" ? 56 : 0;
  const bottomInset = Math.max(insets.bottom, navBarHeight, androidMinNavBar);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [items, setItems] = useState<GiftReceiptItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !cloneId || !accessToken) {
      setItems(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setItems(null);
    listCloneGiftReceipts(accessToken, cloneId)
      .then((res) => {
        if (cancelled) return;
        setItems(res.items ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("[GiftReceiptsSheet] listCloneGiftReceipts failed:", err);
        setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, cloneId, accessToken]);

  const total = items?.reduce((sum, it) => sum + it.count, 0) ?? 0;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={s.bottomOverlay} onPress={onClose}>
        <SwipeDownSheet
          onClose={onClose}
          style={[s.sheet, { paddingBottom: 32 + bottomInset }]}
        >
          <View style={s.handle} />
          <Text style={s.title}>
            {t("feed.giftReceiptsTitle", { defaultValue: "받은 선물" })}
          </Text>
          <Text style={s.sub}>{cloneName}</Text>

          {items && items.length > 0 ? (
            <View style={s.summary}>
              <Feather name="gift" size={20} color="#a78bfa" />
              <Text style={s.summaryTotal}>
                {t("feed.giftReceiptsTotal", { defaultValue: "총 {{n}}개", n: total })}
              </Text>
            </View>
          ) : null}

          <ScrollView
            style={s.scrollArea}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {loading ? (
              <ActivityIndicator color={COLORS.zinc500} style={{ paddingVertical: 24 }} />
            ) : !items || items.length === 0 ? (
              <View style={{ paddingVertical: 32, alignItems: "center" }}>
                <Feather name="gift" size={28} color={COLORS.zinc300} />
                <Text style={s.empty}>
                  {t("feed.giftReceiptsEmpty", {
                    defaultValue: "아직 받은 선물이 없어요",
                  })}
                </Text>
              </View>
            ) : (
              items.map((it, idx) => (
                <View key={`${it.giftId}-${it.sender}-${idx}`} style={s.row}>
                  <View style={s.iconBox}>
                    <Feather name="gift" size={16} color="#a78bfa" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.giftName}>{it.giftName}</Text>
                    <Text style={s.sender}>{it.sender}</Text>
                  </View>
                  <Text style={s.count}>×{it.count}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </SwipeDownSheet>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  bottomOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,

    height: "50%",
    maxHeight: "80%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.zinc300,
    alignSelf: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.zinc900,
    textAlign: "center",
  },
  sub: {
    fontSize: 13,
    color: COLORS.zinc500,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
    marginBottom: 8,
  },
  summaryTotal: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.zinc900,
  },
  scrollArea: {
    minHeight: 120,
  },
  empty: {
    color: COLORS.zinc500,
    fontSize: 13,
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#a78bfa22",
    alignItems: "center",
    justifyContent: "center",
  },
  giftName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.zinc900,
  },
  sender: {
    fontSize: 12,
    color: COLORS.zinc500,
    marginTop: 2,
  },
  count: {
    fontSize: 14,
    fontWeight: "700",
    color: "#a78bfa",
  },
});
