import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';
import { CardContainer } from '@/components/ui/CardContainer';
import { useInvestmentStatus } from '@/hooks/usePayments';
import { useIsSelectedAccountClosed } from '@/hooks/usePortfolio';
import { StrategySelector } from '@/components/ui/StrategySelector';
import { formatDate } from '@/utils/formatDate';
import { InvestmentOrder, TimelineStep, SipChargeEntry } from '@/api/payments';

function TimelineView({ timeline }: { timeline: TimelineStep[] }) {
  return (
    <View style={styles.timeline}>
      {timeline.map((step, i) => {
        const isLast = i === timeline.length - 1;
        // Determine the "active" step: first undone step after all done steps
        const prevDone = i === 0 || timeline[i - 1].done;
        const isActive = !step.done && prevDone;
        const dotColor = step.done ? Colors.positive : isActive ? Colors.accentGold : Colors.border;
        const lineColor = step.done ? Colors.positive : Colors.border;

        return (
          <View key={step.step} style={styles.timelineRow}>
            <View style={styles.timelineLeft}>
              <View style={[styles.timelineDot, { borderColor: dotColor, backgroundColor: step.done ? dotColor : 'transparent' }]}>
                {step.done && <Ionicons name="checkmark" size={10} color={Colors.white} />}
                {isActive && !step.done && <View style={[styles.timelineDotInner, { backgroundColor: dotColor }]} />}
              </View>
              {!isLast && <View style={[styles.timelineLine, { backgroundColor: lineColor }]} />}
            </View>
            <View style={styles.timelineContent}>
              <Text style={[styles.timelineLabel, { color: step.done ? Colors.textPrimary : isActive ? Colors.accentGold : Colors.textSecondary }]}>
                {step.label}
              </Text>
              {step.completedAt && (
                <Text style={styles.timelineDate}>{formatDate(step.completedAt, 'medium')}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── SIP charge history row ────────────────────────────────────────────────────
function SipChargePill({ charge }: { charge: SipChargeEntry }) {
  const isSuccess = charge.status === 'SUCCESS';
  const isFailed  = charge.status === 'FAILED';
  const color = isSuccess ? Colors.positive : isFailed ? Colors.negative : Colors.accentGold;

  return (
    <View style={styles.chargePill}>
      <View style={[styles.chargeDot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.chargeAmount}>
          {charge.formattedAmount}
          {charge.installmentNumber ? (
            <Text style={styles.chargeInstallment}> · #{charge.installmentNumber}</Text>
          ) : null}
        </Text>
        {charge.chargeDate && (
          <Text style={styles.chargeDate}>{formatDate(charge.chargeDate, 'medium')}</Text>
        )}
        {isFailed && charge.failureReason && (
          <Text style={styles.chargeFailReason} numberOfLines={1}>{charge.failureReason}</Text>
        )}
      </View>
      <Text style={[styles.chargeStatus, { color }]}>
        {isSuccess ? 'Paid' : isFailed ? 'Failed' : 'Pending'}
      </Text>
    </View>
  );
}

function OrderCard({ order }: { order: InvestmentOrder }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <CardContainer style={styles.orderCard}>
      <TouchableOpacity onPress={() => setExpanded((v) => !v)} activeOpacity={0.8}>
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <View style={styles.orderTitleRow}>
              <Text style={styles.orderAmount}>{order.formattedAmount}</Text>
              <View style={[styles.typeBadge, order.paymentType === 'SIP' && styles.typeBadgeSIP]}>
                <Text style={styles.typeBadgeText}>{order.paymentType === 'SIP' ? 'SIP' : 'One-time'}</Text>
              </View>
            </View>
            <Text style={styles.orderMeta}>{formatDate(order.createdAt, 'medium')}</Text>
          </View>
          <View style={styles.orderHeaderRight}>
            <View style={[styles.statusBadge, { backgroundColor: order.statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: order.statusColor }]}>
                {order.statusLabel}
              </Text>
            </View>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={Colors.textSecondary}
              style={{ marginTop: 4 }}
            />
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.orderBody}>
          <View style={styles.divider} />
          {order.statusMessage ? (
            <Text style={styles.statusMessage}>{order.statusMessage}</Text>
          ) : null}

          {/* SIP meta: frequency + next charge date */}
          {order.paymentType === 'SIP' && (
            <View style={styles.sipMeta}>
              {order.frequency && (
                <View style={styles.sipMetaItem}>
                  <Text style={styles.sipMetaLabel}>Frequency</Text>
                  <Text style={styles.sipMetaValue}>
                    {order.frequency.charAt(0).toUpperCase() + order.frequency.slice(1)}
                  </Text>
                </View>
              )}
              {order.nextChargeDate && (
                <View style={styles.sipMetaItem}>
                  <Text style={styles.sipMetaLabel}>Next Charge</Text>
                  <Text style={styles.sipMetaValue}>{formatDate(order.nextChargeDate, 'medium')}</Text>
                </View>
              )}
              {(order.chargesCount ?? 0) > 0 && (
                <View style={styles.sipMetaItem}>
                  <Text style={styles.sipMetaLabel}>Installments</Text>
                  <Text style={styles.sipMetaValue}>
                    {order.successfulCharges ?? 0} paid
                    {(order.failedCharges ?? 0) > 0 ? `, ${order.failedCharges} failed` : ''}
                  </Text>
                </View>
              )}
            </View>
          )}

          <TimelineView timeline={order.timeline} />

          {/* SIP charge history */}
          {order.paymentType === 'SIP' && (order.chargeHistory?.length ?? 0) > 0 && (
            <View style={styles.chargeHistorySection}>
              <Text style={styles.chargeHistoryTitle}>Charge History</Text>
              {order.chargeHistory!.map((charge, idx) => (
                <SipChargePill key={charge.cfPaymentId ?? idx} charge={charge} />
              ))}
            </View>
          )}
        </View>
      )}
    </CardContainer>
  );
}

function OrderSection({ title, orders }: { title: string; orders: InvestmentOrder[] }) {
  if (orders.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{title} ({orders.length})</Text>
      {orders.map((order) => (
        <OrderCard key={order.orderId} order={order} />
      ))}
    </View>
  );
}

export default function InvestScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'transactions' | 'sips'>('orders');
  const status = useInvestmentStatus();
  const isClosed = useIsSelectedAccountClosed();

  // H-6: Reset to "orders" tab whenever this screen comes into focus,
  // so that navigating back from Transactions or SIPs screens shows the
  // active Orders tab correctly.
  useFocusEffect(
    useCallback(() => {
      setActiveTab('orders');
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await status.refetch();
    setRefreshing(false);
  }, [status]);

  const active = status.data?.active ?? [];
  const completed = status.data?.completed ?? [];
  const hasOrders = active.length > 0 || completed.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Invest</Text>
          <Text style={styles.subtitle}>Track your investment requests</Text>
        </View>
        <View style={styles.headerActions}>
          <StrategySelector />
          <TouchableOpacity
            style={[styles.addBtn, isClosed && styles.addBtnDisabled]}
            onPress={() => {
              if (isClosed) {
                Alert.alert('Account Closed', 'Investments are disabled for closed accounts.');
                return;
              }
              router.push('/(tabs)/invest/add-funds');
            }}
          >
            <Ionicons name="add" size={18} color={Colors.white} />
            <Text style={styles.addBtnText}>Add Funds</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.tabActive]}
          onPress={() => {
            setActiveTab('orders');
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="wallet-outline"
            size={16}
            color={activeTab === 'orders' ? Colors.primaryDark : Colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
            Orders
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'transactions' && styles.tabActive]}
          onPress={() => {
            setActiveTab('transactions');
            router.push('/(tabs)/invest/transactions');
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="receipt-outline"
            size={16}
            color={activeTab === 'transactions' ? Colors.primaryDark : Colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'transactions' && styles.tabTextActive]}>
            Transactions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sips' && styles.tabActive]}
          onPress={() => {
            setActiveTab('sips');
            router.push('/(tabs)/invest/sip-management');
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="repeat-outline"
            size={16}
            color={activeTab === 'sips' ? Colors.primaryDark : Colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'sips' && styles.tabTextActive]}>
            SIPs
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accentGreen} />
        }
      >
        <View style={styles.content}>
          {isClosed && (
            <View style={styles.closedBanner}>
              <Ionicons name="lock-closed-outline" size={14} color="#6B7280" />
              <Text style={styles.closedBannerText}>
                This account is closed. Investment actions are disabled. Historical data is still available.
              </Text>
            </View>
          )}
          {status.isLoading ? (
            <ActivityIndicator color={Colors.primaryDark} style={{ marginTop: 40 }} />
          ) : status.isError ? (
            <TouchableOpacity onPress={() => status.refetch()}>
              <Text style={[styles.emptyText, { color: Colors.negative }]}>Failed to load. Tap to retry.</Text>
            </TouchableOpacity>
          ) : !hasOrders ? (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>No investments yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap "Add Funds" to make your first investment with Qode.
              </Text>
            </View>
          ) : (
            <>
              <OrderSection title="Active" orders={active} />
              <OrderSection title="Completed" orders={completed} />
            </>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { ...Typography.H1, color: Colors.textPrimary },
  subtitle: { ...Typography.BodySmall, color: Colors.textSecondary, marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryDark,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addBtnText: { ...Typography.BodySmall, color: Colors.white, fontFamily: 'Inter_600SemiBold' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addBtnDisabled: { opacity: 0.5 },
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
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 12,
  },
  closedBannerText: {
    ...Typography.BodySmall,
    color: '#6B7280',
    flex: 1,
    lineHeight: 17,
  },
  content: { padding: 16, gap: 4 },
  section: { gap: 10, marginBottom: 8 },
  sectionLabel: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  orderCard: { gap: 0 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderHeaderLeft: { flex: 1, gap: 4 },
  orderTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderHeaderRight: { alignItems: 'flex-end', gap: 4 },
  orderAmount: { fontFamily: 'Inter_700Bold', fontSize: 18, color: Colors.textPrimary },
  typeBadge: {
    backgroundColor: Colors.primaryDark + '15',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeBadgeSIP: { backgroundColor: Colors.accentGreen + '20' },
  typeBadgeText: {
    ...Typography.Caption,
    color: Colors.primaryDark,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  orderMeta: { ...Typography.Caption, color: Colors.textSecondary },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { ...Typography.Caption, fontFamily: 'Inter_600SemiBold' },
  orderBody: { marginTop: 8 },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: 12 },
  statusMessage: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 14,
    fontStyle: 'italic',
  },
  timeline: { gap: 0 },
  timelineRow: { flexDirection: 'row', gap: 12, minHeight: 44 },
  timelineLeft: { alignItems: 'center', width: 20 },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineDotInner: { width: 8, height: 8, borderRadius: 4 },
  timelineLine: { flex: 1, width: 2, marginTop: 2 },
  timelineContent: { flex: 1, paddingBottom: 16 },
  timelineLabel: { ...Typography.BodySmall, fontFamily: 'Inter_600SemiBold' },
  timelineDate: { ...Typography.Caption, color: Colors.textSecondary, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { ...Typography.H3, color: Colors.textPrimary },
  emptySubtitle: { ...Typography.BodySmall, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 20 },
  emptyText: { ...Typography.BodySmall, color: Colors.textSecondary, textAlign: 'center', paddingVertical: 20 },

  // SIP meta row
  sipMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14 },
  sipMetaItem: { minWidth: 90 },
  sipMetaLabel: { ...Typography.Caption, color: Colors.textSecondary, marginBottom: 2 },
  sipMetaValue: { ...Typography.BodySmall, color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold' },

  // Charge history
  chargeHistorySection: { marginTop: 14 },
  chargeHistoryTitle: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  chargePill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  chargeDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  chargeAmount: { ...Typography.BodySmall, color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
  chargeInstallment: { ...Typography.Caption, color: Colors.textSecondary, fontFamily: 'Inter_400Regular' },
  chargeDate: { ...Typography.Caption, color: Colors.textSecondary, marginTop: 2 },
  chargeFailReason: { ...Typography.Caption, color: Colors.negative, marginTop: 2 },
  chargeStatus: { ...Typography.Caption, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
});
