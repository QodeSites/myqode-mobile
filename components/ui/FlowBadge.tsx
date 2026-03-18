import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

type FlowType = 'inflow' | 'outflow';

interface FlowBadgeProps {
  type: FlowType;
}

export function FlowBadge({ type }: FlowBadgeProps) {
  const isInflow = type === 'inflow';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: isInflow ? Colors.lightGreen : Colors.lightRed },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: isInflow ? Colors.positive : Colors.negative },
        ]}
      >
        {isInflow ? '↗ Inflow' : '↙ Outflow'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    ...Typography.Caption,
    fontSize: 9,
    lineHeight: 13,
    fontFamily: 'Inter_600SemiBold',
  },
});
