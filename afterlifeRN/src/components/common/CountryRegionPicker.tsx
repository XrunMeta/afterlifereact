

import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { COLORS, RADIUS, SIZES } from "../constants";
import {
  COUNTRY_DIAL_CODES,
  REGIONS_AS_COUNTRY_DIAL_CODES,
  GLOBAL_REGION,
  getRegionsByCountryIso2,
} from "../../constants";
import type { CountryDialCode } from "../../types/country";

const TOP_PRIORITY_ISO2 = ["kr", "us", "jp", "cn", "id"];

type Mode = "country" | "region";

type Props = {
  visible: boolean;
  onClose: () => void;

  anchorRef: React.RefObject<View | null>;
  selectedCountry: CountryDialCode | null;
  selectedRegion: CountryDialCode | null;
  onSelect: (country: CountryDialCode, region: CountryDialCode | null) => void;

  dropdownMaxHeight?: number;
};

type Anchor = { top: number; left: number; width: number; below: boolean };

export default function CountryRegionPicker({
  visible,
  onClose,
  anchorRef,
  selectedCountry,
  selectedRegion,
  onSelect,
  dropdownMaxHeight = 360,
}: Props) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>("country");
  const [query, setQuery] = useState("");
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  useEffect(() => {
    if (!visible) return;
    setMode("country");
    setQuery("");

    const tid = setTimeout(() => {
      anchorRef.current?.measureInWindow?.((x, y, width, height) => {
        const screenH = Dimensions.get("window").height;
        const spaceBelow = screenH - (y + height);
        const spaceAbove = y;
        const below = spaceBelow >= 220 || spaceBelow >= spaceAbove;
        setAnchor({
          top: below ? y + height + 4 : y - 4,
          left: x,
          width,
          below,
        });
      });
    }, 0);
    return () => clearTimeout(tid);
  }, [visible, anchorRef]);

  const countries = useMemo<CountryDialCode[]>(() => {
    const seen = new Set<string>();
    const uniq: CountryDialCode[] = [];
    for (const c of COUNTRY_DIAL_CODES) {
      if (!c.iso2 || seen.has(c.iso2.toLowerCase())) continue;
      seen.add(c.iso2.toLowerCase());
      uniq.push(c);
    }
    const top: CountryDialCode[] = [];
    const rest: CountryDialCode[] = [];
    for (const c of uniq) {
      const idx = TOP_PRIORITY_ISO2.indexOf(c.iso2.toLowerCase());
      if (idx >= 0) top[idx] = c;
      else rest.push(c);
    }
    const topFiltered = top.filter(Boolean);
    rest.sort((a, b) => {
      const an = t(`countries:${a.iso2.toUpperCase()}`, a.name);
      const bn = t(`countries:${b.iso2.toUpperCase()}`, b.name);
      return an.localeCompare(bn);
    });
    return [...topFiltered, ...rest];
  }, [t]);

  const regions = useMemo<CountryDialCode[]>(() => {
    if (!selectedCountry) return [];
    return getRegionsByCountryIso2(selectedCountry.iso2);
  }, [selectedCountry]);

  const items = mode === "country" ? countries : regions;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const name = item.name.toLowerCase();
      const tKey =
        mode === "country"
          ? `countries:${item.iso2.toUpperCase()}`
          : `regions:${item.countryCode}_${item.dialCode}`;
      const translated = t(tKey).toLowerCase();
      return name.includes(q) || translated.includes(q);
    });
  }, [items, query, mode, t]);

  const handleSelect = (item: CountryDialCode) => {
    if (mode === "country") {
      const regionsForCountry = getRegionsByCountryIso2(item.iso2);
      const hasRegions =
        regionsForCountry.length > 1 ||
        (regionsForCountry.length === 1 &&
          regionsForCountry[0].iso2 !== "global");
      if (hasRegions) {
        onSelect(item, null);
        setMode("region");
        setQuery("");
      } else {
        onSelect(item, GLOBAL_REGION);
        onClose();
      }
    } else {
      if (selectedCountry) onSelect(selectedCountry, item);
      onClose();
    }
  };

  const labelFor = (item: CountryDialCode): string => {
    if (mode === "country") {
      const key = `countries:${item.iso2.toUpperCase()}`;
      const v = t(key);
      return v && v !== key ? v : item.name;
    } else {
      const key = `regions:${item.countryCode}_${item.dialCode}`;
      const v = t(key);
      return v && v !== key ? v : item.name;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={s.overlay} onPress={onClose}>
        {anchor && (
          <Pressable
            style={[
              s.dropdown,
              {
                position: "absolute",
                top: anchor.below ? anchor.top : undefined,
                bottom: anchor.below
                  ? undefined
                  : Dimensions.get("window").height - anchor.top,
                left: anchor.left,
                width: anchor.width,
                maxHeight: dropdownMaxHeight,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {}
            <View style={s.header}>
              {mode === "region" ? (
                <TouchableOpacity
                  onPress={() => {
                    setMode("country");
                    setQuery("");
                  }}
                  style={s.backBtn}
                >
                  <Feather name="arrow-left" size={16} color={COLORS.zinc700} />
                </TouchableOpacity>
              ) : (
                <View style={s.backBtn} />
              )}
              <Text style={s.headerTitle}>
                {mode === "country"
                  ? t("common:auth.signup.country") || "국가"
                  : t("common:auth.signup.region") || "지역"}
              </Text>
              <View style={s.backBtn} />
            </View>

            {}
            <View style={s.searchWrap}>
              <Feather name="search" size={14} color={COLORS.zinc400} />
              <TextInput
                style={s.searchInput}
                placeholder={
                  t("common:auth.signup.searchPlaceholder") || "검색..."
                }
                placeholderTextColor={COLORS.zinc400}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
              />
            </View>

            {}
            <FlatList
              data={filtered}
              keyExtractor={(item, idx) =>
                mode === "country"
                  ? `c-${item.iso2}-${idx}`
                  : `r-${item.countryCode}-${item.dialCode}-${idx}`
              }
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected =
                  mode === "country"
                    ? selectedCountry?.iso2 === item.iso2
                    : selectedRegion?.dialCode === item.dialCode &&
                      selectedRegion?.countryCode === item.countryCode;
                return (
                  <TouchableOpacity
                    style={[s.row, isSelected && s.rowSelected]}
                    onPress={() => handleSelect(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={s.flag}>{item.flagEmoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.name} numberOfLines={1}>
                        {labelFor(item)}
                      </Text>
                      {mode === "country" && (
                        <Text style={s.sub}>{item.dialCode}</Text>
                      )}
                    </View>
                    {isSelected && (
                      <Feather name="check" size={16} color={COLORS.violet500} />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={s.emptyText}>
                  {t("common:auth.signup.noResults") || "결과 없음"}
                </Text>
              }
            />
          </Pressable>
        )}
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.08)" },
  dropdown: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  backBtn: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 13, fontWeight: "700", color: COLORS.zinc900 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    margin: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.zinc100,
  },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.zinc900, padding: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  rowSelected: { backgroundColor: COLORS.violet100 },
  flag: { fontSize: 18 },
  name: { fontSize: 13, color: COLORS.zinc900, fontWeight: "500" },
  sub: { fontSize: 11, color: COLORS.zinc500, marginTop: 1 },
  emptyText: {
    textAlign: "center",
    color: COLORS.zinc400,
    paddingTop: 24,
    paddingBottom: 16,
    fontSize: 13,
  },
});
