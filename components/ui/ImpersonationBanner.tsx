import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';

export function ImpersonationBanner() {
  const isImpersonating = useAuthStore((s) => s.isImpersonating);
  const user = useAuthStore((s) => s.user);
  const adminUser = useAuthStore((s) => s.adminUser);
  const stopImpersonation = useAuthStore((s) => s.stopImpersonation);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  if (!isImpersonating) return null;

  const handleExit = async () => {
    await stopImpersonation();
    // S-5: Clear query cache so the admin never sees the impersonated user's
    // stale data after returning to their own session.
    queryClient.clear();
    router.replace('/(tabs)/more/admin' as any);
  };

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 6 }]}>
      <Ionicons name="eye-outline" size={14} color="#7A4800" style={styles.icon} />
      <View style={styles.textBlock}>
        <Text style={styles.text} numberOfLines={1}>
          Viewing as <Text style={styles.bold}>{user?.name ?? user?.email ?? '—'}</Text>
        </Text>
        {user?.accountCodes && user.accountCodes.length > 0 ? (
          <Text style={styles.codes} numberOfLines={1}>
            {user.accountCodes.filter(c => /^[A-Z]{3}\d/.test(c)).join(' · ')}
          </Text>
        ) : null}
      </View>
      <TouchableOpacity onPress={handleExit} style={styles.exitBtn} hitSlop={8}>
        <Text style={styles.exitText}>Exit View</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FFF3CD',
    borderBottomWidth: 1,
    borderBottomColor: '#E6B84A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 6,
  },
  icon: {
    marginTop: 1,
  },
  textBlock: {
    flex: 1,
    gap: 1,
  },
  text: {
    fontSize: 12,
    color: '#7A4800',
    fontFamily: 'Inter_400Regular',
  },
  bold: {
    fontFamily: 'Inter_600SemiBold',
  },
  codes: {
    fontSize: 11,
    color: '#7A4800',
    fontFamily: 'Inter_400Regular',
    opacity: 0.75,
  },
  exitBtn: {
    backgroundColor: '#E6B84A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  exitText: {
    fontSize: 12,
    color: '#3D2400',
    fontFamily: 'Inter_600SemiBold',
  },
});
