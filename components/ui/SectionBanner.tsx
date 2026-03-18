import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

interface SectionBannerProps {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
  bgColor?: string;
}

export function SectionBanner({ title, subtitle, style, bgColor }: SectionBannerProps) {
  return (
    <View style={[styles.banner, bgColor ? { backgroundColor: bgColor } : {}, style]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.primaryDark,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    ...Typography.H2,
    color: Colors.white,
  },
  subtitle: {
    ...Typography.BodySmall,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
});
