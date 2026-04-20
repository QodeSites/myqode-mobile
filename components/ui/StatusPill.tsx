import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

type StatusType = string;

interface StatusPillProps {
  status: StatusType;
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  // ── Account statuses (lowercase from DB / snapshot API) ───────────────────
  active:  { bg: Colors.lightGreen, text: Colors.positive,     label: 'Active'   },
  closed:  { bg: '#F3F4F6',         text: '#6B7280',           label: 'Closed'   },
  pending: { bg: '#FEF3C7',         text: '#B45309',           label: 'Pending'  },
  dormant: { bg: '#F3F4F6',         text: '#6B7280',           label: 'Dormant'  },
  inactive:{ bg: '#F3F4F6',         text: Colors.textSecondary,label: 'Inactive' },
  // Family / KYC statuses (title-case from family API)
  Active:        { bg: Colors.lightGreen, text: Colors.positive, label: 'Active'      },
  Dormant:       { bg: '#FEE2E2',         text: '#B91C1C',       label: 'Dormant'     },
  'Pending KYC': { bg: '#FEF9C3',         text: '#B45309',       label: 'Pending KYC' },

  // ── Cashfree raw payment statuses (stored in payment_transactions) ─────────
  SUCCESS:      { bg: Colors.lightGreen, text: Colors.positive, label: 'Paid'       },
  PAID:         { bg: Colors.lightGreen, text: Colors.positive, label: 'Paid'       },
  FAILED:       { bg: '#FEE2E2',         text: '#B91C1C',       label: 'Failed'     },
  USER_DROPPED: { bg: '#FEF3C7',         text: '#B45309',       label: 'Incomplete' },
  PENDING:      { bg: '#FEF3C7',         text: '#B45309',       label: 'Pending'    },
  PROCESSING:   { bg: '#DBEAFE',         text: '#2563EB',       label: 'Processing' },
  EXPIRED:      { bg: '#F3F4F6',         text: '#6B7280',       label: 'Expired'    },
  CANCELLED:    { bg: '#F3F4F6',         text: '#6B7280',       label: 'Cancelled'  },
  VOID:         { bg: '#F3F4F6',         text: '#6B7280',       label: 'Void'       },
  FLAGGED:      { bg: '#FEE2E2',         text: '#B91C1C',       label: 'Flagged'    },

  // ── Qode investment lifecycle statuses (investment_status field) ───────────
  PENDING_PAYMENT: { bg: '#FEF3C7',  text: '#B45309', label: 'Payment Pending'   },
  PAYMENT_SUCCESS: { bg: '#DBEAFE',  text: '#1D4ED8', label: 'Payment Confirmed' },
  SETTLED:         { bg: '#EDE9FE',  text: '#6D28D9', label: 'Funds Received'    },
  DEPLOYED:        { bg: Colors.lightGreen, text: Colors.positive, label: 'Live' },
  PAYMENT_FAILED:  { bg: '#FEE2E2',  text: '#B91C1C', label: 'Failed'           },

  // ── SIP / subscription statuses ────────────────────────────────────────────
  ACTIVE:  { bg: Colors.lightGreen, text: Colors.positive, label: 'Active' },
  PAUSED:  { bg: '#FEF3C7',         text: '#B45309',       label: 'Paused' },
  // CANCELLED / EXPIRED reuse entries above
};

export function StatusPill({ status }: StatusPillProps) {
  // Unknown statuses: show the raw value in neutral grey instead of hiding it
  const config = statusConfig[status] ?? { bg: '#F3F4F6', text: '#6B7280', label: status };

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
