import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { StatCard } from '@/components/ui/StatCard';
import { CardContainer } from '@/components/ui/CardContainer';
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
import { useAuthStore, StrategyKey, strategyFromAccountId } from '@/store/authStore';
import { authApi } from '@/api/auth';
import { usePortfolioStore, PeriodFilter } from '@/store/portfolioStore';
import { formatINR } from '@/utils/formatCurrency';
import { formatPercent } from '@/utils/formatPercent';
import { formatDate } from '@/utils/formatDate';

const STRATEGY_LABELS: Record<StrategyKey, string> = {
  all: 'All Strategies',
  QFH: 'Qode Future Horizon',
  QTF: 'Qode Tactical Fund',
  QAW: 'Qode All Weather',
  QGF: 'Qode Growth Fund',
};

const PERIODS: PeriodFilter[] = ['1W', '1M', '3M', '6M', '1Y', '3Y', 'ALL'];

export default function PortfolioScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const selectedStrategy = useAuthStore((s) => s.selectedStrategy);
  const setSelectedStrategy = useAuthStore((s) => s.setSelectedStrategy);

  const handleLogout = async () => {
    await authApi.clearToken();
    logout();
  };
  const { selectedPeriod, setSelectedPeriod, plToggle, setPLToggle } = usePortfolioStore();

  const availableStrategies = useMemo(() => {
    const codes = user?.accountCodes ?? [];
    const keys = codes.map((id) => strategyFromAccountId(id)).filter((k) => k !== 'all') as StrategyKey[];
    const unique = Array.from(new Set(keys));
    return [
      { key: 'all' as StrategyKey, label: STRATEGY_LABELS.all },
      ...unique.map((k) => ({ key: k, label: STRATEGY_LABELS[k] })),
    ];
  }, [user?.accountCodes]);

  const [strategyModalVisible, setStrategyModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const performance = usePortfolioPerformance();
  const navData = useNAVData();
  const drawdownData = useDrawdownData();
  const quarterlyPL = useQuarterlyPL();
  const monthlyPL = useMonthlyPL();
  const cashFlow = useCashFlow();

  const onRefresh = useCallback(async () => {
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
  }, []);

  const handleDownloadCSV = async () => {
    const data = performance.data;
    if (!data) return;
    const csvContent = `Amount Invested,Current Value,Total Returns,Returns %\n${data.amountInvested},${data.currentValue},${data.totalReturns},${data.returnsPercent}`;
    await Share.share({ message: csvContent, title: 'Portfolio Data.csv' });
  };

  const perf = performance.data;
  const strategyLabel = STRATEGY_LABELS[selectedStrategy] ?? 'All Strategies';

  // Derive inception and data-as-of from NAV series first/last dates
  const navSeries = navData.data?.data ?? [];
  const inceptionDate = navSeries.length > 0 ? navSeries[0].date : perf?.inceptionDate;
  const dataAsOf = navSeries.length > 0 ? navSeries[navSeries.length - 1].date : perf?.dataAsOf;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Strategy Selector Modal */}
      <Modal
        visible={strategyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setStrategyModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Select Strategy</Text>
          {availableStrategies.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[
                styles.strategyOption,
                selectedStrategy === s.key && styles.strategyOptionActive,
              ]}
              onPress={() => {
                setSelectedStrategy(s.key);
                setStrategyModalVisible(false);
              }}
            >
              <Text
                style={[
                  styles.strategyOptionText,
                  selectedStrategy === s.key && styles.strategyOptionActiveText,
                ]}
              >
                {s.label}
              </Text>
              {selectedStrategy === s.key && (
                <Ionicons name="checkmark" size={18} color={Colors.primaryDark} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accentGreen}
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
                  Inception: {formatDate(inceptionDate, 'medium')} · As of: {formatDate(dataAsOf, 'medium')}
                </Text>
              )}
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.strategyBtn}
                onPress={() => setStrategyModalVisible(true)}
              >
                <Text style={styles.strategyBtnText} numberOfLines={1}>
                  {selectedStrategy === 'all' ? 'All' : selectedStrategy.toUpperCase()}
                </Text>
                <Ionicons name="chevron-down" size={12} color={Colors.primaryDark} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.downloadBtn} onPress={handleDownloadCSV}>
                <Ionicons name="download-outline" size={18} color={Colors.primaryDark} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={18} color={Colors.negative} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Stat Cards 2x2 */}
          <View style={styles.statGrid}>
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
                  value={perf?.amountInvested ? formatINR(perf.amountInvested) : '—'}
                  subtitle={perf?.amountInvested ? `Gross: ${formatINR(perf.amountInvested * 1.005)}` : undefined}
                  icon="save-outline"
                />
                <StatCard
                  label="Current Value"
                  value={perf?.currentValue ? formatINR(perf.currentValue) : '—'}
                  subtitle={`As of ${formatDate(perf?.dataAsOf, 'short')}`}
                  icon="cash-outline"
                />
                <StatCard
                  label="Total Returns"
                  value={perf?.currentValue ? formatINR(perf.totalReturns ?? 0) : '—'}
                  subtitle="Absolute returns"
                  icon="trending-down-outline"
                  valueColor={
                    perf?.currentValue
                      ? (perf.totalReturns ?? 0) >= 0 ? Colors.positive : Colors.negative
                      : undefined
                  }
                />
                <StatCard
                  label="Returns %"
                  value={perf?.currentValue ? formatPercent(perf.returnsPercent ?? 0) : '—'}
                  subtitle={perf?.currentValue ? `~ CAGR ${formatPercent(perf.cagr ?? 0)}` : undefined}
                  icon="stats-chart-outline"
                  valueColor={
                    perf?.currentValue
                      ? (perf.returnsPercent ?? 0) >= 0 ? Colors.positive : Colors.negative
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
            <NAVChart data={navData.data?.data ?? []} benchmarkName={navData.data?.benchmarkName} loading={navData.isLoading} />
            {navData.isError && (
              <TouchableOpacity onPress={() => navData.refetch()} style={styles.retryBtn}>
                <Text style={styles.retryText}>Retry ↺</Text>
              </TouchableOpacity>
            )}
          </CardContainer>

          {/* Drawdown Chart */}
          <CardContainer style={styles.section}>
            <Text style={styles.sectionTitle}>Drawdown Analysis</Text>
            <DrawdownChart data={drawdownData.data?.data ?? []} benchmarkName={drawdownData.data?.benchmarkName} loading={drawdownData.isLoading} />
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
  strategyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: 90,
  },
  strategyBtnText: {
    ...Typography.Caption,
    color: Colors.primaryDark,
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
  },
  downloadBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
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
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    ...Typography.H2,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  strategyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  strategyOptionActive: {
    backgroundColor: Colors.background,
    borderColor: Colors.primaryDark,
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
