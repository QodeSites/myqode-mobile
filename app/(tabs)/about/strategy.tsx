import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { StrategyCard } from '@/components/strategy/StrategyCard';
import { aboutApi, Strategy } from '@/api/about';

// Fallback static strategies if API is unavailable
const FALLBACK_STRATEGIES: Strategy[] = [
  {
    id: 'QAW',
    name: 'QAW',
    fullName: 'Qode All Weather',
    description: 'A balanced, all-weather strategy built to perform across market cycles. Combines momentum, quality, and value factors.',
    tags: ['Multi-Factor', 'All Weather', 'Long-Only', 'Large Cap'],
    colorKey: 'strategyQAW',
  },
  {
    id: 'QTF',
    name: 'QTF',
    fullName: 'Qode Trend Following',
    description: 'A systematic trend-following strategy that captures long-term momentum across equity markets.',
    tags: ['Momentum', 'Trend Following', 'Systematic', 'Mid Cap'],
    colorKey: 'strategyQTF',
  },
  {
    id: 'QGF',
    name: 'QGF',
    fullName: 'Qode Growth Fund',
    description: 'Concentrated portfolio of high-growth companies identified through quantitative screening and fundamental analysis.',
    tags: ['Growth', 'Concentrated', 'Quality', 'Multi Cap'],
    colorKey: 'strategyQGF',
  },
  {
    id: 'QFH',
    name: 'QFH',
    fullName: 'Qode Focused Hybrid',
    description: 'A focused hybrid strategy combining equity and debt instruments to provide superior risk-adjusted returns.',
    tags: ['Hybrid', 'Risk-Managed', 'Balanced', 'Defensive'],
    colorKey: 'strategyQFH',
  },
];

export default function StrategyScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['about', 'strategies'],
    queryFn: aboutApi.getStrategies,
    staleTime: 30 * 60 * 1000,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const strategies = data ?? FALLBACK_STRATEGIES;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accentGreen}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Strategy Snapshot</Text>
          <Text style={styles.subtitle}>
            Discover Qode's evidence-based investment strategies — each engineered for specific market conditions.
          </Text>
        </View>

        <View style={styles.content}>
          {isLoading ? (
            <ActivityIndicator color={Colors.primaryDark} style={styles.loader} />
          ) : (
            strategies.map((strategy) => (
              <StrategyCard key={strategy.id} strategy={strategy} />
            ))
          )}

          {isError && !data && (
            <Text style={styles.errorNote}>Showing offline data. Pull to refresh.</Text>
          )}
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
  content: { padding: 16 },
  loader: { marginTop: 40 },
  errorNote: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
});
