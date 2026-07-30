

import v_a3453e, { v_e662ae } from "bapkr";
import { v_3094a2, v_19b633, v_79c4f2, v_09d0e5, v_4623af, v_472849 } from "rcmrninabrnb";
import { v_772971 } from "jmpfvteuuztnp";
import v_1a40c4 from "../ui/Button";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../constants";

const v_09875d = [0, 1, 2, 3, 4, 5];

export function v_c67c5c({
  value: v_3b402b,
  onChange: v_b187d9,
  autoFocus: v_f04c26,
  editable: v_87d063 = true,
  onComplete: v_9397ad,
  masked: v_0b292c = false,
}: {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
  editable?: boolean;
  onComplete?: () => void;

  masked?: boolean;
}) {
  const v_32f473 = v_e662ae<v_79c4f2>(null);

  void v_9397ad;
  return (
    <Pressable style={v_fd5f43.cellRow} onPress={() => v_32f473.current?.focus()}>
      {v_09875d.map((v_ebec57) => {
        const v_620da0 = v_3b402b[v_ebec57] ?? "";
        const v_f8b770 = v_ebec57 === v_3b402b.length || (v_ebec57 === v_09875d.length - 1 && v_3b402b.length === v_09875d.length);
        return (
          <View key={v_ebec57} style={[v_fd5f43.cell, v_620da0 ? v_fd5f43.cellFilled : null, v_f8b770 ? v_fd5f43.cellActive : null]}>
            <Text style={v_fd5f43.cellText}>{v_620da0 ? (v_0b292c ? "●" : v_620da0) : ""}</Text>
          </View>
        );
      })}
      {}
      <TextInput
        ref={v_32f473}
        value={v_3b402b}
        onChangeText={(v_c70495) => {
          const v_e6d4a6 = v_c70495.replace(/\D/g, "").slice(0, 6);
          v_b187d9(v_e6d4a6);

        }}
        keyboardType="number-pad"

        textContentType="none"
        autoComplete="off"
        importantForAutofill="no"
        secureTextEntry={v_0b292c}
        maxLength={6}
        autoFocus={v_f04c26}
        editable={v_87d063}
        caretHidden
        style={v_fd5f43.hiddenInput}
      />
    </Pressable>
  );
}

export default function v_92f073({
  title: v_9f1622,
  subtitle: v_dda473,
  email: v_e0c7e8,
  code: v_c99bd2,
  onChangeCode: v_5f4fb4,
  onSubmit: v_3bfe4c,
  submitting: v_cb66b4,
  submitLabel: v_4f9baa,
  submittingLabel: v_7ef19c,
  resendIn: v_600d5b,
  onResend: v_6ee6a9,
  resendLabel: v_94d343,
  footer: v_18f2fc,
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

  footer?: v_a3453e.ReactNode;
}) {
  const { t: v_8d41d7 } = v_772971();
  return (
    <View style={v_fd5f43.container}>
      <Text style={v_fd5f43.title}>{v_9f1622}</Text>
      {(v_dda473 || v_e0c7e8) && (
        <Text style={v_fd5f43.subtitle}>
          {v_dda473 ??
            v_8d41d7("otp.defaultSubtitle", {
              email: v_e0c7e8,
              defaultValue: "{{email}} 로 보낸 6자리 인증코드를 입력하세요.",
            })}
        </Text>
      )}

      <OtpCodeInput
        value={v_c99bd2}
        onChange={v_5f4fb4}
        autoFocus
        editable={!v_cb66b4}
        onComplete={v_3bfe4c}
      />

      <Button
        title={v_cb66b4 ? v_7ef19c ?? v_4f9baa : v_4f9baa}
        onPress={v_3bfe4c}
        disabled={v_cb66b4 || v_c99bd2.length !== 6}
      />

      {v_18f2fc}

      {typeof v_600d5b === "number" && v_6ee6a9 && (
        <View style={v_fd5f43.resendRow}>
          <TouchableOpacity onPress={v_6ee6a9} disabled={v_600d5b > 0}>
            <Text style={[v_fd5f43.resendLink, v_600d5b > 0 && v_fd5f43.resendDisabled]}>
              {v_600d5b > 0
                ? `${v_94d343 ?? v_8d41d7("otp.resend", { defaultValue: "코드 재발송" })} (${v_600d5b}s)`
                : v_94d343 ?? v_8d41d7("otp.resend", { defaultValue: "코드 재발송" })}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const v_fd5f43 = v_472849.create({
  container: { width: "100%", maxWidth: 480, gap: v_9b1a04.large, alignSelf: "center" },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
    textAlign: "center",
    marginTop: v_9b1a04.small,
  },
  subtitle: {
    fontSize: 14,
    color: v_1bfbd0.zinc600,
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
    borderColor: v_1bfbd0.zinc300,
    borderRadius: v_8b0c90.md,
    backgroundColor: v_1bfbd0.white,
    alignItems: "center",
    justifyContent: "center",
  },
  cellFilled: { borderColor: v_1bfbd0.zinc500 },
  cellActive: { borderColor: v_1bfbd0.zinc900 },
  cellText: { fontSize: 24, fontWeight: "700", color: v_1bfbd0.zinc900 },

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
    marginTop: v_9b1a04.small,
  },
  resendLink: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
  resendDisabled: { color: v_1bfbd0.zinc400 },
});
