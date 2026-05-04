/**
 * useCashfreePayment
 * ──────────────────
 * Wraps the react-native-cashfree-pg-sdk to provide:
 *   - launchPayment(paymentSessionId, orderId, environment) → one-time / new-strategy
 *   - launchSipMandate(subscriptionSessionId, subscriptionId, environment) → SIP mandate auth
 *
 * The SDK callback (onVerify / onError) must be registered once in the root layout
 * via CFPaymentGatewayService.setCallback().  We expose a helper to do that too.
 *
 * NOTE: react-native-cashfree-pg-sdk requires a native rebuild after installation.
 * Run `npx expo run:ios` or `npx expo run:android` (or EAS Build) before testing.
 * In Expo Go the native module is unavailable; calls will show an informative alert.
 */
import { useState, useCallback } from 'react';
import { Alert, NativeModules } from 'react-native';
import { useVerifyOrder } from '@/hooks/usePayments';

// ---------------------------------------------------------------------------
// Lazy-load the Cashfree SDK so Expo Go doesn't crash at import time.
// Native modules throw an Invariant Violation on access when not linked.
// ---------------------------------------------------------------------------

type CFEnvironmentType = { PRODUCTION: string; SANDBOX: string };
type CFSessionConstructor = new (sessionId: string, orderId: string, env: string) => any;
type CFSubscriptionSessionConstructor = new (sessionId: string, subscriptionId: string, env: string) => any;
type CFCallbackType = { onVerify: (orderId: string) => void; onError: (error: any, orderId: string) => void };
type CFPaymentGatewayServiceType = {
  setCallback: (cb: CFCallbackType) => void;
  doWebPayment: (session: any) => void;
  doSubscriptionPayment: (session: any) => void;
};

// ---------------------------------------------------------------------------
// Track the subscription ID of the most recently launched SIP mandate.
// The Cashfree SDK fires the same onVerify callback for both one-time payments
// and SIP mandate authorisations — this lets _layout.tsx tell them apart.
// ---------------------------------------------------------------------------
let _pendingSipId: string | null = null;

export function setPendingSipId(id: string | null): void {
  _pendingSipId = id;
}
export function getPendingSipId(): string | null {
  return _pendingSipId;
}

let _CFPaymentGatewayService: CFPaymentGatewayServiceType | null = null;
let _CFSession: CFSessionConstructor | null = null;
let _CFSubscriptionSession: CFSubscriptionSessionConstructor | null = null;
let _CFEnvironment: CFEnvironmentType | null = null;
let _nativeAvailable: boolean | null = null;

function loadCashfreeSDK(): boolean {
  if (_nativeAvailable !== null) return _nativeAvailable;
  // NativeModules check avoids the Invariant Violation that require() throws in Expo Go
  // when a native module isn't linked — unlike try/catch, this check is safe to call.
  if (!NativeModules.CashfreePgApi) {
    _nativeAvailable = false;
    return false;
  }
  try {
    const sdk = require('react-native-cashfree-pg-sdk');
    const contract = require('cashfree-pg-api-contract');
    _CFPaymentGatewayService = sdk.CFPaymentGatewayService;
    _CFSession = contract.CFSession;
    _CFSubscriptionSession = contract.CFSubscriptionSession;
    _CFEnvironment = contract.CFEnvironment;
    _nativeAvailable = true;
  } catch {
    _nativeAvailable = false;
  }
  return _nativeAvailable;
}

function toCFEnvironment(env: string | undefined): string {
  loadCashfreeSDK();
  if (!_CFEnvironment) return 'SANDBOX';
  return env === 'production' ? _CFEnvironment.PRODUCTION : _CFEnvironment.SANDBOX;
}

const DEV_BUILD_MSG =
  'Payment requires a development build.\n\nRun `npx expo run:ios` or `npx expo run:android` to build the app with native Cashfree support.';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Register the global Cashfree SDK callback.  Call this once in _layout.tsx. */
export function registerCashfreeCallback(
  onPaymentSuccess: (orderId: string) => void,
  onPaymentError: (error: any, orderId: string) => void,
) {
  if (!loadCashfreeSDK() || !_CFPaymentGatewayService) {
    // Native module unavailable (Expo Go) — nothing to register; silently skip.
    return;
  }
  const callback: CFCallbackType = {
    onVerify: onPaymentSuccess,
    onError: onPaymentError,
  };
  _CFPaymentGatewayService.setCallback(callback);
}

/** Hook for launching Cashfree payment flows from screens. */
export function useCashfreePayment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const verifyOrder = useVerifyOrder();

  /**
   * Launch the Cashfree drop-in checkout for a one-time / new-strategy order.
   * The SDK will present a payment sheet; result is delivered via the global callback.
   */
  const launchPayment = useCallback(
    (paymentSessionId: string, orderId: string, environment: string) => {
      if (!loadCashfreeSDK() || !_CFPaymentGatewayService || !_CFSession) {
        Alert.alert('Dev Build Required', DEV_BUILD_MSG);
        return;
      }
      try {
        setIsProcessing(true);
        const session = new _CFSession(
          paymentSessionId,
          orderId,
          toCFEnvironment(environment),
        );
        _CFPaymentGatewayService.doWebPayment(session);
        // SDK is async — isProcessing is cleared by the callback (onVerify/onError)
      } catch (err: any) {
        setIsProcessing(false);
        Alert.alert('Payment Error', err?.message ?? 'Failed to launch payment. Please try again.');
      }
    },
    [],
  );

  /**
   * Launch the Cashfree subscription flow for SIP mandate authorization.
   * The SDK will present an eMandate / UPI auth sheet.
   */
  const launchSipMandate = useCallback(
    (subscriptionSessionId: string, subscriptionId: string, environment: string) => {
      if (!loadCashfreeSDK() || !_CFPaymentGatewayService || !_CFSubscriptionSession) {
        Alert.alert('Dev Build Required', DEV_BUILD_MSG);
        return;
      }
      try {
        setIsProcessing(true);
        // Mark this as the pending SIP so the global callback can distinguish
        // a mandate result from a one-time payment result.
        setPendingSipId(subscriptionId);
        const session = new _CFSubscriptionSession(
          subscriptionSessionId,
          subscriptionId,
          toCFEnvironment(environment),
        );
        _CFPaymentGatewayService.doSubscriptionPayment(session);
      } catch (err: any) {
        setIsProcessing(false);
        Alert.alert('SIP Error', err?.message ?? 'Failed to launch SIP authorization. Please try again.');
      }
    },
    [],
  );

  const handlePaymentVerified = useCallback(
    (orderId: string, onSuccess?: (data: any) => void) => {
      setIsProcessing(false);
      verifyOrder.mutate(orderId, {
        onSuccess: (data) => {
          onSuccess?.(data);
        },
        onError: () => {
          // Verify endpoint failed — payment may still have succeeded; instruct user to check
          Alert.alert(
            'Payment Received',
            `Payment for order ${orderId} was processed. Please check your Orders screen for the latest status.`,
          );
        },
      });
    },
    [verifyOrder],
  );

  const handlePaymentFailed = useCallback((error: any, orderId: string) => {
    setIsProcessing(false);
    const message = error?.message ?? 'Payment was not completed.';
    Alert.alert('Payment Failed', `${message}\n\nOrder ID: ${orderId}`);
  }, []);

  return {
    launchPayment,
    launchSipMandate,
    handlePaymentVerified,
    handlePaymentFailed,
    isProcessing,
  };
}
