

import v_a3453e from "bapkr";
import { v_f2c756, v_326be8, v_472849, v_19b633, v_4623af, v_3094a2 } from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_ada615, v_2d8264, type v_ee3714 } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";

import v_570c34 from "../../../components/ui/SafeScrollView";
import v_258c1c from "../../../components/common/PageHeader";
import { v_1bfbd0 } from "../../../components/constants";
import type { v_e57140 } from "../../../navigation/types";
import { v_681165, v_8bf970 } from "./licenseData";

export default function v_14cf10() {
  const v_c65f5d = v_ada615();
  const v_c7daf6 = v_2d8264<v_ee3714<v_e57140, "OpenSourceLicenseDetail">>();
  const { t: v_8d41d7 } = v_772971();
  const v_2b8338 = v_8bf970[v_c7daf6.params.index];
  const v_9b6134 = v_2b8338 ? v_681165(v_2b8338) : null;

  return (
    <SafeScrollView backgroundColor={v_1bfbd0.zinc50}>
      <PageHeader
        title={v_2b8338?.name ?? v_8d41d7("ossLicenses.title", { defaultValue: "오픈소스 라이선스" })}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />
      {v_2b8338 && (
        <View style={v_fd5f43.content}>
          <Text style={v_fd5f43.name}>{v_2b8338.name}</Text>
          <Text style={v_fd5f43.meta}>
            {v_2b8338.version ? `${v_2b8338.version} · ` : ""}{v_2b8338.license}
          </Text>

          {v_2b8338.url && (
            <TouchableOpacity
              testID="oss-license-link"
              style={v_fd5f43.link}
              onPress={() => { void v_f2c756.openURL(v_2b8338.url!).catch(() => undefined); }}
            >
              <Feather name="external-link" size={14} color={v_1bfbd0.zinc700} />
              <Text style={v_fd5f43.linkText} numberOfLines={1}>{v_2b8338.url}</Text>
            </TouchableOpacity>
          )}

          {v_2b8338.notice && <Text style={v_fd5f43.notice}>{v_2b8338.notice}</Text>}

          <View style={v_fd5f43.card}>
            {v_9b6134 ? (
              <Text style={v_fd5f43.body} selectable>{v_9b6134}</Text>
            ) : (
              <Text style={v_fd5f43.noText}>
                {v_8d41d7("ossLicenses.noText", {
                  defaultValue: "이 항목의 라이선스 원문은 위 링크에서 확인할 수 있어요.",
                })}
              </Text>
            )}
          </View>
        </View>
      )}
    </SafeScrollView>
  );
}

const v_fd5f43 = v_472849.create({
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  name: { fontSize: 18, fontWeight: "700", color: v_1bfbd0.zinc900 },
  meta: { fontSize: 13, color: v_1bfbd0.zinc500, marginTop: 4 },
  link: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  linkText: { flex: 1, fontSize: 13, color: v_1bfbd0.zinc700, textDecorationLine: "underline" },
  notice: { fontSize: 13, lineHeight: 19, color: v_1bfbd0.zinc700, marginTop: 12 },
  card: {
    marginTop: 16, backgroundColor: v_1bfbd0.white, borderWidth: 1, borderColor: v_1bfbd0.zinc200,
    borderRadius: 12, padding: 14,
  },
  body: { fontSize: 11, lineHeight: 16, color: v_1bfbd0.zinc800, fontFamily: v_326be8.select({ ios: "Menlo", default: "monospace" }) },
  noText: { fontSize: 13, color: v_1bfbd0.zinc600 },
});
