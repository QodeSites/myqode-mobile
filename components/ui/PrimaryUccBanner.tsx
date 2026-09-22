import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Clipboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePrimaryUcc } from '@/hooks/usePrimaryUcc';

// ----------------------------------------------------------------------------
// Primary UCC notice
// ----------------------------------------------------------------------------
// On Nuvama's WealthSpectrum portal, every one of an investor's UCC codes is a
// valid login — but only the primary one shows all their mapped schemes in a
// single view. Logging in with any other code shows just that scheme. This
// tells the investor which code gives them the complete picture.
//
// It renders nothing when the code cannot be resolved with confidence — telling
// someone the wrong login ID is worse than staying quiet.
// ----------------------------------------------------------------------------

export function PrimaryUccBanner() {
  const { primaries } = usePrimaryUcc();
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  if (primaries.length === 0 || dismissed) return null;

  const multiple = primaries.length > 1;

  const copy = (code: string) => {
    try {
      // RN's built-in Clipboard — same call the bank-details and services
      // screens use, so this adds no new dependency.
      Clipboard.setString(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard unavailable — the code is visible on screen regardless.
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="information-circle-outline" size={16} color="#7A4800" />
        <Text style={styles.title}>
          See all your schemes in one place on Nuvama&apos;s WealthSpectrum portal.
        </Text>
        <TouchableOpacity onPress={() => setDismissed(true)} hitSlop={10}>
          <Ionicons name="close" size={16} color="#7A4800" />
        </TouchableOpacity>
      </View>

      <Text style={styles.body}>
        {multiple
          ? 'Each family group has its own primary UCC code. Sign in with the one below to see all the schemes mapped to that group:'
          : "Sign in with your primary UCC code below to view all your mapped schemes together. Your other codes still work, but each one shows only that scheme's portfolio."}
      </Text>

      {primaries.map((p) => (
        <View key={p.uccCode} style={styles.codeRow}>
          <View style={styles.codeBlock}>
            <Text style={styles.code}>{p.uccCode}</Text>
            {multiple && p.groupName ? (
              <Text style={styles.meta} numberOfLines={1}>{p.groupName}</Text>
            ) : null}
            {p.strategy ? (
              <Text style={styles.meta} numberOfLines={1}>{p.strategy}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={() => copy(p.uccCode)}
            style={styles.copyBtn}
            hitSlop={8}
            accessibilityLabel={`Copy ${p.uccCode}`}
          >
            <Ionicons
              name={copied === p.uccCode ? 'checkmark' : 'copy-outline'}
              size={13}
              color="#3D2400"
            />
            <Text style={styles.copyText}>
              {copied === p.uccCode ? 'Copied' : 'Copy'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={styles.footnote}>
        This applies to Nuvama&apos;s WealthSpectrum portal only — your myQode login is unchanged.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#E6B84A',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  title: {
    flex: 1,
    fontSize: 13,
    color: '#3D2400',
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 18,
  },
  body: {
    fontSize: 12,
    color: '#7A4800',
    fontFamily: 'Inter_400Regular',
    lineHeight: 17,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBD9A8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  codeBlock: {
    flex: 1,
    gap: 1,
  },
  code: {
    fontSize: 15,
    color: '#1C1C1C',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  meta: {
    fontSize: 10,
    color: '#6B6B6B',
    fontFamily: 'Inter_400Regular',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6B84A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  copyText: {
    fontSize: 11,
    color: '#3D2400',
    fontFamily: 'Inter_600SemiBold',
  },
  footnote: {
    fontSize: 10,
    color: '#7A4800',
    fontFamily: 'Inter_400Regular',
    opacity: 0.8,
  },
});
