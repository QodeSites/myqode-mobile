import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Clipboard,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';
import { ServiceCard } from '@/components/services/ServiceCard';
import { TransactionRow } from '@/components/services/TransactionRow';
import { StatusPill } from '@/components/ui/StatusPill';
import { useTransactions, useBankDetails } from '@/hooks/useAccountServices';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/utils/formatDate';
import { router } from 'expo-router';

export default function ServicesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const selectedAccountId = useAuthStore((s) => s.selectedAccountId);
  const transactions = useTransactions();
  const bankDetails = useBankDetails();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await transactions.refetch();
    setLastRefreshed(new Date());
    setRefreshing(false);
  }, [transactions]);

  const copyBankDetails = () => {
    const bd = bankDetails.data;
    if (!bd) return;
    const text = bd.copyText
      ?? `Pay to: ${bd.payableTo}\nBank: ${bd.bank}\nAccount No: ${bd.accountNumber}\nIFSC: ${bd.ifsc}${bd.micr ? `\nMICR: ${bd.micr}` : ''}`;
    Clipboard.setString(text);
    Alert.alert('Copied!', 'Bank details copied to clipboard.');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Manage Your Investments</Text>
            {selectedAccountId && (
              <View style={styles.accountBadge}>
                <Text style={styles.accountBadgeText}>{selectedAccountId}</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitle}>Add funds, switch strategies, or view your transactions</Text>
        </View>

        <View style={styles.content}>
          {/* Add Funds / SIP */}
          <ServiceCard
            title="Add Funds or SIP"
            icon="trending-up-outline"
            bullets={[
              'Start a Systematic Investment Plan (SIP) for disciplined investing',
              'Make a lumpsum addition to your existing portfolio',
              'Choose monthly or quarterly SIP frequency',
            ]}
            primaryCTA={{
              label: 'Add Funds / SIP',
              onPress: () => router.push('/(tabs)/invest/add-funds' as any),
            }}
          />

          {/* Switch Strategy */}
          <ServiceCard
            title="Switch Strategy"
            icon="swap-horizontal-outline"
            bullets={[
              'Reallocate your portfolio between Qode strategies',
              'Switch fully or partially to a different mandate',
              'Subject to minimum holding period requirements',
            ]}
            primaryCTA={{
              label: 'Switch / Reallocate',
              onPress: () => router.push('/(tabs)/invest/add-funds' as any),
            }}
          />

          {/* Bank Transfer / RTGS */}
          <ServiceCard
            title="Bank Transfer / RTGS"
            icon="business-outline"
            bullets={[
              "Transfer funds directly to Qode's designated bank account",
              'Use NEFT / RTGS / IMPS for same-day or next-day credit',
            ]}
          >
            {/* Bank details sub-card */}
            {bankDetails.data && (
              <View style={styles.bankCard}>
                <BankRow label="Payable To" value={bankDetails.data.payableTo} />
                <BankRow label="Bank" value={bankDetails.data.bank} />
                <BankRow label="Account No." value={bankDetails.data.accountNumber} mono />
                <BankRow label="IFSC" value={bankDetails.data.ifsc} mono />
                {bankDetails.data.micr ? (
                  <BankRow label="MICR" value={bankDetails.data.micr} last />
                ) : null}
              </View>
            )}
            <TouchableOpacity style={styles.copyBtn} onPress={copyBankDetails}>
              <Ionicons name="copy-outline" size={14} color={Colors.primaryDark} />
              <Text style={styles.copyBtnText}>Copy Bank Details</Text>
            </TouchableOpacity>
          </ServiceCard>

          {/* Transaction History */}
          <View style={styles.txSection}>
            <View style={styles.txHeader}>
              <Text style={styles.txTitle}>Transaction History</Text>
              <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
                <Ionicons name="refresh-outline" size={14} color={Colors.accentGreen} />
                <Text style={styles.refreshText}>Refresh</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.lastUpdated}>
              Updated {formatDate(lastRefreshed, 'medium')}
            </Text>

            {transactions.isLoading ? (
              <Text style={styles.loadingText}>Loading transactions...</Text>
            ) : transactions.isError ? (
              <TouchableOpacity onPress={() => transactions.refetch()}>
                <Text style={styles.errorText}>Failed to load. Tap to retry.</Text>
              </TouchableOpacity>
            ) : (transactions.data?.transactions ?? []).length > 0 ? (
              (transactions.data?.transactions ?? []).map((t, i) => (
                <TransactionRow key={t.orderId ?? i} transaction={t} />
              ))
            ) : (
              <Text style={styles.emptyText}>No transactions found</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BankRow({
  label,
  value,
  mono = false,
  last = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.bankRow, !last && styles.bankRowBorder]}>
      <Text style={styles.bankLabel}>{label}</Text>
      <Text style={[styles.bankValue, mono && styles.bankMono]}>{value}</Text>
    </View>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  title: { ...Typography.H1, color: Colors.textPrimary, flex: 1 },
  accountBadge: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  accountBadgeText: { ...Typography.Caption, color: Colors.white },
  subtitle: { ...Typography.BodySmall, color: Colors.textSecondary },
  content: { padding: 16 },
  bankCard: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    overflow: 'hidden',
  },
  bankRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  bankRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  bankLabel: { ...Typography.Caption, color: Colors.textSecondary },
  bankValue: { ...Typography.BodySmall, color: Colors.textPrimary, fontFamily: 'Inter_500Medium', textAlign: 'right', flex: 1, marginLeft: 8 },
  bankMono: { fontFamily: 'Inter_600SemiBold', color: Colors.primaryDark },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-start',
  },
  copyBtnText: { ...Typography.BodySmall, color: Colors.primaryDark, fontFamily: 'Inter_500Medium' },
  txSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 24,
    ...cardShadow,
  },
  txHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  txTitle: { ...Typography.H3, color: Colors.textPrimary },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  refreshText: { ...Typography.Caption, color: Colors.accentGreen, fontFamily: 'Inter_600SemiBold' },
  lastUpdated: { ...Typography.Caption, color: Colors.textSecondary, marginBottom: 12 },
  loadingText: { ...Typography.BodySmall, color: Colors.textSecondary, textAlign: 'center', paddingVertical: 20 },
  errorText: { ...Typography.BodySmall, color: Colors.negative, textAlign: 'center', paddingVertical: 16 },
  emptyText: { ...Typography.BodySmall, color: Colors.textSecondary, textAlign: 'center', paddingVertical: 20 },
});
