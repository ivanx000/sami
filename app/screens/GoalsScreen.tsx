import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated"
import { Gesture, GestureDetector } from "react-native-gesture-handler"

import {
  CheckIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  PlusIcon,
  XMarkIcon,
} from "react-native-heroicons/outline"

import { AppIcon } from "@/components/AppIcon"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAppBlock } from "@/context/AppBlockContext"
import { CURATED_APPS, filterCuratedApps } from "@/data/curatedApps"
import { useAppIcons } from "@/hooks/useAppIcons"
import { useInstalledApps } from "@/hooks/useInstalledApps"
import type { BlockedApp, TimeFrame } from "@/models/types"
import { useAppTheme } from "@/theme/context"
import type { MainStackParamList } from "@/navigators/navigationTypes"

type NavProp = NativeStackNavigationProp<MainStackParamList>

// ---- Helpers ----

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function formatDays(days: number[]): string {
  const s = [...days].sort((a, b) => a - b)
  if (s.length === 7) return "Every day"
  if (s.join() === "1,2,3,4,5") return "Weekdays"
  if (s.join() === "0,6") return "Weekends"
  if (s.join() === "6,0") return "Weekends"
  if (s.length === 1) return DAY_ABBR[s[0]] ?? ""
  return s.map((d) => DAY_ABBR[d] ?? "").join(", ")
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number)
  const ampm = h >= 12 ? "pm" : "am"
  const h12 = h % 12 || 12
  return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, "0")}${ampm}`
}

function formatTimeFrame(tf: TimeFrame): string {
  return `${formatDays(tf.days)}  ${formatTime(tf.startTime)}–${formatTime(tf.endTime)}`
}

// ---- Types ----

type DragState = {
  appId: string
  cardWidth: number
  cardHeight: number
}

type RenderItem =
  | { type: "single"; app: BlockedApp }
  | { type: "group"; groupId: string; apps: BlockedApp[]; anchorApp: BlockedApp }

// ---- Schedule Tag ----

function ScheduleTag({ label, color }: { label: string; color: string }) {
  return (
    <View style={[$scheduleTag, { backgroundColor: color }]}>
      <Text style={$scheduleTagText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}

// ---- Card Content (pure visual) ----

function AppCardContent({
  app,
  iconUrl,
  dimmed,
  showBorder,
  colors,
}: {
  app: BlockedApp
  iconUrl?: string
  dimmed?: boolean
  showBorder?: boolean
  colors: ReturnType<typeof useAppTheme>["theme"]["colors"]
}) {
  const { updateApp } = useAppBlock()

  const tags: string[] = app.blockedForever
    ? ["Always"]
    : app.timeFrames.map(formatTimeFrame)

  const borderColor = tags.length > 0 ? app.accentColor : "transparent"
  const topPad = tags.length > 0 ? tags.length * 28 + 4 : 0

  return (
    <View style={{ opacity: dimmed ? 0.35 : 1 }}>
      {/* Tags sitting on top of the border */}
      {tags.map((label, i) => (
        <View
          key={i}
          style={[$tagWrapper, { top: -(tags.length - i) * 28 }]}
        >
          <ScheduleTag label={label} color={app.accentColor} />
        </View>
      ))}

      <View
        style={[
          $card,
          {
            backgroundColor: colors.card,
            borderColor: showBorder !== false ? borderColor : "transparent",
            borderWidth: tags.length > 0 ? 2 : 0,
            paddingTop: tags.length > 0 ? topPad : 14,
          },
        ]}
      >
        <View style={$cardRow}>
          <AppIcon
            name={app.name}
            initials={app.name.slice(0, 2).toUpperCase()}
            brandColor={app.brandColor ?? app.accentColor}
            iconUrl={iconUrl}
            size={34}
          />
          <Text style={[$appName, { color: colors.text, flex: 1 }]} numberOfLines={1}>
            {app.name}
          </Text>
          <Switch
            value={app.blockedForever}
            onValueChange={(v) => updateApp(app.id, { blockedForever: v })}
            trackColor={{ false: colors.cardElevated, true: "#007AFF" }}
            ios_backgroundColor={colors.cardElevated}
          />
        </View>
      </View>
    </View>
  )
}

// ---- Drop Target Glow ----

function DropTargetGlow({
  active,
  color,
  children,
}: {
  active: boolean
  color: string
  children: React.ReactNode
}) {
  const glow = useSharedValue(0)

  useEffect(() => {
    if (active) {
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      )
    } else {
      glow.value = withTiming(0, { duration: 200 })
    }
  }, [active, glow])

  const animStyle = useAnimatedStyle(() => ({
    shadowColor: color,
    shadowOpacity: 0.6 * glow.value,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8 * glow.value,
  }))

  return <Animated.View style={animStyle}>{children}</Animated.View>
}

// ---- Draggable App Card ----

function DraggableAppCard({
  app,
  iconUrl,
  onPress,
  isDraggingThis,
  isDropTarget,
  anyDragging,
  onDragStart,
  onDragMove,
  onDragEnd,
  registerLayout,
  colors,
}: {
  app: BlockedApp
  iconUrl?: string
  onPress: () => void
  isDraggingThis: boolean
  isDropTarget: boolean
  anyDragging: boolean
  onDragStart: (appId: string, screenX: number, screenY: number, w: number, h: number) => void
  onDragMove: (screenX: number, screenY: number) => void
  onDragEnd: () => void
  registerLayout: (appId: string, layout: { y: number; height: number }) => void
  colors: ReturnType<typeof useAppTheme>["theme"]["colors"]
}) {
  const cardRef = useRef<View>(null)
  const scale = useSharedValue(1)

  const longPress = Gesture.LongPress()
    .minDuration(350)
    .onStart((e) => {
      scale.value = withSpring(1.03, { damping: 15 })
      runOnJS(onDragStart)(app.id, e.absoluteX, e.absoluteY, 0, 0)
    })

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      runOnJS(onDragMove)(e.absoluteX, e.absoluteY)
    })
    .onEnd(() => {
      scale.value = withSpring(1, { damping: 15 })
      runOnJS(onDragEnd)()
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 15 })
    })

  const gesture = Gesture.Simultaneous(longPress, pan)

  const liftStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    zIndex: isDraggingThis ? 100 : 1,
  }))

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        ref={cardRef as any}
        style={liftStyle}
        onLayout={() => {
          cardRef.current?.measure((_x, _y, _w, h, _px, py) => {
            registerLayout(app.id, { y: py, height: h })
          })
        }}
      >
        <TouchableOpacity activeOpacity={0.7} onPress={onPress} disabled={anyDragging}>
          <DropTargetGlow active={isDropTarget} color={app.accentColor}>
            <View
              style={[
                isDropTarget && {
                  borderRadius: 18,
                  borderWidth: 2,
                  borderColor: app.accentColor,
                  borderStyle: "dashed",
                },
              ]}
            >
              <AppCardContent
                app={app}
                iconUrl={iconUrl}
                dimmed={anyDragging && !isDraggingThis && !isDropTarget}
                colors={colors}
              />
            </View>
          </DropTargetGlow>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  )
}

// ---- Group Container ----

function GroupContainer({
  groupId,
  groupApps,
  anchorApp,
  iconUrlByName,
  onPressApp,
  draggingAppId,
  dragTargetId,
  anyDragging,
  onDragStart,
  onDragMove,
  onDragEnd,
  registerLayout,
  colors,
}: {
  groupId: string
  groupApps: BlockedApp[]
  anchorApp: BlockedApp
  iconUrlByName: Record<string, string>
  onPressApp: (appId: string) => void
  draggingAppId: string | null
  dragTargetId: string | null
  anyDragging: boolean
  onDragStart: (appId: string, screenX: number, screenY: number, w: number, h: number) => void
  onDragMove: (screenX: number, screenY: number) => void
  onDragEnd: () => void
  registerLayout: (appId: string, layout: { y: number; height: number }) => void
  colors: ReturnType<typeof useAppTheme>["theme"]["colors"]
}) {
  const tags: string[] = anchorApp.blockedForever
    ? ["Always"]
    : anchorApp.timeFrames.map(formatTimeFrame)

  const topPad = tags.length > 0 ? tags.length * 28 + 8 : 8
  const borderColor = anchorApp.accentColor

  return (
    <View style={[$groupOuter, { marginTop: tags.length > 0 ? tags.length * 28 : 0 }]}>
      {/* Group-level tags */}
      {tags.map((label, i) => (
        <View
          key={i}
          style={[
            $tagWrapper,
            { top: -(tags.length - i) * 28, left: 12 },
          ]}
        >
          <ScheduleTag label={label} color={borderColor} />
        </View>
      ))}

      <View
        style={[
          $groupContainer,
          { borderColor, paddingTop: topPad },
        ]}
      >
        {groupApps.map((app, idx) => (
          <View key={app.id} style={idx > 0 ? $groupDivider : undefined}>
            <DraggableAppCard
              app={app}
              iconUrl={iconUrlByName[app.name]}
              onPress={() => onPressApp(app.id)}
              isDraggingThis={draggingAppId === app.id}
              isDropTarget={dragTargetId === app.id}
              anyDragging={anyDragging}
              onDragStart={onDragStart}
              onDragMove={onDragMove}
              onDragEnd={onDragEnd}
              registerLayout={registerLayout}
              colors={colors}
            />
          </View>
        ))}
      </View>
    </View>
  )
}

// ---- App Picker Sheet ----

const SHEET_HEIGHT = Dimensions.get("window").height * 0.68

function AppPickerSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { addApp, apps } = useAppBlock()
  const {
    theme: { colors },
  } = useAppTheme()
  const insets = useSafeAreaInsets()
  const [query, setQuery] = useState("")
  const { apps: installedApps, loading } = useInstalledApps()
  const iconUrls = useAppIcons(installedApps)

  const filtered = useMemo(() => filterCuratedApps(installedApps, query), [installedApps, query])
  const addedNames = useMemo(() => new Set(apps.map((a) => a.name)), [apps])

  const handleClose = () => {
    setQuery("")
    onClose()
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
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {filtered.map((item) => {
              const alreadyAdded = addedNames.has(item.name)
              return (
                <View key={item.id} style={[$pickerRow, { borderBottomColor: colors.border }]}>
                  <AppIcon
                    name={item.name}
                    initials={item.initials}
                    brandColor={item.brandColor}
                    iconUrl={iconUrls[item.id]}
                    size={36}
                  />
                  <Text style={[$pickerName, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <TouchableOpacity
                    style={[
                      $pickerAddBtn,
                      alreadyAdded
                        ? { backgroundColor: colors.cardElevated }
                        : { backgroundColor: colors.tint + "22" },
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
            })}
          </ScrollView>
        )}
      </View>
    </Modal>
  )
}

// ---- Ghost Card ----

function GhostCard({
  app,
  iconUrl,
  ghostX,
  ghostY,
  colors,
}: {
  app: BlockedApp
  iconUrl?: string
  ghostX: ReturnType<typeof useSharedValue<number>>
  ghostY: ReturnType<typeof useSharedValue<number>>
  colors: ReturnType<typeof useAppTheme>["theme"]["colors"]
}) {
  const style = useAnimatedStyle(() => ({
    position: "absolute",
    left: ghostX.value,
    top: ghostY.value,
    width: "100%",
    opacity: 0.88,
    transform: [{ scale: 1.04 }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 24,
  }))

  return (
    <Animated.View style={style} pointerEvents="none">
      <AppCardContent app={app} iconUrl={iconUrl} colors={colors} />
    </Animated.View>
  )
}

// ---- Main Screen ----

export function AppsScreen() {
  const { apps, groupApps } = useAppBlock()
  const {
    theme: { colors, spacing },
  } = useAppTheme()
  const navigation = useNavigation<NavProp>()
  const insets = useSafeAreaInsets()
  const [showModal, setShowModal] = useState(false)

  const iconUrls = useAppIcons(CURATED_APPS)
  const iconUrlByName = useMemo(() => {
    const map: Record<string, string> = {}
    CURATED_APPS.forEach((a) => {
      if (iconUrls[a.id]) map[a.name] = iconUrls[a.id]
    })
    return map
  }, [iconUrls])

  // Drag state
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [dragTargetId, setDragTargetId] = useState<string | null>(null)
  const ghostX = useSharedValue(0)
  const ghostY = useSharedValue(0)
  const cardLayouts = useRef<Record<string, { y: number; height: number }>>({})
  const ghostContainerRef = useRef<View>(null)
  const ghostContainerOffset = useRef({ x: 0, y: 0 })
  const draggingIdRef = useRef<string | null>(null)

  const registerLayout = useCallback((appId: string, layout: { y: number; height: number }) => {
    cardLayouts.current[appId] = layout
  }, [])

  const onDragStart = useCallback(
    (appId: string, screenX: number, screenY: number, _w: number, _h: number) => {
      // Measure ghost container to get offset
      ghostContainerRef.current?.measureInWindow((cx, cy) => {
        ghostContainerOffset.current = { x: cx, y: cy }
        const layout = cardLayouts.current[appId]
        ghostX.value = spacing.md
        ghostY.value = layout ? layout.y - cy : screenY - cy - 30
        draggingIdRef.current = appId
        setDragState({ appId, cardWidth: 0, cardHeight: 0 })
      })
    },
    [ghostX, ghostY, spacing.md],
  )

  const onDragMove = useCallback(
    (screenX: number, screenY: number) => {
      ghostX.value = spacing.md
      ghostY.value = screenY - ghostContainerOffset.current.y - 30

      const draggingId = draggingIdRef.current
      if (!draggingId) return

      let found: string | null = null
      for (const [id, layout] of Object.entries(cardLayouts.current)) {
        if (id === draggingId) continue
        // layout.y and screenY are both screen-absolute from measure/absoluteY
        if (screenY >= layout.y && screenY <= layout.y + layout.height) {
          found = id
          break
        }
      }
      setDragTargetId(found)
    },
    [ghostX, ghostY, spacing.md],
  )

  const onDragEnd = useCallback(() => {
    if (dragState && dragTargetId) {
      groupApps(dragState.appId, dragTargetId)
    }
    draggingIdRef.current = null
    setDragState(null)
    setDragTargetId(null)
  }, [dragState, dragTargetId, groupApps])

  // Build render items (preserve insertion order, group by groupId)
  const renderItems = useMemo((): RenderItem[] => {
    const seenGroups = new Set<string>()
    const result: RenderItem[] = []
    for (const app of apps) {
      if (!app.groupId) {
        result.push({ type: "single", app })
      } else if (!seenGroups.has(app.groupId)) {
        seenGroups.add(app.groupId)
        const grpApps = apps.filter((a) => a.groupId === app.groupId)
        const anchor = grpApps.find((a) => a.id === app.groupId) ?? grpApps[0]
        result.push({ type: "group", groupId: app.groupId, apps: grpApps, anchorApp: anchor })
      }
    }
    return result
  }, [apps])

  const ghostApp = dragState ? apps.find((a) => a.id === dragState.appId) : null

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} systemBarStyle="light">
      <View style={[$header, { paddingHorizontal: spacing.md }]}>
        <View style={$headerLeft}>
          <TouchableOpacity style={$iconBtn} activeOpacity={0.7}>
            <Cog6ToothIcon size={26} color="#FFFFFF" strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={$appTitle}>sami</Text>
        </View>
        <TouchableOpacity onPress={() => setShowModal(true)} style={$iconBtn} activeOpacity={0.7}>
          <PlusCircleIcon size={32} color="#FFFFFF" strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      {/* Invisible anchor for measuring coordinate space */}
      <View
        ref={ghostContainerRef}
        style={$measureAnchor}
        pointerEvents="none"
        onLayout={() => {
          ghostContainerRef.current?.measureInWindow((x, y) => {
            ghostContainerOffset.current = { x, y }
          })
        }}
      />

      {apps.length === 0 ? (
        <View style={$empty}>
          <Text style={[$emptyTitle, { color: colors.text }]}>No apps blocked</Text>
          <Text style={[$emptySubtitle, { color: colors.textDim }]}>Tap + to block your first app</Text>
        </View>
      ) : (
        <ScrollView
          scrollEnabled={!dragState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            $listContent,
            { paddingBottom: insets.bottom + 24, paddingHorizontal: spacing.md },
          ]}
        >
          {renderItems.map((item) => {
            if (item.type === "single") {
              const app = item.app
              const hasSchedule = app.blockedForever || app.timeFrames.length > 0
              const tagCount = app.blockedForever ? 1 : app.timeFrames.length
              return (
                <View key={app.id} style={{ marginTop: hasSchedule ? tagCount * 28 : 0 }}>
                  <DraggableAppCard
                    app={app}
                    iconUrl={iconUrlByName[app.name]}
                    onPress={() => navigation.navigate("AppDetail", { appId: app.id })}
                    isDraggingThis={dragState?.appId === app.id}
                    isDropTarget={dragTargetId === app.id}
                    anyDragging={!!dragState}
                    onDragStart={onDragStart}
                    onDragMove={onDragMove}
                    onDragEnd={onDragEnd}
                    registerLayout={registerLayout}
                    colors={colors}
                  />
                </View>
              )
            }

            return (
              <GroupContainer
                key={item.groupId}
                groupId={item.groupId}
                groupApps={item.apps}
                anchorApp={item.anchorApp}
                iconUrlByName={iconUrlByName}
                onPressApp={(appId) => navigation.navigate("AppDetail", { appId })}
                draggingAppId={dragState?.appId ?? null}
                dragTargetId={dragTargetId}
                anyDragging={!!dragState}
                onDragStart={onDragStart}
                onDragMove={onDragMove}
                onDragEnd={onDragEnd}
                registerLayout={registerLayout}
                colors={colors}
              />
            )
          })}
        </ScrollView>
      )}

      {/* Ghost card overlay */}
      {ghostApp && dragState && (
        <View style={[StyleSheet.absoluteFillObject]} pointerEvents="none">
          <GhostCard
            app={ghostApp}
            iconUrl={iconUrlByName[ghostApp.name]}
            ghostX={ghostX}
            ghostY={ghostY}
            colors={colors}
          />
        </View>
      )}

      <AppPickerSheet visible={showModal} onClose={() => setShowModal(false)} />
    </Screen>
  )
}

// ---- Styles ----

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
  paddingHorizontal: 14,
  paddingBottom: 14,
  paddingTop: 14,
}

const $cardRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
}

const $appName: TextStyle = {
  fontSize: 16,
  fontWeight: "700",
}

const $tagWrapper: ViewStyle = {
  position: "absolute",
  left: 12,
  zIndex: 10,
  borderRadius: 8,
  overflow: "hidden",
}

const $scheduleTag: ViewStyle = {
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 8,
}

const $scheduleTagText: TextStyle = {
  fontSize: 11,
  fontWeight: "700",
  color: "#FFFFFF",
  letterSpacing: 0.2,
}

const $groupOuter: ViewStyle = {
  position: "relative",
}

const $groupContainer: ViewStyle = {
  borderWidth: 2,
  borderRadius: 18,
  paddingHorizontal: 10,
  paddingBottom: 10,
  gap: 6,
}

const $groupDivider: ViewStyle = {
  marginTop: 4,
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

const $measureAnchor: ViewStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  width: 0,
  height: 0,
}
