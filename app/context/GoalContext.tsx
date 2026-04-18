import { createContext, FC, PropsWithChildren, useCallback, useContext, useMemo } from "react"
import { useMMKVString } from "react-native-mmkv"

import { GOAL_ACCENT_COLORS } from "@/theme/colors"
import type { Goal } from "@/models/types"

type GoalContextType = {
  goals: Goal[]
  activeGoals: Goal[]
  addGoal: (goal: Omit<Goal, "id" | "createdAt" | "isArchived" | "accentColor">) => Goal
  updateGoal: (id: string, updates: Partial<Goal>) => void
  archiveGoal: (id: string) => void
  deleteGoal: (id: string) => void
  getGoal: (id: string) => Goal | undefined
}

export const GoalContext = createContext<GoalContextType | null>(null)

export const GoalProvider: FC<PropsWithChildren> = ({ children }) => {
  const [raw, setRaw] = useMMKVString("GoalContext.goals")

  const goals: Goal[] = useMemo(() => {
    try {
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }, [raw])

  const persist = useCallback((next: Goal[]) => setRaw(JSON.stringify(next)), [setRaw])

  const addGoal = useCallback(
    (input: Omit<Goal, "id" | "createdAt" | "isArchived" | "accentColor">): Goal => {
      const usedColors = goals.map((g) => g.accentColor)
      const accentColor =
        GOAL_ACCENT_COLORS.find((c) => !usedColors.includes(c)) ?? GOAL_ACCENT_COLORS[goals.length % GOAL_ACCENT_COLORS.length]
      const goal: Goal = {
        ...input,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        isArchived: false,
        accentColor,
      }
      persist([...goals, goal])
      return goal
    },
    [goals, persist],
  )

  const updateGoal = useCallback(
    (id: string, updates: Partial<Goal>) => {
      persist(goals.map((g) => (g.id === id ? { ...g, ...updates } : g)))
    },
    [goals, persist],
  )

  const archiveGoal = useCallback(
    (id: string) => updateGoal(id, { isArchived: true }),
    [updateGoal],
  )

  const deleteGoal = useCallback(
    (id: string) => persist(goals.filter((g) => g.id !== id)),
    [goals, persist],
  )

  const getGoal = useCallback((id: string) => goals.find((g) => g.id === id), [goals])

  const activeGoals = useMemo(() => goals.filter((g) => !g.isArchived), [goals])

  const value = useMemo(
    () => ({ goals, activeGoals, addGoal, updateGoal, archiveGoal, deleteGoal, getGoal }),
    [goals, activeGoals, addGoal, updateGoal, archiveGoal, deleteGoal, getGoal],
  )

  return <GoalContext.Provider value={value}>{children}</GoalContext.Provider>
}

export const useGoals = () => {
  const ctx = useContext(GoalContext)
  if (!ctx) throw new Error("useGoals must be used within a GoalProvider")
  return ctx
}
