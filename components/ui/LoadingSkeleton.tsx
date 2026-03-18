import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function LoadingSkeleton({
  width = '100%',
  height = 16,
  borderRadius = 6,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as any, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <LoadingSkeleton width="60%" height={10} style={{ marginBottom: 12 }} />
      <LoadingSkeleton width="80%" height={22} style={{ marginBottom: 8 }} />
      <LoadingSkeleton width="50%" height={10} />
    </View>
  );
}

export function ChartSkeleton() {
  return (
    <View style={styles.chartSkeleton}>
      <LoadingSkeleton width="100%" height={180} borderRadius={8} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.border,
  },
  cardSkeleton: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    flex: 1,
  },
  chartSkeleton: {
    padding: 16,
  },
});
