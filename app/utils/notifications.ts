import * as Notifications from "expo-notifications"
import { Platform } from "react-native"

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false
  const { status: existing } = await Notifications.getPermissionsAsync()
  if (existing === "granted") return true
  const { status } = await Notifications.requestPermissionsAsync()
  return status === "granted"
}

export async function scheduleBackgroundNudge(goalName: string): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Stay focused",
      body: `Your session for "${goalName}" is still running.`,
      data: { screen: "FocusSession" },
    },
    trigger: { seconds: 10, repeats: false } as Notifications.TimeIntervalTriggerInput,
  })
}

export async function cancelNotification(id: string): Promise<void> {
  return Notifications.cancelScheduledNotificationAsync(id)
}
