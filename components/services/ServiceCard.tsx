import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { OutlinedButton } from '@/components/ui/OutlinedButton';
import { Ionicons } from '@expo/vector-icons';

interface ServiceCardProps {
  title: string;
  description?: string;
  bullets?: string[];
  primaryCTA?: { label: string; onPress: () => void };
  secondaryCTA?: { label: string; onPress: () => void };
  icon?: keyof typeof Ionicons.glyphMap;
  children?: React.ReactNode;
}

export function ServiceCard({
  title,
  description,
  bullets,
  primaryCTA,
  secondaryCTA,
  icon,
  children,
}: ServiceCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {icon && (
          <View style={styles.iconBox}>
            <Ionicons name={icon} size={18} color={Colors.primaryDark} />
          </View>
        )}
        <Text style={styles.title}>{title}</Text>
      </View>

      {description && (
        <Text style={styles.description}>{description}</Text>
      )}

      {bullets && bullets.length > 0 && (
        <View style={styles.bullets}>
          {bullets.map((b, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={styles.dot} />
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      )}

      {children}

      <View style={styles.ctas}>
        {primaryCTA && (
          <PrimaryButton
            title={primaryCTA.label}
            onPress={primaryCTA.onPress}
            fullWidth={!secondaryCTA}
            style={secondaryCTA ? styles.halfBtn : undefined}
          />
        )}
        {secondaryCTA && (
          <OutlinedButton
            title={secondaryCTA.label}
            onPress={secondaryCTA.onPress}
            style={styles.halfBtn}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 16,
    ...cardShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...Typography.H3,
    color: Colors.textPrimary,
    flex: 1,
  },
  description: {
    ...Typography.Body,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  bullets: {
    marginBottom: 12,
    gap: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.accentGreen,
    marginTop: 6,
  },
  bulletText: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  ctas: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  halfBtn: {
    flex: 1,
  },
});
