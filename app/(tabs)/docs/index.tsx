import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';
import { useDocumentFiles } from '@/hooks/useDocuments';
import { DOCUMENT_CATEGORIES, DocumentCategory, DocumentFile } from '@/api/documents';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function CategoryAccordion({ category }: { category: DocumentCategory }) {
  const [expanded, setExpanded] = useState(false);
  const { data: files, isLoading } = useDocumentFiles(expanded ? category.id : null);

  const openFile = async (file: DocumentFile) => {
    if (file.url) {
      await WebBrowser.openBrowserAsync(file.url);
    }
  };

  const fileCount = files?.length ?? 0;

  return (
    <View style={styles.accordion}>
      <TouchableOpacity
        style={styles.accordionHeader}
        onPress={() => setExpanded((e) => !e)}
        activeOpacity={0.8}
      >
        <View style={styles.accordionLeft}>
          <View style={styles.catIcon}>
            <Ionicons name="document-text-outline" size={16} color={Colors.primaryDark} />
          </View>
          <Text style={styles.catName}>{category.name}</Text>
          {expanded && fileCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{fileCount}</Text>
            </View>
          )}
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={Colors.textSecondary}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.fileList}>
          {isLoading && (
            <ActivityIndicator size="small" color={Colors.primaryDark} style={styles.fileLoader} />
          )}

          {!isLoading && files && files.length === 0 && (
            <View style={styles.emptyFiles}>
              <Ionicons name="folder-open-outline" size={24} color={Colors.border} />
              <Text style={styles.emptyFilesText}>No files in this category</Text>
            </View>
          )}

          {files && files.map((file) => (
            <TouchableOpacity
              key={file.key}
              style={styles.fileRow}
              onPress={() => openFile(file)}
              activeOpacity={0.7}
            >
              <View style={styles.fileIcon}>
                <Ionicons name="document-outline" size={16} color={Colors.accentGreen} />
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={2}>
                  {file.filename}
                </Text>
                <Text style={styles.fileMeta}>
                  {formatDate(file.lastModified)} · {formatBytes(file.size)}
                </Text>
              </View>
              <View style={styles.downloadIcon}>
                <Ionicons name="open-outline" size={16} color={Colors.primaryDark} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function DocumentVaultScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Account Documents</Text>
          <Text style={styles.subtitle}>
            All your PMS documents, statements, and agreements in one place
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.accordionList}>
            {DOCUMENT_CATEGORIES.map((cat, i) => (
              <View key={cat.id} style={i < DOCUMENT_CATEGORIES.length - 1 && styles.divider}>
                <CategoryAccordion category={cat} />
              </View>
            ))}
          </View>

          {/* Info card */}
          <View style={styles.infoCard}>
            <View style={styles.infoAccent} />
            <View style={styles.infoBody}>
              <Text style={styles.infoTitle}>Need a Document?</Text>
              <Text style={styles.infoText}>
                Can't find what you're looking for? Our IR team can help you access any document.
              </Text>
              <TouchableOpacity
                onPress={() => Linking.openURL('mailto:investor.relations@qodeinvest.com?subject=Document Request')}
                style={styles.infoLink}
              >
                <Text style={styles.infoLinkText}>Contact IR Team →</Text>
              </TouchableOpacity>
            </View>
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
  subtitle: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  content: { padding: 16, gap: 16 },
  accordionList: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  accordion: {},
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
  },
  accordionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  catIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catName: {
    ...Typography.BodySmall,
    color: Colors.textPrimary,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  countBadge: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 999,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    ...Typography.Caption,
    color: Colors.white,
    fontFamily: 'Inter_700Bold',
  },
  fileList: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  fileLoader: { marginVertical: 20 },
  emptyFiles: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyFilesText: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  fileIcon: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: { flex: 1 },
  fileName: {
    ...Typography.BodySmall,
    color: Colors.textPrimary,
    fontFamily: 'Inter_500Medium',
  },
  fileMeta: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  downloadIcon: { padding: 6 },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 24,
    ...cardShadow,
  },
  infoAccent: { width: 4, backgroundColor: Colors.accentGold },
  infoBody: { flex: 1, padding: 14, gap: 4 },
  infoTitle: { ...Typography.H3, color: Colors.textPrimary },
  infoText: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  infoLink: { marginTop: 6 },
  infoLinkText: {
    ...Typography.BodySmall,
    color: Colors.accentGreen,
    fontFamily: 'Inter_600SemiBold',
  },
});
