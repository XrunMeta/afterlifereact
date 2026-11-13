

import v_a3453e, { v_df9f57, v_5ab095 } from "bapkr";
import { v_472849, v_19b633, v_79c4f2, v_4623af, v_3094a2 } from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import { v_772971 } from "jmpfvteuuztnp";

import v_570c34 from "../../../components/ui/SafeScrollView";
import v_258c1c from "../../../components/common/PageHeader";
import { v_1bfbd0 } from "../../../components/constants";
import type { v_e57140 } from "../../../navigation/types";
import { v_00f7e1, v_8bf970 } from "./licenseData";

type Nav = v_390fcc<v_e57140>;

export default function v_e44da0() {
  const v_c65f5d = v_ada615<Nav>();
  const { t: v_8d41d7 } = v_772971();
  const [v_7c5791, v_c57190] = v_5ab095("");
  const v_946c09 = v_df9f57(() => v_00f7e1(v_7c5791), [v_7c5791]);

  return (
    <SafeScrollView backgroundColor={v_1bfbd0.zinc50} keyboardShouldPersistTaps="handled">
      <PageHeader
        title={v_8d41d7("ossLicenses.title", { defaultValue: "오픈소스 라이선스" })}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />
      <View style={v_fd5f43.content}>
        <Text style={v_fd5f43.intro}>
          {v_8d41d7("ossLicenses.intro", {
            count: v_8bf970.length,
            defaultValue: "Afterlife 는 아래 오픈소스 소프트웨어와 데이터 {{count}}개를 사용해요. 항목을 누르면 라이선스 원문을 볼 수 있어요.",
          })}
        </Text>

        <View style={v_fd5f43.search}>
          <Feather name="search" size={18} color={v_1bfbd0.zinc400} />
          <TextInput
            testID="oss-licenses-search"
            style={v_fd5f43.searchInput}
            value={v_7c5791}
            onChangeText={v_c57190}
            placeholder={v_8d41d7("ossLicenses.search", { defaultValue: "이름 또는 라이선스로 검색" })}
            placeholderTextColor={v_1bfbd0.zinc400}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>

        {v_946c09.length === 0 && (
          <Text style={v_fd5f43.empty}>{v_8d41d7("ossLicenses.empty", { defaultValue: "검색 결과가 없어요" })}</Text>
        )}

        {v_946c09.map((v_b6a7e0) => (
          <View key={v_b6a7e0.id} style={v_fd5f43.section}>
            <Text style={v_fd5f43.sectionTitle}>
              {v_8d41d7(v_b6a7e0.titleKey, { defaultValue: v_b6a7e0.title })} · {v_b6a7e0.items.length}
            </Text>
            <View style={v_fd5f43.card}>
              {v_b6a7e0.items.map(({ index: v_a56041, entry: v_2b8338 }, v_ebec57) => (
                <TouchableOpacity
                  key={`${v_2b8338.section}:${v_2b8338.name}@${v_2b8338.version}`}
                  testID={`oss-license-row-${v_a56041}`}
                  style={[v_fd5f43.row, v_ebec57 < v_b6a7e0.items.length - 1 && v_fd5f43.rowBorder]}
                  onPress={() => v_c65f5d.navigate("OpenSourceLicenseDetail", { index: v_a56041 })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={v_fd5f43.name} numberOfLines={1}>{v_2b8338.name}</Text>
                    <Text style={v_fd5f43.meta} numberOfLines={1}>
                      {v_2b8338.version ? `${v_2b8338.version} · ` : ""}{v_2b8338.license}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={v_1bfbd0.zinc400} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>
    </SafeScrollView>
  );
}

const v_fd5f43 = v_472849.create({
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  intro: { fontSize: 13, lineHeight: 19, color: v_1bfbd0.zinc600, marginBottom: 12 },
  search: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: v_1bfbd0.white, borderWidth: 1, borderColor: v_1bfbd0.zinc200, borderRadius: 12,
    paddingHorizontal: 12, marginBottom: 16,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: v_1bfbd0.zinc900 },
  empty: { textAlign: "center", color: v_1bfbd0.zinc500, marginTop: 24 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: v_1bfbd0.zinc500, marginBottom: 8, marginLeft: 4 },
  card: {
    backgroundColor: v_1bfbd0.white, borderWidth: 1, borderColor: v_1bfbd0.zinc200,
    borderRadius: 16, overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: v_1bfbd0.zinc100 },
  name: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
  meta: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
});
