import { useMemo } from "react"
import { useAppBlock } from "@/context/AppBlockContext"
import { useNow } from "@/hooks/useNow"
import type { BlockedApp } from "@/models/types"

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function elapsedMinutesForDay(apps: BlockedApp[], dayOfWeek: number, elapsedUntil?: number): number {
  let total = 0
  for (const app of apps) {
    for (const tf of app.timeFrames) {
      if (!tf.days.includes(dayOfWeek)) continue
      const start = timeToMinutes(tf.startTime)
      const end = timeToMinutes(tf.endTime)
      const windowMins = end > start ? end - start : 1440 - start + end
      if (elapsedUntil === undefined) {
        total += windowMins
      } else {
        // Only count the portion of the window that has already passed today
        const elapsed = Math.min(end, elapsedUntil) - start
        if (elapsed > 0) total += elapsed
      }
    }
  }
  return total
}

export function useBlockStats() {
  const { apps, streak } = useAppBlock()
  const now = useNow()

  return useMemo(() => {
    const today = now.getDay()
    const currentMinute = now.getHours() * 60 + now.getMinutes()

    const weeklyMinutes: number[] = Array.from({ length: 7 }, (_, i) => {
      if (i < today) return elapsedMinutesForDay(apps, i)
      if (i === today) return elapsedMinutesForDay(apps, i, currentMinute)
      return 0
    })

    const totalWeekMinutes = weeklyMinutes.reduce((a, b) => a + b, 0)
    const todayMinutes = weeklyMinutes[today] ?? 0

    return { weeklyMinutes, totalWeekMinutes, todayMinutes, streak }
  }, [apps, now, streak])
}
