import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { QuarterlyPL } from '@/api/portfolio';
import { formatPercent } from '@/utils/formatPercent';
import { formatINR } from '@/utils/formatCurrency';
import { isSmallDevice, isTablet } from '@/constants/Responsive';
import { AutoShrinkText } from '@/components/ui/AutoShrinkText';

interface QuarterlyPLTableProps {
  data: QuarterlyPL[];
  mode: 'percent' | 'rupees';
  onToggleMode: (mode: 'percent' | 'rupees') => void;
}

const YEAR_WIDTH = isTablet ? 72 : isSmallDevice ? 48 : 56;
const ROW_HEIGHT = isSmallDevice ? 32 : 36;
// Same sizing rationale as MonthlyPLTable — quarterly values accumulate
// 3 months so INR amounts can be proportionally larger
const PCT_CELL = isTablet ? 96 : isSmallDevice ? 72 : 80;
const INR_CELL = isTablet ? 136 : isSmallDevice ? 104 : 120;

function PLCell({ value, mode }: { value: number | null | undefined; mode: 'percent' | 'rupees' }) {
  if (value === null || value === undefined) {
    return <Text style={styles.dash} allowFontScaling={false}>-</Text>;
  }
  const color = value > 0 ? Colors.positive : value < 0 ? Colors.negative : Colors.textPrimary;
  const display = mode === 'percent' ? formatPercent(value) : formatINR(value, 0);
  return (
    <AutoShrinkText
      style={[styles.valueCell, { color }]}
      allowFontScaling={false}
      minimumFontScale={0.6}
    >
      {`${display}`}
    </AutoShrinkText>
  );
}

export function QuarterlyPLTable({ data, mode, onToggleMode }: QuarterlyPLTableProps) {
  return (
    <View>
      {/* Toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === 'percent' && styles.toggleActive]}
          onPress={() => onToggleMode('percent')}
        >
          <Text style={[styles.toggleText, mode === 'percent' && styles.toggleActiveText]}>%</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === 'rupees' && styles.toggleActive]}
          onPress={() => onToggleMode('rupees')}
        >
          <Text style={[styles.toggleText, mode === 'rupees' && styles.toggleActiveText]}>₹</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tableContainer}>
        {/* Frozen YEAR column */}
        <View style={styles.frozenCol}>
          {/* Frozen header */}
          <View style={styles.frozenHeaderCell}>
            <Text style={styles.headerText} numberOfLines={1} allowFontScaling={false}>YEAR</Text>
          </View>
          {/* Frozen data rows */}
          {data.map((row, i) => (
            <View key={i} style={[styles.frozenDataCell, i % 2 === 0 && styles.evenRow]}>
              <Text style={styles.yearText} numberOfLines={1} allowFontScaling={false}>{row.year}</Text>
            </View>
          ))}
        </View>

        {/* Scrollable columns */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Scrollable header */}
            <View style={[styles.row, styles.headerRow]}>
              {(['Q1', 'Q2', 'Q3', 'Q4', 'TOTAL'] as const).map((h) => (
                <View key={h} style={[styles.cell, { width: mode === 'rupees' ? INR_CELL : PCT_CELL }]}>
                  <Text style={styles.headerText} numberOfLines={1} allowFontScaling={false}>{h}</Text>
                </View>
              ))}
            </View>
            {/* Scrollable data rows */}
            {data.map((row, i) => (
              <View key={i} style={[styles.row, i % 2 === 0 && styles.evenRow]}>
                {(['q1', 'q2', 'q3', 'q4', 'total'] as const).map((q) => (
                  <View key={q} style={[styles.cell, { width: mode === 'rupees' ? INR_CELL : PCT_CELL }]}>
                    <PLCell value={row[q]} mode={mode} />
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
    gap: 4,
  },
  toggleBtn: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  toggleText: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
  },
  toggleActiveText: {
    color: Colors.white,
  },
  tableContainer: {
    flexDirection: 'row',
  },
  frozenCol: {
    width: YEAR_WIDTH,
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
  cell: {
    paddingHorizontal: isSmallDevice ? 6 : 8,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'flex-end',
    // width is set dynamically via style prop ({ width: mode === 'rupees' ? INR_CELL : PCT_CELL })
  },
  headerText: {
    ...Typography.Caption,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Inter_600SemiBold',
  },
  yearText: {
    ...Typography.BodySmall,
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  valueCell: {
    ...Typography.BodySmall,
    textAlign: 'right',
  },
  dash: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
});
