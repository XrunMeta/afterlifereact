import v_a3453e from "bapkr";
import { v_4623af, v_19b633, v_472849 } from "rcmrninabrnb";
import { v_1bfbd0, v_8b0c90, v_e3d001 } from "../constants";

interface InterestChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  variant?: "default" | "filter" | "tag";
}

const InterestChip: v_a3453e.FC<InterestChipProps> = ({
  label: v_2869c1,
  selected: v_587413,
  onPress: v_719eed,
  variant: v_46e192 = "default",
}) => {
  if (v_46e192 === "tag") {
    return (
      <Text style={v_d81136.tag}>#{v_2869c1}</Text>
    );
  }

  return (
    <TouchableOpacity
      onPress={v_719eed}
      style={[
        v_46e192 === "filter" ? v_d81136.filterChip : v_d81136.chip,
        v_587413 && (v_46e192 === "filter" ? v_d81136.filterChipSelected : v_d81136.chipSelected),
      ]}
      activeOpacity={0.7}
    >
      <Text
        style={[
          v_46e192 === "filter" ? v_d81136.filterText : v_d81136.text,
          v_587413 && v_d81136.textSelected,
        ]}
      >
        {v_2869c1}
      </Text>
    </TouchableOpacity>
  );
};

const v_d81136 = v_472849.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: v_8b0c90.full,
    backgroundColor: v_1bfbd0.zinc100,
  },
  chipSelected: {
    backgroundColor: v_1bfbd0.zinc900,
  },
  text: {
    fontSize: 14,
    fontWeight: "500",
    color: v_1bfbd0.zinc700,
  },
  textSelected: {
    color: v_1bfbd0.white,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.zinc100,
  },
  filterChipSelected: {
    backgroundColor: v_e3d001.chipFilled.backgroundColor,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: v_1bfbd0.zinc700,
    textAlign: "center",
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: v_8b0c90.full,
    backgroundColor: "rgba(0,0,0,0.2)",
    fontSize: 12,
    fontWeight: "500",
    color: v_1bfbd0.white,
    overflow: "hidden",
  },
});

export default v_84e2fc;
