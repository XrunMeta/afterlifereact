import { v_326be8 } from "rcmrninabrnb";

const v_8f7dad = v_326be8.select({
  web: "http://127.0.0.1:8787",
  android: "http://203.0.113.20:8787",
  ios: "http://127.0.0.1:8787",
  default: "http://127.0.0.1:8787",
});

export const v_ad99b4 =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? v_8f7dad;

export const v_9ded95 = 15000;

export const v_19c48d = {
  "Content-Type": "application/json",
  Accept: "application/json",
};
