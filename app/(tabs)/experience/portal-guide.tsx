import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Linking,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';
import { engagementApi, PortalGuideFile } from '@/api/engagement';

const PORTAL_URL = 'https://eclientreporting.nuvamaassetservices.com/wealthspectrum/app/';
const PASSWORD_GUIDE_URL = 'https://myqode.qodeinvest.com/tutorial-document/How to Generate Your Password on Wealth Spectrum.pdf';

const PORTAL_FEATURES = [
  { name: 'Dashboard', desc: 'Portfolio snapshot, asset allocation overview' },
  { name: 'Portfolio', desc: 'Holdings, cost basis, market value, unrealized gains' },
  { name: 'Performance', desc: 'Returns, benchmark comparison, trailing returns' },
  { name: 'Allocations', desc: 'Breakdown by asset class and strategy' },
  { name: 'Transactions', desc: 'Purchases, sales, and cash movements' },
  { name: 'Reports', desc: '50+ report types with snapshots and tutorials' },
];

const REPORT_CATEGORIES = [
  {
    name: 'Accounting & Financial',
    reports: [
      'Account Statement',
      'Account Statement - Non unitized',
      'Trial Balance',
      'Profit and Loss Account - Balance Sheet',
    ],
  },
  {
    name: 'Activity',
    reports: ['Transaction Statement', 'Capital Register', 'Bank Book'],
  },
  {
    name: 'Income, Expenses & Tax',
    reports: [
      'Statement of Interest',
      'Statement of Dividend',
      'Statement of Capital Gain Loss',
      'Statement of Expenses',
      'Corporate Benefit',
    ],
  },
  {
    name: 'Portfolio Reporting & Performance',
    reports: [
      'Portfolio Fact Sheet',
      'Portfolio Performance Summary',
      'Portfolio Performance with Benchmarks',
      'Portfolio Appraisal',
      'Performance Appraisal',
      'Performance by Security Since Inception',
      'Portfolio Position Analysis',
    ],
  },
  {
    name: 'Combined Report',
    reports: ['PMS Investor Report'],
  },
];

// ─── Image Carousel Modal ─────────────────────────────────────────────────────
function SnapshotModal({
  files,
  visible,
  title,
  onClose,
}: {
  files: PortalGuideFile[];
  visible: boolean;
  title: string;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);

  if (!files.length) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={imgStyles.overlay}>
        <View style={imgStyles.container}>
          <View style={imgStyles.header}>
            <Text style={imgStyles.title} numberOfLines={1}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <Image
            source={{ uri: files[idx]?.url }}
            style={imgStyles.image}
            resizeMode="contain"
          />
          {files.length > 1 && (
            <View style={imgStyles.pagination}>
              <TouchableOpacity
                onPress={() => setIdx((i) => Math.max(0, i - 1))}
                disabled={idx === 0}
                style={[imgStyles.pageBtn, idx === 0 && imgStyles.pageBtnDisabled]}
              >
                <Ionicons name="chevron-back" size={18} color={Colors.primaryDark} />
              </TouchableOpacity>
              <Text style={imgStyles.pageText}>{idx + 1} / {files.length}</Text>
              <TouchableOpacity
                onPress={() => setIdx((i) => Math.min(files.length - 1, i + 1))}
                disabled={idx === files.length - 1}
                style={[imgStyles.pageBtn, idx === files.length - 1 && imgStyles.pageBtnDisabled]}
              >
                <Ionicons name="chevron-forward" size={18} color={Colors.primaryDark} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const imgStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { ...Typography.H3, color: Colors.textPrimary, flex: 1, marginRight: 8 },
  image: { width: '100%', height: 280, backgroundColor: Colors.background },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    gap: 16,
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageBtnDisabled: { opacity: 0.35 },
  pageText: { ...Typography.Body, color: Colors.textSecondary },
});

// ─── Report Row ───────────────────────────────────────────────────────────────
function ReportRow({
  report,
  snapshots,
  video,
}: {
  report: string;
  snapshots: PortalGuideFile[];
  video: PortalGuideFile | null;
}) {
  const [snapshotModal, setSnapshotModal] = useState(false);
  const hasSnapshots = snapshots.length > 0;
  const hasVideo = !!video;

  const handleVideo = () => {
    if (video) Linking.openURL(video.url);
  };

  return (
    <View style={styles.reportRow}>
      <Text style={styles.reportName}>{report}</Text>
      <View style={styles.reportActions}>
        <TouchableOpacity
          style={[styles.reportBtn, !hasSnapshots && styles.reportBtnDisabled]}
          onPress={() => hasSnapshots && setSnapshotModal(true)}
          disabled={!hasSnapshots}
          activeOpacity={0.8}
        >
          <Ionicons name="images-outline" size={13} color={hasSnapshots ? Colors.primaryDark : Colors.border} />
          <Text style={[styles.reportBtnText, !hasSnapshots && styles.reportBtnTextDisabled]}>
            Snapshots
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.reportBtn, !hasVideo && styles.reportBtnDisabled]}
          onPress={handleVideo}
          disabled={!hasVideo}
          activeOpacity={0.8}
        >
          <Ionicons name="play-circle-outline" size={13} color={hasVideo ? Colors.accentGreen : Colors.border} />
          <Text style={[styles.reportBtnText, !hasVideo && styles.reportBtnTextDisabled, hasVideo && { color: Colors.accentGreen }]}>
            Tutorial
          </Text>
        </TouchableOpacity>
      </View>
      <SnapshotModal
        files={snapshots}
        visible={snapshotModal}
        title={report}
        onClose={() => setSnapshotModal(false)}
      />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PortalGuideScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['engagement', 'portal-guide'],
    queryFn: engagementApi.getPortalGuide,
    staleTime: 5 * 60 * 1000,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const getSnapshots = (reportName: string): PortalGuideFile[] =>
    data?.byReport?.snapshots?.[reportName] ?? [];

  const getVideo = (reportName: string): PortalGuideFile | null =>
    data?.byReport?.videos?.[reportName]?.[0] ?? null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Investor Portal Guide</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accentGreen} />
        }
        contentContainerStyle={styles.scroll}
      >
        {/* Portal card */}
        <View style={styles.portalCard}>
          <View style={styles.portalCardTop}>
            <View>
              <Text style={styles.portalName}>WealthSpectrum</Text>
              <Text style={styles.portalBy}>by Nuvama Asset Services</Text>
            </View>
            <View style={styles.portalBadge}>
              <Text style={styles.portalBadgeText}>Live</Text>
            </View>
          </View>
          <Text style={styles.portalDesc}>
            Access your full portfolio reports, performance analytics, transaction history, and 50+ report types through the WealthSpectrum portal.
          </Text>
          <View style={styles.portalBtnRow}>
            <TouchableOpacity
              style={styles.portalBtn}
              onPress={() => Linking.openURL(PORTAL_URL)}
              activeOpacity={0.85}
            >
              <Ionicons name="open-outline" size={16} color={Colors.white} />
              <Text style={styles.portalBtnText}>Open Portal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.portalBtnOutline}
              onPress={() => Linking.openURL(PASSWORD_GUIDE_URL)}
              activeOpacity={0.85}
            >
              <Ionicons name="key-outline" size={16} color={Colors.primaryDark} />
              <Text style={styles.portalBtnOutlineText}>Password Guide</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Portal features */}
        <Text style={styles.sectionLabel}>Portal Features</Text>
        <View style={styles.featuresCard}>
          {PORTAL_FEATURES.map((f, i) => (
            <View key={f.name} style={[styles.featureRow, i < PORTAL_FEATURES.length - 1 && styles.featureRowBorder]}>
              <Text style={styles.featureName}>{f.name}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>

        {/* Report Categories */}
        <Text style={styles.sectionLabel}>Report Categories</Text>
        {isLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.accentGreen} size="small" />
            <Text style={styles.loadingText}>Loading report media...</Text>
          </View>
        )}
        {isError && (
          <TouchableOpacity style={styles.errorCard} onPress={() => refetch()}>
            <Ionicons name="refresh-outline" size={14} color={Colors.negative} />
            <Text style={styles.errorText}>Couldn't load snapshots/tutorials. Tap to retry.</Text>
          </TouchableOpacity>
        )}

        {REPORT_CATEGORIES.map((cat) => (
          <View key={cat.name} style={styles.categoryCard}>
            <Text style={styles.categoryName}>{cat.name}</Text>
            {cat.reports.map((report) => (
              <ReportRow
                key={report}
                report={report}
                snapshots={getSnapshots(report)}
                video={getVideo(report)}
              />
            ))}
          </View>
        ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 38, justifyContent: 'center' },
  headerTitle: { ...Typography.H2, color: Colors.textPrimary, flex: 1, textAlign: 'center' },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  portalCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  portalCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  portalName: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    color: Colors.white,
  },
  portalBy: { ...Typography.Caption, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  portalBadge: {
    backgroundColor: Colors.positive,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  portalBadgeText: { ...Typography.Caption, color: Colors.white, fontFamily: 'Inter_700Bold' },
  portalDesc: { ...Typography.BodySmall, color: 'rgba(255,255,255,0.75)', lineHeight: 18 },
  portalBtnRow: { flexDirection: 'row', gap: 10 },
  portalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.accentGold,
    borderRadius: 10,
    paddingVertical: 12,
  },
  portalBtnText: { ...Typography.ButtonLabel, color: Colors.primaryDark, fontSize: 13 },
  portalBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  portalBtnOutlineText: { ...Typography.ButtonLabel, color: Colors.white, fontSize: 13 },
  sectionLabel: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: -4,
  },
  featuresCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  featureRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 2,
  },
  featureRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  featureName: { ...Typography.Body, color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
  featureDesc: { ...Typography.Caption, color: Colors.textSecondary },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: { ...Typography.BodySmall, color: Colors.textSecondary },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.lightRed,
    borderRadius: 10,
    padding: 12,
  },
  errorText: { ...Typography.Caption, color: Colors.negative },
  categoryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  categoryName: {
    ...Typography.Body,
    color: Colors.textPrimary,
    fontFamily: 'Inter_700Bold',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  reportRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  reportName: { ...Typography.BodySmall, color: Colors.textPrimary, fontFamily: 'Inter_500Medium' },
  reportActions: { flexDirection: 'row', gap: 8 },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  reportBtnDisabled: { opacity: 0.4 },
  reportBtnText: { ...Typography.Caption, color: Colors.primaryDark, fontFamily: 'Inter_500Medium' },
  reportBtnTextDisabled: { color: Colors.border },
});
