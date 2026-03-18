import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { CashFlowItem } from '@/api/portfolio';
import { formatINR } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

interface CashFlowListProps {
  data: CashFlowItem[];
}

function CashFlowRow({ item, isLast }: { item: CashFlowItem; isLast: boolean }) {
  const isInflow = item.type === 'inflow';
  const color = isInflow ? Colors.positive : Colors.negative;
  const bgColor = isInflow ? Colors.lightGreen : Colors.lightRed;

  return (
    <View style={styles.row}>
      {/* Timeline spine */}
      <View style={styles.timeline}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        {!isLast && <View style={styles.spine} />}
      </View>

      {/* Content */}
      <View style={[styles.card, { borderLeftColor: color }]}>
        <View style={styles.cardTop}>
          <Text style={styles.date}>{formatDate(item.date, 'medium')}</Text>
          <View style={[styles.typePill, { backgroundColor: bgColor }]}>
            <Text style={[styles.typeText, { color }]}>
              {isInflow ? '↑ Inflow' : '↓ Outflow'}
            </Text>
          </View>
        </View>
        <Text style={[styles.amount, { color }]}>
          {isInflow ? '+' : '−'}{formatINR(Math.abs(item.amount))}
        </Text>
      </View>
    </View>
  );
}

export function CashFlowList({ data }: CashFlowListProps) {
  const totalInflow = data
    .filter((d) => d.type === 'inflow')
    .reduce((s, d) => s + d.amount, 0);
  const totalOutflow = data
    .filter((d) => d.type === 'outflow')
    .reduce((s, d) => s + d.amount, 0);
  const net = totalInflow - totalOutflow;

  return (
    <View>
      {/* Summary bar */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Inflow</Text>
          <Text style={[styles.summaryValue, { color: Colors.positive }]}>
            +{formatINR(totalInflow)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Outflow</Text>
          <Text style={[styles.summaryValue, { color: Colors.negative }]}>
            −{formatINR(totalOutflow)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Net</Text>
          <Text style={[styles.summaryValue, { color: net >= 0 ? Colors.positive : Colors.negative }]}>
            {net >= 0 ? '+' : '−'}{formatINR(Math.abs(net))}
          </Text>
        </View>
      </View>

      {/* Timeline rows */}
      <View style={styles.timeline_container}>
        {data.map((item, index) => (
          <CashFlowRow
            key={`${item.date}-${index}`}
            item={item}
            isLast={index === data.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  summaryLabel: {
    ...Typography.Caption,
    fontSize: 9,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  summaryValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    lineHeight: 15,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  timeline_container: {
    paddingLeft: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  timeline: {
    alignItems: 'center',
    width: 14,
    paddingTop: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  spine: {
    flex: 1,
    width: 1.5,
    backgroundColor: Colors.border,
    marginTop: 3,
    marginBottom: -4,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
    gap: 3,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    ...Typography.Caption,
    fontSize: 10,
    color: Colors.textSecondary,
    fontFamily: 'Inter_500Medium',
  },
  typePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  typeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    lineHeight: 13,
  },
  amount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    lineHeight: 18,
  },
});
