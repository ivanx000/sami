import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Platform, View } from "react-native"

import { InsightsScreen } from "@/screens/InsightsScreen"
import { useAppTheme } from "@/theme/context"

import { GoalsNavigator } from "./GoalsNavigator"
import type { MainTabParamList } from "./navigationTypes"

const Tab = createBottomTabNavigator<MainTabParamList>()

function TabIcon({ name, color, size }: { name: "goals" | "insights"; color: string; size: number }) {
  if (name === "goals") {
    return (
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            width: size * 0.85,
            height: size * 0.85,
            borderRadius: (size * 0.85) / 2,
            borderWidth: 2,
            borderColor: color,
          }}
        />
        <View
          style={{
            position: "absolute",
            width: size * 0.4,
            height: size * 0.4,
            borderRadius: (size * 0.4) / 2,
            backgroundColor: color,
          }}
        />
      </View>
    )
  }
  return (
    <View style={{ width: size, height: size, alignItems: "flex-end", justifyContent: "flex-end", flexDirection: "row", gap: 2 }}>
      {([0.4, 0.65, 1] as const).map((h, i) => (
        <View
          key={i}
          style={{
            width: (size - 4) / 3,
            height: size * h,
            borderRadius: 2,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  )
}

export function MainNavigator() {
  const {
    theme: { colors },
  } = useAppTheme()

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tintInactive,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === "ios" ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === "ios" ? 80 : 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Goals"
        component={GoalsNavigator}
        options={{
          tabBarLabel: "Goals",
          tabBarIcon: ({ color, size }) => <TabIcon name="goals" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{
          tabBarLabel: "Insights",
          tabBarIcon: ({ color, size }) => <TabIcon name="insights" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  )
}
