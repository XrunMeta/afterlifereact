

import v_a3453e from "bapkr";
import { v_3094a2, v_19b633, v_472849 } from "rcmrninabrnb";
import { v_772971 } from "jmpfvteuuztnp";
import v_556baf from "../../components/ui/SafeView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_9b1a04 } from "../../components/constants";

export default function v_0035e1() {
  const { t: v_8d41d7 } = v_772971();
  return (
    <SafeView backgroundColor={v_1bfbd0.zinc50}>
      <PageHeader title={v_8d41d7("purchase.title", { defaultValue: "안내" })} />
      <View style={v_d81136.container}>
        <Text style={v_d81136.title}>
          {v_8d41d7("purchase.comingSoonTitle", { defaultValue: "준비 중입니다" })}
        </Text>
        <Text style={v_d81136.desc}>
          {v_8d41d7("purchase.comingSoonDesc", {
            defaultValue: "이 기능은 곧 제공될 예정입니다.",
          })}
        </Text>
      </View>
    </SafeView>
  );
}

const v_d81136 = v_472849.create({
  container: {
    flex: 1,
    padding: v_9b1a04.large,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
    marginBottom: v_9b1a04.small,
    textAlign: "center",
  },
  desc: {
    fontSize: 15,
    color: v_1bfbd0.zinc600,
    textAlign: "center",
    lineHeight: 22,
  },
});
