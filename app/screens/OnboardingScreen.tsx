import { useRef, useState } from "react"
import {
  Dimensions,
  Platform,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from "react-native"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated"
import * as Notifications from "expo-notifications"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAppState } from "@/context/AppStateContext"
import { useAppTheme } from "@/theme/context"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

const STEPS = [
  {
    emoji: "🎯",
    title: "Reclaim your focus",
    body: "Sami helps you build deep focus habits by blocking distracting apps on your schedule — automatically.",
  },
  {
    emoji: "🔒",
    title: "Block what pulls you away",
    body: "Choose which apps to block and when. Set time-based schedules, group them by habit, and stay in control.",
  },
  {
    emoji: "📊",
    title: "Watch your focus grow",
    body: "Track focus sessions, log reflections, and see your weekly progress. Small sessions compound into big results.",
  },
]

export function OnboardingScreen() {
  const { setOnboardingComplete } = useAppState()
  const { theme: { colors, spacing } } = useAppTheme()
  const [step, setStep] = useState(0)
  const [requestingPermission, setRequestingPermission] = useState(false)
  const translateX = useSharedValue(0)

  const goToStep = (next: number) => {
    translateX.value = withTiming(-next * SCREEN_WIDTH, { duration: 320 })
    setStep(next)
  }

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      goToStep(step + 1)
      return
    }
    // Last step: request notifications then complete
    await requestNotifications()
    setOnboardingComplete()
  }

  const requestNotifications = async () => {
    if (requestingPermission) return
    setRequestingPermission(true)
    try {
      const { status } = await Notifications.getPermissionsAsync()
      if (status !== "granted") {
        await Notifications.requestPermissionsAsync()
      }
    } catch {
      // Permission denied or unsupported — not blocking
    } finally {
      setRequestingPermission(false)
    }
  }

  const animatedSlider = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  const isLastStep = step === STEPS.length - 1

  return (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} systemBarStyle="dark" contentContainerStyle={$screenContent}>
      <View style={$root}>
        {/* Slides */}
        <View style={$slideViewport}>
          <Animated.View style={[$slideTrack, animatedSlider]}>
            {STEPS.map((s, i) => (
              <View key={i} style={[$slide, { width: SCREEN_WIDTH }]}>
                <Text style={$emoji}>{s.emoji}</Text>
                <Text style={[$title, { color: colors.text }]}>{s.title}</Text>
                <Text style={[$body, { color: colors.textDim }]}>{s.body}</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* Bottom controls */}
        <View style={[$bottom, { paddingHorizontal: spacing.md, paddingBottom: spacing.xl }]}>
          {/* Dots */}
          <View style={$dots}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[
                  $dot,
                  {
                    backgroundColor:
                      i === step ? colors.tint : colors.border,
                    width: i === step ? 20 : 6,
                  },
                ]}
              />
            ))}
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[$cta, { backgroundColor: colors.tint }]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={[$ctaText, { color: colors.background }]}>
              {isLastStep ? "Enable notifications" : "Next"}
            </Text>
          </TouchableOpacity>

          {/* Skip notifications on last step */}
          {isLastStep && (
            <TouchableOpacity
              style={$skipBtn}
              onPress={setOnboardingComplete}
              activeOpacity={0.7}
            >
              <Text style={[$skipText, { color: colors.textDim }]}>Maybe later</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Screen>
  )
}

const $screenContent: ViewStyle = {
  flex: 1,
  justifyContent: "flex-start",
}

const $root: ViewStyle = {
  flex: 1,
  justifyContent: "space-between",
}

const $slideViewport: ViewStyle = {
  flex: 1,
  overflow: "hidden",
  width: SCREEN_WIDTH,
}

const $slideTrack: ViewStyle = {
  flexDirection: "row",
  flex: 1,
  width: SCREEN_WIDTH * STEPS.length,
}

const $slide: ViewStyle = {
  width: SCREEN_WIDTH,
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: 40,
  gap: 20,
}

const $emoji: TextStyle = {
  fontSize: 72,
  textAlign: "center",
}

const $title: TextStyle = {
  fontSize: 28,
  fontWeight: "700",
  textAlign: "center",
  lineHeight: 34,
}

const $body: TextStyle = {
  fontSize: 16,
  textAlign: "center",
  lineHeight: 24,
}

const $bottom: ViewStyle = {
  gap: 16,
}

const $dots: ViewStyle = {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  gap: 6,
}

const $dot: ViewStyle = {
  height: 6,
  borderRadius: 3,
}

const $cta: ViewStyle = {
  borderRadius: 16,
  paddingVertical: 16,
  alignItems: "center",
}

const $ctaText: TextStyle = {
  fontSize: 16,
  fontWeight: "700",
}

const $skipBtn: ViewStyle = {
  alignItems: "center",
  paddingVertical: 8,
}

const $skipText: TextStyle = {
  fontSize: 14,
}
