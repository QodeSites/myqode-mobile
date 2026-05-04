import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';
import { engagementApi, ReferralPayload } from '@/api/engagement';
import { useAuthStore } from '@/store/authStore';

const HOW_IT_WORKS = [
  {
    num: 1,
    title: 'Share the Referral',
    desc: 'Submit your referral with contact details. We reach out within 2 business days.',
  },
  {
    num: 2,
    title: 'Referee Onboards',
    desc: 'Your referral completes onboarding and makes their first investment with Qode.',
  },
  {
    num: 3,
    title: 'You Get Rewarded',
    desc: 'Once the investment is confirmed, your referral reward is processed within 30 days.',
  },
];

const DETAILS = [
  { label: 'Reward', value: '0.5% of the referred amount invested (subject to minimum ₹5,000)' },
  {
    label: 'Example',
    value: 'Referee invests ₹50L → You earn ₹25,000',
    highlight: true,
  },
  { label: 'Eligibility', value: 'Existing Qode PMS clients who are KYC-compliant' },
  { label: 'Payout', value: '30 business days after referee investment is confirmed', bold: true },
  { label: 'Tax Note', value: 'Referral rewards are subject to applicable TDS as per income tax rules' },
];

/** Indian mobile: optional +91 prefix, then 10 digits starting with 6-9 */
const PHONE_REGEX = /^(\+91[\s-]?)?[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  name?: string;
  phone?: string;
  email?: string;
}

export default function ReferralScreen() {
  const user = useAuthStore((s) => s.user);
  const selectedAccountId = useAuthStore((s) => s.selectedAccountId);
  const accountId = selectedAccountId ?? user?.accountCodes?.[0] ?? '';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const referralMutation = useMutation({
    mutationFn: (payload: ReferralPayload) => engagementApi.submitReferral(payload),
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to submit referral. Please try again or contact our IR team.');
    },
  });

  function validate(): boolean {
    const newErrors: FieldErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required.';
    }

    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (!cleanPhone) {
      newErrors.phone = 'Phone number is required.';
    } else if (!PHONE_REGEX.test(cleanPhone)) {
      newErrors.phone = 'Enter a valid 10-digit Indian mobile number.';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      newErrors.email = 'Enter a valid email address.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = () => {
    if (!validate()) return;
    referralMutation.mutate({
      accountId,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      description: relationship.trim() || undefined,
    });
  };

  const handleReset = () => {
    setName('');
    setPhone('');
    setEmail('');
    setRelationship('');
    setErrors({});
    setSubmitted(false);
    referralMutation.reset();
  };

  // ── Success screen ───────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Referral Program</Text>
          <Text style={styles.subtitle}>Refer a friend, earn rewards together</Text>
        </View>
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={44} color={Colors.accentGreen} />
          </View>
          <Text style={styles.successTitle}>Referral Submitted!</Text>
          <Text style={styles.successBody}>
            Thank you for referring{name ? ` ${name}` : ''}. Our IR team will reach out to your
            contact within 2 business days.
          </Text>
          <View style={styles.successCard}>
            <Text style={styles.successCardLabel}>What happens next?</Text>
            <View style={styles.successStepRow}>
              <Ionicons name="mail-outline" size={16} color={Colors.accentGreen} />
              <Text style={styles.successStepText}>Your contact will receive a call / email from our IR team.</Text>
            </View>
            <View style={styles.successStepRow}>
              <Ionicons name="person-add-outline" size={16} color={Colors.accentGreen} />
              <Text style={styles.successStepText}>Once they invest, your reward will be credited within 30 business days.</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.backBtn} onPress={handleReset} activeOpacity={0.85}>
            <Text style={styles.backBtnText}>Refer Someone Else</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main form ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Referral Program</Text>
            <Text style={styles.subtitle}>Refer a friend, earn rewards together</Text>
          </View>

          {/* Gift icon hero */}
          <View style={styles.heroSection}>
            <View style={styles.giftCircle}>
              <Ionicons name="gift-outline" size={40} color={Colors.accentGold} />
            </View>
            <Text style={styles.heroTitle}>Grow Together with Qode</Text>
            <Text style={styles.heroSubtitle}>
              Introduce someone to evidence-based investing and earn a reward when they invest.
            </Text>
          </View>

          <View style={styles.content}>
            {/* Program Details */}
            <View style={styles.detailsCard}>
              <Text style={styles.cardTitle}>Program Details</Text>
              {DETAILS.map((d, i) => (
                <View
                  key={i}
                  style={[
                    styles.detailRow,
                    d.highlight && styles.highlightRow,
                    i === DETAILS.length - 1 && styles.lastRow,
                  ]}
                >
                  <Text style={styles.detailLabel}>{d.label}</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      d.highlight && styles.highlightValue,
                      d.bold && styles.boldValue,
                    ]}
                  >
                    {d.value}
                  </Text>
                </View>
              ))}
            </View>

            {/* How It Works */}
            <View style={styles.howCard}>
              <Text style={styles.cardTitle}>How It Works</Text>
              {HOW_IT_WORKS.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>{step.num}</Text>
                  </View>
                  <View style={styles.stepTextBlock}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepDesc}>{step.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Referral Form */}
            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>Submit a Referral</Text>
              <Text style={styles.formSubtitle}>
                Fill in your contact's details and we'll take care of the rest.
              </Text>

              <FormField
                label="Referee's Full Name *"
                value={name}
                onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: undefined })); }}
                placeholder="John Doe"
                autoCapitalize="words"
                error={errors.name}
              />
              <FormField
                label="Phone Number *"
                value={phone}
                onChangeText={(t) => { setPhone(t); setErrors((e) => ({ ...e, phone: undefined })); }}
                placeholder="+91 98765 43210"
                keyboardType="phone-pad"
                error={errors.phone}
              />
              <FormField
                label="Email Address *"
                value={email}
                onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined })); }}
                placeholder="john@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
              />
              <FormField
                label="Your Relationship"
                value={relationship}
                onChangeText={setRelationship}
                placeholder="e.g. Friend, Colleague, Family"
                autoCapitalize="words"
              />

              {referralMutation.isError && (
                <Text style={styles.errorText}>Submission failed. Please try again.</Text>
              )}

              <TouchableOpacity
                style={[styles.submitBtn, referralMutation.isPending && styles.disabledBtn]}
                onPress={handleSubmit}
                disabled={referralMutation.isPending}
                activeOpacity={0.85}
              >
                <Ionicons name="send-outline" size={16} color={Colors.white} style={styles.btnIcon} />
                <Text style={styles.submitBtnText}>
                  {referralMutation.isPending ? 'Submitting...' : 'Submit Referral'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.disclaimerText}>
                By submitting, you confirm you have the contact's consent to share their details with Qode Advisors LLP.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: any;
  autoCapitalize?: any;
  error?: string;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, !!error && styles.fieldInputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textSecondary}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
      />
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  title: { ...Typography.H1, color: Colors.textPrimary },
  subtitle: { ...Typography.BodySmall, color: Colors.textSecondary, marginTop: 4 },

  // ── Success screen ──────────────────────────────────────────────────────────
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  successIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: `${Colors.accentGreen}18`,
    borderWidth: 2,
    borderColor: `${Colors.accentGreen}40`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  successTitle: {
    ...Typography.H1,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  successBody: {
    ...Typography.Body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  successCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 10,
    width: '100%',
    ...cardShadow,
  },
  successCardLabel: {
    ...Typography.BodySmall,
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  successStepRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  successStepText: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  backBtn: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 8,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  backBtnText: { ...Typography.ButtonLabel, color: Colors.white },

  // ── Form ────────────────────────────────────────────────────────────────────
  heroSection: {
    backgroundColor: Colors.primaryDark,
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  giftCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(196,162,74,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(196,162,74,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: { ...Typography.H2, color: Colors.white, textAlign: 'center' },
  heroSubtitle: {
    ...Typography.BodySmall,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  content: { padding: 16, gap: 16 },
  detailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  cardTitle: {
    ...Typography.H3,
    color: Colors.textPrimary,
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 4,
  },
  highlightRow: {
    backgroundColor: `${Colors.accentGreen}15`,
  },
  lastRow: { borderBottomWidth: 0 },
  detailLabel: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    ...Typography.BodySmall,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  highlightValue: {
    color: Colors.accentGreen,
    fontFamily: 'Inter_600SemiBold',
  },
  boldValue: {
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  howCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 14,
    ...cardShadow,
  },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  stepBadgeText: {
    ...Typography.BodySmall,
    color: Colors.white,
    fontFamily: 'Inter_700Bold',
  },
  stepTextBlock: { flex: 1, gap: 4 },
  stepTitle: { ...Typography.H3, color: Colors.textPrimary },
  stepDesc: { ...Typography.BodySmall, color: Colors.textSecondary, lineHeight: 18 },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 12,
    ...cardShadow,
  },
  formSubtitle: { ...Typography.BodySmall, color: Colors.textSecondary },
  fieldGroup: { gap: 5 },
  fieldLabel: { ...Typography.BodySmall, color: Colors.textPrimary, fontFamily: 'Inter_500Medium' },
  fieldInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 46,
    paddingHorizontal: 12,
    ...Typography.Body,
    color: Colors.textPrimary,
  },
  fieldInputError: {
    borderColor: Colors.negative,
  },
  fieldError: {
    ...Typography.Caption,
    color: Colors.negative,
  },
  errorText: {
    ...Typography.BodySmall,
    color: Colors.negative,
    textAlign: 'center',
  },
  submitBtn: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 8,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  disabledBtn: { opacity: 0.6 },
  btnIcon: {},
  submitBtnText: { ...Typography.ButtonLabel, color: Colors.white },
  disclaimerText: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
  },
});
