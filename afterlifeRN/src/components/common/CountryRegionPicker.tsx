

import v_a3453e, { v_df9f57, v_5ab095, v_c4deb2 } from "bapkr";
import {
  v_aa7413,
  v_3094a2,
  v_19b633,
  v_79c4f2,
  v_4623af,
  v_9cabcb,
  v_472849,
  v_09d0e5,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import { v_1bfbd0, v_8b0c90, v_9b1a04, v_8f28b1 } from "../constants";
import {
  v_202d44,
  v_52495e,
  v_789afd,
  v_369014,
} from "../../constants";
import type { v_da1883 } from "../../types/country";

const v_aedc3e = ["kr", "us", "jp", "cn", "id"];

type Mode = "country" | "region";

type Props = {
  visible: boolean;
  onClose: () => void;
  selectedCountry: v_da1883 | null;
  selectedRegion: v_da1883 | null;
  onSelect: (country: v_da1883, region: v_da1883 | null) => void;

  initialMode?: Mode;

  countryOnly?: boolean;
};

export default function v_57037e({
  visible: v_cf55be,
  onClose: v_0890f8,
  selectedCountry: v_0899ab,
  selectedRegion: v_2f03bc,
  onSelect: v_3ac615,
  initialMode: v_2ba26d = "country",
  countryOnly: v_759e0a = false,
}: Props) {
  const { t: v_8d41d7 } = v_772971();
  const [v_34e5bb, v_038d7f] = v_5ab095<Mode>(v_2ba26d);
  const [v_7c5791, v_c57190] = v_5ab095("");

  v_c4deb2(() => {
    if (v_cf55be) {
      v_038d7f(v_2ba26d === "region" && v_0899ab ? "region" : "country");
      v_c57190("");
    }
  }, [v_cf55be, v_2ba26d, v_0899ab]);

  const v_6c7bef = v_df9f57<v_da1883[]>(() => {
    const v_110a8b = new Set<string>();
    const uniq: v_da1883[] = [];
    for (const v_3f4e2e of v_202d44) {
      if (!v_3f4e2e.iso2 || v_110a8b.has(v_3f4e2e.iso2.toLowerCase())) continue;
      v_110a8b.add(v_3f4e2e.iso2.toLowerCase());
      v_300473.push(v_3f4e2e);
    }
    const top: v_da1883[] = [];
    const rest: v_da1883[] = [];
    for (const v_3f4e2e of v_300473) {
      const v_e86ad8 = v_aedc3e.indexOf(v_3f4e2e.iso2.toLowerCase());
      if (v_e86ad8 >= 0) v_fbc0a4[v_e86ad8] = v_3f4e2e;
      else v_83bbcd.push(v_3f4e2e);
    }
    const v_e74124 = v_fbc0a4.filter(Boolean);
    v_83bbcd.sort((v_779914, v_148ff6) => {
      const v_922dab = v_8d41d7(`countries:${v_779914.iso2.toUpperCase()}`, { defaultValue: v_779914.name });
      const v_b3e922 = v_8d41d7(`countries:${v_148ff6.iso2.toUpperCase()}`, { defaultValue: v_148ff6.name });
      return v_922dab.localeCompare(v_b3e922);
    });
    return [...v_e74124, ...v_83bbcd];
  }, [v_8d41d7]);

  const v_e94fdf = v_df9f57<v_da1883[]>(() => {
    if (!v_0899ab) return [];
    return v_369014(v_0899ab.iso2);
  }, [v_0899ab]);

  const v_4622b9 = v_34e5bb === "country" ? v_6c7bef : v_e94fdf;

  const v_e4cf17 = v_df9f57(() => {
    const v_ab6401 = v_7c5791.trim().toLowerCase();
    if (!v_ab6401) return v_4622b9;
    return v_4622b9.filter((v_8c0b26) => {
      const v_1833e7 = v_8c0b26.name.toLowerCase();
      const v_653c1f =
        v_34e5bb === "country"
          ? `countries:${v_8c0b26.iso2.toUpperCase()}`
          : `regions:${v_8c0b26.countryCode}_${v_8c0b26.dialCode}`;
      const v_6dce25 = v_8d41d7(v_653c1f, { defaultValue: "" }).toLowerCase();
      return v_1833e7.includes(v_ab6401) || (!!v_6dce25 && v_6dce25.includes(v_ab6401));
    });
  }, [v_4622b9, v_7c5791, v_34e5bb, v_8d41d7]);

  const v_6121dc = (item: v_da1883) => {
    if (v_34e5bb === "country") {

      if (v_759e0a) {
        v_3ac615(v_8c0b26, null);
        v_0890f8();
        return;
      }
      const v_56e55a = v_369014(v_8c0b26.iso2);
      const v_5f1e0e =
        v_56e55a.length > 1 ||
        (v_56e55a.length === 1 &&
          v_56e55a[0].iso2 !== "global");
      if (v_5f1e0e) {
        v_3ac615(v_8c0b26, null);
        v_038d7f("region");
        v_c57190("");
      } else {
        v_3ac615(v_8c0b26, v_789afd);
        v_0890f8();
      }
    } else {
      if (v_0899ab) v_3ac615(v_0899ab, v_8c0b26);
      v_0890f8();
    }
  };

  const v_a13ffb = (item: v_da1883): string => {
    if (v_34e5bb === "country") {
      return v_8d41d7(`countries:${v_8c0b26.iso2.toUpperCase()}`, { defaultValue: v_8c0b26.name });
    }
    return v_8d41d7(`regions:${v_8c0b26.countryCode}_${v_8c0b26.dialCode}`, { defaultValue: v_8c0b26.name });
  };

  return (
    <Modal
      visible={v_cf55be}
      transparent
      animationType="fade"
      onRequestClose={v_0890f8}
    >
      <Pressable style={v_fd5f43.overlay} onPress={v_0890f8}>
        <Pressable style={v_fd5f43.card} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
          {}
          <View style={v_fd5f43.header}>
            {v_34e5bb === "region" ? (
              <TouchableOpacity
                onPress={() => {
                  v_038d7f("country");
                  v_c57190("");
                }}
                style={v_fd5f43.headerBtn}
              >
                <Feather name="arrow-left" size={20} color={v_1bfbd0.zinc700} />
              </TouchableOpacity>
            ) : (
              <View style={v_fd5f43.headerBtn} />
            )}
            <Text style={v_fd5f43.headerTitle}>
              {v_34e5bb === "country"
                ? v_8d41d7("common:auth.signup.country", { defaultValue: "국가" })
                : v_8d41d7("common:auth.signup.region", { defaultValue: "지역" })}
            </Text>
            <TouchableOpacity onPress={v_0890f8} style={v_fd5f43.headerBtn}>
              <Feather name="x" size={20} color={v_1bfbd0.zinc700} />
            </TouchableOpacity>
          </View>

          {}
          <View style={v_fd5f43.searchWrap}>
            <Feather name="search" size={16} color={v_1bfbd0.zinc400} />
            <TextInput
              style={v_fd5f43.searchInput}
              placeholder={v_8d41d7("common:auth.signup.searchPlaceholder", { defaultValue: "검색..." })}
              placeholderTextColor={v_1bfbd0.zinc400}
              value={v_7c5791}
              onChangeText={v_c57190}
              autoCapitalize="none"
            />
          </View>

          {}
          <FlatList
            data={v_e4cf17}
            keyExtractor={(v_8c0b26, v_e86ad8) =>
              v_34e5bb === "country"
                ? `c-${v_8c0b26.iso2}-${v_e86ad8}`
                : `r-${v_8c0b26.countryCode}-${v_8c0b26.dialCode}-${v_e86ad8}`
            }
            keyboardShouldPersistTaps="handled"
            renderItem={({ item: v_8c0b26 }) => {
              const v_599a41 =
                v_34e5bb === "country"
                  ? v_0899ab?.iso2 === v_8c0b26.iso2
                  : v_2f03bc?.dialCode === v_8c0b26.dialCode &&
                    v_2f03bc?.countryCode === v_8c0b26.countryCode;
              return (
                <TouchableOpacity
                  style={[v_fd5f43.row, v_599a41 && v_fd5f43.rowSelected]}
                  onPress={() => v_6121dc(v_8c0b26)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={v_fd5f43.name} numberOfLines={1}>
                      {v_a13ffb(v_8c0b26)}
                    </Text>
                    {v_34e5bb === "country" && (
                      <Text style={v_fd5f43.sub}>{v_8c0b26.dialCode}</Text>
                    )}
                  </View>
                  {v_599a41 && (
                    <Feather name="check" size={18} color={v_1bfbd0.violet500} />
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={v_fd5f43.emptyText}>
                {v_8d41d7("common:auth.signup.noResults", { defaultValue: "결과 없음" })}
              </Text>
            }
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const v_fd5f43 = v_472849.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  card: {
    width: "100%",
    maxWidth: 420,
    height: "75%",
    backgroundColor: v_1bfbd0.white,
    borderRadius: v_8b0c90.lg,
    overflow: "hidden",
  },
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  headerBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.zinc900 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: v_9b1a04.medium,
    paddingHorizontal: v_8f28b1.paddingHorizontal,
    height: v_8f28b1.height,
    borderRadius: v_8f28b1.borderRadius,
    backgroundColor: v_1bfbd0.zinc100,
  },
  searchInput: {
    flex: 1,
    fontSize: v_8f28b1.fontSize,
    lineHeight: v_8f28b1.lineHeight,
    paddingVertical: 0,
    textAlignVertical: v_8f28b1.textAlignVertical,
    color: v_1bfbd0.zinc900,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: v_9b1a04.large,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  rowSelected: { backgroundColor: v_1bfbd0.violet100 },
  flag: { fontSize: 22 },
  name: { fontSize: 14, color: v_1bfbd0.zinc900, fontWeight: "500" },
  sub: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  emptyText: {
    textAlign: "center",
    color: v_1bfbd0.zinc400,
    paddingTop: 32,
    paddingBottom: 24,
    fontSize: 14,
  },
});
