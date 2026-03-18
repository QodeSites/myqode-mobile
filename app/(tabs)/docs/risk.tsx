import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';

const RISK_FACTORS = [
  {
    icon: 'trending-down-outline' as const,
    title: 'Market Risk',
    desc: 'PMS investments are subject to market fluctuations. The value of your portfolio may decrease due to market-wide events, economic cycles, or sector downturns.',
    level: 'High',
    levelColor: Colors.negative,
  },
  {
    icon: 'water-outline' as const,
    title: 'Liquidity Risk',
    desc: 'Certain securities in the portfolio may be difficult to sell quickly at fair market value, particularly during periods of low trading volume or market stress.',
    level: 'Medium',
    levelColor: '#D97706',
  },
  {
    icon: 'swap-vertical-outline' as const,
    title: 'Concentration Risk',
    desc: 'Focused strategies like QGF hold fewer securities. A negative event affecting any one holding may have a significant impact on portfolio performance.',
    level: 'Medium',
    levelColor: '#D97706',
  },
  {
    icon: 'bar-chart-outline' as const,
    title: 'Strategy Risk',
    desc: 'Quantitative models may underperform in unusual market conditions. Past performance of a strategy does not guarantee future results.',
    level: 'Medium',
    levelColor: '#D97706',
  },
  {
    icon: 'shield-outline' as const,
    title: 'Regulatory Risk',
    desc: 'Changes in SEBI regulations, tax laws, or market structure could impact portfolio strategies or client service capabilities.',
    level: 'Low',
    levelColor: Colors.positive,
  },
];

const MITIGATIONS = [
  'Portfolio-level drawdown limits monitored daily',
  'Diversification across uncorrelated strategies',
  'Regular risk reporting to SEBI and clients',
  'Position sizing rules enforced by systematic models',
  'Continuous backtesting against historical data',
];

export default function RiskManagementScreen() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Risk Management</Text>
          <Text style={styles.subtitle}>
            Understanding and managing the risks in your Qode portfolio
          </Text>
        </View>

        <View style={styles.content}>
          {/* Intro banner */}
          <View style={styles.banner}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.accentGold} />
            <Text style={styles.bannerText}>
              Risk management is not the avoidance of risk — it is the deliberate understanding and control of it.
            </Text>
          </View>

          {/* Risk factors */}
          <Text style={styles.sectionTitle}>Key Risk Factors</Text>
          {RISK_FACTORS.map((r, i) => (
            <TouchableOpacity
              key={i}
              style={styles.riskCard}
              onPress={() => setExpandedIdx(expandedIdx === i ? null : i)}
              activeOpacity={0.8}
            >
              <View style={styles.riskHeader}>
                <View style={styles.riskIconBox}>
                  <Ionicons name={r.icon} size={16} color={Colors.primaryDark} />
                </View>
                <Text style={styles.riskTitle}>{r.title}</Text>
                <View style={[styles.levelPill, { backgroundColor: `${r.levelColor}20` }]}>
                  <Text style={[styles.levelText, { color: r.levelColor }]}>{r.level}</Text>
                </View>
                <Ionicons
                  name={expandedIdx === i ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={Colors.textSecondary}
                />
              </View>
              {expandedIdx === i && (
                <Text style={styles.riskDesc}>{r.desc}</Text>
              )}
            </TouchableOpacity>
          ))}

          {/* Mitigations */}
          <View style={styles.mitigCard}>
            <Text style={styles.cardTitle}>How We Mitigate Risk</Text>
            {MITIGATIONS.map((m, i) => (
              <View key={i} style={styles.mitigRow}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.positive} />
                <Text style={styles.mitigText}>{m}</Text>
              </View>
            ))}
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimerCard}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} style={styles.disclaimerIcon} />
            <Text style={styles.disclaimerText}>
              Portfolio Management Services involve investment risks including loss of principal. Please read your PMS disclosure document carefully before investing. Past performance is not indicative of future results.
            </Text>
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
  content: { padding: 16, gap: 14 },
  banner: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  bannerText: {
    ...Typography.BodySmall,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 20,
    flex: 1,
    fontStyle: 'italic',
  },
  sectionTitle: { ...Typography.H3, color: Colors.textPrimary },
  riskCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 10,
    ...cardShadow,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  riskIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riskTitle: {
    ...Typography.H3,
    color: Colors.textPrimary,
    flex: 1,
  },
  levelPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  levelText: {
    ...Typography.Caption,
    fontFamily: 'Inter_600SemiBold',
  },
  riskDesc: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  mitigCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 12,
    ...cardShadow,
  },
  cardTitle: { ...Typography.H3, color: Colors.textPrimary, marginBottom: 4 },
  mitigRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  mitigText: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  disclaimerCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  disclaimerIcon: { marginTop: 1 },
  disclaimerText: {
    ...Typography.Caption,
    color: '#92400E',
    lineHeight: 16,
    flex: 1,
  },
});
