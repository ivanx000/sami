import { useState } from "react"
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAppBlock } from "@/context/AppBlockContext"
import type { TimeFrame } from "@/models/types"
import { useAppTheme } from "@/theme/context"
import type { MainStackScreenProps } from "@/navigators/navigationTypes"

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`
}

function formatDays(days: number[]): string {
  const sorted = [...days].sort((a, b) => a - b)
  if (sorted.length === 7) return "Every day"
  if (JSON.stringify(sorted) === JSON.stringify([1, 2, 3, 4, 5])) return "Weekdays"
  if (JSON.stringify(sorted) === JSON.stringify([0, 6])) return "Weekends"
  return sorted.map((d) => DAY_LABELS[d]).join(" · ")
}

function validateTime(t: string): boolean {
  if (!/^\d{1,2}:\d{2}$/.test(t)) return false
  const [h, m] = t.split(":").map(Number)
  return h >= 0 && h <= 23 && m >= 0 && m <= 59
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

function hasOverlap(
  existing: TimeFrame[],
  newStart: string,
  newEnd: string,
  newDays: number[],
  excludeId?: string,
): boolean {
  const ns = timeToMinutes(newStart)
  const ne = timeToMinutes(newEnd)
  return existing
    .filter((tf) => tf.id !== excludeId)
    .some((tf) => {
      const sharedDay = tf.days.some((d) => newDays.includes(d))
      if (!sharedDay) return false
      const ts = timeToMinutes(tf.startTime)
      const te = timeToMinutes(tf.endTime)
      return ns < te && ts < ne
    })
}

function TimeFrameRow({
  tf,
  accentColor,
  onDelete,
}: {
  tf: TimeFrame
  accentColor: string
  onDelete: () => void
}) {
  const {
    theme: { colors },
  } = useAppTheme()

  return (
    <View style={[$tfRow, { backgroundColor: colors.card }]}>
      <View style={[$tfAccent, { backgroundColor: accentColor }]} />
      <View style={$tfContent}>
        <Text style={[$tfDays, { color: colors.text }]}>{formatDays(tf.days)}</Text>
        <Text style={[$tfTime, { color: colors.textDim }]}>
          {formatTime(tf.startTime)} – {formatTime(tf.endTime)}
        </Text>
      </View>
      <TouchableOpacity onPress={onDelete} hitSlop={8}>
        <Text style={[$tfDeleteText, { color: colors.textDim }]}>✕</Text>
      </TouchableOpacity>
    </View>
  )
}

function AddTimeFrameModal({
  visible,
  onClose,
  onAdd,
  existingFrames,
  accentColor,
}: {
  visible: boolean
  onClose: () => void
  onAdd: (tf: Omit<TimeFrame, "id">) => void
  existingFrames: TimeFrame[]
  accentColor: string
}) {
  const {
    theme: { colors },
  } = useAppTheme()
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("17:00")
  const [error, setError] = useState("")

  const toggleDay = (day: number) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
    setError("")
  }

  const handleAdd = () => {
    if (selectedDays.length === 0) {
      setError("Select at least one day.")
      return
    }
    if (!validateTime(startTime)) {
      setError("Invalid start time. Use HH:MM (e.g. 09:00).")
      return
    }
    if (!validateTime(endTime)) {
      setError("Invalid end time. Use HH:MM (e.g. 17:00).")
      return
    }
    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      setError("End time must be after start time.")
      return
    }
    if (hasOverlap(existingFrames, startTime, endTime, selectedDays)) {
      setError("This overlaps with an existing time frame.")
      return
    }
    onAdd({ startTime, endTime, days: selectedDays })
    reset()
    onClose()
  }

  const reset = () => {
    setSelectedDays([1, 2, 3, 4, 5])
    setStartTime("09:00")
    setEndTime("17:00")
    setError("")
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={$modalOverlay}
      >
        <View style={[$modalSheet, { backgroundColor: colors.card }]}>
          <View style={[$modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[$modalTitle, { color: colors.text }]}>Add Time Frame</Text>

          <Text style={[$tfInputLabel, { color: colors.textDim }]}>Days</Text>
          <View style={$dayRow}>
            {DAY_LABELS.map((label, i) => {
              const selected = selectedDays.includes(i)
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    $dayChip,
                    {
                      backgroundColor: selected ? accentColor : colors.cardElevated,
                      borderColor: selected ? accentColor : colors.border,
                    },
                  ]}
                  onPress={() => toggleDay(i)}
                >
                  <Text style={[$dayChipText, { color: selected ? "#fff" : colors.textDim }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <View style={$timeRow}>
            <View style={$timeField}>
              <Text style={[$tfInputLabel, { color: colors.textDim }]}>Start</Text>
              <TextInput
                style={[
                  $timeInput,
                  {
                    backgroundColor: colors.cardElevated,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={startTime}
                onChangeText={(t) => {
                  setStartTime(t)
                  setError("")
                }}
                placeholder="09:00"
                placeholderTextColor={colors.textDim}
                keyboardType="numbers-and-punctuation"
                returnKeyType="next"
              />
            </View>
            <Text style={[$timeSep, { color: colors.textDim }]}>–</Text>
            <View style={$timeField}>
              <Text style={[$tfInputLabel, { color: colors.textDim }]}>End</Text>
              <TextInput
                style={[
                  $timeInput,
                  {
                    backgroundColor: colors.cardElevated,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={endTime}
                onChangeText={(t) => {
                  setEndTime(t)
                  setError("")
                }}
                placeholder="17:00"
                placeholderTextColor={colors.textDim}
                keyboardType="numbers-and-punctuation"
                returnKeyType="done"
                onSubmitEditing={handleAdd}
              />
            </View>
          </View>

          {error ? <Text style={[$errorText, { color: "#FF6B6B" }]}>{error}</Text> : null}

          <View style={$modalActions}>
            <TouchableOpacity
              style={[$modalBtn, { backgroundColor: colors.cardElevated }]}
              onPress={handleClose}
            >
              <Text style={{ color: colors.textDim }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[$modalBtn, { backgroundColor: accentColor }]}
              onPress={handleAdd}
            >
              <Text style={{ color: "#000", fontWeight: "700" }}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export function AppDetailScreen({ route, navigation }: MainStackScreenProps<"AppDetail">) {
  const { appId } = route.params
  const { getApp, updateApp, deleteApp, addTimeFrame, removeTimeFrame } = useAppBlock()
  const {
    theme: { colors, spacing },
  } = useAppTheme()
  const insets = useSafeAreaInsets()
  const [showAddModal, setShowAddModal] = useState(false)

  const app = getApp(appId)

  if (!app) {
    navigation.goBack()
    return null
  }

  const handleDelete = () => {
    Alert.alert("Remove app?", `Stop blocking ${app.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          deleteApp(appId)
          navigation.goBack()
        },
      },
    ])
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} systemBarStyle="dark">
      <View style={[$topBar, { paddingHorizontal: spacing.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={$backBtn}>
          <Text style={[$backArrow, { color: colors.tint }]}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete}>
          <Text style={[$removeText, { color: colors.error }]}>Remove</Text>
        </TouchableOpacity>
      </View>

      <View style={[$appHero, { paddingHorizontal: spacing.md }]}>
        <View style={[$accentLine, { backgroundColor: app.accentColor }]} />
        <Text style={[$appName, { color: colors.text }]}>{app.name}</Text>
      </View>

      <View
        style={[$foreverRow, { marginHorizontal: spacing.md, backgroundColor: colors.card }]}
      >
        <View style={$foreverLeft}>
          <Text style={[$foreverLabel, { color: colors.text }]}>Block Forever</Text>
          <Text style={[$foreverSub, { color: colors.textDim }]}>
            {app.blockedForever
              ? "Blocked until you turn this off"
              : "Always on, no schedule needed"}
          </Text>
        </View>
        <Switch
          value={app.blockedForever}
          onValueChange={(v) => updateApp(appId, { blockedForever: v })}
          trackColor={{ false: colors.cardElevated, true: colors.tint }}
          ios_backgroundColor={colors.cardElevated}
        />
      </View>

      {!app.blockedForever && (
        <>
          <Text
            style={[$sectionTitle, { color: colors.textDim, paddingHorizontal: spacing.md }]}
          >
            SCHEDULE
          </Text>
          <FlatList
            data={app.timeFrames}
            keyExtractor={(tf) => tf.id}
            renderItem={({ item }) => (
              <TimeFrameRow
                tf={item}
                accentColor={app.accentColor}
                onDelete={() => removeTimeFrame(appId, item.id)}
              />
            )}
            contentContainerStyle={[
              $listContent,
              { paddingHorizontal: spacing.md, paddingBottom: insets.bottom + 24 },
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={[$emptySchedule, { color: colors.textDim }]}>
                No time frames set yet
              </Text>
            }
            ListFooterComponent={
              <TouchableOpacity
                style={[
                  $addTfBtn,
                  {
                    borderColor: app.accentColor + "66",
                    backgroundColor: app.accentColor + "18",
                  },
                ]}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={[$addTfText, { color: app.accentColor }]}>+ Add Time Frame</Text>
              </TouchableOpacity>
            }
          />
        </>
      )}

      {app.blockedForever && (
        <View style={$foreverMessage}>
          <Text style={[$foreverMessageText, { color: colors.textDim }]}>
            {"This app is blocked at all times.\nToggle off to set a schedule instead."}
          </Text>
        </View>
      )}

      <AddTimeFrameModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(tf) => addTimeFrame(appId, tf)}
        existingFrames={app.timeFrames}
        accentColor={app.accentColor}
      />
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

const $removeText: TextStyle = {
  fontSize: 14,
}

const $appHero: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 14,
  paddingVertical: 16,
}

const $accentLine: ViewStyle = {
  width: 4,
  borderRadius: 2,
  alignSelf: "stretch",
  minHeight: 32,
}

const $appName: TextStyle = {
  flex: 1,
  fontSize: 22,
  fontWeight: "800",
}

const $foreverRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  borderRadius: 16,
  padding: 16,
  marginBottom: 20,
  gap: 12,
}

const $foreverLeft: ViewStyle = {
  flex: 1,
  gap: 2,
}

const $foreverLabel: TextStyle = {
  fontSize: 16,
  fontWeight: "700",
}

const $foreverSub: TextStyle = {
  fontSize: 13,
}

const $sectionTitle: TextStyle = {
  fontSize: 12,
  fontWeight: "600",
  letterSpacing: 1,
  textTransform: "uppercase",
  marginBottom: 10,
}

const $listContent: ViewStyle = {
  gap: 8,
}

const $tfRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  borderRadius: 12,
  overflow: "hidden",
  paddingRight: 14,
  gap: 14,
}

const $tfAccent: ViewStyle = {
  width: 4,
  alignSelf: "stretch",
  minHeight: 52,
}

const $tfContent: ViewStyle = {
  flex: 1,
  paddingVertical: 14,
  gap: 3,
}

const $tfDays: TextStyle = {
  fontSize: 14,
  fontWeight: "600",
}

const $tfTime: TextStyle = {
  fontSize: 13,
}

const $tfDeleteText: TextStyle = {
  fontSize: 16,
}

const $addTfBtn: ViewStyle = {
  borderRadius: 12,
  borderWidth: 1,
  padding: 14,
  alignItems: "center",
  marginTop: 4,
}

const $addTfText: TextStyle = {
  fontSize: 14,
  fontWeight: "600",
}

const $emptySchedule: TextStyle = {
  fontSize: 14,
  textAlign: "center",
  paddingVertical: 16,
}

const $foreverMessage: ViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: 32,
}

const $foreverMessageText: TextStyle = {
  fontSize: 15,
  textAlign: "center",
  lineHeight: 24,
}

const $modalOverlay: ViewStyle = {
  flex: 1,
  justifyContent: "flex-end",
}

const $modalSheet: ViewStyle = {
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  padding: 24,
  gap: 12,
}

const $modalHandle: ViewStyle = {
  width: 40,
  height: 4,
  borderRadius: 2,
  alignSelf: "center",
  marginBottom: 8,
}

const $modalTitle: TextStyle = {
  fontSize: 20,
  fontWeight: "700",
  marginBottom: 4,
}

const $tfInputLabel: TextStyle = {
  fontSize: 13,
  marginBottom: -4,
}

const $dayRow: ViewStyle = {
  flexDirection: "row",
  gap: 6,
  flexWrap: "nowrap",
}

const $dayChip: ViewStyle = {
  flex: 1,
  borderRadius: 8,
  borderWidth: 1,
  paddingVertical: 8,
  alignItems: "center",
}

const $dayChipText: TextStyle = {
  fontSize: 12,
  fontWeight: "600",
}

const $timeRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "flex-end",
  gap: 8,
}

const $timeField: ViewStyle = {
  flex: 1,
  gap: 6,
}

const $timeSep: TextStyle = {
  fontSize: 20,
  paddingBottom: 14,
}

const $timeInput: TextStyle = {
  borderRadius: 12,
  borderWidth: 1,
  padding: 14,
  fontSize: 15,
  textAlign: "center",
}

const $errorText: TextStyle = {
  fontSize: 13,
  marginTop: -4,
}

const $modalActions: ViewStyle = {
  flexDirection: "row",
  gap: 10,
  marginTop: 4,
}

const $modalBtn: ViewStyle = {
  flex: 1,
  borderRadius: 12,
  padding: 14,
  alignItems: "center",
}
