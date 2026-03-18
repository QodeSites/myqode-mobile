import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { MonthlyPL } from '@/api/portfolio';
import { formatPercent } from '@/utils/formatPercent';
import { formatINR } from '@/utils/formatCurrency';

interface MonthlyPLTableProps {
  data: MonthlyPL[];
  mode: 'percent' | 'rupees';
  onToggleMode: (mode: 'percent' | 'rupees') => void;
}

const MONTH_KEYS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'] as const;
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function PLCell({ value, mode }: { value: number | null | undefined; mode: 'percent' | 'rupees' }) {
  if (value === null || value === undefined) {
    return <Text style={styles.dash} numberOfLines={1}>-</Text>;
  }
  const color = value > 0 ? Colors.positive : value < 0 ? Colors.negative : Colors.textPrimary;
  const display = mode === 'percent' ? formatPercent(value) : formatINR(value);
  return <Text style={[styles.valueCell, { color }]} numberOfLines={1}>{display}</Text>;
}

export function MonthlyPLTable({ data, mode, onToggleMode }: MonthlyPLTableProps) {
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header */}
          <View style={[styles.row, styles.headerRow]}>
            <View style={[styles.cell, styles.yearCell]}>
              <Text style={styles.headerText} numberOfLines={1}>YEAR</Text>
            </View>
            {MONTH_LABELS.map((m) => (
              <View key={m} style={styles.cell}>
                <Text style={styles.headerText} numberOfLines={1}>{m}</Text>
              </View>
            ))}
            <View style={styles.cell}>
              <Text style={styles.headerText} numberOfLines={1}>Total</Text>
            </View>
          </View>

          {/* Rows */}
          {data.map((row, i) => (
            <View key={i} style={[styles.row, i % 2 === 0 && styles.evenRow]}>
              <View style={[styles.cell, styles.yearCell]}>
                <Text style={styles.yearText} numberOfLines={1}>{row.year}</Text>
              </View>
              {MONTH_KEYS.map((m) => (
                <View key={m} style={styles.cell}>
                  <PLCell value={row[m]} mode={mode} />
                </View>
              ))}
              <View style={styles.cell}>
                <PLCell value={row.total} mode={mode} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
  },
  headerRow: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 6,
    marginBottom: 2,
  },
  evenRow: {
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  cell: {
    width: 60,
    paddingHorizontal: 4,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  yearCell: {
    width: 48,
    alignItems: 'flex-start',
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
    ...Typography.Caption,
    textAlign: 'right',
  },
  dash: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
});
