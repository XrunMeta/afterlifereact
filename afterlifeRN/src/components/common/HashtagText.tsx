

import React, { useMemo } from "react";
import { Text, type TextStyle, type StyleProp } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { MainTabParamList } from "../../navigation/types";
import { COLORS } from "../constants";

const HASHTAG_RE = /#[\p{L}\p{N}_]+/gu;

type Props = {
  children: string;
  style?: StyleProp<TextStyle>;

  tagStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

type Segment = { type: "text" | "tag"; value: string };

export default function HashtagText({ children, style, tagStyle, numberOfLines }: Props) {

  const segments = useMemo<Segment[]>(() => {
    const text = children ?? "";
    const out: Segment[] = [];
    let lastIdx = 0;
    HASHTAG_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = HASHTAG_RE.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (start > lastIdx) {
        out.push({ type: "text", value: text.slice(lastIdx, start) });
      }
      out.push({ type: "tag", value: match[0] });
      lastIdx = end;
    }
    if (lastIdx < text.length) {
      out.push({ type: "text", value: text.slice(lastIdx) });
    }
    return out;
  }, [children]);

  const nav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();

  const onTagPress = (tag: string) => {

    const stripped = tag.replace(/^#+/, "");
    nav.navigate("SearchTab", { initialQuery: stripped });
  };

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {segments.map((seg, i) =>
        seg.type === "tag" ? (
          <Text
            key={i}
            style={[{ color: COLORS.violet600, fontWeight: "600" }, tagStyle]}
            onPress={() => onTagPress(seg.value)}

            suppressHighlighting
          >
            {seg.value}
          </Text>
        ) : (
          <Text key={i}>{seg.value}</Text>
        ),
      )}
    </Text>
  );
}
