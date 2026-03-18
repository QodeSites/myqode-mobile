import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { QuarterlyPL } from '@/api/portfolio';
import { formatPercent } from '@/utils/formatPercent';
import { formatINR } from '@/utils/formatCurrency';

interface QuarterlyPLTableProps {
  data: QuarterlyPL[];
  mode: 'percent' | 'rupees';
  onToggleMode: (mode: 'percent' | 'rupees') => void;
}

const YEAR_WIDTH = 56;
const ROW_HEIGHT = 36;

function PLCell({ value, mode }: { value: number | null | undefined; mode: 'percent' | 'rupees' }) {
  if (value === null || value === undefined) {
    return <Text style={styles.dash} numberOfLines={1}>-</Text>;
  }
  const color = value > 0 ? Colors.positive : value < 0 ? Colors.negative : Colors.textPrimary;
  const display = mode === 'percent' ? formatPercent(value) : formatINR(value);
  return <Text style={[styles.valueCell, { color }]} numberOfLines={1}>{display}</Text>;
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
            <Text style={styles.headerText} numberOfLines={1}>YEAR</Text>
          </View>
          {/* Frozen data rows */}
          {data.map((row, i) => (
            <View key={i} style={[styles.frozenDataCell, i % 2 === 0 && styles.evenRow]}>
              <Text style={styles.yearText} numberOfLines={1}>{row.year}</Text>
            </View>
          ))}
        </View>

        {/* Scrollable columns */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Scrollable header */}
            <View style={[styles.row, styles.headerRow]}>
              {(['Q1', 'Q2', 'Q3', 'Q4', 'TOTAL'] as const).map((h) => (
                <View key={h} style={styles.cell}>
                  <Text style={styles.headerText} numberOfLines={1}>{h}</Text>
                </View>
              ))}
            </View>
            {/* Scrollable data rows */}
            {data.map((row, i) => (
              <View key={i} style={[styles.row, i % 2 === 0 && styles.evenRow]}>
                {(['q1', 'q2', 'q3', 'q4', 'total'] as const).map((q) => (
                  <View key={q} style={styles.cell}>
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
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
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
  cell: {
    width: 72,
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'flex-end',
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
