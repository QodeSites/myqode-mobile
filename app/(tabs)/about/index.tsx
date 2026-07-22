import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';
import { CardContainer } from '@/components/ui/CardContainer';

const PHILOSOPHY_CARDS = [
  {
    title: 'Who We Are',
    body: 'Qode Advisors is a SEBI-registered Portfolio Management Service (PMS) firm focused on evidence-based, data-driven investment strategies. We combine quantitative research with fundamental analysis to generate consistent, risk-adjusted returns for our clients.',
    icon: 'business-outline' as const,
  },
  {
    title: 'What We Do',
    body: 'We manage client portfolios across three distinct strategies — QAW, QTF, and QGF — each designed to capture specific market opportunities. Our approach is disciplined, transparent, and built on decades of historical market data.',
    icon: 'bar-chart-outline' as const,
  },
  {
    title: 'How We Work',
    body: 'Our investment process is entirely rules-based. We use systematic models to identify opportunities, manage risk, and execute trades. This removes emotional bias and ensures consistency across market cycles.',
    icon: 'cog-outline' as const,
  },
  {
    title: 'Why It Matters',
    body: 'In a market full of noise, our evidence-based approach cuts through the clutter. We believe that disciplined, long-term investing — backed by data — is the most reliable path to building lasting wealth.',
    icon: 'heart-outline' as const,
  },
];

const CORE_VALUES = [
  { icon: 'eye-outline' as const, label: 'Transparency' },
  { icon: 'shield-checkmark-outline' as const, label: 'Discipline' },
  { icon: 'trending-up-outline' as const, label: 'Performance' },
  { icon: 'people-outline' as const, label: 'Trust' },
];

export default function PhilosophyScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Qode Philosophy</Text>
          <Text style={styles.subtitle}>
            The principles that guide every investment decision we make
          </Text>
        </View>

        <View style={styles.content}>
          {/* Philosophy cards */}
          {PHILOSOPHY_CARDS.map((card, i) => (
            <CardContainer key={i} style={styles.philosophyCard}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                  <Ionicons name={card.icon} size={20} color={Colors.primaryDark} />
                </View>
                <View style={styles.titleBlock}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <View style={styles.goldAccent} />
                </View>
              </View>
              <Text style={styles.cardBody}>{card.body}</Text>
            </CardContainer>
          ))}

          {/* Core Values */}
          <View style={styles.valuesSection}>
            <Text style={styles.valuesSectionTitle}>Our Core Values</Text>
            <View style={styles.valuesGrid}>
              {CORE_VALUES.map((v, i) => (
                <View key={i} style={styles.valueTile}>
                  <View style={styles.valueTileIcon}>
                    <Ionicons name={v.icon} size={24} color={Colors.primaryDark} />
                  </View>
                  <Text style={styles.valueTileLabel}>{v.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Explore More */}
          <Text style={styles.exploreLabel}>EXPLORE MORE</Text>
          {[
            { icon: 'pie-chart-outline' as const, title: 'Strategy Snapshot', desc: 'Our four evidence-based investment strategies explained.', route: '/(tabs)/about/strategy' },
            { icon: 'school-outline' as const, title: 'Qode Foundation', desc: 'Research papers, investment philosophy, and educational content.', route: '/(tabs)/about/foundation' },
            { icon: 'people-outline' as const, title: 'Meet the Team', desc: 'The fund managers and research team behind Qode.', route: '/(tabs)/about/team' },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.navCard}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.8}
            >
              <View style={styles.navIconBox}>
                <Ionicons name={item.icon} size={20} color={Colors.primaryDark} />
              </View>
              <View style={styles.navText}>
                <Text style={styles.navTitle}>{item.title}</Text>
                <Text style={styles.navDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
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
  subtitle: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  content: { padding: 16, gap: 14 },
  philosophyCard: { gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBlock: { flex: 1 },
  cardTitle: { ...Typography.H3, color: Colors.textPrimary },
  goldAccent: {
    width: 40,
    height: 3,
    backgroundColor: Colors.accentGold,
    borderRadius: 2,
    marginTop: 4,
  },
  cardBody: {
    ...Typography.Body,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  valuesSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    ...cardShadow,
  },
  valuesSectionTitle: { ...Typography.H3, color: Colors.textPrimary, marginBottom: 16 },
  valuesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  valueTile: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  valueTileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  valueTileLabel: {
    ...Typography.BodySmall,
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  exploreLabel: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
    marginBottom: -8,
  },
  navCard: {
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
  navIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navText: { flex: 1 },
  navTitle: { ...Typography.H3, color: Colors.textPrimary },
  navDesc: { ...Typography.Caption, color: Colors.textSecondary, marginTop: 3, lineHeight: 15 },
});
