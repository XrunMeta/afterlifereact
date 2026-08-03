import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { addBreadcrumb, reportError } from "./report";

type Props = {
  children: ReactNode;

  onReset?: () => void;
};

type State = {
  hasError: boolean;
  message: string;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message ? String(error.message).slice(0, 120) : "Unknown error",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    addBreadcrumb({
      category: "ui",
      message: "ErrorBoundary caught",
      data: { componentStack: info.componentStack?.slice(0, 300) },
    });
    reportError(error, {
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
      <View style={styles.wrap} accessibilityRole="alert">
        <Text style={styles.title}>화면을 표시하지 못했어요</Text>
        <Text style={styles.body}>잠시 후 다시 시도해 주세요.</Text>
        {__DEV__ ? <Text style={styles.dev}>{this.state.message}</Text> : null}
        <TouchableOpacity style={styles.btn} onPress={this.handleReset} accessibilityRole="button">
          <Text style={styles.btnText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
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
