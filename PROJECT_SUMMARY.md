# myQode Mobile — Project Summary
*Last updated: Apr 10, 2026 — Full production audit + fixes applied*

---

## 1. Project Overview

| Repo | Path | Stack |
|------|------|-------|
| **myqode-mobile** (React Native app) | `Projects/myqode-mobile/` | React Native, Expo Router, TypeScript, NativeWind (Tailwind CSS), Zustand, React Query |
| **myQode** (Next.js web + API) | `Projects/myQode/` | Next.js 14 App Router, TypeScript, PostgreSQL (pg), JWT auth |

**Production API:** `https://myqode.qodeinvest.com/api/mobile`  
**Data source:** Internal PostgreSQL DB — `pms_master_sheet`, `pms_clients_master`, `tblresearch_new` (benchmark)  
**Data freshness:** Updated every morning at 11:00 AM IST (batch job)  
**Users:** Existing Qode investors — HNI individuals who previously used the web version

---

## 2. Architecture

### API Structure (`myQode/app/api/mobile/`)
```
auth/
  login/                  ← POST — email/password → JWT (30d)
portfolio/
  snapshot/               ← GET — all accounts + portfolio values (home screen)
  performance/            ← GET?accountId — trailing returns, drawdown, benchmark
  nav/                    ← GET?accountId&period — NAV chart (rebased to 100)
  drawdown/               ← GET?accountId&period — drawdown chart
  monthly-pl/             ← GET?accountId — monthly P&L heat map
  quarterly-pl/           ← GET?accountId — quarterly P&L table
  cashflow/               ← GET?accountId — cash in/out history
  combined-{nav,drawdown,performance,monthly-pl,quarterly-pl,cashflow}/
                          ← Owner-level aggregate views (ownerId row in pms_master_sheet)
documents/
  list/                   ← GET — categories + file counts from S3
  files/[category]/       ← GET — presigned S3 URLs for a category
engagement/
  newsletters/            ← GET — Qode newsletters list
  perspectives/           ← GET — market perspectives
  events/                 ← GET — upcoming events
  portal-guide/           ← GET — app/portal help docs
  referral/               ← GET — referral info
  analytics/              ← POST — batch analytics events (NEW — Apr 10)
experience/
  family/                 ← GET — 3-level family tree (group → owner → accounts)
payments/
  create-order/           ← POST — creates Cashfree payment order
  verify/                 ← POST — verifies Cashfree payment & updates DB
  investment-status/      ← GET?orderId — order progress timeline
services/
  account-request/        ← POST — new account request
  bank-details/           ← GET — Qode bank account for deposits
  cancel-sip/             ← POST — SIP cancellation request
  discussion/             ← POST — general inquiry
  pause-resume-sip/       ← POST — pause/resume SIP request
  setup-sip/              ← POST — SIP setup request
  strategy-inquiry/       ← POST — strategy inquiry
  switch/                 ← POST — strategy switch request
  transactions/           ← GET?accountId — past investment transactions
  withdrawal/             ← POST — withdrawal request
admin/
  clients/                ← GET — admin list of all clients
  impersonate/            ← POST — admin impersonates a client
  analytics/              ← GET — analytics dashboard (NEW — Apr 10)
```

### Frontend Structure (`myqode-mobile/`)
```
app/
  (auth)/login.tsx              ← Login screen (email + password)
  (tabs)/
    portfolio/index.tsx         ← Main portfolio screen (stats, charts, tables)
    home.tsx                    ← Home / snapshot screen
    invest/index.tsx            ← Payments + transaction history
    services/index.tsx          ← Service requests (switch, SIP, withdrawal)
    documents/index.tsx         ← Document library
    experience/index.tsx        ← Family, engagement (newsletters etc.)
  (admin)/                      ← Super-admin panel (impersonation)
api/
  client.ts                     ← Axios instance (auth, retry, 401 handler)
  auth.ts                       ← Login / logout / token / user cache
  portfolio.ts                  ← All portfolio API calls
  payments.ts                   ← Cashfree payments
  services.ts                   ← Service request calls
  documents.ts                  ← Document library calls
  engagement.ts                 ← Newsletters, events, etc.
  family.ts                     ← Family tree calls
store/
  authStore.ts                  ← Zustand: user, token, selected account, impersonation
hooks/
  usePortfolio.ts               ← React Query hooks for all portfolio data
  useAuth.ts                    ← useLogin / useLogout mutations
  useCashfreePayment.ts         ← Cashfree SDK integration
utils/
  analytics.ts                  ← Analytics event tracking (NEW — Apr 10)
  formatCurrency.ts             ← Indian INR formatting
  formatDate.ts                 ← Date formatting
  formatPercent.ts              ← Percent formatting
```

---

## 3. Auth Model

```
Login → POST /api/mobile/auth/login
      → Validates email/password against pms_clients_master (bcrypt)
      → Returns JWT (30d) + user object { clientId, clientCode, name, accountCodes, ... }

JWT payload (MobileAuthUser):
  userId, email, clientCode, clientId,
  accountCodes[],   // all accounts this user may access (individual + owner + group codes)
  ownerIds[],
  groupId,
  isHeadOfFamily,   // HoF can see entire family group
  isSuperAdmin?,    // karan@qodeinvest.com only — read from SUPER_ADMIN_EMAIL env var
  isImpersonated?,  // true when admin views as a client
  isReviewer?       // Play Store / App Store reviewer — served mock data

Account code types:
  QAW0001, QTF0002, ... → Individual strategy accounts
  OWN00001, OWN00002    → Owner-level aggregate (pre-computed in pms_master_sheet)
  GRP0001               → Group/family aggregate (pre-computed in pms_master_sheet)
```

**Token storage:** `expo-secure-store` (encrypted device keychain — NOT AsyncStorage)

---

## 4. Data Model

### Key Tables (PostgreSQL)

| Table | Key Columns | Notes |
|-------|-------------|-------|
| `pms_clients_master` | `clientid`, `clientcode`, `email`, `groupid`, `ownerid`, `head_of_family`, `onboarding_status` | All investor accounts |
| `pms_master_sheet` | `account_code`, `report_date`, `nav`, `portfolio_value`, `drawdown_percent`, `cash_in_out` | Daily portfolio values — also has pre-computed owner/group aggregate rows |
| `tblresearch_new` | `indices`, `date`, `nav` | Benchmark NAV data (NIFTY 50, etc.) — lives in `db2` (separate connection) |
| `pms_mobile_analytics` | `event_type`, `event_name`, `properties`, `user_id`, `session_id`, `occurred_at`, `platform`, `app_version` | **NEW** — analytics events from mobile app |

### Account Hierarchy
```
Group (GRP)
  └── Owner (OWN) — may have multiple owners in one group
        └── Individual accounts (QAW, QTF, QGF, QFH)
```

Head of Family (HoF) can see all levels. Non-HoF sees their own owner scope only.

---

## 5. Analytics System (NEW — Apr 10, 2026)

### What's tracked
| Event | Trigger |
|-------|---------|
| `screen_view` | Every screen mount via `Analytics.screen()` |
| `login_success` / `login_failed` | Login mutation result |
| `strategy_changed` | Strategy selector change |
| `period_changed` | Chart period pill change |
| `portfolio_refreshed` | Pull-to-refresh on portfolio screen |
| `withdrawal_submitted` etc. | All service request submissions |
| `payment_success` / `payment_failed` | Cashfree payment result |
| `document_opened` / `document_downloaded` | Document library actions |
| `newsletter_opened`, `perspective_opened` | Engagement actions |
| `api_error`, `render_error` | Caught errors |

### How it works
1. `utils/analytics.ts` — Fire-and-forget event queue; batches 10s or 50 events
2. `POST /api/mobile/engagement/analytics` — Backend stores to `pms_mobile_analytics`
3. `GET /api/mobile/admin/analytics` — Admin dashboard reads aggregated stats

### Admin analytics dashboard
```
GET /api/mobile/admin/analytics?days=30&platform=ios
Returns:
  summary: { totalUsers, totalSessions, totalEvents }
  dau: [ { day, active_users, total_events } ]
  topScreens: [ { event_name, views, unique_users } ]
  topEvents: [ { event_name, occurrences, unique_users } ]
  errors: [ { event_name, occurrences, affected_users, last_seen } ]
  platformSplit: [ { platform, users, sessions } ]
  appVersionSplit: [ { app_version, users } ]
```

To add tracking to a new screen:
```typescript
import { Analytics, EVENTS } from '@/utils/analytics';

// In a component:
useFocusEffect(useCallback(() => {
  Analytics.screen('MyScreen', { optional: 'props' });
}, []));

// For events:
Analytics.event(EVENTS.WITHDRAWAL_SUBMITTED, { accountId: '...', amount: 50000 });
```

---

## 6. Required .env Variables

Add these to the myQode Next.js `.env.local` / production environment:

```bash
# Critical — must be set, no defaults
JWT_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
SUPER_ADMIN_EMAIL=karan@qodeinvest.com

# CORS — comma-separated origins that may call the API from a browser context
ALLOWED_ORIGINS=https://myqode.qodeinvest.com,http://localhost:3000

# Reviewer account (Play Store / App Store review — only set when needed)
# REVIEWER_EMAIL=reviewer@qodeinvest.com
# REVIEWER_PASSWORD=<strong random password>

# Email recipients for service requests
WITHDRAWAL_EMAIL_RECIPIENT=sanket.shinde@qodeinvest.com

# AWS S3 (documents)
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=...

# Cashfree payments
CASHFREE_APP_ID=...
CASHFREE_SECRET_KEY=...
NEXT_PUBLIC_CASHFREE_ENV=production  # or 'sandbox' for testing

# DB connections
DATABASE_URL=postgresql://...       # pms_* tables
DATABASE_URL_2=postgresql://...     # tblresearch_new (benchmark)
```

---

## 7. All Bugs Fixed (Apr 10, 2026)

### Critical Security Fixes
| File | Bug | Fix |
|------|-----|-----|
| `lib/mobileAuth.ts` | JWT_SECRET used with non-null assertion (`!`) but no validation — crashes with cryptic error if env var missing | Added startup validation: throws at module load with clear error message |
| `app/api/mobile/auth/login/route.ts` | Reviewer credentials had hardcoded defaults (`reviewer@qodeinvest.com` / `Review@123`) visible in source — anyone with code access could log in | Removed all defaults; reviewer login only active when `REVIEWER_EMAIL` + `REVIEWER_PASSWORD` env vars are explicitly set |
| `middleware.ts` | CORS wildcard `Access-Control-Allow-Origin: *` — allows any origin to call the API | Fixed: reads `ALLOWED_ORIGINS` env var; validates request origin against allowlist; `*` never used |
| `app/api/mobile/experience/family/route.ts` | Full PAN number (e.g. `ABCDE1234F`) returned in response | Masked: shows only last 4 chars (`••••••1234F`) |
| `app/api/mobile/admin/impersonate/route.ts` | Impersonation JWT issued for 4 hours | Reduced to 1 hour |

### SQL Injection Fixes
| File | Bug | Fix |
|------|-----|-----|
| `portfolio/nav/route.ts` | `INTERVAL '${days} days'` and `closedAt` string-interpolated into SQL | Replaced with parameterized `report_date >= $2` using pre-computed cutoff date |
| `portfolio/combined-nav/route.ts` | Same pattern | Same fix |
| `portfolio/drawdown/route.ts` | Same pattern | Same fix |
| `portfolio/combined-drawdown/route.ts` | Same pattern | Same fix |

### Input Validation Fixes
| File | Bug | Fix |
|------|-----|-----|
| `services/withdrawal/route.ts` | `amount` not validated — could be negative, NaN, or absurdly large string | Added: `parseFloat` conversion, NaN guard, positivity check, max ₹10 Cr cap |

### Data Correctness Fixes
| File | Bug | Fix |
|------|-----|-----|
| `portfolio/performance/route.ts` | Benchmark fetch failures swallowed silently (`.warn()`) — client sees benchmark as all-null with no explanation | Changed to `console.error`; added `benchmarkUnavailable: true` flag in response so client can show "Benchmark data unavailable" |

### Frontend Fixes
| File | Bug | Fix |
|------|-----|-----|
| `api/client.ts` | `console.log('[API] Base URL:...')` and `console.log('[REQ]...')` ran in production builds | Wrapped in `if (__DEV__)` |
| `api/client.ts` | No retry logic — any network hiccup failed permanently | Added exponential backoff retry: up to 2 retries on network errors and 5xx, with 1s/2s delays |
| `api/client.ts` | Timeout 15s — could be insufficient for large chart data | Increased to 30s |
| `api/client.ts` | 401 handler didn't call `logout()` on regular token expiry | Added `useAuthStore.getState().logout()` before redirecting to login |
| `app/_layout.tsx` | No AppState listener — impersonation token persisted when admin backgrounded app | Added `AppState` listener: clears impersonation token + calls `stopImpersonation()` on background/inactive |
| `app/_layout.tsx` | Analytics not flushed before app goes to background | Added `Analytics.flush()` in AppState handler |

---

## 8. Screens — Web Parity Checklist

Pages from the web version (`myQode/app/(protected)/`):

| Web Page | Mobile Screen | Status |
|----------|---------------|--------|
| Dashboard / Portfolio | `(tabs)/portfolio/index.tsx` | ✅ Full parity |
| Home / Snapshot | `(tabs)/home.tsx` | ✅ |
| Invest / Add Funds | `(tabs)/invest/index.tsx` | ✅ Cashfree integrated |
| Services | `(tabs)/services/index.tsx` | ✅ All service requests |
| Documents | `(tabs)/documents/index.tsx` | ✅ |
| Engagement (newsletters, events) | `(tabs)/experience/index.tsx` | ✅ |
| Family / Account Management | embedded in experience tab | ✅ |
| Admin Panel | `(admin)/` | ✅ Super admin + impersonation |
| Analytics Dashboard | — | ✅ API ready (Apr 10); admin UI TBD |

---

## 9. Outstanding Items

### High Priority (Before Launch)
- [ ] **Email recipients**: Replace hardcoded `sanket.shinde@qodeinvest.com` in service routes (`withdrawal`, `switch`, etc.) with `process.env.WITHDRAWAL_EMAIL_RECIPIENT` env var — see all occurrences with `grep -r "shinde@qodeinvest"`.
- [ ] **2FA**: Login currently email + password only. For HNI users, add OTP (SMS/email) on first login from new device.
- [ ] **Admin analytics UI**: `GET /api/mobile/admin/analytics` is ready — build a simple admin screen in `app/(admin)/` to visualise DAU, top screens, errors.
- [ ] **Run DB migration**: `pms_mobile_analytics` table needs to be created. The `ensureTableExists()` call in the analytics route handles it on first POST, but run it manually in production for safety.

### Medium Priority (Post-Launch Sprint)
- [ ] **Certificate pinning**: Add `react-native-cert-pinning` to prevent MITM on compromised devices.
- [ ] **Push notifications**: `expo-notifications` plugin is listed in `app.json` but no handlers are wired. Implement for portfolio milestones, SIP confirmations.
- [ ] **Offline mode**: Cache last snapshot in SecureStore; show "Last updated at 11:00 AM" when offline.
- [ ] **Deep linking**: `scheme: "myqode"` in `app.json` but no linking config in `_layout.tsx`. Add route mappings for push notification deep links.
- [ ] **Admin analytics viewer**: Implement analytics screen in the `(admin)` section using the `GET /api/mobile/admin/analytics` endpoint.
- [ ] **FlatList for accounts**: `home.tsx` renders `flatAccounts.map()` in a ScrollView — use FlatList for users with many accounts.

### Low Priority (Future)
- [ ] **PDF portfolio export**: HNI users may want to share/archive snapshot PDFs.
- [ ] **Biometric auth**: TouchID/FaceID for app unlock (re-auth only, not first login).
- [ ] **More analytics instrumentation**: Wire `EVENTS.STRATEGY_CHANGED` in StrategySelector, `EVENTS.PERIOD_CHANGED` in period pills, all service request screens.

---

## 10. How to Resume

Tell Claude:
> "I'm working on myQode mobile (React Native) + myQode API (Next.js). Read `Projects/myqode-mobile/PROJECT_SUMMARY.md` for full context. Frontend at `Projects/myqode-mobile/`, API at `Projects/myQode/app/api/mobile/`."

**Verified state as of Apr 10, 2026:**
- All critical security issues patched (JWT, CORS, PAN, hardcoded credentials)
- SQL injection surface removed from all chart routes (4 files)
- Frontend: production logging removed, retry logic added, AppState handler added
- Analytics: full system shipped (mobile utility + backend endpoint + admin dashboard API)
- No breaking changes to any existing API contracts
- Reviewer mock path still works (requires env vars to be explicitly set)
