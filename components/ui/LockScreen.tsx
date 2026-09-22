import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';
import { authenticate, getBiometricLabel, BiometricLabel } from '@/utils/biometrics';

type Status = 'idle' | 'authenticating' | 'failed';

/**
 * Full-screen biometric lock shown over the app whenever `isLocked` is true.
 * Auto-prompts Face ID / Touch ID / fingerprint (with device-passcode fallback)
 * on mount and whenever the app returns to the foreground. If the user can't or
 * won't authenticate, they can fall back to signing in with their password.
 */
export function LockScreen() {
  const unlock = useAuthStore((s) => s.unlock);
  const logout = useAuthStore((s) => s.logout);

  const [status, setStatus] = useState<Status>('idle');
  const [label, setLabel] = useState<BiometricLabel>('Biometric');
  const inFlight = useRef(false);

  const runAuth = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus('authenticating');
    const result = await authenticate('Unlock myQode');
    inFlight.current = false;
    if (result.success) {
      unlock();
    } else {
      setStatus('failed');
    }
  }, [unlock]);

  // Resolve the biometric label, then auto-prompt — but only if the app is
  // actually in the foreground (prompting while backgrounded fails immediately).
  useEffect(() => {
    let mounted = true;
    (async () => {
      const l = await getBiometricLabel();
      if (mounted) setLabel(l);
      if (AppState.currentState === 'active') runAuth();
    })();
    return () => {
      mounted = false;
    };
  }, [runAuth]);

  // Re-prompt when the app comes back to the foreground (e.g. it mounted while
  // backgrounded, or the previous prompt was dismissed by the OS).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active' && status === 'idle' && !inFlight.current) {
        runAuth();
      }
    });
    return () => sub.remove();
  }, [status, runAuth]);

  const handleUsePassword = useCallback(async () => {
    try {
      await authApi.clearToken();
    } finally {
      logout();
      router.replace('/(auth)/login');
    }
  }, [logout]);

  const isBusy = status === 'authenticating';

  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <Text style={styles.logoMy}>my</Text>
        <Text style={styles.logoQode}>Qode</Text>
      </View>

      <View style={styles.iconCircle}>
        <Ionicons
          name={label === 'Face ID' ? 'scan-outline' : 'finger-print'}
          size={40}
          color={Colors.white}
        />
      </View>

      <Text style={styles.title}>
        {status === 'failed' ? 'Verification needed' : 'Welcome back'}
      </Text>
      <Text style={styles.subtitle}>
        {status === 'failed'
          ? `Unlock with ${label} to continue, or sign in with your password.`
          : `Unlock with ${label} to view your portfolio.`}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.unlockBtn, isBusy && styles.disabledBtn]}
          onPress={runAuth}
          disabled={isBusy}
          activeOpacity={0.85}
        >
          {isBusy ? (
            <ActivityIndicator color={Colors.primaryDark} />
          ) : (
            <>
              <Ionicons
                name={label === 'Face ID' ? 'scan-outline' : 'finger-print'}
                size={18}
                color={Colors.primaryDark}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.unlockBtnText}>Unlock with {label}</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.passwordBtn} onPress={handleUsePassword} activeOpacity={0.7}>
          <Text style={styles.passwordBtnText}>Sign in with password</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    zIndex: 1000,
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 48,
  },
  logoMy: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: Colors.white,
    marginRight: 1,
    opacity: 0.85,
  },
  logoQode: {
    fontSize: 42,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: Colors.white,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    ...Typography.H1,
    color: Colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.Body,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
  },
  actions: {
    width: '100%',
    alignItems: 'center',
  },
  unlockBtn: {
    flexDirection: 'row',
    width: '100%',
    height: 52,
    backgroundColor: Colors.white,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockBtnText: {
    ...Typography.ButtonLabel,
    color: Colors.primaryDark,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  passwordBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  passwordBtnText: {
    ...Typography.Body,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Inter_500Medium',
  },
});
