import { useState } from "react"
import {
  Dimensions,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from "react-native"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import * as Notifications from "expo-notifications"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ViewfinderCircleIcon, LockClosedIcon, ChartBarIcon } from "react-native-heroicons/outline"
import type { ComponentType } from "react"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAppState } from "@/context/AppStateContext"
import { useAppTheme } from "@/theme/context"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

type IconComponent = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>

const STEPS: { Icon: IconComponent; title: string; body: string }[] = [
  {
    Icon: ViewfinderCircleIcon,
    title: "Reclaim your focus",
    body: "Sami helps you build deep focus habits by blocking distracting apps on your schedule — automatically.",
  },
  {
    Icon: LockClosedIcon,
    title: "Block what pulls you away",
    body: "Choose which apps to block and when. Set time-based schedules, group them by habit, and stay in control.",
  },
  {
    Icon: ChartBarIcon,
    title: "Watch your focus grow",
    body: "Track focus sessions, log reflections, and see your weekly progress. Small sessions compound into big results.",
  },
]

export function OnboardingScreen() {
  const { setOnboardingComplete } = useAppState()
  const { theme: { colors, spacing } } = useAppTheme()
  const insets = useSafeAreaInsets()
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
    <Screen preset="fixed" safeAreaEdges={["bottom"]} systemBarStyle="dark" contentContainerStyle={$screenContent}>
      <View style={[$root, { paddingTop: Math.max(insets.top, 60) }]}>
        {/* Slides */}
        <View style={$slideViewport}>
          <Animated.View style={[$slideTrack, animatedSlider]}>
            {STEPS.map((s, i) => (
              <View key={i} style={[$slide, { width: SCREEN_WIDTH }]}>
                <s.Icon size={64} color={colors.tint} strokeWidth={1.5} />
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
                    backgroundColor: i === step ? colors.tint : colors.border,
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

          <TouchableOpacity
            style={[$skipBtn, { opacity: isLastStep ? 1 : 0 }]}
            onPress={isLastStep ? setOnboardingComplete : undefined}
            activeOpacity={0.7}
          >
            <Text style={[$skipText, { color: colors.textDim }]}>Maybe later</Text>
          </TouchableOpacity>
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
  borderRadius: 999,
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
