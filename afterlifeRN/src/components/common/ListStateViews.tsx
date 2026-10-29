

import v_a3453e from "bapkr";
import { v_39a996, v_472849, v_19b633, v_4623af, v_3094a2, type v_7e4944 } from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import { v_1bfbd0 } from "../constants";

export function v_d030b7({ testID: v_681472, style: v_7fa4e4 }: { testID?: string; style?: v_7e4944 }) {
  const { t: v_8d41d7 } = v_772971();
  return (
    <View testID={v_681472} style={[v_fd5f43.wrap, v_7fa4e4]}>
      <ActivityIndicator color={v_1bfbd0.zinc400} />
      <Text style={v_fd5f43.desc}>{v_8d41d7("common.loading", { defaultValue: "불러오는 중..." })}</Text>
    </View>
  );
}

export function v_1c036d({
  title: v_9f1622,
  onRetry: v_09e13b,
  testID: v_681472,
  retryTestID: v_92dfe5,
  style: v_7fa4e4,
  dark: v_409505,
}: {

  title: string;
  onRetry: () => void;
  testID?: string;
  retryTestID?: string;
  style?: v_7e4944;

  dark?: boolean;
}) {
  const { t: v_8d41d7 } = v_772971();
  return (
    <View testID={v_681472} style={[v_fd5f43.wrap, v_7fa4e4]}>
      <Feather name="wifi-off" size={36} color={v_409505 ? v_1bfbd0.zinc500 : v_1bfbd0.zinc300} />
      <Text style={[v_fd5f43.title, v_409505 && { color: v_1bfbd0.zinc200 }]}>{v_9f1622}</Text>
      <TouchableOpacity
        testID={v_92dfe5}
        style={[v_fd5f43.retryBtn, v_409505 && { backgroundColor: v_1bfbd0.white }]}
        onPress={v_09e13b}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        <Text style={[v_fd5f43.retryText, v_409505 && { color: v_1bfbd0.zinc900 }]}>
          {v_8d41d7("common.retry", { defaultValue: "다시 시도" })}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const v_fd5f43 = v_472849.create({
  wrap: { alignItems: "center", justifyContent: "center", paddingVertical: 48, paddingHorizontal: 32, gap: 12 },
  title: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc700, textAlign: "center" },
  desc: { fontSize: 13, color: v_1bfbd0.zinc500, textAlign: "center" },
  retryBtn: { marginTop: 4, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: v_1bfbd0.zinc900 },
  retryText: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.white },
});
