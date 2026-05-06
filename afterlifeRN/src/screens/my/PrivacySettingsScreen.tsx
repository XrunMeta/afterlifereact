import v_a3453e from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";

export default function v_9232cf() {
  const v_c65f5d = v_ada615();
  const { t: v_8d41d7 } = v_772971();

  const v_4622b9 = [

    { key: "blockList", labelKey: "settings.privacy.blockList", icon: "slash" as const },
    { key: "dataDownload", labelKey: "settings.privacy.dataDownload", icon: "download" as const },
    { key: "deleteAccount", labelKey: "settings.privacy.deleteAccount", icon: "trash-2" as const, danger: true },
  ];

  return (
    <SafeScrollView backgroundColor={v_1bfbd0.white} showBottomBackground={false}>
      <PageHeader
        title={v_8d41d7("settings.privacy.title")}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />

      <View style={v_fd5f43.content}>
        <View style={v_fd5f43.card}>
          {v_4622b9.map((v_8c0b26, v_ebec57) => (
            <View key={v_8c0b26.key}>
              <TouchableOpacity style={v_fd5f43.row}>
                <Feather
                  name={v_8c0b26.icon}
                  size={20}
                  color={v_8c0b26.danger ? v_1bfbd0.error : v_1bfbd0.zinc700}
                  style={v_fd5f43.rowIcon}
                />
                <Text style={[v_fd5f43.rowLabel, v_8c0b26.danger && v_fd5f43.rowLabelDanger]}>
                  {v_8d41d7(v_8c0b26.labelKey)}
                </Text>
                <Feather name="chevron-right" size={18} color={v_1bfbd0.zinc400} />
              </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 12,
  },
  rowIcon: { width: 24, textAlign: "center" },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: "500", color: v_1bfbd0.zinc900 },
  rowLabelDanger: { color: v_1bfbd0.error },
  divider: { height: 1, backgroundColor: v_1bfbd0.zinc100, marginLeft: 20 },
});
