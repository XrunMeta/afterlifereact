

import React from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { COLORS, RADIUS } from "../../../components/constants";
import Button from "../../../components/ui/Button";
import type { Visibility } from "../../../types/clone";

interface Props {
  visible: boolean;
  currentVisibility: Visibility | null;

  onSelect: (v: Visibility) => void;
  onClose: () => void;
}

const OPTIONS: Visibility[] = ["public", "followers", "selected", "private"];

function iconOf(v: Visibility): keyof typeof Feather.glyphMap {
  switch (v) {
    case "public": return "globe";
    case "followers": return "users";
    case "selected": return "user-check";
    case "private": return "lock";
  }
}

export default function VisibilityPickerModal({
  visible,
  currentVisibility,
  onSelect,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const labelOf = (v: Visibility) => {
    switch (v) {
      case "public": return t("dashboard.visibilityPublic", { defaultValue: "전체 공개" });
      case "followers": return t("dashboard.visibilityFollowers", { defaultValue: "팔로워만" });
      case "selected": return t("dashboard.visibilitySelected", { defaultValue: "특정 친구" });
      case "private": return t("dashboard.visibilityPrivate", { defaultValue: "나만 보기" });
    }
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.box} onPress={(e) => e.stopPropagation()}>
          <Text style={s.title}>
            {t("dashboard.visibilityChooseTitle", { defaultValue: "공개 범위" })}
          </Text>
          <Text style={s.desc}>
            {t("dashboard.visibilityChooseDesc", { defaultValue: "이 클론을 누구에게 보일까요?" })}
          </Text>
          <View style={s.options}>
            {OPTIONS.map((v) => {
              const selected = currentVisibility === v;
              return (
                <TouchableOpacity
                  key={v}
                  style={[s.option, selected && s.optionSelected]}
                  onPress={() => onSelect(v)}
                >
                  <Feather
                    name={iconOf(v)}
                    size={16}
                    color={selected ? COLORS.white : COLORS.zinc700}
                  />
                  <Text style={[s.optionText, selected && { color: COLORS.white }]}>
                    {labelOf(v)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Button
            title={t("common.cancel")}
            variant="ghost"
            onPress={onClose}
            style={{ marginTop: 12, width: "100%" }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  box: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.zinc900,
    textAlign: "center",
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    color: COLORS.zinc600,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  options: { gap: 8, width: "100%" },
  option: {
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.zinc100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  optionSelected: { backgroundColor: COLORS.zinc900 },
  optionText: { fontSize: 14, fontWeight: "500", color: COLORS.zinc700 },
});
