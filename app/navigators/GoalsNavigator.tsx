import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { FocusSessionScreen } from "@/screens/FocusSessionScreen"
import { GoalDetailScreen } from "@/screens/GoalDetailScreen"
import { GoalsScreen } from "@/screens/GoalsScreen"
import { ReflectionScreen } from "@/screens/ReflectionScreen"
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
      <Stack.Screen name="GoalsList" component={GoalsScreen} />
      <Stack.Screen name="GoalDetail" component={GoalDetailScreen} />
      <Stack.Screen name="FocusSession" component={FocusSessionScreen} />
      <Stack.Screen name="Reflection" component={ReflectionScreen} />
    </Stack.Navigator>
  )
}
