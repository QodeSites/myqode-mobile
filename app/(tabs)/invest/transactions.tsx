import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';
import { useTransactions } from '@/hooks/useAccountServices';
import { StrategySelector } from '@/components/ui/StrategySelector';
import { formatDate } from '@/utils/formatDate';
import { formatINR } from '@/utils/formatCurrency';
import { Transaction } from '@/api/services';

const STATUS_COLORS: Record<string, string> = {
  PAID: Colors.positive,
  ACTIVE: Colors.positive,
  PROCESSING: '#3B82F6',
  PENDING: '#F59E0B',
  EXPIRED: '#6B7280',
  CANCELLED: Colors.negative,
  PAUSED: '#F59E0B',
};

const TYPE_LABELS: Record<string, string> = {
  ONE_TIME: 'One-Time',
  SIP: 'SIP',
  Lumpsum: 'Lumpsum',
  Withdrawal: 'Withdrawal',
  Switch: 'Switch',
};

function TransactionRow({ tx }: { tx: Transaction }) {
  const statusColor = STATUS_COLORS[tx.status] ?? Colors.textSecondary;
  const typeLabel = TYPE_LABELS[tx.type] ?? tx.type;
  const isDebit = tx.type === 'Withdrawal';

  return (
    <View style={styles.row}>
      <View style={[styles.typeIcon, { backgroundColor: isDebit ? Colors.lightRed : Colors.lightGreen }]}>
        <Ionicons
          name={isDebit ? 'arrow-up-outline' : 'arrow-down-outline'}
          size={16}
          color={isDebit ? Colors.negative : Colors.positive}
        />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.rowLabel}>{typeLabel}</Text>
          <Text style={[styles.rowAmount, { color: isDebit ? Colors.negative : Colors.positive }]}>
            {isDebit ? '-' : '+'}{formatINR(tx.amount)}
          </Text>
        </View>
        <View style={styles.rowBottom}>
          <Text style={styles.rowId} numberOfLines={1}>{tx.orderId}</Text>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '18' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{tx.status}</Text>
          </View>
        </View>
        <Text style={styles.rowDate}>{formatDate(tx.date, 'medium')}</Text>
        {tx.frequency && (
          <Text style={styles.rowFreq}>{tx.frequency}{tx.startDate ? ` · from ${formatDate(tx.startDate, 'short')}` : ''}</Text>
        )}
      </View>
    </View>
  );
}

export default function TransactionsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { data, isLoading, isError, refetch } = useTransactions();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const transactions = data?.transactions ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Invest</Text>
          <Text style={styles.subtitle}>View all transactions</Text>
        </View>
        <StrategySelector />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="wallet-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.tabText}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, styles.tabActive]}
          activeOpacity={0.7}
        >
          <Ionicons name="receipt-outline" size={16} color={Colors.primaryDark} />
          <Text style={[styles.tabText, styles.tabTextActive]}>Transactions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => router.push('/(tabs)/invest/sip-management')}
          activeOpacity={0.7}
        >
          <Ionicons name="repeat-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.tabText}>SIPs</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accentGreen} />
        }
        contentContainerStyle={styles.scroll}
      >
        {isLoading && (
          <View style={styles.center}>
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        )}

        {isError && (
          <TouchableOpacity style={styles.errorCard} onPress={() => refetch()}>
            <Ionicons name="refresh-outline" size={18} color={Colors.negative} />
            <Text style={styles.errorText}>Failed to load. Tap to retry.</Text>
          </TouchableOpacity>
        )}

        {!isLoading && !isError && transactions.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={40} color={Colors.border} />
            <Text style={styles.emptyTitle}>No Transactions</Text>
            <Text style={styles.emptyText}>Your transaction history will appear here once you make an investment.</Text>
            <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/(tabs)/invest/add-funds')}>
              <Text style={styles.ctaBtnText}>Add Funds</Text>
            </TouchableOpacity>
          </View>
        )}

        {transactions.length > 0 && (
          <>
            {data?.lastUpdated && (
              <Text style={styles.lastUpdated}>
                Updated {formatDate(data.lastUpdated, 'medium')}
              </Text>
            )}
            <View style={styles.card}>
              {transactions.map((tx, i) => (
                // Use orderId as key; append index only as last-resort dedup guard
                <View key={tx.orderId || String(i)} style={[i < transactions.length - 1 && styles.divider]}>
                  <TransactionRow tx={tx} />
                </View>
              ))}
            </View>
          </>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerLeft: { flex: 1 },
  headerTitle: { ...Typography.H1, color: Colors.textPrimary },
  subtitle: { ...Typography.BodySmall, color: Colors.textSecondary, marginTop: 2 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primaryDark,
  },
  tabText: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    fontFamily: 'Inter_500Medium',
  },
  tabTextActive: {
    color: Colors.primaryDark,
    fontFamily: 'Inter_600SemiBold',
  },
  scroll: { padding: 16, paddingBottom: 40 },
  lastUpdated: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginBottom: 10,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  rowBody: { flex: 1, gap: 4 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { ...Typography.Body, color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
  rowAmount: { ...Typography.Body, fontFamily: 'Inter_600SemiBold' },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowId: { ...Typography.Caption, color: Colors.textSecondary, flex: 1, marginRight: 8 },
  statusPill: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { ...Typography.Caption, fontFamily: 'Inter_600SemiBold' },
  rowDate: { ...Typography.Caption, color: Colors.textSecondary },
  rowFreq: { ...Typography.Caption, color: Colors.accentGreen },
  divider: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  center: { padding: 40, alignItems: 'center' },
  loadingText: { ...Typography.Body, color: Colors.textSecondary },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.lightRed,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  errorText: { ...Typography.Body, color: Colors.negative },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { ...Typography.H2, color: Colors.textPrimary },
  emptyText: { ...Typography.Body, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 24 },
  ctaBtn: {
    marginTop: 4,
    backgroundColor: Colors.primaryDark,
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  ctaBtnText: { ...Typography.ButtonLabel, color: Colors.white },
});
