

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES, RADIUS } from "../constants";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SelectFieldProps<T extends string = string> {
  options: SelectOption<T>[];
  value: T | "";
  onChange: (value: T) => void;
  placeholder?: string;
  label?: string;
  errorText?: string;
  leftIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  rounded?: number;

  dropdownMaxHeight?: number;
}

export default function SelectField<T extends string = string>({
  options,
  value,
  onChange,
  placeholder = "선택",
  label,
  errorText,
  leftIcon,
  containerStyle,
  rounded = 10,
  dropdownMaxHeight = 400,
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.selectBox, { borderRadius: rounded }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <Text style={[styles.selectText, !selected && styles.placeholder]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Feather name="chevron-down" size={18} color={COLORS.zinc400} />
      </TouchableOpacity>
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.dropdownBox, { maxHeight: dropdownMaxHeight }]}
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView
              style={{ maxHeight: dropdownMaxHeight }}
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
            >
              {options.map((opt, idx) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.item,
                    value === opt.value && styles.itemActive,
                    idx === options.length - 1 && styles.itemLast,
                  ]}
                  onPress={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.itemText,
                      value === opt.value && styles.itemTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {value === opt.value && (
                    <Feather name="check" size={16} color={COLORS.zinc900} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: "stretch" },
  label: {
    fontSize: 14,
    color: COLORS.mutedText,
    marginBottom: SIZES.small / 2,
    fontFamily: FONTS.medium,
  },
  selectBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.medium,
  },
  leftIcon: { marginRight: SIZES.small },
  selectText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontFamily: FONTS.regular,
  },
  placeholder: { color: COLORS.placeholder },
  errorText: {
    marginTop: SIZES.small / 2,
    fontSize: 12,
    color: COLORS.error,
    fontFamily: FONTS.medium,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  dropdownBox: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    width: "100%",
    maxWidth: 360,
    overflow: "hidden",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  itemActive: { backgroundColor: COLORS.zinc50 },
  itemLast: { borderBottomWidth: 0 },
  itemText: { fontSize: 15, color: COLORS.zinc700 },
  itemTextActive: { color: COLORS.zinc900, fontWeight: "600" },
});
