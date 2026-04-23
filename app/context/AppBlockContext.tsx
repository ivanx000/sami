import { createContext, FC, PropsWithChildren, useCallback, useContext, useMemo } from "react"
import { useMMKVString } from "react-native-mmkv"

import { GOAL_ACCENT_COLORS } from "@/theme/colors"
import type { BlockedApp, TimeFrame } from "@/models/types"

type AppBlockContextType = {
  apps: BlockedApp[]
  addApp: (name: string, icon?: string) => BlockedApp
  updateApp: (id: string, updates: Partial<BlockedApp>) => void
  deleteApp: (id: string) => void
  getApp: (id: string) => BlockedApp | undefined
  addTimeFrame: (appId: string, tf: Omit<TimeFrame, "id">) => void
  removeTimeFrame: (appId: string, tfId: string) => void
}

export const AppBlockContext = createContext<AppBlockContextType | null>(null)

export const AppBlockProvider: FC<PropsWithChildren> = ({ children }) => {
  const [raw, setRaw] = useMMKVString("AppBlockContext.apps")

  const apps: BlockedApp[] = useMemo(() => {
    try {
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }, [raw])

  const persist = useCallback((next: BlockedApp[]) => setRaw(JSON.stringify(next)), [setRaw])

  const addApp = useCallback(
    (name: string, icon?: string): BlockedApp => {
      const usedColors = apps.map((a) => a.accentColor)
      const accentColor =
        GOAL_ACCENT_COLORS.find((c) => !usedColors.includes(c)) ??
        GOAL_ACCENT_COLORS[apps.length % GOAL_ACCENT_COLORS.length]
      const app: BlockedApp = {
        id: Date.now().toString(),
        name,
        icon,
        accentColor,
        blockedForever: false,
        timeFrames: [],
        createdAt: new Date().toISOString(),
      }
      persist([...apps, app])
      return app
    },
    [apps, persist],
  )

  const updateApp = useCallback(
    (id: string, updates: Partial<BlockedApp>) => {
      persist(apps.map((a) => (a.id === id ? { ...a, ...updates } : a)))
    },
    [apps, persist],
  )

  const deleteApp = useCallback(
    (id: string) => persist(apps.filter((a) => a.id !== id)),
    [apps, persist],
  )

  const getApp = useCallback((id: string) => apps.find((a) => a.id === id), [apps])

  const addTimeFrame = useCallback(
    (appId: string, tf: Omit<TimeFrame, "id">) => {
      const newTf: TimeFrame = { ...tf, id: Date.now().toString() }
      persist(
        apps.map((a) => (a.id === appId ? { ...a, timeFrames: [...a.timeFrames, newTf] } : a)),
      )
    },
    [apps, persist],
  )

  const removeTimeFrame = useCallback(
    (appId: string, tfId: string) => {
      persist(
        apps.map((a) =>
          a.id === appId ? { ...a, timeFrames: a.timeFrames.filter((tf) => tf.id !== tfId) } : a,
        ),
      )
    },
    [apps, persist],
  )

  const value = useMemo(
    () => ({ apps, addApp, updateApp, deleteApp, getApp, addTimeFrame, removeTimeFrame }),
    [apps, addApp, updateApp, deleteApp, getApp, addTimeFrame, removeTimeFrame],
  )

  return <AppBlockContext.Provider value={value}>{children}</AppBlockContext.Provider>
}

export const useAppBlock = () => {
  const ctx = useContext(AppBlockContext)
  if (!ctx) throw new Error("useAppBlock must be used within AppBlockProvider")
  return ctx
}
