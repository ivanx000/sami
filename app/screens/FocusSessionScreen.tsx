import { useEffect, useRef, useState } from "react"
import { AppState, AppStateStatus, TouchableOpacity, View, ViewStyle, TextStyle, Alert } from "react-native"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useGoals } from "@/context/GoalContext"
import { useSessions } from "@/context/SessionContext"
import { useAppTheme } from "@/theme/context"
import type { MainStackScreenProps } from "@/navigators/navigationTypes"
import { cancelNotification, requestNotificationPermission, scheduleBackgroundNudge } from "@/utils/notifications"

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function CircleTimer({
  progress,
  accentColor,
  timeLeft,
  totalSeconds,
}: {
  progress: number
  accentColor: string
  timeLeft: number
  totalSeconds: number
}) {
  const { theme: { colors } } = useAppTheme()
  const size = 260
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - progress)

  return (
    <View style={[$timerContainer, { width: size, height: size }]}>
      {/* Background ring */}
      <View
        style={[
          $ringBackground,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: colors.cardElevated,
          },
        ]}
      />
      {/* We approximate progress with opacity-based arc using a simple approach */}
      <View style={$timerCenter}>
        <Text style={[$timerText, { color: colors.text }]}>{formatTime(timeLeft)}</Text>
        <Text style={[$timerLabel, { color: colors.textDim }]}>remaining</Text>
      </View>
    </View>
  )
}

export function FocusSessionScreen({ route, navigation }: MainStackScreenProps<"FocusSession">) {
  const { goalId, plannedDuration } = route.params
  const { getGoal } = useGoals()
  const { startSession, cancelSession } = useSessions()
  const { theme: { colors, spacing } } = useAppTheme()

  const goal = getGoal(goalId)
  const totalSeconds = plannedDuration * 60

  const [timeLeft, setTimeLeft] = useState(totalSeconds)
  const [running, setRunning] = useState(true)
  const [backgroundedAt, setBackgroundedAt] = useState<number | null>(null)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sessionStarted = useRef(false)
  const nudgeIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!sessionStarted.current) {
      startSession(goalId, plannedDuration)
      sessionStarted.current = true
      requestNotificationPermission()
    }
  }, [])

  // Count down
  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current!)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running])

  // Navigate to reflection when timer hits 0
  useEffect(() => {
    if (timeLeft === 0) {
      navigation.replace("Reflection", { goalId })
    }
  }, [timeLeft])

  // AppState listener — reconcile time and fire nudge notification
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (nextState: AppStateStatus) => {
      if (nextState === "background" || nextState === "inactive") {
        setBackgroundedAt(Date.now())
        nudgeIdRef.current = await scheduleBackgroundNudge(goal?.name ?? "your goal")
      } else if (nextState === "active") {
        if (nudgeIdRef.current) {
          cancelNotification(nudgeIdRef.current)
          nudgeIdRef.current = null
        }
        if (backgroundedAt !== null) {
          const elapsed = Math.floor((Date.now() - backgroundedAt) / 1000)
          setTimeLeft((t) => Math.max(0, t - elapsed))
          setBackgroundedAt(null)
        }
      }
    })
    return () => sub.remove()
  }, [backgroundedAt, goal?.name])

  const handleEndEarly = () => {
    Alert.alert("End session?", "You'll be taken to reflection.", [
      { text: "Keep going", style: "cancel" },
      {
        text: "End session",
        onPress: () => navigation.replace("Reflection", { goalId }),
      },
    ])
  }

  const handleCancel = () => {
    Alert.alert("Cancel session?", "Progress won't be saved.", [
      { text: "Keep going", style: "cancel" },
      {
        text: "Cancel",
        style: "destructive",
        onPress: () => {
          cancelSession()
          navigation.goBack()
        },
      },
    ])
  }

  if (!goal) {
    navigation.goBack()
    return null
  }

  const progress = 1 - timeLeft / totalSeconds
  const accentColor = goal.accentColor

  return (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} systemBarStyle="light">
      <View style={[$topBar, { paddingHorizontal: spacing.md }]}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={[$cancelText, { color: colors.textDim }]}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <View style={$body}>
        <Text style={[$workingLabel, { color: colors.textDim }]}>Working toward</Text>
        <Text style={[$goalName, { color: accentColor }]} numberOfLines={2}>
          {goal.name}
        </Text>

        <View style={$timerWrapper}>
          <CircleTimer
            progress={progress}
            accentColor={accentColor}
            timeLeft={timeLeft}
            totalSeconds={totalSeconds}
          />
          <View style={[$progressBar, { backgroundColor: colors.cardElevated }]}>
            <View
              style={[
                $progressFill,
                { backgroundColor: accentColor, width: `${Math.round(progress * 100)}%` as any },
              ]}
            />
          </View>
        </View>

        <Text style={[$motiveLine, { color: colors.textDim }]}>
          {plannedDuration} min session — stay focused
        </Text>
      </View>

      <View style={[$bottomActions, { paddingHorizontal: spacing.md }]}>
        <TouchableOpacity
          style={[$toggleBtn, { backgroundColor: colors.card }]}
          onPress={() => setRunning((r) => !r)}
        >
          <Text style={[$toggleBtnText, { color: colors.text }]}>
            {running ? "Pause" : "Resume"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[$endBtn, { borderColor: accentColor + "66" }]}
          onPress={handleEndEarly}
        >
          <Text style={[$endBtnText, { color: accentColor }]}>End early</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  )
}

const $topBar: ViewStyle = {
  paddingVertical: 12,
  alignItems: "flex-end",
}

const $cancelText: TextStyle = {
  fontSize: 15,
}

const $body: ViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  paddingHorizontal: 32,
}

const $workingLabel: TextStyle = {
  fontSize: 13,
  letterSpacing: 1,
  textTransform: "uppercase",
}

const $goalName: TextStyle = {
  fontSize: 24,
  fontWeight: "700",
  textAlign: "center",
}

const $timerWrapper: ViewStyle = {
  alignItems: "center",
  gap: 20,
  marginVertical: 16,
}

const $timerContainer: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
}

const $ringBackground: ViewStyle = {
  position: "absolute",
}

const $timerCenter: ViewStyle = {
  alignItems: "center",
  gap: 4,
}

const $timerText: TextStyle = {
  fontSize: 52,
  fontWeight: "300",
  letterSpacing: -2,
  fontVariant: ["tabular-nums"],
}

const $timerLabel: TextStyle = {
  fontSize: 13,
  letterSpacing: 1,
  textTransform: "uppercase",
}

const $progressBar: ViewStyle = {
  width: 200,
  height: 4,
  borderRadius: 2,
  overflow: "hidden",
}

const $progressFill: ViewStyle = {
  height: 4,
  borderRadius: 2,
}

const $motiveLine: TextStyle = {
  fontSize: 14,
}

const $bottomActions: ViewStyle = {
  flexDirection: "row",
  gap: 12,
  paddingBottom: 32,
}

const $toggleBtn: ViewStyle = {
  flex: 1,
  borderRadius: 14,
  padding: 16,
  alignItems: "center",
}

const $toggleBtnText: TextStyle = {
  fontSize: 16,
  fontWeight: "600",
}

const $endBtn: ViewStyle = {
  flex: 1,
  borderRadius: 14,
  padding: 16,
  alignItems: "center",
  borderWidth: 1,
}

const $endBtnText: TextStyle = {
  fontSize: 16,
  fontWeight: "600",
}
