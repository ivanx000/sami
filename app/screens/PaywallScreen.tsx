import { useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Linking,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from "react-native"
import type { PurchasesPackage } from "react-native-purchases"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { usePurchases } from "@/context/PurchasesContext"
import { useAppTheme } from "@/theme/context"
import { PRIVACY_POLICY_URL, TERMS_URL } from "@/config/appConstants"

const FEATURES = [
  "Unlimited app blocking goals",
  "Time-based scheduling",
  "Focus session timer",
  "Post-session reflections",
  "Weekly insights & streaks",
]

export function PaywallScreen() {
  const { theme: { colors, spacing } } = useAppTheme()
  const insets = useSafeAreaInsets()
  const { offerings, purchasePackage, restorePurchases, isLoading } = usePurchases()
  const [purchasing, setPurchasing] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const packages = offerings?.current?.availablePackages ?? []
  const selectedPackage: PurchasesPackage | undefined = packages[selectedIndex]

  const handlePurchase = async () => {
    if (!selectedPackage) return
    setPurchasing(true)
    const success = await purchasePackage(selectedPackage)
    setPurchasing(false)
    if (!success) {
      Alert.alert("Purchase failed", "Please try again or restore a previous purchase.")
    }
  }

  const handleRestore = async () => {
    setPurchasing(true)
    const success = await restorePurchases()
    setPurchasing(false)
    if (!success) {
      Alert.alert("No purchases found", "No active subscription was found for this Apple ID.")
    }
  }

  if (isLoading) {
    return (
      <Screen preset="fixed" safeAreaEdges={["bottom"]} systemBarStyle="dark" contentContainerStyle={{ flex: 1, justifyContent: "flex-start" }}>
        <View style={$centered}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </Screen>
    )
  }

  return (
    <Screen preset="scroll" safeAreaEdges={["bottom"]} systemBarStyle="dark">
      <View style={[$root, { paddingHorizontal: spacing.md, paddingTop: insets.top + 16 }]}>
        {/* Hero */}
        <View style={$hero}>
          <Text style={$heroEmoji}>🎯</Text>
          <Text style={[$heroTitle, { color: colors.text }]}>Sami Premium</Text>
          <Text style={[$heroSub, { color: colors.textDim }]}>
            Try free for 7 days, then continue building your focus habits
          </Text>
        </View>

        {/* Feature list */}
        <View style={[$featureCard, { backgroundColor: colors.card }]}>
          {FEATURES.map((f) => (
            <View key={f} style={$featureRow}>
              <Text style={[$checkmark, { color: colors.tint }]}>✓</Text>
              <Text style={[$featureText, { color: colors.text }]}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Package selection */}
        {packages.length > 0 ? (
          <View style={$packages}>
            {packages.map((pkg: PurchasesPackage, i: number) => {
              const isSelected = i === selectedIndex
              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={[
                    $packageRow,
                    {
                      backgroundColor: isSelected ? colors.tint : colors.card,
                      borderColor: isSelected ? colors.tint : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedIndex(i)}
                  activeOpacity={0.8}
                >
                  <View style={$packageLeft}>
                    <Text
                      style={[
                        $packageTitle,
                        { color: isSelected ? colors.background : colors.text },
                      ]}
                    >
                      {pkg.product.title || pkg.packageType}
                    </Text>
                    {pkg.product.introPrice && (
                      <Text
                        style={[
                          $packageTrial,
                          { color: isSelected ? colors.background : colors.textDim },
                        ]}
                      >
                        {pkg.product.introPrice.periodNumberOfUnits}{" "}
                        {pkg.product.introPrice.periodUnit.toLowerCase()} free
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[
                      $packagePrice,
                      { color: isSelected ? colors.background : colors.text },
                    ]}
                  >
                    {pkg.product.priceString}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        ) : (
          <View style={[$packageRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[$featureText, { color: colors.textDim }]}>
              No offerings available. Check back soon.
            </Text>
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={[$cta, { backgroundColor: colors.tint, opacity: purchasing ? 0.6 : 1 }]}
          onPress={handlePurchase}
          activeOpacity={0.85}
          disabled={purchasing || packages.length === 0}
        >
          {purchasing ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={[$ctaText, { color: colors.background }]}>
              {selectedPackage?.product.introPrice ? "Start free trial" : "Subscribe"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={$restoreBtn} onPress={handleRestore} disabled={purchasing}>
          <Text style={[$restoreText, { color: colors.textDim }]}>Restore purchases</Text>
        </TouchableOpacity>

        {/* Legal */}
        <View style={$legal}>
          <Text style={[$legalText, { color: colors.textDim }]}>
            Subscription auto-renews unless cancelled at least 24 hours before the end of the
            current period.{" "}
          </Text>
          <View style={$legalLinks}>
            <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
              <Text style={[$legalLink, { color: colors.textDim }]}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={[$legalText, { color: colors.textDim }]}> · </Text>
            <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
              <Text style={[$legalLink, { color: colors.textDim }]}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Screen>
  )
}

const $centered: ViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
}

const $root: ViewStyle = {
  gap: 20,
  paddingBottom: 40,
}

const $hero: ViewStyle = {
  alignItems: "center",
  gap: 8,
}

const $heroEmoji: TextStyle = {
  fontSize: 56,
  textAlign: "center",
}

const $heroTitle: TextStyle = {
  fontSize: 28,
  fontWeight: "700",
  textAlign: "center",
}

const $heroSub: TextStyle = {
  fontSize: 15,
  textAlign: "center",
  lineHeight: 22,
}

const $featureCard: ViewStyle = {
  borderRadius: 16,
  padding: 16,
  gap: 12,
}

const $featureRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
}

const $checkmark: TextStyle = {
  fontSize: 16,
  fontWeight: "700",
  width: 20,
}

const $featureText: TextStyle = {
  fontSize: 15,
  flex: 1,
}

const $packages: ViewStyle = {
  gap: 10,
}

const $packageRow: ViewStyle = {
  borderRadius: 14,
  borderWidth: 1.5,
  padding: 14,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
}

const $packageLeft: ViewStyle = {
  gap: 2,
}

const $packageTitle: TextStyle = {
  fontSize: 16,
  fontWeight: "600",
}

const $packageTrial: TextStyle = {
  fontSize: 13,
}

const $packagePrice: TextStyle = {
  fontSize: 16,
  fontWeight: "700",
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

const $restoreBtn: ViewStyle = {
  alignItems: "center",
  paddingVertical: 4,
}

const $restoreText: TextStyle = {
  fontSize: 14,
}

const $legal: ViewStyle = {
  gap: 4,
  paddingTop: 4,
}

const $legalText: TextStyle = {
  fontSize: 12,
  lineHeight: 18,
  textAlign: "center",
}

const $legalLinks: ViewStyle = {
  flexDirection: "row",
  justifyContent: "center",
}

const $legalLink: TextStyle = {
  fontSize: 12,
  textDecorationLine: "underline",
}
