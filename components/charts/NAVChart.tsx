import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CartesianChart, Line, useChartPressState } from 'victory-native';
import { Circle } from '@shopify/react-native-skia';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { NAVDataPoint } from '@/api/portfolio';
import { ChartSkeleton } from '@/components/ui/LoadingSkeleton';

interface NAVChartProps {
  data: NAVDataPoint[];
  benchmarkName?: string;
  loading?: boolean;
}

const Y_LABEL_WIDTH = 38;
const CHART_HEIGHT = 200;
const X_TICK_COUNT = 5;

function shortDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`;
}

export function NAVChart({ data, benchmarkName = 'Benchmark', loading = false }: NAVChartProps) {
  const { state, isActive } = useChartPressState({ x: 0, y: { portfolioNav: 0, benchmarkNav: 0 } });

  if (loading) return <ChartSkeleton />;
  if (!data || data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No chart data available</Text>
      </View>
    );
  }

  const hasBenchmark = data.some((d) => d.benchmarkNav !== 0 && d.benchmarkNav != null);

  const chartData = data.map((d, i) => ({
    x: i,
    portfolioNav: d.portfolioNav ?? 0,
    benchmarkNav: d.benchmarkNav ?? 0,
  }));

  // Y domain — include benchmark values so both lines stay within bounds
  const allValues = [
    ...chartData.map((d) => d.portfolioNav),
    ...(hasBenchmark ? chartData.map((d) => d.benchmarkNav) : []),
  ];
  const minNav = Math.min(...allValues);
  const maxNav = Math.max(...allValues);
  const range = maxNav - minNav || 1;
  const yMin = minNav - range * 0.08;
  const yMax = maxNav + range * 0.08;

  // Y ticks
  const rawStep = (yMax - yMin) / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const tickStep = Math.ceil(rawStep / magnitude) * magnitude;
  const yTickStart = Math.ceil(yMin / tickStep) * tickStep;
  const yTicks: number[] = [];
  for (let t = yTickStart; t < yMax; t += tickStep) {
    yTicks.push(parseFloat(t.toFixed(4)));
  }

  // X ticks: pick evenly-spaced indices
  const n = data.length;
  const xTickIndices = Array.from({ length: X_TICK_COUNT }, (_, i) =>
    Math.round((i / (X_TICK_COUNT - 1)) * (n - 1))
  );

  return (
    <View style={styles.container}>
      {/* Chart row */}
      <View style={{ flexDirection: 'row', height: CHART_HEIGHT, overflow: 'hidden' }}>
        {/* Left y-axis */}
        <View style={styles.yAxis}>
          {yTicks.map((tick) => {
            const pct = (tick - yMin) / (yMax - yMin);
            const topPct = (1 - pct) * 100;
            if (topPct < 0 || topPct > 100) return null;
            return (
              <Text key={tick} style={[styles.yLabel, { top: `${topPct}%` }]}>
                {tick.toFixed(1)}
              </Text>
            );
          })}
          <View style={styles.axisLine} />
        </View>

        {/* Chart area */}
        <View style={styles.chartArea}>
          {/* Horizontal grid lines */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {yTicks.map((tick) => {
              const pct = (tick - yMin) / (yMax - yMin);
              const topPct = (1 - pct) * 100;
              if (topPct < 0 || topPct > 100) return null;
              return (
                <View key={tick} style={[styles.gridLine, { top: `${topPct}%` }]} />
              );
            })}
          </View>

          <CartesianChart
            data={chartData}
            xKey="x"
            yKeys={['portfolioNav', 'benchmarkNav']}
            chartPressState={state}
            domain={{ y: [yMin, yMax] }}
            domainPadding={{ left: 4, right: 8 }}
            axisOptions={{
              tickCount: { x: 0, y: 0 },
              labelColor: 'transparent',
              lineColor: 'transparent',
            }}
          >
            {({ points }) => (
              <>
                <Line
                  points={points.portfolioNav}
                  color={Colors.accentGreen}
                  strokeWidth={2}
                  animate={{ type: 'timing', duration: 600 }}
                />
                {hasBenchmark && (
                  <Line
                    points={points.benchmarkNav}
                    color={Colors.textSecondary}
                    strokeWidth={1.5}
                    animate={{ type: 'timing', duration: 600 }}
                  />
                )}
                {isActive && (
                  <Circle
                    cx={state.x.position}
                    cy={state.y.portfolioNav.position}
                    r={5}
                    color={Colors.accentGreen}
                  />
                )}
                {isActive && hasBenchmark && (
                  <Circle
                    cx={state.x.position}
                    cy={state.y.benchmarkNav.position}
                    r={4}
                    color={Colors.textSecondary}
                  />
                )}
              </>
            )}
          </CartesianChart>

          {isActive && (
            <View style={styles.tooltip} pointerEvents="none">
              <Text style={styles.tooltipPortfolio}>
                NAV: {state.y.portfolioNav.value.value.toFixed(2)}
              </Text>
              {hasBenchmark && (
                <Text style={styles.tooltipBenchmark}>
                  N50: {state.y.benchmarkNav.value.value.toFixed(2)}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      {/* X-axis labels row */}
      <View style={styles.xAxisRow}>
        {/* Spacer under y-axis column */}
        <View style={{ width: Y_LABEL_WIDTH }} />
        {/* Labels aligned by flex position */}
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

      {/* Legend — centered below x-axis */}
      <View style={styles.legendRow}>
        <View style={[styles.legendItem]}>
          <View style={[styles.legendDot, { backgroundColor: Colors.accentGreen }]} />
          <Text style={styles.legendLabel}>Portfolio NAV</Text>
        </View>
        {hasBenchmark && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.textSecondary }]} />
            <Text style={styles.legendLabel}>{benchmarkName}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    ...Typography.Caption,
    color: Colors.textSecondary,
  },
  empty: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
  },
  yAxis: {
    width: Y_LABEL_WIDTH,
    position: 'relative',
  },
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
  chartArea: {
    flex: 1,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.border,
    opacity: 0.4,
  },
  xAxisRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
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
    top: 8,
    right: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 2,
  },
  tooltipPortfolio: {
    ...Typography.BodySmall,
    color: Colors.accentGreen,
    fontFamily: 'Inter_600SemiBold',
  },
  tooltipBenchmark: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
  },
});
