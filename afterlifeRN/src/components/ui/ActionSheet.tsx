

import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
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

  anchorY?: number;
}

export default function ActionSheet({ visible, actions, onClose, anchorY }: Props) {

  const { height: screenH } = useWindowDimensions();
  const sheetEstimatedH = Math.min(actions.length * 48 + 20, 260); 
  let anchorTop: number | undefined;
  if (anchorY != null) {
    const spaceBelow = screenH - anchorY;
    if (spaceBelow >= sheetEstimatedH + 40) anchorTop = anchorY + 8; 
    else anchorTop = Math.max(60, anchorY - sheetEstimatedH - 8); 
  }
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {}
      <View style={StyleSheet.absoluteFillObject}>
        {}
        <Pressable style={styles.backdrop} onPress={onClose} />
        {}
        <View
          style={[
            styles.anchorLayer,
            anchorTop != null
              ? { justifyContent: "flex-start", alignItems: "flex-start", paddingTop: anchorTop, paddingLeft: 20 }
              : { justifyContent: "center", alignItems: "center" },
          ]}
          pointerEvents="box-none"
        >
          <Pressable style={styles.sheetWrap} onPress={(e) => e.stopPropagation?.()}>
            {
}
            <BlurView
              intensity={60}
              tint="light"
              experimentalBlurMethod="dimezisBlurView"
              style={styles.blur}
            >
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
            </BlurView>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({

  backdrop: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor: "rgba(0,0,0,0.1)",
  },

  anchorLayer: {
    ...StyleSheet.absoluteFillObject,
  },

  sheetWrap: {
    width: 240,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,

    backgroundColor: Platform.OS === "android" ? "rgba(255,255,255,0.85)" : "transparent",
  },
  blur: {
    width: "100%",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionRowPressed: {
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginHorizontal: 14,
  },
  actionLabel: {
    fontSize: 15,
    color: "#000000",
    fontWeight: "500",
  },
  actionLabelDestructive: {
    color: "#ed4956",
    fontWeight: "600",
  },
});
