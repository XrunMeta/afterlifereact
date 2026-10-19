import v_a3453e from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_4623af,
  v_aa7413,
  v_122070,
  v_472849,
  v_09d0e5,
  v_326be8,
} from "rcmrninabrnb";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_c18c22 } from "svuoaeceudfxfjvvpmmmchnwljywbphjgb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import v_84e2fc from "./InterestChip";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../constants";
import { v_bf4124 } from "../../mocks/interestHelpers";

const v_bbe45f = v_bf4124;

interface FilterModalProps {
  visible: boolean;
  selectedInterests: string[];
  onToggleInterest: (interest: string) => void;
  onClearAll: () => void;
  onApply: () => void;
  onClose: () => void;
}

const FilterModal: v_a3453e.FC<FilterModalProps> = ({
  visible: v_cf55be,
  selectedInterests: v_976e06,
  onToggleInterest: v_626fd8,
  onClearAll: v_02a1a9,
  onApply: v_e67921,
  onClose: v_0890f8,
}) => {
  const { t: v_8d41d7 } = v_772971();
  const v_033e14 = v_e0068c();

  const v_f9771e = v_c18c22(0);
  const v_ad9bbd = v_326be8.OS === "android" ? 56 : 0;
  const v_2b650d = Math.max(v_033e14.bottom, v_f9771e, v_ad9bbd);
  return (
    <Modal
      visible={v_cf55be}
      transparent
      animationType="slide"
      onRequestClose={v_0890f8}
    >
      {}
      <Pressable style={v_d81136.backdrop} onPress={v_0890f8} />

      {}
      <View style={v_d81136.sheet}>
        {}
        <View style={v_d81136.header}>
          <View style={v_d81136.headerLeft}>
            <Text style={v_d81136.headerTitle}>{v_8d41d7("feed.interestFilter")}</Text>
            {v_976e06.length > 0 && (
              <View style={v_d81136.badge}>
                <Text style={v_d81136.badgeText}>{v_976e06.length}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={v_0890f8} style={v_d81136.closeButton}>
            <Feather name="x" size={20} color={v_1bfbd0.zinc600} />
          </TouchableOpacity>
        </View>

        {}
        <ScrollView
          style={v_d81136.body}
          contentContainerStyle={v_d81136.bodyContent}
        >
          <View style={v_d81136.grid}>
            {v_bbe45f.map((v_e4601c) => (
              <View key={v_e4601c} style={v_d81136.gridItem}>
                <InterestChip
                  label={v_e4601c}
                  selected={v_976e06.includes(v_e4601c)}
                  onPress={() => v_626fd8(v_e4601c)}
                  variant="filter"
                />
              </View>
            ))}
          </View>
        </ScrollView>

        {}
        <View
          style={[
            v_d81136.footer,
            { paddingBottom: v_9b1a04.xlarge + v_2b650d },
          ]}
        >
          <TouchableOpacity
            onPress={v_02a1a9}
            style={v_d81136.resetButton}
            activeOpacity={0.7}
          >
            <Text style={v_d81136.resetText}>{v_8d41d7("feed.clearFilter")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={v_e67921}
            style={v_d81136.applyButton}
            activeOpacity={0.7}
          >
            <Text style={v_d81136.applyText}>{v_8d41d7("feed.applyFilter")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const v_d81136 = v_472849.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: v_9b1a04.xlarge,
    paddingVertical: v_9b1a04.medium,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc200,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: v_1bfbd0.zinc900,
  },
  badge: {
    backgroundColor: v_1bfbd0.violet100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: v_8b0c90.full,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: v_1bfbd0.violet600,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    maxHeight: 300,
  },
  bodyContent: {
    padding: v_9b1a04.xlarge,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridItem: {
    width: "47%",
  },
  footer: {
    flexDirection: "row",
    padding: v_9b1a04.xlarge,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: v_1bfbd0.zinc200,
  },
  resetButton: {
    flex: 1,
    height: 48,
    backgroundColor: v_1bfbd0.zinc100,
    borderRadius: v_8b0c90.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  resetText: {
    fontSize: 15,
    fontWeight: "bold",
    color: v_1bfbd0.zinc700,
  },
  applyButton: {
    flex: 1,
    height: 48,
    backgroundColor: v_1bfbd0.primary,
    borderRadius: v_8b0c90.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  applyText: {
    fontSize: 15,
    fontWeight: "bold",
    color: v_1bfbd0.white,
  },
});

export default v_ca88c9;
