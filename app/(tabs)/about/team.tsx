import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { OutlinedButton } from '@/components/ui/OutlinedButton';
import { useAuthStore } from '@/store/authStore';

const WHATSAPP_NUMBER = '919820300028';
const IR_EMAIL = 'investor.relations@qodeinvest.com';
const CALENDLY_URL = 'https://crm.zoho.in/bookings/30minutesmeeting?rid=5ec313c47c4d600297f76c4db5ed16b9ec7023047ad9adae51cf7233a95aed39b78a114a405bd5ecb516bbd5c82eb973gid34d89af86b644a5bbc06e671dae756f5663840a52f688352fdf9715c33a97bcd';

export default function TeamScreen() {
  const user = useAuthStore((s) => s.user);
  const selectedAccountId = useAuthStore((s) => s.selectedAccountId);

  const safeOpen = (url: string, fallback?: string) => {
    Linking.canOpenURL(url).then((ok) => {
      if (ok) return Linking.openURL(url);
      Alert.alert('Cannot Open', fallback ?? 'Please contact investor.relations@qodeinvest.com');
    }).catch(() => {
      Alert.alert('Cannot Open', fallback ?? 'Please contact investor.relations@qodeinvest.com');
    });
  };

  const openWhatsApp = () => safeOpen(`https://wa.me/${WHATSAPP_NUMBER}`, 'WhatsApp: +91 98203 00028');
  const openEmail = (email: string) => safeOpen(`mailto:${email}`, `Email: ${email}`);
  const openCalendly = () => safeOpen(CALENDLY_URL, 'Email investor.relations@qodeinvest.com with subject "Book a Call Request"');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Your Team at Qode</Text>
            {selectedAccountId && (
              <View style={styles.accountChip}>
                <Ionicons name="person-circle-outline" size={12} color={Colors.primaryDark} />
                <Text style={styles.accountChipText}>{selectedAccountId}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Dark green banner */}
        <View style={styles.banner}>
          <Ionicons name="people" size={20} color={Colors.accentGold} style={styles.bannerIcon} />
          <Text style={styles.bannerText}>
            We believe investing is a partnership. Your Qode team is here to guide, support, and grow with you.
          </Text>
        </View>

        <View style={styles.content}>
          {/* Divider */}
          <View style={styles.divider} />

          {/* Fund Manager */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.roleIcon}>
                <Ionicons name="analytics-outline" size={18} color={Colors.primaryDark} />
              </View>
              <View>
                <Text style={styles.sectionRole}>Fund Manager</Text>
                <Text style={styles.sectionName}>Quantitative Research Team</Text>
              </View>
            </View>
            <Text style={styles.sectionWhen}>
              <Text style={styles.boldLabel}>When to contact: </Text>
              For questions on investment strategy, portfolio construction, market views, or fund performance.
            </Text>
            <TouchableOpacity
              style={styles.linkBtn}
              onPress={() => openEmail('investor.relations@qodeinvest.com')}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={Colors.accentGreen} />
              <Text style={styles.linkBtnText}>Ask a Question on Strategy</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Investor Relations */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.roleIcon}>
                <Ionicons name="briefcase-outline" size={18} color={Colors.primaryDark} />
              </View>
              <View>
                <Text style={styles.sectionRole}>Investor Relations</Text>
                <Text style={styles.sectionName}>IR Team</Text>
              </View>
            </View>
            <Text style={styles.sectionWhen}>
              <Text style={styles.boldLabel}>When to contact: </Text>
              For account management, onboarding queries, documentation, redemptions, and general service requests.
            </Text>
            <View style={styles.btnRow}>
              <PrimaryButton
                title="Contact IR Team"
                onPress={() => openEmail(IR_EMAIL)}
                style={styles.halfBtn}
                icon="mail-outline"
              />
              <OutlinedButton
                title="Raise Any Query"
                onPress={openWhatsApp}
                style={styles.halfBtn}
                icon="logo-whatsapp"
              />
            </View>
          </View>

          <View style={styles.divider} />

          {/* Book a Call */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.roleIcon}>
                <Ionicons name="calendar-outline" size={18} color={Colors.primaryDark} />
              </View>
              <View>
                <Text style={styles.sectionRole}>Book A Call</Text>
                <Text style={styles.sectionName}>Schedule 1:1 with our team</Text>
              </View>
            </View>
            <Text style={styles.sectionWhen}>
              Schedule a 30-minute call with our investor relations or fund management team to discuss your portfolio, strategy, or any concerns.
            </Text>
            <OutlinedButton
              title="📅 Book a Call"
              onPress={openCalendly}
              fullWidth
              style={styles.bookBtn}
            />
          </View>

          <View style={styles.divider} />

          {/* WhatsApp / Email */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.roleIcon}>
                <Ionicons name="call-outline" size={18} color={Colors.primaryDark} />
              </View>
              <View>
                <Text style={styles.sectionRole}>Direct Contact</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.contactRow} onPress={openWhatsApp}>
              <View style={styles.contactIcon}>
                <Ionicons name="logo-whatsapp" size={18} color={Colors.positive} />
              </View>
              <View>
                <Text style={styles.contactLabel}>WhatsApp</Text>
                <Text style={styles.contactValue}>+91 98203 00028</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} style={styles.contactArrow} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactRow} onPress={() => openEmail(IR_EMAIL)}>
              <View style={styles.contactIcon}>
                <Ionicons name="mail-outline" size={18} color={Colors.primaryDark} />
              </View>
              <View>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>{IR_EMAIL}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} style={styles.contactArrow} />
            </TouchableOpacity>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...Typography.H1, color: Colors.textPrimary },
  accountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.background,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  accountChipText: { ...Typography.Caption, color: Colors.primaryDark, fontFamily: 'Inter_500Medium' },
  banner: {
    backgroundColor: Colors.primaryDark,
    margin: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bannerIcon: { marginTop: 1 },
  bannerText: {
    ...Typography.BodySmall,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 20,
    flex: 1,
  },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
  section: { paddingVertical: 16, gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roleIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionRole: { ...Typography.Caption, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionName: { ...Typography.H3, color: Colors.textPrimary },
  sectionWhen: { ...Typography.BodySmall, color: Colors.textSecondary, lineHeight: 19 },
  boldLabel: { fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  linkBtnText: {
    ...Typography.BodySmall,
    color: Colors.accentGreen,
    fontFamily: 'Inter_600SemiBold',
  },
  btnRow: { flexDirection: 'row', gap: 8 },
  halfBtn: { flex: 1 },
  bookBtn: { marginTop: 4 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactLabel: { ...Typography.Caption, color: Colors.textSecondary },
  contactValue: { ...Typography.BodySmall, color: Colors.textPrimary, fontFamily: 'Inter_500Medium' },
  contactArrow: { marginLeft: 'auto' },
});
