

import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../constants";

export interface ActionSheetAction {

  label: string;

  icon?: React.ComponentProps<typeof Feather>["name"];

  style?: "default" | "destructive";
  onPress: () => void;
}

interface Props {
  visible: boolean;
  title?: string;

  subtitle?: string;
  actions: ActionSheetAction[];
  onClose: () => void;
}

export default function ActionSheet({ visible, title, subtitle, actions, onClose }: Props) {
  const { height } = useWindowDimensions();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { maxHeight: height * 0.6 }]} onPress={(e) => e.stopPropagation?.()}>
          {}
          <View style={styles.handle} />
          {title || subtitle ? (
            <View style={styles.header}>
              {title ? <Text style={styles.title}>{title}</Text> : null}
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
          ) : null}
          {actions.map((a, i) => (
            <React.Fragment key={`${a.label}-${i}`}>
              {i > 0 ? <View style={styles.divider} /> : null}
              <Pressable
                style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
                onPress={() => { onClose(); setTimeout(a.onPress, 100); }}
                android_ripple={{ color: "rgba(0,0,0,0.05)" }}
              >
                <Text style={[styles.actionLabel, a.style === "destructive" && styles.actionLabelDestructive]}>
                  {a.label}
                </Text>
                {a.icon ? (
                  <Feather
                    name={a.icon}
                    size={20}
                    color={a.style === "destructive" ? "#ef4444" : COLORS.zinc600}
                  />
                ) : null}
              </Pressable>
            </React.Fragment>
          ))}
          {}
          <View style={styles.cancelGroup}>
            <Pressable
              style={({ pressed }) => [styles.cancelRow, pressed && styles.actionRowPressed]}
              onPress={onClose}
              android_ripple={{ color: "rgba(0,0,0,0.05)" }}
            >
              <Text style={styles.cancelLabel}>취소</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,

    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.zinc200,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  title: { fontSize: 15, fontWeight: "600", color: COLORS.zinc900 },
  subtitle: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  actionRowPressed: {
    backgroundColor: COLORS.zinc100,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.zinc100,
    marginHorizontal: 20,
  },
  actionLabel: {
    fontSize: 16,
    color: COLORS.zinc900,
    fontWeight: "500",
  },
  actionLabelDestructive: {
    color: "#ef4444",
    fontWeight: "600",
  },
  cancelGroup: {
    marginTop: 8,
    borderTopWidth: 6,
    borderTopColor: COLORS.zinc50 ?? "#f4f4f5",
  },
  cancelRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelLabel: {
    fontSize: 16,
    color: COLORS.zinc900,
    fontWeight: "600",
  },
});
