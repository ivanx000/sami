import { Alert, Linking, StyleSheet, TouchableOpacity, View, ViewStyle, TextStyle } from "react-native"
import i18n from "i18next"
import { ChevronRightIcon } from "react-native-heroicons/outline"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { usePurchases } from "@/context/PurchasesContext"
import { useAppTheme } from "@/theme/context"
import { PRIVACY_POLICY_URL, TERMS_URL, SUPPORT_EMAIL } from "@/config/appConstants"
import type { MainStackScreenProps } from "@/navigators/navigationTypes"

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
]

export function SettingsScreen({ navigation }: MainStackScreenProps<"Settings">) {
  const { theme: { colors, spacing }, themeContext, setThemeContextOverride } = useAppTheme()
  const { isPremium, restorePurchases, customerInfo } = usePurchases()

  const currentLang = LANGUAGES.find((l) => i18n.language.startsWith(l.code)) ?? LANGUAGES[0]

  const handleThemeToggle = () => {
    setThemeContextOverride(themeContext === "dark" ? "light" : "dark")
  }

  const handleLanguage = () => {
    Alert.alert("Language", "Choose a language", [
      ...LANGUAGES.map((lang) => ({
        text: lang.label,
        onPress: () => i18n.changeLanguage(lang.code),
      })),
      { text: "Cancel", style: "cancel" },
    ])
  }

  const handleRestore = async () => {
    const success = await restorePurchases()
    if (success) {
      Alert.alert("Restored", "Your subscription has been restored.")
    } else {
      Alert.alert("Nothing to restore", "No active subscription found for this Apple ID.")
    }
  }

  const handleManageSubscription = () => {
    Linking.openURL("https://apps.apple.com/account/subscriptions")
  }

  const subscriptionLabel = () => {
    if (!customerInfo) return "Loading…"
    const entitlement = customerInfo.entitlements.active["premium"]
    if (!entitlement) return "Free"
    const exp = entitlement.expirationDate
    return exp ? `Active · renews ${new Date(exp).toLocaleDateString()}` : "Active"
  }

  return (
    <Screen preset="scroll" safeAreaEdges={["top", "bottom"]} systemBarStyle="dark">
      <View style={[$root, { paddingHorizontal: spacing.md }]}>
        {/* Header */}
        <View style={$headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={$backBtn} activeOpacity={0.7}>
            <Text style={[$backText, { color: colors.tint }]}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={[$heading, { color: colors.text }]}>Settings</Text>
        </View>

        {/* Subscription */}
        <View style={$section}>
          <Text style={[$sectionLabel, { color: colors.textDim }]}>SUBSCRIPTION</Text>
          <View style={[$card, { backgroundColor: colors.card }]}>
            <SettingsRow
              label="Plan"
              value={isPremium ? "Premium" : "Free"}
              colors={colors}
            />
            {isPremium && (
              <SettingsRow
                label="Status"
                value={subscriptionLabel()}
                colors={colors}
              />
            )}
            {isPremium && (
              <SettingsRow
                label="Manage subscription"
                onPress={handleManageSubscription}
                chevron
                colors={colors}
              />
            )}
            <SettingsRow
              label="Restore purchases"
              onPress={handleRestore}
              chevron
              colors={colors}
            />
          </View>
        </View>

        {/* Appearance */}
        <View style={$section}>
          <Text style={[$sectionLabel, { color: colors.textDim }]}>APPEARANCE</Text>
          <View style={[$card, { backgroundColor: colors.card }]}>
            <SettingsRow
              label="Theme"
              value={themeContext === "dark" ? "Dark" : "Light"}
              onPress={handleThemeToggle}
              chevron
              colors={colors}
            />
          </View>
        </View>

        {/* Language */}
        <View style={$section}>
          <Text style={[$sectionLabel, { color: colors.textDim }]}>LANGUAGE</Text>
          <View style={[$card, { backgroundColor: colors.card }]}>
            <SettingsRow
              label="App language"
              value={currentLang.label}
              onPress={handleLanguage}
              chevron
              colors={colors}
            />
          </View>
        </View>

        {/* Legal */}
        <View style={$section}>
          <Text style={[$sectionLabel, { color: colors.textDim }]}>LEGAL</Text>
          <View style={[$card, { backgroundColor: colors.card }]}>
            <SettingsRow
              label="Privacy Policy"
              onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
              chevron
              colors={colors}
            />
            <SettingsRow
              label="Terms of Service"
              onPress={() => Linking.openURL(TERMS_URL)}
              chevron
              colors={colors}
            />
          </View>
        </View>

        {/* About */}
        <View style={$section}>
          <Text style={[$sectionLabel, { color: colors.textDim }]}>ABOUT</Text>
          <View style={[$card, { backgroundColor: colors.card }]}>
            <SettingsRow
              label="Contact support"
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
              chevron
              colors={colors}
            />
          </View>
        </View>
      </View>
    </Screen>
  )
}

function SettingsRow({
  label,
  value,
  onPress,
  chevron,
  colors,
}: {
  label: string
  value?: string
  onPress?: () => void
  chevron?: boolean
  colors: ReturnType<typeof useAppTheme>["theme"]["colors"]
}) {
  const inner = (
    <View style={[$row, { borderBottomColor: colors.border }]}>
      <Text style={[$rowLabel, { color: colors.text }]}>{label}</Text>
      <View style={$rowRight}>
        {value ? (
          <Text style={[$rowValue, { color: colors.textDim }]}>{value}</Text>
        ) : null}
        {chevron && onPress ? (
          <ChevronRightIcon size={16} color={colors.textDim} strokeWidth={2} />
        ) : null}
      </View>
    </View>
  )

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {inner}
      </TouchableOpacity>
    )
  }
  return inner
}

const $root: ViewStyle = {
  gap: 24,
  paddingTop: 16,
  paddingBottom: 40,
}

const $headerRow: ViewStyle = {
  gap: 4,
}

const $backBtn: ViewStyle = {
  alignSelf: "flex-start",
}

const $backText: TextStyle = {
  fontSize: 16,
}

const $heading: TextStyle = {
  fontSize: 28,
  fontWeight: "700",
}

const $section: ViewStyle = {
  gap: 8,
}

const $sectionLabel: TextStyle = {
  fontSize: 12,
  fontWeight: "600",
  letterSpacing: 0.8,
}

const $card: ViewStyle = {
  borderRadius: 16,
  overflow: "hidden",
}

const $row: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 16,
  paddingVertical: 14,
  borderBottomWidth: StyleSheet.hairlineWidth,
}

const $rowLabel: TextStyle = {
  fontSize: 15,
}

const $rowRight: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
}

const $rowValue: TextStyle = {
  fontSize: 14,
}

