import type { BlockedApp, TimeFrame } from "@/models/types"

function timeToMins(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

export function localDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function flushBlockingTime(app: BlockedApp, now: Date): BlockedApp {
  if (!app.blockingStartedAt) return app
  const start = new Date(app.blockingStartedAt)
  if (now <= start) return { ...app, blockingStartedAt: undefined }

  const history: Record<string, number> = { ...(app.blockedMinutesByDay ?? {}) }
  let cursor = new Date(start)

  while (cursor < now) {
    const key = localDateKey(cursor)
    const nextMidnight = new Date(cursor)
    nextMidnight.setDate(nextMidnight.getDate() + 1)
    nextMidnight.setHours(0, 0, 0, 0)
    const periodEnd = now < nextMidnight ? now : nextMidnight
    history[key] = (history[key] ?? 0) + (periodEnd.getTime() - cursor.getTime()) / 60000
    cursor = nextMidnight
  }

  return { ...app, blockingStartedAt: undefined, blockedMinutesByDay: history }
}

export function isInSchedule(timeFrames: TimeFrame[], now: Date): boolean {
  const day = now.getDay()
  const curr = now.getHours() * 60 + now.getMinutes()
  return timeFrames.some(
    (tf) =>
      tf.days.includes(day) &&
      curr >= timeToMins(tf.startTime) &&
      curr < timeToMins(tf.endTime),
  )
}
