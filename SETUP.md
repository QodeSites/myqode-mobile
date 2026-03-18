# myQode Mobile — Setup Guide

Cross-platform React Native app (iOS + Android) for Qode Invest PMS clients.

---

## Prerequisites

- Node.js 18+
- npm 9+ or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode 14+ with Command Line Tools
- Android: Android Studio with SDK 33+, emulator or device
- EAS CLI (for production builds): `npm install -g eas-cli`

---

## 1. Install Dependencies

```bash
cd myqode-mobile
npm install
```

---

## 2. Configure Environment

Edit `.env` (already created):

```
EXPO_PUBLIC_API_URL=https://myqode.qodeinvest.com/api
EXPO_PUBLIC_GOOGLE_CLIENT_ID=<your_google_oauth_client_id>
```

---

## 3. Add App Assets

Create an `assets/` folder and add:
- `icon.png` — 1024×1024 app icon (dark green bg, white Q)
- `splash.png` — 1284×2778 splash (dark green bg, centered myQode logo)
- `adaptive-icon.png` — 1024×1024 Android adaptive icon foreground
- `favicon.png` — 48×48 web favicon
- `notification-icon.png` — 96×96 Android notification icon

---

## 4. Run the App

```bash
# Start Expo dev server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android
```

---

## 5. Production Builds (EAS)

```bash
# Configure EAS
eas build:configure

# Build iOS
eas build --platform ios --profile production

# Build Android
eas build --platform android --profile production
```

---

## Project Structure

```
myqode-mobile/
├── app/                    ← Expo Router screens
│   ├── _layout.tsx         ← Root layout (fonts, QueryClient, auth hydration)
│   ├── index.tsx           ← Root redirect (auth check)
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   └── login.tsx       ← Screen 1: Login
│   └── (tabs)/
│       ├── _layout.tsx     ← Bottom tab navigator (5 tabs)
│       ├── portfolio/
│       │   ├── index.tsx   ← Screen 2: Portfolio Performance (HOME)
│       │   └── snapshot.tsx← Screen 3: Portfolio Snapshot
│       ├── about/
│       │   ├── index.tsx   ← Screen 10: Qode Philosophy
│       │   ├── foundation.tsx ← Fund Managers
│       │   ├── strategy.tsx← Screen 4: Strategy Snapshot
│       │   └── team.tsx    ← Screen 5: Your Team
│       ├── experience/
│       │   ├── index.tsx   ← Investor Portal Guide
│       │   ├── services.tsx← Screen 6: Account Services
│       │   ├── mapping.tsx ← Account Mapping
│       │   └── cadence.tsx ← Service Cadence
│       ├── engagement/
│       │   ├── index.tsx   ← Your Voice Matters
│       │   ├── referral.tsx← Screen 9: Referral Program
│       │   └── insights.tsx← Screen 7: Insights & Events
│       └── docs/
│           ├── index.tsx   ← Screen 8: Document Vault
│           ├── risk.tsx    ← Risk Management
│           ├── escalation.tsx ← Grievance Redressal
│           └── faq.tsx     ← FAQs & Glossary
├── components/
│   ├── ui/                 ← StatCard, PrimaryButton, OutlinedButton, TopBar,
│   │                          CardContainer, FlowBadge, StatusPill, SectionBanner,
│   │                          LoadingSkeleton, Avatar
│   ├── charts/             ← NAVChart, DrawdownChart, ChartLegend
│   ├── portfolio/          ← TrailingReturnsTable, QuarterlyPLTable,
│   │                          MonthlyPLTable, CashFlowList
│   ├── strategy/           ← StrategyCard
│   └── services/           ← ServiceCard, TransactionRow
├── api/                    ← Axios client + all endpoint modules
├── constants/              ← Colors, Typography, Api
├── hooks/                  ← useAuth, usePortfolio, useAccountServices, useDocuments
├── store/                  ← authStore (Zustand), portfolioStore (Zustand)
└── utils/                  ← formatCurrency, formatPercent, formatDate
```

---

## Key Libraries

| Library | Purpose |
|---|---|
| expo-router v3 | File-based routing |
| nativewind v4 | Tailwind CSS for RN |
| zustand | Auth + portfolio global state |
| @tanstack/react-query v5 | Data fetching + caching |
| axios | HTTP client |
| victory-native | NAV + drawdown charts |
| expo-secure-store | JWT token storage |
| expo-haptics | Tactile feedback |
| expo-web-browser | PDF/link viewer |
| react-native-reanimated | Animations |

---

## API Base URL

All API calls go to:
```
https://myqode.qodeinvest.com/api
```

The Axios client in `api/client.ts` automatically:
- Attaches the Bearer JWT from SecureStore on every request
- Redirects to login on any 401 response
- Has a 15s timeout

---

## Authentication Flow

1. App boots → `app/_layout.tsx` checks SecureStore for token
2. Token found → validates via `GET /api/auth/me`
3. Valid → Zustand auth state hydrated → redirect to `/(tabs)/portfolio`
4. No token or invalid → redirect to `/(auth)/login`
5. Login form → `POST /api/auth/login` → store token → navigate to tabs
6. Logout → clears SecureStore + Zustand → navigate to login

---

## iOS-Specific Notes

- SafeAreaView with `edges={['top']}` used on all screens
- Haptic feedback on all button presses via `expo-haptics`
- Supports Dynamic Island / notch via `react-native-safe-area-context`
- Status bar: light on dark screens (login), dark on light screens (tabs)
- All modals use `presentationStyle="pageSheet"` for iOS-native feel
- Fonts loaded via `@expo-google-fonts/inter` + `expo-splash-screen`

---

## Android-Specific Notes

- `elevation` used alongside `shadowColor` for cross-platform shadows
- `KeyboardAvoidingView` with `behavior="height"` on forms
- Back button handled by Expo Router's native navigation

---

## Offline Support

React Query is configured with `staleTime: 5 min`. Data cached in memory remains
available offline after first load. For persistent offline storage, add
`@tanstack/query-async-storage-persister` with `expo-file-system`.

---

## Environment Variables

All vars prefixed with `EXPO_PUBLIC_` are bundled into the app at build time.
Never put secrets in `EXPO_PUBLIC_` vars — only public config.
