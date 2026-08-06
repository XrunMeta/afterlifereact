import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { COLORS, RADIUS } from "../constants";

type ButtonVariant = "primary" | "secondary" | "accent" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;

  onDisabledPress?: () => void;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;

  backgroundColor?: string;

  textColor?: string;

  testID?: string;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "lg",
  disabled = false,
  onDisabledPress,
  loading = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  backgroundColor,
  textColor,
  testID,
}) => {
  const containerStyle = [
    styles.base,
    sizeStyles[size],
    variantStyles[variant],
    disabled && styles.disabled,
    backgroundColor ? { backgroundColor } : undefined,
    style,
  ];

  const labelStyle = [
    styles.text,
    sizeTextStyles[size],
    variantTextStyles[variant],
    disabled && styles.disabledText,
    textColor ? { color: textColor } : undefined,
    textStyle,
  ];

  return (
    <TouchableOpacity
      testID={testID}
      onPress={disabled ? onDisabledPress : onPress}
      style={containerStyle}
      activeOpacity={disabled ? 1 : 0.8}

      disabled={loading || (disabled && !onDisabledPress)}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "secondary" || variant === "ghost" ? COLORS.zinc900 : COLORS.white}
          size="small"
        />
      ) : (
        <>
          {leftIcon}
          <Text style={labelStyle}>{title}</Text>
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: RADIUS.lg,
  },
  text: {
    fontWeight: "bold",
  },
  disabled: {
    backgroundColor: COLORS.zinc300,
    borderColor: COLORS.zinc300,
  },
  disabledText: {
    color: COLORS.zinc500,
  },
});

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: { height: 40, paddingHorizontal: 16 },
  md: { height: 48, paddingHorizontal: 20 },
  lg: { height: 56, paddingHorizontal: 24 },
};

const sizeTextStyles: Record<ButtonSize, TextStyle> = {
  sm: { fontSize: 13 },
  md: { fontSize: 14 },
  lg: { fontSize: 16 },
};

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: COLORS.zinc900,
  },
  secondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
  },
  accent: {
    backgroundColor: COLORS.violet500,
  },
  ghost: {
    backgroundColor: COLORS.zinc100,
  },
  danger: {
    backgroundColor: COLORS.error,
  },
};

const variantTextStyles: Record<ButtonVariant, TextStyle> = {
  primary: { color: COLORS.white },
  secondary: { color: COLORS.zinc900, fontWeight: "500" },
  accent: { color: COLORS.white },
  ghost: { color: COLORS.zinc700, fontWeight: "600" },
  danger: { color: COLORS.white },
};

export default Button;
