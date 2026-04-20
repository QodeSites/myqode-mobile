import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  valueColor?: string;
  style?: object;
}

export function StatCard({ label, value, subtitle, icon, valueColor, style }: StatCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <Text style={styles.label} numberOfLines={2}>{label}</Text>
        {icon && (
          <Ionicons name={icon} size={14} color={Colors.textSecondary} style={styles.icon} />
        )}
      </View>
      <Text
        style={[styles.value, { color: valueColor ?? Colors.textPrimary }]}
        allowFontScaling={false}
      >
        {value}
      </Text>
      {subtitle && (
        <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 0,
    ...cardShadow,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  label: {
    ...Typography.Caption,
    fontSize: 9,
    lineHeight: 13,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    flex: 1,
    marginRight: 4,
  },
  icon: {
    marginTop: 1,
  },
  value: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.Caption,
    fontSize: 9,
    lineHeight: 13,
    color: Colors.textSecondary,
  },
});
