# Sami

A React Native focus and productivity app that helps users manage distractions and track focused work sessions toward personal goals.

## What It Does

Sami lets users:
- Create and manage focus goals
- Run timed focus sessions with a countdown timer
- Block distracting apps on a customizable schedule
- Log post-session reflections and focus scores
- View weekly insights and analytics per goal

## Tech Stack

| Category | Libraries |
|---|---|
| Framework | React Native 0.83.4, Expo 55, TypeScript 5.9 |
| Navigation | React Navigation 7 (native-stack, bottom-tabs) |
| State | React Context API + MMKV persistent storage |
| UI | react-native-reanimated, react-native-gesture-handler, react-native-heroicons |
| Fonts | Space Grotesk via `@expo-google-fonts/space-grotesk` |
| Networking | apisauce |
| i18n | i18next + react-i18next (EN, ES, FR, AR, HI, JA, KO) |
| Notifications | expo-notifications |
| Debugging | Reactotron + MMKV plugin |
| Testing | Jest, Maestro (E2E) |
| Build | EAS (Expo Application Services) |

**JS Engine:** Hermes — **New Architecture:** Enabled

## Project Structure

```
app/
├── screens/          # Feature screens (Login, Goals, GoalDetail, FocusSession, Reflection, Insights)
├── context/          # Global state (AuthContext, GoalContext, SessionContext, AppBlockContext)
├── navigators/       # Navigation setup (App, Main, Goals navigators + types)
├── components/       # Reusable UI components
├── theme/            # Colors, typography, spacing, dark/light theme system
├── hooks/            # useAppIcons (iTunes API), useInstalledApps
├── models/           # TypeScript types (Goal, FocusSession, BlockedApp, TimeFrame)
├── services/api/     # apisauce API client + error handling
├── utils/            # Storage (MMKV wrapper), notifications, date formatting
├── i18n/             # Translation files per language
├── config/           # Dev/prod API endpoints + base config
├── data/             # Curated app list (70+ apps across social, gaming, video, etc.)
└── devtools/         # Reactotron config
assets/
├── icons/
└── images/
```

## Screens

| Screen | Description |
|---|---|
| **Login** | Email-based auth with validation |
| **Goals** | Main dashboard — goal cards, weekly stats, create new goals |
| **Goal Detail** | Edit goal, manage blocked apps, configure time-based blocking schedules, drag-to-group apps |
| **Focus Session** | Animated circular countdown timer, pause/resume/end controls |
| **Reflection** | Post-session feedback — what you accomplished, focus score (1–5), distraction tracking |
| **Insights** | Weekly bar charts and stats (sessions, minutes, avg focus score) per goal |

## Key Data Models

**Goal** — `id`, `name`, `accentColor`, `createdAt`, `isArchived`

**FocusSession** — `goalId`, `startedAt`, `endedAt`, `plannedDuration`, `actualDuration`, `reflection`, `focusScore` (1–5), `wasDistracted`, `distractionNote`, `completedFully`

**BlockedApp** — `name`, `blockedForever`, `timeFrames[]`, `groupId` (for drag-grouped apps)

**TimeFrame** — `startTime`, `endTime`, `days[]` (0=Sun–6=Sat)

All data is persisted locally with MMKV — no backend required.

## Getting Started

```bash
npm install --legacy-peer-deps
npm run start
```

The app uses a custom dev client. Build it first before running on a device or simulator:

```bash
# iOS
npm run build:ios:sim      # simulator
npm run build:ios:device   # physical device
npm run build:ios:preview  # TestFlight
npm run build:ios:prod     # App Store

# Android
npm run build:android:sim      # emulator
npm run build:android:device   # physical device
npm run build:android:preview  # Google Play internal track
npm run build:android:prod     # Play Store
```

**Prerequisites:** Node.js >= 20, Xcode (iOS), Android Studio (Android), EAS CLI (`npm i -g eas-cli`)

## Other Scripts

```bash
npm run compile         # TypeScript type check
npm run lint            # ESLint (auto-fix)
npm run lint:check      # ESLint (check only)
npm run test            # Jest unit tests
npm run test:watch      # Jest in watch mode
npm run test:maestro    # Maestro E2E tests
npm run depcruise:graph # Generate dependency graph SVG
npm run adb             # Android reverse port forwarding (dev)
```

## Theme

Sami uses a custom theme system with light ("Warm Paper") and dark mode support, toggled automatically from system preference. Theme is provided via React Context and consumed in all screens and components.

Colors, spacing, typography, and timing values are all centralized in `app/theme/`.

## App Blocking

The app includes a curated list of 70+ distracting apps (social, video, gaming, shopping, messaging, music, news, dating) in `app/data/curatedApps.ts`. App icons are fetched at runtime from the iTunes Search API via the `useAppIcons` hook. Blocking schedules use time frames tied to days of the week.

## Configuration

| File | Purpose |
|---|---|
| `app/config/config.base.ts` | Base config (nav persistence, error catching, exit routes) |
| `app/config/config.dev.ts` | Dev API base URL |
| `app/config/config.prod.ts` | Prod API base URL |
| `app.json` | Expo app config (name, bundle IDs, icons, plugins) |
| `app.config.ts` | Dynamic Expo config (iOS privacy manifests) |
| `eas.json` | EAS build profiles |
| `tsconfig.json` | TypeScript strict mode, path aliases (`@/*`, `@assets/*`) |

App identifiers: iOS bundle `com.sami`, Android package `com.sami`, deep link scheme `sami://`
