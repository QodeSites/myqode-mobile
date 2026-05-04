/**
 * DatePickerInput
 * ───────────────
 * A pure React Native date-picker that requires no native modules.
 * Shows three scroll-wheel columns (Day / Month / Year) in a Modal.
 * Validates that the selected date is today or in the future.
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

interface DatePickerInputProps {
  value: string;            // ISO date string YYYY-MM-DD
  onChange: (date: string) => void;
  minDate?: Date;           // defaults to today
  label?: string;
  placeholder?: string;
}

export function DatePickerInput({
  value,
  onChange,
  minDate,
  label,
  placeholder = 'Select date',
}: DatePickerInputProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const min = minDate ?? today;

  // Parse initial selection from value prop, or default to tomorrow
  const initialDate = useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const d = new Date(value);
      if (!isNaN(d.getTime()) && d >= min) return d;
    }
    const tomorrow = new Date(min);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }, [value]);

  const [showModal, setShowModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(initialDate.getDate());
  const [selectedMonth, setSelectedMonth] = useState(initialDate.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(initialDate.getFullYear());

  // Year range: current year to +10 years
  const years = useMemo(() => {
    const y = min.getFullYear();
    return Array.from({ length: 11 }, (_, i) => y + i);
  }, [min]);

  const maxDay = daysInMonth(selectedMonth, selectedYear);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  // Clamp day if month/year change makes it invalid
  const clampedDay = Math.min(selectedDay, maxDay);

  const isDateValid = useCallback(() => {
    const d = new Date(selectedYear, selectedMonth - 1, clampedDay);
    d.setHours(0, 0, 0, 0);
    return d >= min;
  }, [selectedYear, selectedMonth, clampedDay, min]);

  const handleConfirm = () => {
    if (!isDateValid()) return;
    const mm = String(selectedMonth).padStart(2, '0');
    const dd = String(clampedDay).padStart(2, '0');
    onChange(`${selectedYear}-${mm}-${dd}`);
    setShowModal(false);
  };

  const displayValue = useMemo(() => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
    const [y, m, d] = value.split('-');
    return `${MONTHS[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
  }, [value]);

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setShowModal(true)} activeOpacity={0.7}>
        <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
        <Text style={[styles.triggerText, !displayValue && styles.placeholder]}>
          {displayValue || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowModal(false)} />

        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.sheetCancel}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.sheetTitle}>{label ?? 'Select Date'}</Text>
            <TouchableOpacity
              onPress={handleConfirm}
              style={[styles.sheetConfirm, !isDateValid() && styles.sheetConfirmDisabled]}
              disabled={!isDateValid()}
            >
              <Text style={[styles.sheetConfirmText, !isDateValid() && styles.sheetConfirmTextDisabled]}>
                Confirm
              </Text>
            </TouchableOpacity>
          </View>

          {!isDateValid() && (
            <Text style={styles.errorHint}>Date must be tomorrow or in the future.</Text>
          )}

          {/* Three columns */}
          <View style={styles.columns}>
            {/* Day */}
            <View style={styles.column}>
              <Text style={styles.colLabel}>Day</Text>
              <FlatList
                data={days}
                keyExtractor={(item) => String(item)}
                showsVerticalScrollIndicator={false}
                snapToInterval={44}
                decelerationRate="fast"
                initialScrollIndex={Math.max(0, clampedDay - 1)}
                getItemLayout={(_, index) => ({ length: 44, offset: 44 * index, index })}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.item, item === clampedDay && styles.itemActive]}
                    onPress={() => setSelectedDay(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.itemText, item === clampedDay && styles.itemTextActive]}>
                      {String(item).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>

            {/* Month */}
            <View style={styles.column}>
              <Text style={styles.colLabel}>Month</Text>
              <FlatList
                data={MONTHS.map((m, i) => ({ label: m, value: i + 1 }))}
                keyExtractor={(item) => String(item.value)}
                showsVerticalScrollIndicator={false}
                snapToInterval={44}
                decelerationRate="fast"
                initialScrollIndex={Math.max(0, selectedMonth - 1)}
                getItemLayout={(_, index) => ({ length: 44, offset: 44 * index, index })}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.item, item.value === selectedMonth && styles.itemActive]}
                    onPress={() => setSelectedMonth(item.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.itemText, item.value === selectedMonth && styles.itemTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>

            {/* Year */}
            <View style={styles.column}>
              <Text style={styles.colLabel}>Year</Text>
              <FlatList
                data={years}
                keyExtractor={(item) => String(item)}
                showsVerticalScrollIndicator={false}
                snapToInterval={44}
                decelerationRate="fast"
                initialScrollIndex={0}
                getItemLayout={(_, index) => ({ length: 44, offset: 44 * index, index })}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.item, item === selectedYear && styles.itemActive]}
                    onPress={() => setSelectedYear(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.itemText, item === selectedYear && styles.itemTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  triggerText: {
    flex: 1,
    ...Typography.Body,
    color: Colors.textPrimary,
  },
  placeholder: {
    color: Colors.textSecondary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 16 },
    }),
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sheetCancel: { flex: 1 },
  sheetCancelText: { ...Typography.Body, color: Colors.textSecondary },
  sheetTitle: { flex: 2, textAlign: 'center', ...Typography.H3, color: Colors.textPrimary },
  sheetConfirm: { flex: 1, alignItems: 'flex-end' },
  sheetConfirmDisabled: {},
  sheetConfirmText: { ...Typography.Body, color: Colors.primaryDark, fontFamily: 'Inter_600SemiBold' },
  sheetConfirmTextDisabled: { color: Colors.border },
  errorHint: {
    ...Typography.Caption,
    color: Colors.negative,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  columns: {
    flexDirection: 'row',
    height: 220,
    paddingHorizontal: 8,
  },
  column: {
    flex: 1,
    overflow: 'hidden',
  },
  colLabel: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 8,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  item: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  itemActive: {
    backgroundColor: Colors.primaryDark + '18',
  },
  itemText: {
    ...Typography.Body,
    color: Colors.textSecondary,
  },
  itemTextActive: {
    color: Colors.primaryDark,
    fontFamily: 'Inter_700Bold',
  },
});
