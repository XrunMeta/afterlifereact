

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

export default function ActionSheet({ visible, actions, onClose }: Props) {

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation?.()}>
          {actions.map((a, i) => (
            <React.Fragment key={`${a.label}-${i}`}>
              {i > 0 ? <View style={styles.divider} /> : null}
              <Pressable
                style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
                onPress={() => { onClose(); setTimeout(a.onPress, 100); }}
                android_ripple={{ color: "rgba(0,0,0,0.05)" }}
              >
                {a.icon ? (
                  <Feather
                    name={a.icon}
                    size={22}
                    color={a.style === "destructive" ? "#ef4444" : COLORS.zinc800}
                  />
                ) : (
                  <View style={{ width: 22 }} />
                )}
                <Text style={[styles.actionLabel, a.style === "destructive" && styles.actionLabelDestructive]}>
                  {a.label}
                </Text>
              </Pressable>
            </React.Fragment>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  sheet: {
    width: 260,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  actionRowPressed: {
    backgroundColor: COLORS.zinc100,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.zinc100,
    marginHorizontal: 18,
  },
  actionLabel: {
    fontSize: 15,
    color: COLORS.zinc900,
    fontWeight: "500",
  },
  actionLabelDestructive: {
    color: "#ef4444",
    fontWeight: "600",
  },
});
