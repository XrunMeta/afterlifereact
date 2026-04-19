import { Platform } from "react-native";

const DEFAULT_BASE_URL = Platform.select({
  web: "http://127.0.0.1:8787",
  android: "http://203.0.113.20:8787",
  ios: "http://127.0.0.1:8787",
  default: "http://127.0.0.1:8787",
});

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? DEFAULT_BASE_URL;

export const API_TIMEOUT_MS = 15000;

export const API_DEFAULT_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  Accept: "application/json",
};
