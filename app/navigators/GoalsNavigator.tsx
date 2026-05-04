import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { AppDetailScreen } from "@/screens/GoalDetailScreen"
import { AppsScreen } from "@/screens/GoalsScreen"
import { FocusSessionScreen } from "@/screens/FocusSessionScreen"
import { InsightsScreen } from "@/screens/InsightsScreen"
import { LegalScreen } from "@/screens/LegalScreen"
import { ReflectionScreen } from "@/screens/ReflectionScreen"
import { SettingsScreen } from "@/screens/SettingsScreen"
import { useAppTheme } from "@/theme/context"

import type { MainStackParamList } from "./navigationTypes"

const Stack = createNativeStackNavigator<MainStackParamList>()

export function GoalsNavigator() {
  const {
    theme: { colors },
  } = useAppTheme()

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="AppsList" component={AppsScreen} />
      <Stack.Screen name="AppDetail" component={AppDetailScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="FocusSession" component={FocusSessionScreen} />
      <Stack.Screen name="Reflection" component={ReflectionScreen} />
<Stack.Screen name="Insights" component={InsightsScreen} />
      <Stack.Screen name="Legal" component={LegalScreen} />
    </Stack.Navigator>
  )
}
