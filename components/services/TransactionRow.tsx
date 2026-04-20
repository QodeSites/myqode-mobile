import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Transaction } from '@/api/services';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatINR } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

interface TransactionRowProps {
  transaction: Transaction;
}

/** Human-readable label and direction for each transaction type. */
const TYPE_META: Record<string, { label: string; isDebit: boolean }> = {
  ONE_TIME:   { label: 'One-Time Investment', isDebit: false },
  SIP:        { label: 'SIP',                 isDebit: false },
  Lumpsum:    { label: 'Lumpsum Investment',  isDebit: false },
  Switch:     { label: 'Strategy Switch',     isDebit: false },
  Withdrawal: { label: 'Withdrawal',          isDebit: true  },
};

export function TransactionRow({ transaction: t }: TransactionRowProps) {
  const meta = TYPE_META[t.type] ?? { label: t.type, isDebit: false };
  const amountColor = meta.isDebit ? Colors.negative : Colors.positive;

  return (
    <View style={styles.row}>
      {/* Direction icon */}
      <View style={[styles.iconBox, { backgroundColor: meta.isDebit ? '#FEE2E2' : Colors.lightGreen }]}>
        <Ionicons
          name={meta.isDebit ? 'arrow-up-outline' : 'arrow-down-outline'}
          size={16}
          color={meta.isDebit ? Colors.negative : Colors.positive}
        />
      </View>

      <View style={styles.left}>
        <Text style={styles.typeLabel}>{meta.label}</Text>
        <Text style={styles.orderId} numberOfLines={1}>#{t.orderId}</Text>
        {t.frequency ? (
          <Text style={styles.freq}>{t.frequency}</Text>
        ) : null}
      </View>

      <View style={styles.mid}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {meta.isDebit ? '−' : '+'}{formatINR(t.amount)}
        </Text>
        <Text style={styles.date}>{formatDate(t.date, 'short')}</Text>
        <StatusPill status={t.status} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  left: {
    flex: 1,
    gap: 2,
  },
  typeLabel: {
    ...Typography.BodySmall,
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  orderId: {
    ...Typography.Caption,
    color: Colors.textSecondary,
  },
  freq: {
    ...Typography.Caption,
    color: Colors.accentGreen,
  },
  mid: {
    alignItems: 'flex-end',
    gap: 3,
  },
  amount: {
    ...Typography.BodySmall,
    fontFamily: 'Inter_700Bold',
  },
  date: {
    ...Typography.Caption,
    color: Colors.textSecondary,
  },
});
