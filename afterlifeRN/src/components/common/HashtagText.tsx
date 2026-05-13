

import v_a3453e, { v_df9f57 } from "bapkr";
import { v_19b633, type v_5e8657, type v_961e77 } from "rcmrninabrnb";
import { v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import type { v_5b8240 } from "ykfzqfftuciufdadykzsyvzknqnwb";
import type { v_97a9a8 } from "../../navigation/types";
import { v_1bfbd0 } from "../constants";

const v_2c17d6 = /#[\p{L}\p{N}_]+/gu;

type Props = {
  children: string;
  style?: v_961e77<v_5e8657>;

  tagStyle?: v_961e77<v_5e8657>;
  numberOfLines?: number;
};

type Segment = { type: "text" | "tag"; value: string };

export default function v_5778ce({ children: v_21f619, style: v_7fa4e4, tagStyle: v_0edacb, numberOfLines: v_25883c }: Props) {

  const v_665404 = v_df9f57<Segment[]>(() => {
    const v_9b6134 = v_21f619 ?? "";
    const v_8d4337 = [];
    let v_279fef = 0;
    v_2c17d6.lastIndex = 0;
    let v_a63110;
    while ((v_a63110 = v_2c17d6.exec(v_9b6134)) !== null) {
      const v_965edf = v_a63110.index;
      const v_3b508c = v_965edf + v_a63110[0].length;
      if (v_965edf > v_279fef) {
        v_8d4337.push({ type: "text", value: v_9b6134.slice(v_279fef, v_965edf) });
      }
      v_8d4337.push({ type: "tag", value: v_a63110[0] });
      v_279fef = v_3b508c;
    }
    if (v_279fef < v_9b6134.length) {
      v_8d4337.push({ type: "text", value: v_9b6134.slice(v_279fef) });
    }
    return v_8d4337;
  }, [v_21f619]);

  const v_3c9f12 = v_ada615<v_5b8240<v_97a9a8>>();

  const v_6eb948 = (v_bd1444) => {

    v_3c9f12.navigate("SearchTab", { initialQuery: v_bd1444 });
  };

  return (
    <Text style={v_7fa4e4} numberOfLines={v_25883c}>
      {v_665404.map((v_267ca3, v_ebec57) =>
        v_267ca3.type === "tag" ? (
          <Text
            key={v_ebec57}
            style={[{ color: v_1bfbd0.violet600, fontWeight: "600" }, v_0edacb]}
            onPress={() => v_6eb948(v_267ca3.value)}

            suppressHighlighting
          >
            {v_267ca3.value}
          </Text>
        ) : (
          <Text key={v_ebec57}>{v_267ca3.value}</Text>
        ),
      )}
    </Text>
  );
}
