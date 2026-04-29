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
  PlusIcon,
  XMarkIcon,
} from "react-native-heroicons/outline"
import Svg, { Circle, Path } from "react-native-svg"

import { AppIcon } from "@/components/AppIcon"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAppBlock } from "@/context/AppBlockContext"
import { CURATED_APPS } from "@/data/curatedApps"
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

// ---- Stats Hero ----

function StatsHero({
  colors,
}: {
  colors: ReturnType<typeof useAppTheme>["theme"]["colors"]
}) {
  const weeklyMins = [42, 78, 55, 134, 90, 18, 61]
  const maxMins = Math.max(...weeklyMins)
  const totalMins = weeklyMins.reduce((a, b) => a + b, 0)
  const hh = Math.floor(totalMins / 60)
  const mm = totalMins % 60
  const today = new Date().getDay() // 0=Sun

  return (
    <View style={$statsHero}>
      <View style={{ marginBottom: 4 }}>
        <Text style={[$statsLabel, { color: colors.tintInactive }]}>Saved this week</Text>
        <Text style={[$statsValue, { color: colors.text }]}>
          {hh}h {mm}m
        </Text>
      </View>

      <View style={$statsRow}>
        <View style={$statItem}>
          <Svg width={13} height={13} viewBox="0 0 13 13">
            <Path
              d="M6.5 1C6.5 1 9.5 3.5 9.5 6C9.5 7.1 9.0 8 8.2 8.6C8.3 8.1 8.2 7.5 7.9 7C7.4 8 6.5 8.5 6.5 9.5C6.5 10.6 7.3 11.5 8.2 11.9C7.7 12 7.1 12 6.5 12C4.0 12 2 10 2 7.5C2 4.5 6.5 1 6.5 1Z"
              fill={colors.tint}
            />
          </Svg>
          <Text style={[$statNumber, { color: colors.text }]}>12</Text>
          <Text style={[$statUnit, { color: colors.tintInactive }]}>day streak</Text>
        </View>
        <View style={$statItem}>
          <Svg width={13} height={13} viewBox="0 0 13 13">
            <Circle cx="6.5" cy="6.5" r="5" stroke={colors.tint} strokeWidth="1.4" fill="none" />
            <Path
              d="M6.5 3.5v3l2 1.2"
              stroke={colors.tint}
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </Svg>
          <Text style={[$statNumber, { color: colors.text }]}>2h 14m</Text>
          <Text style={[$statUnit, { color: colors.tintInactive }]}>saved today</Text>
        </View>
      </View>

      {/* Weekly bar chart */}
      <View style={$chartBars}>
        {weeklyMins.map((m, i) => (
          <View
            key={i}
            style={[
              $chartBar,
              {
                flex: 1,
                height: m > 0 ? Math.max((m / maxMins) * 52, 4) : 3,
                backgroundColor:
                  i === today
                    ? colors.tint
                    : m > 0
                      ? colors.tint + "55"
                      : colors.separator,
              },
            ]}
          />
        ))}
      </View>
      <View style={$chartLabels}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <Text
            key={i}
            style={[
              $chartLabel,
              { flex: 1, color: i === today ? colors.tint : colors.tintInactive },
            ]}
          >
            {d}
          </Text>
        ))}
      </View>
    </View>
  )
}

// ---- Card Content (pure visual) ----

function AppCardContent({
  app,
  iconUrl,
  dimmed,
  showSchedule = true,
  colors,
}: {
  app: BlockedApp
  iconUrl?: string
  dimmed?: boolean
  showSchedule?: boolean
  colors: ReturnType<typeof useAppTheme>["theme"]["colors"]
}) {
  const { updateApp } = useAppBlock()

  const scheduleText = app.blockedForever
    ? "Always blocked"
    : app.timeFrames.length > 0
      ? formatTimeFrame(app.timeFrames[0]) +
        (app.timeFrames.length > 1 ? ` +${app.timeFrames.length - 1}` : "")
      : null

  return (
    <View style={{ opacity: dimmed ? 0.35 : 1 }}>
      <View
        style={[
          $card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
          },
        ]}
      >
        <View style={$cardRow}>
          <AppIcon
            name={app.name}
            initials={app.name.slice(0, 2).toUpperCase()}
            brandColor={app.brandColor ?? app.accentColor}
            iconUrl={iconUrl}
            size={36}
          />
          <View style={{ flex: 1, gap: showSchedule && scheduleText ? 2 : 0 }}>
            <Text style={[$appName, { color: colors.text }]} numberOfLines={1}>
              {app.name}
            </Text>
            {showSchedule && scheduleText && (
              <Text style={[$scheduleSub, { color: colors.tintInactive }]} numberOfLines={1}>
                {scheduleText}
              </Text>
            )}
          </View>
          <Switch
            value={app.blockedForever}
            onValueChange={(v) => updateApp(app.id, { blockedForever: v })}
            trackColor={{ false: colors.cardElevated, true: colors.tint }}
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
  isGrouped,
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
  isGrouped?: boolean
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
                  borderRadius: 16,
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
                showSchedule={!isGrouped}
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
  const label = anchorApp.blockedForever
    ? "Always"
    : anchorApp.timeFrames.length > 0
      ? formatDays(anchorApp.timeFrames[0].days)
      : "Group"

  const timeRange =
    !anchorApp.blockedForever && anchorApp.timeFrames.length > 0
      ? `${formatTime(anchorApp.timeFrames[0].startTime)}–${formatTime(anchorApp.timeFrames[0].endTime)}`
      : null

  return (
    <View style={$groupOuter}>
      <View
        style={[
          $groupContainer,
          { borderColor: colors.accentBorder },
        ]}
      >
        {/* Header strip */}
        <View style={[$groupHeader, { backgroundColor: colors.accentBg }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={[$groupLabel, { color: colors.tint }]}>{label}</Text>
            {anchorApp.blockedForever && (
              <Text style={[$groupActive, { color: colors.tint }]}>Active</Text>
            )}
            {timeRange && (
              <Text style={[$groupTime, { color: colors.tintInactive }]}>{timeRange}</Text>
            )}
          </View>
          <Text style={[$groupCount, { color: colors.tintInactive }]}>
            {groupApps.length} app{groupApps.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* App rows */}
        {groupApps.map((app, idx) => (
          <View key={app.id} style={{ backgroundColor: colors.card }}>
            {idx > 0 && (
              <View
                style={[$groupDivider, { backgroundColor: colors.separator }]}
              />
            )}
            <DraggableAppCard
              app={app}
              iconUrl={iconUrlByName[app.name]}
              onPress={() => onPressApp(app.id)}
              isDraggingThis={draggingAppId === app.id}
              isDropTarget={dragTargetId === app.id}
              anyDragging={anyDragging}
              isGrouped={true}
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

const SHEET_HEIGHT = Dimensions.get("window").height * 0.82
const PICKER_CATEGORIES = ["All", "Social", "Video", "Gaming", "Shopping", "Messaging", "Music", "News", "Dating", "Browser", "Food"]

function AppPickerSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { addApp, apps } = useAppBlock()
  const {
    theme: { colors },
  } = useAppTheme()
  const insets = useSafeAreaInsets()
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const { apps: installedApps, loading } = useInstalledApps()
  const iconUrls = useAppIcons(installedApps)

  const blockedNames = useMemo(() => new Set(apps.map((a) => a.name)), [apps])

  const filteredApps = useMemo(() => {
    const q = query.trim().toLowerCase()
    return installedApps.filter((app) => {
      if (blockedNames.has(app.name)) return false
      if (q && !app.name.toLowerCase().includes(q)) return false
      if (activeCategory !== "All" && app.category !== activeCategory) return false
      return true
    })
  }, [installedApps, blockedNames, query, activeCategory])

  const groupedApps = useMemo(() => {
    const map = new Map<string, typeof installedApps>()
    for (const app of filteredApps) {
      if (!map.has(app.category)) map.set(app.category, [])
      map.get(app.category)!.push(app)
    }
    return PICKER_CATEGORIES.slice(1).flatMap((cat) =>
      map.has(cat) ? [{ category: cat, apps: map.get(cat)! }] : [],
    )
  }, [filteredApps])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDone = () => {
    for (const id of selectedIds) {
      const app = installedApps.find((a) => a.id === id)
      if (app) addApp(app.name, app.brandColor)
    }
    handleClose()
  }

  const handleClose = () => {
    setQuery("")
    setActiveCategory("All")
    setSelectedIds(new Set())
    onClose()
  }

  const doneLabel = selectedIds.size > 0 ? `Done (${selectedIds.size})` : "Done"

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={$pickerOverlay} activeOpacity={1} onPress={handleClose} />
      <View
        style={[
          $pickerSheet,
          { backgroundColor: colors.background, paddingBottom: insets.bottom + 16, height: SHEET_HEIGHT },
        ]}
      >
        {/* Handle */}
        <View style={[$modalHandle, { backgroundColor: colors.border }]} />

        {/* Header */}
        <View style={$pickerHeader}>
          <Text style={[$modalTitle, { color: colors.text }]}>Block an App</Text>
          <TouchableOpacity onPress={handleDone} hitSlop={12}>
            <Text style={[$doneBtnText, { color: colors.tint }]}>{doneLabel}</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View
          style={[
            $searchBar,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <MagnifyingGlassIcon size={15} color={colors.tintInactive} strokeWidth={2} />
          <TextInput
            style={[$searchInput, { color: colors.text }]}
            placeholder="Search apps…"
            placeholderTextColor={colors.tintInactive}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
        </View>

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={$chipRow}
          style={$chipScroll}
        >
          {PICKER_CATEGORIES.map((cat) => {
            const active = activeCategory === cat
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[
                  $chip,
                  active
                    ? { backgroundColor: colors.tint }
                    : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[$chipText, { color: active ? "#fff" : colors.text }]}>{cat}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {loading ? (
          <View style={$pickerLoading}>
            <ActivityIndicator color={colors.tint} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={{ marginHorizontal: -20 }}
          >
            {groupedApps.length === 0 ? (
              <View style={$pickerEmpty}>
                <Text style={{ color: colors.tintInactive, fontSize: 14 }}>No apps found</Text>
              </View>
            ) : (
              groupedApps.map(({ category, apps: catApps }) => (
                <View key={category} style={{ marginBottom: 4 }}>
                  <Text style={[$sectionHeader, { color: colors.tintInactive }]}>
                    {category.toUpperCase()}
                  </Text>
                  <View
                    style={[
                      $pickerList,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    {catApps.map((item, idx) => {
                      const isSelected = selectedIds.has(item.id)
                      return (
                        <View key={item.id}>
                          {idx > 0 && (
                            <View style={[$pickerDivider, { backgroundColor: colors.separator }]} />
                          )}
                          <TouchableOpacity
                            style={$pickerRow}
                            onPress={() => toggleSelect(item.id)}
                            activeOpacity={0.7}
                          >
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
                            <View
                              style={[
                                $pickerCheck,
                                isSelected
                                  ? { backgroundColor: colors.tint }
                                  : {
                                      backgroundColor: "transparent",
                                      borderColor: colors.border,
                                      borderWidth: 1.5,
                                    },
                              ]}
                            >
                              {isSelected && <CheckIcon size={14} color="#fff" strokeWidth={2.5} />}
                            </View>
                          </TouchableOpacity>
                        </View>
                      )
                    })}
                  </View>
                </View>
              ))
            )}
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
    shadowOpacity: 0.15,
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
    <Screen preset="fixed" safeAreaEdges={["top"]} systemBarStyle="dark">
      {/* Header */}
      <View style={[$header, { paddingHorizontal: spacing.md }]}>
        <Text style={[$appTitle, { color: colors.text }]}>sami</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            style={[$navIconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <Cog6ToothIcon size={16} color={colors.tintInactive} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Invisible coordinate anchor */}
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
          <Text style={[$emptySubtitle, { color: colors.tintInactive }]}>
            Tap + to block your first app
          </Text>
          <TouchableOpacity
            style={[$addButton, { backgroundColor: colors.tint }]}
            onPress={() => setShowModal(true)}
            activeOpacity={0.85}
          >
            <View style={$addButtonInner}>
              <PlusIcon size={15} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={$addButtonText}>Block an App</Text>
            </View>
          </TouchableOpacity>
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
          {/* Stats hero */}
          <StatsHero colors={colors} />

          {/* App list */}
          {renderItems.map((item) => {
            if (item.type === "single") {
              const app = item.app
              return (
                <View key={app.id}>
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

          {/* Bottom CTA */}
          <TouchableOpacity
            style={[$addButton, { backgroundColor: colors.tint }]}
            onPress={() => setShowModal(true)}
            activeOpacity={0.85}
          >
            <View style={$addButtonInner}>
              <PlusIcon size={15} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={$addButtonText}>Block an App</Text>
            </View>
          </TouchableOpacity>
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
  paddingVertical: 8,
}

const $appTitle: TextStyle = {
  fontSize: 22,
  lineHeight: 22,
  fontFamily: "spaceGroteskBold",
  letterSpacing: -0.6,
  includeFontPadding: false,
}

const $navIconBtn: ViewStyle = {
  width: 32,
  height: 32,
  borderRadius: 9,
  borderWidth: 1,
  alignItems: "center",
  justifyContent: "center",
}

const $statsHero: ViewStyle = {
  paddingBottom: 22,
}

const $statsLabel: TextStyle = {
  fontSize: 11,
  fontFamily: "spaceGroteskSemiBold",
  letterSpacing: 0.5,
  textTransform: "uppercase",
  marginBottom: 4,
}

const $statsValue: TextStyle = {
  fontSize: 28,
  letterSpacing: -1,
  lineHeight: 32,
  fontFamily: "spaceGroteskBold",
}

const $statsRow: ViewStyle = {
  flexDirection: "row",
  gap: 20,
  marginTop: 4,
  marginBottom: 18,
}

const $statItem: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 5,
}

const $statNumber: TextStyle = {
  fontSize: 13,
  fontFamily: "spaceGroteskSemiBold",
}

const $statUnit: TextStyle = {
  fontSize: 12,
}

const $chartBars: ViewStyle = {
  flexDirection: "row",
  alignItems: "flex-end",
  gap: 5,
  height: 52,
}

const $chartBar: ViewStyle = {
  borderRadius: 4,
}

const $chartLabels: ViewStyle = {
  flexDirection: "row",
  gap: 5,
  marginTop: 6,
}

const $chartLabel: TextStyle = {
  textAlign: "center",
  fontSize: 10,
  fontFamily: "spaceGroteskSemiBold",
}

const $listContent: ViewStyle = {
  gap: 10,
  paddingTop: 4,
}

const $card: ViewStyle = {
  borderRadius: 16,
  paddingHorizontal: 14,
  paddingVertical: 13,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 3,
  elevation: 1,
}

const $cardRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
}

const $appName: TextStyle = {
  fontSize: 14,
  fontFamily: "spaceGroteskMedium",
}

const $scheduleSub: TextStyle = {
  fontSize: 11,
}

const $groupOuter: ViewStyle = {
  position: "relative",
}

const $groupContainer: ViewStyle = {
  borderWidth: 1.5,
  borderRadius: 14,
  overflow: "hidden",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 3,
  elevation: 1,
}

const $groupHeader: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 14,
  paddingVertical: 10,
}

const $groupLabel: TextStyle = {
  fontSize: 12,
  fontFamily: "spaceGroteskBold",
}

const $groupActive: TextStyle = {
  fontSize: 11,
  fontFamily: "spaceGroteskBold",
}

const $groupTime: TextStyle = {
  fontSize: 11,
}

const $groupCount: TextStyle = {
  fontSize: 11,
}

const $groupDivider: ViewStyle = {
  height: 1,
  marginHorizontal: 14,
}

const $empty: ViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  paddingHorizontal: 32,
}

const $emptyTitle: TextStyle = {
  fontSize: 20,
  fontFamily: "spaceGroteskBold",
}

const $emptySubtitle: TextStyle = {
  fontSize: 15,
  textAlign: "center",
  marginBottom: 24,
}

const $addButton: ViewStyle = {
  borderRadius: 14,
  paddingVertical: 15,
  alignItems: "center",
  justifyContent: "center",
  shadowColor: "#2E7D52",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 8,
  elevation: 3,
}

const $addButtonInner: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
}

const $addButtonText: TextStyle = {
  fontSize: 15,
  fontFamily: "spaceGroteskMedium",
  color: "#FFFFFF",
  letterSpacing: -0.2,
}

const $modalHandle: ViewStyle = {
  width: 36,
  height: 4,
  borderRadius: 2,
  alignSelf: "center",
  marginBottom: 12,
}

const $modalTitle: TextStyle = {
  fontSize: 17,
  fontFamily: "spaceGroteskBold",
  letterSpacing: -0.4,
}

const $pickerOverlay: ViewStyle = {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.3)",
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

const $doneBtnText: TextStyle = {
  fontSize: 15,
  fontFamily: "spaceGroteskSemiBold",
}

const $chipScroll: ViewStyle = {
  marginHorizontal: -20,
  marginBottom: 12,
  flexGrow: 0,
}

const $chipRow: ViewStyle = {
  flexDirection: "row",
  gap: 8,
  paddingHorizontal: 20,
}

const $chip: ViewStyle = {
  paddingHorizontal: 14,
  paddingVertical: 7,
  borderRadius: 20,
}

const $chipText: TextStyle = {
  fontSize: 13,
  fontFamily: "spaceGroteskMedium",
}

const $sectionHeader: TextStyle = {
  fontSize: 11,
  fontFamily: "spaceGroteskSemiBold",
  letterSpacing: 0.6,
  marginHorizontal: 20,
  marginTop: 12,
  marginBottom: 6,
}

const $pickerEmpty: ViewStyle = {
  paddingVertical: 40,
  alignItems: "center",
}

const $searchBar: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  borderRadius: 11,
  borderWidth: 1,
  paddingHorizontal: 12,
  paddingVertical: Platform.OS === "ios" ? 10 : 6,
  gap: 8,
  marginBottom: 12,
}

const $searchInput: TextStyle = {
  flex: 1,
  fontSize: 14,
  padding: 0,
}

const $pickerList: ViewStyle = {
  marginHorizontal: 20,
  borderRadius: 14,
  borderWidth: 1,
  overflow: "hidden",
  marginBottom: 8,
}

const $pickerRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 10,
  paddingHorizontal: 14,
  gap: 12,
}

const $pickerDivider: ViewStyle = {
  height: 1,
  marginHorizontal: 14,
}

const $pickerLoading: ViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
}

const $pickerName: TextStyle = {
  flex: 1,
  fontSize: 14,
  fontFamily: "spaceGroteskMedium",
}

const $pickerCheck: ViewStyle = {
  width: 24,
  height: 24,
  borderRadius: 7,
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
