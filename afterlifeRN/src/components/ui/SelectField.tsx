

import React, { useRef, useState, useCallback } from "react";
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
  Dimensions,
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

type Anchor = { top: number; left: number; width: number; below: boolean };

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
  dropdownMaxHeight = 280,
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const boxRef = useRef<View>(null);
  const selected = options.find((o) => o.value === value);

  const openDropdown = useCallback(() => {
    boxRef.current?.measureInWindow((x, y, width, height) => {
      const screenH = Dimensions.get("window").height;
      const spaceBelow = screenH - (y + height);
      const spaceAbove = y;

      const below = spaceBelow >= 160 || spaceBelow >= spaceAbove;
      setAnchor({
        top: below ? y + height + 4 : y - 4,
        left: x,
        width,
        below,
      });
      setOpen(true);
    });
  }, []);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        ref={boxRef as React.MutableRefObject<View>}
        style={[styles.selectBox, { borderRadius: rounded }]}
        onPress={openDropdown}
        activeOpacity={0.7}
      >
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <Text style={[styles.selectText, !selected && styles.placeholder]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Feather
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={COLORS.zinc400}
        />
      </TouchableOpacity>
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          {anchor && (
            <Pressable
              style={[
                styles.dropdown,
                {
                  position: "absolute",
                  top: anchor.below ? anchor.top : undefined,
                  bottom: anchor.below
                    ? undefined
                    : Dimensions.get("window").height - anchor.top,
                  left: anchor.left,
                  width: anchor.width,
                  maxHeight: dropdownMaxHeight,
                },
              ]}
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
          )}
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
    backgroundColor: "rgba(0,0,0,0.08)",
  },

  dropdown: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  itemActive: { backgroundColor: COLORS.zinc50 },
  itemLast: { borderBottomWidth: 0 },
  itemText: { fontSize: 14, color: COLORS.zinc700 },
  itemTextActive: { color: COLORS.zinc900, fontWeight: "600" },
});
