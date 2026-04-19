import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { AppDetailScreen } from "@/screens/GoalDetailScreen"
import { AppsScreen } from "@/screens/GoalsScreen"
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
    </Stack.Navigator>
  )
}
