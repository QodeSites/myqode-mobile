import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { Colors } from '@/constants/Colors';
import { cardShadow } from '@/constants/Typography';

interface CardContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
}

/**
 * On Android, `overflow: 'hidden'` clips the `elevation` shadow completely —
 * the card appears flat. We use a two-layer pattern:
 *   - Outer View: handles shadow + border radius (no overflow clip)
 *   - Inner View: clips overflowing children (chart lines, etc.)
 */
export function CardContainer({ children, style, noPadding = false }: CardContainerProps) {
  if (Platform.OS === 'android') {
    return (
      <View style={[styles.cardShadowWrapper, style]}>
        <View style={[styles.cardInner, noPadding && styles.noPadding]}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, noPadding && styles.noPadding, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // iOS: single view works fine (shadow doesn't use elevation)
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    overflow: 'hidden',
    ...cardShadow,
  },
  // Android shadow wrapper — elevation must NOT have overflow: 'hidden'
  cardShadowWrapper: {
    borderRadius: 12,
    ...cardShadow,
  },
  // Android inner clip layer
  cardInner: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    overflow: 'hidden',
  },
  noPadding: {
    padding: 0,
  },
});
