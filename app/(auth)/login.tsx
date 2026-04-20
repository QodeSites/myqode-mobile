import React, { useState, useRef, useEffect } from 'react';
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
  Modal,
  Linking,
  Alert,
  StatusBar as RNStatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useLogin } from '@/hooks/useAuth';
import * as Haptics from 'expo-haptics';
import { isSmallDevice, hp } from '@/constants/Responsive';
import { Analytics, EVENTS } from '@/utils/analytics';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  // Android: autoFocus inside a Modal is unreliable — manually focus after mount
  useEffect(() => {
    if (modalVisible && Platform.OS === 'android') {
      const t = setTimeout(() => passwordRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [modalVisible]);

  const login = useLogin();

  // Clear stale error when the user edits the identifier field so the UI
  // doesn't keep showing an old error message after they start re-typing.
  useEffect(() => {
    if (login.isError) login.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identifier]);

  const handleContinue = () => {
    if (!identifier.trim()) {
      Alert.alert('Required', 'Please enter your email or account ID.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Defer reset() off the synchronous event-handler stack.
    // Calling login.reset() synchronously here triggers a react-query state
    // update while reanimated may have a UI frame pending, which races in
    // RuntimeScheduler_Modern::updateRendering() and crashes on both simulator
    // and physical device. A single-tick defer avoids the collision.
    setTimeout(() => login.reset(), 0);

    // DEV MODE: skip the password modal entirely — the backend accepts
    // passwordless logins when NODE_ENV=development (Expo Go / simulator).
    if (__DEV__) {
      login.mutate(
        { email: identifier.trim(), password: '' },
        {
          onSuccess: () => Analytics.event(EVENTS.LOGIN_SUCCESS),
          onError: (err: any) => Analytics.event(EVENTS.LOGIN_FAILED, {
            reason: err?.response?.data?.code ?? err?.message ?? 'unknown',
          }),
        }
      );
      return;
    }

    setModalVisible(true);
  };

  const handleSignIn = async () => {
    if (!password.trim()) {
      Alert.alert('Required', 'Please enter your password.');
      return;
    }
    login.mutate(
      { email: identifier.trim(), password },
      {
        onSuccess: () => Analytics.event(EVENTS.LOGIN_SUCCESS),
        onError: (err: any) => Analytics.event(EVENTS.LOGIN_FAILED, {
          reason: err?.response?.data?.code ?? err?.message ?? 'unknown',
        }),
      }
    );
  };

  const handleContactIR = () => {
    Linking.openURL('mailto:investor.relations@qodeinvest.com?subject=Account Closure Enquiry');
  };

  // Resolve a human-readable message from a login mutation error.
  // The API returns { error: string, code: string } — check `code` first for
  // known cases, then fall back to the `error` field, then a generic string.
  const loginErrorMessage: string | null = (() => {
    if (!login.isError) return null;
    const data = (login.error as any)?.response?.data;
    const code = data?.code as string | undefined;
    if (code === 'PASSWORD_SETUP_REQUIRED')
      return 'Your account password has not been set up yet. Please contact support to activate your account.';
    if (code === 'ACCOUNT_CLOSED')
      return 'ACCOUNT_CLOSED'; // sentinel — rendered as a special block below
    return data?.error ?? data?.message ?? 'Invalid credentials. Please try again.';
  })();

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
            {__DEV__ && (
              <View style={styles.devBadge}>
                <Text style={styles.devBadgeText}>DEV — no password required</Text>
              </View>
            )}
            <Ionicons name="mail-outline" size={32} color={Colors.primaryDark} style={styles.cardIcon} />
            <Text style={styles.welcomeTitle}>Welcome!</Text>

            <Text style={styles.inputLabel}>Email or Account ID</Text>
            <TextInput
              style={styles.input}
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="you@example.com or Account ID"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />

            <TouchableOpacity
              style={[styles.continueBtn, __DEV__ && login.isPending && styles.disabledBtn]}
              onPress={handleContinue}
              disabled={__DEV__ && login.isPending}
              activeOpacity={0.85}
            >
              {__DEV__ && login.isPending
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.continueBtnText}>Continue</Text>
              }
            </TouchableOpacity>

            {/* Error display for dev mode (modal never opens) and ACCOUNT_CLOSED
                which can fire before the password modal even matters */}
            {__DEV__ && loginErrorMessage === 'ACCOUNT_CLOSED' && (
              <View style={styles.closedBanner}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.negative} style={{ marginBottom: 6 }} />
                <Text style={styles.closedBannerTitle}>Account Closed</Text>
                <Text style={styles.closedBannerBody}>
                  Your portfolio account has been closed. If you think this is an error, please reach out to our IR team.
                </Text>
                <TouchableOpacity onPress={handleContactIR} style={styles.contactBtn} activeOpacity={0.8}>
                  <Ionicons name="mail-outline" size={14} color={Colors.white} />
                  <Text style={styles.contactBtnText}>Contact IR Team</Text>
                </TouchableOpacity>
              </View>
            )}
            {__DEV__ && loginErrorMessage && loginErrorMessage !== 'ACCOUNT_CLOSED' && (
              <Text style={[styles.errorText, { marginTop: 12, marginBottom: 0 }]}>
                {loginErrorMessage}
              </Text>
            )}
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            © 2025 Qode Advisors LLP | SEBI Registered PMS No: INP000008914 | All Rights Reserved
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Password Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={[
            styles.modalContainer,
            // Android: account for status bar height since the modal is full-screen
            Platform.OS === 'android' && {
              paddingTop: (RNStatusBar.currentHeight ?? 24) + 16,
            },
          ]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Handle — only meaningful on iOS pageSheet (draggable) */}
          {Platform.OS === 'ios' && <View style={styles.handle} />}

          <Text style={styles.modalTitle}>Sign In</Text>
          <Text style={styles.modalSubtitle}>{identifier}</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.modalInputLabel}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                ref={passwordRef}
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.textSecondary}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
                autoFocus={Platform.OS === 'ios'}
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
          </View>

          {loginErrorMessage === 'ACCOUNT_CLOSED' && (
            <View style={styles.closedBanner}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.negative} style={{ marginBottom: 6 }} />
              <Text style={styles.closedBannerTitle}>Account Closed</Text>
              <Text style={styles.closedBannerBody}>
                Your portfolio account has been closed. If you think this is an error, please reach out to our IR team.
              </Text>
              <TouchableOpacity onPress={handleContactIR} style={styles.contactBtn} activeOpacity={0.8}>
                <Ionicons name="mail-outline" size={14} color={Colors.white} />
                <Text style={styles.contactBtnText}>Contact IR Team</Text>
              </TouchableOpacity>
            </View>
          )}
          {loginErrorMessage && loginErrorMessage !== 'ACCOUNT_CLOSED' && (
            <Text style={styles.errorText}>{loginErrorMessage}</Text>
          )}

          <TouchableOpacity
            style={[styles.modalSignInBtn, login.isPending && styles.disabledBtn]}
            onPress={handleSignIn}
            disabled={login.isPending}
            activeOpacity={0.9}
          >
            {login.isPending ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.modalSignInText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => {
              setModalVisible(false);
              login.reset();
            }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
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
  welcomeTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    color: Colors.textPrimary,
    marginBottom: 24,
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
    // Intentionally omitting lineHeight — Android TextInput does not support it
    // correctly and can cause text clipping. Height is fixed at 48, which is enough.
    color: Colors.textPrimary,
  },
  devBadge: {
    backgroundColor: '#FFF3CD',
    borderColor: '#F0AD4E',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 16,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  devBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#856404',
    letterSpacing: 0.3,
  },
  continueBtn: {
    width: '100%',
    // 52px matches PrimaryButton, OutlinedButton, and the Sign In modal button
    height: 52,
    backgroundColor: Colors.primaryMid,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  continueBtnText: {
    ...Typography.ButtonLabel,
    color: Colors.white,
  },
  footer: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    ...Typography.H1,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    marginBottom: 28,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 18,
  },
  modalInputLabel: {
    ...Typography.BodySmall,
    color: Colors.textPrimary,
    fontFamily: 'Inter_500Medium',
    marginBottom: 6,
  },
  passwordRow: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  errorText: {
    ...Typography.BodySmall,
    color: Colors.negative,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalSignInBtn: {
    backgroundColor: Colors.primaryDark,
    height: 52,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  modalSignInText: {
    ...Typography.ButtonLabel,
    color: Colors.white,
  },
  cancelBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  cancelText: {
    ...Typography.Body,
    color: Colors.textSecondary,
  },

  // Closed-account banner
  closedBanner: {
    marginTop: 16,
    width: '100%',
    backgroundColor: Colors.negative + '12',
    borderWidth: 1,
    borderColor: Colors.negative + '40',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  closedBannerTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.negative,
    marginBottom: 6,
  },
  closedBannerBody: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.negative,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  contactBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.white,
  },
});
