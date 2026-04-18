import { useState } from "react"
import {
  Alert,
  FlatList,
  Pressable,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useGoals } from "@/context/GoalContext"
import { useSessions } from "@/context/SessionContext"
import type { Goal } from "@/models/types"
import { GOAL_ACCENT_COLORS } from "@/theme/colors"
import { useAppTheme } from "@/theme/context"
import type { MainStackScreenProps } from "@/navigators/navigationTypes"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { MainStackParamList } from "@/navigators/navigationTypes"

type GoalsNavProp = NativeStackNavigationProp<MainStackParamList>

function SessionTimeline({ goalId, accentColor }: { goalId: string; accentColor: string }) {
  const { getSessionsForGoal } = useSessions()
  const sessions = getSessionsForGoal(goalId).slice(-30)
  const { theme: { colors } } = useAppTheme()

  const slots = Array.from({ length: 30 }, (_, i) => sessions[i] ?? null)

  return (
    <View style={$timeline}>
      {slots.map((s, i) => (
        <View
          key={i}
          style={[
            $timelineBar,
            {
              backgroundColor: s
                ? accentColor
                : colors.cardElevated,
              opacity: s ? 0.4 + (s.focusScore / 5) * 0.6 : 1,
              height: s ? 8 + (s.focusScore / 5) * 10 : 6,
            },
          ]}
        />
      ))}
    </View>
  )
}

function GoalCard({ goal, onPress }: { goal: Goal; onPress: () => void }) {
  const { getSessionsForGoal } = useSessions()
  const { theme: { colors, spacing } } = useAppTheme()
  const sessions = getSessionsForGoal(goal.id)
  const totalMinutes = sessions.reduce((sum, s) => sum + s.actualDuration, 0)

  return (
    <TouchableOpacity
      style={[$card, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={$cardHeader}>
        <View style={[$accentDot, { backgroundColor: goal.accentColor }]} />
        <View style={$cardTitleBlock}>
          <Text style={[$goalName, { color: colors.text }]} numberOfLines={1}>
            {goal.name}
          </Text>
          <Text style={[$goalWhy, { color: colors.textDim }]} numberOfLines={1}>
            {goal.why}
          </Text>
        </View>
        <View style={[$sessionBadge, { borderColor: goal.accentColor + "44" }]}>
          <Text style={[$sessionCount, { color: goal.accentColor }]}>
            {sessions.length}
          </Text>
          <Text style={[$sessionLabel, { color: colors.textDim }]}>
            {sessions.length === 1 ? "session" : "sessions"}
          </Text>
        </View>
      </View>
      <SessionTimeline goalId={goal.id} accentColor={goal.accentColor} />
    </TouchableOpacity>
  )
}

function AddGoalModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { addGoal } = useGoals()
  const { theme: { colors, spacing } } = useAppTheme()
  const [name, setName] = useState("")
  const [why, setWhy] = useState("")

  const handleAdd = () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Give your goal a name.")
      return
    }
    addGoal({ name: name.trim(), why: why.trim() || "Something worth doing" })
    setName("")
    setWhy("")
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={$modalOverlay}>
        <View style={[$modalSheet, { backgroundColor: colors.card }]}>
          <View style={[$modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[$modalTitle, { color: colors.text }]}>New Goal</Text>
          <Text style={[$inputLabel, { color: colors.textDim }]}>What do you want to achieve?</Text>
          <TextInput
            style={[$input, { backgroundColor: colors.cardElevated, color: colors.text, borderColor: colors.border }]}
            placeholder="Write my novel, run a 5k, learn piano…"
            placeholderTextColor={colors.textDim}
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="next"
          />
          <Text style={[$inputLabel, { color: colors.textDim }]}>Why does this matter to you?</Text>
          <TextInput
            style={[$input, { backgroundColor: colors.cardElevated, color: colors.text, borderColor: colors.border }]}
            placeholder="Because…"
            placeholderTextColor={colors.textDim}
            value={why}
            onChangeText={setWhy}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />
          <View style={$modalActions}>
            <TouchableOpacity style={[$modalBtn, { backgroundColor: colors.cardElevated }]} onPress={onClose}>
              <Text style={{ color: colors.textDim }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[$modalBtn, { backgroundColor: colors.tint }]} onPress={handleAdd}>
              <Text style={{ color: "#000", fontWeight: "700" }}>Add Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export function GoalsScreen() {
  const { activeGoals } = useGoals()
  const { theme: { colors, spacing } } = useAppTheme()
  const navigation = useNavigation<GoalsNavProp>()
  const insets = useSafeAreaInsets()
  const [showModal, setShowModal] = useState(false)

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} systemBarStyle="light">
      <View style={[$header, { paddingHorizontal: spacing.md }]}>
        <Text preset="heading" style={[$appTitle, { color: colors.text }]}>
          Sami
        </Text>
        <TouchableOpacity onPress={() => setShowModal(true)} style={[$fab, { backgroundColor: colors.tint }]}>
          <Text style={{ color: "#000", fontSize: 22, fontWeight: "700", lineHeight: 26 }}>+</Text>
        </TouchableOpacity>
      </View>

      {activeGoals.length === 0 ? (
        <View style={$empty}>
          <Text style={[$emptyTitle, { color: colors.text }]}>No goals yet</Text>
          <Text style={[$emptySubtitle, { color: colors.textDim }]}>
            Tap + to add your first goal
          </Text>
        </View>
      ) : (
        <FlatList
          data={activeGoals}
          keyExtractor={(g) => g.id}
          renderItem={({ item }) => (
            <GoalCard
              goal={item}
              onPress={() => navigation.navigate("GoalDetail", { goalId: item.id })}
            />
          )}
          contentContainerStyle={[$listContent, { paddingBottom: insets.bottom + 80, paddingHorizontal: spacing.md }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      <AddGoalModal visible={showModal} onClose={() => setShowModal(false)} />
    </Screen>
  )
}

const $header: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingVertical: 16,
}

const $appTitle: TextStyle = {
  fontSize: 28,
  fontWeight: "800",
}

const $fab: ViewStyle = {
  width: 36,
  height: 36,
  borderRadius: 18,
  alignItems: "center",
  justifyContent: "center",
}

const $listContent: ViewStyle = {
  gap: 12,
  paddingTop: 4,
}

const $card: ViewStyle = {
  borderRadius: 16,
  padding: 16,
  gap: 12,
}

const $cardHeader: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
}

const $accentDot: ViewStyle = {
  width: 10,
  height: 10,
  borderRadius: 5,
  flexShrink: 0,
}

const $cardTitleBlock: ViewStyle = {
  flex: 1,
  gap: 2,
}

const $goalName: TextStyle = {
  fontSize: 16,
  fontWeight: "700",
}

const $goalWhy: TextStyle = {
  fontSize: 13,
}

const $sessionBadge: ViewStyle = {
  alignItems: "center",
  borderWidth: 1,
  borderRadius: 10,
  paddingHorizontal: 10,
  paddingVertical: 4,
}

const $sessionCount: TextStyle = {
  fontSize: 16,
  fontWeight: "700",
  lineHeight: 20,
}

const $sessionLabel: TextStyle = {
  fontSize: 10,
  lineHeight: 13,
}

const $timeline: ViewStyle = {
  flexDirection: "row",
  alignItems: "flex-end",
  gap: 3,
  height: 20,
}

const $timelineBar: ViewStyle = {
  flex: 1,
  borderRadius: 2,
}

const $empty: ViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
}

const $emptyTitle: TextStyle = {
  fontSize: 20,
  fontWeight: "700",
}

const $emptySubtitle: TextStyle = {
  fontSize: 15,
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

const $inputLabel: TextStyle = {
  fontSize: 13,
  marginBottom: -4,
}

const $input: TextStyle = {
  borderRadius: 12,
  borderWidth: 1,
  padding: 14,
  fontSize: 15,
}

const $modalActions: ViewStyle = {
  flexDirection: "row",
  gap: 10,
  marginTop: 8,
}

const $modalBtn: ViewStyle = {
  flex: 1,
  borderRadius: 12,
  padding: 14,
  alignItems: "center",
}
