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

export default function TestimonialScreen() {
  const user = useAuthStore((s) => s.user);
  const selectedAccountId = useAuthStore((s) => s.selectedAccountId);

  const [story, setStory] = useState('');
  const [storyError, setStoryError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const accountCode = selectedAccountId ?? user?.accountCodes?.[0] ?? '';
  const clientId = user?.clientId ?? '';
  const userEmail = user?.email ?? '';

  const mutation = useMutation({
    mutationFn: () =>
      engagementApi.sendEmail({
        to: 'investor.relations@qodeinvest.com',
        subject: `New Testimonial Submission from ${accountCode}`,
        html: `<p>Story: ${story}</p><p>Account: ${accountCode}</p><p>Email: ${userEmail}</p>`,
        inquiry_type: 'testimonial',
        nuvama_code: accountCode,
        client_id: clientId,
        user_email: userEmail,
        inquirySpecificData: {
          'Your testimonial story': story,
        },
      }),
    onSuccess: () => {
      setSubmitted(true);
      setStory('');
      setStoryError('');
    },
    onError: () => {
      Alert.alert('Something went wrong', 'Please try again.');
    },
  });

  const handleSubmit = () => {
    if (!story.trim()) {
      setStoryError('Please share your testimonial before submitting.');
      return;
    }
    setStoryError('');
    mutation.mutate();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Write a Testimonial</Text>
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
                <Ionicons name="heart" size={48} color={Colors.positive} />
              </View>
              <Text style={styles.thankYouTitle}>Thank You!</Text>
              <Text style={styles.thankYouText}>
                Your testimonial means a lot to us. We may feature it (with your permission) to help
                others learn about Qode.
              </Text>
              <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
                <Text style={styles.doneBtnText}>Back to Engage</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              {/* Prompt banner */}
              <View style={styles.promptCard}>
                <Text style={styles.promptQuote}>"</Text>
                <Text style={styles.promptText}>
                  How has Qode impacted your investment journey? Share your experience — your story
                  can inspire others.
                </Text>
              </View>

              {/* Story input */}
              <View style={styles.card}>
                <Text style={styles.fieldLabel}>Your testimonial story</Text>
                <TextInput
                  style={[styles.textarea, storyError ? styles.textareaError : null]}
                  value={story}
                  onChangeText={(t) => {
                    setStory(t);
                    if (storyError) setStoryError('');
                  }}
                  placeholder="Tell us about your experience with Qode — your goals, what you've seen, how our team has supported you..."
                  placeholderTextColor={Colors.textSecondary}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                  maxLength={2000}
                />
                <View style={styles.textareaFooter}>
                  {storyError ? (
                    <Text style={styles.errorText}>{storyError}</Text>
                  ) : (
                    <View />
                  )}
                  <Text style={styles.charCount}>{story.length}/2000</Text>
                </View>
              </View>

              {/* Consent note */}
              <View style={styles.consentNote}>
                <Ionicons name="information-circle-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.consentText}>
                  By submitting, you consent to Qode using your testimonial in marketing materials.
                  Your account details will not be shared publicly.
                </Text>
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
                  <>
                    <Ionicons name="send-outline" size={16} color={Colors.white} />
                    <Text style={styles.submitBtnText}>Submit Testimonial</Text>
                  </>
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
  form: { gap: 14 },
  promptCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  promptQuote: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 40,
    color: Colors.accentGold,
    lineHeight: 36,
    marginTop: -4,
  },
  promptText: {
    ...Typography.Body,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 10,
    ...cardShadow,
  },
  fieldLabel: {
    ...Typography.Body,
    color: Colors.textPrimary,
    fontFamily: 'Inter_500Medium',
  },
  textarea: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    ...Typography.Body,
    color: Colors.textPrimary,
    minHeight: 180,
  },
  textareaError: { borderColor: Colors.negative },
  textareaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: { ...Typography.Caption, color: Colors.negative },
  charCount: { ...Typography.Caption, color: Colors.textSecondary },
  consentNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 4,
  },
  consentText: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 15,
  },
  submitBtn: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 10,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
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
