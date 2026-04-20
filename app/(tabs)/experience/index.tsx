import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';

const GUIDE_SECTIONS = [
  {
    icon: 'pie-chart-outline' as const,
    title: 'Portfolio Overview',
    desc: 'View your total portfolio value, returns, and performance across all strategies.',
    route: '/(tabs)/portfolio',
  },
  {
    icon: 'swap-horizontal-outline' as const,
    title: 'Account Services',
    desc: 'Add funds, switch strategies, and view transaction history.',
    route: '/(tabs)/experience/services',
  },
  {
    icon: 'document-text-outline' as const,
    title: 'Document Vault',
    desc: 'Access all your PMS agreements, statements, and tax documents.',
    route: '/(tabs)/docs',
  },
  {
    icon: 'chatbubbles-outline' as const,
    title: 'Investor Engagement',
    desc: 'Stay connected through newsletters, events, and our referral program.',
    route: '/(tabs)/engagement',
  },
  {
    icon: 'people-outline' as const,
    title: 'Family Account',
    desc: 'View family group structure, account mapping, and raise requests.',
    route: '/(tabs)/experience/family',
  },
  {
    icon: 'business-outline' as const,
    title: 'Bank Details',
    desc: 'NEFT/RTGS transfer details for adding funds to your account.',
    route: '/(tabs)/experience/bank-details',
  },
  {
    icon: 'people-circle-outline' as const,
    title: 'Your Team at Qode',
    desc: 'Contact fund managers and IR team directly.',
    route: '/(tabs)/experience/team',
  },
  {
    icon: 'desktop-outline' as const,
    title: 'Investor Portal Guide',
    desc: 'WealthSpectrum portal guide, snapshots and video tutorials.',
    route: '/(tabs)/experience/portal-guide',
  },
];

export default function ExperienceIndexScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Experience</Text>
          <Text style={styles.subtitle}>
            Everything you need to manage and monitor your Qode investment
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionLabel}>QUICK NAVIGATION</Text>
          {GUIDE_SECTIONS.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={styles.guideCard}
              onPress={() => router.push(s.route as any)}
              activeOpacity={0.8}
            >
              <View style={styles.guideIconBox}>
                <Ionicons name={s.icon} size={20} color={Colors.primaryDark} />
              </View>
              <View style={styles.guideText}>
                <Text style={styles.guideTitle}>{s.title}</Text>
                <Text style={styles.guideDesc}>{s.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          ))}

          {/* Getting Started */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Getting Started Tips</Text>
            {[
              'Set your default strategy in Portfolio → top-right dropdown',
              'Pull down on any screen to refresh live data',
              'Use the Docs tab to download your quarterly statements',
              'Book a call with our IR team anytime from the About tab',
            ].map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <View style={styles.tipNum}>
                  <Text style={styles.tipNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
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
  banner: {
    backgroundColor: Colors.primaryDark,
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  bannerTitle: { ...Typography.H2, color: Colors.white, marginBottom: 6 },
  bannerText: { ...Typography.BodySmall, color: 'rgba(255,255,255,0.85)', lineHeight: 19 },
  content: { paddingHorizontal: 16, paddingBottom: 32, gap: 16 },
  sectionLabel: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
    marginBottom: -8,
  },
  guideCard: {
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
  guideIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideText: { flex: 1 },
  guideTitle: { ...Typography.H3, color: Colors.textPrimary },
  guideDesc: { ...Typography.Caption, color: Colors.textSecondary, marginTop: 3, lineHeight: 15 },
  tipsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 12,
    ...cardShadow,
  },
  tipsTitle: { ...Typography.H3, color: Colors.textPrimary, marginBottom: 4 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tipNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipNumText: { ...Typography.Caption, color: Colors.white, fontFamily: 'Inter_700Bold' },
  tipText: { ...Typography.BodySmall, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
});
