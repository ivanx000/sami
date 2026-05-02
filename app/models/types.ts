import type { GoalAccentColor } from "@/theme/colors"

export interface TimeFrame {
  id: string
  startTime: string
  endTime: string
  days: number[]
}

export interface BlockedApp {
  id: string
  name: string
  brandColor?: string
  accentColor: string
  blockedForever: boolean
  overrideUnblocked?: boolean
  timeFrames: TimeFrame[]
  createdAt: string
  groupId?: string
  blockingStartedAt?: string
  blockedMinutesByDay?: Record<string, number>
}

export interface Goal {
  id: string
  name: string
  description?: string
  accentColor: GoalAccentColor
  isArchived: boolean
  createdAt: string
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
