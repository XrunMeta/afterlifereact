

import v_a3453e from "bapkr";
import { v_3094a2, v_19b633, v_472849 } from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_650cfa } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_432191 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_2b51a5 } from "../../navigation/types";
import v_556baf from "../../components/ui/SafeView";
import v_1a40c4 from "../../components/ui/Button";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";

type Props = v_432191<v_2b51a5, "Step8">;

export default function v_d19b01({ navigation: v_c65f5d }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const v_704242 = () => {
    v_c65f5d.getParent()?.dispatch(
      v_650cfa.navigate({ name: "ClonesTab" }),
    );
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.white}>
      <View style={v_d81136.center}>
        <View style={v_d81136.successCircle}>
          <Feather name="check" size={48} color={v_1bfbd0.white} />
        </View>
        <Text style={v_d81136.title}>{v_8d41d7("create.step8.title", { defaultValue: "클론이 완성되었습니다" })}</Text>
        <Text style={v_d81136.subtitle}>
          {v_8d41d7("create.step8.subtitle", {
            defaultValue: "이제 클론과 대화하거나\n새 게시물을 올릴 수 있어요.",
          })}
        </Text>
      </View>

      <View style={v_d81136.bottomBar}>
        <Button
          title={v_8d41d7("create.step8.confirm", { defaultValue: "확인" })}
          onPress={v_704242}
          variant="accent"
        />
      </View>
    </SafeView>
  );
}

const v_d81136 = v_472849.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: v_9b1a04.xlarge,
    gap: 14,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: v_1bfbd0.violet500,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: "700", color: v_1bfbd0.zinc900, textAlign: "center" },
  subtitle: {
    fontSize: 14,
    color: v_1bfbd0.zinc500,
    textAlign: "center",
    lineHeight: 21,
  },
  bottomBar: {
    paddingHorizontal: v_9b1a04.xlarge,
    paddingVertical: v_9b1a04.medium,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: v_1bfbd0.zinc100,
  },

  _radiusRef: { borderRadius: v_8b0c90.md },
});
