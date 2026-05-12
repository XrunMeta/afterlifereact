

import React, { useMemo, useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
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
  selectedCountry: CountryDialCode | null;
  selectedRegion: CountryDialCode | null;
  onSelect: (country: CountryDialCode, region: CountryDialCode | null) => void;
};

export default function CountryRegionPicker({
  visible,
  onClose,
  selectedCountry,
  selectedRegion,
  onSelect,
}: Props) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>("country");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (visible) {
      setMode("country");
      setQuery("");
    }
  }, [visible]);

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
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={s.root}>
        {}
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.headerBtn}>
            <Feather name="x" size={22} color={COLORS.zinc900} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>
            {mode === "country"
              ? t("common:auth.signup.country") || "국가"
              : t("common:auth.signup.region") || "지역"}
          </Text>
          {mode === "region" ? (
            <TouchableOpacity
              onPress={() => {
                setMode("country");
                setQuery("");
              }}
              style={s.headerBtn}
            >
              <Feather name="arrow-left" size={20} color={COLORS.zinc900} />
            </TouchableOpacity>
          ) : (
            <View style={s.headerBtn} />
          )}
        </View>

        {}
        <View style={s.searchWrap}>
          <Feather name="search" size={16} color={COLORS.zinc400} />
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
                  <Text style={s.name}>{labelFor(item)}</Text>
                  {mode === "country" && (
                    <Text style={s.sub}>{item.dialCode}</Text>
                  )}
                </View>
                {isSelected && (
                  <Feather name="check" size={18} color={COLORS.violet500} />
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
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc200,
  },
  headerBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: COLORS.zinc900 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: SIZES.medium,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.zinc100,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.zinc900, padding: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: SIZES.large,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  rowSelected: { backgroundColor: COLORS.violet100 },
  flag: { fontSize: 24 },
  name: { fontSize: 15, color: COLORS.zinc900, fontWeight: "500" },
  sub: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },
  emptyText: {
    textAlign: "center",
    color: COLORS.zinc400,
    paddingTop: 48,
    fontSize: 14,
  },
});
