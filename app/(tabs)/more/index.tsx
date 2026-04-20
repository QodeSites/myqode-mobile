import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface MenuItem {
  label: string;
  subtitle: string;
  icon: IoniconsName;
  route: string;
  accent: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    label: 'About Qode',
    subtitle: 'Philosophy, strategies, and team',
    icon: 'information-circle-outline',
    route: '/(tabs)/about',
    accent: Colors.primaryDark,
  },
  {
    label: 'Your Experience',
    subtitle: 'Account guide, support, and resources',
    icon: 'settings-outline',
    route: '/(tabs)/experience',
    accent: Colors.primaryMid,
  },
  {
    label: 'Engage',
    subtitle: 'Insights, referrals, feedback & more',
    icon: 'chatbubble-ellipses-outline',
    route: '/(tabs)/engagement',
    accent: Colors.accentGreen,
  },
  {
    label: 'Documents',
    subtitle: 'Agreements, disclosures, and CML',
    icon: 'shield-checkmark-outline',
    route: '/(tabs)/docs',
    accent: Colors.accentGold,
  },
];

export default function MoreScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isImpersonating = useAuthStore((s) => s.isImpersonating);
  const adminUser = useAuthStore((s) => s.adminUser);
  const stopImpersonation = useAuthStore((s) => s.stopImpersonation);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleStopImpersonation = () => {
    Alert.alert(
      'Exit Impersonation',
      `Return to ${adminUser?.name ?? 'your account'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit',
          onPress: () => {
            stopImpersonation();
            router.replace('/(tabs)/more/admin' as any);
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await authApi.logout();
          } finally {
            setIsLoggingOut(false);
            logout();
          }
        },
      },
    ]);
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : '?';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
      </View>

      {/* Impersonation banner */}
      {isImpersonating && (
        <View style={styles.impersonationBanner}>
          <Ionicons name="eye-outline" size={15} color="#92400E" />
          <Text style={styles.impersonationText} numberOfLines={1}>
            Viewing as impersonated account
          </Text>
          <TouchableOpacity onPress={handleStopImpersonation} style={styles.exitBtn}>
            <Text style={styles.exitBtnText}>Exit</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name ?? '—'}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? ''}</Text>
            {user?.clientCode ? (
              <Text style={styles.profileCode}>Client #{user.clientCode}</Text>
            ) : null}
          </View>
        </View>

        {/* Menu items */}
        <Text style={styles.sectionLabel}>Navigation</Text>
        <View style={styles.menuGroup}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuRow,
                index < MENU_ITEMS.length - 1 && styles.menuRowBorder,
              ]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.75}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.accent + '18' }]}>
                <Ionicons name={item.icon} size={20} color={item.accent} />
              </View>
              <View style={styles.menuBody}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Admin: All Accounts — only visible to super admins */}
        {user?.isSuperAdmin && (
          <>
            <Text style={styles.sectionLabel}>Admin</Text>
            <TouchableOpacity
              style={styles.adminBtn}
              onPress={() => router.push('/(tabs)/more/admin' as any)}
              activeOpacity={0.8}
            >
              <View style={styles.adminBtnLeft}>
                <View style={styles.adminIcon}>
                  <Ionicons name="people" size={20} color="#7C3AED" />
                </View>
                <View>
                  <Text style={styles.adminBtnLabel}>All Accounts</Text>
                  <Text style={styles.adminBtnSub}>Login as any client</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </>
        )}

        {/* Sign out */}
        <TouchableOpacity
          style={[styles.signOutBtn, isLoggingOut && styles.disabledBtn]}
          onPress={handleLogout}
          disabled={isLoggingOut}
          activeOpacity={0.8}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color={Colors.negative} />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={18} color={Colors.negative} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.version}>myQode v1.0</Text>
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
  headerTitle: { ...Typography.H1, color: Colors.textPrimary },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },

  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    ...cardShadow,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...Typography.H2,
    color: Colors.white,
    fontFamily: 'Inter_700Bold',
  },
  profileInfo: { flex: 1, gap: 2 },
  profileName: {
    ...Typography.Body,
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  profileEmail: { ...Typography.Caption, color: Colors.textSecondary },
  profileCode: { ...Typography.Caption, color: Colors.textSecondary, marginTop: 2 },

  sectionLabel: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: -4,
  },

  menuGroup: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuBody: { flex: 1, gap: 2 },
  menuLabel: {
    ...Typography.Body,
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  menuSubtitle: { ...Typography.Caption, color: Colors.textSecondary },

  impersonationBanner: {
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#FCD34D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 8,
  },
  impersonationText: {
    ...Typography.BodySmall,
    color: '#92400E',
    flex: 1,
    fontFamily: 'Inter_500Medium',
  },
  exitBtn: {
    backgroundColor: '#92400E',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  exitBtnText: {
    ...Typography.Caption,
    color: '#FEF3C7',
    fontFamily: 'Inter_600SemiBold',
  },
  adminBtn: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
    ...cardShadow,
  },
  adminBtnLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminIcon: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminBtnLabel: {
    ...Typography.Body,
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  adminBtnSub: { ...Typography.Caption, color: Colors.textSecondary },
  signOutBtn: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    marginTop: 4,
    ...cardShadow,
  },
  signOutText: {
    ...Typography.Body,
    color: Colors.negative,
    fontFamily: 'Inter_600SemiBold',
  },
  disabledBtn: { opacity: 0.6 },
  version: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
