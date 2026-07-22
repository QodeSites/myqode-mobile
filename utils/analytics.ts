/**
 * analytics.ts — Lightweight event analytics for myQode mobile app.
 *
 * Design goals:
 *  - Zero impact on UX: fire-and-forget, never blocks the UI thread
 *  - Privacy-first: no PII — only user ID + strategy code
 *  - Resilient: events are batched and retried; failures are silent to the user
 *  - No third-party SDK dependency — calls our own backend
 *
 * Usage:
 *   import { Analytics } from '@/utils/analytics';
 *   Analytics.identify('client-id-123');          // call after login
 *   Analytics.screen('Portfolio');                 // on every screen mount
 *   Analytics.event('strategy_changed', { from: 'QAW', to: 'QGF' });
 *   Analytics.reset();                             // call on logout
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ── Firebase Analytics dual-write ─────────────────────────────────────────────
// Every Analytics.screen / Analytics.event / Analytics.error / Analytics.identify
// call also forwards to Firebase Analytics (in addition to the in-house backend).
// All Firebase calls are wrapped so a Firebase failure can never break the
// in-house tracking path.
//
// Requires (for the Firebase path to actually emit):
//   - @react-native-firebase/app + @react-native-firebase/analytics installed
//   - GoogleService-Info.plist (iOS) and google-services.json (Android)
//   - A custom dev/prod build (EAS) — Firebase native modules are NOT linked in
//     Expo Go, so importing the module there throws at load time.
//
// We therefore resolve the module LAZILY and guard it: in Expo Go (or any build
// missing the native module) every Firebase call silently no-ops, while real
// builds get full Firebase Analytics.

// Expo Go reports executionEnvironment === 'storeClient'.
const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';

// undefined = not yet resolved, null = unavailable, fn = the analytics() factory
let _fbAnalytics: (() => any) | null | undefined;

function getFirebaseAnalytics(): (() => any) | null {
  if (_fbAnalytics !== undefined) return _fbAnalytics;
  if (IS_EXPO_GO) {
    _fbAnalytics = null;
    return null;
  }
  try {
    // Lazy require so a missing native module can't crash module load.
    _fbAnalytics = require('@react-native-firebase/analytics').default;
  } catch {
    _fbAnalytics = null;
  }
  return _fbAnalytics ?? null;
}

function fbSafe(fn: (analytics: () => any) => Promise<unknown>) {
  // Fire-and-forget; never await, never throw.
  const analytics = getFirebaseAnalytics();
  if (!analytics) return;
  try {
    fn(analytics).catch(() => {});
  } catch {
    // synchronous throw from the native layer — ignore
  }
}

function flattenForFirebase(
  props: Record<string, string | number | boolean | null> | undefined
): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  if (!props) return out
  for (const [k, v] of Object.entries(props)) {
    if (v === null || v === undefined) continue
    out[k] = typeof v === 'boolean' ? (v ? 1 : 0) : v
  }
  return out
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type AnalyticsEvent = {
  type: 'screen' | 'event' | 'error';
  name: string;
  properties?: Record<string, string | number | boolean | null>;
  userId: string | null;
  sessionId: string;
  timestamp: string; // ISO 8601
  platform: 'ios' | 'android' | 'web';
  appVersion: string;
};

// ── Configuration ─────────────────────────────────────────────────────────────

const ENDPOINT = '/engagement/analytics';          // resolved against API_BASE_URL
const BATCH_INTERVAL_MS = 10_000;                  // flush every 10 seconds
const MAX_QUEUE_SIZE    = 50;                       // flush early if queue fills up
const MAX_RETRY_ATTEMPTS = 3;

// ── Internal state (module-level, no React dependency) ────────────────────────

let _userId: string | null = null;
let _sessionId: string     = generateSessionId();
let _queue: AnalyticsEvent[] = [];
let _flushTimer: ReturnType<typeof setTimeout> | null = null;
let _apiBaseUrl: string = '';
let _token: string | null = null;
let _retryAttempts: number = 0;

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const APP_VERSION: string =
  (Constants.expoConfig?.version ?? (Constants.manifest as any)?.version ?? 'unknown');

const PLATFORM: 'ios' | 'android' | 'web' =
  Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

// ── Core helpers ──────────────────────────────────────────────────────────────

function buildEvent(
  type: AnalyticsEvent['type'],
  name: string,
  properties?: AnalyticsEvent['properties']
): AnalyticsEvent {
  return {
    type,
    name,
    properties: properties ?? {},
    userId: _userId,
    sessionId: _sessionId,
    timestamp: new Date().toISOString(),
    platform: PLATFORM,
    appVersion: APP_VERSION,
  };
}

function enqueue(event: AnalyticsEvent) {
  _queue.push(event);
  if (_queue.length >= MAX_QUEUE_SIZE) {
    flush();
  } else {
    scheduleFlush();
  }
}

function scheduleFlush() {
  if (_flushTimer !== null) return;
  _flushTimer = setTimeout(() => {
    _flushTimer = null;
    flush();
  }, BATCH_INTERVAL_MS);
}

async function flush() {
  if (_flushTimer !== null) {
    clearTimeout(_flushTimer);
    _flushTimer = null;
  }
  if (_queue.length === 0) return;
  if (!_apiBaseUrl || !_token) return; // not initialised yet — keep events in queue

  const batch = _queue.splice(0, _queue.length); // drain queue atomically

  try {
    const res = await fetch(`${_apiBaseUrl}${ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${_token}`,
      },
      body: JSON.stringify({ events: batch }),
    });

    if (!res.ok && _retryAttempts < MAX_RETRY_ATTEMPTS) {
      // Put events back for retry
      _queue.unshift(...batch);
      _retryAttempts++;
      scheduleFlush();
    } else {
      _retryAttempts = 0;
    }
  } catch {
    // Network error — put events back silently for retry
    if (_retryAttempts < MAX_RETRY_ATTEMPTS) {
      _queue.unshift(...batch);
      _retryAttempts++;
      scheduleFlush();
    }
    // Exceeded retries — drop batch silently (never crash the app for analytics)
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export const Analytics = {
  /**
   * Call once after login with the API base URL and bearer token.
   * Also call when the token refreshes.
   */
  init(apiBaseUrl: string, token: string) {
    _apiBaseUrl = apiBaseUrl;
    _token = token;
    // Flush any events that were queued before init (e.g. login screen events)
    if (_queue.length > 0) flush();
  },

  /**
   * Associate subsequent events with a user ID.
   * Call immediately after login. Use clientId (not email/PAN).
   */
  identify(userId: string) {
    _userId = userId;
    fbSafe((analytics) => analytics().setUserId(userId));
    fbSafe((analytics) => analytics().setUserProperties({ app_platform: PLATFORM }));
  },

  /**
   * Track a screen view. Call in a useEffect on every screen component.
   */
  screen(screenName: string, properties?: Record<string, string | number | boolean | null>) {
    enqueue(buildEvent('screen', screenName, properties));
    fbSafe((analytics) => analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenName,
    }));
    fbSafe((analytics) => analytics().logEvent('screen_view', {
      firebase_screen: screenName,
      firebase_screen_class: screenName,
      app_platform: PLATFORM,
      ...flattenForFirebase(properties),
    }));
  },

  /**
   * Track a named event with optional metadata.
   * Keep property values non-sensitive (no email, PAN, phone).
   */
  event(
    eventName: string,
    properties?: Record<string, string | number | boolean | null>
  ) {
    enqueue(buildEvent('event', eventName, properties));
    fbSafe((analytics) => analytics().logEvent(eventName, {
      app_platform: PLATFORM,
      ...flattenForFirebase(properties),
    }));
  },

  /**
   * Track a caught error (e.g. API failure on a screen).
   */
  error(errorName: string, properties?: Record<string, string | number | boolean | null>) {
    enqueue(buildEvent('error', errorName, properties));
    fbSafe((analytics) => analytics().logEvent('app_error', {
      error_name: errorName,
      app_platform: PLATFORM,
      ...flattenForFirebase(properties),
    }));
  },

  /**
   * Call on logout — resets user identity and starts a new session.
   */
  reset() {
    flush(); // flush remaining events with old session before resetting
    _userId    = null;
    _sessionId = generateSessionId();
    _token     = null;
    fbSafe((analytics) => analytics().setUserId(null));
  },

  /**
   * Force-flush the queue (call before app goes to background).
   */
  flush,
};

// ── Predefined event names (prevents typos) ───────────────────────────────────

export const EVENTS = {
  // Auth
  LOGIN_SUCCESS:       'login_success',
  LOGIN_FAILED:        'login_failed',
  LOGOUT:              'logout',

  // Portfolio
  STRATEGY_CHANGED:    'strategy_changed',
  PERIOD_CHANGED:      'period_changed',
  PL_TOGGLE:           'pl_toggle_changed',
  PORTFOLIO_REFRESHED: 'portfolio_refreshed',

  // Services
  WITHDRAWAL_SUBMITTED:       'withdrawal_submitted',
  SWITCH_SUBMITTED:           'switch_submitted',
  SETUP_SIP_SUBMITTED:        'setup_sip_submitted',
  CANCEL_SIP_SUBMITTED:       'cancel_sip_submitted',
  PAUSE_RESUME_SIP_SUBMITTED: 'pause_resume_sip_submitted',
  STRATEGY_INQUIRY_SUBMITTED: 'strategy_inquiry_submitted',
  DISCUSSION_SUBMITTED:       'discussion_submitted',
  ACCOUNT_REQUEST_SUBMITTED:  'account_request_submitted',

  // Payments
  ADD_FUNDS_INITIATED: 'add_funds_initiated',
  PAYMENT_SUCCESS:     'payment_success',
  PAYMENT_FAILED:      'payment_failed',
  PAYMENT_CANCELLED:   'payment_cancelled',

  // Documents
  DOCUMENT_OPENED:     'document_opened',
  DOCUMENT_DOWNLOADED: 'document_downloaded',

  // Engagement
  NEWSLETTER_OPENED:   'newsletter_opened',
  PERSPECTIVE_OPENED:  'perspective_opened',
  EVENT_VIEWED:        'event_viewed',

  // Errors
  API_ERROR:           'api_error',
  RENDER_ERROR:        'render_error',
} as const;

export type EventName = typeof EVENTS[keyof typeof EVENTS];
