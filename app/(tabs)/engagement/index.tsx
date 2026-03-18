import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';
import { useMutation } from '@tanstack/react-query';
import { engagementApi } from '@/api/engagement';

const RATING_OPTIONS = [1, 2, 3, 4, 5];

export default function YourVoiceScreen() {
  const [rating, setRating] = React.useState(0);
  const [message, setMessage] = React.useState('');

  const feedbackMutation = useMutation({
    mutationFn: engagementApi.submitFeedback,
    onSuccess: () => {
      Alert.alert('Thank You!', 'Your feedback has been submitted.');
      setRating(0);
      setMessage('');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }
    feedbackMutation.mutate({ rating, message });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Voice Matters</Text>
          <Text style={styles.subtitle}>Share feedback and help us serve you better</Text>
        </View>

        <View style={styles.content}>
          {/* Quick nav */}
          <View style={styles.quickNav}>
            <TouchableOpacity style={styles.quickNavBtn} onPress={() => router.push('/(tabs)/engagement/insights')}>
              <Ionicons name="newspaper-outline" size={20} color={Colors.primaryDark} />
              <Text style={styles.quickNavText}>Insights</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickNavBtn} onPress={() => router.push('/(tabs)/engagement/referral')}>
              <Ionicons name="people-outline" size={20} color={Colors.primaryDark} />
              <Text style={styles.quickNavText}>Referrals</Text>
            </TouchableOpacity>
          </View>

          {/* Feedback form */}
          <View style={styles.feedbackCard}>
            <Text style={styles.cardTitle}>Share Your Experience</Text>
            <Text style={styles.cardSubtitle}>How would you rate your Qode experience?</Text>

            {/* Star rating */}
            <View style={styles.starsRow}>
              {RATING_OPTIONS.map((r) => (
                <TouchableOpacity key={r} onPress={() => setRating(r)} style={styles.starBtn}>
                  <Ionicons
                    name={r <= rating ? 'star' : 'star-outline'}
                    size={32}
                    color={r <= rating ? Colors.accentGold : Colors.border}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Message */}
            <TextInput
              style={styles.feedbackInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Tell us what you think (optional)..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitBtn, feedbackMutation.isPending && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={feedbackMutation.isPending}
            >
              <Text style={styles.submitBtnText}>
                {feedbackMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info cards */}
          <View style={styles.infoGrid}>
            <View style={[styles.infoCard, styles.infoCardGreen]}>
              <Ionicons name="mail-outline" size={20} color={Colors.white} />
              <Text style={styles.infoCardTitle}>Newsletter</Text>
              <Text style={styles.infoCardText}>Monthly insights & market views</Text>
            </View>
            <View style={[styles.infoCard, styles.infoCardDark]}>
              <Ionicons name="people-outline" size={20} color={Colors.white} />
              <Text style={styles.infoCardTitle}>Referrals</Text>
              <Text style={styles.infoCardText}>Earn rewards for every successful referral</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  content: { padding: 16, gap: 16 },
  quickNav: {
    flexDirection: 'row',
    gap: 12,
  },
  quickNavBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    ...cardShadow,
  },
  quickNavText: { ...Typography.BodySmall, color: Colors.primaryDark, fontFamily: 'Inter_600SemiBold' },
  feedbackCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 14,
    ...cardShadow,
  },
  cardTitle: { ...Typography.H3, color: Colors.textPrimary },
  cardSubtitle: { ...Typography.BodySmall, color: Colors.textSecondary },
  starsRow: { flexDirection: 'row', gap: 8 },
  starBtn: { padding: 2 },
  feedbackInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    ...Typography.Body,
    color: Colors.textPrimary,
    minHeight: 90,
  },
  submitBtn: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtn: { opacity: 0.6 },
  submitBtnText: { ...Typography.ButtonLabel, color: Colors.white },
  infoGrid: { flexDirection: 'row', gap: 12 },
  infoCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  infoCardGreen: { backgroundColor: Colors.accentGreen },
  infoCardDark: { backgroundColor: Colors.primaryDark },
  infoCardTitle: { ...Typography.H3, color: Colors.white },
  infoCardText: { ...Typography.Caption, color: 'rgba(255,255,255,0.85)', lineHeight: 15 },
});
