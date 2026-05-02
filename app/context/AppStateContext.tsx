import { createContext, FC, PropsWithChildren, useCallback, useContext, useMemo } from "react"
import { useMMKVBoolean } from "react-native-mmkv"

type AppStateContextType = {
  hasCompletedOnboarding: boolean
  paywallDismissed: boolean
  setOnboardingComplete: () => void
  dismissPaywall: () => void
}

const AppStateContext = createContext<AppStateContextType | null>(null)

export const AppStateProvider: FC<PropsWithChildren> = ({ children }) => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useMMKVBoolean(
    "AppState.hasCompletedOnboarding",
  )
  const [paywallDismissed, setPaywallDismissed] = useMMKVBoolean(
    "AppState.paywallDismissed",
  )

  const setOnboardingComplete = useCallback(() => {
    setHasCompletedOnboarding(true)
  }, [setHasCompletedOnboarding])

  const dismissPaywall = useCallback(() => {
    setPaywallDismissed(true)
  }, [setPaywallDismissed])

  const value = useMemo(
    () => ({
      hasCompletedOnboarding: !!hasCompletedOnboarding,
      paywallDismissed: !!paywallDismissed,
      setOnboardingComplete,
      dismissPaywall,
    }),
    [hasCompletedOnboarding, paywallDismissed, setOnboardingComplete, dismissPaywall],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export const useAppState = () => {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error("useAppState must be used within an AppStateProvider")
  return ctx
}
