import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';
import { engagementApi, NewsletterItem } from '@/api/engagement';

function PDFThumbnailCard({
  item,
  bgColor,
}: {
  item: NewsletterItem;
  bgColor: string;
}) {
  const openPDF = async () => {
    if (item.url) {
      await WebBrowser.openBrowserAsync(item.url);
    }
  };

  return (
    <View style={styles.pdfCard}>
      <TouchableOpacity
        style={[styles.pdfThumbnail, { backgroundColor: bgColor }]}
        onPress={openPDF}
        activeOpacity={0.85}
      >
        <View style={styles.pdfLogoBox}>
          <Text style={styles.pdfLogoText}>Qode</Text>
        </View>
        <View style={styles.pdfBadge}>
          <Text style={styles.pdfBadgeText}>PDF</Text>
        </View>
      </TouchableOpacity>
      <Text style={styles.pdfMonth}>{item.title}</Text>
      <TouchableOpacity onPress={openPDF} style={styles.pdfLink}>
        <Text style={styles.pdfLinkText}>Open PDF →</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function InsightsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const newsletters = useQuery({
    queryKey: ['engagement', 'newsletters'],
    queryFn: engagementApi.getNewsletters,
    staleTime: 30 * 60 * 1000,
  });

  const perspectives = useQuery({
    queryKey: ['engagement', 'perspectives'],
    queryFn: engagementApi.getPerspectives,
    staleTime: 30 * 60 * 1000,
  });

  const events = useQuery({
    queryKey: ['engagement', 'events'],
    queryFn: engagementApi.getEvents,
    staleTime: 30 * 60 * 1000,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      newsletters.refetch(),
      perspectives.refetch(),
      events.refetch(),
    ]);
    setRefreshing(false);
  }, [newsletters, perspectives, events]);

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
        <View style={styles.header}>
          <Text style={styles.title}>Insights & Events</Text>
          <Text style={styles.subtitle}>Newsletters, perspectives, and upcoming events from Qode</Text>
        </View>

        {/* Newsletter Archive */}
        <View style={styles.archiveSection}>
          <View style={styles.archiveBanner}>
            <Ionicons name="newspaper-outline" size={16} color={Colors.accentGold} />
            <Text style={styles.archiveBannerText}>Newsletter Archive</Text>
          </View>

          {newsletters.isLoading ? (
            <ActivityIndicator color={Colors.primaryDark} style={styles.loader} />
          ) : newsletters.data && newsletters.data.length > 0 ? (
            <FlatList
              data={newsletters.data}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.key}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <PDFThumbnailCard item={item} bgColor={Colors.primaryDark} />
              )}
            />
          ) : (
            <Text style={styles.emptyText}>No newsletters available</Text>
          )}
        </View>

        {/* Perspectives Archive */}
        <View style={styles.archiveSection}>
          <View style={[styles.archiveBanner, { backgroundColor: Colors.strategyQGF }]}>
            <Ionicons name="eye-outline" size={16} color={Colors.accentGold} />
            <Text style={styles.archiveBannerText}>Perspective Archive</Text>
          </View>

          {perspectives.isLoading ? (
            <ActivityIndicator color={Colors.primaryDark} style={styles.loader} />
          ) : perspectives.data && perspectives.data.length > 0 ? (
            <FlatList
              data={perspectives.data}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.key}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <PDFThumbnailCard item={item} bgColor={Colors.strategyQGF} />
              )}
            />
          ) : (
            <Text style={styles.emptyText}>No perspectives available</Text>
          )}
        </View>

        {/* Upcoming Events */}
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          {events.isLoading ? (
            <ActivityIndicator color={Colors.primaryDark} style={styles.loader} />
          ) : events.data && events.data.length > 0 ? (
            events.data.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventDateBadge}>
                  <Text style={styles.eventDateText}>
                    {new Date(event.date).getDate()}
                  </Text>
                  <Text style={styles.eventMonthText}>
                    {new Date(event.date).toLocaleString('default', { month: 'short' }).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventLocation}>{event.location}</Text>
                  {event.description && (
                    <Text style={styles.eventDesc} numberOfLines={2}>{event.description}</Text>
                  )}
                </View>
                {event.registrationUrl && (
                  <TouchableOpacity
                    style={styles.registerBtn}
                    onPress={() => WebBrowser.openBrowserAsync(event.registrationUrl!)}
                  >
                    <Text style={styles.registerBtnText}>Register</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyEventsCard}>
              <Ionicons name="calendar-outline" size={32} color={Colors.border} />
              <Text style={styles.emptyEventsText}>No upcoming events</Text>
              <Text style={styles.emptyEventsSubtext}>Check back soon for Qode events and webinars</Text>
            </View>
          )}
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
  archiveSection: { marginTop: 20 },
  archiveBanner: {
    backgroundColor: Colors.primaryDark,
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  archiveBannerText: { ...Typography.H3, color: Colors.white },
  horizontalList: { paddingHorizontal: 16, gap: 12 },
  pdfCard: { width: 130 },
  pdfThumbnail: {
    width: 130,
    height: 170,
    borderRadius: 10,
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 8,
  },
  pdfLogoBox: {},
  pdfLogoText: {
    ...Typography.H2,
    color: Colors.accentGold,
    fontFamily: 'Inter_700Bold',
  },
  pdfBadge: {
    backgroundColor: Colors.accentGold,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  pdfBadgeText: { ...Typography.Caption, color: Colors.primaryDark, fontFamily: 'Inter_700Bold' },
  pdfMonth: { ...Typography.BodySmall, color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
  pdfSubtitle: { ...Typography.Caption, color: Colors.textSecondary, marginTop: 2 },
  pdfLink: { marginTop: 4 },
  pdfLinkText: { ...Typography.Caption, color: Colors.accentGreen, fontFamily: 'Inter_600SemiBold' },
  loader: { marginVertical: 20 },
  emptyText: { ...Typography.BodySmall, color: Colors.textSecondary, textAlign: 'center', paddingVertical: 16, paddingHorizontal: 16 },
  eventsSection: { margin: 16, marginTop: 20 },
  sectionTitle: { ...Typography.H3, color: Colors.textPrimary, marginBottom: 12 },
  eventCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
    ...cardShadow,
  },
  eventDateBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventDateText: { ...Typography.H2, color: Colors.white, fontFamily: 'Inter_700Bold', lineHeight: 20 },
  eventMonthText: { fontSize: 8, color: Colors.accentGold, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
  eventInfo: { flex: 1 },
  eventTitle: { ...Typography.H3, color: Colors.textPrimary },
  eventLocation: { ...Typography.Caption, color: Colors.accentGreen, marginTop: 2 },
  eventDesc: { ...Typography.Caption, color: Colors.textSecondary, marginTop: 4, lineHeight: 15 },
  registerBtn: {
    backgroundColor: Colors.positive,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  registerBtnText: { ...Typography.Caption, color: Colors.white, fontFamily: 'Inter_700Bold' },
  emptyEventsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyEventsText: { ...Typography.H3, color: Colors.textSecondary },
  emptyEventsSubtext: { ...Typography.Caption, color: Colors.textSecondary, textAlign: 'center' },
});
