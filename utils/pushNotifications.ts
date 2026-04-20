/**
 * Push notification registration utility.
 *
 * Handles requesting permission and registering/deregistering the Expo push
 * token with our backend. All operations are fire-and-forget — a failure here
 * must never break the login / logout flow.
 *
 * Called:
 *   - registerForPushNotifications() → after successful login + on app bootstrap
 *   - deregisterPushNotification(token) → before logout
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { servicesApi } from '@/api/services';

// Key used to persist the current push token in memory (module scope).
// We don't need SecureStore for this — it's not a secret.
let _cachedPushToken: string | null = null;

export function getCachedPushToken(): string | null {
  return _cachedPushToken;
}

/**
 * Requests notification permissions, obtains the Expo push token, and
 * registers it with the Qode backend.
 *
 * Safe to call multiple times — if permissions were already granted and the
 * token hasn't changed, the backend upsert is a no-op.
 *
 * Returns the push token string on success, null on any failure.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Physical device required — simulators don't support push tokens.
    if (!Device.isDevice) return null;

    // Check / request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      // User denied notifications — silent no-op
      return null;
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const pushToken = tokenData.data;

    if (!pushToken) return null;

    _cachedPushToken = pushToken;

    // Register with backend (fire and forget — don't block login)
    await servicesApi.registerPushToken({
      pushToken,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });

    return pushToken;
  } catch {
    // Permission denied, simulator, or network error — all are non-fatal
    return null;
  }
}

/**
 * Deregisters the given push token from the backend.
 * Call this on logout so the user stops receiving notifications on this device.
 */
export async function deregisterPushNotification(pushToken?: string | null): Promise<void> {
  const token = pushToken ?? _cachedPushToken;
  if (!token) return;

  try {
    await servicesApi.deregisterPushToken(token);
    _cachedPushToken = null;
  } catch {
    // Non-fatal — worst case the user gets an extra notification after logout
  }
}
