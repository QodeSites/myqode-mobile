import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';

const ESCALATION_LEVELS = [
  {
    level: 1,
    title: 'Investor Relations (First Point)',
    contact: 'ir@qodeinvest.com',
    phone: '+91 98203 00028',
    type: 'email' as const,
    desc: 'For all account-related queries, document requests, and general service issues. Expected resolution: 3–5 business days.',
    color: Colors.accentGreen,
  },
  {
    level: 2,
    title: 'Senior Management',
    contact: 'compliance@qodeinvest.com',
    type: 'email' as const,
    desc: 'If your grievance is not resolved satisfactorily within 7 business days by the IR team. Expected resolution: 7 business days.',
    color: '#D97706',
  },
  {
    level: 3,
    title: 'Compliance Officer',
    contact: 'compliance@qodeinvest.com',
    type: 'email' as const,
    desc: 'For unresolved grievances or matters related to regulatory compliance. Expected resolution: 10 business days.',
    color: Colors.negative,
  },
  {
    level: 4,
    title: 'SEBI SCORES Portal',
    contact: 'https://scores.sebi.gov.in',
    type: 'url' as const,
    desc: 'If your complaint remains unresolved after 30 days, you may lodge a complaint with SEBI through the SCORES platform.',
    color: Colors.textSecondary,
  },
];

export default function EscalationScreen() {
  const handleContact = (contact: string, type: 'email' | 'url') => {
    if (type === 'email') {
      Linking.openURL(`mailto:${contact}?subject=Grievance - Qode PMS`);
    } else {
      Linking.openURL(contact);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Grievance Redressal</Text>
          <Text style={styles.subtitle}>
            Qode Advisors LLP · SEBI Reg. INP000007975
          </Text>
        </View>

        <View style={styles.content}>
          {/* Policy banner */}
          <View style={styles.policyBanner}>
            <Text style={styles.policyTitle}>Our Commitment</Text>
            <Text style={styles.policyText}>
              We are committed to addressing all client grievances promptly and fairly. Your feedback helps us improve our service quality continuously.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Escalation Matrix</Text>
          <Text style={styles.sectionSubtitle}>Follow these steps in order to resolve your grievance:</Text>

          {/* Escalation levels */}
          {ESCALATION_LEVELS.map((item, i) => (
            <View key={i} style={styles.levelCard}>
              {/* Left accent line */}
              <View style={[styles.levelAccent, { backgroundColor: item.color }]} />

              <View style={styles.levelBody}>
                <View style={styles.levelHeader}>
                  <View style={[styles.levelBadge, { backgroundColor: item.color }]}>
                    <Text style={styles.levelBadgeText}>L{item.level}</Text>
                  </View>
                  <Text style={styles.levelTitle}>{item.title}</Text>
                </View>

                <Text style={styles.levelDesc}>{item.desc}</Text>

                <TouchableOpacity
                  style={styles.contactBtn}
                  onPress={() => handleContact(item.contact, item.type)}
                >
                  <Ionicons
                    name={item.type === 'email' ? 'mail-outline' : 'globe-outline'}
                    size={13}
                    color={item.color}
                  />
                  <Text style={[styles.contactText, { color: item.color }]} numberOfLines={1}>
                    {item.contact}
                  </Text>
                  {item.phone && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${item.phone}`)}
                      style={styles.phoneBtn}
                    >
                      <Ionicons name="call-outline" size={13} color={item.color} />
                      <Text style={[styles.contactText, { color: item.color }]}>{item.phone}</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Timeline note */}
          <View style={styles.timelineNote}>
            <Ionicons name="time-outline" size={16} color={Colors.accentGold} />
            <Text style={styles.timelineNoteText}>
              SEBI mandates that all PMS grievances be acknowledged within 2 business days and resolved within 30 days.
            </Text>
          </View>
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
  policyBanner: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  policyTitle: { ...Typography.H3, color: Colors.white },
  policyText: { ...Typography.BodySmall, color: 'rgba(255,255,255,0.85)', lineHeight: 19 },
  sectionTitle: { ...Typography.H3, color: Colors.textPrimary, marginBottom: 2 },
  sectionSubtitle: { ...Typography.Caption, color: Colors.textSecondary, marginBottom: 4 },
  levelCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
    ...cardShadow,
  },
  levelAccent: { width: 4 },
  levelBody: { flex: 1, padding: 14, gap: 8 },
  levelHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  levelBadgeText: { ...Typography.Caption, color: Colors.white, fontFamily: 'Inter_700Bold' },
  levelTitle: { ...Typography.H3, color: Colors.textPrimary, flex: 1 },
  levelDesc: { ...Typography.BodySmall, color: Colors.textSecondary, lineHeight: 18 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  phoneBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 },
  contactText: { ...Typography.Caption, fontFamily: 'Inter_600SemiBold' },
  timelineNote: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  timelineNoteText: { ...Typography.BodySmall, color: '#92400E', flex: 1, lineHeight: 18 },
});
