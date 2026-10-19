

import v_a3453e from "bapkr";
import { v_aa7413, v_09d0e5, v_472849, v_19b633, v_4623af, v_3094a2 } from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import { v_1bfbd0, v_8b0c90, v_d43669, v_119e65 } from "../../../components/constants";
import v_1a40c4 from "../../../components/ui/Button";
import type { v_b0b271 } from "../../../types/clone";

interface Props {
  visible: boolean;
  currentVisibility: v_b0b271 | null;

  onSelect: (v: v_b0b271) => void;
  onClose: () => void;
}

const OPTIONS: v_b0b271[] = ["public", "followers", "selected", "private"];

function v_f15901(v: v_b0b271): keyof typeof v_dec439.glyphMap {
  switch (v_81e2ef) {
    case "public": return "globe";
    case "followers": return "users";
    case "selected": return "user-check";
    case "private": return "lock";
  }
}

export default function v_92380d({
  visible: v_cf55be,
  currentVisibility: v_20c675,
  onSelect: v_3ac615,
  onClose: v_0890f8,
}: Props) {
  const { t: v_8d41d7 } = v_772971();
  const v_90148e = (v: v_b0b271) => {
    switch (v_81e2ef) {
      case "public": return v_8d41d7("dashboard.visibilityPublic", { defaultValue: "전체 공개" });
      case "followers": return v_8d41d7("dashboard.visibilityFollowers", { defaultValue: "팔로워만" });
      case "selected": return v_8d41d7("dashboard.visibilitySelected", { defaultValue: "특정 친구" });
      case "private": return v_8d41d7("dashboard.visibilityPrivate", { defaultValue: "나만 보기" });
    }
  };
  return (
    <Modal visible={v_cf55be} transparent animationType="fade" onRequestClose={v_0890f8}>
      <Pressable style={v_fd5f43.overlay} onPress={v_0890f8}>
        <Pressable style={v_fd5f43.box} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
          <Text style={v_fd5f43.title}>
            {v_8d41d7("dashboard.visibilityChooseTitle", { defaultValue: "공개 범위" })}
          </Text>
          <Text style={v_fd5f43.desc}>
            {v_8d41d7("dashboard.visibilityChooseDesc", { defaultValue: "이 클론을 누구에게 보일까요?" })}
          </Text>
          <View style={v_fd5f43.options}>
            {v_95825a.map((v_81e2ef) => {
              const v_587413 = v_20c675 === v_81e2ef;
              return (
                <TouchableOpacity
                  key={v_81e2ef}
                  style={[v_fd5f43.option, v_587413 && v_fd5f43.optionSelected]}
                  onPress={() => v_3ac615(v_81e2ef)}
                >
                  <Feather
                    name={v_f15901(v_81e2ef)}
                    size={16}
                    color={v_587413 ? v_1bfbd0.white : v_1bfbd0.zinc700}
                  />
                  <Text style={[v_fd5f43.optionText, v_587413 && { color: v_1bfbd0.white }]}>
                    {v_90148e(v_81e2ef)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Button
            title={v_8d41d7("common.cancel")}
            variant="ghost"
            onPress={v_0890f8}
            style={{ marginTop: 12, width: "100%" }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const v_fd5f43 = v_472849.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  box: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: v_1bfbd0.zinc900,
    textAlign: "center",
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    color: v_1bfbd0.zinc600,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  options: { gap: 8, width: "100%" },
  option: {
    ...v_d43669.md,
    backgroundColor: v_1bfbd0.zinc100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  optionSelected: { backgroundColor: v_1bfbd0.zinc900 },
  optionText: { ...v_119e65.md, color: v_1bfbd0.zinc700 },
});
