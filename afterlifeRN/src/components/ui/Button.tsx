import v_a3453e from "bapkr";
import {
  v_4623af,
  v_19b633,
  v_472849,
  v_39a996,
  v_7e4944,
  v_5e8657,
} from "rcmrninabrnb";
import { v_1bfbd0, v_8b0c90 } from "../constants";

type ButtonVariant = "primary" | "secondary" | "accent" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: v_a3453e.ReactNode;
  rightIcon?: v_a3453e.ReactNode;
  style?: v_7e4944;
  textStyle?: v_5e8657;

  backgroundColor?: string;

  textColor?: string;
}

const Button: v_a3453e.FC<ButtonProps> = ({
  title: v_9f1622,
  onPress: v_719eed,
  variant: v_46e192 = "primary",
  size: v_05b441 = "lg",
  disabled: v_4a6533 = false,
  loading: v_683210 = false,
  leftIcon: v_86ef18,
  rightIcon: v_ca3ded,
  style: v_7fa4e4,
  textStyle: v_197d6e,
  backgroundColor: v_f7b9fb,
  textColor: v_7fd696,
}) => {
  const v_4affe9 = [
    v_d81136.base,
    v_fdfd00[v_05b441],
    v_1dec38[v_46e192],
    v_4a6533 && v_d81136.disabled,
    v_f7b9fb ? { backgroundColor: v_f7b9fb } : undefined,
    v_7fa4e4,
  ];

  const v_5ddb12 = [
    v_d81136.text,
    v_5b20e4[v_05b441],
    v_7c03ff[v_46e192],
    v_4a6533 && v_d81136.disabledText,
    v_7fd696 ? { color: v_7fd696 } : undefined,
    v_197d6e,
  ];

  return (
    <TouchableOpacity
      onPress={v_719eed}
      style={v_4affe9}
      activeOpacity={0.8}
      disabled={v_4a6533 || v_683210}
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
    borderRadius: v_8b0c90.lg,
  },
  text: {
    fontWeight: "bold",
  },
  disabled: {
    backgroundColor: v_1bfbd0.zinc300,
    borderColor: v_1bfbd0.zinc300,
  },
  disabledText: {
    color: v_1bfbd0.zinc500,
  },
});

const sizeStyles: Record<ButtonSize, v_7e4944> = {
  sm: { height: 40, paddingHorizontal: 16 },
  md: { height: 48, paddingHorizontal: 20 },
  lg: { height: 56, paddingHorizontal: 24 },
};

const sizeTextStyles: Record<ButtonSize, v_5e8657> = {
  sm: { fontSize: 13 },
  md: { fontSize: 14 },
  lg: { fontSize: 16 },
};

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
    backgroundColor: v_1bfbd0.violet500,
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
  secondary: { color: v_1bfbd0.zinc900, fontWeight: "500" },
  accent: { color: v_1bfbd0.white },
  ghost: { color: v_1bfbd0.zinc700, fontWeight: "600" },
  danger: { color: v_1bfbd0.white },
};

export default v_1a40c4;
