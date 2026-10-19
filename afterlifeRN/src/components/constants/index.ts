

import { v_f9dce7 as v_3328ab } from "../../theme/colors";

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
  violet700: "#6d28d9",
  violet100: "#ede9fe",
  violet200: "#ddd6fe",

  secondary: v_3328ab.secondary,

  secondaryLight: v_3328ab.secondaryLight,

  accent: v_3328ab.accent,

  amber50: "#fffbeb",
  amber700: "#b45309",
  amber800: "#92400e",

  rose500: "#f43f5e",

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

export const v_8f28b1 = {
  height: 52,
  borderRadius: v_8b0c90.md,
  fontSize: 16,
  lineHeight: 22,
  paddingHorizontal: 16,

  paddingVertical: 0,
  textAlignVertical: "center" as const,

  includeFontPadding: false,

  multilinePaddingVertical: 15,
} as const;

export const v_7c5e29 = {
  height: v_8f28b1.height,
  borderRadius: v_8f28b1.borderRadius,
  paddingHorizontal: v_8f28b1.paddingHorizontal,
  paddingVertical: v_8f28b1.paddingVertical,
  fontSize: v_8f28b1.fontSize,
  lineHeight: v_8f28b1.lineHeight,
  textAlignVertical: v_8f28b1.textAlignVertical,
  includeFontPadding: v_8f28b1.includeFontPadding,
} as const;

export const v_0da505 = {
  minHeight: v_8f28b1.height,
  borderRadius: v_8f28b1.borderRadius,
  paddingHorizontal: v_8f28b1.paddingHorizontal,
  paddingTop: v_8f28b1.multilinePaddingVertical,
  paddingBottom: v_8f28b1.multilinePaddingVertical,
  fontSize: v_8f28b1.fontSize,
  lineHeight: v_8f28b1.lineHeight,

  textAlignVertical: v_8f28b1.textAlignVertical,
  includeFontPadding: v_8f28b1.includeFontPadding,
} as const;

export const v_7fd157 = {
  sm: {
    height: 40,
    borderRadius: v_8b0c90.sm,
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: "700" as const,
    fontWeightSecondary: "600" as const,
  },
  md: {
    height: 48,
    borderRadius: v_8b0c90.md,
    paddingHorizontal: 20,
    fontSize: 14,
    fontWeight: "700" as const,
    fontWeightSecondary: "600" as const,
  },
  lg: {
    height: 56,
    borderRadius: v_8b0c90.lg,
    paddingHorizontal: 24,
    fontSize: 16,
    fontWeight: "700" as const,
    fontWeightSecondary: "600" as const,
  },
} as const;

export type ButtonSizeToken = keyof typeof v_7fd157;

export const v_d43669 = {
  sm: {
    height: v_7fd157.sm.height,
    borderRadius: v_7fd157.sm.borderRadius,
    paddingHorizontal: v_7fd157.sm.paddingHorizontal,
  },
  md: {
    height: v_7fd157.md.height,
    borderRadius: v_7fd157.md.borderRadius,
    paddingHorizontal: v_7fd157.md.paddingHorizontal,
  },
  lg: {
    height: v_7fd157.lg.height,
    borderRadius: v_7fd157.lg.borderRadius,
    paddingHorizontal: v_7fd157.lg.paddingHorizontal,
  },
} as const;

export const v_c10a43 = {
  sm: {
    fontSize: v_7fd157.sm.fontSize,
    fontWeight: v_7fd157.sm.fontWeight,
  },
  md: {
    fontSize: v_7fd157.md.fontSize,
    fontWeight: v_7fd157.md.fontWeight,
  },
  lg: {
    fontSize: v_7fd157.lg.fontSize,
    fontWeight: v_7fd157.lg.fontWeight,
  },
} as const;

export const v_119e65 = {
  sm: {
    fontSize: v_7fd157.sm.fontSize,
    fontWeight: v_7fd157.sm.fontWeightSecondary,
  },
  md: {
    fontSize: v_7fd157.md.fontSize,
    fontWeight: v_7fd157.md.fontWeightSecondary,
  },
  lg: {
    fontSize: v_7fd157.lg.fontSize,
    fontWeight: v_7fd157.lg.fontWeightSecondary,
  },
} as const;

export const v_94abbe = {
  width: 40,
  height: 40,
  borderRadius: 20,
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

export const v_e3d001 = {

  chipFilled: {
    backgroundColor: v_1bfbd0.secondary,
    borderColor: v_1bfbd0.secondary,
  },
  chipFilledText: {
    color: v_1bfbd0.white,
  },

  chipOutlineActive: {
    backgroundColor: v_1bfbd0.white,
    borderColor: v_1bfbd0.secondary,
  },
  chipOutlineActiveText: {
    color: v_1bfbd0.secondary,
    fontWeight: "600" as const,
  },

  cardTint: {
    borderColor: v_1bfbd0.secondary,
    backgroundColor: v_1bfbd0.secondaryLight,
  },

  outlineTint: {
    borderColor: v_1bfbd0.secondary,
    backgroundColor: v_1bfbd0.white,
  },
  accentText: {
    color: v_1bfbd0.secondary,
  },
  accentBorder: {
    borderColor: v_1bfbd0.secondary,
  },

  radioActive: {
    borderColor: v_1bfbd0.secondary,
  },

  radioDot: {
    backgroundColor: v_1bfbd0.secondary,
  },

  checkOn: {
    backgroundColor: v_1bfbd0.secondary,
    borderColor: v_1bfbd0.secondary,
  },
} as const;

export const v_a9d3e9 = v_1bfbd0.secondary;
