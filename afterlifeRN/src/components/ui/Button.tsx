import v_a3453e from "bapkr";
import {
  v_4623af,
  v_19b633,
  v_472849,
  v_39a996,
  v_7e4944,
  v_5e8657,
} from "rcmrninabrnb";
import { v_7fd157, v_1bfbd0, type v_8075d2 } from "../constants";

type ButtonVariant = "primary" | "secondary" | "accent" | "ghost" | "danger";
type ButtonSize = v_8075d2;

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;

  onDisabledPress?: () => void;
  loading?: boolean;
  leftIcon?: v_a3453e.ReactNode;
  rightIcon?: v_a3453e.ReactNode;
  style?: v_7e4944;
  textStyle?: v_5e8657;

  backgroundColor?: string;

  textColor?: string;

  testID?: string;
}

const Button: v_a3453e.FC<ButtonProps> = ({
  title: v_9f1622,
  onPress: v_719eed,
  variant: v_46e192 = "primary",
  size: v_05b441 = "lg",
  disabled: v_4a6533 = false,
  onDisabledPress: v_bfd741,
  loading: v_683210 = false,
  leftIcon: v_86ef18,
  rightIcon: v_ca3ded,
  style: v_7fa4e4,
  textStyle: v_197d6e,
  backgroundColor: v_f7b9fb,
  textColor: v_7fd696,
  testID: v_681472,
}) => {
  const v_44ebbb = v_7fd157[v_05b441];
  const v_4affe9 = [
    v_d81136.base,
    {
      height: v_44ebbb.height,
      borderRadius: v_44ebbb.borderRadius,
      paddingHorizontal: v_44ebbb.paddingHorizontal,
    },
    v_1dec38[v_46e192],
    v_4a6533 && v_d81136.disabled,
    v_f7b9fb ? { backgroundColor: v_f7b9fb } : undefined,
    v_7fa4e4,
  ];

  const v_3b856e = v_46e192 === "secondary" || v_46e192 === "ghost";
  const v_5ddb12 = [
    v_d81136.text,
    {
      fontSize: v_44ebbb.fontSize,
      fontWeight: v_3b856e
        ? v_44ebbb.fontWeightSecondary
        : v_44ebbb.fontWeight,
    },
    v_7c03ff[v_46e192],
    v_4a6533 && v_d81136.disabledText,
    v_7fd696 ? { color: v_7fd696 } : undefined,
    v_197d6e,
  ];

  return (
    <TouchableOpacity
      testID={v_681472}
      onPress={v_4a6533 ? v_bfd741 : v_719eed}
      style={v_4affe9}
      activeOpacity={v_4a6533 ? 1 : 0.8}

      disabled={v_683210 || (v_4a6533 && !v_bfd741)}
    >
      {v_683210 ? (
        <ActivityIndicator
          color={v_46e192 === "secondary" || v_46e192 === "ghost" ? v_1bfbd0.zinc900 : v_1bfbd0.white}
          size="small"
        />
      ) : (
        <>
          {v_86ef18}
          <Text style={v_5ddb12}>{v_9f1622}</Text>
          {v_ca3ded}
        </>
      )}
    </TouchableOpacity>
  );
};

const v_d81136 = v_472849.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  text: {},
  disabled: {
    backgroundColor: v_1bfbd0.zinc300,
    borderColor: v_1bfbd0.zinc300,
  },
  disabledText: {
    color: v_1bfbd0.zinc500,
  },
});

const variantStyles: Record<ButtonVariant, v_7e4944> = {
  primary: {
    backgroundColor: v_1bfbd0.zinc900,
  },
  secondary: {
    backgroundColor: v_1bfbd0.white,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
  },
  accent: {
    backgroundColor: v_1bfbd0.primary,
  },
  ghost: {
    backgroundColor: v_1bfbd0.zinc100,
  },
  danger: {
    backgroundColor: v_1bfbd0.error,
  },
};

const variantTextStyles: Record<ButtonVariant, v_5e8657> = {
  primary: { color: v_1bfbd0.white },
  secondary: { color: v_1bfbd0.zinc900 },
  accent: { color: v_1bfbd0.white },
  ghost: { color: v_1bfbd0.zinc700 },
  danger: { color: v_1bfbd0.white },
};

export default v_1a40c4;
