import { createContext, FC, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef } from "react"
import { useMMKVString } from "react-native-mmkv"

import { GOAL_ACCENT_COLORS } from "@/theme/colors"
import type { BlockedApp, TimeFrame } from "@/models/types"
import { isInSchedule } from "@/utils/scheduleUtils"

type StreakData = { count: number; lastDate: string }

type AppBlockContextType = {
  apps: BlockedApp[]
  streak: number
  markDayActive: () => void
  addApp: (name: string, brandColor?: string) => BlockedApp
  addApps: (entries: { name: string; brandColor?: string }[]) => void
  updateApp: (id: string, updates: Partial<BlockedApp>) => void
  deleteApp: (id: string) => void
  getApp: (id: string) => BlockedApp | undefined
  addTimeFrame: (appId: string, tf: Omit<TimeFrame, "id">) => void
  removeTimeFrame: (appId: string, tfId: string) => void
  groupApps: (draggedId: string, targetId: string, insertBeforeId?: string) => void
  ungroupApp: (appId: string) => void
  setAppUnblocked: (appId: string, unblocked: boolean) => void
}

export const AppBlockContext = createContext<AppBlockContextType | null>(null)

export const AppBlockProvider: FC<PropsWithChildren> = ({ children }) => {
  const [raw, setRaw] = useMMKVString("AppBlockContext.apps")
  const rawRef = useRef(raw)
  const [streakRaw, setStreakRaw] = useMMKVString("AppBlockContext.streak")

  const apps: BlockedApp[] = useMemo(() => {
    try {
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }, [raw])

  const persist = useCallback((next: BlockedApp[]) => setRaw(JSON.stringify(next)), [setRaw])

  const streakData: StreakData = useMemo(() => {
    try { return streakRaw ? JSON.parse(streakRaw) : { count: 0, lastDate: "" } } catch { return { count: 0, lastDate: "" } }
  }, [streakRaw])
  const streakDataRef = useRef(streakData)
  useEffect(() => { streakDataRef.current = streakData }, [streakData])

  const markDayActive = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10)
    if (streakDataRef.current.lastDate === today) return
    setStreakRaw(JSON.stringify({ count: streakDataRef.current.count + 1, lastDate: today }))
  }, [setStreakRaw])

  const resetStreak = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10)
    setStreakRaw(JSON.stringify({ count: 0, lastDate: today }))
  }, [setStreakRaw])

  // One-time migration: sync timeFrames/groupId across groups with stale data
  useEffect(() => {
    try {
      const parsed: BlockedApp[] = rawRef.current ? JSON.parse(rawRef.current) : []
      if (parsed.length === 0) return

      let changed = false
      const result: BlockedApp[] = parsed.map((a) => ({ ...a, timeFrames: [...a.timeFrames] }))
      const groupIds = new Set(result.filter((a) => a.groupId).map((a) => a.groupId!))

      for (const gid of groupIds) {
        const anchor = result.find((a) => a.id === gid)
        if (anchor && !anchor.groupId) {
          anchor.groupId = anchor.id
          changed = true
        }
        const members = result.filter((a) => a.groupId === gid || a.id === gid)
        const tfMap = new Map<string, TimeFrame>()
        for (const m of members) {
          for (const tf of m.timeFrames) tfMap.set(tf.id, tf)
        }
        const merged = [...tfMap.values()]
        for (const m of members) {
          if (m.timeFrames.length !== merged.length) {
            m.timeFrames = merged
            changed = true
          }
        }
      }

      if (changed) setRaw(JSON.stringify(result))
    } catch {}
  }, []) // intentionally runs once on mount to fix stale persisted data

  const addApps = useCallback(
    (entries: { name: string; brandColor?: string }[]) => {
      const now = Date.now()
      const existing = [...apps]
      const toAdd: BlockedApp[] = entries.map((entry, i) => {
        const usedColors = existing.map((a) => a.accentColor)
        const accentColor =
          GOAL_ACCENT_COLORS.find((c) => !usedColors.includes(c)) ??
          GOAL_ACCENT_COLORS[existing.length % GOAL_ACCENT_COLORS.length]
        const app: BlockedApp = {
          id: (now + i).toString(),
          name: entry.name,
          brandColor: entry.brandColor,
          accentColor,
          blockedForever: false,
          timeFrames: [],
          createdAt: new Date().toISOString(),
        }
        existing.push(app)
        return app
      })
      persist([...apps, ...toAdd])
    },
    [apps, persist],
  )

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
          if (groupId && (a.groupId === groupId || a.id === groupId)) return { ...a, ...updates }
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
          next = next.map((a) =>
            a.id === remaining[0].id
              ? { ...a, groupId: undefined, timeFrames: [], blockedForever: false }
              : a,
          )
        } else if (remaining.length > 1 && appToDelete.id === appToDelete.groupId) {
          const newAnchorId = remaining[0].id
          next = next.map((a) => {
            if (a.id === newAnchorId) return { ...a, groupId: a.id }
            if (a.groupId === appToDelete.groupId) return { ...a, groupId: newAnchorId }
            return a
          })
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

      // App is in a group and already has timeframes — pull it out as standalone
      if (groupId && app && app.timeFrames.length > 0) {
        const newTfs = [...app.timeFrames, newTf]
        const remainingInGroup = apps.filter((a) => a.id !== appId && a.groupId === groupId)

        let next = apps.map((a) =>
          a.id === appId ? { ...a, groupId: a.id, timeFrames: newTfs } : a,
        )

        if (remainingInGroup.length <= 1) {
          // 0 or 1 left — dissolve the old group
          next = next.map((a) =>
            a.groupId === groupId && a.id !== appId
              ? { ...a, groupId: undefined, timeFrames: [], blockedForever: false }
              : a,
          )
        } else if (appId === groupId) {
          // Pulled app was the anchor — reassign anchor to first remaining member
          const newAnchorId = remainingInGroup[0].id
          next = next.map((a) => {
            if (a.id === newAnchorId) return { ...a, groupId: a.id }
            if (a.groupId === groupId && a.id !== appId) return { ...a, groupId: newAnchorId }
            return a
          })
        }

        persist(next)
        return
      }

      persist(
        apps.map((a) => {
          if (groupId && (a.groupId === groupId || a.id === groupId)) {
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
      const updated = apps.map((a) => {
        if (groupId && (a.groupId === groupId || a.id === groupId)) {
          return { ...a, timeFrames: a.timeFrames.filter((tf) => tf.id !== tfId) }
        }
        if (!groupId && a.id === appId) {
          return { ...a, timeFrames: a.timeFrames.filter((tf) => tf.id !== tfId) }
        }
        return a
      })
      // If the group now has no schedule, dissolve it
      if (groupId) {
        const anchor = updated.find((a) => a.id === groupId)
        if (anchor && anchor.timeFrames.length === 0) {
          persist(updated.map((a) =>
            a.groupId === groupId || a.id === groupId
              ? { ...a, groupId: undefined, timeFrames: [], blockedForever: false }
              : a,
          ))
          return
        }
      }
      persist(updated)
    },
    [apps, persist],
  )

  const groupApps = useCallback(
    (draggedId: string, targetId: string, insertBeforeId?: string) => {
      const target = apps.find((a) => a.id === targetId)
      if (!target) return
      const groupId = target.groupId ?? target.id
      const anchor = apps.find((a) => a.id === groupId) ?? target
      if (!anchor.blockedForever && anchor.timeFrames.length === 0) return

      let next = apps.map((a) => {
        if (a.id === draggedId)
          return { ...a, groupId, timeFrames: anchor.timeFrames, blockedForever: anchor.blockedForever }
        if (a.id === targetId && !a.groupId) return { ...a, groupId: a.id }
        return a
      })

      if (insertBeforeId) {
        const draggedApp = next.find((a) => a.id === draggedId)
        if (draggedApp) {
          next = next.filter((a) => a.id !== draggedId)
          const insertIdx = next.findIndex((a) => a.id === insertBeforeId)
          if (insertIdx >= 0) next.splice(insertIdx, 0, draggedApp)
          else next.push(draggedApp)
        }
      }

      persist(next)
    },
    [apps, persist],
  )

  const ungroupApp = useCallback(
    (appId: string) => {
      const app = apps.find((a) => a.id === appId)
      if (!app) return
      const wasAnchor = app.id === app.groupId

      if (wasAnchor) {
        const members = apps.filter((a) => a.id !== appId && a.groupId === app.groupId)
        if (members.length === 0) {
          persist(apps.map((a) => a.id === appId ? { ...a, groupId: undefined, timeFrames: [], blockedForever: false } : a))
          return
        }
        const newAnchorId = members[0].id
        persist(
          apps.map((a) => {
            if (a.id === appId) return { ...a, groupId: undefined, timeFrames: [], blockedForever: false }
            if (a.id === newAnchorId) return { ...a, groupId: a.id }
            if (a.groupId === app.groupId) return { ...a, groupId: newAnchorId }
            return a
          }),
        )
        return
      }

      persist(
        apps.map((a) =>
          a.id === appId
            ? { ...a, groupId: undefined, timeFrames: [], blockedForever: false }
            : a,
        ),
      )
    },
    [apps, persist],
  )

  const setAppUnblocked = useCallback(
    (appId: string, unblocked: boolean) => {
      if (unblocked) {
        const app = apps.find((a) => a.id === appId)
        if (app && isInSchedule(app.timeFrames, new Date())) resetStreak()
      }
      persist(apps.map((a) => (a.id === appId ? { ...a, overrideUnblocked: unblocked } : a)))
    },
    [apps, persist, resetStreak],
  )

  const value = useMemo(
    () => ({ apps, streak: streakData.count, markDayActive, addApp, addApps, updateApp, deleteApp, getApp, addTimeFrame, removeTimeFrame, groupApps, ungroupApp, setAppUnblocked }),
    [apps, streakData.count, markDayActive, addApp, addApps, updateApp, deleteApp, getApp, addTimeFrame, removeTimeFrame, groupApps, ungroupApp, setAppUnblocked],
  )

  return <AppBlockContext.Provider value={value}>{children}</AppBlockContext.Provider>
}

export const useAppBlock = () => {
  const ctx = useContext(AppBlockContext)
  if (!ctx) throw new Error("useAppBlock must be used within AppBlockProvider")
  return ctx
}
