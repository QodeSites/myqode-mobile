import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  FlatList,
  Linking,
  Alert,
  StatusBar as RNStatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { router } from 'expo-router';
import { useLogin } from '@/hooks/useAuth';
import { authApi } from '@/api/auth';
import * as Haptics from 'expo-haptics';
import { isSmallDevice, hp } from '@/constants/Responsive';
import { Analytics, EVENTS } from '@/utils/analytics';
import { ENDPOINTS } from '@/constants/Api';
import apiClient from '@/api/client';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(false);
  const [identifierNotFound, setIdentifierNotFound] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const checkingRef = useRef(false);
  const insets = useSafeAreaInsets();

  // ── Dev-only client picker ────────────────────────────────────────────────
  const [devPickerVisible, setDevPickerVisible] = useState(false);
  const [devClients, setDevClients] = useState<{ name: string; email: string; clientCode: string; schemeName: string }[]>([]);
  const [devSearch, setDevSearch] = useState('');
  const [devLoading, setDevLoading] = useState(false);

  const loadDevClients = useCallback(async () => {
    if (devClients.length > 0) return; // already loaded
    setDevLoading(true);
    try {
      const res = await apiClient.get<{ clients: typeof devClients }>(ENDPOINTS.DEV_CLIENTS);
      setDevClients(res.data.clients);
    } catch (e) {
      Alert.alert('Dev', 'Could not load client list. Is the dev server running?');
    } finally {
      setDevLoading(false);
    }
  }, [devClients.length]);

  const handleDevLogin = useCallback(async (email: string) => {
    setDevPickerVisible(false);
    setDevSearch('');
    login.mutate({ email, password: '' });
  }, [login]);

  const devFilteredClients = devSearch.trim()
    ? devClients.filter(c =>
        c.name.toLowerCase().includes(devSearch.toLowerCase()) ||
        c.email.toLowerCase().includes(devSearch.toLowerCase()) ||
        c.clientCode.toLowerCase().includes(devSearch.toLowerCase())
      )
    : devClients;

  // Android: autoFocus inside a Modal is unreliable — manually focus after mount
  useEffect(() => {
    if (modalVisible && Platform.OS === 'android') {
      const t = setTimeout(() => passwordRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [modalVisible]);

  const login = useLogin();

  // Clear stale errors when the user edits the identifier field.
  useEffect(() => {
    if (login.isError) login.reset();
    if (identifierNotFound) setIdentifierNotFound(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identifier]);

  const handleContinue = async () => {
    if (!identifier.trim()) {
      Alert.alert('Required', 'Please enter your email or account ID.');
      return;
    }
    // Ref guard prevents duplicate calls from rapid taps before state re-renders
    if (checkingRef.current) return;
    checkingRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => login.reset(), 0);
    setIdentifierNotFound(false);
    setChecking(true);
    try {
      const { exists } = await authApi.checkIdentifier(identifier.trim());
      if (!exists) {
        setIdentifierNotFound(true);
        return;
      }
      setModalVisible(true);
    } catch {
      // Network error — let them proceed and the password modal will surface it
      setModalVisible(true);
    } finally {
      checkingRef.current = false;
      setChecking(false);
    }
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

  const handleContactIR = (subject = 'Account Access Enquiry') => {
    Linking.openURL(`mailto:investor.relations@qodeinvest.com?subject=${encodeURIComponent(subject)}`);
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
    if (code === 'USER_NOT_FOUND')
      return 'USER_NOT_FOUND'; // sentinel — rendered as a special block below
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
              style={[styles.continueBtn, checking && styles.disabledBtn]}
              onPress={handleContinue}
              disabled={checking}
              activeOpacity={0.85}
            >
              {checking
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.continueBtnText}>Continue</Text>
              }
            </TouchableOpacity>

            {/* DEV: quick client picker — only in development builds */}
            {__DEV__ && (
              <TouchableOpacity
                style={styles.devPickerBtn}
                onPress={() => {
                  setDevPickerVisible(true);
                  loadDevClients();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="code-slash-outline" size={13} color={Colors.accentGold} style={{ marginRight: 5 }} />
                <Text style={styles.devPickerBtnText}>Dev: Pick Client</Text>
              </TouchableOpacity>
            )}

            {/* USER_NOT_FOUND — shown on main card before modal opens */}
            {identifierNotFound && (
              <View style={styles.closedBanner}>
                <Ionicons name="person-remove-outline" size={20} color={Colors.negative} style={{ marginBottom: 6 }} />
                <Text style={styles.closedBannerTitle}>Account Not Found</Text>
                <Text style={styles.closedBannerBody}>
                  No account found for this email or ID. If you believe this is an error, please reach out to our IR team.
                </Text>
                <TouchableOpacity onPress={() => handleContactIR('Account Access Enquiry')} style={styles.contactBtn} activeOpacity={0.8}>
                  <Ionicons name="mail-outline" size={14} color={Colors.white} />
                  <Text style={styles.contactBtnText}>Contact IR Team</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ACCOUNT_CLOSED — shown on main card (password modal irrelevant) */}
            {loginErrorMessage === 'ACCOUNT_CLOSED' && (
              <View style={styles.closedBanner}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.negative} style={{ marginBottom: 6 }} />
                <Text style={styles.closedBannerTitle}>Account Closed</Text>
                <Text style={styles.closedBannerBody}>
                  Your portfolio account has been closed. If you think this is an error, please reach out to our IR team.
                </Text>
                <TouchableOpacity onPress={() => handleContactIR('Account Closure Enquiry')} style={styles.contactBtn} activeOpacity={0.8}>
                  <Ionicons name="mail-outline" size={14} color={Colors.white} />
                  <Text style={styles.contactBtnText}>Contact IR Team</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            © 2025 Qode Advisors LLP | SEBI Registered PMS No: INP000008914 | All Rights Reserved
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* DEV: Client Picker Modal */}
      {__DEV__ && (
        <Modal
          visible={devPickerVisible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setDevPickerVisible(false)}
        >
          <View
            style={[
              styles.devModalContainer,
              Platform.OS === 'android' && { paddingTop: (RNStatusBar.currentHeight ?? 24) + 8 },
            ]}
          >
            {/* Header */}
            <View style={styles.devModalHeader}>
              <View style={styles.devBadgeChip}>
                <Ionicons name="code-slash-outline" size={12} color={Colors.accentGold} />
                <Text style={styles.devBadgeChipText}>DEV</Text>
              </View>
              <Text style={styles.devModalTitle}>Pick a Client</Text>
              <TouchableOpacity onPress={() => { setDevPickerVisible(false); setDevSearch(''); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.devSearchWrap}>
              <Ionicons name="search-outline" size={16} color={Colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.devSearchInput}
                value={devSearch}
                onChangeText={setDevSearch}
                placeholder="Search name, email, or code…"
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
            </View>

            <Text style={styles.devClientCount}>
              {devFilteredClients.length} of {devClients.length} clients
            </Text>

            {/* List */}
            {devLoading ? (
              <ActivityIndicator color={Colors.primaryMid} style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={devFilteredClients}
                keyExtractor={(_, i) => String(i)}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.devClientRow}
                    onPress={() => handleDevLogin(item.email)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.devClientAvatar}>
                      <Text style={styles.devClientAvatarText}>
                        {item.name.trim()[0]?.toUpperCase() ?? '?'}
                      </Text>
                    </View>
                    <View style={styles.devClientInfo}>
                      <Text style={styles.devClientName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.devClientEmail} numberOfLines={1}>{item.email}</Text>
                    </View>
                    <Text style={styles.devClientCode}>{item.clientCode}</Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.devSeparator} />}
              />
            )}
          </View>
        </Modal>
      )}

      {/* Password Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
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
              <TouchableOpacity onPress={() => handleContactIR('Account Closure Enquiry')} style={styles.contactBtn} activeOpacity={0.8}>
                <Ionicons name="mail-outline" size={14} color={Colors.white} />
                <Text style={styles.contactBtnText}>Contact IR Team</Text>
              </TouchableOpacity>
            </View>
          )}
          {loginErrorMessage && loginErrorMessage !== 'ACCOUNT_CLOSED' && loginErrorMessage !== 'USER_NOT_FOUND' && (
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
            style={styles.forgotBtn}
            onPress={() => {
              setModalVisible(false);
              login.reset();
              router.push('/(auth)/forgot-password');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
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
  forgotBtn: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  forgotText: {
    ...Typography.BodySmall,
    color: Colors.primaryMid,
    fontFamily: 'Inter_500Medium',
  },
  cancelBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
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

  // ── Dev picker ──────────────────────────────────────────────────────────
  devPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.accentGold + '60',
    backgroundColor: Colors.accentGold + '12',
  },
  devPickerBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.accentGold,
    letterSpacing: 0.4,
  },
  devModalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  devModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  devBadgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accentGold + '20',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginRight: 10,
  },
  devBadgeChipText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: Colors.accentGold,
    letterSpacing: 0.8,
  },
  devModalTitle: {
    flex: 1,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  devSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 8,
  },
  devSearchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  devClientCount: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginLeft: 2,
  },
  devClientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  devClientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryMid,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  devClientAvatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: Colors.white,
  },
  devClientInfo: {
    flex: 1,
  },
  devClientName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  devClientEmail: {
    ...Typography.Caption,
    color: Colors.textSecondary,
  },
  devClientCode: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: Colors.primaryMid,
    marginLeft: 8,
  },
  devSeparator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 48,
  },
});
