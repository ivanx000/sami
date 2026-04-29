const palette = {
  // Warm Paper palette (V1)
  warmBg:           '#FAF9F6',
  warmSurface:      '#FFFFFF',
  warmSurfaceAlt:   '#F4F2ED',
  warmBorder:       '#E5E0D5',
  warmBorderSub:    '#EDE9E2',
  warmText:         '#1A1714',
  warmTextDim:      '#8A7F72',
  warmTextFaint:    '#BAB2A6',
  warmAccent:       '#2E7D52',
  warmDanger:       '#C0392B',
  warmDangerBg:     '#FDF1F0',

  // Goal accent colors — each blocked app gets one
  goalTeal:   "#00C9A7",
  goalPurple: "#8B5CF6",
  goalCoral:  "#FF6B6B",
  goalOrange: "#FF9F43",
  goalBlue:   "#4ECDC4",
  goalGreen:  "#6BCB77",
  goalPink:   "#FF85A1",
  goalYellow: "#FFD93D",

  // Legacy keys kept for built-in components
  secondary500: "#41476E",
  accent100:    "#F4F2ED",

  angry100: "#FDF1F0",
  angry500: "#C0392B",

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
  text:           palette.warmText,
  textDim:        palette.warmTextDim,
  background:     palette.warmBg,
  card:           palette.warmSurface,
  cardElevated:   palette.warmSurfaceAlt,
  border:         palette.warmBorder,
  tint:           palette.warmAccent,
  tintInactive:   palette.warmTextFaint,
  separator:      palette.warmBorderSub,
  error:          palette.warmDanger,
  errorBackground:palette.warmDangerBg,
} as const
