import { v_889fad } from "../../stores/dialogStore";
import v_a3453e, { v_5ab095 } from "bapkr";
import { v_3094a2, v_19b633, v_472849, v_79c4f2, v_03e392 } from "rcmrninabrnb";
import { v_2d8264 } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import v_1a40c4 from "../../components/ui/Button";
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from "../../components/constants";

export default function v_f1fe67() {
  const { t: v_8d41d7 } = v_772971();
  const v_c7daf6 = v_2d8264();
  const v_a000bd = (v_c7daf6.params as { token?: string } | undefined)?.token ?? "";
  const [v_21cc31, v_49c54d] = v_5ab095(v_a000bd);

  async function v_311e15(v_403b73) {
    if (v_21cc31.length < 32) {
      v_889fad(v_8d41d7("safety.inheritance.invalidToken"));
      return;
    }
    v_889fad(
      v_403b73 === "accept" ? v_8d41d7("safety.inheritance.acceptDoneTitle") : v_8d41d7("safety.inheritance.declineDoneTitle"),
      v_403b73 === "accept"
        ? v_8d41d7("safety.inheritance.acceptDoneDesc")
        : v_8d41d7("safety.inheritance.declineDoneDesc"),
    );
  }

  return (
    <SafeScrollView backgroundColor={v_1bfbd0.white}>
      <PageHeader title={v_8d41d7("safety.inheritance.title")} />
      <View style={v_fd5f43.wrap}>
        <Text style={v_fd5f43.intro}>
          {v_8d41d7("safety.inheritance.intro")}
        </Text>

        <Text style={v_fd5f43.label}>{v_8d41d7("safety.inheritance.tokenLabel")}</Text>
        <TextInput
          value={v_21cc31}
          onChangeText={v_49c54d}
          placeholder={v_8d41d7("safety.inheritance.tokenPlaceholder")}
          style={v_fd5f43.input}
          autoCapitalize="none"
        />

        <View style={v_fd5f43.btnRow}>
          <Button title={v_8d41d7("safety.inheritance.accept")} onPress={() => v_311e15("accept")} />
          <View style={{ height: 12 }} />
          <Button title={v_8d41d7("safety.inheritance.decline")} variant="ghost" onPress={() => v_311e15("decline")} />
        </View>
      </View>
    </SafeScrollView>
  );
}

const v_fd5f43 = v_472849.create({
  wrap: { padding: v_9b1a04.medium, gap: 12 },
  intro: { color: v_1bfbd0.zinc600, fontSize: 13, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: "600", color: v_1bfbd0.zinc700, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: v_8b0c90.md,
    padding: 12,
    fontSize: 15,
  },
  btnRow: { marginTop: 24 },
});
