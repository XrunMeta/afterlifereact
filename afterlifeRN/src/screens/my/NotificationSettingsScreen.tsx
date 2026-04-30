import v_a3453e from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_79139e,
} from "rcmrninabrnb";
import { v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";

export default function v_4036d1() {
  const v_c65f5d = v_ada615();
  const { t: v_8d41d7 } = v_772971();

  const v_4622b9 = [
    { key: "push", labelKey: "settings.notifications.push" },
    { key: "comment", labelKey: "settings.notifications.comment" },
    { key: "like", labelKey: "settings.notifications.like" },
    { key: "marketing", labelKey: "settings.notifications.marketing" },
  ] as const;

  return (
    <SafeScrollView backgroundColor={v_1bfbd0.white} showBottomBackground={false}>
      <PageHeader
        title={v_8d41d7("settings.notifications.title")}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />

      <View style={v_fd5f43.content}>
        <View style={v_fd5f43.card}>
          {v_4622b9.map((v_8c0b26, v_ebec57) => (
            <View key={v_8c0b26.key}>
              <View style={v_fd5f43.row}>
                <Text style={v_fd5f43.rowLabel}>{v_8d41d7(v_8c0b26.labelKey)}</Text>
                {}
                <Switch value={false} onValueChange={() => {}} disabled />
              </View>
              {v_ebec57 < v_4622b9.length - 1 && <View style={v_fd5f43.divider} />}
            </View>
          ))}
        </View>
      </View>
    </SafeScrollView>
  );
}

const v_fd5f43 = v_472849.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 780,
    alignSelf: "center",
    width: "100%",
  },
  card: {
    backgroundColor: v_1bfbd0.white,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: v_8b0c90.lg,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  rowLabel: { fontSize: 15, fontWeight: "500", color: v_1bfbd0.zinc900 },
  divider: { height: 1, backgroundColor: v_1bfbd0.zinc100, marginLeft: 20 },
});
