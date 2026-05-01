import { createContext, FC, PropsWithChildren, useCallback, useContext, useMemo } from "react"
import { useMMKVBoolean } from "react-native-mmkv"

type AppStateContextType = {
  hasCompletedOnboarding: boolean
  setOnboardingComplete: () => void
}

const AppStateContext = createContext<AppStateContextType | null>(null)

export const AppStateProvider: FC<PropsWithChildren> = ({ children }) => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useMMKVBoolean(
    "AppState.hasCompletedOnboarding",
  )

  const setOnboardingComplete = useCallback(() => {
    setHasCompletedOnboarding(true)
  }, [setHasCompletedOnboarding])

  const value = useMemo(
    () => ({ hasCompletedOnboarding: !!hasCompletedOnboarding, setOnboardingComplete }),
    [hasCompletedOnboarding, setOnboardingComplete],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export const useAppState = () => {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error("useAppState must be used within an AppStateProvider")
  return ctx
}
