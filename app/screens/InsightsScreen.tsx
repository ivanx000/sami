import { ScrollView, View, ViewStyle, TextStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay } from "date-fns"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useGoals } from "@/context/GoalContext"
import { useSessions } from "@/context/SessionContext"
import type { FocusSession } from "@/models/types"
import { useAppTheme } from "@/theme/context"

function WeekBar({ sessions, accentColor }: { sessions: FocusSession[]; accentColor: string }) {
  const { theme: { colors } } = useAppTheme()
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const maxMinutes = Math.max(
    ...days.map((d) =>
      sessions
        .filter((s) => isSameDay(new Date(s.startedAt), d))
        .reduce((sum, s) => sum + s.actualDuration, 0),
    ),
    1,
  )

  return (
    <View style={$weekBarContainer}>
      {days.map((day) => {
        const daySessions = sessions.filter((s) => isSameDay(new Date(s.startedAt), day))
        const minutes = daySessions.reduce((sum, s) => sum + s.actualDuration, 0)
        const heightPct = minutes / maxMinutes
        const isToday = isSameDay(day, today)

        return (
          <View key={day.toISOString()} style={$dayCol}>
            <View style={$barTrack}>
              <View
                style={[
                  $barFill,
                  {
                    height: `${Math.max(heightPct * 100, minutes > 0 ? 8 : 0)}%` as any,
                    backgroundColor: accentColor,
                    opacity: 0.5 + heightPct * 0.5,
                  },
                ]}
              />
            </View>
            <Text style={[$dayLabel, { color: isToday ? colors.text : colors.textDim, fontWeight: isToday ? "700" : "400" }]}>
              {format(day, "EEE")[0]}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

function GoalInsightCard({ goalId }: { goalId: string }) {
  const { getGoal } = useGoals()
  const { getSessionsForGoal } = useSessions()
  const { theme: { colors } } = useAppTheme()

  const goal = getGoal(goalId)
  const sessions = getSessionsForGoal(goalId)
  if (!goal || sessions.length === 0) return null

  const totalMinutes = sessions.reduce((sum, s) => sum + s.actualDuration, 0)
  const avgFocus = sessions.reduce((sum, s) => sum + s.focusScore, 0) / sessions.length

  // Find best session length (by focus score)
  const byLength = sessions.reduce((acc, s) => {
    const bucket = s.plannedDuration
    if (!acc[bucket]) acc[bucket] = { total: 0, count: 0 }
    acc[bucket].total += s.focusScore
    acc[bucket].count += 1
    return acc
  }, {} as Record<number, { total: number; count: number }>)

  const bestLength = Object.entries(byLength).sort(
    (a, b) => b[1].total / b[1].count - a[1].total / a[1].count,
  )[0]?.[0]

  return (
    <View style={[$goalCard, { backgroundColor: colors.card }]}>
      <View style={$goalCardHeader}>
        <View style={[$accentDot, { backgroundColor: goal.accentColor }]} />
        <Text style={[$goalCardName, { color: colors.text }]}>{goal.name}</Text>
      </View>

      <WeekBar sessions={sessions} accentColor={goal.accentColor} />

      <View style={$metricsRow}>
        <View style={$metric}>
          <Text style={[$metricValue, { color: goal.accentColor }]}>{sessions.length}</Text>
          <Text style={[$metricLabel, { color: colors.textDim }]}>Sessions</Text>
        </View>
        <View style={$metric}>
          <Text style={[$metricValue, { color: goal.accentColor }]}>{totalMinutes}m</Text>
          <Text style={[$metricLabel, { color: colors.textDim }]}>Total</Text>
        </View>
        <View style={$metric}>
          <Text style={[$metricValue, { color: goal.accentColor }]}>{avgFocus.toFixed(1)}</Text>
          <Text style={[$metricLabel, { color: colors.textDim }]}>Avg focus</Text>
        </View>
      </View>

      {bestLength && sessions.length >= 3 && (
        <View style={[$insight, { backgroundColor: goal.accentColor + "18" }]}>
          <Text style={[$insightText, { color: goal.accentColor }]}>
            Your best sessions are {bestLength} min long
          </Text>
        </View>
      )}
    </View>
  )
}

export function InsightsScreen() {
  const { goals } = useGoals()
  const { sessions } = useSessions()
  const { theme: { colors, spacing } } = useAppTheme()
  const insets = useSafeAreaInsets()

  const goalsWithSessions = goals.filter((g) => {
    return sessions.some((s) => s.goalId === g.id)
  })

  const thisWeekSessions = sessions.filter((s) => {
    const d = new Date(s.startedAt)
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    return d >= weekStart
  })
  const thisWeekMinutes = thisWeekSessions.reduce((sum, s) => sum + s.actualDuration, 0)

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} systemBarStyle="light">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingBottom: insets.bottom + 80,
          gap: 12,
          paddingTop: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[$pageTitle, { color: colors.text }]}>Insights</Text>

        <View style={[$summaryRow, { backgroundColor: colors.card }]}>
          <View style={$summaryItem}>
            <Text style={[$summaryValue, { color: colors.tint }]}>{thisWeekSessions.length}</Text>
            <Text style={[$summaryLabel, { color: colors.textDim }]}>Sessions this week</Text>
          </View>
          <View style={[$summaryDivider, { backgroundColor: colors.border }]} />
          <View style={$summaryItem}>
            <Text style={[$summaryValue, { color: colors.tint }]}>{thisWeekMinutes}m</Text>
            <Text style={[$summaryLabel, { color: colors.textDim }]}>Minutes focused</Text>
          </View>
        </View>

        {goalsWithSessions.length === 0 ? (
          <View style={$emptyState}>
            <Text style={[$emptyTitle, { color: colors.text }]}>No data yet</Text>
            <Text style={[$emptySubtitle, { color: colors.textDim }]}>
              Complete a session to see your insights
            </Text>
          </View>
        ) : (
          goalsWithSessions.map((g) => <GoalInsightCard key={g.id} goalId={g.id} />)
        )}
      </ScrollView>
    </Screen>
  )
}

const $pageTitle: TextStyle = {
  fontSize: 28,
  fontWeight: "800",
  marginBottom: 4,
}

const $summaryRow: ViewStyle = {
  borderRadius: 16,
  padding: 16,
  flexDirection: "row",
  alignItems: "center",
}

const $summaryItem: ViewStyle = {
  flex: 1,
  alignItems: "center",
  gap: 2,
}

const $summaryDivider: ViewStyle = {
  width: 1,
  height: 32,
  marginHorizontal: 8,
}

const $summaryValue: TextStyle = {
  fontSize: 28,
  fontWeight: "700",
}

const $summaryLabel: TextStyle = {
  fontSize: 12,
}

const $goalCard: ViewStyle = {
  borderRadius: 16,
  padding: 16,
  gap: 14,
}

const $goalCardHeader: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
}

const $accentDot: ViewStyle = {
  width: 10,
  height: 10,
  borderRadius: 5,
}

const $goalCardName: TextStyle = {
  fontSize: 16,
  fontWeight: "700",
}

const $weekBarContainer: ViewStyle = {
  flexDirection: "row",
  gap: 6,
  height: 80,
  alignItems: "flex-end",
}

const $dayCol: ViewStyle = {
  flex: 1,
  alignItems: "center",
  gap: 6,
}

const $barTrack: ViewStyle = {
  flex: 1,
  width: "100%",
  justifyContent: "flex-end",
  borderRadius: 4,
  overflow: "hidden",
}

const $barFill: ViewStyle = {
  width: "100%",
  borderRadius: 4,
  minHeight: 0,
}

const $dayLabel: TextStyle = {
  fontSize: 11,
}

const $metricsRow: ViewStyle = {
  flexDirection: "row",
}

const $metric: ViewStyle = {
  flex: 1,
  alignItems: "center",
  gap: 2,
}

const $metricValue: TextStyle = {
  fontSize: 18,
  fontWeight: "700",
}

const $metricLabel: TextStyle = {
  fontSize: 11,
}

const $insight: ViewStyle = {
  borderRadius: 10,
  padding: 12,
}

const $insightText: TextStyle = {
  fontSize: 13,
  fontWeight: "600",
}

const $emptyState: ViewStyle = {
  alignItems: "center",
  paddingVertical: 48,
  gap: 8,
}

const $emptyTitle: TextStyle = {
  fontSize: 18,
  fontWeight: "700",
}

const $emptySubtitle: TextStyle = {
  fontSize: 14,
}
