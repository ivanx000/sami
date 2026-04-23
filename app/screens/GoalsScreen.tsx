import { useMemo, useState } from "react"
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"

import { CheckIcon, Cog6ToothIcon, MagnifyingGlassIcon, PlusCircleIcon, PlusIcon, XMarkIcon } from "react-native-heroicons/outline"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAppBlock } from "@/context/AppBlockContext"
import { filterCuratedApps } from "@/data/curatedApps"
import { useInstalledApps } from "@/hooks/useInstalledApps"
import type { BlockedApp } from "@/models/types"
import { useAppTheme } from "@/theme/context"
import type { MainStackParamList } from "@/navigators/navigationTypes"

type NavProp = NativeStackNavigationProp<MainStackParamList>

function AppCard({ app, onPress }: { app: BlockedApp; onPress: () => void }) {
  const {
    theme: { colors },
  } = useAppTheme()

  const statusLabel = app.blockedForever
    ? "Blocked forever"
    : app.timeFrames.length > 0
      ? `${app.timeFrames.length} schedule${app.timeFrames.length === 1 ? "" : "s"}`
      : "No schedule"

  const statusColor = app.blockedForever
    ? "#FF6B6B"
    : app.timeFrames.length > 0
      ? app.accentColor
      : colors.textDim

  return (
    <TouchableOpacity
      style={[$card, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={$cardRow}>
        {app.brandColor ? (
          <View style={[$appIconBox, { backgroundColor: app.brandColor }]}>
            <Text style={$appIconInitials}>{app.name.slice(0, 2).toUpperCase()}</Text>
          </View>
        ) : (
          <View style={[$accentDot, { backgroundColor: app.accentColor }]} />
        )}
        <Text style={[$appName, { color: colors.text }]} numberOfLines={1}>
          {app.name}
        </Text>
        <View
          style={[
            $statusBadge,
            { borderColor: statusColor + "44", backgroundColor: statusColor + "18" },
          ]}
        >
          <Text style={[$statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const SHEET_HEIGHT = Dimensions.get("window").height * 0.68

function AppPickerSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { addApp, apps } = useAppBlock()
  const {
    theme: { colors },
  } = useAppTheme()
  const insets = useSafeAreaInsets()
  const [query, setQuery] = useState("")
  const { apps: installedApps, loading } = useInstalledApps()

  const filtered = useMemo(() => filterCuratedApps(installedApps, query), [installedApps, query])
  const addedNames = useMemo(() => new Set(apps.map((a) => a.name)), [apps])

  const handleClose = () => {
    setQuery("")
    onClose()
  }

  const renderRow = ({ item }: { item: (typeof installedApps)[number] }) => {
    const alreadyAdded = addedNames.has(item.name)
    return (
      <View style={[$pickerRow, { borderBottomColor: colors.border }]}>
        <View style={[$pickerIconBox, { backgroundColor: item.brandColor }]}>
          <Text style={$pickerIconInitials}>{item.initials}</Text>
        </View>
        <Text style={[$pickerName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <TouchableOpacity
          style={[
            $pickerAddBtn,
            alreadyAdded ? { backgroundColor: colors.cardElevated } : { backgroundColor: colors.tint + "22" },
          ]}
          onPress={() => {
            if (!alreadyAdded) addApp(item.name, item.brandColor)
          }}
          disabled={alreadyAdded}
          activeOpacity={0.6}
        >
          {alreadyAdded ? (
            <CheckIcon size={18} color={colors.textDim} strokeWidth={2} />
          ) : (
            <PlusIcon size={18} color={colors.tint} strokeWidth={2.5} />
          )}
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={$pickerOverlay} activeOpacity={1} onPress={handleClose} />
      <View
        style={[
          $pickerSheet,
          { backgroundColor: colors.card, paddingBottom: insets.bottom + 16, height: SHEET_HEIGHT },
        ]}
      >
        <View style={[$modalHandle, { backgroundColor: colors.border }]} />

        <View style={$pickerHeader}>
          <Text style={[$modalTitle, { color: colors.text }]}>Block an App</Text>
          <TouchableOpacity onPress={handleClose} hitSlop={12}>
            <XMarkIcon size={22} color={colors.textDim} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={[$searchBar, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
          <MagnifyingGlassIcon size={16} color={colors.textDim} strokeWidth={2} />
          <TextInput
            style={[$searchInput, { color: colors.text }]}
            placeholder="Search apps…"
            placeholderTextColor={colors.textDim}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
        </View>

        {loading ? (
          <View style={$pickerLoading}>
            <ActivityIndicator color={colors.tint} />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderRow}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </Modal>
  )
}

export function AppsScreen() {
  const { apps } = useAppBlock()
  const {
    theme: { colors, spacing },
  } = useAppTheme()
  const navigation = useNavigation<NavProp>()
  const insets = useSafeAreaInsets()
  const [showModal, setShowModal] = useState(false)

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} systemBarStyle="light">
      <View style={[$header, { paddingHorizontal: spacing.md }]}>
        <View style={$headerLeft}>
          <TouchableOpacity style={$iconBtn} activeOpacity={0.7}>
            <Cog6ToothIcon size={26} color="#FFFFFF" strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={$appTitle}>sami</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={$iconBtn}
          activeOpacity={0.7}
        >
          <PlusCircleIcon size={32} color="#FFFFFF" strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      {apps.length === 0 ? (
        <View style={$empty}>
          <Text style={[$emptyTitle, { color: colors.text }]}>No apps blocked</Text>
          <Text style={[$emptySubtitle, { color: colors.textDim }]}>
            Tap + to block your first app
          </Text>
        </View>
      ) : (
        <FlatList
          data={apps}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => (
            <AppCard
              app={item}
              onPress={() => navigation.navigate("AppDetail", { appId: item.id })}
            />
          )}
          contentContainerStyle={[
            $listContent,
            { paddingBottom: insets.bottom + 24, paddingHorizontal: spacing.md },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}

      <AppPickerSheet visible={showModal} onClose={() => setShowModal(false)} />
    </Screen>
  )
}

const $header: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingVertical: 12,
}

const $headerLeft: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
}

const $iconBtn: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
}

const $appTitle: TextStyle = {
  fontSize: 28,
  lineHeight: 28,
  fontWeight: "700",
  fontFamily: "spaceGroteskBold",
  color: "#FFFFFF",
  letterSpacing: -0.5,
  includeFontPadding: false,
  marginTop: 6,
}

const $listContent: ViewStyle = {
  gap: 10,
  paddingTop: 4,
}

const $card: ViewStyle = {
  borderRadius: 16,
  padding: 16,
}

const $cardRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
}

const $accentDot: ViewStyle = {
  width: 10,
  height: 10,
  borderRadius: 5,
  flexShrink: 0,
}

const $appName: TextStyle = {
  flex: 1,
  fontSize: 16,
  fontWeight: "700",
}

const $statusBadge: ViewStyle = {
  borderWidth: 1,
  borderRadius: 10,
  paddingHorizontal: 10,
  paddingVertical: 4,
}

const $statusText: TextStyle = {
  fontSize: 12,
  fontWeight: "600",
}

const $empty: ViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
}

const $emptyTitle: TextStyle = {
  fontSize: 20,
  fontWeight: "700",
}

const $emptySubtitle: TextStyle = {
  fontSize: 15,
}

const $modalHandle: ViewStyle = {
  width: 40,
  height: 4,
  borderRadius: 2,
  alignSelf: "center",
  marginBottom: 8,
}

const $modalTitle: TextStyle = {
  fontSize: 20,
  fontWeight: "700",
}

const $pickerOverlay: ViewStyle = {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.4)",
}

const $pickerSheet: ViewStyle = {
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  paddingHorizontal: 20,
  paddingTop: 12,
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
}

const $pickerHeader: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 14,
}

const $searchBar: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  borderRadius: 12,
  borderWidth: 1,
  paddingHorizontal: 12,
  paddingVertical: Platform.OS === "ios" ? 10 : 6,
  gap: 8,
  marginBottom: 8,
}

const $searchInput: TextStyle = {
  flex: 1,
  fontSize: 15,
  padding: 0,
}

const $pickerRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 10,
  gap: 12,
  borderBottomWidth: 0.5,
}

const $pickerIconBox: ViewStyle = {
  width: 44,
  height: 44,
  borderRadius: 12,
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
}

const $pickerIconInitials: TextStyle = {
  fontSize: 13,
  fontWeight: "700",
  color: "#FFFFFF",
  letterSpacing: 0.3,
}

const $pickerLoading: ViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
}

const $pickerName: TextStyle = {
  flex: 1,
  fontSize: 15,
  fontWeight: "600",
}

const $pickerAddBtn: ViewStyle = {
  width: 36,
  height: 36,
  borderRadius: 10,
  alignItems: "center",
  justifyContent: "center",
}

const $appIconBox: ViewStyle = {
  width: 34,
  height: 34,
  borderRadius: 9,
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
}

const $appIconInitials: TextStyle = {
  fontSize: 11,
  fontWeight: "700",
  color: "#FFFFFF",
  letterSpacing: 0.3,
}
