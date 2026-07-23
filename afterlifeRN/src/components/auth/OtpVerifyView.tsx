

import React, { useRef } from "react";
import { View, Text, TextInput, Pressable, TouchableOpacity, StyleSheet } from "react-native";
import Button from "../ui/Button";
import { COLORS, SIZES, RADIUS } from "../constants";

const CELLS = [0, 1, 2, 3, 4, 5];

export function OtpCodeInput({
  value,
  onChange,
  autoFocus,
  editable = true,
  onComplete,
  masked = false,
}: {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
  editable?: boolean;
  onComplete?: () => void;

  masked?: boolean;
}) {
  const inputRef = useRef<TextInput>(null);

  void onComplete;
  return (
    <Pressable style={s.cellRow} onPress={() => inputRef.current?.focus()}>
      {CELLS.map((i) => {
        const char = value[i] ?? "";
        const active = i === value.length || (i === CELLS.length - 1 && value.length === CELLS.length);
        return (
          <View key={i} style={[s.cell, char ? s.cellFilled : null, active ? s.cellActive : null]}>
            <Text style={s.cellText}>{char ? (masked ? "●" : char) : ""}</Text>
          </View>
        );
      })}
      {}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(txt) => {
          const digits = txt.replace(/\D/g, "").slice(0, 6);
          onChange(digits);

        }}
        keyboardType="number-pad"

        textContentType="none"
        autoComplete="off"
        importantForAutofill="no"
        secureTextEntry={masked}
        maxLength={6}
        autoFocus={autoFocus}
        editable={editable}
        caretHidden
        style={s.hiddenInput}
      />
    </Pressable>
  );
}

export default function OtpVerifyView({
  title,
  subtitle,
  email,
  code,
  onChangeCode,
  onSubmit,
  submitting,
  submitLabel,
  submittingLabel,
  resendIn,
  onResend,
  resendLabel,
  footer,
}: {
  title: string;

  subtitle?: string;
  email?: string;
  code: string;
  onChangeCode: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitLabel: string;
  submittingLabel?: string;

  resendIn?: number;
  onResend?: () => void;
  resendLabel?: string;

  footer?: React.ReactNode;
}) {
  return (
    <View style={s.container}>
      <Text style={s.title}>{title}</Text>
      {(subtitle || email) && (
        <Text style={s.subtitle}>
          {subtitle ?? `${email} 로 보낸 6자리 인증코드를 입력하세요.`}
        </Text>
      )}

      <OtpCodeInput
        value={code}
        onChange={onChangeCode}
        autoFocus
        editable={!submitting}
        onComplete={onSubmit}
      />

      <Button
        title={submitting ? submittingLabel ?? submitLabel : submitLabel}
        onPress={onSubmit}
        disabled={submitting || code.length !== 6}
      />

      {footer}

      {typeof resendIn === "number" && onResend && (
        <View style={s.resendRow}>
          <TouchableOpacity onPress={onResend} disabled={resendIn > 0}>
            <Text style={[s.resendLink, resendIn > 0 && s.resendDisabled]}>
              {resendIn > 0
                ? `${resendLabel ?? "코드 재발송"} (${resendIn}s)`
                : resendLabel ?? "코드 재발송"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { width: "100%", maxWidth: 480, gap: SIZES.large, alignSelf: "center" },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.zinc900,
    textAlign: "center",
    marginTop: SIZES.small,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.zinc600,
    textAlign: "center",
    lineHeight: 22,
  },
  cellRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    position: "relative",
  },
  cell: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderColor: COLORS.zinc300,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  cellFilled: { borderColor: COLORS.zinc500 },
  cellActive: { borderColor: COLORS.zinc900 },
  cellText: { fontSize: 24, fontWeight: "700", color: COLORS.zinc900 },

  hiddenInput: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    color: "transparent",
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: SIZES.small,
  },
  resendLink: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900 },
  resendDisabled: { color: COLORS.zinc400 },
});
