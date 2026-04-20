import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';
import { familyApi, FamilyGroup, FamilyOwner, FamilyAccount } from '@/api/family';
import { useAuthStore } from '@/store/authStore';

type StatusFilter = 'All' | 'Active' | 'Pending KYC' | 'Dormant';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Active: { bg: Colors.lightGreen, text: Colors.positive },
  'Pending KYC': { bg: '#FEF9C3', text: '#B45309' },
  Dormant: { bg: Colors.lightRed, text: Colors.negative },
};

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] ?? { bg: Colors.border, text: Colors.textSecondary };
  return (
    <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.statusText, { color: colors.text }]}>{status}</Text>
    </View>
  );
}

function AccountRow({ account }: { account: FamilyAccount }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.accountRow}>
      <TouchableOpacity style={styles.accountHeader} onPress={() => setExpanded((v) => !v)} activeOpacity={0.75}>
        <View style={styles.accountLeft}>
          <View style={styles.accountIconBox}>
            <Ionicons
              name={account.head_of_family ? 'shield-checkmark' : 'person-outline'}
              size={14}
              color={account.head_of_family ? Colors.primaryDark : Colors.textSecondary}
            />
          </View>
          <View>
            <View style={styles.accountNameRow}>
              <Text style={styles.accountName}>{account.holderName}</Text>
              {account.head_of_family && (
                <View style={styles.headBadge}>
                  <Ionicons name="ribbon" size={10} color="#1D4ED8" />
                  <Text style={styles.headBadgeText}>Head</Text>
                </View>
              )}
            </View>
            <Text style={styles.clientCode}>{account.clientcode} · {account.relation}</Text>
          </View>
        </View>
        <View style={styles.accountRight}>
          <StatusBadge status={account.status} />
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textSecondary} />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.accountDetail}>
          {account.email ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{account.email}</Text>
            </View>
          ) : null}
          {account.mobile ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mobile</Text>
              <Text style={styles.detailValue}>{account.mobile}</Text>
            </View>
          ) : null}
          {account.city || account.state ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{[account.city, account.state].filter(Boolean).join(', ')}</Text>
            </View>
          ) : null}
          {account.clientid ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Client ID</Text>
              <Text style={styles.detailValue}>{account.clientid}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

function OwnerSection({ owner }: { owner: FamilyOwner }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <View style={styles.ownerSection}>
      <TouchableOpacity style={styles.ownerHeader} onPress={() => setExpanded((v) => !v)} activeOpacity={0.75}>
        <View style={styles.ownerLeft}>
          <Ionicons name="person-circle-outline" size={18} color={Colors.primaryDark} />
          <View>
            <Text style={styles.ownerName}>{owner.ownerName}</Text>
            <Text style={styles.ownerEmail}>{owner.ownerEmail}</Text>
          </View>
        </View>
        <View style={styles.ownerRight}>
          <View style={styles.ownerBadge}>
            <Text style={styles.ownerBadgeText}>Account Owner</Text>
          </View>
          <Text style={styles.accountCount}>{owner.accountCount} acct{owner.accountCount !== 1 ? 's' : ''}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textSecondary} />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.accountsList}>
          {owner.accounts.map((acc) => (
            <AccountRow key={acc.clientcode} account={acc} />
          ))}
        </View>
      )}
    </View>
  );
}

function GroupSection({ group }: { group: FamilyGroup }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <View style={styles.groupCard}>
      <TouchableOpacity style={styles.groupHeader} onPress={() => setExpanded((v) => !v)} activeOpacity={0.75}>
        <View style={styles.groupLeft}>
          <Ionicons name="people-outline" size={18} color={Colors.primaryDark} />
          <View>
            <Text style={styles.groupName}>{group.groupName}</Text>
            <Text style={styles.groupMeta}>{group.groupId} · {group.groupEmail}</Text>
          </View>
        </View>
        <View style={styles.groupRight}>
          <Text style={styles.groupCount}>{group.totalAccounts} accounts</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textSecondary} />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.ownersList}>
          {group.owners.map((owner) => (
            <OwnerSection key={owner.ownerId} owner={owner} />
          ))}
        </View>
      )}
    </View>
  );
}

export default function FamilyScreen() {
  const selectedAccountId = useAuthStore((s) => s.selectedAccountId);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [filterVisible, setFilterVisible] = useState(false);
  const [requestVisible, setRequestVisible] = useState(false);
  const [message, setMessage] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['family'],
    queryFn: familyApi.getFamily,
    staleTime: 10 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: familyApi.submitAccountRequest,
    onSuccess: () => {
      setRequestVisible(false);
      setMessage('');
      Alert.alert('Request Submitted', 'Your request has been received. Our team will get back to you.');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    },
  });

  const isHead = data?.isHeadOfFamily ?? false;

  const filteredTree = useMemo(() => {
    if (!data?.tree) return [];
    const q = search.toLowerCase().trim();
    return data.tree
      .map((group) => ({
        ...group,
        owners: group.owners
          .map((owner) => ({
            ...owner,
            accounts: owner.accounts.filter((acc) => {
              const matchStatus = statusFilter === 'All' || acc.status === statusFilter;
              const matchSearch =
                !q ||
                acc.holderName.toLowerCase().includes(q) ||
                acc.clientcode.toLowerCase().includes(q) ||
                acc.email?.toLowerCase().includes(q) ||
                group.groupName.toLowerCase().includes(q) ||
                owner.ownerName.toLowerCase().includes(q);
              return matchStatus && matchSearch;
            }),
          }))
          .filter((owner) => owner.accounts.length > 0),
      }))
      .filter((group) => group.owners.length > 0);
  }, [data, search, statusFilter]);

  const handleSubmit = () => {
    if (!message.trim()) return;
    mutation.mutate({ accountId: selectedAccountId ?? '', message: message.trim() });
  };

  const requestOptions = isHead
    ? [
        'Merge multiple accounts under one family head',
        'Reassign accounts to a different owner',
        'Split accounts into a new family group',
        'Update contact email for reporting/login',
      ]
    : [
        'Update contact email or personal details',
        'Request to join a family group',
        'Request account status changes',
        'General account queries',
      ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Request Modal */}
      <Modal visible={requestVisible} animationType="slide" onRequestClose={() => setRequestVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{isHead ? 'Raise Family Request' : 'Raise Request'}</Text>
          <Text style={styles.modalSubtitle}>Common request types:</Text>
          {requestOptions.map((opt, i) => (
            <View key={i} style={styles.optionRow}>
              <View style={styles.optionDot} />
              <Text style={styles.optionText}>{opt}</Text>
            </View>
          ))}
          <Text style={[styles.modalSubtitle, { marginTop: 16 }]}>Your message</Text>
          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Describe your request in detail..."
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.submitBtn, (!message.trim() || mutation.isPending) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!message.trim() || mutation.isPending}
          >
            {mutation.isPending ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.submitBtnText}>Submit Request</Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                {isHead ? 'Family Account' : 'My Account'}
              </Text>
              <Text style={styles.subtitle}>
                {isHead
                  ? 'As head of family you can see how all family accounts are mapped.'
                  : 'This shows your individual account. Only head of family can see all family accounts.'}
              </Text>
            </View>
            {isHead && (
              <View style={styles.crownBadge}>
                <Ionicons name="ribbon" size={14} color="#1D4ED8" />
                <Text style={styles.crownText}>Head of Family</Text>
              </View>
            )}
          </View>
        </View>

        {/* Search + Filter */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search name, code, email..."
              placeholderTextColor={Colors.textSecondary}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterVisible((v) => !v)}>
            <Ionicons name="filter-outline" size={16} color={Colors.primaryDark} />
            {statusFilter !== 'All' && <View style={styles.filterDot} />}
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        {filterVisible && (
          <View style={styles.filterPills}>
            {(['All', 'Active', 'Pending KYC', 'Dormant'] as StatusFilter[]).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.pill, statusFilter === f && styles.pillActive]}
                onPress={() => { setStatusFilter(f); setFilterVisible(false); }}
              >
                <Text style={[styles.pillText, statusFilter === f && styles.pillActiveText]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.content}>
          {isLoading ? (
            <ActivityIndicator color={Colors.primaryDark} style={styles.loader} />
          ) : isError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>Failed to load family data.</Text>
              <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredTree.length === 0 ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>No accounts match your search.</Text>
            </View>
          ) : (
            filteredTree.map((group) => (
              <GroupSection key={group.groupId} group={group} />
            ))
          )}

          {/* Raise Request */}
          {!isLoading && !isError && (
            <TouchableOpacity style={styles.raiseBtn} onPress={() => setRequestVisible(true)} activeOpacity={0.85}>
              <Ionicons name="create-outline" size={18} color={Colors.white} />
              <Text style={styles.raiseBtnText}>
                {isHead ? 'Raise Family Request' : 'Raise Request'}
              </Text>
            </TouchableOpacity>
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
  },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { ...Typography.H1, color: Colors.textPrimary },
  subtitle: { ...Typography.BodySmall, color: Colors.textSecondary, marginTop: 4, lineHeight: 18 },
  crownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  crownText: { ...Typography.Caption, color: '#1D4ED8', fontFamily: 'Inter_600SemiBold' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  searchInput: { flex: 1, ...Typography.BodySmall, color: Colors.textPrimary },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.negative,
  },
  filterPills: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: { backgroundColor: Colors.primaryDark, borderColor: Colors.primaryDark },
  pillText: { ...Typography.BodySmall, color: Colors.textSecondary, fontFamily: 'Inter_500Medium' },
  pillActiveText: { color: Colors.white },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  loader: { marginTop: 40 },
  errorCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  errorText: { ...Typography.BodySmall, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: Colors.primaryDark,
    borderRadius: 8,
  },
  retryText: { ...Typography.BodySmall, color: Colors.white, fontFamily: 'Inter_600SemiBold' },

  // Group
  groupCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: Colors.primaryDark + '08',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  groupLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  groupName: { ...Typography.H3, color: Colors.primaryDark },
  groupMeta: { ...Typography.Caption, color: Colors.textSecondary, marginTop: 1 },
  groupRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupCount: { ...Typography.Caption, color: Colors.textSecondary, fontFamily: 'Inter_600SemiBold' },
  ownersList: { gap: 0 },

  // Owner
  ownerSection: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  ownerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    gap: 10,
  },
  ownerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  ownerName: { ...Typography.BodySmall, color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
  ownerEmail: { ...Typography.Caption, color: Colors.textSecondary, marginTop: 1 },
  ownerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ownerBadge: {
    backgroundColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  ownerBadgeText: { ...Typography.Caption, color: Colors.textSecondary, fontFamily: 'Inter_500Medium' },
  accountCount: { ...Typography.Caption, color: Colors.textSecondary },
  accountsList: { backgroundColor: Colors.surface },

  // Account
  accountRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 11,
    gap: 10,
  },
  accountLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  accountIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  accountName: { ...Typography.BodySmall, color: Colors.textPrimary, fontFamily: 'Inter_500Medium' },
  clientCode: { ...Typography.Caption, color: Colors.textSecondary, marginTop: 1 },
  accountRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  headBadgeText: { ...Typography.Caption, color: '#1D4ED8', fontSize: 9, fontFamily: 'Inter_600SemiBold' },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  statusText: { ...Typography.Caption, fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  accountDetail: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailRow: { flexDirection: 'row', gap: 8 },
  detailLabel: { ...Typography.Caption, color: Colors.textSecondary, width: 64 },
  detailValue: { ...Typography.Caption, color: Colors.textPrimary, flex: 1, fontFamily: 'Inter_500Medium' },

  // Request
  raiseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryDark,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  raiseBtnText: { ...Typography.Body, color: Colors.white, fontFamily: 'Inter_600SemiBold' },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: { ...Typography.H2, color: Colors.textPrimary, marginBottom: 16 },
  modalSubtitle: { ...Typography.BodySmall, color: Colors.textSecondary, fontFamily: 'Inter_600SemiBold', marginBottom: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  optionDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primaryDark,
    marginTop: 6,
  },
  optionText: { ...Typography.BodySmall, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
  messageInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    ...Typography.Body,
    color: Colors.textPrimary,
    minHeight: 120,
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { ...Typography.Body, color: Colors.white, fontFamily: 'Inter_600SemiBold' },
});
