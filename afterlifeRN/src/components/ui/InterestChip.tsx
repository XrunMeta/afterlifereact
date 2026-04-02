import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { COLORS, RADIUS } from "../constants";

interface InterestChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  variant?: "default" | "filter" | "tag";
}

const InterestChip: React.FC<InterestChipProps> = ({
  label,
  selected,
  onPress,
  variant = "default",
}) => {
  if (variant === "tag") {
    return (
      <Text style={styles.tag}>#{label}</Text>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        variant === "filter" ? styles.filterChip : styles.chip,
        selected && (variant === "filter" ? styles.filterChipSelected : styles.chipSelected),
      ]}
      activeOpacity={0.7}
    >
      <Text
        style={[
          variant === "filter" ? styles.filterText : styles.text,
          selected && styles.textSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.zinc100,
  },
  chipSelected: {
    backgroundColor: COLORS.zinc900,
  },
  text: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.zinc700,
  },
  textSelected: {
    color: COLORS.white,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.zinc100,
  },
  filterChipSelected: {
    backgroundColor: COLORS.violet500,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.zinc700,
    textAlign: "center",
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(0,0,0,0.2)",
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.white,
    overflow: "hidden",
  },
});

export default InterestChip;
