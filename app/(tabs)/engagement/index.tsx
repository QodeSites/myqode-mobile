import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';

const NAV_ITEMS = [
  { label: 'Insights',    icon: 'newspaper-outline',    route: '/(tabs)/engagement/insights' },
  { label: 'Referrals',   icon: 'people-outline',       route: '/(tabs)/engagement/referral' },
  { label: 'Testimonial', icon: 'star-outline',         route: '/(tabs)/engagement/testimonial' },
] as const;

const CTA_ITEMS = [
  {
    title: 'Share Your Experience',
    subtitle: 'Rate your Qode experience across key areas',
    icon: 'chatbubble-ellipses-outline',
    route: '/(tabs)/engagement/feedback',
    accent: Colors.accentGreen,
  },
  {
    title: 'Write a Testimonial',
    subtitle: 'Share your investment journey with Qode',
    icon: 'star-outline',
    route: '/(tabs)/engagement/testimonial',
    accent: Colors.accentGold,
  },
  {
    title: 'Refer a Friend',
    subtitle: 'Earn rewards for every successful referral',
    icon: 'people-outline',
    route: '/(tabs)/engagement/referral',
    accent: Colors.primaryMid,
  },
] as const;

export default function YourVoiceScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Voice Matters</Text>
          <Text style={styles.subtitle}>Insights, feedback, and stay connected with Qode</Text>
        </View>

        <View style={styles.content}>
          {/* Quick nav */}
          <View style={styles.quickNav}>
            {NAV_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.quickNavBtn}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.75}
              >
                <Ionicons name={item.icon as any} size={20} color={Colors.primaryDark} />
                <Text style={styles.quickNavText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* CTA cards */}
          <Text style={styles.sectionLabel}>Get Involved</Text>
          {CTA_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={styles.ctaCard}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.85}
            >
              <View style={[styles.ctaIconBox, { backgroundColor: item.accent + '18' }]}>
                <Ionicons name={item.icon as any} size={22} color={item.accent} />
              </View>
              <View style={styles.ctaBody}>
                <Text style={styles.ctaTitle}>{item.title}</Text>
                <Text style={styles.ctaSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          ))}
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
  content: { padding: 16, gap: 14 },
  quickNav: { flexDirection: 'row', gap: 10 },
  quickNavBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 6,
    ...cardShadow,
  },
  quickNavText: {
    ...Typography.Caption,
    color: Colors.primaryDark,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  sectionLabel: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: -2,
  },
  ctaCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...cardShadow,
  },
  ctaIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaBody: { flex: 1, gap: 2 },
  ctaTitle: { ...Typography.Body, color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
  ctaSubtitle: { ...Typography.Caption, color: Colors.textSecondary, lineHeight: 14 },
});
