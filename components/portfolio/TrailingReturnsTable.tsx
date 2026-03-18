import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { TrailingReturn } from '@/api/portfolio';
import { formatPercent, getValueSentiment } from '@/utils/formatPercent';

interface TrailingReturnsTableProps {
  data: TrailingReturn[];
}

const NAME_WIDTH = 100;
const ROW_HEIGHT = 36;

const SCROLL_COLS = [
  { key: 'w1', label: '1W', width: 56 },
  { key: 'd10', label: '10D', width: 56 },
  { key: 'm1', label: '1M', width: 56 },
  { key: 'm3', label: '3M', width: 56 },
  { key: 'm6', label: '6M', width: 56 },
  { key: 'y1', label: '1Y', width: 56 },
  { key: 'y3', label: '3Y', width: 56 },
  { key: 'currentDD', label: 'CUR DD', width: 64 },
  { key: 'maxDD', label: 'MAX DD', width: 64 },
  { key: 'sinceInception', label: 'INCEPTION', width: 72 },
];

function ValueCell({ value, isBenchmark }: { value: number | null | undefined; isBenchmark: boolean }) {
  if (value === null || value === undefined) {
    return <Text style={styles.dash} numberOfLines={1}>-</Text>;
  }
  const num = Number(value);
  const sentiment = getValueSentiment(num);
  const color = isBenchmark
    ? Colors.textSecondary
    : sentiment === 'positive'
    ? Colors.positive
    : sentiment === 'negative'
    ? Colors.negative
    : Colors.textPrimary;
  return (
    <Text style={[styles.cell, { color }]} numberOfLines={1}>
      {formatPercent(num, true, 2)}
    </Text>
  );
}

export function TrailingReturnsTable({ data }: TrailingReturnsTableProps) {
  return (
    <View>
      <View style={styles.tableContainer}>
        {/* Frozen first column */}
        <View style={styles.frozenCol}>
          {/* Frozen header */}
          <View style={styles.frozenHeaderCell}>
            <Text style={styles.headerText} numberOfLines={1}>NAME</Text>
          </View>
          {/* Frozen data rows */}
          {data.map((row, idx) => (
            <View
              key={idx}
              style={[styles.frozenDataCell, idx % 2 === 0 && styles.evenRow]}
            >
              <Text
                style={[styles.nameCell, row.type === 'benchmark' && styles.benchmarkName]}
                numberOfLines={1}
              >
                {row.name ?? '-'}
              </Text>
            </View>
          ))}
        </View>

        {/* Scrollable columns */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Scrollable header */}
            <View style={[styles.row, styles.headerRow]}>
              {SCROLL_COLS.map((col) => (
                <View key={col.key} style={[styles.colCell, { width: col.width }]}>
                  <Text style={styles.headerText} numberOfLines={1}>{col.label}</Text>
                </View>
              ))}
            </View>
            {/* Scrollable data rows */}
            {data.map((row, idx) => (
              <View key={idx} style={[styles.row, idx % 2 === 0 && styles.evenRow]}>
                {SCROLL_COLS.map((col) => (
                  <View key={col.key} style={[styles.colCell, { width: col.width }]}>
                    <ValueCell
                      value={(row as any)[col.key]}
                      isBenchmark={row.type === 'benchmark'}
                    />
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <Text style={styles.footnote}>
        * NAV-based returns. Past performance is not indicative of future results.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tableContainer: {
    flexDirection: 'row',
  },
  frozenCol: {
    width: NAME_WIDTH,
    zIndex: 1,
  },
  frozenHeaderCell: {
    height: ROW_HEIGHT,
    marginBottom: 2,
    paddingHorizontal: 8,
    justifyContent: 'center',
    backgroundColor: Colors.primaryDark,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  frozenDataCell: {
    height: ROW_HEIGHT,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ROW_HEIGHT,
  },
  headerRow: {
    backgroundColor: Colors.primaryDark,
    marginBottom: 2,
  },
  evenRow: {
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  colCell: {
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  headerText: {
    ...Typography.Caption,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
  },
  nameCell: {
    ...Typography.BodySmall,
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  benchmarkName: {
    color: Colors.textSecondary,
  },
  cell: {
    ...Typography.BodySmall,
    fontFamily: 'Inter_500Medium',
    textAlign: 'right',
  },
  dash: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  footnote: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 14,
  },
});
