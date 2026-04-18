const palette = {
  neutral100: "#FFFFFF",
  neutral200: "#F5F5F5",
  neutral300: "#E0E0E0",
  neutral400: "#9E9E9E",
  neutral500: "#616161",
  neutral600: "#424242",
  neutral700: "#2C2C2C",
  neutral800: "#1E1E1E",
  neutral900: "#121212",

  // Goal accent colors — each goal gets one
  goalTeal: "#00C9A7",
  goalPurple: "#8B5CF6",
  goalCoral: "#FF6B6B",
  goalOrange: "#FF9F43",
  goalBlue: "#4ECDC4",
  goalGreen: "#6BCB77",
  goalPink: "#FF85A1",
  goalYellow: "#FFD93D",

  // Legacy palette keys kept for built-in Toggle components
  secondary500: "#41476E",
  accent100: "#2C2C2C",

  angry100: "#F2D6CD",
  angry500: "#C03403",

  overlay20: "rgba(0, 0, 0, 0.2)",
  overlay50: "rgba(0, 0, 0, 0.5)",
} as const

export const GOAL_ACCENT_COLORS = [
  palette.goalTeal,
  palette.goalPurple,
  palette.goalCoral,
  palette.goalOrange,
  palette.goalBlue,
  palette.goalGreen,
  palette.goalPink,
  palette.goalYellow,
] as const

export type GoalAccentColor = (typeof GOAL_ACCENT_COLORS)[number]

export const colors = {
  palette,
  transparent: "rgba(0, 0, 0, 0)",
  text: palette.neutral100,
  textDim: palette.neutral400,
  background: palette.neutral900,
  card: palette.neutral800,
  cardElevated: palette.neutral700,
  border: palette.neutral700,
  tint: palette.goalTeal,
  tintInactive: palette.neutral600,
  separator: palette.neutral700,
  error: palette.angry500,
  errorBackground: palette.angry100,
} as const
