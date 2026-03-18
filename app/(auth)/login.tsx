import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useLogin } from '@/hooks/useAuth';
import * as Haptics from 'expo-haptics';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const login = useLogin();

  const handleContinue = () => {
    if (!identifier.trim()) {
      Alert.alert('Required', 'Please enter your email or account ID.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalVisible(true);
  };

  const handleSignIn = async () => {
    if (!password.trim()) {
      Alert.alert('Required', 'Please enter your password.');
      return;
    }
    login.mutate({ email: identifier.trim(), password });
  };

  const handleContactUs = () => {
    Linking.openURL('mailto:invest@qodeinvest.com?subject=New Account Inquiry');
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
              style={styles.continueBtn}
              onPress={handleContinue}
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
            </TouchableOpacity>
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
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.handle} />

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
                autoFocus
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword((v) => !v)}
              >
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {login.isError && (
            <Text style={styles.errorText}>
              {(login.error as any)?.response?.data?.code === 'PASSWORD_SETUP_REQUIRED'
                ? 'Your account is not yet activated. Please contact support to set up your password.'
                : ((login.error as any)?.response?.data?.message ?? 'Invalid credentials. Please try again.')}
            </Text>
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
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 40,
  },
  logoMy: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: Colors.primaryDark,
    marginRight: 1,
  },
  logoQode: {
    fontSize: 42,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: Colors.primaryDark,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 32,
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
    ...Typography.Body,
    color: Colors.textPrimary,
  },
  continueBtn: {
    width: '100%',
    height: 50,
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
    top: 12,
  },
  eyeText: {
    fontSize: 16,
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
});
