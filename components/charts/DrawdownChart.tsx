import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';
import { CartesianChart, Area, Line, useChartPressState } from 'victory-native';
import { Circle } from '@shopify/react-native-skia';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { DrawdownDataPoint } from '@/api/portfolio';
import { ChartSkeleton } from '@/components/ui/LoadingSkeleton';
import { useResponsive } from '@/constants/Responsive';

interface DrawdownChartProps {
  data: DrawdownDataPoint[];
  benchmarkName?: string;
  loading?: boolean;
}

const Y_LABEL_WIDTH = 42;
const X_TICK_COUNT = 5;

function shortDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`;
}

export function DrawdownChart({ data, benchmarkName = 'Benchmark', loading = false }: DrawdownChartProps) {
  const { drawdownHeight: CHART_HEIGHT } = useResponsive();
  const { state, isActive } = useChartPressState({ x: 0, y: { portfolioDD: 0, benchmarkDD: 0 } });
  const chartAreaWidthShared = useSharedValue(0);

  // Track only the data INDEX — fires ~N times total instead of every pixel
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  useAnimatedReaction(
    () => Math.round(state.x.value.value),
    (curr, prev) => {
      if (curr !== prev) runOnJS(setActiveIdx)(curr);
    },
    []
  );

  // Tooltip box: position purely on UI thread — always smooth
  const tooltipAnimStyle = useAnimatedStyle(() => {
    const xPos = state.x.position.value;
    const halfW = chartAreaWidthShared.value / 2;
    if (xPos > halfW) {
      return { position: 'absolute' as const, top: 8, right: chartAreaWidthShared.value - xPos + 14, left: undefined };
    }
    return { position: 'absolute' as const, top: 8, left: xPos + 14, right: undefined };
  });

  // Crosshair line: pure UI thread
  const crosshairStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    top: 0,
    bottom: 0,
    left: state.x.position.value - 0.5,
    width: 1,
    backgroundColor: 'rgba(120,120,120,0.2)',
  }));

  if (loading) return <ChartSkeleton />;
  if (!data || data.length === 0) {
    return (
      <View style={[styles.empty, { height: CHART_HEIGHT }]}>
        <Text style={styles.emptyText}>No drawdown data available</Text>
      </View>
    );
  }

  const hasBenchmark = data.some((d) => d.benchmarkDD !== 0 && d.benchmarkDD != null);

  const chartData = data.map((d, i) => ({
    x: i,
    portfolioDD: d.portfolioDD ?? 0,
    benchmarkDD: d.benchmarkDD ?? 0,
  }));

  const allDD = [
    ...chartData.map((d) => d.portfolioDD),
    ...(hasBenchmark ? chartData.map((d) => d.benchmarkDD) : []),
  ];
  const minDD = Math.min(...allDD);
  const yMin = minDD - Math.abs(minDD) * 0.08;
  const yMax = 0;

  const rawStep = Math.abs(minDD) / 3;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
  const tickStep = Math.ceil(rawStep / magnitude) * magnitude;
  const yTicks: number[] = [];
  for (let t = -tickStep; t >= yMin; t -= tickStep) {
    yTicks.push(parseFloat(t.toFixed(4)));
  }

  // Values read directly from data array (snaps to actual data points — correct and fast)
  const safeIdx = Math.max(0, Math.min(data.length - 1, activeIdx ?? 0));
  const activeDate = isActive ? data[safeIdx]?.date : null;
  const livePortfolio = isActive ? (data[safeIdx]?.portfolioDD ?? null) : null;
  const liveBenchmark = isActive ? (data[safeIdx]?.benchmarkDD ?? null) : null;

  const n = data.length;
  const xTickIndices = Array.from({ length: X_TICK_COUNT }, (_, i) =>
    Math.round((i / (X_TICK_COUNT - 1)) * (n - 1))
  );

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', height: CHART_HEIGHT, overflow: 'hidden' }}>
        {/* Left axis */}
        <View style={styles.yAxis}>
          {yTicks.map((tick) => {
            const pct = (tick - yMin) / (yMax - yMin);
            const topPct = (1 - pct) * 100;
            if (topPct < 0 || topPct > 100) return null;
            return (
              <Text key={tick} style={[styles.yLabel, { top: `${topPct}%` }]}>
                {tick.toFixed(0)}%
              </Text>
            );
          })}
          <View style={styles.axisLine} />
        </View>

        {/* Chart area */}
        <View
          style={styles.chartArea}
          onLayout={(e) => { chartAreaWidthShared.value = e.nativeEvent.layout.width; }}
        >
          {/* Grid lines */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {yTicks.map((tick) => {
              const pct = (tick - yMin) / (yMax - yMin);
              const topPct = (1 - pct) * 100;
              if (topPct < 0 || topPct > 100) return null;
              return (
                <View
                  key={tick}
                  style={[styles.gridLine, { top: `${topPct}%`, opacity: tick === 0 ? 0.8 : 0.4 }]}
                />
              );
            })}
          </View>

          <CartesianChart
            data={chartData}
            xKey="x"
            yKeys={['portfolioDD', 'benchmarkDD']}
            chartPressState={state}
            domain={{ y: [yMin, yMax] }}
            domainPadding={{ left: 4, right: 8 }}
            axisOptions={{
              tickCount: { x: 0, y: 0 },
              labelColor: 'transparent',
              lineColor: 'transparent',
            }}
          >
            {({ points, chartBounds }) => {
              const zeroY =
                chartBounds.bottom -
                ((0 - yMin) / (yMax - yMin)) *
                  (chartBounds.bottom - chartBounds.top);
              return (
                <>
                  <Area
                    points={points.portfolioDD}
                    color={Colors.negative}
                    opacity={0.2}
                    y0={zeroY}
                    animate={{ type: 'timing', duration: 600 }}
                  />
                  <Line
                    points={points.portfolioDD}
                    color={Colors.negative}
                    strokeWidth={1.5}
                    animate={{ type: 'timing', duration: 600 }}
                  />
                  {hasBenchmark && (
                    <Line
                      points={points.benchmarkDD}
                      color={Colors.textSecondary}
                      strokeWidth={1.5}
                      animate={{ type: 'timing', duration: 600 }}
                    />
                  )}
                  {isActive && (
                    <Circle
                      cx={state.x.position}
                      cy={state.y.portfolioDD.position}
                      r={5}
                      color={Colors.negative}
                    />
                  )}
                  {isActive && hasBenchmark && (
                    <Circle
                      cx={state.x.position}
                      cy={state.y.benchmarkDD.position}
                      r={4}
                      color={Colors.textSecondary}
                    />
                  )}
                </>
              );
            }}
          </CartesianChart>

          {/* Crosshair vertical line — pure UI thread */}
          {isActive && (
            <Animated.View style={crosshairStyle} pointerEvents="none" />
          )}

          {/* Tooltip box — position is UI thread, text snaps to data points */}
          {isActive && (
            <Animated.View style={[styles.tooltip, tooltipAnimStyle]} pointerEvents="none">
              {activeDate != null && (
                <Text style={styles.tooltipDate}>{shortDate(activeDate)}</Text>
              )}
              <Text style={styles.tooltipPortfolio}>
                DD: {livePortfolio !== null ? livePortfolio.toFixed(2) + '%' : '—'}
              </Text>
              {hasBenchmark && (
                <Text style={styles.tooltipBenchmark}>
                  {benchmarkName.slice(0, 8)}: {liveBenchmark !== null ? liveBenchmark.toFixed(2) + '%' : '—'}
                </Text>
              )}
            </Animated.View>
          )}
        </View>
      </View>

      {/* X-axis labels row */}
      <View style={styles.xAxisRow}>
        <View style={{ width: Y_LABEL_WIDTH }} />
        <View style={styles.xLabels}>
          {xTickIndices.map((idx, i) => (
            <Text
              key={idx}
              style={[
                styles.xLabel,
                i === 0 && { textAlign: 'left' },
                i === xTickIndices.length - 1 && { textAlign: 'right' },
              ]}
            >
              {shortDate(data[idx].date)}
            </Text>
          ))}
        </View>
      </View>

      {/* Legend — shows live values during scrub */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.negative }]} />
          <Text style={styles.legendLabel}>
            {isActive && livePortfolio !== null
              ? `Portfolio: ${livePortfolio.toFixed(2)}%`
              : 'Portfolio DD'}
          </Text>
        </View>
        {hasBenchmark && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.textSecondary }]} />
            <Text style={styles.legendLabel}>
              {isActive && liveBenchmark !== null
                ? `${benchmarkName}: ${liveBenchmark.toFixed(2)}%`
                : `${benchmarkName} DD`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 8 },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { ...Typography.Caption, color: Colors.textSecondary },
  empty: { justifyContent: 'center', alignItems: 'center' },
  emptyText: { ...Typography.BodySmall, color: Colors.textSecondary },
  yAxis: { width: Y_LABEL_WIDTH, position: 'relative' },
  yLabel: {
    position: 'absolute',
    right: 6,
    ...Typography.Caption,
    fontSize: 8,
    color: Colors.textSecondary,
    transform: [{ translateY: -5 }],
  },
  axisLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 1,
    backgroundColor: Colors.border,
  },
  chartArea: { flex: 1 },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.border,
  },
  xAxisRow: { flexDirection: 'row', marginTop: 4 },
  xLabels: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  xLabel: {
    ...Typography.Caption,
    fontSize: 8,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(20,20,20,0.88)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 2,
    minWidth: 90,
  },
  tooltipDate: {
    ...Typography.Caption,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 1,
  },
  tooltipPortfolio: {
    ...Typography.BodySmall,
    color: '#F87171',
    fontFamily: 'Inter_600SemiBold',
  },
  tooltipBenchmark: {
    ...Typography.BodySmall,
    color: 'rgba(255,255,255,0.75)',
  },
});
