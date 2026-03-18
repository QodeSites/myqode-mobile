import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';

const MAPPING_STEPS = [
  { step: 1, title: 'PAN Verification', desc: 'Your PAN is verified with SEBI and the depository for compliance.' },
  { step: 2, title: 'Bank Account Linkage', desc: 'Your designated bank account is mapped for all fund movements.' },
  { step: 3, title: 'Demat Account Mapping', desc: 'Your Demat account is linked for direct securities credit.' },
  { step: 4, title: 'Portfolio Activation', desc: 'Once mapped, your portfolio goes live and investments begin.' },
];

export default function AccountMappingScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Account Mapping</Text>
          <Text style={styles.subtitle}>How your accounts are linked to Qode's PMS system</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.accentGold} />
            <Text style={styles.infoText}>
              Account mapping ensures your funds are securely linked and compliance requirements are met before your portfolio goes live.
            </Text>
          </View>

          {MAPPING_STEPS.map((s, i) => (
            <View key={i} style={styles.stepCard}>
              <View style={styles.stepNumBadge}>
                <Text style={styles.stepNum}>{s.step}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={18} color={Colors.positive} />
            </View>
          ))}

          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>Need Help with Mapping?</Text>
            <Text style={styles.noteText}>
              Contact our IR team at ir@qodeinvest.com or via WhatsApp for assistance with account mapping.
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
  content: { padding: 16, gap: 12 },
  infoCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  infoText: { ...Typography.BodySmall, color: Colors.textPrimary, flex: 1, lineHeight: 19 },
  stepCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...cardShadow,
  },
  stepNumBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNum: { ...Typography.BodySmall, color: Colors.white, fontFamily: 'Inter_700Bold' },
  stepContent: { flex: 1 },
  stepTitle: { ...Typography.H3, color: Colors.textPrimary },
  stepDesc: { ...Typography.Caption, color: Colors.textSecondary, marginTop: 3, lineHeight: 16 },
  noteCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 12,
    padding: 16,
    gap: 6,
    marginTop: 8,
  },
  noteTitle: { ...Typography.H3, color: Colors.white },
  noteText: { ...Typography.BodySmall, color: 'rgba(255,255,255,0.85)', lineHeight: 19 },
});
