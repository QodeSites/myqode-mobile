import React from 'react';
import { ScrollView, View, Text, StyleSheet, Platform } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { TrailingReturn } from '@/api/portfolio';
import { formatPercent, getValueSentiment } from '@/utils/formatPercent';
import { isSmallDevice, isTablet } from '@/constants/Responsive';

interface TrailingReturnsTableProps {
  data: TrailingReturn[];
}

const NAME_WIDTH = isTablet ? 150 : isSmallDevice ? 96 : 110;
const ROW_HEIGHT = isSmallDevice ? 32 : 36;

// Column widths sized to show the longest realistic value without truncation.
// formatPercent produces up to "+999.99%" (9 chars × ~7px Inter SemiBold 11px
// = 63px) + 12px horizontal padding = 75px → use 76px for standard cols.
// sinceInception can exceed 100% so allow more room.
const SCROLL_COLS = [
  { key: 'w1', label: '1W', width: 76 },
  { key: 'd10', label: '10D', width: 76 },
  { key: 'm1', label: '1M', width: 76 },
  { key: 'm3', label: '3M', width: 76 },
  { key: 'm6', label: '6M', width: 76 },
  { key: 'y1', label: '1Y', width: 76 },
  { key: 'y3', label: '3Y', width: 76 },
  { key: 'currentDD', label: 'CUR DD', width: 80 },
  { key: 'maxDD', label: 'MAX DD', width: 80 },
  { key: 'sinceInception', label: 'INCEPTION', width: 92 },
];

function ValueCell({ value, isBenchmark }: { value: number | null | undefined; isBenchmark: boolean }) {
  if (value === null || value === undefined) {
    return <Text style={styles.dash} allowFontScaling={false}>-</Text>;
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
    // No numberOfLines — full value must always be visible.
    // allowFontScaling={false} prevents Android accessibility font scaling
    // from pushing text beyond the cell bounds.
    <Text style={[styles.cell, { color }]} allowFontScaling={false}>
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
                allowFontScaling={false}
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
    // Android: zIndex alone does not create stacking — elevation is also required
    // so that the frozen column renders above the horizontally scrolling content
    elevation: Platform.OS === 'android' ? 2 : 0,
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
    minHeight: ROW_HEIGHT,
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: ROW_HEIGHT,
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
    // fontStyle: 'italic' is intentionally removed — Android doesn't synthesise
    // italic for custom fonts (Inter) that don't include an italic variant,
    // resulting in broken/unstyled rendering. Use opacity instead.
    opacity: 0.7,
    marginTop: 8,
    lineHeight: 14,
  },
});
