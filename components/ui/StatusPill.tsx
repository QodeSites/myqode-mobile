import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

type StatusType = 'active' | 'inactive' | 'PAID' | 'EXPIRED' | 'PENDING' | 'PROCESSING';

interface StatusPillProps {
  status: StatusType;
}

const statusConfig: Record<StatusType, { bg: string; text: string; label: string }> = {
  active: { bg: Colors.lightGreen, text: Colors.positive, label: 'Active' },
  inactive: { bg: '#F3F4F6', text: Colors.textSecondary, label: 'Inactive' },
  PAID: { bg: Colors.lightGreen, text: Colors.positive, label: 'PAID' },
  EXPIRED: { bg: '#F3F4F6', text: Colors.textSecondary, label: 'EXPIRED' },
  PENDING: { bg: '#FEF3C7', text: '#D97706', label: 'PENDING' },
  PROCESSING: { bg: '#DBEAFE', text: '#2563EB', label: 'PROCESSING' },
};

export function StatusPill({ status }: StatusPillProps) {
  const config = statusConfig[status] ?? statusConfig.inactive;

  return (
    <View style={[styles.pill, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    ...Typography.Caption,
    fontFamily: 'Inter_600SemiBold',
  },
});
