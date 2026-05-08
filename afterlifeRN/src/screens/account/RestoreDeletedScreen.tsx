import v_a3453e, { v_5ab095 } from "bapkr";
import { v_3094a2, v_19b633, v_472849, v_03e392 } from "rcmrninabrnb";
import { v_772971 } from "jmpfvteuuztnp";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import v_1a40c4 from "../../components/ui/Button";
import { v_1bfbd0, v_9b1a04 } from "../../components/constants";

export default function v_ecb3c9() {
  const { t: v_8d41d7 } = v_772971();
  const [v_683210, v_34a50a] = v_5ab095(false);

  async function v_d2d3fb() {
    v_34a50a(true);
    try {
      await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 400));
      v_03e392.alert(v_8d41d7("restore.successTitle"), v_8d41d7("restore.successMsg"));
    } catch (v_9e86fd) {
      v_03e392.alert(v_8d41d7("restore.failTitle"), v_8d41d7("restore.failMsg"));
    } finally {
      v_34a50a(false);
    }
  }

  return (
    <SafeScrollView backgroundColor={v_1bfbd0.white}>
      <PageHeader title={v_8d41d7("restore.title")} />
      <View style={v_fd5f43.wrap}>
        <Text style={v_fd5f43.title}>{v_8d41d7("restore.headTitle")}</Text>
        <Text style={v_fd5f43.body}>
          {v_8d41d7("restore.desc1")}
          {"\n\n"}
          {v_8d41d7("restore.desc2")}
          {"\n\n"}
          {v_8d41d7("restore.desc3")}
        </Text>
        <View style={{ height: 20 }} />
        <Button title={v_683210 ? v_8d41d7("restore.submitting") : v_8d41d7("restore.submit")} onPress={v_d2d3fb} disabled={v_683210} />
      </View>
    </SafeScrollView>
  );
}

const v_fd5f43 = v_472849.create({
  wrap: { padding: v_9b1a04.medium },
  title: { fontSize: 18, fontWeight: "700", color: v_1bfbd0.zinc900, marginBottom: 12 },
  body: { fontSize: 14, lineHeight: 22, color: v_1bfbd0.zinc600 },
});
