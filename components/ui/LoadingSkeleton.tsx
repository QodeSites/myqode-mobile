import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useResponsive } from '@/constants/Responsive';

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
      {/* label row */}
      <View style={styles.cardSkeletonHeader}>
        <LoadingSkeleton width="55%" height={9} />
        <LoadingSkeleton width={14} height={14} borderRadius={4} />
      </View>
      {/* value */}
      <LoadingSkeleton width="75%" height={20} style={{ marginBottom: 6 }} />
      {/* subtitle */}
      <LoadingSkeleton width="45%" height={9} />
    </View>
  );
}

export function ChartSkeleton() {
  const { chartHeight } = useResponsive();
  return (
    <View style={styles.chartSkeleton}>
      <LoadingSkeleton width="100%" height={chartHeight} borderRadius={8} />
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
    padding: 12,
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 0,
    gap: 6,
  },
  cardSkeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  chartSkeleton: {
    padding: 16,
  },
});
