import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Strategy } from '@/api/about';

const STRATEGY_THEME: Record<string, { color: string; accent: string }> = {
  QAW: { color: Colors.strategyQAW, accent: Colors.strategyQAWAccent },
  QTF: { color: Colors.strategyQTF, accent: Colors.strategyQTFAccent },
  QGF: { color: Colors.strategyQGF, accent: Colors.strategyQGFAccent },
};

interface StrategyCardProps {
  strategy: Strategy;
  onPress?: (id: string) => void;
}

export function StrategyCard({ strategy, onPress }: StrategyCardProps) {
  const theme = STRATEGY_THEME[strategy.id] ?? { color: Colors.primaryDark, accent: Colors.primaryMid };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(strategy.id)}
      activeOpacity={0.9}
    >
      {/* Gradient background from left (color) to right (accent) */}
      <LinearGradient
        colors={[theme.color, theme.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBackground}
        pointerEvents="none"
      />

      {/* Decorative dot pattern overlay */}
      <View style={styles.dotPattern} pointerEvents="none" />

      <View style={styles.content}>
        {/* Header bar + title */}
        <View style={styles.header}>
          <View style={[styles.rule, { backgroundColor: 'rgba(255,255,255,0.5)' }]} />
          <Text style={styles.name}>{strategy.fullName}</Text>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {strategy.description}
        </Text>

        {/* Tag pills */}
        <View style={styles.tags}>
          {strategy.tags.slice(0, 4).map((tag, i) => (
            <View key={i} style={[styles.tag, { borderColor: theme.color }]}>
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
    borderRadius: 16,
    minHeight: 172,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dotPattern: {
    position: 'absolute',
    inset: 0,
    opacity: 0.04,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    padding: 18,
    paddingTop: 14,
    gap: 8,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rule: {
    width: 28,
    height: 3,
    borderRadius: 2,
  },
  name: {
    ...Typography.H3,
    color: Colors.white,
    fontFamily: 'Inter_700Bold',
    flex: 1,
  },
  description: {
    ...Typography.Caption,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 16,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
  },
  tagText: {
    ...Typography.Caption,
    color: Colors.textPrimary,
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
});
