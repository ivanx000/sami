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
  timeFrames: TimeFrame[]
  createdAt: string
  groupId?: string
}
