import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';
import { engagementApi } from '@/api/engagement';
import { useAuthStore } from '@/store/authStore';

interface RatingFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  error?: string;
}

function RatingField({ label, value, onChange, error }: RatingFieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => onChange(n)}
            activeOpacity={0.7}
            style={[styles.ratingBtn, value === n && styles.ratingBtnActive]}
          >
            <Text style={[styles.ratingBtnText, value === n && styles.ratingBtnTextActive]}>
              {n}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.ratingHints}>
        <Text style={styles.ratingHint}>Not likely</Text>
        <Text style={styles.ratingHint}>Very likely</Text>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export default function FeedbackScreen() {
  const user = useAuthStore((s) => s.user);
  const selectedAccountId = useAuthStore((s) => s.selectedAccountId);

  const [nps, setNps] = useState(0);
  const [satisfaction, setSatisfaction] = useState(0);
  const [clarity, setClarity] = useState(0);
  const [ease, setEase] = useState(0);
  const [improve, setImprove] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const accountCode = selectedAccountId ?? user?.accountCodes?.[0] ?? '';
  const clientId = user?.clientId ?? '';
  const userEmail = user?.email ?? '';

  const mutation = useMutation({
    mutationFn: () =>
      engagementApi.sendEmail({
        to: 'investor.relations@qodeinvest.com',
        subject: `New Feedback Submission from ${accountCode}`,
        html: `<p>NPS: ${nps}/5</p><p>Satisfaction: ${satisfaction}/5</p><p>Clarity: ${clarity}/5</p><p>Ease: ${ease}/5</p><p>Improve: ${improve}</p><p>Account: ${accountCode}</p><p>Email: ${userEmail}</p>`,
        inquiry_type: 'feedback',
        nuvama_code: accountCode,
        client_id: clientId,
        user_email: userEmail,
        inquirySpecificData: {
          'How likely are you to recommend Qode? (1-5)': String(nps),
          'Overall satisfaction with Qode? (1-5)': String(satisfaction),
          'Clarity/usefulness of portfolio updates & review calls? (1-5)': String(clarity),
          'Ease of key processes (onboarding, top-ups, withdrawals)? (1-5)': String(ease),
          'One thing we could do to improve your experience': improve,
        },
      }),
    onSuccess: () => {
      setSubmitted(true);
      setNps(0);
      setSatisfaction(0);
      setClarity(0);
      setEase(0);
      setImprove('');
      setErrors({});
    },
    onError: () => {
      Alert.alert('Something went wrong', 'Please try again.');
    },
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nps) e.nps = 'Please select a rating';
    if (!satisfaction) e.satisfaction = 'Please select a rating';
    if (!clarity) e.clarity = 'Please select a rating';
    if (!ease) e.ease = 'Please select a rating';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    mutation.mutate();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Feedback</Text>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {submitted ? (
            <View style={styles.thankYou}>
              <View style={styles.thankYouIcon}>
                <Ionicons name="checkmark-circle" size={56} color={Colors.positive} />
              </View>
              <Text style={styles.thankYouTitle}>Thank You!</Text>
              <Text style={styles.thankYouText}>
                Your feedback has been submitted. We appreciate you taking the time to help us improve.
              </Text>
              <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
                <Text style={styles.doneBtnText}>Back to Engage</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.introBanner}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.accentGold} />
                <Text style={styles.introText}>
                  Your feedback helps us serve you better. All responses are confidential.
                </Text>
              </View>

              <View style={styles.card}>
                <RatingField
                  label="How likely are you to recommend Qode?"
                  value={nps}
                  onChange={setNps}
                  error={errors.nps}
                />
                <View style={styles.fieldDivider} />
                <RatingField
                  label="Overall satisfaction with Qode?"
                  value={satisfaction}
                  onChange={setSatisfaction}
                  error={errors.satisfaction}
                />
                <View style={styles.fieldDivider} />
                <RatingField
                  label="Clarity & usefulness of portfolio updates and review calls?"
                  value={clarity}
                  onChange={setClarity}
                  error={errors.clarity}
                />
                <View style={styles.fieldDivider} />
                <RatingField
                  label="Ease of key processes — onboarding, top-ups, withdrawals?"
                  value={ease}
                  onChange={setEase}
                  error={errors.ease}
                />
              </View>

              <View style={styles.card}>
                <Text style={styles.fieldLabel}>
                  One thing we could do to improve your experience
                  <Text style={styles.optional}> (optional)</Text>
                </Text>
                <TextInput
                  style={styles.textarea}
                  value={improve}
                  onChangeText={setImprove}
                  placeholder="Share your thoughts..."
                  placeholderTextColor={Colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, mutation.isPending && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={mutation.isPending}
                activeOpacity={0.85}
              >
                {mutation.isPending ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Feedback</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 38, justifyContent: 'center' },
  headerTitle: { ...Typography.H2, color: Colors.textPrimary, flex: 1, textAlign: 'center' },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  introBanner: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  introText: {
    ...Typography.BodySmall,
    color: 'rgba(255,255,255,0.85)',
    flex: 1,
    lineHeight: 17,
  },
  form: { gap: 14 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 16,
    ...cardShadow,
  },
  fieldGroup: { gap: 10 },
  fieldDivider: { height: 1, backgroundColor: Colors.border },
  fieldLabel: {
    ...Typography.Body,
    color: Colors.textPrimary,
    fontFamily: 'Inter_500Medium',
    lineHeight: 18,
  },
  optional: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  ratingRow: { flexDirection: 'row', gap: 8 },
  ratingBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingBtnActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  ratingBtnText: {
    ...Typography.Body,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
  },
  ratingBtnTextActive: { color: Colors.white },
  ratingHints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  ratingHint: { ...Typography.Caption, color: Colors.textSecondary },
  errorText: {
    ...Typography.Caption,
    color: Colors.negative,
    marginTop: -4,
  },
  textarea: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    ...Typography.Body,
    color: Colors.textPrimary,
    minHeight: 100,
    marginTop: 4,
  },
  submitBtn: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 10,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { ...Typography.ButtonLabel, color: Colors.white },
  thankYou: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
    paddingHorizontal: 24,
  },
  thankYouIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thankYouTitle: { ...Typography.H1, color: Colors.textPrimary },
  thankYouText: {
    ...Typography.Body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  doneBtn: {
    marginTop: 8,
    backgroundColor: Colors.primaryDark,
    borderRadius: 10,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  doneBtnText: { ...Typography.ButtonLabel, color: Colors.white },
});
