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
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';
import { usePortfolioSnapshot } from '@/hooks/usePortfolio';
import { SnapshotNode } from '@/api/portfolio';
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
          {node.type === 'account' && node.accountType && (
            <Text style={styles.accountType}>{node.accountType}</Text>
          )}
        </View>
        <Text style={styles.nodeValue}>{formatINR(node.totalValue)}</Text>
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

export default function SnapshotScreen() {
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const snapshot = usePortfolioSnapshot();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await snapshot.refetch();
    setRefreshing(false);
  }, [snapshot]);

  const countActiveAccounts = (node: SnapshotNode): number => {
    if (node.type === 'account') return node.status === 'active' ? 1 : 0;
    return (node.children ?? []).reduce((sum, c) => sum + countActiveAccounts(c), 0);
  };

  const activeCount = snapshot.data ? countActiveAccounts(snapshot.data) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>My Portfolio Values</Text>
          <View style={styles.ownerPill}>
            <Text style={styles.ownerPillText}>Owner Portfolio</Text>
          </View>
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
        <View style={styles.treeContainer}>
          {snapshot.isLoading && (
            <Text style={styles.loadingText}>Loading portfolio data...</Text>
          )}
          {snapshot.isError && (
            <TouchableOpacity onPress={() => snapshot.refetch()} style={styles.retryRow}>
              <Text style={styles.errorText}>Failed to load. Tap to retry.</Text>
            </TouchableOpacity>
          )}
          {snapshot.data && <SnapshotRow node={snapshot.data} depth={0} />}
        </View>

        {/* Summary card */}
        {snapshot.data && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Portfolio Value</Text>
            <Text style={styles.summaryValue}>{formatINR(snapshot.data.totalValue)}</Text>
            <Text style={styles.summaryAccounts}>{activeCount} Active Accounts</Text>
          </View>
        )}
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
    gap: 10,
    marginBottom: 12,
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
});
