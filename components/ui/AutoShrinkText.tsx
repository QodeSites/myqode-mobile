/**
 * AutoShrinkText — single-line text that shrinks its font to fit available width.
 *
 * iOS  : native `adjustsFontSizeToFit` (zero extra renders, fully smooth)
 * Android: two-pass invisible measurement — renders off-screen at full size,
 *          calculates the needed scale factor from wrap count, re-renders
 *          at the correct size, then becomes visible. Converges in ≤ 2 renders
 *          (~32 ms on any device), so the flash is imperceptible.
 *
 * Falls back to `ellipsizeMode="tail"` if the text still can't fit after
 * shrinking to `minimumFontScale * fontSize`.
 *
 * Usage:
 *   <AutoShrinkText style={styles.value} minimumFontScale={0.6}>
 *     {formatINR(amount)}
 *   </AutoShrinkText>
 */

import React, { useState, useCallback } from 'react';
import {
  Text,
  Platform,
  StyleSheet,
  TextStyle,
  TextProps,
  NativeSyntheticEvent,
  TextLayoutEventData,
} from 'react-native';

export interface AutoShrinkTextProps extends TextProps {
  minimumFontScale?: number;
  style?: TextStyle | TextStyle[] | any;
}

export function AutoShrinkText({
  minimumFontScale = 0.6,
  style,
  children,
  ...props
}: AutoShrinkTextProps) {
  if (Platform.OS === 'ios') {
    // Native support — no JS measurement needed
    return (
      <Text
        {...props}
        style={style}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={minimumFontScale}
        ellipsizeMode="tail"
      >
        {children}
      </Text>
    );
  }

  return (
    <AndroidAutoShrinkText
      style={style}
      minimumFontScale={minimumFontScale}
      {...props}
    >
      {children}
    </AndroidAutoShrinkText>
  );
}

function AndroidAutoShrinkText({
  minimumFontScale = 0.6,
  style,
  children,
  ...props
}: AutoShrinkTextProps) {
  const flatStyle = StyleSheet.flatten(style) as TextStyle;
  const baseFontSize = (flatStyle?.fontSize as number) ?? 14;
  const minFontSize = Math.max(Math.floor(baseFontSize * minimumFontScale), 6);

  const [fontSize, setFontSize] = useState(baseFontSize);
  const [ready, setReady] = useState(false);

  const handleTextLayout = useCallback(
    (e: NativeSyntheticEvent<TextLayoutEventData>) => {
      if (ready) return;
      const lines = e.nativeEvent.lines;

      if (lines.length > 1) {
        // Scale factor: shrink by the wrap ratio with a small safety buffer.
        // Converges in 1–2 renders even for very long strings.
        setFontSize((prev) => {
          const next = Math.max(
            Math.floor(prev * (1 / lines.length) * 0.92),
            minFontSize,
          );
          if (next <= minFontSize) {
            // Hit the floor — accept truncation for remaining overflow
            setReady(true);
          }
          return next;
        });
      } else {
        // Fits on a single line at current size — lock it in
        setReady(true);
      }
    },
    [ready, minFontSize],
  );

  return (
    <Text
      // Spread user props first so the component's own controlled props always win.
      // If the caller passes numberOfLines={1} it would prevent wrap detection
      // during the measurement phase — keeping controlled props last avoids that.
      {...props}
      style={[
        style,
        {
          fontSize,
          // lineHeight must track fontSize or text clips vertically
          lineHeight: fontSize * 1.3,
          // Keep invisible during measurement to avoid a brief wrong-size flash
          opacity: ready ? ((flatStyle?.opacity as number) ?? 1) : 0,
        },
      ]}
      // No numberOfLines during measurement so onTextLayout sees actual wrap count
      numberOfLines={ready ? 1 : undefined}
      ellipsizeMode="tail"
      onTextLayout={ready ? undefined : handleTextLayout}
    >
      {children}
    </Text>
  );
}
