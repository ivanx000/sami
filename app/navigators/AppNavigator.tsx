import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

import Config from "@/config"
import { useAppState } from "@/context/AppStateContext"
import { usePurchases } from "@/context/PurchasesContext"
import { ErrorBoundary } from "@/screens/ErrorScreen/ErrorBoundary"
import { LegalScreen } from "@/screens/LegalScreen"
import { OnboardingScreen } from "@/screens/OnboardingScreen"
import { PaywallScreen } from "@/screens/PaywallScreen"
import { useAppTheme } from "@/theme/context"

import { MainNavigator } from "./MainNavigator"
import type { AppStackParamList, NavigationProps } from "./navigationTypes"
import { navigationRef, useBackButtonHandler } from "./navigationUtilities"

const exitRoutes = Config.exitRoutes

const Stack = createNativeStackNavigator<AppStackParamList>()

const AppStack = () => {
  const { hasCompletedOnboarding } = useAppState()
  const { isPremium, isLoading } = usePurchases()
  const {
    theme: { colors },
  } = useAppTheme()

  const initialRouteName = !hasCompletedOnboarding
    ? "Onboarding"
    : !isPremium && !isLoading
    ? "Paywall"
    : "Main"

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        navigationBarColor: colors.background,
        contentStyle: { backgroundColor: colors.background },
      }}
      initialRouteName={initialRouteName}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Paywall" component={PaywallScreen} />
      <Stack.Screen name="Main" component={MainNavigator} />
      <Stack.Screen name="Legal" component={LegalScreen} />
    </Stack.Navigator>
  )
}

export const AppNavigator = (props: NavigationProps) => {
  const { navigationTheme } = useAppTheme()
  useBackButtonHandler((routeName) => exitRoutes.includes(routeName))

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme} {...props}>
      <ErrorBoundary catchErrors={Config.catchErrors}>
        <AppStack />
      </ErrorBoundary>
    </NavigationContainer>
  )
}
