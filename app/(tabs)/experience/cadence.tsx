import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';

const CADENCE_ITEMS = [
  { freq: 'Daily', icon: 'sunny-outline' as const, items: ['NAV update on app', 'Portfolio value refresh'] },
  { freq: 'Monthly', icon: 'calendar-outline' as const, items: ['Monthly performance report', 'Newsletter by email', 'Portfolio update call (if requested)'] },
  { freq: 'Quarterly', icon: 'stats-chart-outline' as const, items: ['Detailed quarterly statement', 'Quarterly P&L report', 'Strategy review note'] },
  { freq: 'Annually', icon: 'ribbon-outline' as const, items: ['Annual performance summary', 'Tax computation statement', 'Account review meeting'] },
];

export default function ServiceCadenceScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Service Cadence</Text>
          <Text style={styles.subtitle}>Our commitment to keeping you informed and updated</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.introCard}>
            <Text style={styles.introText}>
              At Qode, we believe communication is key to a successful investment partnership. Here's when you can expect updates from us.
            </Text>
          </View>

          {CADENCE_ITEMS.map((c, i) => (
            <View key={i} style={styles.cadenceCard}>
              <View style={styles.cadenceHeader}>
                <View style={styles.cadenceIconBox}>
                  <Ionicons name={c.icon} size={18} color={Colors.primaryDark} />
                </View>
                <Text style={styles.cadenceFreq}>{c.freq}</Text>
              </View>
              {c.items.map((item, j) => (
                <View key={j} style={styles.cadenceItem}>
                  <Ionicons name="checkmark-circle-outline" size={14} color={Colors.accentGreen} />
                  <Text style={styles.cadenceItemText}>{item}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  title: { ...Typography.H1, color: Colors.textPrimary },
  subtitle: { ...Typography.BodySmall, color: Colors.textSecondary, marginTop: 4 },
  content: { padding: 16, gap: 14 },
  introCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 12,
    padding: 16,
  },
  introText: { ...Typography.Body, color: 'rgba(255,255,255,0.88)', lineHeight: 21 },
  cadenceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 10,
    ...cardShadow,
  },
  cadenceHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  cadenceIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cadenceFreq: { ...Typography.H3, color: Colors.textPrimary },
  cadenceItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cadenceItemText: { ...Typography.BodySmall, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
});
