import { Alert, FlatList, TouchableOpacity, View, ViewStyle, TextStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { format } from "date-fns"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useGoals } from "@/context/GoalContext"
import { useSessions } from "@/context/SessionContext"
import type { FocusSession } from "@/models/types"
import { useAppTheme } from "@/theme/context"
import type { MainStackScreenProps } from "@/navigators/navigationTypes"

const DURATION_PRESETS = [
  { label: "25 min", value: 25 },
  { label: "50 min", value: 50 },
  { label: "90 min", value: 90 },
]

function SessionRow({ session, accentColor }: { session: FocusSession; accentColor: string }) {
  const { theme: { colors } } = useAppTheme()
  const date = format(new Date(session.startedAt), "MMM d")
  const dots = Array.from({ length: 5 }, (_, i) => i < session.focusScore)

  return (
    <View style={[$sessionRow, { borderLeftColor: accentColor, backgroundColor: colors.card }]}>
      <View style={$sessionMeta}>
        <Text style={[$sessionDate, { color: colors.textDim }]}>{date}</Text>
        <Text style={[$sessionDuration, { color: colors.text }]}>
          {session.actualDuration}m
        </Text>
        <View style={$focusDots}>
          {dots.map((filled, i) => (
            <View
              key={i}
              style={[$focusDot, { backgroundColor: filled ? accentColor : colors.cardElevated }]}
            />
          ))}
        </View>
      </View>
      {session.reflection ? (
        <Text style={[$sessionReflection, { color: colors.textDim }]} numberOfLines={2}>
          {session.reflection}
        </Text>
      ) : null}
    </View>
  )
}

export function GoalDetailScreen({ route, navigation }: MainStackScreenProps<"GoalDetail">) {
  const { goalId } = route.params
  const { getGoal, archiveGoal } = useGoals()
  const { getSessionsForGoal } = useSessions()
  const { theme: { colors, spacing } } = useAppTheme()
  const insets = useSafeAreaInsets()

  const goal = getGoal(goalId)
  const sessions = getSessionsForGoal(goalId).slice().reverse()

  if (!goal) {
    navigation.goBack()
    return null
  }

  const totalMinutes = sessions.reduce((sum, s) => sum + s.actualDuration, 0)
  const avgFocus =
    sessions.length > 0
      ? (sessions.reduce((sum, s) => sum + s.focusScore, 0) / sessions.length).toFixed(1)
      : "—"

  const handleArchive = () => {
    Alert.alert("Archive goal?", "You can find it in insights.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Archive",
        style: "destructive",
        onPress: () => {
          archiveGoal(goalId)
          navigation.goBack()
        },
      },
    ])
  }

  const startSession = (duration: number) => {
    navigation.navigate("FocusSession", { goalId, plannedDuration: duration })
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} systemBarStyle="light">
      <View style={[$topBar, { paddingHorizontal: spacing.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={$backBtn}>
          <Text style={[$backArrow, { color: colors.tint }]}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleArchive}>
          <Text style={[$archiveText, { color: colors.textDim }]}>Archive</Text>
        </TouchableOpacity>
      </View>

      <View style={[$goalHero, { paddingHorizontal: spacing.md }]}>
        <View style={[$accentLine, { backgroundColor: goal.accentColor }]} />
        <View style={$heroText}>
          <Text style={[$goalName, { color: colors.text }]}>{goal.name}</Text>
          <Text style={[$goalWhy, { color: colors.textDim }]}>{goal.why}</Text>
        </View>
      </View>

      <View style={[$statsRow, { paddingHorizontal: spacing.md }]}>
        <View style={[$statCard, { backgroundColor: colors.card }]}>
          <Text style={[$statValue, { color: goal.accentColor }]}>{sessions.length}</Text>
          <Text style={[$statLabel, { color: colors.textDim }]}>Sessions</Text>
        </View>
        <View style={[$statCard, { backgroundColor: colors.card }]}>
          <Text style={[$statValue, { color: goal.accentColor }]}>{totalMinutes}m</Text>
          <Text style={[$statLabel, { color: colors.textDim }]}>Total</Text>
        </View>
        <View style={[$statCard, { backgroundColor: colors.card }]}>
          <Text style={[$statValue, { color: goal.accentColor }]}>{avgFocus}</Text>
          <Text style={[$statLabel, { color: colors.textDim }]}>Avg focus</Text>
        </View>
      </View>

      <View style={[$durationRow, { paddingHorizontal: spacing.md }]}>
        {DURATION_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset.value}
            style={[$durationBtn, { backgroundColor: goal.accentColor }]}
            onPress={() => startSession(preset.value)}
            activeOpacity={0.8}
          >
            <Text style={$durationBtnText}>{preset.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {sessions.length > 0 ? (
        <>
          <Text style={[$sectionTitle, { color: colors.textDim, paddingHorizontal: spacing.md }]}>
            Sessions
          </Text>
          <FlatList
            data={sessions}
            keyExtractor={(s) => s.id}
            renderItem={({ item }) => (
              <SessionRow session={item} accentColor={goal.accentColor} />
            )}
            contentContainerStyle={{
              paddingHorizontal: spacing.md,
              paddingBottom: insets.bottom + 80,
              gap: 8,
            }}
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : (
        <View style={$noSessions}>
          <Text style={[$noSessionsText, { color: colors.textDim }]}>
            Start your first session above
          </Text>
        </View>
      )}
    </Screen>
  )
}

const $topBar: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: 12,
}

const $backBtn: ViewStyle = {
  padding: 4,
}

const $backArrow: TextStyle = {
  fontSize: 22,
  fontWeight: "600",
}

const $archiveText: TextStyle = {
  fontSize: 14,
}

const $goalHero: ViewStyle = {
  flexDirection: "row",
  gap: 14,
  paddingVertical: 16,
}

const $accentLine: ViewStyle = {
  width: 4,
  borderRadius: 2,
}

const $heroText: ViewStyle = {
  flex: 1,
  gap: 4,
}

const $goalName: TextStyle = {
  fontSize: 22,
  fontWeight: "800",
}

const $goalWhy: TextStyle = {
  fontSize: 15,
}

const $statsRow: ViewStyle = {
  flexDirection: "row",
  gap: 10,
  marginBottom: 16,
}

const $statCard: ViewStyle = {
  flex: 1,
  borderRadius: 14,
  padding: 14,
  alignItems: "center",
  gap: 2,
}

const $statValue: TextStyle = {
  fontSize: 20,
  fontWeight: "700",
}

const $statLabel: TextStyle = {
  fontSize: 11,
}

const $durationRow: ViewStyle = {
  flexDirection: "row",
  gap: 10,
  marginBottom: 20,
}

const $durationBtn: ViewStyle = {
  flex: 1,
  borderRadius: 14,
  padding: 14,
  alignItems: "center",
}

const $durationBtnText: TextStyle = {
  color: "#000",
  fontWeight: "700",
  fontSize: 14,
}

const $sectionTitle: TextStyle = {
  fontSize: 12,
  fontWeight: "600",
  letterSpacing: 1,
  textTransform: "uppercase",
  marginBottom: 8,
}

const $sessionRow: ViewStyle = {
  borderRadius: 12,
  borderLeftWidth: 3,
  padding: 14,
  gap: 6,
}

const $sessionMeta: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
}

const $sessionDate: TextStyle = {
  fontSize: 13,
  width: 48,
}

const $sessionDuration: TextStyle = {
  fontSize: 14,
  fontWeight: "600",
  width: 36,
}

const $focusDots: ViewStyle = {
  flexDirection: "row",
  gap: 4,
}

const $focusDot: ViewStyle = {
  width: 8,
  height: 8,
  borderRadius: 4,
}

const $sessionReflection: TextStyle = {
  fontSize: 13,
  lineHeight: 18,
}

const $noSessions: ViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
}

const $noSessionsText: TextStyle = {
  fontSize: 15,
}
