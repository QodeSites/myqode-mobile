// app/payment-checkout.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Mirrors the web checkout flow exactly. Instead of the React Native Cashfree
// SDK (which routes HDFC NetBanking through HDFC's "Now" TPV pipe and fails),
// we render Cashfree's v3 JS SDK (https://sdk.cashfree.com/js/v3/cashfree.js)
// inside a WebView and call cashfree.checkout / cashfree.subscriptionsCheckout —
// the same code the web app at account-services/page.tsx runs.
//
// Cashfree's checkout redirects with `redirectTarget: '_self'`, so we detect
// completion by watching for the WebView navigating to the merchant's
// `/payment/success` or `/payment/sip-success` return URL.
// ─────────────────────────────────────────────────────────────────────────────
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { WebView, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import { paymentsApi } from '@/api/payments';

type Mode = 'order' | 'subscription';

export default function PaymentCheckout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    mode: Mode;
    sessionId: string;
    orderId: string; // for subscription, this is subscriptionId
    environment: string; // 'sandbox' | 'production'
  }>();

  const [ready, setReady] = useState(false);
  const completedRef = useRef(false);

  const html = useMemo(
    () =>
      buildCheckoutHtml({
        mode: params.mode === 'subscription' ? 'subscription' : 'order',
        sessionId: String(params.sessionId ?? ''),
        environment: params.environment === 'production' ? 'production' : 'sandbox',
      }),
    [params.mode, params.sessionId, params.environment],
  );

  // ── Finalisation ───────────────────────────────────────────────────────────
  // Called once when the WebView navigates to the return URL OR the SDK posts
  // a success/error message back. Mirrors the global Cashfree callback that
  // used to live in _layout.tsx — verify the order, invalidate query caches,
  // navigate to the appropriate landing screen.
  const finalize = async (kind: 'success' | 'error', errorMessage?: string) => {
    if (completedRef.current) return;
    completedRef.current = true;

    const isSip = params.mode === 'subscription';
    const id = String(params.orderId ?? '');

    if (kind === 'success') {
      try {
        if (isSip) await paymentsApi.verifySip(id);
        else await paymentsApi.verifyOrder(id);
      } catch {
        // Verify failed — webhook will eventually sync the status.
      }
      queryClient.invalidateQueries({ queryKey: ['payments', 'investment-status'] });
      queryClient.invalidateQueries({ queryKey: ['services', 'transactions'] });
      router.replace(isSip ? ('/(tabs)/invest/sip-management' as any) : ('/(tabs)/invest' as any));
      return;
    }

    Alert.alert(
      isSip ? 'SIP Setup Not Completed' : 'Payment Not Completed',
      errorMessage ??
        (isSip
          ? 'The mandate authorisation was not completed. You can retry from the SIPs screen.'
          : `Your payment for order ${id} was not completed. You can retry from the Invest screen.`),
      [{ text: 'OK' }],
    );
    router.replace(isSip ? ('/(tabs)/invest/sip-management' as any) : ('/(tabs)/invest' as any));
  };

  // ── Watch WebView navigations for the return URL ───────────────────────────
  // When `redirectTarget: '_self'` is used (matches the web flow), the WebView
  // navigates to `${baseUrl}/payment/success...` or `.../payment/sip-success...`
  // once the bank/Cashfree finish. We treat any navigation containing those
  // paths as completion and let `paymentsApi.verifyOrder/verifySip` determine
  // the actual final status from the DB (populated by the webhook).
  const onNavigationStateChange = (nav: WebViewNavigation) => {
    if (completedRef.current) return;
    const url = nav.url ?? '';
    if (url.includes('/payment/success') || url.includes('/payment/sip-success')) {
      finalize('success');
    }
  };

  // The injected JS posts messages on SDK callbacks too (belt-and-braces in
  // case the SDK exposes them despite `_self`).
  const onMessage = (e: WebViewMessageEvent) => {
    let msg: any;
    try { msg = JSON.parse(e.nativeEvent.data); } catch { return; }
    if (msg?.type === 'success') finalize('success');
    else if (msg?.type === 'error')  finalize('error', msg.error?.message);
  };

  // Android hardware back = cancel payment instead of dismissing the modal
  // mid-payment without verifying.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!completedRef.current) {
        finalize('error', 'Payment cancelled.');
        return true;
      }
      return false;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WebView
        source={{ html, baseUrl: 'https://sdk.cashfree.com' }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        setSupportMultipleWindows={false}
        onMessage={onMessage}
        onNavigationStateChange={onNavigationStateChange}
        onLoadEnd={() => setReady(true)}
        style={{ flex: 1, opacity: ready ? 1 : 0 }}
      />
      {!ready && (
        <View style={styles.spinner}>
          <ActivityIndicator size="large" color="#1A3D2B" />
        </View>
      )}
    </SafeAreaView>
  );
}

// ── HTML bundled into the WebView ────────────────────────────────────────────
// This is the EXACT pattern the web app uses (account-services/page.tsx ~L689,
// ~L876): load https://sdk.cashfree.com/js/v3/cashfree.js, init with mode,
// call .checkout / .subscriptionsCheckout with redirectTarget: '_self'.
function buildCheckoutHtml(p: {
  mode: Mode;
  sessionId: string;
  environment: 'sandbox' | 'production';
}): string {
  const launch =
    p.mode === 'subscription'
      ? `cashfree.subscriptionsCheckout({ subsSessionId: ${JSON.stringify(p.sessionId)}, redirectTarget: '_self' })`
      : `cashfree.checkout({ paymentSessionId: ${JSON.stringify(p.sessionId)}, redirectTarget: '_self' })`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>html,body{margin:0;padding:0;height:100%;background:#fff;-webkit-tap-highlight-color:transparent}</style>
</head>
<body>
  <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
  <script>
    (function () {
      function post(payload) {
        try {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify(payload));
          }
        } catch (_) {}
      }
      try {
        var cashfree = Cashfree({ mode: ${JSON.stringify(p.environment)} });
        var result = ${launch};
        if (result && typeof result.then === 'function') {
          result.then(function (r) {
            if (r && r.error) post({ type: 'error', error: r.error });
            else if (r && !r.redirect) post({ type: 'success' });
          }).catch(function (e) {
            post({ type: 'error', error: { message: String(e && e.message ? e.message : e) } });
          });
        }
      } catch (e) {
        post({ type: 'error', error: { message: String(e && e.message ? e.message : e) } });
      }
    })();
  </script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  spinner: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});
