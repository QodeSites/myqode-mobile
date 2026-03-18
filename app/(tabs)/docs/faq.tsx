import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface FAQItem {
  q: string;
  a: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    category: 'Getting Started',
    q: 'What is Portfolio Management Service (PMS)?',
    a: 'PMS is a SEBI-regulated investment service where a professional portfolio manager manages your equity portfolio on your behalf. Minimum investment is ₹50 lakhs as per SEBI regulations.',
  },
  {
    category: 'Getting Started',
    q: 'What is the minimum investment with Qode?',
    a: 'The minimum investment for Qode PMS is ₹50 lakhs as mandated by SEBI. This is invested directly in equities held in your own demat account.',
  },
  {
    category: 'Portfolio',
    q: 'How is NAV calculated?',
    a: 'NAV (Net Asset Value) is calculated by dividing the total market value of all securities in your portfolio by the initial investment amount, expressed as a unit value starting at 1000.',
  },
  {
    category: 'Portfolio',
    q: 'What strategies does Qode offer?',
    a: 'Qode offers four strategies: QAW (All Weather) — multi-factor balanced; QTF (Trend Following) — momentum-based; QGF (Growth Fund) — concentrated growth; QFH (Focused Hybrid) — hybrid equity-debt approach.',
  },
  {
    category: 'Portfolio',
    q: 'Can I invest in multiple strategies?',
    a: 'Yes, you can allocate capital across multiple Qode strategies. Each strategy runs independently in its own sub-account within your demat.',
  },
  {
    category: 'Fees',
    q: 'What are Qode\'s fees?',
    a: 'Qode charges a fixed management fee and a performance fee. Specific fee details are outlined in your PMS Agreement. Please refer to your agreement or contact our IR team for exact figures.',
  },
  {
    category: 'Fees',
    q: 'Are there exit charges?',
    a: 'There may be exit fees if you redeem within the minimum holding period specified in your PMS agreement. Post that period, there are no exit charges.',
  },
  {
    category: 'Operations',
    q: 'How do I add funds to my portfolio?',
    a: 'You can add funds via bank transfer (RTGS/NEFT) to Qode\'s designated account. Use the bank details available under Account Services. Contact IR to initiate the process.',
  },
  {
    category: 'Operations',
    q: 'How long does it take for funds to get invested?',
    a: 'Once funds are received and confirmed, they are typically deployed within 2–5 business days, depending on market conditions and strategy mandate.',
  },
  {
    category: 'Taxes',
    q: 'How are PMS gains taxed?',
    a: 'Gains from PMS are taxed in your hands as capital gains — short-term (STCG at 15%) for holdings under 1 year, long-term (LTCG at 10% above ₹1L) for over 1 year. Qode provides an annual tax computation statement.',
  },
];

const GLOSSARY = [
  { term: 'NAV', def: 'Net Asset Value — the per-unit value of your portfolio' },
  { term: 'CAGR', def: 'Compound Annual Growth Rate — annualised return' },
  { term: 'Drawdown', def: 'Peak-to-trough decline in portfolio value from its highest point' },
  { term: 'PMS', def: 'Portfolio Management Service — SEBI regulated investment product' },
  { term: 'SIP', def: 'Systematic Investment Plan — periodic investments at fixed intervals' },
  { term: 'SEBI', def: 'Securities and Exchange Board of India — market regulator' },
  { term: 'Inception Date', def: 'Date when your portfolio strategy was initiated' },
  { term: 'Benchmark', def: 'Reference index (Nifty 50) used to compare portfolio performance' },
];

function FAQAccordion({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  const contentHeight = useSharedValue(0);
  const [measuredHeight, setMeasuredHeight] = useState(0);

  const animStyle = useAnimatedStyle(() => ({
    height: withTiming(isOpen ? measuredHeight : 0, { duration: 200 }),
    overflow: 'hidden',
  }));

  return (
    <View style={faqStyles.item}>
      <TouchableOpacity style={faqStyles.question} onPress={onToggle} activeOpacity={0.75}>
        <Text style={faqStyles.qText}>{item.q}</Text>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={Colors.textSecondary}
          style={faqStyles.chevron}
        />
      </TouchableOpacity>
      <Animated.View style={animStyle}>
        <View
          onLayout={(e) => setMeasuredHeight(e.nativeEvent.layout.height + 16)}
          style={faqStyles.answer}
        >
          <Text style={faqStyles.aText}>{item.a}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const faqStyles = StyleSheet.create({
  item: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  question: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    gap: 10,
  },
  qText: {
    ...Typography.BodySmall,
    color: Colors.textPrimary,
    fontFamily: 'Inter_500Medium',
    flex: 1,
    lineHeight: 19,
  },
  chevron: { marginTop: 2 },
  answer: {
    paddingBottom: 14,
  },
  aText: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});

export default function FAQScreen() {
  const [search, setSearch] = useState('');
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(FAQ_DATA.map((f) => f.category)))];

  const filtered = FAQ_DATA.filter((f) => {
    const matchCat = activeCategory === 'All' || f.category === activeCategory;
    const matchSearch =
      !search.trim() ||
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>FAQs & Glossary</Text>
          <Text style={styles.subtitle}>Quick answers to common questions</Text>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search FAQs..."
            placeholderTextColor={Colors.textSecondary}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryList}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catPill, activeCategory === cat && styles.catPillActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.catPillText, activeCategory === cat && styles.catPillActiveText]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.content}>
          {/* FAQs */}
          <View style={styles.faqCard}>
            {filtered.length === 0 ? (
              <Text style={styles.emptyText}>No results found for "{search}"</Text>
            ) : (
              filtered.map((item, i) => (
                <FAQAccordion
                  key={i}
                  item={item}
                  isOpen={openIdx === i}
                  onToggle={() => setOpenIdx(openIdx === i ? null : i)}
                />
              ))
            )}
          </View>

          {/* Glossary */}
          <Text style={styles.glossaryTitle}>Glossary</Text>
          <View style={styles.glossaryCard}>
            {GLOSSARY.map((g, i) => (
              <View key={i} style={[styles.glossaryRow, i === GLOSSARY.length - 1 && styles.lastRow]}>
                <Text style={styles.glossaryTerm}>{g.term}</Text>
                <Text style={styles.glossaryDef}>{g.def}</Text>
              </View>
            ))}
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
  subtitle: { ...Typography.BodySmall, color: Colors.textSecondary, marginTop: 4 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    ...Typography.Body,
    color: Colors.textPrimary,
  },
  categoryScroll: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryList: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catPillActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  catPillText: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    fontFamily: 'Inter_500Medium',
  },
  catPillActiveText: { color: Colors.white },
  content: { padding: 16, gap: 16 },
  faqCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    ...cardShadow,
  },
  emptyText: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 24,
  },
  glossaryTitle: { ...Typography.H3, color: Colors.textPrimary },
  glossaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 32,
    ...cardShadow,
  },
  glossaryRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 3,
  },
  lastRow: { borderBottomWidth: 0 },
  glossaryTerm: {
    ...Typography.BodySmall,
    color: Colors.primaryDark,
    fontFamily: 'Inter_700Bold',
  },
  glossaryDef: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
});
