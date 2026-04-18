import { createContext, FC, PropsWithChildren, useCallback, useContext, useMemo } from "react"
import { useMMKVString } from "react-native-mmkv"

import type { FocusSession } from "@/models/types"

type ActiveSession = {
  goalId: string
  startedAt: string
  plannedDuration: number
}

type SessionContextType = {
  sessions: FocusSession[]
  activeSession: ActiveSession | null
  startSession: (goalId: string, plannedDuration: number) => void
  completeSession: (reflection: string, focusScore: number, wasDistracted: boolean, distractionNote?: string) => void
  cancelSession: () => void
  getSessionsForGoal: (goalId: string) => FocusSession[]
}

export const SessionContext = createContext<SessionContextType | null>(null)

export const SessionProvider: FC<PropsWithChildren> = ({ children }) => {
  const [rawSessions, setRawSessions] = useMMKVString("SessionContext.sessions")
  const [rawActive, setRawActive] = useMMKVString("SessionContext.activeSession")

  const sessions: FocusSession[] = useMemo(() => {
    try {
      return rawSessions ? JSON.parse(rawSessions) : []
    } catch {
      return []
    }
  }, [rawSessions])

  const activeSession: ActiveSession | null = useMemo(() => {
    try {
      return rawActive ? JSON.parse(rawActive) : null
    } catch {
      return null
    }
  }, [rawActive])

  const persistSessions = useCallback(
    (next: FocusSession[]) => setRawSessions(JSON.stringify(next)),
    [setRawSessions],
  )

  const startSession = useCallback(
    (goalId: string, plannedDuration: number) => {
      setRawActive(JSON.stringify({ goalId, startedAt: new Date().toISOString(), plannedDuration }))
    },
    [setRawActive],
  )

  const completeSession = useCallback(
    (reflection: string, focusScore: number, wasDistracted: boolean, distractionNote?: string) => {
      if (!activeSession) return
      const endedAt = new Date().toISOString()
      const actualDuration = Math.round(
        (new Date(endedAt).getTime() - new Date(activeSession.startedAt).getTime()) / 60000,
      )
      const completedFully = actualDuration >= activeSession.plannedDuration - 1
      const session: FocusSession = {
        id: Date.now().toString(),
        goalId: activeSession.goalId,
        startedAt: activeSession.startedAt,
        endedAt,
        plannedDuration: activeSession.plannedDuration,
        actualDuration,
        reflection,
        focusScore,
        wasDistracted,
        distractionNote,
        completedFully,
      }
      persistSessions([...sessions, session])
      setRawActive(undefined)
    },
    [activeSession, sessions, persistSessions, setRawActive],
  )

  const cancelSession = useCallback(() => setRawActive(undefined), [setRawActive])

  const getSessionsForGoal = useCallback(
    (goalId: string) => sessions.filter((s) => s.goalId === goalId),
    [sessions],
  )

  const value = useMemo(
    () => ({
      sessions,
      activeSession,
      startSession,
      completeSession,
      cancelSession,
      getSessionsForGoal,
    }),
    [sessions, activeSession, startSession, completeSession, cancelSession, getSessionsForGoal],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export const useSessions = () => {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error("useSessions must be used within a SessionProvider")
  return ctx
}
