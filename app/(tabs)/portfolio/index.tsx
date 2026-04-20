import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { StatCard } from '@/components/ui/StatCard';
import { CardContainer } from '@/components/ui/CardContainer';
import { StrategySelector, STRATEGY_LABELS } from '@/components/ui/StrategySelector';
import { LoadingSkeleton, StatCardSkeleton } from '@/components/ui/LoadingSkeleton';
import { NAVChart } from '@/components/charts/NAVChart';
import { DrawdownChart } from '@/components/charts/DrawdownChart';
import { TrailingReturnsTable } from '@/components/portfolio/TrailingReturnsTable';
import { QuarterlyPLTable } from '@/components/portfolio/QuarterlyPLTable';
import { MonthlyPLTable } from '@/components/portfolio/MonthlyPLTable';
import { CashFlowList } from '@/components/portfolio/CashFlowList';
import {
  usePortfolioPerformance,
  useNAVData,
  useDrawdownData,
  useQuarterlyPL,
  useMonthlyPL,
  useCashFlow,
} from '@/hooks/usePortfolio';
import { useAuthStore, StrategyKey } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import { usePortfolioStore, PeriodFilter } from '@/store/portfolioStore';
import { formatINR } from '@/utils/formatCurrency';
import { formatPercent } from '@/utils/formatPercent';
import { formatDate } from '@/utils/formatDate';
import { Analytics, EVENTS } from '@/utils/analytics';

const PERIODS: PeriodFilter[] = ['1W', '1M', '3M', '6M', '1Y', '3Y', 'ALL'];

export default function PortfolioScreen() {
  const user = useAuthStore((s) => s.user);
  const selectedStrategy = useAuthStore((s) => s.selectedStrategy);
  const setSelectedStrategy = useAuthStore((s) => s.setSelectedStrategy);
  const selectedAccountId = useAuthStore((s) => s.selectedAccountId);

  // C-3: Use useLogout so the server-side session is properly revoked
  const logoutMutation = useLogout();
  const handleLogout = () => logoutMutation.mutate();
  const { selectedPeriod, setSelectedPeriod, plToggle, setPLToggle } = usePortfolioStore();

  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Track screen view on focus
  useFocusEffect(
    useCallback(() => {
      Analytics.screen('Portfolio', { strategy: selectedStrategy });
    }, [selectedStrategy])
  );

  // Query hooks
  const performance = usePortfolioPerformance();
  const navData = useNAVData();
  const drawdownData = useDrawdownData();
  const quarterlyPL = useQuarterlyPL();
  const monthlyPL = useMonthlyPL();
  const cashFlow = useCashFlow();

  // Invalidate all portfolio data queries when scope changes while this screen
  // was in the background (navigated away and back), so stale data never shows.
  const scopeKey = selectedAccountId ?? '';
  const lastScopeFocused = useRef<string>('');

  useFocusEffect(
    useCallback(() => {
      if (lastScopeFocused.current !== scopeKey) {
        queryClient.invalidateQueries({ queryKey: ['portfolio'], refetchType: 'active' });
        lastScopeFocused.current = scopeKey;
      }
    }, [scopeKey, queryClient])
  );

  const onRefresh = useCallback(async () => {
    Analytics.event(EVENTS.PORTFOLIO_REFRESHED, { strategy: selectedStrategy });
    setRefreshing(true);
    await Promise.all([
      performance.refetch(),
      navData.refetch(),
      drawdownData.refetch(),
      quarterlyPL.refetch(),
      monthlyPL.refetch(),
      cashFlow.refetch(),
    ]);
    setRefreshing(false);
  }, [performance, navData, drawdownData, quarterlyPL, monthlyPL, cashFlow, selectedStrategy]);

  const perf = performance.data;
  const isClosed = perf?.isClosed ?? false;
  const closedAt = perf?.closedAt;

  const trimAtClose = <T extends { date: string }>(data: T[]): T[] => {
    if (!isClosed || !closedAt) return data;
    const closeTime = new Date(closedAt).getTime();
    if (isNaN(closeTime)) return data;
    const filtered = data.filter((d) => new Date(d.date).getTime() <= closeTime);
    return filtered.length > 0 ? filtered : data;
  };

  const strategyLabel = STRATEGY_LABELS[selectedStrategy] ?? 'All Strategies';

  // Prefer nav series dates (always accurate); fall back to perf fields
  const navSeries = navData.data?.data ?? [];
  const inceptionDate = navSeries.length > 0 ? navSeries[0].date : perf?.inceptionDate;
  const dataAsOf = navSeries.length > 0 ? navSeries[navSeries.length - 1].date : perf?.dataAsOf;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accentGreen}
            colors={[Colors.accentGreen]}
          />
        }
        stickyHeaderIndices={[0]}
      >
        {/* Sticky Header */}
        <View style={styles.stickyHeader}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.screenTitle}>Portfolio Details</Text>
              <Text style={styles.screenSubtitle}>
                {user?.name ?? 'Loading...'} · {strategyLabel}
              </Text>
              {inceptionDate && (
                <Text style={styles.dateInfo}>
                  Inception: {formatDate(inceptionDate, 'medium')}
                  {dataAsOf ? ` · As of: ${formatDate(dataAsOf, 'medium')}` : ''}
                </Text>
              )}
            </View>
            <View style={styles.headerRight}>
              <StrategySelector />
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={18} color={Colors.negative} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Closed Account Banner */}
        {isClosed && (
          <View style={styles.closedBanner}>
            <Ionicons name="lock-closed-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.closedBannerText}>
              This account was closed{closedAt ? ` on ${formatDate(closedAt, 'medium')}` : ''}. Data shown is as of the closing date.
            </Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Stat Cards 2x2 */}
          <View style={[styles.statGrid, performance.isFetching && !performance.isLoading && styles.statGridFetching]}>
            {performance.isLoading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <StatCard
                  label="Amount Invested"
                  value={perf?.amountInvested ? formatINR(perf.amountInvested, 0) : '—'}
                  subtitle={perf?.grossValue ? `Gross: ${formatINR(perf.grossValue, 0)}` : 'All time'}
                  icon="save-outline"
                />
                <StatCard
                  label="Current Value"
                  value={perf?.currentValue ? formatINR(perf.currentValue, 0) : '—'}
                  subtitle={dataAsOf ? `As of ${formatDate(dataAsOf, 'short')}` : 'All time'}
                  icon="cash-outline"
                />
                <StatCard
                  label="Total Returns"
                  value={perf?.totalReturns != null ? formatINR(perf.totalReturns, 0) : '—'}
                  subtitle="Absolute returns"
                  icon={
                    perf?.totalReturns != null && perf.totalReturns < 0
                      ? 'trending-down-outline'
                      : 'trending-up-outline'
                  }
                  valueColor={
                    perf?.totalReturns != null
                      ? perf.totalReturns >= 0 ? Colors.positive : Colors.negative
                      : undefined
                  }
                />
                <StatCard
                  label="Returns %"
                  value={perf?.returnsPercent != null ? formatPercent(perf.returnsPercent) : '—'}
                  subtitle={
                    perf?.cagr != null && perf.cagr !== 0
                      ? `~ CAGR ${formatPercent(perf.cagr)}`
                      : undefined
                  }
                  icon="stats-chart-outline"
                  valueColor={
                    perf?.returnsPercent != null
                      ? perf.returnsPercent >= 0 ? Colors.positive : Colors.negative
                      : undefined
                  }
                />
              </>
            )}
          </View>

          {/* Trailing Returns Table */}
          <CardContainer style={styles.section}>
            <Text style={styles.sectionTitle}>Trailing Returns & Drawdown</Text>
            {performance.isLoading ? (
              <LoadingSkeleton height={80} />
            ) : performance.data?.trailingReturns ? (
              <TrailingReturnsTable data={performance.data.trailingReturns} />
            ) : (
              <Text style={styles.emptyText}>No data available</Text>
            )}
          </CardContainer>

          {/* Period Filter */}
          <View style={styles.periodRow}>
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.periodPill,
                  selectedPeriod === p && styles.periodPillActive,
                ]}
                onPress={() => setSelectedPeriod(p)}
              >
                <Text
                  style={[
                    styles.periodText,
                    selectedPeriod === p && styles.periodTextActive,
                  ]}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* NAV Chart */}
          <CardContainer style={styles.section}>
            <Text style={styles.sectionTitle}>NAV Performance</Text>
            <NAVChart data={trimAtClose(navData.data?.data ?? [])} benchmarkName={navData.data?.benchmarkName} loading={navData.isLoading} />
            {navData.isError && (
              <TouchableOpacity onPress={() => navData.refetch()} style={styles.retryBtn}>
                <Text style={styles.retryText}>Retry ↺</Text>
              </TouchableOpacity>
            )}
          </CardContainer>

          {/* Drawdown Chart */}
          <CardContainer style={styles.section}>
            <Text style={styles.sectionTitle}>Drawdown Analysis</Text>
            <DrawdownChart data={trimAtClose(drawdownData.data?.data ?? [])} benchmarkName={drawdownData.data?.benchmarkName} loading={drawdownData.isLoading} />
            {drawdownData.isError && (
              <TouchableOpacity onPress={() => drawdownData.refetch()} style={styles.retryBtn}>
                <Text style={styles.retryText}>Retry ↺</Text>
              </TouchableOpacity>
            )}
          </CardContainer>

          {/* Quarterly P&L */}
          <CardContainer style={styles.section}>
            <Text style={styles.sectionTitle}>Quarterly P&L</Text>
            {quarterlyPL.isLoading ? (
              <LoadingSkeleton height={120} />
            ) : quarterlyPL.data ? (
              <QuarterlyPLTable
                data={plToggle === 'percent' ? quarterlyPL.data.percentData : quarterlyPL.data.rupeeData}
                mode={plToggle}
                onToggleMode={setPLToggle}
              />
            ) : (
              <Text style={styles.emptyText}>No quarterly data</Text>
            )}
          </CardContainer>

          {/* Monthly P&L */}
          <CardContainer style={styles.section}>
            <Text style={styles.sectionTitle}>Monthly P&L</Text>
            {monthlyPL.isLoading ? (
              <LoadingSkeleton height={100} />
            ) : monthlyPL.data ? (
              <MonthlyPLTable
                data={plToggle === 'percent' ? monthlyPL.data.percentData : monthlyPL.data.rupeeData}
                mode={plToggle}
                onToggleMode={setPLToggle}
              />
            ) : (
              <Text style={styles.emptyText}>No monthly data</Text>
            )}
          </CardContainer>

          {/* Cash Flow */}
          <CardContainer style={[styles.section, styles.lastSection]}>
            <Text style={styles.sectionTitle}>Cash Flow History</Text>
            {cashFlow.isLoading ? (
              <LoadingSkeleton height={120} />
            ) : cashFlow.data?.transactions?.length ? (
              <CashFlowList data={cashFlow.data.transactions} />
            ) : (
              <Text style={styles.emptyText}>No transactions yet</Text>
            )}
          </CardContainer>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  stickyHeader: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  screenTitle: {
    ...Typography.H1,
    color: Colors.textPrimary,
  },
  screenSubtitle: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dateInfo: {
    fontSize: 10,
    color: Colors.accentGreen,
    marginTop: 3,
    fontFamily: 'Inter_400Regular',
  },
  logoutBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  closedBannerText: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'stretch',
  },
  statGridFetching: {
    opacity: 0.5,
  },
  section: {
    // no extra style needed, CardContainer handles it
  },
  lastSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    ...Typography.H3,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  periodPill: {
    flex: 1,
    height: 32,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodPillActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  periodText: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
  },
  periodTextActive: {
    color: Colors.white,
  },
  emptyText: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  retryBtn: {
    alignSelf: 'center',
    marginTop: 8,
  },
  retryText: {
    ...Typography.BodySmall,
    color: Colors.accentGreen,
    fontFamily: 'Inter_600SemiBold',
  },
  strategyOptionText: {
    ...Typography.Body,
    color: Colors.textPrimary,
  },
  strategyOptionActiveText: {
    color: Colors.primaryDark,
    fontFamily: 'Inter_600SemiBold',
  },
});
