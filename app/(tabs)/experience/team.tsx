import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';
import { useStrategyInquiry, useDiscussion } from '@/hooks/useAccountServices';
import { useAuthStore } from '@/store/authStore';

// ─── Inquiry Modal ────────────────────────────────────────────────────────────
function InquiryModal({
  visible,
  title,
  placeholder,
  onClose,
  onSubmit,
  isPending,
}: {
  visible: boolean;
  title: string;
  placeholder: string;
  onClose: () => void;
  onSubmit: (text: string) => void;
  isPending: boolean;
}) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim());
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={modalStyles.container}>
        <View style={modalStyles.handle} />
        <Text style={modalStyles.title}>{title}</Text>
        <TextInput
          style={modalStyles.textarea}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textSecondary}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          autoFocus
        />
        <View style={modalStyles.actions}>
          <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={modalStyles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[modalStyles.submitBtn, (!text.trim() || isPending) && modalStyles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!text.trim() || isPending}
            activeOpacity={0.85}
          >
            {isPending ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={modalStyles.submitBtnText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
    paddingTop: 16,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: { ...Typography.H1, color: Colors.textPrimary, marginBottom: 16 },
  textarea: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    ...Typography.Body,
    color: Colors.textPrimary,
    minHeight: 160,
    lineHeight: 20,
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: { ...Typography.ButtonLabel, color: Colors.textPrimary },
  submitBtn: {
    flex: 2,
    height: 50,
    borderRadius: 10,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { ...Typography.ButtonLabel, color: Colors.white },
});

// ─── Contact Button ───────────────────────────────────────────────────────────
function ContactBtn({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.contactBtn} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={icon} size={16} color={Colors.primaryDark} />
      <Text style={styles.contactBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

function safeOpen(url: string, fallback?: string) {
  Linking.canOpenURL(url).then((ok) => {
    if (ok) return Linking.openURL(url);
    Alert.alert('Cannot Open', fallback ?? 'Please contact investor.relations@qodeinvest.com');
  }).catch(() => {
    Alert.alert('Cannot Open', fallback ?? 'Please contact investor.relations@qodeinvest.com');
  });
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function YourTeamScreen() {
  const selectedAccountId = useAuthStore((s) => s.selectedAccountId);
  const accountId = selectedAccountId ?? '';

  const [strategyModalOpen, setStrategyModalOpen] = useState(false);
  const [discussionModalOpen, setDiscussionModalOpen] = useState(false);

  const strategyInquiry = useStrategyInquiry();
  const discussion = useDiscussion();

  const handleStrategySubmit = (question: string) => {
    strategyInquiry.mutate(
      { accountId, question },
      {
        onSuccess: () => {
          setStrategyModalOpen(false);
          Alert.alert('Question Sent', 'Your strategy question has been submitted. The fund manager will respond shortly.');
        },
        onError: (err: any) => {
          Alert.alert('Error', err?.response?.data?.message ?? 'Something went wrong. Please try again.');
        },
      }
    );
  };

  const handleDiscussionSubmit = (topic: string) => {
    discussion.mutate(
      { accountId, topic },
      {
        onSuccess: () => {
          setDiscussionModalOpen(false);
          Alert.alert('Query Raised', 'Your query has been submitted. The IR team will reach out within 1 business day.');
        },
        onError: (err: any) => {
          Alert.alert('Error', err?.response?.data?.message ?? 'Something went wrong. Please try again.');
        },
      }
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Team at Qode</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Intro */}
        <View style={styles.introBanner}>
          <Text style={styles.introTitle}>We're here for you</Text>
          <Text style={styles.introText}>
            Two dedicated teams ensure your investment experience is seamless — the Fund Manager for strategy, and our IR team for everything day-to-day.
          </Text>
        </View>

        {/* ── Fund Manager ── */}
        <Text style={styles.sectionLabel}>Fund Manager</Text>
        <View style={styles.card}>
          <View style={styles.roleHeader}>
            <View style={[styles.roleIcon, { backgroundColor: Colors.primaryDark + '15' }]}>
              <Ionicons name="trending-up-outline" size={22} color={Colors.primaryDark} />
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleName}>Portfolio Strategy</Text>
              <Text style={styles.roleSubtitle}>Rishabh Nahar & Gaurav Didwania</Text>
            </View>
          </View>

          <Text style={styles.roleDesc}>
            Oversees portfolio strategy, ensures alignment with Qode's investment philosophy, and takes responsibility for all model portfolio decisions.
          </Text>

          <View style={styles.whenToContact}>
            <Text style={styles.whenTitle}>Best for</Text>
            <View style={styles.bulletList}>
              {[
                'Strategy-specific queries and thesis behind holdings',
                'High-level portfolio discussions and outlook',
                'Quarterly and annual review meetings',
              ].map((b) => (
                <View key={b} style={styles.bullet}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{b}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setStrategyModalOpen(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="help-circle-outline" size={16} color={Colors.white} />
            <Text style={styles.primaryBtnText}>Ask a Question on Strategy</Text>
          </TouchableOpacity>
        </View>

        {/* ── Investor Relations ── */}
        <Text style={styles.sectionLabel}>Investor Relations (IR)</Text>
        <View style={styles.card}>
          <View style={styles.roleHeader}>
            <View style={[styles.roleIcon, { backgroundColor: Colors.accentGreen + '15' }]}>
              <Ionicons name="people-outline" size={22} color={Colors.accentGreen} />
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleName}>Investor Relations Team</Text>
              <Text style={styles.roleSubtitle}>investor.relations@qodeinvest.com</Text>
            </View>
          </View>

          <Text style={styles.roleDesc}>
            Your primary point of contact for monthly updates, review scheduling, account operations, top-ups, withdrawals, and any day-to-day queries.
          </Text>

          <View style={styles.whenToContact}>
            <Text style={styles.whenTitle}>Best for</Text>
            <View style={styles.bulletList}>
              {[
                'Monthly performance updates and report queries',
                'Account operations: top-ups, withdrawals, switches',
                'Scheduling review calls with fund managers',
                'General onboarding and documentation queries',
              ].map((b) => (
                <View key={b} style={styles.bullet}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{b}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.availabilityRow}>
            <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.availabilityText}>Available Mon–Fri, 9 AM – 5 PM IST</Text>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setDiscussionModalOpen(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubble-outline" size={16} color={Colors.white} />
            <Text style={styles.primaryBtnText}>Raise Any Query</Text>
          </TouchableOpacity>

          {/* Direct contact buttons */}
          <View style={styles.contactRow}>
            <ContactBtn
              icon="mail-outline"
              label="Email"
              onPress={() => safeOpen('mailto:investor.relations@qodeinvest.com', 'Email: investor.relations@qodeinvest.com')}
            />
            <ContactBtn
              icon="logo-whatsapp"
              label="WhatsApp"
              onPress={() => safeOpen('https://wa.me/919820300028', 'WhatsApp: +91 98203 00028')}
            />
            <ContactBtn
              icon="calendar-outline"
              label="Book a Call"
              onPress={() => safeOpen('https://crm.zoho.in/bookings/30minutesmeeting?rid=5ec313c47c4d600297f76c4db5ed16b9ec7023047ad9adae51cf7233a95aed39b78a114a405bd5ecb516bbd5c82eb973gid34d89af86b644a5bbc06e671dae756f5663840a52f688352fdf9715c33a97bcd', 'Visit the booking link to schedule a call')}
            />
          </View>
        </View>

        {/* Response SLA note */}
        <View style={styles.slaNote}>
          <Ionicons name="information-circle-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.slaText}>
            Standard queries are addressed within 1 business day. Urgent operational requests are handled same-day.
          </Text>
        </View>
      </ScrollView>

      {/* Modals */}
      <InquiryModal
        visible={strategyModalOpen}
        title="Ask a Strategy Question"
        placeholder="What would you like to ask the fund manager? (e.g. Why is gold allocated at 15%? What is the current market view?)"
        onClose={() => setStrategyModalOpen(false)}
        onSubmit={handleStrategySubmit}
        isPending={strategyInquiry.isPending}
      />
      <InquiryModal
        visible={discussionModalOpen}
        title="Raise a Query"
        placeholder="Describe your topic or query (e.g. I want to add ₹10L, please share bank details and process...)"
        onClose={() => setDiscussionModalOpen(false)}
        onSubmit={handleDiscussionSubmit}
        isPending={discussion.isPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 38, justifyContent: 'center' },
  headerTitle: { ...Typography.H2, color: Colors.textPrimary, flex: 1, textAlign: 'center' },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  introBanner: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  introTitle: { ...Typography.H2, color: Colors.white },
  introText: { ...Typography.BodySmall, color: 'rgba(255,255,255,0.75)', lineHeight: 18 },
  sectionLabel: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: -4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 14,
    ...cardShadow,
  },
  roleHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roleIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleInfo: { flex: 1 },
  roleName: { ...Typography.Body, color: Colors.textPrimary, fontFamily: 'Inter_700Bold' },
  roleSubtitle: { ...Typography.Caption, color: Colors.textSecondary, marginTop: 2 },
  roleDesc: { ...Typography.BodySmall, color: Colors.textSecondary, lineHeight: 18 },
  whenToContact: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  whenTitle: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  bulletList: { gap: 6 },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primaryDark,
    marginTop: 5,
  },
  bulletText: { ...Typography.BodySmall, color: Colors.textPrimary, flex: 1, lineHeight: 17 },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -4,
  },
  availabilityText: { ...Typography.Caption, color: Colors.textSecondary },
  primaryBtn: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 10,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: { ...Typography.ButtonLabel, color: Colors.white, fontSize: 13 },
  contactRow: { flexDirection: 'row', gap: 8 },
  contactBtn: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 5,
  },
  contactBtnText: { ...Typography.Caption, color: Colors.primaryDark, fontFamily: 'Inter_600SemiBold' },
  slaNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 4,
  },
  slaText: { ...Typography.Caption, color: Colors.textSecondary, flex: 1, lineHeight: 15 },
});
