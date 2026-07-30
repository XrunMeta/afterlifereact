

import v_a3453e from "bapkr";
import {
  v_aa7413,
  v_3094a2,
  v_19b633,
  v_4623af,
  v_472849,
  v_f2c756,
  v_09d0e5,
  v_326be8,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import v_e84827 from "bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv";
import * as v_fba5a0 from "hfxxehldoiokdq";
import { v_772971 } from "jmpfvteuuztnp";
import { v_1bfbd0, v_8b0c90 } from "../constants";
import { v_1ed7d9 } from "../../stores/authStore";

const v_b6c376 = "afterlife_payment_pin_dismissed_until";
const v_1a5fdc = 24 * 60 * 60 * 1000;
const v_6847f9 = "xrun://";

function v_6fa927(v_e0c7e8): string {
  if (!v_e0c7e8) return v_6847f9;
  return `${v_6847f9}?email=${encodeURIComponent(v_e0c7e8)}&from=afterlife`;
}

export async function v_b1f897(): Promise<boolean> {

  try {
    const v_604a0d = await v_e84827.getItem(v_b6c376);
    if (v_604a0d && Number(v_604a0d) > Date.now()) return false;
  } catch (v_49263d) {
    console.warn("[PIN-PROMPT] read dismiss failed:", v_49263d);
  }
  return true;
}

async function v_a48f41(): Promise<void> {
  try {
    await v_e84827.setItem(v_b6c376, String(Date.now() + v_1a5fdc));
  } catch (v_49263d) {
    console.warn("[PIN-PROMPT] write dismiss failed:", v_49263d);
  }
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function v_3cb56d({ visible: v_cf55be, onClose: v_0890f8 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const v_e0c7e8 = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser?.email ?? null);

  const v_44c6f8 = async () => {

    if (v_e0c7e8) {
      try {
        await v_fba5a0.setStringAsync(v_e0c7e8);
        console.log("[PIN-PROMPT] email copied to clipboard");
      } catch (v_49263d) {
        console.warn("[PIN-PROMPT] clipboard set failed:", v_49263d);
      }
    }

    const v_2208dc = v_6fa927(v_e0c7e8);
    try {
      await v_f2c756.openURL(v_2208dc);
      v_0890f8();
    } catch (v_49263d) {
      console.warn("[PIN-PROMPT] open xrun failed:", v_49263d);

      const v_b71a74 =
        v_326be8.OS === "ios"
          ? "https://apps.apple.com/app/xrun/id1602489406"
          : "https://play.google.com/store/apps/details?id=run.xrun.xrunapp";
      try {
        await v_f2c756.openURL(v_b71a74);
      } catch {

      }
      v_0890f8();
    }
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
          <Text style={v_fd5f43.title}>
            {v_8d41d7("settings.paymentPin.promptTitle", { defaultValue: "XRUN PIN를 설정해주세요" })}
          </Text>
          <Text style={v_fd5f43.body}>
            {v_8d41d7("settings.paymentPin.promptDesc", {
              defaultValue: "xrun 앱에서 6자리 XRUN PIN를 등록해야 결제 기능을 사용할 수 있어요.",
            })}
          </Text>

          <TouchableOpacity style={v_fd5f43.primaryBtn} onPress={v_44c6f8}>
            <Feather name="external-link" size={16} color={v_1bfbd0.white} />
            <Text style={v_fd5f43.primaryBtnText}>
              {v_8d41d7("settings.paymentPin.promptOpen", { defaultValue: "xrun 앱에서 설정하기" })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={v_fd5f43.secondaryBtn} onPress={v_e1f1e1}>
            <Text style={v_fd5f43.secondaryBtnText}>
              {v_8d41d7("settings.paymentPin.promptDismiss", { defaultValue: "오늘은 그만 보기" })}
            </Text>
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
