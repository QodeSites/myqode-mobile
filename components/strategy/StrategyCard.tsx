import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Strategy } from '@/api/about';

const strategyColors: Record<string, string> = {
  QAW: Colors.strategyQAW,
  QTF: Colors.strategyQTF,
  QGF: Colors.strategyQGF,
  QFH: Colors.strategyQFH,
};

interface StrategyCardProps {
  strategy: Strategy;
  onPress?: (id: string) => void;
}

export function StrategyCard({ strategy, onPress }: StrategyCardProps) {
  const bgColor = strategyColors[strategy.id] ?? Colors.primaryDark;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: bgColor }]}
      onPress={() => onPress?.(strategy.id)}
      activeOpacity={0.9}
    >
      {/* Decorative rule */}
      <View style={styles.rule} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.id}>{strategy.id}</Text>
          <Text style={styles.name}>{strategy.fullName}</Text>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {strategy.description}
        </Text>

        {/* Tag pills */}
        <View style={styles.tags}>
          {strategy.tags.slice(0, 4).map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    height: 160,
    marginBottom: 12,
    overflow: 'hidden',
  },
  rule: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 10,
    justifyContent: 'space-between',
  },
  header: {
    gap: 2,
  },
  id: {
    ...Typography.Caption,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  name: {
    ...Typography.H3,
    color: Colors.white,
    fontFamily: 'Inter_700Bold',
  },
  description: {
    ...Typography.Caption,
    color: 'rgba(255,255,255,0.80)',
    lineHeight: 15,
    flex: 1,
    marginVertical: 6,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  tagText: {
    ...Typography.Caption,
    color: 'rgba(255,255,255,0.9)',
  },
});
