import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { adminApi, AdminClient, AdminClientAccount } from '@/api/admin';
import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';

type StatusFilter = 'all' | 'completed' | 'pending' | 'mixed';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'completed', label: 'Completed' },
  { key: 'pending', label: 'Pending' },
  { key: 'mixed', label: 'Mixed' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  completed: { label: '✓ Active', color: '#15803d', bg: '#dcfce7' },
  pending:   { label: '⏳ Pending', color: '#b45309', bg: '#fef3c7' },
  mixed:     { label: '◑ Mixed', color: '#1d4ed8', bg: '#dbeafe' },
};

function formatLastLogin(iso: string | null | undefined): string {
  if (!iso) return 'Never';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

function getInitials(name: string): string {
  return (name ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase() || '?';
}

interface AccountPickerProps {
  client: AdminClient;
  onSelect: (clientCode: string) => void;
  onClose: () => void;
  isLoading: boolean;
}

function AccountPickerModal({ client, onSelect, onClose, isLoading }: AccountPickerProps) {
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.pickerSheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.pickerHandle} />
          <Text style={styles.pickerTitle}>Select Account to View</Text>
          <Text style={styles.pickerSubtitle}>{client.ownerName}</Text>

          <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
            {/* Head of family option */}
            <TouchableOpacity
              style={styles.pickerRow}
              onPress={() => onSelect(client.headClientCode)}
              disabled={isLoading}
              activeOpacity={0.75}
            >
              <View style={styles.pickerRowLeft}>
                <View style={[styles.pickerIconBox, { backgroundColor: Colors.primaryDark + '15' }]}>
                  <Ionicons name="people" size={16} color={Colors.primaryDark} />
                </View>
                <View style={styles.pickerRowInfo}>
                  <Text style={styles.pickerRowTitle}>All Accounts (Head of Family)</Text>
                  <Text style={styles.pickerRowSub}>
                    {client.headClientCode} · Access to all {client.totalAccounts} accounts
                  </Text>
                </View>
              </View>
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.primaryDark} />
              ) : (
                <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
              )}
            </TouchableOpacity>

            {/* Individual accounts */}
            {(client.accounts ?? []).map((acc) => (
              <TouchableOpacity
                key={acc.clientCode}
                style={styles.pickerRow}
                onPress={() => onSelect(acc.clientCode)}
                disabled={isLoading}
                activeOpacity={0.75}
              >
                <View style={styles.pickerRowLeft}>
                  <View style={[styles.pickerIconBox, { backgroundColor: Colors.accentGold + '15' }]}>
                    <Ionicons name="person" size={16} color={Colors.accentGold} />
                  </View>
                  <View style={styles.pickerRowInfo}>
                    <Text style={styles.pickerRowTitle}>{acc.clientCode}</Text>
                    <Text style={styles.pickerRowSub}>
                      {acc.isHeadOfFamily ? 'Head of Family · ' : ''}
                      {acc.loginCount ?? 0} logins
                      {acc.lastLogin ? ` · Last: ${formatLastLogin(acc.lastLogin)}` : ''}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.pickerCancel} onPress={onClose}>
            <Text style={styles.pickerCancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function AdminMasterScreen() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pickerClient, setPickerClient] = useState<AdminClient | null>(null);
  const [impersonatingCode, setImpersonatingCode] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const startImpersonation = useAuthStore((s) => s.startImpersonation);
  const adminUser = useAuthStore((s) => s.user);

  // Debounce search → send to server
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-clients', debouncedSearch],
    queryFn: () => adminApi.getClients({ search: debouncedSearch || undefined }),
  });

  const clients = data?.clients ?? [];
  const total = data?.pagination?.total ?? clients.length;

  const filtered = statusFilter === 'all'
    ? clients
    : clients.filter((c) => c.onboardingStatus === statusFilter);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleViewAs = async (clientCode: string) => {
    setPickerClient(null);
    setImpersonatingCode(clientCode);
    try {
      const res = await adminApi.impersonate(clientCode);
      await startImpersonation(res.user, res.token);
      router.replace('/(tabs)/portfolio');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Failed to impersonate client.');
    } finally {
      setImpersonatingCode(null);
    }
  };

  const handleClientPress = (client: AdminClient) => {
    if (!client.accountCodes?.length) return;
    if ((client.accounts?.length ?? 0) > 1) {
      setPickerClient(client);
    } else {
      handleViewAs(client.headClientCode);
    }
  };

  const renderClient = ({ item }: { item: AdminClient }) => {
    const isExpanded = expandedId === item.ownerId;
    const isImpersonating = impersonatingCode === item.headClientCode;
    const statusCfg = STATUS_CONFIG[item.onboardingStatus ?? ''];
    const hasNoAccounts = !item.accountCodes?.length;
    const multiAccount = (item.accounts?.length ?? 0) > 1;

    return (
      <View style={styles.clientCard}>
        {/* Card header row */}
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => setExpandedId(isExpanded ? null : item.ownerId)}
          activeOpacity={0.75}
        >
          <View style={styles.clientAvatar}>
            <Text style={styles.clientAvatarText}>{getInitials(item.ownerName)}</Text>
          </View>

          <View style={styles.clientInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.clientName} numberOfLines={1}>{item.ownerName}</Text>
              {statusCfg ? (
                <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                  <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.clientEmail} numberOfLines={1}>{item.email}</Text>

            {/* Account code chips */}
            <View style={styles.chipsRow}>
              {(item.accountCodes ?? []).map((code) => (
                <View key={code} style={styles.chip}>
                  <Text style={styles.chipText}>{code}</Text>
                </View>
              ))}
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <Ionicons name="log-in-outline" size={11} color={Colors.textSecondary} />
              <Text style={styles.statText}>{item.loginCount ?? 0} logins</Text>
              <Text style={styles.statDot}>·</Text>
              <Ionicons name="time-outline" size={11} color={Colors.textSecondary} />
              <Text style={styles.statText}>{formatLastLogin(item.lastLogin)}</Text>
            </View>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.viewBtn, (isImpersonating || hasNoAccounts) && styles.viewBtnDisabled]}
              onPress={() => handleClientPress(item)}
              disabled={isImpersonating || hasNoAccounts || impersonatingCode !== null}
              activeOpacity={0.8}
            >
              {isImpersonating ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.viewBtnText}>{multiAccount ? 'Select' : 'View'}</Text>
              )}
            </TouchableOpacity>
            {(item.accounts?.length ?? 0) > 0 ? (
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={Colors.textSecondary}
                style={styles.expandIcon}
              />
            ) : null}
          </View>
        </TouchableOpacity>

        {/* Expanded accounts */}
        {isExpanded && (item.accounts ?? []).length > 0 ? (
          <View style={styles.accountsList}>
            {item.accounts!.map((acc, i) => (
              <View key={acc.clientCode} style={[styles.accountRow, i > 0 && styles.accountRowBorder]}>
                <View style={styles.accountLeft}>
                  <Text style={styles.accountCode}>{acc.clientCode}</Text>
                  {acc.isHeadOfFamily ? (
                    <View style={styles.headBadge}>
                      <Text style={styles.headBadgeText}>Head</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.accountStat}>{acc.loginCount ?? 0} logins · {formatLastLogin(acc.lastLogin)}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Console</Text>
          <Text style={styles.headerSub}>{adminUser?.email} · {total} clients</Text>
        </View>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={14} color={Colors.accentGold} />
          <Text style={styles.adminBadgeText}>Super Admin</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, code..."
          placeholderTextColor={Colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
        {isLoading && debouncedSearch ? (
          <ActivityIndicator size="small" color={Colors.textSecondary} />
        ) : null}
      </View>

      {/* Status filter pills */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterPill, statusFilter === f.key && styles.filterPillActive]}
              onPress={() => setStatusFilter(f.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterText, statusFilter === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {isLoading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primaryDark} />
          <Text style={styles.loadingText}>Loading clients...</Text>
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={40} color={Colors.negative} />
          <Text style={styles.errorText}>Failed to load clients</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.ownerId}
          renderItem={renderClient}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primaryDark} />}
          ListHeaderComponent={
            <Text style={styles.countLabel}>
              {filtered.length}{statusFilter !== 'all' ? ` ${statusFilter}` : ''} client{filtered.length !== 1 ? 's' : ''}
              {debouncedSearch ? ` for "${debouncedSearch}"` : ''}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={40} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>
                {search ? `No clients found for "${search}"` : 'No clients found'}
              </Text>
            </View>
          }
        />
      )}

      {/* Account picker bottom sheet */}
      {pickerClient ? (
        <AccountPickerModal
          client={pickerClient}
          onSelect={handleViewAs}
          onClose={() => setPickerClient(null)}
          isLoading={impersonatingCode !== null}
        />
      ) : null}
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
    alignItems: 'flex-start',
  },
  headerTitle: { ...Typography.H1, color: Colors.textPrimary },
  headerSub: { ...Typography.Caption, color: Colors.textSecondary, marginTop: 2 },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accentGold + '18',
    borderWidth: 1,
    borderColor: Colors.accentGold + '44',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  adminBadgeText: {
    ...Typography.Caption,
    color: Colors.accentGold,
    fontFamily: 'Inter_600SemiBold',
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    ...Typography.Body,
    color: Colors.textPrimary,
    paddingVertical: 10,
  },

  filterContainer: {
    height: 44,
    overflow: 'hidden',
  },
  filterRow: {
    paddingHorizontal: 16,
    height: 44,
    alignItems: 'center',
    gap: 8,
  },
  filterPill: {
    height: 30,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterPillActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  filterText: { ...Typography.Caption, color: Colors.textSecondary, fontFamily: 'Inter_500Medium' },
  filterTextActive: { color: Colors.white },

  list: { padding: 16, gap: 10, paddingBottom: 40 },

  countLabel: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },

  clientCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 10,
  },
  clientAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  clientAvatarText: {
    ...Typography.BodySmall,
    color: Colors.white,
    fontFamily: 'Inter_700Bold',
  },
  clientInfo: { flex: 1, gap: 3, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  clientName: {
    ...Typography.Body,
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  clientEmail: { ...Typography.Caption, color: Colors.textSecondary },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  chip: {
    backgroundColor: Colors.primaryDark + '12',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chipText: {
    fontSize: 10,
    color: Colors.primaryDark,
    fontFamily: 'Inter_600SemiBold',
  },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  statText: { ...Typography.Caption, color: Colors.textSecondary, fontSize: 10 },
  statDot: { ...Typography.Caption, color: Colors.textSecondary, fontSize: 10 },

  cardActions: { alignItems: 'center', gap: 6, flexShrink: 0 },
  viewBtn: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewBtnDisabled: { opacity: 0.4 },
  viewBtnText: {
    ...Typography.Caption,
    color: Colors.white,
    fontFamily: 'Inter_600SemiBold',
  },
  expandIcon: { marginTop: 2 },

  accountsList: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  accountRowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  accountLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  accountCode: { ...Typography.BodySmall, color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
  headBadge: {
    backgroundColor: Colors.primaryDark + '15',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  headBadgeText: { fontSize: 9, color: Colors.primaryDark, fontFamily: 'Inter_600SemiBold' },
  accountStat: { ...Typography.Caption, color: Colors.textSecondary, fontSize: 10 },

  // Modal / picker
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 36,
    maxHeight: '70%',
  },
  pickerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  pickerTitle: {
    ...Typography.H2,
    color: Colors.textPrimary,
    paddingHorizontal: 20,
  },
  pickerSubtitle: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    paddingHorizontal: 20,
    marginTop: 2,
    marginBottom: 12,
  },
  pickerScroll: { flexGrow: 0 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  pickerRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  pickerIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  pickerRowInfo: { flex: 1 },
  pickerRowTitle: {
    ...Typography.Body,
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  pickerRowSub: { ...Typography.Caption, color: Colors.textSecondary, marginTop: 1 },
  pickerCancel: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  pickerCancelText: {
    ...Typography.Body,
    color: Colors.textSecondary,
    fontFamily: 'Inter_500Medium',
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  loadingText: { ...Typography.Body, color: Colors.textSecondary },
  errorText: { ...Typography.Body, color: Colors.negative },
  emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { ...Typography.Body, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { ...Typography.Body, color: Colors.white, fontFamily: 'Inter_600SemiBold' },
});
