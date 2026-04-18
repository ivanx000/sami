import type { GoalAccentColor } from "@/theme/colors"

export interface Goal {
  id: string
  name: string
  why: string
  accentColor: GoalAccentColor
  targetDate?: string
  createdAt: string
  isArchived: boolean
}

export interface FocusSession {
  id: string
  goalId: string
  startedAt: string
  endedAt: string
  plannedDuration: number
  actualDuration: number
  reflection: string
  focusScore: number
  wasDistracted: boolean
  distractionNote?: string
  completedFully: boolean
}
