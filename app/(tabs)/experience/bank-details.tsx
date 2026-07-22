import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Clipboard } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';
import { useBankDetails } from '@/hooks/useAccountServices';

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    Clipboard.setString(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.field}>
      <View style={styles.fieldLeft}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue} selectable>{value}</Text>
      </View>
      <TouchableOpacity
        style={[styles.copyBtn, copied && styles.copyBtnActive]}
        onPress={handleCopy}
        hitSlop={6}
        activeOpacity={0.7}
      >
        <Ionicons
          name={copied ? 'checkmark-outline' : 'copy-outline'}
          size={14}
          color={copied ? Colors.positive : Colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
}

export default function BankDetailsScreen() {
  const { data, isLoading, isError, refetch } = useBankDetails();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleCopyAll = () => {
    if (!data) return;
    const text = data.copyText ?? [
      `Pay to: ${data.payableTo}`,
      `Account No: ${data.accountNumber}`,
      `Bank: ${data.bank}`,
      `IFSC: ${data.ifsc}`,
      data.micr ? `MICR: ${data.micr}` : '',
    ].filter(Boolean).join('\n');
    Clipboard.setString(text);
    Alert.alert('Copied', 'Bank details copied to clipboard.');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bank Details</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accentGreen}
            colors={[Colors.accentGreen]}
          />
        }
      >
        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.accentGreen} />
            <Text style={styles.loadingText}>Loading bank details...</Text>
          </View>
        )}

        {isError && (
          <TouchableOpacity style={styles.errorCard} onPress={() => refetch()}>
            <Ionicons name="refresh-outline" size={18} color={Colors.negative} />
            <Text style={styles.errorText}>Failed to load. Tap to retry.</Text>
          </TouchableOpacity>
        )}

        {data && (
          <>
            {/* Info banner */}
            <View style={styles.infoBanner}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.primaryDark} />
              <Text style={styles.infoText}>
                Use these details to transfer funds via NEFT/RTGS/IMPS. Mention your Account ID in the remarks.
              </Text>
            </View>

            {/* Fields card */}
            <View style={styles.card}>
              <DetailField label="Payable To" value={data.payableTo} />
              <View style={styles.divider} />
              <DetailField label="Account Number" value={data.accountNumber} />
              <View style={styles.divider} />
              <DetailField label="Bank" value={data.bank} />
              <View style={styles.divider} />
              <DetailField label="IFSC Code" value={data.ifsc} />
              {data.micr && (
                <>
                  <View style={styles.divider} />
                  <DetailField label="MICR" value={data.micr} />
                </>
              )}
            </View>

            {/* Copy All */}
            <TouchableOpacity style={styles.copyAllBtn} onPress={handleCopyAll} activeOpacity={0.85}>
              <Ionicons name="copy-outline" size={16} color={Colors.white} />
              <Text style={styles.copyAllText}>Copy All Details</Text>
            </TouchableOpacity>

            <View style={styles.note}>
              <Ionicons name="shield-checkmark-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.noteText}>
                Always verify account details before initiating a transfer. Contact Qode IR for any discrepancies.
              </Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 38, justifyContent: 'center' },
  headerTitle: { ...Typography.H2, color: Colors.textPrimary, flex: 1, textAlign: 'center' },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.primaryDark + '12',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.primaryDark + '30',
  },
  infoText: {
    ...Typography.BodySmall,
    color: Colors.primaryDark,
    flex: 1,
    lineHeight: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  fieldLeft: { flex: 1 },
  fieldLabel: { ...Typography.Caption, color: Colors.textSecondary, marginBottom: 3 },
  fieldValue: {
    ...Typography.Body,
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  copyBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyBtnActive: {
    backgroundColor: Colors.lightGreen,
    borderColor: Colors.positive,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 14 },
  copyAllBtn: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 10,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  copyAllText: { ...Typography.ButtonLabel, color: Colors.white },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 4,
  },
  noteText: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 15,
  },
});
