import v_a3453e from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0 } from "../../components/constants";

export default function v_e797c6() {
  const v_c65f5d = v_ada615();
  const { t: v_8d41d7 } = v_772971();

  return (
    <SafeScrollView backgroundColor={v_1bfbd0.white} showBottomBackground={false}>
      <PageHeader
        title={v_8d41d7("settings.saved.title")}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />

      <View style={v_fd5f43.content}>
        <View style={v_fd5f43.emptyState}>
          <View style={v_fd5f43.emptyIcon}>
            <Feather name="bookmark" size={40} color={v_1bfbd0.zinc300} />
          </View>
          <Text style={v_fd5f43.emptyText}>{v_8d41d7("settings.saved.empty")}</Text>
        </View>
      </View>
    </SafeScrollView>
  );
}

const v_fd5f43 = v_472849.create({
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 780,
    alignSelf: "center",
    width: "100%",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 16,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: v_1bfbd0.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 15,
    color: v_1bfbd0.zinc500,
    textAlign: "center",
  },
});
