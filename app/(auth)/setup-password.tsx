import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { authApi } from '@/api/auth';
import { isSmallDevice, hp } from '@/constants/Responsive';

type Step = 'email' | 'otp' | 'password';

const RESEND_SECONDS = 60;

// Password strength rules — mirrors the server-side validation.
const RULES: { key: string; label: string; test: (p: string) => boolean }[] = [
  { key: 'len', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { key: 'upper', label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { key: 'lower', label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { key: 'num', label: 'One number', test: (p) => /\d/.test(p) },
  { key: 'special', label: 'One special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

function extractError(err: any, fallback: string): string {
  return err?.response?.data?.error ?? err?.response?.data?.message ?? err?.message ?? fallback;
}

export default function SetupPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState((params.email ?? '').trim());
  const [clientName, setClientName] = useState<string | null>(null);

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Resend cooldown timer
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = () => {
    setSecondsLeft(RESEND_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  // ── Step 1: send OTP ──
  const handleSendOtp = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your email address.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.sendSetupOtp(trimmed);
      if (res.clientname) setClientName(res.clientname);
      setStep('otp');
      startCooldown();
    } catch (err: any) {
      setError(extractError(err, 'Could not send the verification code. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0) return;
    setError(null);
    setLoading(true);
    try {
      await authApi.sendSetupOtp(email.trim());
      startCooldown();
    } catch (err: any) {
      setError(extractError(err, 'Could not resend the code. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP ──
  const handleVerifyOtp = async () => {
    if (otp.trim().length !== 6) {
      setError('Enter the 6-digit code sent to your email.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.verifySetupOtp(email.trim(), otp.trim());
      if (res.clientname) setClientName(res.clientname);
      setStep('password');
    } catch (err: any) {
      setError(extractError(err, 'Invalid or expired code. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: set password ──
  const passwordValid = RULES.every((r) => r.test(newPassword));

  const handleComplete = async () => {
    if (!passwordValid) {
      setError('Please choose a password that meets all the requirements.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await authApi.completeSetup(email.trim(), otp.trim(), newPassword, confirmPassword);
      setDone(true);
    } catch (err: any) {
      setError(extractError(err, 'Could not set your password. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const subtitleForStep =
    step === 'email'
      ? "Enter the email linked to your account and we'll send you a verification code."
      : step === 'otp'
      ? `Enter the 6-digit code we sent to ${email.trim()}.`
      : clientName
      ? `Welcome, ${clientName}. Create a password for your account.`
      : 'Create a password for your account.';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoWrap}>
            <Text style={styles.logoMy}>my</Text>
            <Text style={styles.logoQode}>Qode</Text>
          </View>

          <View style={styles.card}>
            {done ? (
              /* ── Success state ── */
              <View style={styles.successWrap}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark" size={28} color={Colors.white} />
                </View>
                <Text style={styles.successTitle}>Password set</Text>
                <Text style={styles.successBody}>
                  Your password has been created. You can now sign in with your new password.
                </Text>
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => router.replace('/(auth)/login')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="arrow-back-outline" size={16} color={Colors.white} style={{ marginRight: 6 }} />
                  <Text style={styles.backBtnText}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Ionicons name="key-outline" size={32} color={Colors.primaryDark} style={styles.cardIcon} />
                <Text style={styles.title}>Set Up Password</Text>
                <Text style={styles.subtitle}>{subtitleForStep}</Text>

                {/* Step 1 — email */}
                {step === 'email' && (
                  <>
                    <Text style={styles.inputLabel}>Email Address</Text>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={(v) => {
                        setEmail(v);
                        if (error) setError(null);
                      }}
                      placeholder="you@example.com"
                      placeholderTextColor={Colors.textSecondary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="send"
                      onSubmitEditing={handleSendOtp}
                      autoFocus={!params.email}
                    />
                  </>
                )}

                {/* Step 2 — OTP */}
                {step === 'otp' && (
                  <>
                    <Text style={styles.inputLabel}>Verification Code</Text>
                    <TextInput
                      style={[styles.input, styles.otpInput]}
                      value={otp}
                      onChangeText={(v) => {
                        setOtp(v.replace(/[^0-9]/g, '').slice(0, 6));
                        if (error) setError(null);
                      }}
                      placeholder="000000"
                      placeholderTextColor={Colors.textSecondary}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      maxLength={6}
                      onSubmitEditing={handleVerifyOtp}
                      autoFocus
                    />
                    <TouchableOpacity
                      style={styles.resendRow}
                      onPress={handleResend}
                      disabled={secondsLeft > 0 || loading}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.resendText, secondsLeft > 0 && styles.resendDisabled]}>
                        {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : 'Resend code'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* Step 3 — password */}
                {step === 'password' && (
                  <>
                    <Text style={styles.inputLabel}>New Password</Text>
                    <View style={styles.passwordRow}>
                      <TextInput
                        style={[styles.input, styles.passwordInput]}
                        value={newPassword}
                        onChangeText={(v) => {
                          setNewPassword(v);
                          if (error) setError(null);
                        }}
                        placeholder="••••••••"
                        placeholderTextColor={Colors.textSecondary}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="next"
                      />
                      <TouchableOpacity
                        style={styles.eyeBtn}
                        onPress={() => setShowPassword((v) => !v)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                          color={Colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>

                    <Text style={[styles.inputLabel, { marginTop: 14 }]}>Confirm Password</Text>
                    <View style={styles.passwordRow}>
                      <TextInput
                        style={[styles.input, styles.passwordInput]}
                        value={confirmPassword}
                        onChangeText={(v) => {
                          setConfirmPassword(v);
                          if (error) setError(null);
                        }}
                        placeholder="••••••••"
                        placeholderTextColor={Colors.textSecondary}
                        secureTextEntry={!showConfirm}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="done"
                        onSubmitEditing={handleComplete}
                      />
                      <TouchableOpacity
                        style={styles.eyeBtn}
                        onPress={() => setShowConfirm((v) => !v)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                          color={Colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Strength checklist */}
                    <View style={styles.rules}>
                      {RULES.map((r) => {
                        const ok = r.test(newPassword);
                        return (
                          <View key={r.key} style={styles.ruleRow}>
                            <Ionicons
                              name={ok ? 'checkmark-circle' : 'ellipse-outline'}
                              size={14}
                              color={ok ? Colors.positive : Colors.textSecondary}
                            />
                            <Text style={[styles.ruleText, ok && styles.ruleTextOk]}>{r.label}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </>
                )}

                {error && <Text style={styles.errorText}>{error}</Text>}

                {/* Primary action button per step */}
                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.disabledBtn]}
                  onPress={
                    step === 'email'
                      ? handleSendOtp
                      : step === 'otp'
                      ? handleVerifyOtp
                      : handleComplete
                  }
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.primaryBtnText}>
                      {step === 'email' ? 'Send Code' : step === 'otp' ? 'Verify Code' : 'Set Password'}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelLink}
                  onPress={() => {
                    if (step === 'otp') {
                      setStep('email');
                      setOtp('');
                      setError(null);
                    } else if (step === 'password') {
                      setStep('otp');
                      setError(null);
                    } else {
                      router.back();
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelLinkText}>
                    {step === 'email' ? 'Back to Sign In' : 'Back'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <Text style={styles.footer}>
            © 2025 Qode Advisors LLP | SEBI Registered PMS No: INP000008914 | All Rights Reserved
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: isSmallDevice ? 20 : 28,
    paddingVertical: isSmallDevice ? hp(4) : hp(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: isSmallDevice ? 24 : 40,
  },
  logoMy: {
    fontSize: isSmallDevice ? 15 : 18,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: Colors.primaryDark,
    marginRight: 1,
  },
  logoQode: {
    fontSize: isSmallDevice ? 34 : 42,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: Colors.primaryDark,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: isSmallDevice ? 18 : 24,
    paddingVertical: isSmallDevice ? 24 : 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 32,
  },
  cardIcon: {
    marginBottom: 12,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.Body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputLabel: {
    ...Typography.BodySmall,
    color: Colors.textPrimary,
    fontFamily: 'Inter_500Medium',
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 48,
    paddingHorizontal: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  otpInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
  },
  passwordRow: {
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    height: 48,
    justifyContent: 'center',
  },
  resendRow: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 4,
  },
  resendText: {
    ...Typography.BodySmall,
    color: Colors.primaryDark,
    fontFamily: 'Inter_600SemiBold',
  },
  resendDisabled: {
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  rules: {
    width: '100%',
    marginTop: 14,
    gap: 6,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ruleText: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
  },
  ruleTextOk: {
    color: Colors.textPrimary,
  },
  errorText: {
    ...Typography.BodySmall,
    color: Colors.negative,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.primaryMid,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  primaryBtnText: {
    ...Typography.Body,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.white,
    fontSize: 14,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  cancelLink: {
    marginTop: 16,
    paddingVertical: 6,
  },
  cancelLinkText: {
    ...Typography.Body,
    color: Colors.textSecondary,
  },

  // Success state
  successWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.positive,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  successBody: {
    ...Typography.Body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryDark,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.white,
  },

  footer: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
