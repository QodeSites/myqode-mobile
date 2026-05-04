import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Linking,
  Platform,
  Image,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { PrimaryButton } from './PrimaryButton';
import { OutlinedButton } from './OutlinedButton';

interface ForceUpdateModalProps {
  visible: boolean;
  /** If true the modal cannot be dismissed — user must update. */
  forceUpdate: boolean;
  latestVersion: string;
  message: string;
  updateUrls: { ios: string; android: string };
  /** Only relevant when forceUpdate is false — called when the user taps "Maybe Later" */
  onDismiss?: () => void;
}

export function ForceUpdateModal({
  visible,
  forceUpdate,
  latestVersion,
  message,
  updateUrls,
  onDismiss,
}: ForceUpdateModalProps) {
  const storeUrl = Platform.OS === 'ios' ? updateUrls.ios : updateUrls.android;

  const handleUpdate = () => {
    Linking.openURL(storeUrl).catch(() => {
      // Fallback — open the web version of the store page
      Linking.openURL(
        Platform.OS === 'ios'
          ? 'https://apps.apple.com'
          : 'https://play.google.com/store',
      );
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // Prevent hardware back-button dismissal when force update is required
      onRequestClose={forceUpdate ? undefined : onDismiss}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* App icon */}
          <View style={styles.iconWrapper}>
            <Image
              source={require('@/assets/icon.png')}
              style={styles.appIcon}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>
            {forceUpdate ? 'Update Required' : 'Update Available'}
          </Text>

          <Text style={styles.version}>Version {latestVersion}</Text>

          <Text style={styles.message}>{message}</Text>

          <PrimaryButton
            title={Platform.OS === 'ios' ? 'Open App Store' : 'Open Play Store'}
            onPress={handleUpdate}
            fullWidth
            style={styles.updateBtn}
          />

          {!forceUpdate && onDismiss && (
            <OutlinedButton
              title="Maybe Later"
              onPress={onDismiss}
              fullWidth
              style={styles.laterBtn}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appIcon: {
    width: 72,
    height: 72,
  },
  title: {
    ...Typography.H2,
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  version: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    ...Typography.Body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  updateBtn: {
    marginBottom: 10,
  },
  laterBtn: {
    marginBottom: 0,
  },
});
