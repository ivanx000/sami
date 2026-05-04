import { useState } from "react"
import {
  Alert,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from "react-native"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useGoals } from "@/context/GoalContext"
import { useSessions } from "@/context/SessionContext"
import { useAppTheme } from "@/theme/context"
import type { MainStackScreenProps } from "@/navigators/navigationTypes"

function FocusScoreSelector({
  value,
  onChange,
  accentColor,
}: {
  value: number
  onChange: (v: number) => void
  accentColor: string
}) {
  const { theme: { colors } } = useAppTheme()
  const labels = ["Rough", "Okay", "Good", "Great", "Flow"]

  return (
    <View style={$scoreRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity
          key={n}
          style={[
            $scoreBtn,
            {
              backgroundColor: n <= value ? accentColor : colors.cardElevated,
              borderColor: n <= value ? accentColor : colors.border,
            },
          ]}
          onPress={() => onChange(n)}
          activeOpacity={0.7}
        >
          <Text style={[$scoreBtnNum, { color: n <= value ? "#000" : colors.textDim }]}>
            {n}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

export function ReflectionScreen({ route, navigation }: MainStackScreenProps<"Reflection">) {
  const { goalId } = route.params
  const { getGoal } = useGoals()
  const { completeSession } = useSessions()
  const { theme: { colors, spacing } } = useAppTheme()

  const goal = getGoal(goalId)
  const [reflection, setReflection] = useState("")
  const [focusScore, setFocusScore] = useState(3)
  const [wasDistracted, setWasDistracted] = useState(false)
  const [distractionNote, setDistractionNote] = useState("")

  const handleSubmit = () => {
    if (!reflection.trim()) {
      Alert.alert("Add a reflection", "What did you get done this session?")
      return
    }
    completeSession(
      reflection.trim(),
      focusScore,
      wasDistracted,
      wasDistracted ? distractionNote.trim() || undefined : undefined,
    )
    navigation.navigate("AppsList")
  }

  if (!goal) {
    navigation.goBack()
    return null
  }

  return (
    <Screen preset="scroll" safeAreaEdges={["top", "bottom"]} systemBarStyle="light">
      <View style={[$container, { paddingHorizontal: spacing.md }]}>
        <View style={$titleBlock}>
          <Text style={[$headline, { color: colors.text }]}>Session done</Text>
          <Text style={[$subheadline, { color: colors.textDim }]}>
            Quick reflection on{" "}
            <Text style={{ color: goal.accentColor }}>{goal.name}</Text>
          </Text>
        </View>

        <View style={[$section, { backgroundColor: colors.card }]}>
          <Text style={[$label, { color: colors.textDim }]}>What did you do this session?</Text>
          <TextInput
            style={[$textArea, { color: colors.text }]}
            placeholder="I worked on…"
            placeholderTextColor={colors.textDim}
            value={reflection}
            onChangeText={setReflection}
            multiline
            autoFocus
            returnKeyType="default"
          />
        </View>

        <View style={[$section, { backgroundColor: colors.card }]}>
          <Text style={[$label, { color: colors.textDim }]}>How focused were you?</Text>
          <FocusScoreSelector
            value={focusScore}
            onChange={setFocusScore}
            accentColor={goal.accentColor}
          />
          <Text style={[$scoreDesc, { color: colors.textDim }]}>
            {["", "Rough — lots of interruptions", "Okay — a few distractions", "Good — mostly focused", "Great — solid work", "Flow state — in the zone"][focusScore]}
          </Text>
        </View>

        <View style={[$section, { backgroundColor: colors.card }]}>
          <Text style={[$label, { color: colors.textDim }]}>Were you distracted?</Text>
          <View style={$toggleRow}>
            {(["No", "Yes"] as const).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  $toggleOpt,
                  {
                    backgroundColor:
                      (opt === "Yes") === wasDistracted ? goal.accentColor : colors.cardElevated,
                  },
                ]}
                onPress={() => setWasDistracted(opt === "Yes")}
              >
                <Text
                  style={[
                    $toggleOptText,
                    { color: (opt === "Yes") === wasDistracted ? "#000" : colors.textDim },
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {wasDistracted && (
            <TextInput
              style={[$noteInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="What distracted you?"
              placeholderTextColor={colors.textDim}
              value={distractionNote}
              onChangeText={setDistractionNote}
            />
          )}
        </View>

        <TouchableOpacity
          style={[$submitBtn, { backgroundColor: goal.accentColor }]}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Text style={$submitBtnText}>Save reflection</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  )
}

const $container: ViewStyle = {
  gap: 16,
  paddingTop: 16,
  paddingBottom: 32,
}

const $titleBlock: ViewStyle = {
  gap: 4,
  marginBottom: 4,
}

const $headline: TextStyle = {
  fontSize: 26,
  fontWeight: "700",
}

const $subheadline: TextStyle = {
  fontSize: 15,
}

const $section: ViewStyle = {
  borderRadius: 16,
  padding: 16,
  gap: 12,
}

const $label: TextStyle = {
  fontSize: 13,
  fontWeight: "600",
  letterSpacing: 0.5,
}

const $textArea: TextStyle = {
  fontSize: 16,
  minHeight: 72,
  textAlignVertical: "top",
}

const $scoreRow: ViewStyle = {
  flexDirection: "row",
  gap: 8,
}

const $scoreBtn: ViewStyle = {
  flex: 1,
  aspectRatio: 1,
  borderRadius: 12,
  borderWidth: 1,
  alignItems: "center",
  justifyContent: "center",
}

const $scoreBtnNum: TextStyle = {
  fontSize: 16,
  fontWeight: "700",
}

const $scoreDesc: TextStyle = {
  fontSize: 13,
}

const $toggleRow: ViewStyle = {
  flexDirection: "row",
  gap: 10,
}

const $toggleOpt: ViewStyle = {
  flex: 1,
  borderRadius: 12,
  padding: 12,
  alignItems: "center",
}

const $toggleOptText: TextStyle = {
  fontSize: 15,
  fontWeight: "600",
}

const $noteInput: TextStyle = {
  borderBottomWidth: 1,
  fontSize: 15,
  paddingVertical: 8,
}

const $submitBtn: ViewStyle = {
  borderRadius: 16,
  padding: 16,
  alignItems: "center",
  marginTop: 4,
}

const $submitBtnText: TextStyle = {
  color: "#000",
  fontSize: 16,
  fontWeight: "700",
}
