import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';
import { useDocumentCategories, useDocumentFiles } from '@/hooks/useDocuments';
import { formatDate } from '@/utils/formatDate';
import { DocumentCategory, DocumentFile } from '@/api/documents';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

function CategoryAccordion({ category }: { category: DocumentCategory }) {
  const [expanded, setExpanded] = useState(false);
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  const toggle = () => {
    if (expanded) {
      height.value = withTiming(0, { duration: 200 });
      opacity.value = withTiming(0, { duration: 150 });
    } else {
      height.value = withTiming(300, { duration: 250 });
      opacity.value = withTiming(1, { duration: 200 });
    }
    setExpanded((e) => !e);
  };

  const animStyle = useAnimatedStyle(() => ({
    height: height.value,
    overflow: 'hidden',
    opacity: opacity.value,
  }));

  const { data: files, isLoading } = useDocumentFiles(expanded ? category.id : null);

  const openFile = async (file: DocumentFile) => {
    if (file.url) {
      await WebBrowser.openBrowserAsync(file.url);
    }
  };

  return (
    <View style={styles.accordion}>
      <TouchableOpacity style={styles.accordionHeader} onPress={toggle} activeOpacity={0.8}>
        <View style={styles.accordionLeft}>
          <View style={styles.catIcon}>
            <Ionicons name="document-text-outline" size={16} color={Colors.primaryDark} />
          </View>
          <Text style={styles.catName}>{category.name}</Text>
          {category.count > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{category.count}</Text>
            </View>
          )}
        </View>
        <View style={styles.accordionRight}>
          {category.count > 0 && !expanded && (
            <Text style={styles.viewFilesText}>View Files</Text>
          )}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={Colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      <Animated.View style={animStyle}>
        <View style={styles.fileList}>
          {isLoading && (
            <ActivityIndicator
              size="small"
              color={Colors.primaryDark}
              style={styles.fileLoader}
            />
          )}
          {files && files.length === 0 && (
            <View style={styles.emptyFiles}>
              <Ionicons name="folder-open-outline" size={24} color={Colors.border} />
              <Text style={styles.emptyFilesText}>No files found</Text>
            </View>
          )}
          {files &&
            files.map((file) => (
              <TouchableOpacity
                key={file.id}
                style={styles.fileRow}
                onPress={() => openFile(file)}
                activeOpacity={0.7}
              >
                <View style={styles.fileIcon}>
                  <Ionicons name="document-outline" size={16} color={Colors.accentGreen} />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Text style={styles.fileDate}>{formatDate(file.date, 'medium')}</Text>
                </View>
                <TouchableOpacity onPress={() => openFile(file)} style={styles.downloadIcon}>
                  <Ionicons name="download-outline" size={16} color={Colors.primaryDark} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
        </View>
      </Animated.View>
    </View>
  );
}

export default function DocumentVaultScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { data: categories, isLoading, isError, refetch } = useDocumentCategories();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Fallback categories if API fails
  const fallbackCategories: DocumentCategory[] = [
    { id: 'pms-agreement', name: 'PMS Agreement', count: 0 },
    { id: 'account-opening', name: 'Account Opening Documents', count: 8 },
    { id: 'cml', name: 'CML', count: 1 },
    { id: 'tax-documents', name: 'Tax Documents', count: 0 },
    { id: 'quarterly-statements', name: 'Quarterly Statements', count: 0 },
  ];

  const displayCategories = categories ?? (isError ? fallbackCategories : []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accentGreen}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Account Documents</Text>
          <Text style={styles.subtitle}>
            All your PMS documents, statements, and agreements in one place
          </Text>
        </View>

        <View style={styles.content}>
          {/* Document list */}
          {isLoading ? (
            <ActivityIndicator
              color={Colors.primaryDark}
              style={styles.mainLoader}
            />
          ) : (
            <View style={styles.accordionList}>
              {displayCategories.map((cat) => (
                <CategoryAccordion key={cat.id} category={cat} />
              ))}
            </View>
          )}

          {/* Info card */}
          <View style={styles.infoCard}>
            <View style={styles.infoAccent} />
            <View style={styles.infoBody}>
              <Text style={styles.infoTitle}>Need a Document?</Text>
              <Text style={styles.infoText}>
                Can't find what you're looking for? Our IR team can help you access any document.
              </Text>
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL('mailto:ir@qodeinvest.com?subject=Document Request')
                }
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
  mainLoader: { marginTop: 40 },
  accordionList: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  accordion: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
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
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    ...Typography.Caption,
    color: Colors.white,
    fontFamily: 'Inter_700Bold',
  },
  accordionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewFilesText: {
    ...Typography.Caption,
    color: Colors.accentGreen,
    fontFamily: 'Inter_600SemiBold',
  },
  fileList: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 60,
  },
  fileLoader: { marginVertical: 16 },
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
  fileDate: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  downloadIcon: {
    padding: 6,
  },
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
  infoAccent: {
    width: 4,
    backgroundColor: Colors.accentGold,
  },
  infoBody: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  infoTitle: {
    ...Typography.H3,
    color: Colors.textPrimary,
  },
  infoText: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  infoLink: {
    marginTop: 6,
  },
  infoLinkText: {
    ...Typography.BodySmall,
    color: Colors.accentGreen,
    fontFamily: 'Inter_600SemiBold',
  },
});
