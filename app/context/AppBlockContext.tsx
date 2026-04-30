import { createContext, FC, PropsWithChildren, useCallback, useContext, useMemo } from "react"
import { useMMKVString } from "react-native-mmkv"

import { GOAL_ACCENT_COLORS } from "@/theme/colors"
import type { BlockedApp, TimeFrame } from "@/models/types"

type AppBlockContextType = {
  apps: BlockedApp[]
  addApp: (name: string, brandColor?: string) => BlockedApp
  updateApp: (id: string, updates: Partial<BlockedApp>) => void
  deleteApp: (id: string) => void
  getApp: (id: string) => BlockedApp | undefined
  addTimeFrame: (appId: string, tf: Omit<TimeFrame, "id">) => void
  removeTimeFrame: (appId: string, tfId: string) => void
  groupApps: (draggedId: string, targetId: string) => void
  ungroupApp: (appId: string) => void
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
    (name: string, brandColor?: string): BlockedApp => {
      const usedColors = apps.map((a) => a.accentColor)
      const accentColor =
        GOAL_ACCENT_COLORS.find((c) => !usedColors.includes(c)) ??
        GOAL_ACCENT_COLORS[apps.length % GOAL_ACCENT_COLORS.length]
      const app: BlockedApp = {
        id: Date.now().toString(),
        name,
        brandColor,
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
      const app = apps.find((a) => a.id === id)
      const groupId = app?.groupId
      persist(
        apps.map((a) => {
          if (groupId && a.groupId === groupId) return { ...a, ...updates }
          if (!groupId && a.id === id) return { ...a, ...updates }
          return a
        }),
      )
    },
    [apps, persist],
  )

  const deleteApp = useCallback(
    (id: string) => {
      const appToDelete = apps.find((a) => a.id === id)
      let next = apps.filter((a) => a.id !== id)
      if (appToDelete?.groupId) {
        const remaining = next.filter((a) => a.groupId === appToDelete.groupId)
        if (remaining.length === 1) {
          const lastApp = remaining[0]
          const wasAnchor = lastApp.id === lastApp.groupId
          next = next.map((a) =>
            a.id === lastApp.id
              ? { ...a, groupId: undefined, ...(wasAnchor ? {} : { timeFrames: [] }) }
              : a,
          )
        }
      }
      persist(next)
    },
    [apps, persist],
  )

  const getApp = useCallback((id: string) => apps.find((a) => a.id === id), [apps])

  const addTimeFrame = useCallback(
    (appId: string, tf: Omit<TimeFrame, "id">) => {
      const newTf: TimeFrame = { ...tf, id: Date.now().toString() }
      const app = apps.find((a) => a.id === appId)
      const groupId = app?.groupId
      persist(
        apps.map((a) => {
          if (groupId && a.groupId === groupId) {
            return { ...a, timeFrames: [...a.timeFrames, newTf] }
          }
          if (!groupId && a.id === appId) {
            return { ...a, timeFrames: [...a.timeFrames, newTf], groupId: a.id }
          }
          return a
        }),
      )
    },
    [apps, persist],
  )

  const removeTimeFrame = useCallback(
    (appId: string, tfId: string) => {
      const app = apps.find((a) => a.id === appId)
      const groupId = app?.groupId
      persist(
        apps.map((a) => {
          if (groupId && a.groupId === groupId) {
            return { ...a, timeFrames: a.timeFrames.filter((tf) => tf.id !== tfId) }
          }
          if (!groupId && a.id === appId) {
            return { ...a, timeFrames: a.timeFrames.filter((tf) => tf.id !== tfId) }
          }
          return a
        }),
      )
    },
    [apps, persist],
  )

  const groupApps = useCallback(
    (draggedId: string, targetId: string) => {
      const target = apps.find((a) => a.id === targetId)
      if (!target) return
      const groupId = target.groupId ?? target.id
      const anchor = apps.find((a) => a.id === groupId) ?? target
      persist(
        apps.map((a) => {
          if (a.id === draggedId)
            return { ...a, groupId, timeFrames: anchor.timeFrames, blockedForever: anchor.blockedForever }
          if (a.id === targetId && !a.groupId) return { ...a, groupId }
          return a
        }),
      )
    },
    [apps, persist],
  )

  const ungroupApp = useCallback(
    (appId: string) => {
      const app = apps.find((a) => a.id === appId)
      if (!app) return
      const wasAnchor = app.id === app.groupId
      persist(
        apps.map((a) =>
          a.id === appId
            ? { ...a, groupId: undefined, ...(wasAnchor ? {} : { timeFrames: [] }) }
            : a,
        ),
      )
    },
    [apps, persist],
  )

  const value = useMemo(
    () => ({ apps, addApp, updateApp, deleteApp, getApp, addTimeFrame, removeTimeFrame, groupApps, ungroupApp }),
    [apps, addApp, updateApp, deleteApp, getApp, addTimeFrame, removeTimeFrame, groupApps, ungroupApp],
  )

  return <AppBlockContext.Provider value={value}>{children}</AppBlockContext.Provider>
}

export const useAppBlock = () => {
  const ctx = useContext(AppBlockContext)
  if (!ctx) throw new Error("useAppBlock must be used within AppBlockProvider")
  return ctx
}
