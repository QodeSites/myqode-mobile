import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useCreateOrder } from '@/hooks/usePayments';
import { useAuthStore } from '@/store/authStore';
import { formatINR } from '@/utils/formatCurrency';

const QUICK_AMOUNTS = [50000, 100000, 250000, 500000];

function formatAmountInput(val: string): string {
  const num = val.replace(/[^0-9]/g, '');
  return num;
}

export default function AddFundsScreen() {
  const [amountStr, setAmountStr] = useState('');
  const [note, setNote] = useState('');
  const createOrder = useCreateOrder();
  const selectedAccountId = useAuthStore((s) => s.selectedAccountId);

  const amount = parseInt(amountStr, 10) || 0;
  const isValid = amount >= 5000 && !!selectedAccountId;

  const handleSubmit = async () => {
    if (!selectedAccountId) {
      Alert.alert('No Account', 'Please select an account before investing.');
      return;
    }
    if (amount < 5000) {
      Alert.alert('Minimum Amount', 'Minimum investment is ₹5,000.');
      return;
    }

    createOrder.mutate(
      { accountId: selectedAccountId, amount, note: note.trim() || undefined },
      {
        onSuccess: (data) => {
          Alert.alert(
            'Order Created',
            `Your investment order of ${formatINR(data.amount)} has been created.\n\nOrder ID: ${data.orderId}\n\nPlease transfer the amount via NEFT/RTGS/IMPS to complete the investment.`,
            [{ text: 'Done', onPress: () => router.back() }]
          );
        },
        onError: (err: any) => {
          Alert.alert(
            'Error',
            err?.response?.data?.message ?? 'Failed to create order. Please try again.'
          );
        },
      }
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Funds</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {/* Account indicator */}
          {selectedAccountId && (
            <View style={styles.accountRow}>
              <Ionicons name="person-circle-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.accountText}>Investing into account: <Text style={styles.accountId}>{selectedAccountId}</Text></Text>
            </View>
          )}

          {/* Amount input */}
          <Text style={styles.label}>Investment Amount</Text>
          <View style={styles.amountInputWrap}>
            <Text style={styles.rupeeSymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={amountStr}
              onChangeText={(v) => setAmountStr(formatAmountInput(v))}
              placeholder="0"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="numeric"
              returnKeyType="done"
            />
          </View>
          {amount > 0 && (
            <Text style={styles.amountWords}>{formatINR(amount)}</Text>
          )}

          {/* Quick amounts */}
          <View style={styles.quickRow}>
            {QUICK_AMOUNTS.map((amt) => (
              <TouchableOpacity
                key={amt}
                style={[styles.quickBtn, amount === amt && styles.quickBtnActive]}
                onPress={() => setAmountStr(String(amt))}
              >
                <Text style={[styles.quickBtnText, amount === amt && styles.quickBtnTextActive]}>
                  {amt >= 100000 ? `₹${amt / 100000}L` : `₹${amt / 1000}K`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.minNote}>Minimum investment: ₹5,000</Text>

          {/* Note */}
          <Text style={[styles.label, { marginTop: 20 }]}>Note (optional)</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="e.g. SIP installment, lumpsum addition"
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={2}
          />

          {/* Info box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.accentGold} />
            <Text style={styles.infoText}>
              After placing the order, transfer the funds via NEFT/RTGS/IMPS to complete your investment. Your portfolio will be updated once funds are received and allocated.
            </Text>
          </View>
        </ScrollView>

        {/* CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, (!isValid || createOrder.isPending) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || createOrder.isPending}
            activeOpacity={0.85}
          >
            {createOrder.isPending ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.submitBtnText}>
                {amount >= 5000 ? `Place Order · ${formatINR(amount)}` : 'Place Order'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { ...Typography.H3, color: Colors.textPrimary },
  content: { padding: 20, gap: 8 },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  accountText: { ...Typography.Caption, color: Colors.textSecondary },
  accountId: { fontFamily: 'Inter_600SemiBold', color: Colors.primaryDark },
  label: { ...Typography.BodySmall, color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    height: 64,
  },
  rupeeSymbol: { fontFamily: 'Inter_700Bold', fontSize: 24, color: Colors.textPrimary, marginRight: 8 },
  amountInput: {
    flex: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: Colors.textPrimary,
  },
  amountWords: { ...Typography.Caption, color: Colors.textSecondary, marginTop: 4 },
  quickRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  quickBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  quickBtnActive: { backgroundColor: Colors.primaryDark, borderColor: Colors.primaryDark },
  quickBtnText: { ...Typography.Caption, color: Colors.textSecondary, fontFamily: 'Inter_600SemiBold' },
  quickBtnTextActive: { color: Colors.white },
  minNote: { ...Typography.Caption, color: Colors.textSecondary, marginTop: 4 },
  noteInput: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...Typography.Body,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
    minHeight: 64,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginTop: 12,
    alignItems: 'flex-start',
  },
  infoText: { ...Typography.Caption, color: Colors.textSecondary, flex: 1, lineHeight: 16 },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'android' ? 24 : 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submitBtn: {
    backgroundColor: Colors.primaryDark,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { ...Typography.ButtonLabel, color: Colors.white },
});
