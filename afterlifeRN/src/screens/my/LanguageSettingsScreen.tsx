import v_a3453e, { v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
import v_9c213b, { v_ae07ea } from "../../i18n";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";

const v_d86aad = [
  { code: "ko", labelKey: "settings.language.ko" },
  { code: "ja", labelKey: "settings.language.ja" },
  { code: "en", labelKey: "settings.language.en" },
  { code: "zh-CN", labelKey: "settings.language.zh-CN" },
  { code: "id", labelKey: "settings.language.id" },
] as const;

type LanguageCode = (typeof v_d86aad)[number]["code"];

export default function v_d3b6fb() {
  const v_c65f5d = v_ada615();
  const { t: v_8d41d7 } = v_772971();
  const [v_587413, v_2122dd] = v_5ab095<LanguageCode>(
    (v_9c213b.language as LanguageCode) ?? "ko",
  );

  const v_6121dc = (v_c99bd2) => {
    v_2122dd(v_c99bd2);
    void v_ae07ea(v_c99bd2);
  };

  return (
    <SafeScrollView backgroundColor={v_1bfbd0.white} showBottomBackground={false}>
      <PageHeader
        title={v_8d41d7("settings.language.title")}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />

      <View style={v_fd5f43.content}>
        <View style={v_fd5f43.card}>
          {v_d86aad.map((v_5254bf, v_ebec57) => (
            <View key={v_5254bf.code}>
              <TouchableOpacity
                style={v_fd5f43.row}
                onPress={() => v_6121dc(v_5254bf.code)}
              >
                <Text style={v_fd5f43.rowLabel}>{v_8d41d7(v_5254bf.labelKey)}</Text>
                {v_587413 === v_5254bf.code && (
                  <Feather name="check" size={20} color={v_1bfbd0.violet500} />
                )}
              </TouchableOpacity>
              {v_ebec57 < v_d86aad.length - 1 && <View style={v_fd5f43.divider} />}
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
