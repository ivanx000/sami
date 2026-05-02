import { useMemo } from "react"
import { useAppBlock } from "@/context/AppBlockContext"
import { useNow } from "@/hooks/useNow"
import { localDateKey } from "@/utils/scheduleUtils"

function actualBlockedMinsForDate(
  blockedMinutesByDay: Record<string, number> | undefined,
  blockingStartedAt: string | undefined,
  dk: string,
  now: Date,
): number {
  const base = blockedMinutesByDay?.[dk] ?? 0
  if (!blockingStartedAt) return base

  const sessionStart = new Date(blockingStartedAt)
  const dayStart = new Date(`${dk}T00:00:00`)
  const dayEnd = new Date(`${dk}T23:59:59.999`)
  if (sessionStart > dayEnd) return base

  const effectiveStart = sessionStart < dayStart ? dayStart : sessionStart
  const effectiveEnd = now < dayEnd ? now : dayEnd
  if (effectiveEnd <= effectiveStart) return base

  return base + (effectiveEnd.getTime() - effectiveStart.getTime()) / 60000
}

export function useBlockStats() {
  const { apps, streak } = useAppBlock()
  const now = useNow()

  return useMemo(() => {
    const today = now.getDay()

    // Build date keys for each day of the current week (Sun–Sat)
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - today)
    weekStart.setHours(0, 0, 0, 0)

    const weekDateKeys = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      return localDateKey(d)
    })

    // Sum actual blocked minutes per day across all apps
    const weeklyMinutes = weekDateKeys.map((dk) =>
      apps.reduce(
        (sum, app) =>
          sum + actualBlockedMinsForDate(app.blockedMinutesByDay, app.blockingStartedAt, dk, now),
        0,
      ),
    )

    const totalWeekMinutes = weeklyMinutes.reduce((a, b) => a + b, 0)
    const todayMinutes = weeklyMinutes[today] ?? 0

    return { weeklyMinutes, totalWeekMinutes, todayMinutes, streak }
  }, [apps, now, streak])
}
