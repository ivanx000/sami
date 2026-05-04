import { ComponentProps } from "react"
import {
  NavigationContainer,
  NavigatorScreenParams,
} from "@react-navigation/native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"

export type MainStackParamList = {
  AppsList: undefined
  AppDetail: { appId: string }
  Settings: undefined
  Legal: { type: "privacy" | "terms" }
  FocusSession: { goalId: string; plannedDuration: number }
  Reflection: { goalId: string }
Insights: undefined
}

export type AppStackParamList = {
  Onboarding: { initialStep?: number } | undefined
  Paywall: undefined
  Main: NavigatorScreenParams<MainStackParamList>
  Legal: { type: "privacy" | "terms" }
}

export type AppStackScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>

export type MainStackScreenProps<T extends keyof MainStackParamList> = NativeStackScreenProps<
  MainStackParamList,
  T
>

export interface NavigationProps
  extends Partial<ComponentProps<typeof NavigationContainer<AppStackParamList>>> {}
