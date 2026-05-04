import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { COLORS, SIZES } from "../constants";

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  stepInfo?: { current: number; total: number };
  rightAction?: React.ReactNode;
  transparent?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  stepInfo,
  rightAction,
  transparent = false,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,

        { paddingTop: insets.top },
        transparent && styles.transparent,
      ]}
    >
      <View style={styles.row}>
        {}
        <View style={styles.left}>
          {showBackButton && (
            <TouchableOpacity
              onPress={onBackPress}
              style={styles.backButton}
            >
              <Feather name="arrow-left" size={24} color={transparent ? COLORS.white : COLORS.zinc900} />
            </TouchableOpacity>
          )}
        </View>

        {}
        <View style={styles.center}>
          {stepInfo && (
            <Text style={[styles.stepText, transparent && styles.whiteText]}>
              STEP {stepInfo.current}/{stepInfo.total}
            </Text>
          )}
          {title && (
            <Text
              style={[styles.title, transparent && styles.whiteText]}
              numberOfLines={1}
            >
              {title}
            </Text>
          )}
          {subtitle && (
            <Text style={[styles.subtitle, transparent && styles.whiteSubtext]}>
              {subtitle}
            </Text>
          )}
        </View>

        {}
        <View style={styles.right}>
          {rightAction}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc200,
    paddingBottom: 12,
    paddingHorizontal: SIZES.medium,
  },
  transparent: {
    backgroundColor: "transparent",
    borderBottomWidth: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
  },
  left: {
    width: 44,
    alignItems: "flex-start",
  },
  center: {
    flex: 1,

  },
  right: {
    width: 44,
    alignItems: "flex-end",
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  stepText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.violet500,
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.zinc900,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.zinc500,
    marginTop: 2,
  },
  whiteText: {
    color: COLORS.white,
  },
  whiteSubtext: {
    color: "rgba(255,255,255,0.8)",
  },
});

export default PageHeader;
