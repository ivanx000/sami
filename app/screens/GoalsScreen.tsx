import { useState } from "react"
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
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

import { Cog6ToothIcon, PlusCircleIcon } from "react-native-heroicons/outline"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAppBlock } from "@/context/AppBlockContext"
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
        <View style={[$accentDot, { backgroundColor: app.accentColor }]} />
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

function AddAppModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { addApp } = useAppBlock()
  const {
    theme: { colors },
  } = useAppTheme()
  const [name, setName] = useState("")

  const handleAdd = () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Enter the app name.")
      return
    }
    addApp(name.trim())
    setName("")
    onClose()
  }

  const handleClose = () => {
    setName("")
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={$modalOverlay}
      >
        <View style={[$modalSheet, { backgroundColor: colors.card }]}>
          <View style={[$modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[$modalTitle, { color: colors.text }]}>Block an App</Text>
          <Text style={[$inputLabel, { color: colors.textDim }]}>App name</Text>
          <TextInput
            style={[
              $input,
              {
                backgroundColor: colors.cardElevated,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Instagram, TikTok, Twitter…"
            placeholderTextColor={colors.textDim}
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />
          <View style={$modalActions}>
            <TouchableOpacity
              style={[$modalBtn, { backgroundColor: colors.cardElevated }]}
              onPress={handleClose}
            >
              <Text style={{ color: colors.textDim }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[$modalBtn, { backgroundColor: colors.tint }]}
              onPress={handleAdd}
            >
              <Text style={{ color: "#000", fontWeight: "700" }}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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

      <AddAppModal visible={showModal} onClose={() => setShowModal(false)} />
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

const $modalOverlay: ViewStyle = {
  flex: 1,
  justifyContent: "flex-end",
}

const $modalSheet: ViewStyle = {
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  padding: 24,
  gap: 12,
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
  marginBottom: 4,
}

const $inputLabel: TextStyle = {
  fontSize: 13,
  marginBottom: -4,
}

const $input: TextStyle = {
  borderRadius: 12,
  borderWidth: 1,
  padding: 14,
  fontSize: 15,
}

const $modalActions: ViewStyle = {
  flexDirection: "row",
  gap: 10,
  marginTop: 8,
}

const $modalBtn: ViewStyle = {
  flex: 1,
  borderRadius: 12,
  padding: 14,
  alignItems: "center",
}
