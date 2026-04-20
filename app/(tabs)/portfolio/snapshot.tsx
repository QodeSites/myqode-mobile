import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';
import { usePortfolioSnapshot } from '@/hooks/usePortfolio';
import { SnapshotNode } from '@/api/portfolio';
import { StrategySelector } from '@/components/ui/StrategySelector';
import { formatINR } from '@/utils/formatCurrency';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatDate } from '@/utils/formatDate';

function SnapshotRow({
  node,
  depth = 0,
}: {
  node: SnapshotNode;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(depth === 0);

  const dotColor =
    node.type === 'owner'
      ? Colors.textSecondary
      : node.type === 'person'
      ? Colors.accentGreen
      : Colors.accentGold;

  const hasChildren = node.children && node.children.length > 0;

  return (
    <View>
      <TouchableOpacity
        style={[styles.nodeRow, { paddingLeft: 16 + depth * 20 }]}
        onPress={() => hasChildren && setExpanded((e) => !e)}
        activeOpacity={hasChildren ? 0.7 : 1}
      >
        <View style={styles.nodeLeft}>
          {hasChildren && (
            <Ionicons
              name={expanded ? 'chevron-down' : 'chevron-forward'}
              size={12}
              color={Colors.textSecondary}
              style={styles.chevron}
            />
          )}
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
          <Text style={styles.nodeLabel} numberOfLines={1}>{node.label}</Text>
          {node.type === 'account' && node.isClosed && (
            <View style={styles.closedBadge}>
              <Text style={styles.closedBadgeText}>Closed</Text>
            </View>
          )}
          {node.type === 'account' && !node.isClosed && node.accountType && (
            <Text style={styles.accountType}>{node.accountType}</Text>
          )}
        </View>
        <Text style={[styles.nodeValue, node.isClosed && styles.nodeValueClosed]}>
          {node.isClosed ? '—' : formatINR(node.totalValue)}
        </Text>
      </TouchableOpacity>

      {/* Account detail card at depth 2 */}
      {expanded && node.type === 'account' && (
        <View style={[styles.detailCard, { marginLeft: 16 + depth * 20 + 20 }]}>
          {node.clientId && (
            <DetailRow label="Client ID" value={node.clientId} />
          )}
          {node.email && (
            <DetailRow label="Email" value={node.email} />
          )}
          {node.mobile && (
            <DetailRow label="Mobile" value={node.mobile} />
          )}
          {node.lastUpdated && (
            <DetailRow label="Last Updated" value={formatDate(node.lastUpdated, 'medium')} />
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            {node.status && <StatusPill status={node.status} />}
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Portfolio Value</Text>
            <Text style={styles.detailValueBold}>{formatINR(node.totalValue)}</Text>
          </View>
        </View>
      )}

      {/* Children (not accounts) */}
      {expanded && hasChildren && node.type !== 'account' &&
        node.children!.map((child) => (
          <SnapshotRow key={child.id} node={child} depth={depth + 1} />
        ))}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

type ViewMode = 'family' | 'individual';

function extractAccounts(node: SnapshotNode): SnapshotNode[] {
  if (node.type === 'account') return [node];
  return (node.children ?? []).flatMap(extractAccounts);
}

function AccountCard({ account }: { account: SnapshotNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.accountCard}>
      <TouchableOpacity
        style={styles.accountCardHeader}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.8}
      >
        <View style={styles.accountCardLeft}>
          <View style={[styles.dot, {
            backgroundColor: account.isClosed ? Colors.border : Colors.accentGold,
            width: 10, height: 10, borderRadius: 5,
          }]} />
          <View style={{ flex: 1 }}>
            <View style={styles.accountNameRow}>
              <Text style={styles.accountCardLabel} numberOfLines={1}>{account.label}</Text>
              {account.isClosed && (
                <View style={styles.closedBadge}>
                  <Text style={styles.closedBadgeText}>Closed</Text>
                </View>
              )}
              {!account.isClosed && account.accountType && (
                <Text style={styles.accountType}>{account.accountType}</Text>
              )}
            </View>
            {account.id && (
              <Text style={styles.accountCardId}>{account.id}</Text>
            )}
          </View>
        </View>
        <View style={styles.accountCardRight}>
          <Text style={[styles.nodeValue, account.isClosed && styles.nodeValueClosed]}>
            {account.isClosed ? '—' : formatINR(account.totalValue)}
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={Colors.textSecondary}
          />
        </View>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.accountCardDetail}>
          {account.clientId && <DetailRow label="Client ID" value={account.clientId} />}
          {account.email && <DetailRow label="Email" value={account.email} />}
          {account.mobile && <DetailRow label="Mobile" value={account.mobile} />}
          {account.lastUpdated && (
            <DetailRow label="Last Updated" value={formatDate(account.lastUpdated, 'medium')} />
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            {account.status && <StatusPill status={account.status} />}
          </View>
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailLabel}>Portfolio Value</Text>
            <Text style={styles.detailValueBold}>{formatINR(account.totalValue)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

export default function SnapshotScreen() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('family');
  const [refreshing, setRefreshing] = useState(false);
  const snapshot = usePortfolioSnapshot();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await snapshot.refetch();
    setRefreshing(false);
  }, [snapshot]);

  const countActiveAccounts = (node: SnapshotNode): number => {
    if (node.type === 'account') return (!node.isClosed && node.status !== 'closed') ? 1 : 0;
    return (node.children ?? []).reduce((sum, c) => sum + countActiveAccounts(c), 0);
  };

  const calcActiveTotal = (node: SnapshotNode): number => {
    if (node.type === 'account') return node.isClosed ? 0 : node.totalValue;
    return (node.children ?? []).reduce((sum, c) => sum + calcActiveTotal(c), 0);
  };

  const activeCount = snapshot.data ? countActiveAccounts(snapshot.data) : 0;
  const activeTotal = snapshot.data ? calcActiveTotal(snapshot.data) : 0;

  const allAccounts = snapshot.data ? extractAccounts(snapshot.data) : [];
  const filteredAccounts = allAccounts.filter((a) =>
    !search || a.label.toLowerCase().includes(search.toLowerCase()) || a.id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>My Portfolio Values</Text>
          <View style={styles.headerActions}>
            <StrategySelector />
          </View>
        </View>

        {/* View toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'family' && styles.toggleBtnActive]}
            onPress={() => setViewMode('family')}
          >
            <Ionicons name="git-network-outline" size={13} color={viewMode === 'family' ? Colors.white : Colors.textSecondary} />
            <Text style={[styles.toggleBtnText, viewMode === 'family' && styles.toggleBtnTextActive]}>Family View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'individual' && styles.toggleBtnActive]}
            onPress={() => setViewMode('individual')}
          >
            <Ionicons name="person-outline" size={13} color={viewMode === 'individual' ? Colors.white : Colors.textSecondary} />
            <Text style={[styles.toggleBtnText, viewMode === 'individual' && styles.toggleBtnTextActive]}>Individual</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search accounts..."
              placeholderTextColor={Colors.textSecondary}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

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
        {snapshot.isLoading && (
          <Text style={styles.loadingText}>Loading portfolio data...</Text>
        )}
        {snapshot.isError && (
          <TouchableOpacity onPress={() => snapshot.refetch()} style={styles.retryRow}>
            <Text style={styles.errorText}>Failed to load. Tap to retry.</Text>
          </TouchableOpacity>
        )}

        {/* Family View */}
        {viewMode === 'family' && snapshot.data && (
          <View style={styles.treeContainer}>
            <SnapshotRow node={snapshot.data} depth={0} />
          </View>
        )}

        {/* Individual View */}
        {viewMode === 'individual' && (
          <View style={styles.individualContainer}>
            {filteredAccounts.length === 0 && !snapshot.isLoading && (
              <Text style={styles.loadingText}>No accounts found.</Text>
            )}
            {filteredAccounts.map((acc) => (
              <AccountCard key={acc.id} account={acc} />
            ))}
          </View>
        )}

        {/* Summary card */}
        {snapshot.data && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Active Portfolio Value</Text>
            <Text style={styles.summaryValue}>{formatINR(activeTotal)}</Text>
            <Text style={styles.summaryAccounts}>{activeCount} Active Account{activeCount !== 1 ? 's' : ''}</Text>
          </View>
        )}

        {/* Family Account Mapping */}
        <TouchableOpacity
          style={styles.familyBtn}
          onPress={() => router.push('/(tabs)/experience/family' as any)}
          activeOpacity={0.85}
        >
          <View style={styles.familyBtnLeft}>
            <View style={styles.familyBtnIcon}>
              <Ionicons name="people-outline" size={20} color={Colors.primaryDark} />
            </View>
            <View>
              <Text style={styles.familyBtnTitle}>Family Account Mapping</Text>
              <Text style={styles.familyBtnSubtitle}>View group structure, owners & account details</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...Typography.H1,
    color: Colors.textPrimary,
  },
  ownerPill: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  ownerPillText: {
    ...Typography.Caption,
    color: Colors.white,
    fontFamily: 'Inter_600SemiBold',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  toggleBtnActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  toggleBtnText: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
  },
  toggleBtnTextActive: {
    color: Colors.white,
  },
  individualContainer: {
    padding: 16,
    gap: 10,
  },
  accountCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  accountCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    gap: 10,
  },
  accountCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  accountNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  accountCardLabel: {
    ...Typography.Body,
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  accountCardId: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  accountCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accountCardDetail: {
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    ...Typography.Body,
    color: Colors.textPrimary,
  },
  treeContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    margin: 16,
    ...cardShadow,
    overflow: 'hidden',
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingRight: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  nodeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
    marginRight: 8,
  },
  chevron: {
    width: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nodeLabel: {
    ...Typography.BodySmall,
    color: Colors.textPrimary,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  accountType: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    backgroundColor: Colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  closedBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  closedBadgeText: {
    ...Typography.Caption,
    color: '#6B7280',
    fontFamily: 'Inter_600SemiBold',
  },
  nodeValueClosed: {
    color: Colors.textSecondary,
  },
  nodeValue: {
    ...Typography.BodySmall,
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  detailCard: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    margin: 8,
    marginLeft: 0,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLabel: {
    ...Typography.Caption,
    color: Colors.textSecondary,
  },
  detailValue: {
    ...Typography.Caption,
    color: Colors.textPrimary,
    fontFamily: 'Inter_500Medium',
  },
  detailValueBold: {
    ...Typography.BodySmall,
    color: Colors.primaryDark,
    fontFamily: 'Inter_700Bold',
  },
  loadingText: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 32,
  },
  retryRow: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    ...Typography.BodySmall,
    color: Colors.negative,
  },
  summaryCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    alignItems: 'center',
  },
  summaryLabel: {
    ...Typography.BodySmall,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  summaryValue: {
    ...Typography.NumberLarge,
    color: Colors.accentGold,
    fontSize: 28,
    marginBottom: 6,
  },
  summaryAccounts: {
    ...Typography.BodySmall,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Inter_500Medium',
  },
  familyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 14,
    ...cardShadow,
  },
  familyBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  familyBtnIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  familyBtnTitle: {
    ...Typography.Body,
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  familyBtnSubtitle: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
