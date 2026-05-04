import React, { useState } from 'react';
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
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { authApi } from '@/api/auth';
import { isSmallDevice, hp } from '@/constants/Responsive';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your email address.');
      return;
    }
    setError(null);
    setSending(true);
    try {
      await authApi.forgotPassword(trimmed);
      setSent(true);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ??
        err?.message ??
        'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" backgroundColor={Colors.background} />

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

          {/* Card */}
          <View style={styles.card}>
            {sent ? (
              /* ── Success state ── */
              <View style={styles.successWrap}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark" size={28} color={Colors.white} />
                </View>
                <Text style={styles.successTitle}>Check your inbox</Text>
                <Text style={styles.successBody}>
                  If <Text style={styles.emailHighlight}>{email.trim()}</Text> is registered with us, you'll receive a reset link shortly.
                </Text>
                <Text style={styles.spamTip}>
                  The email may take a minute. Also check your spam folder.
                </Text>
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => router.back()}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-back-outline" size={16} color={Colors.white} style={{ marginRight: 6 }} />
                  <Text style={styles.backBtnText}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* ── Input state ── */
              <>
                <Ionicons
                  name="lock-open-outline"
                  size={32}
                  color={Colors.primaryDark}
                  style={styles.cardIcon}
                />
                <Text style={styles.title}>Forgot Password?</Text>
                <Text style={styles.subtitle}>
                  Enter the email address linked to your account and we'll send you a reset link.
                </Text>

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
                  onSubmitEditing={handleSend}
                  autoFocus
                />

                {error && (
                  <Text style={styles.errorText}>{error}</Text>
                )}

                <TouchableOpacity
                  style={[styles.sendBtn, sending && styles.disabledBtn]}
                  onPress={handleSend}
                  disabled={sending}
                  activeOpacity={0.85}
                >
                  {sending ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.sendBtnText}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelLink}
                  onPress={() => router.back()}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelLinkText}>Back to Sign In</Text>
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
  errorText: {
    ...Typography.BodySmall,
    color: Colors.negative,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  sendBtn: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.primaryMid,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  sendBtnText: {
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
    marginBottom: 8,
  },
  emailHighlight: {
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  spamTip: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
    fontStyle: 'italic',
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
