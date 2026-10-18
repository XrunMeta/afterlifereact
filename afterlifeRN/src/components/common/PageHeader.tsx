import v_a3453e from "bapkr";
import { v_3094a2, v_19b633, v_4623af, v_472849, type v_5e8657 } from "rcmrninabrnb";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_1bfbd0, v_9b1a04 } from "../constants";

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  stepInfo?: { current: number; total: number };
  rightAction?: v_a3453e.ReactNode;
  transparent?: boolean;

  titleStyle?: v_5e8657;

  hideBorder?: boolean;
}

const PageHeader: v_a3453e.FC<PageHeaderProps> = ({
  title: v_9f1622,
  subtitle: v_dda473,
  showBackButton: v_9c4d53 = false,
  onBackPress: v_f442f6,
  stepInfo: v_69583e,
  rightAction: v_4af61b,
  transparent: v_8d6034 = false,
  titleStyle: v_672cf3,
  hideBorder: v_66d80d = false,
}) => {
  const v_033e14 = v_e0068c();

  return (
    <View
      style={[
        v_d81136.container,

        { paddingTop: v_033e14.top },
        v_8d6034 && v_d81136.transparent,
        v_66d80d && v_d81136.hideBorder,
      ]}
    >
      <View style={v_d81136.row}>
        {}
        {v_9c4d53 && (
          <View style={v_d81136.left}>
            <TouchableOpacity
              onPress={v_f442f6}
              style={v_d81136.backButton}
            >
              <Feather name="arrow-left" size={24} color={v_8d6034 ? v_1bfbd0.white : v_1bfbd0.zinc900} />
            </TouchableOpacity>
          </View>
        )}

        {}
        <View style={v_d81136.center}>
          {v_69583e && (
            <Text style={[v_d81136.stepText, v_8d6034 && v_d81136.whiteText]}>
              STEP {v_69583e.current}/{v_69583e.total}
            </Text>
          )}
          {v_9f1622 && (
            <Text
              style={[v_d81136.title, v_8d6034 && v_d81136.whiteText, v_672cf3]}
              numberOfLines={1}
            >
              {v_9f1622}
            </Text>
          )}
          {v_dda473 && (
            <Text style={[v_d81136.subtitle, v_8d6034 && v_d81136.whiteSubtext]}>
              {v_dda473}
            </Text>
          )}
        </View>

        {}
        <View style={v_d81136.right}>
          {v_4af61b}
        </View>
      </View>
    </View>
  );
};

const v_d81136 = v_472849.create({
  container: {
    backgroundColor: v_1bfbd0.white,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc200,
    paddingBottom: 10,
    paddingHorizontal: v_9b1a04.medium,
  },
  transparent: {
    backgroundColor: "transparent",
    borderBottomWidth: 0,
  },
  hideBorder: {
    borderBottomWidth: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 36,
  },
  left: {
    width: 44,
    alignItems: "flex-start",

    marginLeft: -v_9b1a04.small,
  },
  center: {
    flex: 1,

  },
  right: {
    width: 44,
    alignItems: "flex-end",
  },
  backButton: {
    padding: 4,
    borderRadius: 8,
  },
  stepText: {
    fontSize: 12,
    fontWeight: "600",
    color: v_1bfbd0.violet500,
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: v_1bfbd0.zinc900,
  },
  subtitle: {
    fontSize: 13,
    color: v_1bfbd0.zinc500,
    marginTop: 2,
  },
  whiteText: {
    color: v_1bfbd0.white,
  },
  whiteSubtext: {
    color: "rgba(255,255,255,0.8)",
  },
});

export default v_258c1c;
