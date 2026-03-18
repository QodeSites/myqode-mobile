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
import { CardContainer } from '@/components/ui/CardContainer';
import { useInvestmentStatus } from '@/hooks/usePayments';
import { useAuthStore } from '@/store/authStore';
import { formatINR } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { InvestmentOrder, TimelineStep } from '@/api/payments';

const STEP_LABELS = ['Order Created', 'Payment Received', 'Funds Allocated', 'Portfolio Updated'];

const STATUS_COLORS: Record<string, string> = {
  completed: Colors.positive,
  active: Colors.accentGold,
  pending: Colors.textSecondary,
};

function TimelineView({ timeline }: { timeline: TimelineStep[] }) {
  return (
    <View style={styles.timeline}>
      {timeline.map((step, i) => {
        const isLast = i === timeline.length - 1;
        const color = STATUS_COLORS[step.status] ?? Colors.textSecondary;
        return (
          <View key={i} style={styles.timelineRow}>
            <View style={styles.timelineLeft}>
              <View style={[styles.timelineDot, { borderColor: color, backgroundColor: step.status === 'completed' ? color : 'transparent' }]}>
                {step.status === 'completed' && (
                  <Ionicons name="checkmark" size={10} color={Colors.white} />
                )}
                {step.status === 'active' && (
                  <View style={[styles.timelineDotInner, { backgroundColor: color }]} />
                )}
              </View>
              {!isLast && <View style={[styles.timelineLine, { backgroundColor: step.status === 'completed' ? Colors.positive : Colors.border }]} />}
            </View>
            <View style={styles.timelineContent}>
              <Text style={[styles.timelineLabel, { color }]}>{step.label}</Text>
              {step.date && (
                <Text style={styles.timelineDate}>{formatDate(step.date, 'medium')}</Text>
              )}
              {step.note && (
                <Text style={styles.timelineNote}>{step.note}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function OrderCard({ order }: { order: InvestmentOrder }) {
  const [expanded, setExpanded] = useState(false);

  const statusColor =
    order.status === 'completed' ? Colors.positive
    : order.status === 'failed' ? Colors.negative
    : Colors.accentGold;

  return (
    <CardContainer style={styles.orderCard}>
      <TouchableOpacity onPress={() => setExpanded((v) => !v)} activeOpacity={0.8}>
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <Text style={styles.orderAmount}>{formatINR(order.amount)}</Text>
            <Text style={styles.orderMeta}>
              {formatDate(order.createdAt, 'medium')} · {order.accountId}
            </Text>
          </View>
          <View style={styles.orderHeaderRight}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {order.status.replace(/_/g, ' ')}
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

      {expanded && order.timeline?.length > 0 && (
        <View style={styles.orderBody}>
          <View style={styles.divider} />
          <TimelineView timeline={order.timeline} />
        </View>
      )}
    </CardContainer>
  );
}

export default function InvestScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const status = useInvestmentStatus();
  const selectedAccountId = useAuthStore((s) => s.selectedAccountId);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await status.refetch();
    setRefreshing(false);
  }, [status]);

  const orders = status.data?.orders ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Invest</Text>
          <Text style={styles.subtitle}>Track your investment requests</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(tabs)/invest/add-funds')}
        >
          <Ionicons name="add" size={18} color={Colors.white} />
          <Text style={styles.addBtnText}>Add Funds</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accentGreen} />
        }
      >
        <View style={styles.content}>
          {status.isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Loading...</Text>
            </View>
          ) : status.isError ? (
            <TouchableOpacity onPress={() => status.refetch()}>
              <Text style={[styles.emptyText, { color: Colors.negative }]}>Failed to load. Tap to retry.</Text>
            </TouchableOpacity>
          ) : orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>No investments yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap "Add Funds" to make your first investment with Qode.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionLabel}>Your Orders ({orders.length})</Text>
              {orders.map((order) => (
                <OrderCard key={order.orderId} order={order} />
              ))}
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
  content: { padding: 16, gap: 12 },
  sectionLabel: { ...Typography.Caption, color: Colors.textSecondary, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  orderCard: { gap: 0 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderHeaderLeft: { flex: 1, gap: 4 },
  orderHeaderRight: { alignItems: 'flex-end', gap: 4 },
  orderAmount: { fontFamily: 'Inter_700Bold', fontSize: 18, color: Colors.textPrimary },
  orderMeta: { ...Typography.Caption, color: Colors.textSecondary },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { ...Typography.Caption, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' },
  orderBody: { marginTop: 8 },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: 14 },
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
  timelineNote: { ...Typography.Caption, color: Colors.textSecondary, marginTop: 2, fontStyle: 'italic' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { ...Typography.H3, color: Colors.textPrimary },
  emptySubtitle: { ...Typography.BodySmall, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 20 },
  emptyText: { ...Typography.BodySmall, color: Colors.textSecondary, textAlign: 'center', paddingVertical: 20 },
});
