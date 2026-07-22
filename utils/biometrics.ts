// Thin wrapper around expo-local-authentication for the app-lock feature.
//
// Policy (decided with product):
//  • Lock is REQUIRED on every device that can authenticate the user — i.e. one
//    that has either a biometric (Face ID / Touch ID / fingerprint) enrolled OR
//    at least a device passcode set. If the device has no security at all we
//    cannot lock, so the persisted session is simply shown without a gate.
//  • Biometric is attempted first; the OS device passcode is offered as a
//    fallback (disableDeviceFallback = false). The final fallback — signing in
//    again with email + password — is handled by the LockScreen UI.
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

export type BiometricLabel = 'Face ID' | 'Touch ID' | 'Fingerprint' | 'Biometric';

/**
 * Whether the app should lock on this device.
 * True when the device has at least a passcode (SECRET) or biometric enrolled.
 * Never throws — returns false on any error so the app stays usable.
 */
export async function getCanLockDevice(): Promise<boolean> {
  try {
    const level = await LocalAuthentication.getEnrolledLevelAsync();
    return level !== LocalAuthentication.SecurityLevel.NONE;
  } catch {
    return false;
  }
}

/**
 * Human-readable name for the device's primary biometric, used in button labels
 * and prompts ("Unlock with Face ID"). Falls back to a generic term.
 */
export async function getBiometricLabel(): Promise<BiometricLabel> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return Platform.OS === 'ios' ? 'Face ID' : 'Biometric';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    }
    return 'Biometric';
  } catch {
    return 'Biometric';
  }
}

/**
 * Prompt the user to authenticate. Biometric first, OS device passcode as
 * fallback. The `cancelLabel` ("Use Password") is shown on iOS only — on
 * Android the system prompt cannot show a cancel button while device-credential
 * fallback is enabled, so the LockScreen surfaces the password option instead.
 */
export async function authenticate(
  promptMessage = 'Unlock myQode'
): Promise<LocalAuthentication.LocalAuthenticationResult> {
  try {
    return await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Use Password',
      fallbackLabel: 'Use Passcode',
      disableDeviceFallback: false,
    });
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'unknown' };
  }
}
