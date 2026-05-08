import v_a3453e from "bapkr";
import { v_3094a2, v_19b633, v_472849 } from "rcmrninabrnb";
import { v_1bfbd0, v_9b1a04 } from "../constants";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const StepIndicator: v_a3453e.FC<StepIndicatorProps> = ({
  currentStep: v_91943c,
  totalSteps: v_be48b1,
}) => {
  const v_a63fde = v_91943c / v_be48b1;

  return (
    <View style={v_d81136.container}>
      <Text style={v_d81136.label}>STEP {v_91943c}/{v_be48b1}</Text>
      <View style={v_d81136.track}>
        <View style={[v_d81136.fill, { width: `${v_a63fde * 100}%` }]}>
          <View style={v_d81136.gradient} />
        </View>
      </View>
    </View>
  );
};

const v_d81136 = v_472849.create({
  container: {
    paddingHorizontal: v_9b1a04.medium,
    paddingTop: v_9b1a04.large,
    paddingBottom: v_9b1a04.small,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: v_1bfbd0.violet500,
    marginBottom: 6,
  },
  track: {
    height: 4,
    backgroundColor: v_1bfbd0.zinc200,
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 2,
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
    backgroundColor: v_1bfbd0.violet500,
  },
});

export default v_3183b2;
