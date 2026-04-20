import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { MonthlyPL } from '@/api/portfolio';
import { formatPercent } from '@/utils/formatPercent';
import { formatINR } from '@/utils/formatCurrency';
import { isSmallDevice, isTablet } from '@/constants/Responsive';

interface MonthlyPLTableProps {
  data: MonthlyPL[];
  mode: 'percent' | 'rupees';
  onToggleMode: (mode: 'percent' | 'rupees') => void;
}

const MONTH_KEYS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'] as const;
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const YEAR_WIDTH = isTablet ? 72 : isSmallDevice ? 48 : 56;
const ROW_HEIGHT = isSmallDevice ? 32 : 36;
// PCT_CELL: "+999.99%" = ~9 chars × 7px Inter + 16px padding ≈ 79px → 80px
// INR_CELL: "-₹10,00,00,000" = ~14 chars × 7px + 16px ≈ 114px → 116px
const PCT_CELL = isTablet ? 90 : isSmallDevice ? 72 : 80;
const INR_CELL = isTablet ? 128 : isSmallDevice ? 100 : 116;

function PLCell({ value, mode }: { value: number | null | undefined; mode: 'percent' | 'rupees' }) {
  if (value === null || value === undefined) {
    return <Text style={styles.dash} allowFontScaling={false}>-</Text>;
  }
  const color = value > 0 ? Colors.positive : value < 0 ? Colors.negative : Colors.textPrimary;
  const display = mode === 'percent' ? formatPercent(value) : formatINR(value, 0);
  // No numberOfLines — full value must always be visible
  return <Text style={[styles.valueCell, { color }]} allowFontScaling={false}>{display}</Text>;
}

export function MonthlyPLTable({ data, mode, onToggleMode }: MonthlyPLTableProps) {
  const cellWidth = mode === 'rupees' ? INR_CELL : PCT_CELL;

  return (
    <View>
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

      <View style={styles.tableWrapper} key={mode}>
        {/* Frozen year column */}
        <View style={styles.frozenCol}>
          <View style={styles.frozenHeaderCell}>
            <Text style={styles.headerText} numberOfLines={1} allowFontScaling={false}>YEAR</Text>
          </View>
          {data.map((row, i) => (
            <View key={i} style={[styles.frozenDataCell, i % 2 === 0 && styles.evenRow]}>
              <Text style={styles.yearText} numberOfLines={1} allowFontScaling={false}>{row.year}</Text>
            </View>
          ))}
        </View>

        {/* Scrollable month + total columns */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollArea}>
          <View>
            {/* Header */}
            <View style={[styles.row, styles.headerRow]}>
              {MONTH_LABELS.map((m) => (
                <View key={m} style={[styles.cell, { width: cellWidth }]}>
                  <Text style={styles.headerText} numberOfLines={1} allowFontScaling={false}>{m}</Text>
                </View>
              ))}
              <View style={[styles.cell, styles.totalCell, { width: cellWidth }]}>
                <Text style={styles.headerText} numberOfLines={1} allowFontScaling={false}>Total</Text>
              </View>
            </View>

            {/* Rows */}
            {data.map((row, i) => (
              <View key={i} style={[styles.row, i % 2 === 0 && styles.evenRow]}>
                {MONTH_KEYS.map((m) => (
                  <View key={m} style={[styles.cell, { width: cellWidth }]}>
                    <PLCell value={row[m]} mode={mode} />
                  </View>
                ))}
                <View style={[styles.cell, styles.totalCell, { width: cellWidth }]}>
                  <PLCell value={row.total} mode={mode} />
                </View>
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
  tableWrapper: {
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
  scrollArea: {
    flex: 1,
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
  },
  totalCell: {
    borderLeftWidth: 1,
    borderLeftColor: Colors.border + '80',
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
