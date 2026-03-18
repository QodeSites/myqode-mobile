import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';
import { useQuery } from '@tanstack/react-query';
import { aboutApi } from '@/api/about';

export default function FoundationScreen() {
  const { data } = useQuery({
    queryKey: ['about', 'team'],
    queryFn: aboutApi.getTeam,
    staleTime: 30 * 60 * 1000,
  });

  const fundManagers = data?.filter((m) => m.type === 'fund_manager') ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Fund Managers</Text>
          <Text style={styles.subtitle}>The minds behind Qode's investment strategies</Text>
        </View>

        <View style={styles.content}>
          {/* Description */}
          <View style={styles.descCard}>
            <Ionicons name="star-outline" size={20} color={Colors.accentGold} style={styles.descIcon} />
            <Text style={styles.descText}>
              Our fund managers bring decades of combined experience in quantitative finance, equity research, and systematic trading. Their expertise forms the foundation of every investment decision at Qode.
            </Text>
          </View>

          {/* Fund Manager cards */}
          {fundManagers.length > 0 ? (
            fundManagers.map((m) => (
              <View key={m.id} style={styles.managerCard}>
                <View style={styles.managerAvatar}>
                  <Text style={styles.managerInitials}>
                    {m.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </Text>
                </View>
                <View style={styles.managerInfo}>
                  <Text style={styles.managerName}>{m.name}</Text>
                  <Text style={styles.managerRole}>{m.role}</Text>
                  {m.whenToContact && (
                    <Text style={styles.managerWhen}>{m.whenToContact}</Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            // Fallback
            <View style={styles.managerCard}>
              <View style={styles.managerAvatar}>
                <Text style={styles.managerInitials}>QI</Text>
              </View>
              <View style={styles.managerInfo}>
                <Text style={styles.managerName}>Qode Research Team</Text>
                <Text style={styles.managerRole}>Quantitative Fund Managers</Text>
                <Text style={styles.managerWhen}>
                  Systematic, evidence-based investment strategies with a long-term focus.
                </Text>
              </View>
            </View>
          )}

          {/* Credentials card */}
          <View style={styles.credCard}>
            <Text style={styles.credTitle}>Our Credentials</Text>
            {[
              { icon: 'shield-checkmark-outline', text: 'SEBI Registered PMS — INP000007975' },
              { icon: 'school-outline', text: 'Combined 30+ years in quantitative finance' },
              { icon: 'globe-outline', text: 'Global research with India-focused execution' },
              { icon: 'analytics-outline', text: 'Fully systematic, bias-free process' },
            ].map((c, i) => (
              <View key={i} style={styles.credRow}>
                <Ionicons name={c.icon as any} size={16} color={Colors.primaryDark} />
                <Text style={styles.credText}>{c.text}</Text>
              </View>
            ))}
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
  content: { padding: 16, gap: 16 },
  descCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    ...cardShadow,
  },
  descIcon: { marginTop: 1 },
  descText: { ...Typography.Body, color: Colors.textSecondary, lineHeight: 20, flex: 1 },
  managerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    ...cardShadow,
  },
  managerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  managerInitials: {
    ...Typography.H2,
    color: Colors.white,
    fontFamily: 'Inter_700Bold',
  },
  managerInfo: { flex: 1, gap: 4 },
  managerName: { ...Typography.H3, color: Colors.textPrimary },
  managerRole: { ...Typography.BodySmall, color: Colors.accentGreen, fontFamily: 'Inter_500Medium' },
  managerWhen: { ...Typography.Caption, color: Colors.textSecondary, lineHeight: 16 },
  credCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  credTitle: { ...Typography.H3, color: Colors.white, marginBottom: 4 },
  credRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  credText: { ...Typography.BodySmall, color: 'rgba(255,255,255,0.85)', flex: 1, lineHeight: 18 },
});
