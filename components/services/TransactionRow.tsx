import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Transaction } from '@/api/services';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatINR } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

interface TransactionRowProps {
  transaction: Transaction;
}

export function TransactionRow({ transaction: t }: TransactionRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.orderId} numberOfLines={1}>#{t.orderId}</Text>
        <Text style={styles.type}>{t.type}</Text>
        {t.frequency && (
          <Text style={styles.freq}>{t.frequency}</Text>
        )}
      </View>
      <View style={styles.mid}>
        <Text style={styles.amount}>{formatINR(t.amount)}</Text>
        <Text style={styles.currency}>{t.currency}</Text>
        <Text style={styles.date}>{formatDate(t.date, 'short')}</Text>
      </View>
      <StatusPill status={t.status} />
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
    gap: 8,
  },
  left: {
    flex: 1,
  },
  mid: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  orderId: {
    ...Typography.BodySmall,
    color: Colors.textPrimary,
    fontFamily: 'Inter_500Medium',
  },
  type: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  freq: {
    ...Typography.Caption,
    color: Colors.accentGreen,
    marginTop: 2,
  },
  amount: {
    ...Typography.BodySmall,
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  currency: {
    ...Typography.Caption,
    color: Colors.textSecondary,
  },
  date: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
