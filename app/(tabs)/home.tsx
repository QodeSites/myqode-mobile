import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';
import { usePortfolioSnapshot } from '@/hooks/usePortfolio';
import { useAuthStore } from '@/store/authStore';
import { SnapshotNode } from '@/api/portfolio';
import { formatINR } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
type StatusType = 'active' | 'closed' | 'pending' | 'dormant' | string;
type FilterStatus = 'All' | 'Active' | 'Closed';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active:  { bg: '#D1FAE5', text: '#065F46' },
  closed:  { bg: '#F3F4F6', text: '#6B7280' },
  pending: { bg: '#FEF3C7', text: '#92400E' },
  dormant: { bg: '#F3F4F6', text: '#6B7280' },
};

function statusStyle(status: StatusType) {
  return STATUS_COLORS[status?.toLowerCase()] ?? STATUS_COLORS.closed;
}

function statusLabel(status: StatusType) {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function goToPortfolio(
  action: () => void,
) {
  action();
  router.push('/(tabs)/portfolio' as any);
}

/* ─────────────────────────────────────────────
   Status Badge
───────────────────────────────────────────── */
function StatusBadge({ status }: { status: StatusType }) {
  const s = statusStyle(status);
  return (
    <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
      <Text style={[styles.statusBadgeText, { color: s.text }]}>{statusLabel(status)}</Text>
    </View>
  );
}

/* ─────────────────────────────────────────────
   Account Row (inside an owner card or flat)
───────────────────────────────────────────── */
function AccountRow({
  account,
  onNavigate,
  isLast = false,
}: {
  account: SnapshotNode;
  onNavigate: () => void;
  isLast?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const dotColor = account.strategyColor ?? Colors.accentGold;

  return (
    <View style={[styles.accountRow, isLast && styles.accountRowLast]}>
      <TouchableOpacity
        style={styles.accountRowHeader}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.7}
      >
        <View style={[styles.strategyDot, { backgroundColor: account.isClosed ? Colors.border : dotColor }]} />
        <View style={styles.accountRowMid}>
          <View style={styles.accountRowTitleLine}>
            <Text style={styles.accountCode}>{account.id}</Text>
            {account.isClosed && (
              <View style={styles.closedBadge}><Text style={styles.closedBadgeText}>Closed</Text></View>
            )}
          </View>
          <Text style={styles.strategyName} numberOfLines={1}>{account.label}</Text>
          {account.lastUpdated && !account.isClosed && (
            <Text style={styles.accountMeta}>Updated: {formatDate(account.lastUpdated, 'short')}</Text>
          )}
        </View>
        <View style={styles.accountRowRight}>
          {account.isClosed ? (
            <Text style={styles.accountValueClosed}>—</Text>
          ) : (
            <Text style={styles.accountValue}>{formatINR(account.totalValue, 0)}</Text>
          )}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={13}
            color={Colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.accountDetail}>
          <View style={styles.detailGrid}>
            {account.clientId && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Client ID</Text>
                <Text style={styles.detailValue}>{account.clientId}</Text>
              </View>
            )}
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Status</Text>
              <StatusBadge status={account.status ?? 'unknown'} />
            </View>
            {account.mobile && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Mobile</Text>
                <Text style={styles.detailValue}>{account.mobile}</Text>
              </View>
            )}
            {account.lastUpdated && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Last Updated</Text>
                <Text style={styles.detailValue}>{formatDate(account.lastUpdated, 'medium')}</Text>
              </View>
            )}
            <View style={[styles.detailItem, styles.detailItemFull]}>
              <Text style={styles.detailLabel}>Portfolio Value</Text>
              <Text style={styles.detailValueBold}>
                {account.isClosed ? '—' : formatINR(account.totalValue, 0)}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.viewDetailBtn} onPress={onNavigate}>
            <Text style={styles.viewDetailBtnText}>View Portfolio Details</Text>
            <Ionicons name="arrow-forward" size={13} color={Colors.primaryDark} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/* ─────────────────────────────────────────────
   Owner Card (head-of-family view)
───────────────────────────────────────────── */
function OwnerCard({
  owner,
  onAllStrategies,
  onAccount,
}: {
  owner: SnapshotNode;
  onAllStrategies: () => void;
  onAccount: (account: SnapshotNode) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const accounts = owner.children ?? [];
  const hasMultipleAccounts = accounts.length > 1;

  return (
    <View style={styles.ownerCard}>
      {/* Owner header */}
      <TouchableOpacity
        style={styles.ownerHeader}
        onPress={() => setCollapsed((v) => !v)}
        activeOpacity={0.7}
      >
        <View style={styles.ownerHeaderLeft}>
          <View style={styles.ownerDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.ownerName}>{owner.label}</Text>
            <Text style={styles.ownerMeta}>
              {accounts.length} account{accounts.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <View style={styles.ownerHeaderRight}>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.ownerValue}>{formatINR(owner.totalValue, 0)}</Text>
            <Text style={styles.ownerValueLabel}>Owner Total</Text>
          </View>
          <Ionicons
            name={collapsed ? 'chevron-forward' : 'chevron-down'}
            size={16}
            color={Colors.textSecondary}
            style={{ marginLeft: 8 }}
          />
        </View>
      </TouchableOpacity>

      {/* Accounts */}
      {!collapsed && (
        <View style={styles.ownerBody}>
          {hasMultipleAccounts && (
            <TouchableOpacity style={styles.allStrategiesBtn} onPress={onAllStrategies}>
              <Text style={styles.allStrategiesBtnText}>All Strategies</Text>
              <Ionicons name="arrow-forward" size={13} color={Colors.primaryDark} />
            </TouchableOpacity>
          )}
          {accounts.map((acc, i) => (
            <AccountRow
              key={acc.id}
              account={acc}
              onNavigate={() => onAccount(acc)}
              isLast={i === accounts.length - 1}
            />
          ))}
        </View>
      )}
    </View>
  );
}

/* ─────────────────────────────────────────────
   Main Screen
───────────────────────────────────────────── */
const FILTER_OPTIONS: FilterStatus[] = ['All', 'Active', 'Closed'];

export default function HomeScreen() {
  const setSelectedAccount = useAuthStore((s) => s.setSelectedAccount);
  const setScopeOwner = useAuthStore((s) => s.setScopeOwner);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('All');
  const [refreshing, setRefreshing] = useState(false);

  const snapshot = usePortfolioSnapshot();
  const root = snapshot.data;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await snapshot.refetch();
    setRefreshing(false);
  }, [snapshot]);

  const isHeadOfFamily = root?.isHeadOfFamily ?? false;
  const groupId = root?.groupId ?? null;
  const owners = root?.children?.filter((n) => n.type === 'person') ?? [];

  // Family total card: show only if head of family + groupId + multiple owners
  const showFamilyTotal = isHeadOfFamily && !!groupId && owners.length > 1;

  // Total portfolio value
  const totalValue = root?.totalValue ?? 0;
  const allAccounts = useMemo(() => owners.flatMap((o) => o.children ?? []), [owners]);
  const activeCount = allAccounts.filter((a) => !a.isClosed && a.status !== 'closed').length;

  // Filter owners/accounts by search + status
  const filteredOwners = useMemo(() => {
    const q = search.trim().toLowerCase();
    return owners
      .map((owner) => {
        const matchingAccounts = (owner.children ?? []).filter((acc) => {
          const matchesSearch =
            !q ||
            acc.id?.toLowerCase().includes(q) ||
            acc.label?.toLowerCase().includes(q) ||
            owner.label?.toLowerCase().includes(q);
          const isAccountActive = (acc.totalValue ?? 0) > 0;
          const matchesStatus =
            statusFilter === 'All' ||
            (statusFilter === 'Active' && isAccountActive) ||
            (statusFilter === 'Closed' && !isAccountActive);
          return matchesSearch && matchesStatus;
        });
        return { ...owner, children: matchingAccounts };
      })
      .filter((owner) => owner.children.length > 0);
  }, [owners, search, statusFilter]);

  // For non-head users: flat list of accounts (all owners merged)
  const flatAccounts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allAccounts.filter((acc) => {
      const matchesSearch =
        !q ||
        acc.id?.toLowerCase().includes(q) ||
        acc.label?.toLowerCase().includes(q);
      const isAccountActive = (acc.totalValue ?? 0) > 0;
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && isAccountActive) ||
        (statusFilter === 'Closed' && !isAccountActive);
      return matchesSearch && matchesStatus;
    });
  }, [allAccounts, search, statusFilter]);

  const handleFamilyDetail = () =>
    goToPortfolio(() => setSelectedAccount(groupId!));

  const handleOwnerAllStrategies = (owner: SnapshotNode) =>
    goToPortfolio(() =>
      setScopeOwner(owner.id, (owner.children ?? []).map((a) => a.id))
    );

  const handleAccountTap = (account: SnapshotNode) =>
    goToPortfolio(() => setSelectedAccount(account.id));

  if (snapshot.isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Portfolio Overview</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading portfolio data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (snapshot.isError) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Portfolio Overview</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Failed to load portfolio data.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => snapshot.refetch()}>
            <Text style={styles.retryBtnText}>Tap to Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>
            {isHeadOfFamily ? 'Family Portfolio' : 'My Portfolio'}
          </Text>
          {isHeadOfFamily ? (
            <View style={styles.roleBadge}>
              <Ionicons name="star" size={11} color="#1D4ED8" />
              <Text style={styles.roleBadgeText}>Head of Family</Text>
            </View>
          ) : (
            <View style={[styles.roleBadge, styles.roleBadgeOwner]}>
              <Ionicons name="person" size={11} color={Colors.textSecondary} />
              <Text style={[styles.roleBadgeText, { color: Colors.textSecondary }]}>Owner Portfolio</Text>
            </View>
          )}
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={isHeadOfFamily ? 'Search family portfolios...' : 'Search accounts...'}
            placeholderTextColor={Colors.textSecondary}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Status filters */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {FILTER_OPTIONS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterPill, statusFilter === f && styles.filterPillActive]}
                onPress={() => setStatusFilter(f)}
              >
                <Text style={[styles.filterPillText, statusFilter === f && styles.filterPillTextActive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accentGreen}
          />
        }
      >
        {/* Family Total Card */}
        {showFamilyTotal && (
          <View style={styles.familyTotalCard}>
            <View style={styles.familyTotalLeft}>
              <View style={styles.familyTotalDot} />
              <View>
                <Text style={styles.familyTotalTitle}>Total Portfolio Value</Text>
                <Text style={styles.familyTotalSub}>
                  {Object.keys(owners).length} owners · {activeCount} active account{activeCount !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <View style={styles.familyTotalRight}>
              <Text style={styles.familyTotalValue}>{formatINR(totalValue, 0)}</Text>
              <TouchableOpacity style={styles.viewDetailsBtn} onPress={handleFamilyDetail}>
                <Text style={styles.viewDetailsBtnText}>View Details</Text>
                <Ionicons name="arrow-forward" size={13} color={Colors.primaryDark} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Head-of-family: owner cards */}
        {isHeadOfFamily && (
          <>
            {filteredOwners.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={40} color={Colors.border} />
                <Text style={styles.emptyStateText}>No accounts match your search.</Text>
              </View>
            ) : (
              filteredOwners.map((owner) => (
                <OwnerCard
                  key={owner.id}
                  owner={owner as SnapshotNode}
                  onAllStrategies={() => handleOwnerAllStrategies(owner as SnapshotNode)}
                  onAccount={handleAccountTap}
                />
              ))
            )}
          </>
        )}

        {/* Non-head: flat account cards */}
        {!isHeadOfFamily && (
          <>
            {flatAccounts.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={40} color={Colors.border} />
                <Text style={styles.emptyStateText}>No accounts match your search.</Text>
              </View>
            ) : (
              <View style={styles.flatCardList}>
                {flatAccounts.map((acc, i) => (
                  <View key={acc.id} style={styles.flatCard}>
                    <AccountRow
                      account={acc}
                      onNavigate={() => handleAccountTap(acc)}
                      isLast={i === flatAccounts.length - 1}
                    />
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Summary Footer Card */}
        {root && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <Text style={styles.summaryTitle}>
                {isHeadOfFamily ? 'Total Family Portfolio' : 'Total Portfolio Value'}
              </Text>
              <Text style={styles.summarySub}>
                {isHeadOfFamily
                  ? 'Combined value across all family accounts'
                  : 'Combined value across all your accounts'}
              </Text>
            </View>
            <View style={styles.summaryRight}>
              <Text style={styles.summaryValue}>{formatINR(totalValue, 0)}</Text>
              <Text style={styles.summaryActiveCount}>
                {activeCount} Active Account{activeCount !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─────────────────────────────────────────────
   Styles
───────────────────────────────────────────── */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
  },
  errorText: {
    ...Typography.Body,
    color: Colors.negative,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  retryBtnText: {
    ...Typography.Body,
    color: Colors.primaryDark,
    fontFamily: 'Inter_600SemiBold',
  },

  // Header
  header: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    ...Typography.H1,
    color: Colors.textPrimary,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  roleBadgeOwner: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
  },
  roleBadgeText: {
    ...Typography.Caption,
    color: '#1D4ED8',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    height: 38,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    ...Typography.BodySmall,
    color: Colors.textPrimary,
  },
  filterContainer: {
    height: 36,
    overflow: 'hidden',
  },
  filterScrollContent: {
    alignItems: 'center',
    height: 36,
    paddingRight: 4,
    // Centre the 32px pills within the 36px scroll row
    paddingVertical: 2,
  },
  filterPill: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterPillActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  filterPillText: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
  },
  filterPillTextActive: {
    color: Colors.white,
  },

  // Scroll
  scrollContent: {
    padding: 16,
    gap: 12,
  },

  // Family Total Card
  familyTotalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...cardShadow,
  },
  familyTotalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  familyTotalDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
  },
  familyTotalTitle: {
    ...Typography.Body,
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  familyTotalSub: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  familyTotalRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  familyTotalValue: {
    ...Typography.H2,
    color: Colors.primaryDark,
    fontFamily: 'Inter_700Bold',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  viewDetailsBtnText: {
    ...Typography.Caption,
    color: Colors.primaryDark,
    fontFamily: 'Inter_600SemiBold',
  },

  // Owner Card
  ownerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  ownerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  ownerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  ownerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accentGreen,
  },
  ownerName: {
    ...Typography.Body,
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  ownerMeta: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  ownerHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerValue: {
    ...Typography.Body,
    color: Colors.primaryDark,
    fontFamily: 'Inter_700Bold',
  },
  ownerValueLabel: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    marginTop: 1,
    textAlign: 'right',
  },
  ownerBody: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  allStrategiesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  allStrategiesBtnText: {
    ...Typography.Caption,
    color: Colors.primaryDark,
    fontFamily: 'Inter_600SemiBold',
  },

  // Account Row
  accountRow: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  accountRowLast: {
    borderBottomWidth: 0,
  },
  accountRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  strategyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  accountRowMid: {
    flex: 1,
    gap: 2,
  },
  accountRowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accountCode: {
    ...Typography.BodySmall,
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  strategyName: {
    ...Typography.Caption,
    color: Colors.textSecondary,
  },
  accountMeta: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  accountRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  accountValue: {
    ...Typography.BodySmall,
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  accountValueClosed: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
  },
  closedBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  closedBadgeText: {
    ...Typography.Caption,
    color: '#6B7280',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },

  // Account Detail (expanded)
  accountDetail: {
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
  },
  detailItem: {
    width: '47%',
    gap: 3,
  },
  detailItemFull: {
    width: '100%',
  },
  detailLabel: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    fontSize: 10,
  },
  detailValue: {
    ...Typography.Caption,
    color: Colors.textPrimary,
    fontFamily: 'Inter_500Medium',
  },
  detailValueBold: {
    ...Typography.Body,
    color: Colors.primaryDark,
    fontFamily: 'Inter_700Bold',
  },
  viewDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 8,
    marginTop: 4,
  },
  viewDetailBtnText: {
    ...Typography.Caption,
    color: Colors.primaryDark,
    fontFamily: 'Inter_600SemiBold',
  },

  // Status badge
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },

  // Flat card list (non-head)
  flatCardList: {
    gap: 10,
  },
  flatCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...cardShadow,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyStateText: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 14,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  summaryLeft: {
    flex: 1,
    gap: 4,
  },
  summaryTitle: {
    ...Typography.Body,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Inter_600SemiBold',
  },
  summarySub: {
    ...Typography.Caption,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 16,
  },
  summaryRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.accentGold,
  },
  summaryActiveCount: {
    ...Typography.Caption,
    color: 'rgba(255,255,255,0.7)',
  },
});
