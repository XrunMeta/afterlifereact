

import v_a3453e from "bapkr";
import {
  v_aa7413,
  v_3094a2,
  v_19b633,
  v_4623af,
  v_472849,
  v_f2c756,
  v_09d0e5,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import v_e84827 from "bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv";
import { v_1bfbd0, v_8b0c90 } from "../constants";

const v_b6c376 = "afterlife_payment_pin_dismissed_until";
const v_1a5fdc = 24 * 60 * 60 * 1000;
const v_23211e = "xrun://";

export async function v_b1f897(): Promise<boolean> {
  try {
    const v_479f05 = await v_e84827.getItem(v_b6c376);
    if (!v_479f05) return true;
    const v_604a0d = Number(v_479f05);
    if (!Number.isFinite(v_604a0d)) return true;
    return Date.now() >= v_604a0d;
  } catch {
    return true;
  }
}

async function v_a48f41(): Promise<void> {
  try {
    await v_e84827.setItem(v_b6c376, String(Date.now() + v_1a5fdc));
  } catch (v_49263d) {
    console.warn("[PIN-PROMPT] dismiss save failed:", v_49263d);
  }
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function v_3cb56d({ visible: v_cf55be, onClose: v_0890f8 }: Props) {
  const v_44c6f8 = async () => {
    try {
      const v_29eaf2 = await v_f2c756.canOpenURL(v_23211e);
      if (v_29eaf2) {
        await v_f2c756.openURL(v_23211e);
      }
    } catch (v_49263d) {
      console.warn("[PIN-PROMPT] open xrun failed:", v_49263d);
    }
    v_0890f8();
  };

  const v_e1f1e1 = async () => {
    await v_a48f41();
    v_0890f8();
  };

  return (
    <Modal visible={v_cf55be} transparent animationType="fade" onRequestClose={v_0890f8}>
      <Pressable style={v_fd5f43.overlay} onPress={v_0890f8}>
        <Pressable style={v_fd5f43.card} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
          <View style={v_fd5f43.iconCircle}>
            <Feather name="lock" size={28} color={v_1bfbd0.violet500} />
          </View>
          <Text style={v_fd5f43.title}>결제 비밀번호를 설정해주세요</Text>
          <Text style={v_fd5f43.body}>
            xrun 앱에서 6자리 결제 비밀번호를 등록해야 결제 기능을 사용할 수 있어요.
          </Text>

          <TouchableOpacity style={v_fd5f43.primaryBtn} onPress={v_44c6f8}>
            <Feather name="external-link" size={16} color={v_1bfbd0.white} />
            <Text style={v_fd5f43.primaryBtnText}>xrun 앱에서 설정하기</Text>
          </TouchableOpacity>

          <TouchableOpacity style={v_fd5f43.secondaryBtn} onPress={v_e1f1e1}>
            <Text style={v_fd5f43.secondaryBtnText}>오늘은 그만 보기</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const v_fd5f43 = v_472849.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: v_1bfbd0.white,
    borderRadius: v_8b0c90.lg,
    padding: 28,
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: v_1bfbd0.violet100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
    textAlign: "center",
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: v_1bfbd0.zinc600,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    paddingVertical: 14,
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.zinc900,
    marginBottom: 8,
  },
  primaryBtnText: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.white },
  secondaryBtn: {
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryBtnText: { fontSize: 14, color: v_1bfbd0.zinc500, fontWeight: "500" },
});
