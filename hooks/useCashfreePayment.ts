// useCashfreePayment
// ──────────────────
// Launches the WebView-based checkout that mirrors the web flow at
// account-services/page.tsx (which loads https://sdk.cashfree.com/js/v3/cashfree.js
// and calls cashfree.checkout / cashfree.subscriptionsCheckout).
//
// We deliberately do NOT use react-native-cashfree-pg-sdk's doWebPayment —
// it routes HDFC NetBanking through HDFC's "Now" (TPV) gateway which rejects
// without ClientAccNumber. The v3 web SDK routes through the standard
// non-TPV bank pipes, identical to what the web app uses today.
//
// Both `launchPayment` and `launchSipMandate` simply navigate to the
// `payment-checkout` modal route, which renders a WebView with the SDK.
// Order verification, query-cache invalidation, and post-payment navigation
// all happen inside that route (see app/payment-checkout.tsx).
import { useState, useCallback } from 'react';
import { router } from 'expo-router';

export function useCashfreePayment() {
  // Kept for API parity with the previous SDK-driven implementation —
  // call sites read `isProcessing` to disable buttons after the user taps Pay.
  const [isProcessing, setIsProcessing] = useState(false);

  const launchPayment = useCallback(
    (paymentSessionId: string, orderId: string, environment: string) => {
      setIsProcessing(true);
      router.push({
        pathname: '/payment-checkout',
        params: {
          mode: 'order',
          sessionId: paymentSessionId,
          orderId,
          environment: environment === 'production' ? 'production' : 'sandbox',
        },
      } as any);
      // The modal handles success/failure/cancel and navigates the user
      // back to the appropriate screen; clear isProcessing on next mount.
      setTimeout(() => setIsProcessing(false), 500);
    },
    [],
  );

  const launchSipMandate = useCallback(
    (subscriptionSessionId: string, subscriptionId: string, environment: string) => {
      setIsProcessing(true);
      router.push({
        pathname: '/payment-checkout',
        params: {
          mode: 'subscription',
          sessionId: subscriptionSessionId,
          orderId: subscriptionId,
          environment: environment === 'production' ? 'production' : 'sandbox',
        },
      } as any);
      setTimeout(() => setIsProcessing(false), 500);
    },
    [],
  );

  return {
    launchPayment,
    launchSipMandate,
    isProcessing,
  };
}
