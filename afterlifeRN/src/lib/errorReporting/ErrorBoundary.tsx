import v_a3453e, { v_b0de9c, type v_fa153e, type v_4a8ba2 } from "bapkr";
import { v_3094a2, v_19b633, v_472849, v_4623af } from "rcmrninabrnb";
import v_9c213b from "../../i18n";
import { v_11e772, v_8827ec } from "./report";

type Props = {
  children: v_4a8ba2;

  onReset?: () => void;
};

type State = {
  hasError: boolean;
  message: string;
};

export class v_af2b7c extends v_b0de9c<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(v_5e9bfe): State {
    return {
      hasError: true,
      message: v_5e9bfe?.message ? String(v_5e9bfe.message).slice(0, 120) : "Unknown error",
    };
  }

  componentDidCatch(v_5e9bfe, info: v_fa153e): void {
    v_11e772({
      category: "ui",
      message: "ErrorBoundary caught",
      data: { componentStack: v_34d5e3.componentStack?.slice(0, 300) },
    });
    v_8827ec(v_5e9bfe, {
      isFatal: false,
      extra: { source: "ErrorBoundary" },
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, message: "" });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={v_d81136.wrap} accessibilityRole="alert">
        <Text style={v_d81136.title}>
          {v_9c213b.t("errorBoundary.title", { defaultValue: "화면을 표시하지 못했어요" })}
        </Text>
        <Text style={v_d81136.body}>
          {v_9c213b.t("errorBoundary.body", { defaultValue: "잠시 후 다시 시도해 주세요." })}
        </Text>
        {__DEV__ ? <Text style={v_d81136.dev}>{this.state.message}</Text> : null}
        <TouchableOpacity style={v_d81136.btn} onPress={this.handleReset} accessibilityRole="button">
          <Text style={v_d81136.btnText}>
            {v_9c213b.t("common.retry", { defaultValue: "다시 시도" })}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const v_d81136 = v_472849.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fafafa",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#18181b",
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: "#52525b",
    marginBottom: 16,
    textAlign: "center",
  },
  dev: {
    fontSize: 12,
    color: "#a1a1aa",
    marginBottom: 16,
    textAlign: "center",
  },
  btn: {
    backgroundColor: "#18181b",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
