

import v_a3453e, { v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_aa7413,
  v_3094a2,
  v_19b633,
  v_79c4f2,
  v_4623af,
  v_472849,
  v_09d0e5,
  v_e767d1,
  v_0e1f26,
  v_326be8,
  v_e45a99,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import { v_1bfbd0, v_8b0c90 } from "../constants";

interface Props {
  visible: boolean;
  targetName?: string;

  targetKind?: "clone" | "comment" | "post";
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

const v_87edf7 = 500;

export default function v_4d58d7({
  visible: v_cf55be,
  targetName: v_8a1135,
  targetKind: v_6a1be1 = "clone",
  onConfirm: v_e2be2d,
  onCancel: v_c7001c,
}: Props) {
  const { t: v_8d41d7 } = v_772971();
  const [v_58ca36, v_b6141f] = v_5ab095("");

  const [v_7e4acc, v_de86c2] = v_5ab095(0);
  const { height: v_5a448f } = v_e45a99();

  v_c4deb2(() => {
    if (v_cf55be) v_b6141f("");
  }, [v_cf55be]);

  v_c4deb2(() => {
    const v_53f5d7 = v_0e1f26.addListener(
      v_326be8.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (v_9e86fd) => v_de86c2(v_9e86fd.endCoordinates.height),
    );
    const v_52528b = v_0e1f26.addListener(
      v_326be8.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => v_de86c2(0),
    );
    return () => {
      v_53f5d7.remove();
      v_52528b.remove();
    };
  }, []);

  const v_fbb22a = () => {
    v_0e1f26.dismiss();
    v_e2be2d(v_58ca36.trim());
  };

  const v_cd2551 = () => {
    if (v_7e4acc > 0) {
      v_0e1f26.dismiss();
    } else {
      v_c7001c();
    }
  };

  return (
    <Modal visible={v_cf55be} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={v_326be8.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <Pressable style={v_d81136.overlay} onPress={v_cd2551}>
          <Pressable
            style={[
              v_d81136.box,

              v_326be8.OS === "android" && v_7e4acc > 0
                ? { marginBottom: Math.min(v_7e4acc - 24, v_5a448f * 0.4) }
                : null,
            ]}
            onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}
          >
            {}
            {}
            <Text style={v_d81136.title}>{
              v_6a1be1 === "comment" ? v_8d41d7("report.titleComment", { defaultValue: "댓글 신고하기" })
              : v_6a1be1 === "post" ? v_8d41d7("report.titlePost", { defaultValue: "게시물 신고하기" })
              : v_8d41d7("report.title", { defaultValue: "신고하기" })
            }</Text>
            <Text style={v_d81136.desc}>
              {v_6a1be1 === "comment" ? (
                v_8a1135
                  ? v_8d41d7("report.descCommentWithName", { name: v_8a1135, defaultValue: "'{{name}}' 님의 댓글을 신고하는 사유를 입력해 주세요." })
                  : v_8d41d7("report.descCommentNoName", { defaultValue: "댓글을 신고하는 사유를 입력해 주세요." })
              ) : v_6a1be1 === "post" ? (
                v_8a1135
                  ? v_8d41d7("report.descPostWithName", { name: v_8a1135, defaultValue: "'{{name}}' 님의 게시물을 신고하는 사유를 입력해 주세요." })
                  : v_8d41d7("report.descPostNoName", { defaultValue: "게시물을 신고하는 사유를 입력해 주세요." })
              ) : (
                v_8a1135
                  ? v_8d41d7("report.descWithName", {
                      name: v_8a1135,
                      defaultValue: "'{{name}}' 클론을 신고하는 사유를\n간단히 입력해주세요. (선택)",
                    })
                  : v_8d41d7("report.descNoName", {
                      defaultValue: "클론을 신고하는 사유를\n간단히 입력해주세요. (선택)",
                    })
              )}
            </Text>
            <TextInput
              style={v_d81136.input}
              value={v_58ca36}
              onChangeText={(v_81e2ef) => v_b6141f(v_81e2ef.slice(0, v_87edf7))}
              placeholder={v_8d41d7("report.placeholder", { defaultValue: "예: 부적절한 내용, 사칭, 스팸 등" })}
              placeholderTextColor={v_1bfbd0.zinc400}
              multiline
              numberOfLines={4}
              maxLength={v_87edf7}
              textAlignVertical="top"
            />
            <Text style={v_d81136.counter}>
              {v_58ca36.length}/{v_87edf7}
            </Text>
            <View style={v_d81136.btns}>
              <TouchableOpacity style={v_d81136.cancel} onPress={v_c7001c}>
                <Text style={v_d81136.cancelText}>{v_8d41d7("common.cancel", { defaultValue: "취소" })}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={v_d81136.confirm} onPress={v_fbb22a}>
                <Text style={v_d81136.confirmText}>{v_8d41d7("report.submit", { defaultValue: "신고하기" })}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const v_d81136 = v_472849.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  box: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: v_1bfbd0.white,
    borderRadius: v_8b0c90.lg,
    padding: 24,
    alignItems: "center",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
    marginBottom: 6,
  },
  desc: {
    fontSize: 13,
    color: v_1bfbd0.zinc600,
    marginBottom: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  input: {
    width: "100%",
    minHeight: 100,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: v_8b0c90.md,
    padding: 12,
    fontSize: 14,
    color: v_1bfbd0.zinc900,
    backgroundColor: v_1bfbd0.zinc50 ?? v_1bfbd0.zinc100,
  },
  counter: {
    alignSelf: "flex-end",
    fontSize: 11,
    color: v_1bfbd0.zinc400,
    marginTop: 4,
    marginBottom: 12,
  },
  btns: { flexDirection: "row", gap: 8, width: "100%" },
  cancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: v_8b0c90.md,
    backgroundColor: v_1bfbd0.zinc100,
    alignItems: "center",
  },
  cancelText: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc700 },
  confirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: v_8b0c90.md,
    backgroundColor: "#ef4444",
    alignItems: "center",
  },
  confirmText: { fontSize: 14, fontWeight: "700", color: v_1bfbd0.white },
});
