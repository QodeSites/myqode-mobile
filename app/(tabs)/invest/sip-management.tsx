import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';
import { useTransactions, usePauseResumeSip, useCancelSip } from '@/hooks/useAccountServices';
import { StrategySelector } from '@/components/ui/StrategySelector';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/utils/formatDate';
import { formatINR } from '@/utils/formatCurrency';
import { Transaction } from '@/api/services';
import { AutoShrinkText } from '@/components/ui/AutoShrinkText';

const SIP_STATUS_COLORS: Record<string, string> = {
  ACTIVE: Colors.positive,
  PAUSED: '#F59E0B',
  CANCELLED: Colors.negative,
  EXPIRED: '#6B7280',
  PENDING: '#3B82F6',
};

const SIP_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  PENDING: 'Pending',
};

const FREQUENCY_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  WEEKLY: 'Weekly',
  DAILY: 'Daily',
  HALF_YEARLY: 'Half-Yearly',
  YEARLY: 'Yearly',
};

function SipCard({ sip, accountId }: { sip: Transaction; accountId: string }) {
  const pauseResume = usePauseResumeSip();
  const cancel = useCancelSip();
  const subscriptionId = sip.subscription_id ?? sip.orderId;
  const statusColor = SIP_STATUS_COLORS[sip.status] ?? Colors.textSecondary;
  const isPaused = sip.status === 'PAUSED';
  const isActive = sip.status === 'ACTIVE';
  const canAct = isActive || isPaused;

  const handlePauseResume = () => {
    const action = isPaused ? 'resume' : 'pause';
    Alert.alert(
      isPaused ? 'Resume SIP' : 'Pause SIP',
      `Are you sure you want to ${action} this SIP of ${formatINR(sip.amount)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isPaused ? 'Resume' : 'Pause',
          onPress: () =>
            pauseResume.mutate(
              { subscription_id: subscriptionId, accountId, action },
              {
                onSuccess: (data) => Alert.alert('Success', data.message),
                onError: (err: any) =>
                  Alert.alert('Error', err?.response?.data?.message ?? 'Something went wrong.'),
              }
            ),
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel SIP',
      `This will permanently cancel your SIP of ${formatINR(sip.amount)}. This action cannot be undone.`,
      [
        { text: 'Keep SIP', style: 'cancel' },
        {
          text: 'Cancel SIP',
          style: 'destructive',
          onPress: () =>
            cancel.mutate(
              { subscription_id: subscriptionId, accountId },
              {
                onSuccess: (data) => Alert.alert('SIP Cancelled', data.message),
                onError: (err: any) =>
                  Alert.alert('Error', err?.response?.data?.message ?? 'Something went wrong.'),
              }
            ),
        },
      ]
    );
  };

  const isLoading = pauseResume.isPending || cancel.isPending;

  return (
    <View style={styles.sipCard}>
      {/* Header */}
      <View style={styles.sipCardHeader}>
        <View style={styles.sipIconBox}>
          <Ionicons name="repeat-outline" size={18} color={Colors.primaryDark} />
        </View>
        <View style={styles.sipHeaderInfo}>
          <AutoShrinkText style={styles.sipAmount} minimumFontScale={0.65}>
            {formatINR(sip.amount)}
          </AutoShrinkText>
          <Text style={styles.sipFreq}>
            {sip.frequency ? (FREQUENCY_LABELS[sip.frequency] ?? sip.frequency) : 'SIP'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '1A' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {SIP_STATUS_LABELS[sip.status] ?? sip.status}
          </Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.sipDetails}>
        <View style={styles.sipDetailRow}>
          <Text style={styles.sipDetailLabel}>Order ID</Text>
          <Text style={styles.sipDetailValue} numberOfLines={1}>{sip.orderId}</Text>
        </View>
        {sip.startDate && (
          <View style={styles.sipDetailRow}>
            <Text style={styles.sipDetailLabel}>Start Date</Text>
            <Text style={styles.sipDetailValue}>{formatDate(sip.startDate, 'medium')}</Text>
          </View>
        )}
        {sip.nextChargeDate && (
          <View style={styles.sipDetailRow}>
            <Text style={styles.sipDetailLabel}>Next Charge</Text>
            <Text style={styles.sipDetailValue}>{formatDate(sip.nextChargeDate, 'medium')}</Text>
          </View>
        )}
        <View style={styles.sipDetailRow}>
          <Text style={styles.sipDetailLabel}>Created</Text>
          <Text style={styles.sipDetailValue}>{formatDate(sip.date, 'medium')}</Text>
        </View>
      </View>

      {/* Actions */}
      {canAct && (
        <View style={styles.sipActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.pauseBtn]}
            onPress={handlePauseResume}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading && pauseResume.isPending ? (
              <ActivityIndicator size="small" color={Colors.primaryDark} />
            ) : (
              <>
                <Ionicons
                  name={isPaused ? 'play-outline' : 'pause-outline'}
                  size={14}
                  color={Colors.primaryDark}
                />
                <Text style={styles.pauseBtnText}>{isPaused ? 'Resume' : 'Pause'}</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.cancelBtn]}
            onPress={handleCancel}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading && cancel.isPending ? (
              <ActivityIndicator size="small" color={Colors.negative} />
            ) : (
              <>
                <Ionicons name="close-outline" size={14} color={Colors.negative} />
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function SipManagementScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const selectedAccountId = useAuthStore((s) => s.selectedAccountId);
  const accountId = selectedAccountId ?? '';
  const { data, isLoading, isError, refetch } = useTransactions();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const allTx = data?.transactions ?? [];
  const sips = allTx.filter((tx) => tx.type === 'SIP');
  const activeSips = sips.filter((s) => ['ACTIVE', 'PAUSED', 'PENDING'].includes(s.status));
  const completedSips = sips.filter((s) => ['CANCELLED', 'EXPIRED'].includes(s.status));

  // No account selected — the StrategySelector in the header lets them pick one
  if (!selectedAccountId) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Invest</Text>
            <Text style={styles.subtitle}>Manage your SIP investments</Text>
          </View>
          <StrategySelector />
        </View>
        <View style={styles.center}>
          <Ionicons name="repeat-outline" size={40} color={Colors.border} />
          <Text style={styles.emptyTitle}>No Account Selected</Text>
          <Text style={styles.emptyText}>
            Please select an account from the top-right selector to view your SIPs.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Invest</Text>
          <Text style={styles.subtitle}>Manage your SIP investments</Text>
        </View>
        <StrategySelector />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => router.push('/(tabs)/invest')}
          activeOpacity={0.7}
        >
          <Ionicons name="wallet-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.tabText}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => router.push('/(tabs)/invest/transactions')}
          activeOpacity={0.7}
        >
          <Ionicons name="receipt-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.tabText}>Transactions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, styles.tabActive]}
          activeOpacity={0.7}
        >
          <Ionicons name="repeat-outline" size={16} color={Colors.primaryDark} />
          <Text style={[styles.tabText, styles.tabTextActive]}>SIPs</Text>
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
            <ActivityIndicator color={Colors.accentGreen} />
            <Text style={styles.loadingText}>Loading SIPs...</Text>
          </View>
        )}

        {isError && (
          <TouchableOpacity style={styles.errorCard} onPress={() => refetch()}>
            <Ionicons name="refresh-outline" size={18} color={Colors.negative} />
            <Text style={styles.errorText}>Failed to load. Tap to retry.</Text>
          </TouchableOpacity>
        )}

        {!isLoading && !isError && sips.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="repeat-outline" size={40} color={Colors.border} />
            <Text style={styles.emptyTitle}>No SIPs Found</Text>
            <Text style={styles.emptyText}>
              Start a Systematic Investment Plan to invest automatically on your chosen schedule.
            </Text>
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => router.push('/(tabs)/invest/add-funds')}
            >
              <Text style={styles.ctaBtnText}>Set Up a SIP</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeSips.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Active SIPs</Text>
            {activeSips.map((sip) => (
              <SipCard key={sip.orderId} sip={sip} accountId={accountId} />
            ))}
          </>
        )}

        {completedSips.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Past SIPs</Text>
            {completedSips.map((sip) => (
              <SipCard key={sip.orderId} sip={sip} accountId={accountId} />
            ))}
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
  backBtn: { width: 38, justifyContent: 'center' },
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
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  sectionLabel: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: -4,
  },
  sipCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  sipCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sipIconBox: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sipHeaderInfo: { flex: 1 },
  sipAmount: { ...Typography.Body, color: Colors.textPrimary, fontFamily: 'Inter_700Bold' },
  sipFreq: { ...Typography.Caption, color: Colors.textSecondary, marginTop: 1 },
  statusBadge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { ...Typography.Caption, fontFamily: 'Inter_600SemiBold' },
  sipDetails: { padding: 14, gap: 8 },
  sipDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sipDetailLabel: { ...Typography.BodySmall, color: Colors.textSecondary },
  sipDetailValue: {
    ...Typography.BodySmall,
    color: Colors.textPrimary,
    fontFamily: 'Inter_500Medium',
    flex: 1,
    textAlign: 'right',
  },
  sipActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    paddingTop: 0,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
    borderWidth: 1,
  },
  pauseBtn: {
    backgroundColor: Colors.background,
    borderColor: Colors.primaryDark,
  },
  pauseBtnText: { ...Typography.BodySmall, color: Colors.primaryDark, fontFamily: 'Inter_600SemiBold' },
  cancelBtn: {
    backgroundColor: Colors.lightRed,
    borderColor: Colors.negative,
  },
  cancelBtnText: { ...Typography.BodySmall, color: Colors.negative, fontFamily: 'Inter_600SemiBold' },
  center: { padding: 40, alignItems: 'center', gap: 12 },
  loadingText: { ...Typography.Body, color: Colors.textSecondary },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.lightRed,
    borderRadius: 12,
    padding: 14,
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
