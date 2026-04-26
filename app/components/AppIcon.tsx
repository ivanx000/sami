import { Image, ImageStyle, View, ViewStyle, TextStyle } from "react-native"

import { Text } from "@/components/Text"

interface AppIconProps {
  name: string
  initials: string
  brandColor: string
  iconUrl?: string
  size?: number
}

export function AppIcon({ name, initials, brandColor, iconUrl, size = 34 }: AppIconProps) {
  const radius = size * 0.26

  if (iconUrl) {
    return (
      <View style={[$box, { backgroundColor: brandColor, width: size, height: size, borderRadius: radius }]}>
        <Image
          source={{ uri: iconUrl }}
          style={[$image, { width: size, height: size }]}
        />
      </View>
    )
  }

  return (
    <View style={[$box, { backgroundColor: brandColor, width: size, height: size, borderRadius: radius }]}>
      <Text style={[$initials, { fontSize: size * 0.32 }]}>{initials || name.slice(0, 2).toUpperCase()}</Text>
    </View>
  )
}

const $image: ImageStyle = {
  flexShrink: 0,
}

const $box: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  overflow: "hidden",
}

const $initials: TextStyle = {
  fontWeight: "700",
  color: "#FFFFFF",
  letterSpacing: 0.5,
}
