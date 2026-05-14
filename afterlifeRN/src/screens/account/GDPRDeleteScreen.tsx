import { v_889fad } from "../../stores/dialogStore";
import v_a3453e, { v_5ab095 } from "bapkr";
import { v_3094a2, v_19b633, v_472849, v_79c4f2, v_03e392 } from "rcmrninabrnb";
import { v_772971 } from "jmpfvteuuztnp";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import v_1a40c4 from "../../components/ui/Button";
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from "../../components/constants";

export default function v_89f5f5() {
  const { t: v_8d41d7 } = v_772971();
  const v_80f3c7 = v_8d41d7("gdpr.phrase");
  const [v_ce9295, v_453fe1] = v_5ab095("");
  const [v_683210, v_34a50a] = v_5ab095(false);

  async function v_fbb22a() {
    if (v_ce9295.trim() !== v_80f3c7) {
      v_889fad(v_8d41d7("gdpr.phraseMismatch"), v_8d41d7("gdpr.phraseMismatchMsg", { phrase: v_80f3c7 }));
      return;
    }
    v_889fad(
      v_8d41d7("gdpr.finalTitle"),
      v_8d41d7("gdpr.finalDesc"),
      [
        { text: v_8d41d7("common.cancel"), style: "cancel" },
        {
          text: v_8d41d7("gdpr.finalConfirm"),
          style: "destructive",
          onPress: async () => {
            v_34a50a(true);
            try {
              await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 600));
              v_889fad(v_8d41d7("gdpr.successTitle"), v_8d41d7("gdpr.successMsg"));
            } finally {
              v_34a50a(false);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeScrollView backgroundColor={v_1bfbd0.white}>
      <PageHeader title={v_8d41d7("gdpr.title")} />
      <View style={v_fd5f43.wrap}>
        <Text style={v_fd5f43.warn}>{v_8d41d7("gdpr.warning")}</Text>
        <Text style={v_fd5f43.body}>
          {v_8d41d7("gdpr.desc1")}
          {"\n\n"}
          {v_8d41d7("gdpr.desc2")}
        </Text>

        <Text style={v_fd5f43.label}>{v_8d41d7("gdpr.label")}</Text>
        <Text style={v_fd5f43.helper}>{v_8d41d7("gdpr.helper", { phrase: v_80f3c7 })}</Text>
        <TextInput
          value={v_ce9295}
          onChangeText={v_453fe1}
          style={v_fd5f43.input}
          autoCapitalize="none"
        />

        <View style={{ height: 16 }} />
        <Button
          title={v_683210 ? v_8d41d7("gdpr.submitting") : v_8d41d7("gdpr.submit")}
          onPress={v_fbb22a}
          disabled={v_683210}
          variant="danger"
        />
      </View>
    </SafeScrollView>
  );
}

const v_fd5f43 = v_472849.create({
  wrap: { padding: v_9b1a04.medium },
  warn: { fontSize: 16, fontWeight: "700", color: "#dc2626", marginBottom: 12 },
  body: { fontSize: 14, lineHeight: 22, color: v_1bfbd0.zinc700 },
  label: { fontSize: 13, fontWeight: "600", color: v_1bfbd0.zinc700, marginTop: 20 },
  helper: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 4, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc300,
    borderRadius: v_8b0c90.md,
    padding: 12,
    fontSize: 15,
  },
});
