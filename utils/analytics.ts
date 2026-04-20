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
 *   Analytics.event('strategy_changed', { from: 'QAW', to: 'QFH' });
 *   Analytics.reset();                             // call on logout
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

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
  (Constants.expoConfig?.version ?? Constants.manifest?.version ?? 'unknown');

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
  },

  /**
   * Track a screen view. Call in a useEffect on every screen component.
   */
  screen(screenName: string, properties?: Record<string, string | number | boolean | null>) {
    enqueue(buildEvent('screen', screenName, properties));
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
  },

  /**
   * Track a caught error (e.g. API failure on a screen).
   */
  error(errorName: string, properties?: Record<string, string | number | boolean | null>) {
    enqueue(buildEvent('error', errorName, properties));
  },

  /**
   * Call on logout — resets user identity and starts a new session.
   */
  reset() {
    flush(); // flush remaining events with old session before resetting
    _userId    = null;
    _sessionId = generateSessionId();
    _token     = null;
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
