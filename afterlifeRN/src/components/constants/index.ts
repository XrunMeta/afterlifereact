

export const v_1bfbd0 = {

  white: "#ffffff",
  black: "#000000",
  transparent: "transparent",

  background: "#fafafa",
  text: "#18181b",
  mutedText: "#71717a",
  placeholder: "#a1a1aa",
  border: "#e4e4e7",
  divider: "#e4e4e7",
  disabled: "#d4d4d8",

  zinc50: "#fafafa",
  zinc100: "#f4f4f5",
  zinc200: "#e4e4e7",
  zinc300: "#d4d4d8",
  zinc400: "#a1a1aa",
  zinc500: "#71717a",
  zinc600: "#52525b",
  zinc700: "#3f3f46",
  zinc800: "#27272a",
  zinc900: "#18181b",
  zinc950: "#09090b",

  violet500: "#8b5cf6",
  violet600: "#7c3aed",
  violet100: "#ede9fe",

  primary: "#030213",
  telegram: "#0088cc",

  error: "#ef4444",
  success: "#22c55e",
  warning: "#f59e0b",
} as const;

export const v_843035 = {
  regular: undefined, 
  medium: undefined,
  bold: undefined,
  semiBold: undefined,
} as const;

export const v_9b1a04 = {
  xsmall: 4,
  small: 8,
  medium: 16,
  large: 20,
  xlarge: 24,
  xxlarge: 32,
  xxxlarge: 48,
} as const;

export const v_8b0c90 = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const v_963c2c = {
  background: "#fafafa",
  bottomBackground: "#fafafa",
} as const;

export const v_a61db3 = {

  getScreenStyle: (v_8519bf = v_1bfbd0.white) => ({
    flex: 1 as const,
    backgroundColor: v_8519bf,
  }),

  scrollContent: {
    flexGrow: 1 as const,
    alignItems: "center" as const,
    paddingHorizontal: v_9b1a04.large,
    paddingVertical: v_9b1a04.xlarge,
  },

  container: {
    width: "100%" as const,
    maxWidth: 780,
    gap: v_9b1a04.medium,
  },

  bottomSection: {
    marginTop: "auto" as const,
    width: "100%" as const,
    paddingTop: v_9b1a04.medium,
  },
} as const;
