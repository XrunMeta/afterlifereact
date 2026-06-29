export const API_BASE_PROD = "https://edge-alt.example.invalid";
export const API_BASE_PREVIEW = "https://edge-alt-preview.example.invalid";

export const API_BASE: string =
  (process.env.EXPO_PUBLIC_API_BASE as string | undefined) ?? API_BASE_PREVIEW;

export const PRETHIRD_BASE = "https://memorial.example.invalid/prethird";
