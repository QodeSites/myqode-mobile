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
import { Typography, cardShadow } from '@/constants/Typography';
import { useCreateOrder } from '@/hooks/usePayments';
import { useSetupSip, useSwitchStrategy, useWithdrawal } from '@/hooks/useAccountServices';
import { useIsSelectedAccountClosed } from '@/hooks/usePortfolio';
import { useAuthStore } from '@/store/authStore';
import { StrategySelector } from '@/components/ui/StrategySelector';
import { DatePickerInput } from '@/components/ui/DatePickerInput';
import { useCashfreePayment } from '@/hooks/useCashfreePayment';
import { formatINR } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { AutoShrinkText } from '@/components/ui/AutoShrinkText';

type Tab = 'onetime' | 'sip' | 'new-strategy' | 'switch' | 'withdrawal';

const TABS: { key: Tab; label: string }[] = [
  { key: 'onetime', label: 'One-Time' },
  { key: 'sip', label: 'SIP' },
  { key: 'new-strategy', label: 'New Strategy' },
  { key: 'switch', label: 'Switch' },
  { key: 'withdrawal', label: 'Withdrawal' },
];

const QUICK_AMOUNTS = [50000, 100000, 250000, 500000];
const STRATEGIES = ['QAW', 'QTF', 'QGF', 'QFH'] as const;
const STRATEGY_NAMES: Record<string, string> = {
  QAW: 'All Weather',
  QTF: 'Tactical Fund',
  QGF: 'Growth Fund',
  QFH: 'Future Horizon',
};
const FREQUENCIES = ['monthly', 'quarterly', 'yearly', 'weekly', 'daily'] as const;

// ─── One-Time / New Strategy shared ──────────────────────────────────────────
function OneTimeTab({
  orderType,
}: {
  orderType: 'ONE_TIME' | 'NEW_STRATEGY';
}) {
  const createOrder = useCreateOrder();
  const { launchPayment, isProcessing } = useCashfreePayment();
  const selectedAccountId = useAuthStore((s) => s.selectedAccountId);
  const selectedStrategy = useAuthStore((s) => s.selectedStrategy);

  // Determine the strategy the user is currently invested in (for NEW_STRATEGY only).
  // 'all', 'owner', 'family' are aggregate views — not a concrete strategy, so no restriction.
  const concreteStrategies = STRATEGIES as readonly string[];
  const currentStrategy: string | null = concreteStrategies.includes(selectedStrategy)
    ? selectedStrategy
    : null;

  // Pre-select the first strategy that isn't their current one.
  const defaultNewStrategy = STRATEGIES.find((s) => s !== currentStrategy) ?? 'QTF';
  const [amountStr, setAmountStr] = useState('');
  const [strategyType, setStrategyType] = useState<string>(defaultNewStrategy);

  const amount = parseInt(amountStr, 10) || 0;
  const isValid = amount >= 100 && !!selectedAccountId;
  const isBusy = createOrder.isPending || isProcessing;

  const handleSubmit = () => {
    if (!selectedAccountId) {
      Alert.alert('No Account', 'Please select an account first.');
      return;
    }
    if (amount < 100) {
      Alert.alert('Minimum Amount', 'Minimum investment is ₹100.');
      return;
    }
    const payload: any = { accountId: selectedAccountId, amount, orderType };
    if (orderType === 'NEW_STRATEGY') payload.strategyType = strategyType;

    createOrder.mutate(payload, {
      onSuccess: (data) => {
        // Launch the Cashfree payment sheet with the session returned from the server.
        // The SDK result is delivered to the global callback in _layout.tsx which
        // calls verifyOrder and refreshes caches. We navigate to Orders after launch
        // so the user can track progress as soon as the payment sheet closes.
        launchPayment(data.paymentSessionId, data.orderId, data.environment ?? 'sandbox');
        // Do NOT navigate away here — the Cashfree SDK presents a modal view
        // controller over the current screen and navigating now would dismiss it
        // before the payment sheet appears. Navigation to Orders happens in the
        // global Cashfree callback in _layout.tsx once the sheet closes.
      },
      onError: (err: any) => {
        Alert.alert('Order Failed', err?.response?.data?.message ?? err?.message ?? 'Failed to create order. Please try again.');
      },
    });
  };

  return (
    <View style={styles.form}>
      {orderType === 'NEW_STRATEGY' && (
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Select New Strategy</Text>
          {currentStrategy && (
            <Text style={styles.hint}>
              You are currently invested in <Text style={{ color: Colors.primaryDark, fontFamily: 'Inter_600SemiBold' }}>{currentStrategy}</Text>. Choose a different strategy below.
            </Text>
          )}
          <View style={styles.strategyRow}>
            {STRATEGIES.map((s) => {
              const isCurrent = s === currentStrategy;
              const isSelected = strategyType === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.strategyChip,
                    isSelected && styles.strategyChipActive,
                    isCurrent && styles.strategyChipDisabled,
                  ]}
                  onPress={() => !isCurrent && setStrategyType(s)}
                  activeOpacity={isCurrent ? 1 : 0.8}
                >
                  <Text style={[styles.strategyChipText, isSelected && styles.strategyChipTextActive]}>
                    {s}
                  </Text>
                  <Text style={[styles.strategyChipSub, isSelected && styles.strategyChipTextActive]}>
                    {STRATEGY_NAMES[s]}
                  </Text>
                  {isCurrent && (
                    <Text style={styles.currentBadge}>Current</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Amount (₹)</Text>
        <TextInput
          style={styles.input}
          value={amountStr}
          onChangeText={(v) => setAmountStr(v.replace(/[^0-9]/g, ''))}
          placeholder="Enter amount"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
        />
        <Text style={styles.hint}>Minimum: ₹100</Text>
      </View>

      <View style={styles.quickAmounts}>
        {QUICK_AMOUNTS.map((a) => (
          <TouchableOpacity
            key={a}
            style={styles.quickBtn}
            onPress={() => setAmountStr(String(a))}
            activeOpacity={0.75}
          >
            <AutoShrinkText style={styles.quickBtnText} minimumFontScale={0.7}>
              {formatINR(a)}
            </AutoShrinkText>
          </TouchableOpacity>
        ))}
      </View>

      {amount >= 100 && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>You will invest</Text>
          <AutoShrinkText style={styles.summaryValue} minimumFontScale={0.65}>
            {formatINR(amount)}
          </AutoShrinkText>
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitBtn, (!isValid || isBusy) && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={!isValid || isBusy}
        activeOpacity={0.85}
      >
        {isBusy ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <>
            <Ionicons name="send-outline" size={16} color={Colors.white} />
            <Text style={styles.submitBtnText}>
              {orderType === 'NEW_STRATEGY' ? 'Create New Strategy Order' : 'Proceed to Payment'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

// ─── SIP Setup ────────────────────────────────────────────────────────────────
function SipTab() {
  const [amountStr, setAmountStr] = useState('');
  const [frequency, setFrequency] = useState<string>('monthly');
  const [startDate, setStartDate] = useState('');
  const setupSip = useSetupSip();
  const { launchSipMandate, isProcessing } = useCashfreePayment();
  const selectedAccountId = useAuthStore((s) => s.selectedAccountId);

  const amount = parseInt(amountStr, 10) || 0;
  // Compare as ISO strings (YYYY-MM-DD) to avoid UTC-vs-local timezone offset.
  // 'today' in local time is always YYYY-MM-DD regardless of UTC offset.
  // Backend requires startDate >= tomorrow (Cashfree rejects same-day mandates).
  // Use en-CA locale for YYYY-MM-DD format in local time regardless of timezone.
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toLocaleDateString('en-CA');
  const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(startDate) && startDate >= tomorrowStr;
  const isValid = amount >= 100 && !!selectedAccountId && isValidDate;
  const isBusy = setupSip.isPending || isProcessing;

  const handleSubmit = () => {
    if (!selectedAccountId) {
      Alert.alert('No Account', 'Please select an account first.');
      return;
    }
    if (amount < 100) {
      Alert.alert('Minimum Amount', 'Minimum SIP amount is ₹100.');
      return;
    }
    if (!isValidDate) {
      Alert.alert('Invalid Date', 'Please select a valid start date.');
      return;
    }

    setupSip.mutate(
      { accountId: selectedAccountId, amount, frequency: frequency as any, startDate },
      {
        onSuccess: (data) => {
          // Launch the Cashfree subscription mandate authorization sheet.
          // The user must authorize via UPI/banking to activate the SIP.
          launchSipMandate(data.subscriptionSessionId, data.subscriptionId, data.environment ?? 'sandbox');
          // Do NOT navigate away here — the Cashfree SDK presents a mandate sheet over
          // the current screen. Navigation to SIP Management happens in the global
          // Cashfree callback in _layout.tsx once the mandate sheet closes.
        },
        onError: (err: any) => {
          Alert.alert('SIP Setup Failed', err?.response?.data?.message ?? err?.message ?? 'Failed to set up SIP. Please try again.');
        },
      }
    );
  };

  // Dynamic label: "Monthly Amount" only when monthly; otherwise "Amount per <frequency>"
  const amountLabel = frequency === 'monthly'
    ? 'Monthly Amount (₹)'
    : `${FREQUENCY_LABELS[frequency] ?? frequency} Amount (₹)`;

  return (
    <View style={styles.form}>
      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>{amountLabel}</Text>
        <TextInput
          style={styles.input}
          value={amountStr}
          onChangeText={(v) => setAmountStr(v.replace(/[^0-9]/g, ''))}
          placeholder="Enter SIP amount"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
        />
        <Text style={styles.hint}>Minimum: ₹100</Text>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Frequency</Text>
        <View style={styles.freqRow}>
          {FREQUENCIES.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.freqChip, frequency === f && styles.freqChipActive]}
              onPress={() => setFrequency(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.freqChipText, frequency === f && styles.freqChipTextActive]}>
                {FREQUENCY_LABELS[f]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Start Date</Text>
        <DatePickerInput
          value={startDate}
          onChange={setStartDate}
          minDate={tomorrowDate}
          label="SIP Start Date"
          placeholder="Select start date"
        />
        <Text style={styles.hint}>Must be tomorrow or a future date.</Text>
      </View>

      {amount >= 100 && isValidDate && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>SIP Summary</Text>
          <Text style={styles.summaryValue}>
            {formatINR(amount)} {FREQUENCY_LABELS[frequency] ?? frequency} · from {formatDate(startDate, 'medium')}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitBtn, (!isValid || isBusy) && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={!isValid || isBusy}
        activeOpacity={0.85}
      >
        {isBusy ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <>
            <Ionicons name="repeat-outline" size={16} color={Colors.white} />
            <Text style={styles.submitBtnText}>Set Up SIP</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Switch Strategy ──────────────────────────────────────────────────────────
function SwitchTab() {
  const selectedStrategyRaw = useAuthStore((s) => s.selectedStrategy);
  const selectedAccountId = useAuthStore((s) => s.selectedAccountId);

  // Derive the concrete strategy they're currently invested in from their selected account.
  // 'all', 'owner', 'family' are aggregate views — fall back to letting them pick manually.
  const concreteStrategies = STRATEGIES as readonly string[];
  const detectedStrategy: string | null = concreteStrategies.includes(selectedStrategyRaw)
    ? selectedStrategyRaw
    : null;

  const defaultInvestedIn = detectedStrategy ?? 'QAW';
  const defaultSwitchTo = STRATEGIES.find((s) => s !== defaultInvestedIn) ?? 'QTF';

  const [investedIn, setInvestedIn] = useState<string>(defaultInvestedIn);
  const [switchTo, setSwitchTo] = useState<string>(defaultSwitchTo);

  // When the user manually changes "Currently Invested In" (only shown when we can't auto-detect),
  // ensure "Switch To" never collides with it.
  const handleSetInvestedIn = (s: string) => {
    setInvestedIn(s);
    if (s === switchTo) {
      const next = STRATEGIES.find((st) => st !== s) ?? 'QTF';
      setSwitchTo(next);
    }
  };

  const [amountStr, setAmountStr] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const switchStrategy = useSwitchStrategy();
  const [submitted, setSubmitted] = useState(false);

  const amount = parseInt(amountStr, 10) || 0;
  const isValid = !!selectedAccountId && investedIn !== switchTo && amount > 0 && reason.trim().length > 0;

  const handleSubmit = () => {
    if (!selectedAccountId) {
      Alert.alert('No Account', 'Please select an account first.');
      return;
    }
    switchStrategy.mutate(
      {
        accountId: selectedAccountId,
        investedIn,
        switchTo,
        amount,
        reason: reason.trim(),
        additionalNotes: notes.trim() || undefined,
      },
      {
        onSuccess: () => setSubmitted(true),
        onError: (err: any) => {
          Alert.alert('Error', err?.response?.data?.message ?? 'Failed to submit request.');
        },
      }
    );
  };

  if (submitted) {
    return (
      <View style={styles.successBox}>
        <Ionicons name="checkmark-circle-outline" size={48} color={Colors.positive} />
        <Text style={styles.successTitle}>Request Submitted</Text>
        <Text style={styles.successText}>
          Your switch request has been received. The Qode team will contact you within 1 business day.
        </Text>
        <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.form}>
      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Currently Invested In</Text>
        {detectedStrategy ? (
          // Auto-detected from selected account — show read-only info
          <View style={styles.detectedStrategyRow}>
            <View style={styles.detectedStrategyBadge}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.positive} />
              <Text style={styles.detectedStrategyText}>{detectedStrategy}</Text>
              <Text style={styles.detectedStrategyName}>{STRATEGY_NAMES[detectedStrategy]}</Text>
            </View>
            <Text style={styles.detectedStrategyHint}>Auto-detected from your selected account</Text>
          </View>
        ) : (
          // Can't auto-detect — let them pick manually
          <View style={styles.strategyRow}>
            {STRATEGIES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.strategyChip, investedIn === s && styles.strategyChipActive]}
                onPress={() => handleSetInvestedIn(s)}
                activeOpacity={0.8}
              >
                <Text style={[styles.strategyChipText, investedIn === s && styles.strategyChipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Switch To</Text>
        <View style={styles.strategyRow}>
          {STRATEGIES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.strategyChip,
                switchTo === s && styles.strategyChipActive,
                s === investedIn && styles.strategyChipDisabled,
              ]}
              onPress={() => s !== investedIn && setSwitchTo(s)}
              activeOpacity={s === investedIn ? 1 : 0.8}
            >
              <Text style={[styles.strategyChipText, switchTo === s && styles.strategyChipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Amount (₹)</Text>
        <TextInput
          style={styles.input}
          value={amountStr}
          onChangeText={(v) => setAmountStr(v.replace(/[^0-9]/g, ''))}
          placeholder="Enter switch amount"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Reason *</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={reason}
          onChangeText={setReason}
          placeholder="Why do you want to switch?"
          placeholderTextColor={Colors.textSecondary}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Additional Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional information..."
          placeholderTextColor={Colors.textSecondary}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, (!isValid || switchStrategy.isPending) && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={!isValid || switchStrategy.isPending}
        activeOpacity={0.85}
      >
        {switchStrategy.isPending ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <>
            <Ionicons name="swap-horizontal-outline" size={16} color={Colors.white} />
            <Text style={styles.submitBtnText}>Submit Switch Request</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Withdrawal ───────────────────────────────────────────────────────────────
function WithdrawalTab() {
  const [amountStr, setAmountStr] = useState('');
  const [notes, setNotes] = useState('');
  const withdrawal = useWithdrawal();
  const selectedAccountId = useAuthStore((s) => s.selectedAccountId);
  const [submitted, setSubmitted] = useState(false);

  const amount = parseInt(amountStr, 10) || 0;
  const isValid = amount > 0 && !!selectedAccountId;

  const handleSubmit = () => {
    if (!selectedAccountId) {
      Alert.alert('No Account', 'Please select an account first.');
      return;
    }
    Alert.alert(
      'Confirm Withdrawal',
      `Withdraw ${formatINR(amount)} from your account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: () =>
            withdrawal.mutate(
              { accountId: selectedAccountId, amount, additionalNotes: notes.trim() || undefined },
              {
                onSuccess: () => setSubmitted(true),
                onError: (err: any) => {
                  Alert.alert('Error', err?.response?.data?.message ?? 'Failed to submit request.');
                },
              }
            ),
        },
      ]
    );
  };

  if (submitted) {
    return (
      <View style={styles.successBox}>
        <Ionicons name="checkmark-circle-outline" size={48} color={Colors.positive} />
        <Text style={styles.successTitle}>Request Submitted</Text>
        <Text style={styles.successText}>
          Your withdrawal request has been received. The Qode team will contact you within 1 business day.
        </Text>
        <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.form}>
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle-outline" size={14} color={Colors.accentGold} />
        <Text style={styles.infoText}>
          Withdrawal requests are processed within 1 business day. Funds are transferred to your registered bank account.
        </Text>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Amount (₹)</Text>
        <TextInput
          style={styles.input}
          value={amountStr}
          onChangeText={(v) => setAmountStr(v.replace(/[^0-9]/g, ''))}
          placeholder="Enter withdrawal amount"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any special instructions..."
          placeholderTextColor={Colors.textSecondary}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, styles.submitBtnDanger, (!isValid || withdrawal.isPending) && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={!isValid || withdrawal.isPending}
        activeOpacity={0.85}
      >
        {withdrawal.isPending ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <>
            <Ionicons name="arrow-up-outline" size={16} color={Colors.white} />
            <Text style={styles.submitBtnText}>Request Withdrawal</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const INDIVIDUAL_STRATEGIES = ['QAW', 'QTF', 'QGF', 'QFH'];

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AddFundsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('onetime');
  const isClosed = useIsSelectedAccountClosed();
  const selectedStrategy = useAuthStore((s) => s.selectedStrategy);
  const isAggregateScope = !INDIVIDUAL_STRATEGIES.includes(selectedStrategy);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invest</Text>
          <StrategySelector />
        </View>

        {isClosed && (
          <View style={styles.closedBanner}>
            <Ionicons name="lock-closed-outline" size={13} color="#6B7280" />
            <Text style={styles.closedBannerText}>
              This account is closed. Investment actions are not available.
            </Text>
          </View>
        )}

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarInner}>
            {TABS.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.tab, activeTab === t.key && styles.tabActive]}
                onPress={() => setActiveTab(t.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          {isAggregateScope ? (
            <View style={styles.aggregateGate}>
              <Ionicons name="person-outline" size={40} color={Colors.border} />
              <Text style={styles.aggregateGateTitle}>Select an Individual Account</Text>
              <Text style={styles.aggregateGateText}>
                Investments and SIPs must be made into a specific account. Tap the account selector above and choose an individual strategy account.
              </Text>
            </View>
          ) : isClosed ? (
            <View style={styles.closedState}>
              <Ionicons name="lock-closed-outline" size={40} color={Colors.border} />
              <Text style={styles.closedStateTitle}>Account Closed</Text>
              <Text style={styles.closedStateText}>
                Investment and SIP actions are not available for closed accounts. Contact Qode IR for assistance.
              </Text>
            </View>
          ) : (
            <>
              {activeTab === 'onetime' && <OneTimeTab orderType="ONE_TIME" />}
              {activeTab === 'sip' && <SipTab />}
              {activeTab === 'new-strategy' && <OneTimeTab orderType="NEW_STRATEGY" />}
              {activeTab === 'switch' && <SwitchTab />}
              {activeTab === 'withdrawal' && <WithdrawalTab />}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 36, justifyContent: 'center' },
  headerTitle: { ...Typography.H2, color: Colors.textPrimary, flex: 1, textAlign: 'center' },
  tabBar: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabBarInner: { paddingHorizontal: 16, gap: 4, paddingVertical: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  tabActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  tabText: { ...Typography.BodySmall, color: Colors.textSecondary, fontFamily: 'Inter_500Medium' },
  tabTextActive: { color: Colors.white, fontFamily: 'Inter_600SemiBold' },
  scroll: { padding: 16, paddingBottom: 40 },
  form: { gap: 16 },
  fieldBlock: { gap: 8 },
  fieldLabel: { ...Typography.Body, color: Colors.textPrimary, fontFamily: 'Inter_500Medium' },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...Typography.Body,
    color: Colors.textPrimary,
  },
  textarea: { minHeight: 80, paddingTop: 12 },
  hint: { ...Typography.Caption, color: Colors.textSecondary },
  quickAmounts: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  quickBtn: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...cardShadow,
  },
  quickBtnText: { ...Typography.BodySmall, color: Colors.primaryDark, fontFamily: 'Inter_600SemiBold' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  summaryLabel: { ...Typography.Body, color: Colors.textSecondary },
  summaryValue: { ...Typography.Body, color: Colors.primaryDark, fontFamily: 'Inter_700Bold' },
  strategyRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  strategyChip: {
    flex: 1,
    minWidth: 70,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: 10,
    alignItems: 'center',
  },
  strategyChipActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  strategyChipDisabled: { opacity: 0.35 },
  strategyChipText: { ...Typography.BodySmall, color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
  strategyChipSub: { ...Typography.Caption, color: Colors.textSecondary, marginTop: 2 },
  strategyChipTextActive: { color: Colors.white },
  detectedStrategyRow: {
    gap: 6,
  },
  detectedStrategyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.lightGreen,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.positive + '40',
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  detectedStrategyText: {
    ...Typography.Body,
    color: Colors.primaryDark,
    fontFamily: 'Inter_700Bold',
  },
  detectedStrategyName: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    fontFamily: 'Inter_500Medium',
  },
  detectedStrategyHint: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
  },
  currentBadge: {
    fontSize: 8,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
    marginTop: 2,
    backgroundColor: Colors.border,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    overflow: 'hidden' as const,
  },
  freqRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  freqChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  freqChipActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  freqChipText: { ...Typography.BodySmall, color: Colors.textSecondary, fontFamily: 'Inter_500Medium' },
  freqChipTextActive: { color: Colors.white, fontFamily: 'Inter_600SemiBold' },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.accentGold + '15',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.accentGold + '40',
  },
  infoText: { ...Typography.BodySmall, color: Colors.textPrimary, flex: 1, lineHeight: 16 },
  submitBtn: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 10,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  submitBtnDanger: { backgroundColor: Colors.negative },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { ...Typography.ButtonLabel, color: Colors.white },
  successBox: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
    paddingHorizontal: 24,
  },
  successTitle: { ...Typography.H1, color: Colors.textPrimary },
  successText: { ...Typography.Body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  doneBtn: {
    marginTop: 8,
    backgroundColor: Colors.primaryDark,
    borderRadius: 10,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  doneBtnText: { ...Typography.ButtonLabel, color: Colors.white },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    padding: 12,
    paddingHorizontal: 16,
  },
  closedBannerText: { ...Typography.Caption, color: '#6B7280', flex: 1 },
  closedState: { alignItems: 'center', paddingVertical: 60, gap: 14, paddingHorizontal: 24 },
  closedStateTitle: { ...Typography.H2, color: Colors.textPrimary },
  closedStateText: { ...Typography.Body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  aggregateGate: { alignItems: 'center', paddingVertical: 60, gap: 14, paddingHorizontal: 24 },
  aggregateGateTitle: { ...Typography.H2, color: Colors.textPrimary },
  aggregateGateText: { ...Typography.Body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
