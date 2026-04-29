import { useState } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ChevronLeftIcon } from "react-native-heroicons/outline"

import { AppIcon } from "@/components/AppIcon"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAppBlock } from "@/context/AppBlockContext"
import { CURATED_APPS } from "@/data/curatedApps"
import { useAppIcons } from "@/hooks/useAppIcons"
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

// ---- Usage Chart ----

function UsageChart({
  timeFrames,
  colors,
}: {
  timeFrames: TimeFrame[]
  colors: ReturnType<typeof useAppTheme>["theme"]["colors"]
}) {
  // Days Sun-Sat (0-6), check which are blocked
  const blockedDays = new Set(timeFrames.flatMap((tf) => tf.days))
  const usageHours = [2.1, 0.4, 1.8, 0.0, 1.5, 3.2, 2.8]
  const maxH = Math.max(...usageHours)
  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"]

  return (
    <View
      style={[
        $chartCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[$sectionLabel, { color: colors.tintInactive }]}>Usage this week</Text>
      <View style={$usageBars}>
        {usageHours.map((h, i) => (
          <View
            key={i}
            style={[
              $usageBar,
              {
                flex: 1,
                height: h > 0 ? Math.max((h / maxH) * 56, 4) : 3,
                backgroundColor: blockedDays.has(i) ? colors.tint : colors.tintInactive,
                opacity: blockedDays.has(i) ? 0.7 : 0.35,
              },
            ]}
          />
        ))}
      </View>
      <View style={$usageBarLabels}>
        {dayLabels.map((d, i) => (
          <Text
            key={i}
            style={[
              $usageBarLabel,
              { flex: 1, color: blockedDays.has(i) ? colors.tint : colors.tintInactive },
            ]}
          >
            {d}
          </Text>
        ))}
      </View>
      {/* Legend */}
      <View style={{ flexDirection: "row", gap: 14, marginTop: 10 }}>
        {[
          { color: colors.tint, label: "Blocked days" },
          { color: colors.tintInactive, label: "Open days" },
        ].map((x) => (
          <View key={x.label} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <View
              style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: x.color, opacity: 0.7 }}
            />
            <Text style={{ fontSize: 10, color: colors.tintInactive }}>{x.label}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

// ---- Time Frame Row ----

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
    <View style={[$tfRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[$tfAccent, { backgroundColor: accentColor }]} />
      <View style={$tfContent}>
        <Text style={[$tfDays, { color: colors.text }]}>{formatDays(tf.days)}</Text>
        <Text style={[$tfTime, { color: colors.tintInactive }]}>
          {formatTime(tf.startTime)} – {formatTime(tf.endTime)}
        </Text>
      </View>
      <TouchableOpacity onPress={onDelete} hitSlop={8}>
        <Text style={[$tfDeleteText, { color: colors.tintInactive }]}>✕</Text>
      </TouchableOpacity>
    </View>
  )
}

// ---- Add Time Frame Modal ----

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

          <Text style={[$tfInputLabel, { color: colors.tintInactive }]}>Days</Text>
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
                  <Text style={[$dayChipText, { color: selected ? "#fff" : colors.tintInactive }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <View style={$timeRow}>
            <View style={$timeField}>
              <Text style={[$tfInputLabel, { color: colors.tintInactive }]}>Start</Text>
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
                placeholderTextColor={colors.tintInactive}
                keyboardType="numbers-and-punctuation"
                returnKeyType="next"
              />
            </View>
            <Text style={[$timeSep, { color: colors.tintInactive }]}>–</Text>
            <View style={$timeField}>
              <Text style={[$tfInputLabel, { color: colors.tintInactive }]}>End</Text>
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
                placeholderTextColor={colors.tintInactive}
                keyboardType="numbers-and-punctuation"
                returnKeyType="done"
                onSubmitEditing={handleAdd}
              />
            </View>
          </View>

          {error ? <Text style={[$errorText, { color: colors.error }]}>{error}</Text> : null}

          <View style={$modalActions}>
            <TouchableOpacity
              style={[$modalBtn, { backgroundColor: colors.cardElevated }]}
              onPress={handleClose}
            >
              <Text style={{ color: colors.tintInactive }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[$modalBtn, { backgroundColor: accentColor }]}
              onPress={handleAdd}
            >
              <Text style={{ color: "#fff", fontFamily: "spaceGroteskBold" }}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ---- Main Screen ----

export function AppDetailScreen({ route, navigation }: MainStackScreenProps<"AppDetail">) {
  const { appId } = route.params
  const { getApp, updateApp, deleteApp, addTimeFrame, removeTimeFrame } = useAppBlock()
  const {
    theme: { colors, spacing },
  } = useAppTheme()
  const insets = useSafeAreaInsets()
  const [showAddModal, setShowAddModal] = useState(false)

  const app = getApp(appId)

  const curatedApp = CURATED_APPS.find((c) => c.name === app?.name)
  const iconUrls = useAppIcons(curatedApp ? [curatedApp] : [])
  const iconUrl = curatedApp ? iconUrls[curatedApp.id] : undefined

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

  const scheduleType = app.blockedForever
    ? "Always"
    : app.timeFrames.length > 0
      ? "Scheduled"
      : "No schedule"

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} systemBarStyle="dark">
      {/* Top bar */}
      <View style={[$topBar, { paddingHorizontal: spacing.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={$backBtn} activeOpacity={0.7}>
          <ChevronLeftIcon size={18} color={colors.tint} strokeWidth={2} />
          <Text style={[$backText, { color: colors.tint }]}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete}>
          <Text style={[$removeText, { color: colors.error }]}>Remove</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          $scrollContent,
          { paddingHorizontal: spacing.md, paddingBottom: insets.bottom + 32 },
        ]}
      >
        {/* App identity */}
        <View style={$appHero}>
          <AppIcon
            name={app.name}
            initials={app.name.slice(0, 2).toUpperCase()}
            brandColor={app.brandColor ?? app.accentColor}
            iconUrl={iconUrl}
            size={52}
          />
          <View style={{ flex: 1 }}>
            <Text style={[$appName, { color: colors.text }]}>{app.name}</Text>
            <View style={[$categoryBadge, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
              <Text style={[$categoryText, { color: colors.tintInactive }]}>{scheduleType}</Text>
            </View>
          </View>
        </View>

        {/* Usage chart */}
        <UsageChart timeFrames={app.timeFrames} colors={colors} />

        {/* Stats tiles */}
        <View style={$statsTiles}>
          {[
            { val: "11.2h", label: "Saved this week" },
            { val: "3.2h", label: "Used today" },
            { val: "47", label: "Times blocked" },
          ].map((s) => (
            <View
              key={s.label}
              style={[$statTile, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[$statTileVal, { color: colors.text }]}>{s.val}</Text>
              <Text style={[$statTileLabel, { color: colors.tintInactive }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Block schedule section */}
        <Text style={[$sectionTitle, { color: colors.tintInactive }]}>Block Schedule</Text>
        <View style={[$scheduleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Block Forever row */}
          <View style={$scheduleRow}>
            <View style={$scheduleRowLeft}>
              <Text style={[$scheduleRowTitle, { color: colors.text }]}>Block Forever</Text>
              <Text style={[$scheduleRowSub, { color: colors.tintInactive }]}>
                {app.blockedForever ? "Blocked until you turn this off" : "Override all schedules"}
              </Text>
            </View>
            <Switch
              value={app.blockedForever}
              onValueChange={(v) => updateApp(appId, { blockedForever: v })}
              trackColor={{ false: colors.cardElevated, true: colors.tint }}
              ios_backgroundColor={colors.cardElevated}
            />
          </View>

          {!app.blockedForever && app.timeFrames.length > 0 && (
            <>
              <View style={[$divider, { backgroundColor: colors.separator }]} />
              {app.timeFrames.map((tf, idx) => (
                <View key={tf.id}>
                  {idx > 0 && <View style={[$divider, { backgroundColor: colors.separator }]} />}
                  <TimeFrameRow
                    tf={tf}
                    accentColor={app.accentColor}
                    onDelete={() => removeTimeFrame(appId, tf.id)}
                  />
                </View>
              ))}
            </>
          )}

          {!app.blockedForever && (
            <>
              <View style={[$divider, { backgroundColor: colors.separator }]} />
              <TouchableOpacity
                style={$addTfRow}
                onPress={() => setShowAddModal(true)}
                activeOpacity={0.7}
              >
                <Text style={[$addTfText, { color: colors.tint }]}>+ Add Time Frame</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Motivation note */}
        <View
          style={[$motivationCard, { backgroundColor: colors.accentBg, borderColor: colors.accentBorder }]}
        >
          <Text style={[$motivationTitle, { color: colors.tint }]}>Why you blocked this</Text>
          <Text style={[$motivationText, { color: colors.text }]}>
            "Stop mindless scrolling — be more present."
          </Text>
        </View>
      </ScrollView>

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

// ---- Styles ----

const $topBar: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: 12,
}

const $backBtn: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 2,
}

const $backText: TextStyle = {
  fontSize: 14,
  fontFamily: "spaceGroteskSemiBold",
}

const $removeText: TextStyle = {
  fontSize: 13,
  fontFamily: "spaceGroteskSemiBold",
}

const $scrollContent: ViewStyle = {
  gap: 12,
  paddingTop: 4,
}

const $appHero: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 14,
  paddingBottom: 8,
}

const $appName: TextStyle = {
  fontSize: 22,
  letterSpacing: -0.6,
  marginBottom: 6,
  fontFamily: "spaceGroteskBold",
}

const $categoryBadge: ViewStyle = {
  alignSelf: "flex-start",
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderRadius: 8,
  borderWidth: 1,
}

const $categoryText: TextStyle = {
  fontSize: 11,
  fontFamily: "spaceGroteskSemiBold",
}

const $chartCard: ViewStyle = {
  borderRadius: 16,
  padding: 16,
  borderWidth: 1,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 3,
  elevation: 1,
}

const $sectionLabel: TextStyle = {
  fontSize: 11,
  fontFamily: "spaceGroteskSemiBold",
  letterSpacing: 0.5,
  textTransform: "uppercase",
  marginBottom: 14,
}

const $usageBars: ViewStyle = {
  flexDirection: "row",
  alignItems: "flex-end",
  gap: 5,
  height: 56,
}

const $usageBar: ViewStyle = {
  borderRadius: 4,
}

const $usageBarLabels: ViewStyle = {
  flexDirection: "row",
  gap: 5,
  marginTop: 6,
}

const $usageBarLabel: TextStyle = {
  textAlign: "center",
  fontSize: 9,
  fontFamily: "spaceGroteskSemiBold",
}

const $statsTiles: ViewStyle = {
  flexDirection: "row",
  gap: 8,
}

const $statTile: ViewStyle = {
  flex: 1,
  borderRadius: 12,
  padding: 12,
  alignItems: "center",
  borderWidth: 1,
  gap: 4,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.03,
  shadowRadius: 2,
  elevation: 1,
}

const $statTileVal: TextStyle = {
  fontSize: 15,
  fontFamily: "spaceGroteskBold",
  letterSpacing: -0.3,
}

const $statTileLabel: TextStyle = {
  fontSize: 9,
  textAlign: "center",
  lineHeight: 13,
}

const $sectionTitle: TextStyle = {
  fontSize: 11,
  fontFamily: "spaceGroteskBold",
  letterSpacing: 0.8,
  textTransform: "uppercase",
  paddingLeft: 2,
  marginBottom: -4,
}

const $scheduleCard: ViewStyle = {
  borderRadius: 14,
  overflow: "hidden",
  borderWidth: 1,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 3,
  elevation: 1,
}

const $scheduleRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 14,
  paddingVertical: 14,
  gap: 12,
}

const $scheduleRowLeft: ViewStyle = {
  flex: 1,
  gap: 2,
}

const $scheduleRowTitle: TextStyle = {
  fontSize: 14,
  fontFamily: "spaceGroteskSemiBold",
}

const $scheduleRowSub: TextStyle = {
  fontSize: 11,
}

const $divider: ViewStyle = {
  height: 1,
  marginHorizontal: 14,
}

const $tfRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
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
  fontFamily: "spaceGroteskSemiBold",
}

const $tfTime: TextStyle = {
  fontSize: 12,
}

const $tfDeleteText: TextStyle = {
  fontSize: 16,
}

const $addTfRow: ViewStyle = {
  paddingHorizontal: 14,
  paddingVertical: 14,
  alignItems: "center",
}

const $addTfText: TextStyle = {
  fontSize: 14,
  fontFamily: "spaceGroteskSemiBold",
}

const $motivationCard: ViewStyle = {
  borderRadius: 14,
  padding: 14,
  borderWidth: 1,
}

const $motivationTitle: TextStyle = {
  fontSize: 11,
  fontFamily: "spaceGroteskBold",
  letterSpacing: 0.3,
  marginBottom: 5,
}

const $motivationText: TextStyle = {
  fontSize: 13,
  lineHeight: 20,
  fontStyle: "italic",
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
  fontFamily: "spaceGroteskBold",
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
  fontFamily: "spaceGroteskSemiBold",
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
