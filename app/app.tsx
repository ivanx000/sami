/* eslint-disable import/first */
if (__DEV__) {
  require("./devtools/ReactotronConfig.ts")
}
import "./utils/gestureHandler"

import { useEffect, useState } from "react"
import { useFonts } from "expo-font"
import * as Linking from "expo-linking"
import { KeyboardProvider } from "react-native-keyboard-controller"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context"

import { AppBlockProvider } from "./context/AppBlockContext"
import { AppStateProvider } from "./context/AppStateContext"
import { GoalProvider } from "./context/GoalContext"
import { PurchasesProvider } from "./context/PurchasesContext"
import { SessionProvider } from "./context/SessionContext"
import { initI18n } from "./i18n"
import { AppNavigator } from "./navigators/AppNavigator"
import { useNavigationPersistence } from "./navigators/navigationUtilities"
import { ThemeProvider } from "./theme/context"
import { customFontsToLoad } from "./theme/typography"
import { loadDateFnsLocale } from "./utils/formatDate"
import * as storage from "./utils/storage"

export const NAVIGATION_PERSISTENCE_KEY = "NAVIGATION_STATE"

const prefix = Linking.createURL("/")
const config = {
  screens: {
    Main: {
      screens: {
        AppsList: { path: "" },
        AppDetail: { path: "app/:appId" },
      },
    },
  },
}

export function App() {
  const {
    initialNavigationState,
    onNavigationStateChange,
    isRestored: isNavigationStateRestored,
  } = useNavigationPersistence(storage, NAVIGATION_PERSISTENCE_KEY)

  const [areFontsLoaded, fontLoadError] = useFonts(customFontsToLoad)
  const [isI18nInitialized, setIsI18nInitialized] = useState(false)

  useEffect(() => {
    initI18n()
      .then(() => setIsI18nInitialized(true))
      .then(() => loadDateFnsLocale())
  }, [])

  if (!isNavigationStateRestored || !isI18nInitialized || (!areFontsLoaded && !fontLoadError)) {
    return null
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <KeyboardProvider>
          <AppStateProvider>
            <AppBlockProvider>
              <GoalProvider>
                <SessionProvider>
                  <PurchasesProvider>
                    <ThemeProvider initialContext="light">
                      <AppNavigator
                        linking={{ prefixes: [prefix], config }}
                        initialState={initialNavigationState}
                        onStateChange={onNavigationStateChange}
                      />
                    </ThemeProvider>
                  </PurchasesProvider>
                </SessionProvider>
              </GoalProvider>
            </AppBlockProvider>
          </AppStateProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
