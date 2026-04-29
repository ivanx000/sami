import type { TimeFrame } from "@/models/types"

function timeToMins(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
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
